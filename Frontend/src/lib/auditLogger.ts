"use client";

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  event: string;
  description: string;
  role: string;
}

const AUDIT_LOGS_KEY = "idbi_audit_logs";

export function logEvent(user: string, role: string, event: string, description: string): void {
  if (typeof window === "undefined") return;
  
  const newLog: AuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    user,
    role,
    event,
    description,
  };

  try {
    const existing = localStorage.getItem(AUDIT_LOGS_KEY);
    const logs: AuditLog[] = existing ? JSON.parse(existing) : [];
    logs.unshift(newLog); // Newest first
    
    // Keep max 200 logs to prevent storage bloat
    if (logs.length > 200) {
      logs.pop();
    }
    
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error("Failed to write audit log:", e);
  }
}

export function getAuditLogs(): AuditLog[] {
  if (typeof window === "undefined") return [];
  try {
    const existing = localStorage.getItem(AUDIT_LOGS_KEY);
    return existing ? JSON.parse(existing) : [];
  } catch (e) {
    return [];
  }
}

export function clearAuditLogs(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUDIT_LOGS_KEY);
}
