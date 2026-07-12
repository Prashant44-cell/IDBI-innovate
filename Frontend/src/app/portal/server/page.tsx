"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, clearSession } from "@/lib/session";
import { getAuditLogs, clearAuditLogs, logEvent, AuditLog } from "@/lib/auditLogger";
import { ArrowLeft, Trash2, Shield, Key, Eye, EyeOff, UserCheck, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function ServerAdminPortal() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [showCreds, setShowCreds] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "admin") {
      logEvent(
        session?.user || "anonymous",
        session?.role || "unknown",
        "SECURITY_VIOLATION",
        "Attempted to access Server Admin Portal directly without admin session"
      );
      router.replace("/?error=unauthorized");
    } else {
      setAuthorized(true);
      setLogs(getAuditLogs());
    }
  }, [router]);

  const handleClearLogs = () => {
    clearAuditLogs();
    setLogs([]);
    logEvent("prashant", "admin", "AUDIT_LOGS_CLEARED", "Cleared all system audit logs");
  };

  const handleForceSessionExpiration = () => {
    // Clear session to test automatic redirect
    clearSession();
    logEvent("prashant", "admin", "SIMULATED_SESSION_EXPIRATION", "Simulated session expiration triggered by admin");
    router.replace("/?error=expired");
  };

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <Link href="/portal" className="p-3 bg-secondary hover:bg-secondary/70 border border-border rounded-2xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2 text-foreground">
              <Shield className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              Server / Admin Telemetry
            </h1>
            <p className="text-sm text-foreground/60">System events, access control, and audit logs.</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleForceSessionExpiration}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-600 rounded-xl text-sm font-semibold transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            Force Session Timeout
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 relative z-10 w-full">
        {/* Left Column - System Control & Creds */}
        <div className="space-y-6 w-full lg:w-1/3 min-w-0">
          {/* System Status */}
          <div className="bg-white border border-border p-6 rounded-3xl shadow-sm">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <UserCheck className="w-5 h-5 text-success" />
              Active System Session
            </h2>
            <div className="text-sm font-semibold space-y-3 text-foreground/70">
              <div className="flex justify-between items-center">
                <span>Current Operator:</span>
                <span className="text-foreground">prashant</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Role Permission:</span>
                <span className="text-accent uppercase font-bold text-xs bg-accent/10 border border-accent/20 px-2 py-1 rounded-md">Server Admin</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Session Status:</span>
                <span className="text-success font-bold text-xs bg-success/10 border border-success/20 px-2 py-1 rounded-md">Secure & Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Audit Log Table */}
        <div className="w-full lg:w-2/3 bg-white border border-border p-6 rounded-3xl shadow-sm flex flex-col h-[60vh] lg:h-[65vh] min-w-0">
          <div className="flex justify-between items-center mb-6 shrink-0">
            <div>
              <h2 className="text-lg font-bold">Security Audit Ledger</h2>
              <p className="text-xs text-foreground/50 mt-1 font-medium">Real-time recording of login trials and security events.</p>
            </div>
            {logs.length > 0 && (
              <button
                onClick={handleClearLogs}
                className="flex items-center gap-2 px-3 py-1.5 bg-danger/10 hover:bg-danger/20 border border-danger/30 text-danger rounded-xl text-xs font-bold transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Logs
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto border border-border/60 rounded-2xl bg-secondary/30 relative">
            {logs.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-foreground/40 text-sm font-medium">
                <Shield className="w-12 h-12 mb-3 stroke-[1.5] text-primary/30" />
                No security logs recorded yet.
              </div>
            ) : (
              <div className="min-w-full inline-block align-middle">
                <table className="min-w-full divide-y divide-border/40 text-left text-xs">
                  <thead className="bg-secondary sticky top-0 font-bold text-foreground/60 z-10">
                    <tr>
                      <th scope="col" className="px-4 py-3">Timestamp</th>
                      <th scope="col" className="px-4 py-3">User (Role)</th>
                      <th scope="col" className="px-4 py-3">Event</th>
                      <th scope="col" className="px-4 py-3 min-w-[200px]">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20 font-medium bg-white">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-secondary/50 transition-colors">
                        <td className="px-4 py-3 text-foreground/60 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-bold block text-foreground">{log.user}</span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 block ${
                            log.role === "admin" ? "text-accent" : log.role === "client" ? "text-primary" : "text-foreground/40"
                          }`}>
                            {log.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-bold">
                          <span className={`px-2 py-1 rounded-md text-[10px] border ${
                            log.event.includes("SUCCESS")
                              ? "bg-success/10 text-success border-success/20"
                              : log.event.includes("VIOLATION") || log.event.includes("FAILED")
                              ? "bg-danger/10 text-danger border-danger/20 font-bold"
                              : "bg-primary/10 text-primary border-primary/20"
                          }`}>
                            {log.event}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground/70 font-medium">
                          {log.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
