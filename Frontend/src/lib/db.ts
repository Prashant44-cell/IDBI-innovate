/**
 * db.ts – Client-side mock database using localStorage
 * Handles: user auth, profiles, goals, KYC documents
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface KYCDoc {
  type: "aadhaar" | "pan" | "voter_id" | "passport" | "driving_licence";
  label: string;
  frontImage: string | null;
  backImage: string | null;
  status: "not_uploaded" | "under_review" | "verified";
  uploadedAt: string | null;
}

export interface Goal {
  id: string;
  name: string;
  category: string;
  emoji: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: string;
  color: string;
  durationMonths?: number | null;
  monthlyContribution?: number | null;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  mpinHash: string | null;
  mpinSalt: string | null;
  mpinFailedAttempts: number;
  mpinLockedUntil: number | null; // epoch ms, null when not locked
  faceRegistered: boolean;
  profileImage: string | null;
  kycDocs: KYCDoc[];
  kycStatus: "none" | "pending" | "verified";
  goals: Goal[];
  createdAt: string;
}

const MPIN_MAX_ATTEMPTS = 3;
const MPIN_LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

// ─── Hashing (SubtleCrypto SHA-256 + per-record random salt) ────────────────
// Client-side hashing is not a substitute for a real backend-verified
// credential store, but it ensures nothing sensitive is ever persisted or
// compared in plain text within localStorage.

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bufferToHex(bytes.buffer);
}

async function hashSecret(secret: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bufferToHex(digest);
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DB_KEY = "idbi_users_db";
const SESSION_KEY = "idbi_current_session";

const DEFAULT_KYC_DOCS: KYCDoc[] = [
  { type: "aadhaar",          label: "Aadhaar Card",      frontImage: null, backImage: null, status: "not_uploaded", uploadedAt: null },
  { type: "pan",              label: "PAN Card",           frontImage: null, backImage: null, status: "not_uploaded", uploadedAt: null },
  { type: "voter_id",         label: "Voter ID",           frontImage: null, backImage: null, status: "not_uploaded", uploadedAt: null },
  { type: "passport",         label: "Passport",           frontImage: null, backImage: null, status: "not_uploaded", uploadedAt: null },
  { type: "driving_licence",  label: "Driving Licence",    frontImage: null, backImage: null, status: "not_uploaded", uploadedAt: null },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAllUsers(): Record<string, UserProfile> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllUsers(users: Record<string, UserProfile>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DB_KEY, JSON.stringify(users));
}

function computeKYCStatus(docs: KYCDoc[]): "none" | "pending" | "verified" {
  const uploaded = docs.filter((d) => d.frontImage !== null);
  if (uploaded.length === 0) return "none";
  const verified = uploaded.filter((d) => d.status === "verified");
  if (verified.length >= 1) return "verified";
  return "pending";
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const users = getAllUsers();
  const key = email.toLowerCase().trim();
  if (users[key]) return { success: false, error: "Email already registered." };

  const passwordSalt = generateSalt();
  const newUser: UserProfile = {
    id: `user_${Date.now()}`,
    name: name.trim(),
    email: key,
    passwordHash: await hashSecret(password, passwordSalt),
    passwordSalt,
    mpinHash: null,
    mpinSalt: null,
    mpinFailedAttempts: 0,
    mpinLockedUntil: null,
    faceRegistered: false,
    profileImage: null,
    kycDocs: JSON.parse(JSON.stringify(DEFAULT_KYC_DOCS)),
    kycStatus: "none",
    goals: [],
    createdAt: new Date().toISOString(),
  };

  users[key] = newUser;
  saveAllUsers(users);
  return { success: true };
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const users = getAllUsers();
  const key = email.toLowerCase().trim();
  const user = users[key];
  if (!user) return { success: false, error: "No account found with this email." };
  const candidateHash = await hashSecret(password, user.passwordSalt);
  if (candidateHash !== user.passwordHash) return { success: false, error: "Incorrect password." };
  return { success: true, user };
}

export async function verifyPassword(email: string, password: string): Promise<boolean> {
  const users = getAllUsers();
  const user = users[email.toLowerCase().trim()];
  if (!user) return false;
  return (await hashSecret(password, user.passwordSalt)) === user.passwordHash;
}

// ─── Session ─────────────────────────────────────────────────────────────────

export function setSession(email: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, email.toLowerCase().trim());
}

export function getSession(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export function getProfile(email: string): UserProfile | null {
  const users = getAllUsers();
  return users[email.toLowerCase().trim()] ?? null;
}

export function updateProfile(
  email: string,
  updates: Partial<Pick<UserProfile, "name" | "profileImage" | "faceRegistered">>
): boolean {
  const users = getAllUsers();
  const key = email.toLowerCase().trim();
  if (!users[key]) return false;
  users[key] = { ...users[key], ...updates };
  saveAllUsers(users);
  return true;
}

// ─── MPIN ────────────────────────────────────────────────────────────────────

export async function setMpin(email: string, mpin: string): Promise<boolean> {
  const users = getAllUsers();
  const key = email.toLowerCase().trim();
  if (!users[key]) return false;
  const mpinSalt = generateSalt();
  users[key] = {
    ...users[key],
    mpinHash: await hashSecret(mpin, mpinSalt),
    mpinSalt,
    mpinFailedAttempts: 0,
    mpinLockedUntil: null,
  };
  saveAllUsers(users);
  return true;
}

export function hasMpin(email: string): boolean {
  return !!getProfile(email)?.mpinHash;
}

export interface MpinLockStatus {
  locked: boolean;
  remainingMs: number;
  attemptsRemaining: number;
}

export function getMpinLockStatus(email: string): MpinLockStatus {
  const profile = getProfile(email);
  const lockedUntil = profile?.mpinLockedUntil ?? null;
  const locked = !!lockedUntil && lockedUntil > Date.now();
  return {
    locked,
    remainingMs: locked ? lockedUntil! - Date.now() : 0,
    attemptsRemaining: Math.max(0, MPIN_MAX_ATTEMPTS - (profile?.mpinFailedAttempts ?? 0)),
  };
}

export async function verifyMpin(email: string, mpin: string): Promise<boolean> {
  const users = getAllUsers();
  const key = email.toLowerCase().trim();
  const profile = users[key];
  if (!profile || !profile.mpinHash || !profile.mpinSalt) return false;

  // Persisted lockout: once tripped, wrong or right PINs are rejected until it expires.
  if (profile.mpinLockedUntil && profile.mpinLockedUntil > Date.now()) {
    return false;
  }

  const candidateHash = await hashSecret(mpin, profile.mpinSalt);
  const isCorrect = candidateHash === profile.mpinHash;

  if (isCorrect) {
    profile.mpinFailedAttempts = 0;
    profile.mpinLockedUntil = null;
  } else {
    profile.mpinFailedAttempts = (profile.mpinFailedAttempts ?? 0) + 1;
    if (profile.mpinFailedAttempts >= MPIN_MAX_ATTEMPTS) {
      profile.mpinLockedUntil = Date.now() + MPIN_LOCKOUT_MS;
    }
  }
  saveAllUsers(users);
  return isCorrect;
}

// ─── Goals ───────────────────────────────────────────────────────────────────

export function getGoals(email: string): Goal[] {
  return getProfile(email)?.goals ?? [];
}

export function addGoal(email: string, goal: Omit<Goal, "id" | "createdAt">): boolean {
  const users = getAllUsers();
  const key = email.toLowerCase().trim();
  if (!users[key]) return false;
  const newGoal: Goal = {
    ...goal,
    id: `goal_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  users[key].goals = [...(users[key].goals ?? []), newGoal];
  saveAllUsers(users);
  return true;
}

export function updateGoal(email: string, goalId: string, updates: Partial<Goal>): boolean {
  const users = getAllUsers();
  const key = email.toLowerCase().trim();
  if (!users[key]) return false;
  users[key].goals = users[key].goals.map((g) =>
    g.id === goalId ? { ...g, ...updates } : g
  );
  saveAllUsers(users);
  return true;
}

export function deleteGoal(email: string, goalId: string): boolean {
  const users = getAllUsers();
  const key = email.toLowerCase().trim();
  if (!users[key]) return false;
  users[key].goals = users[key].goals.filter((g) => g.id !== goalId);
  saveAllUsers(users);
  return true;
}

// ─── KYC ─────────────────────────────────────────────────────────────────────

export function getKYCDocs(email: string): KYCDoc[] {
  return getProfile(email)?.kycDocs ?? JSON.parse(JSON.stringify(DEFAULT_KYC_DOCS));
}

export function updateKYCDoc(
  email: string,
  docType: KYCDoc["type"],
  update: Partial<Pick<KYCDoc, "frontImage" | "backImage" | "status">>
): boolean {
  const users = getAllUsers();
  const key = email.toLowerCase().trim();
  if (!users[key]) return false;

  users[key].kycDocs = users[key].kycDocs.map((doc) => {
    if (doc.type !== docType) return doc;
    const updated: KYCDoc = {
      ...doc,
      ...update,
      uploadedAt: new Date().toISOString(),
      status: doc.status === "not_uploaded" ? "under_review" : doc.status,
    };
    if (update.status) updated.status = update.status;
    if (update.frontImage && doc.status === "not_uploaded") updated.status = "under_review";
    return updated;
  });

  // Recompute overall KYC status
  users[key].kycStatus = computeKYCStatus(users[key].kycDocs);
  saveAllUsers(users);
  return true;
}

// ─── Seed demo user (for first-time visitors) ───────────────────────────────

export async function seedDemoUser() {
  const users = getAllUsers();
  const key = "bibek@example.com";
  if (users[key]) return; // already seeded

  const demoGoals: Goal[] = [
    { id: "g1", name: "Dream Home 🏡",      category: "Housing",    emoji: "🏡", targetAmount: 5000000, savedAmount: 1850000, targetDate: "2028-12", color: "#3b82f6", createdAt: new Date().toISOString() },
    { id: "g2", name: "Emergency Fund 🛡️",  category: "Savings",    emoji: "🛡️", targetAmount: 300000,  savedAmount: 264000,  targetDate: "2025-06", color: "#10b981", createdAt: new Date().toISOString() },
    { id: "g3", name: "Europe Trip ✈️",     category: "Travel",     emoji: "✈️", targetAmount: 200000,  savedAmount: 72000,   targetDate: "2026-12", color: "#8b5cf6", createdAt: new Date().toISOString() },
    { id: "g4", name: "New Car 🚗",          category: "Lifestyle",  emoji: "🚗", targetAmount: 800000,  savedAmount: 120000,  targetDate: "2027-03", color: "#f59e0b", createdAt: new Date().toISOString() },
  ];

  const demoDocs: KYCDoc[] = JSON.parse(JSON.stringify(DEFAULT_KYC_DOCS));
  demoDocs[0].status = "verified";
  demoDocs[0].frontImage = "demo";
  demoDocs[0].uploadedAt = new Date().toISOString();
  demoDocs[1].status = "verified";
  demoDocs[1].frontImage = "demo";
  demoDocs[1].uploadedAt = new Date().toISOString();

  const passwordSalt = generateSalt();
  const mpinSalt = generateSalt();
  users[key] = {
    id: "user_demo",
    name: "Bibek",
    email: key,
    passwordHash: await hashSecret("password123", passwordSalt),
    passwordSalt,
    mpinHash: await hashSecret("123456", mpinSalt),
    mpinSalt,
    mpinFailedAttempts: 0,
    mpinLockedUntil: null,
    faceRegistered: true,
    profileImage: null,
    kycDocs: demoDocs,
    kycStatus: "verified",
    goals: demoGoals,
    createdAt: new Date().toISOString(),
  };
  saveAllUsers(users);
}
