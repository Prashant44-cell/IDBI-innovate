/**
 * api.ts – HTTP client for the FastAPI Backend
 * Falls back to mock data when backend is unavailable (DEMO MODE)
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Token storage ────────────────────────────────────────────────────────────
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("idbi_token");
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> ?? {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "API Error");
  }
  return res.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ access_token: string; token_type: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (name: string, email: string, password: string) =>
    apiFetch<{ id: string; email: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),
  me: () => apiFetch<{ id: string; name: string; email: string }>("/auth/me"),
};

// ─── Accounts ─────────────────────────────────────────────────────────────────
export const accountsApi = {
  getAll: (userId: string) =>
    apiFetch<AccountData[]>(`/accounts/${userId}`),
  getBalance: (accountId: string) =>
    apiFetch<{ balance: number; available: number }>(`/accounts/${accountId}/balance`),
  getStatement: (accountId: string, page = 1) =>
    apiFetch<TransactionData[]>(`/accounts/${accountId}/statement?page=${page}`),
};

// ─── Transactions ─────────────────────────────────────────────────────────────
export const transactionsApi = {
  deposit: (accountId: string, amount: number, description: string) =>
    apiFetch<TransactionData>("/transactions/deposit", {
      method: "POST",
      body: JSON.stringify({ account_id: accountId, amount, description }),
    }),
  withdraw: (accountId: string, amount: number, description: string) =>
    apiFetch<TransactionData>("/transactions/withdraw", {
      method: "POST",
      body: JSON.stringify({ account_id: accountId, amount, description }),
    }),
  transfer: (fromAccount: string, toAccount: string, amount: number, description: string) =>
    apiFetch<{ debit: TransactionData; credit: TransactionData }>("/transactions/transfer", {
      method: "POST",
      body: JSON.stringify({ from_account_id: fromAccount, to_account_id: toAccount, amount, description }),
    }),
  list: (accountId: string, page = 1, limit = 20) =>
    apiFetch<TransactionData[]>(`/transactions/${accountId}?page=${page}&limit=${limit}`),
};

// ─── UPI ──────────────────────────────────────────────────────────────────────
export const upiApi = {
  getIds: (userId: string) => apiFetch<UPIIdData[]>(`/upi/ids/${userId}`),
  addId: (userId: string, vpa: string, linkedAccountId: string) =>
    apiFetch<UPIIdData>("/upi/ids", { method: "POST", body: JSON.stringify({ user_id: userId, vpa, linked_account_id: linkedAccountId }) }),
  pay: (fromVpa: string, toVpa: string, amount: number, note: string) =>
    apiFetch<TransactionData>("/upi/pay", {
      method: "POST",
      body: JSON.stringify({ from_vpa: fromVpa, to_vpa: toVpa, amount, note }),
    }),
};

// ─── Bills ────────────────────────────────────────────────────────────────────
export const billsApi = {
  list: (userId: string) => apiFetch<BillData[]>(`/bills/${userId}`),
  pay: (billId: string, amount: number) =>
    apiFetch<{ success: boolean; reference: string }>("/bills/pay", {
      method: "POST",
      body: JSON.stringify({ bill_id: billId, amount }),
    }),
  add: (userId: string, biller: Partial<BillData>) =>
    apiFetch<BillData>("/bills/add", { method: "POST", body: JSON.stringify({ user_id: userId, ...biller }) }),
};

// ─── KYC ──────────────────────────────────────────────────────────────────────
export const kycApi = {
  status: (userId: string) => apiFetch<KYCStatusData>(`/kyc/status/${userId}`),
  upload: (formData: FormData) =>
    fetch(`${BASE_URL}/kyc/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken() ?? ""}` },
      body: formData,
    }).then((r) => r.json()),
};

// ─── Analytics ───────────────────────────────────────────────────────────────
export const analyticsApi = {
  spending: (userId: string, days = 30) =>
    apiFetch<SpendingData>(`/analytics/spending/${userId}?days=${days}`),
  trends: (userId: string, months = 6) =>
    apiFetch<TrendData[]>(`/analytics/trends/${userId}?months=${months}`),
  predict: (userId: string) =>
    apiFetch<PredictionData>(`/analytics/predict/${userId}`),
  behavior: (userId: string) =>
    apiFetch<BehaviorData>(`/analytics/behavior/${userId}`),
};

// ─── Loyalty ──────────────────────────────────────────────────────────────────
export const loyaltyApi = {
  get: (userId: string) => apiFetch<LoyaltyData>(`/loyalty/${userId}`),
  redeem: (userId: string, points: number, rewardId: string) =>
    apiFetch<{ success: boolean; remaining: number }>("/loyalty/redeem", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, points, reward_id: rewardId }),
    }),
  history: (userId: string) => apiFetch<LoyaltyEvent[]>(`/loyalty/history/${userId}`),
};

// ─── Survey ───────────────────────────────────────────────────────────────────
export const surveyApi = {
  submit: (userId: string, nps: number, csat: number, feedback: string, category: string) =>
    apiFetch<{ success: boolean }>("/survey/submit", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, nps_score: nps, csat_score: csat, feedback, service_category: category }),
    }),
  results: () => apiFetch<SurveyResults>("/survey/results"),
};

// ─── Security ─────────────────────────────────────────────────────────────────
export const securityApi = {
  events: (userId: string) => apiFetch<SecurityEvent[]>(`/security/events/${userId}`),
  sessions: (userId: string) => apiFetch<SessionData[]>(`/security/sessions/${userId}`),
};

// ─── Power BI ─────────────────────────────────────────────────────────────────
export const powerbiApi = {
  embedConfig: () => apiFetch<PowerBIEmbedConfig>("/powerbi/embed-config"),
  pushEvent: (eventType: string, payload: Record<string, unknown>) =>
    apiFetch<{ success: boolean }>("/powerbi/push-event", {
      method: "POST",
      body: JSON.stringify({ event_type: eventType, payload }),
    }),
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AccountData {
  id: string;
  account_number: string;
  account_type: "savings" | "current" | "fd" | "rd";
  balance: number;
  available_balance: number;
  branch_code: string;
  ifsc_code: string;
  status: "active" | "dormant" | "frozen";
}

export interface TransactionData {
  id: string;
  type: "credit" | "debit";
  amount: number;
  balance_after: number;
  description: string;
  category: string;
  reference_number: string;
  status: "success" | "pending" | "failed";
  channel: string;
  created_at: string;
}

export interface UPIIdData {
  id: string;
  vpa: string;
  is_primary: boolean;
  is_active: boolean;
}

export interface BillData {
  id: string;
  biller_name: string;
  biller_category: string;
  consumer_number: string;
  amount: number;
  due_date: string;
  status: "pending" | "paid" | "overdue";
  auto_pay: boolean;
}

export interface KYCStatusData {
  overall_status: string;
  docs: { type: string; label: string; status: string }[];
}

export interface SpendingData {
  by_category: Record<string, number>;
  total: number;
  top_merchant: string;
}

export interface TrendData {
  month: string;
  income: number;
  expense: number;
  savings: number;
}

export interface PredictionData {
  churn_risk: number;
  recommendations: string[];
  next_best_action: string;
}

export interface BehaviorData {
  profile: "Conservative" | "Moderate" | "Aggressive";
  risk_score: number;
  engagement_score: number;
}

export interface LoyaltyData {
  total_points: number;
  tier: "Silver" | "Gold" | "Platinum";
  points_to_next_tier: number;
  tier_expiry: string;
}

export interface LoyaltyEvent {
  id: string;
  event_type: "earned" | "redeemed" | "expired";
  points: number;
  description: string;
  created_at: string;
}

export interface SurveyResults {
  nps_score: number;
  csat_avg: number;
  response_count: number;
  trend: { month: string; nps: number; csat: number }[];
}

export interface SecurityEvent {
  id: string;
  event_type: string;
  ip_address: string;
  device_info: string;
  location: string;
  created_at: string;
}

export interface SessionData {
  id: string;
  device: string;
  location: string;
  last_active: string;
  is_current: boolean;
}

export interface PowerBIEmbedConfig {
  embed_token: string;
  embed_url: string;
  report_id: string;
  token_expiry: string;
  is_demo: boolean;
}
