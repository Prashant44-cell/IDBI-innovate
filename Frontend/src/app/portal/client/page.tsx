"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";
import { logEvent } from "@/lib/auditLogger";
import { ArrowLeft, Users, FileText, CheckCircle2, XCircle, Clock } from "lucide-react";
import Link from "next/link";

interface KYCRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
}

export default function ClientPortalSimulator() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [kycRequests, setKycRequests] = useState<KYCRequest[]>([
    { id: "kyc_01", name: "Bibek Saha", email: "bibek@example.com", phone: "+91 98765 43210", status: "pending", submittedAt: "2026-07-06T12:00:00Z" },
    { id: "kyc_02", name: "Arjun Mehta", email: "arjun.mehta@example.com", phone: "+91 91234 56780", status: "pending", submittedAt: "2026-07-06T14:30:00Z" },
    { id: "kyc_03", name: "Priya Sharma", email: "priya.sharma@example.com", phone: "+91 98888 77777", status: "approved", submittedAt: "2026-07-05T09:15:00Z" },
  ]);

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "admin") {
      logEvent(
        session?.user || "anonymous",
        session?.role || "unknown",
        "SECURITY_VIOLATION",
        "Attempted to access Client Simulation Portal directly without admin session"
      );
      router.replace("/?error=unauthorized");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  const handleApproveKYC = (id: string, name: string) => {
    setKycRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: "approved" as const } : req))
    );
    logEvent("prashant", "admin", "KYC_APPROVED", `Approved digital KYC application for user: ${name}`);
  };

  const handleRejectKYC = (id: string, name: string) => {
    setKycRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: "rejected" as const } : req))
    );
    logEvent("prashant", "admin", "KYC_REJECTED", `Rejected digital KYC application for user: ${name}`);
  };

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b13] text-foreground p-6 md:p-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <Link href="/portal" className="p-3 bg-secondary/40 hover:bg-secondary/70 border border-border rounded-2xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-2">
              <Users className="w-8 h-8 text-primary" />
              Client Operations Portal
            </h1>
            <p className="text-sm text-foreground/60">Simulate customer actions, approve KYC documents, and audit ledgers.</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 gap-8 relative z-10">
        {/* KYC Verification Queue */}
        <div className="glass border border-border p-6 rounded-3xl shadow-xl">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
            <FileText className="w-5 h-5 text-primary" />
            Digital KYC Approval Queue
          </h2>

          <div className="overflow-x-auto rounded-2xl border border-border/40 bg-secondary/10">
            <table className="min-w-full divide-y divide-border/20 text-left text-xs">
              <thead className="bg-slate-900/60 font-bold text-foreground/50">
                <tr>
                  <th className="px-6 py-4">Client Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Submitted At</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10 font-medium">
                {kycRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-sm text-white">{req.name}</td>
                    <td className="px-6 py-4 text-foreground/70">{req.email}</td>
                    <td className="px-6 py-4 text-foreground/70">{req.phone}</td>
                    <td className="px-6 py-4 text-foreground/50">
                      {new Date(req.submittedAt).toLocaleDateString()} {new Date(req.submittedAt).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit ${
                        req.status === "approved"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : req.status === "rejected"
                          ? "bg-rose-500/10 text-rose-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {req.status === "approved" && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {req.status === "rejected" && <XCircle className="w-3.5 h-3.5" />}
                        {req.status === "pending" && <Clock className="w-3.5 h-3.5" />}
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {req.status === "pending" ? (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleApproveKYC(req.id, req.name)}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectKYC(req.id, req.name)}
                            className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-foreground/40 font-bold uppercase">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
