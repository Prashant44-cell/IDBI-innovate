"use client";

// Simple XOR encryption key for basic secure storage simulation
const ENCRYPTION_KEY = "idbi_innovate_secure_key_2026";

function encrypt(text: string): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
    result += String.fromCharCode(charCode);
  }
  if (typeof window !== "undefined") {
    return btoa(result);
  }
  return text;
}

function decrypt(encodedText: string): string {
  try {
    if (typeof window === "undefined") return "";
    const text = atob(encodedText);
    let result = "";
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch (e) {
    return "";
  }
}

export interface UserSession {
  role: "admin" | "client";
  user: string;
  timestamp: number;
}

const SESSION_KEY = "idbi_session_secure";

export function setSession(role: "admin" | "client", user: string): void {
  if (typeof window === "undefined") return;
  const sessionData: UserSession = {
    role,
    user,
    timestamp: Date.now(),
  };
  const encrypted = encrypt(JSON.stringify(sessionData));
  localStorage.setItem(SESSION_KEY, encrypted);
}

export function getSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  const encrypted = localStorage.getItem(SESSION_KEY);
  if (!encrypted) return null;
  
  const decrypted = decrypt(encrypted);
  if (!decrypted) return null;
  
  try {
    const session = JSON.parse(decrypted) as UserSession;
    // Check if session has expired (e.g., 30 minutes timeout)
    const SESSION_TIMEOUT = 30 * 60 * 1000;
    if (Date.now() - session.timestamp > SESSION_TIMEOUT) {
      clearSession();
      return null;
    }
    return session;
  } catch (e) {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

export function hasActiveSession(role?: "admin" | "client"): boolean {
  const session = getSession();
  if (!session) return false;
  if (role && session.role !== role) return false;
  return true;
}
