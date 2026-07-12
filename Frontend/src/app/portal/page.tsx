"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Users, LogOut, ArrowRight } from "lucide-react";
import { getSession, clearSession } from "@/lib/session";
import { logEvent } from "@/lib/auditLogger";

export default function PortalSelect() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "admin") {
      logEvent(
        session?.user || "anonymous",
        session?.role || "unknown",
        "SECURITY_VIOLATION",
        "Attempted to access Admin Portal Selection without admin session"
      );
      router.push("/?error=unauthorized");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  const handleLogout = () => {
    const session = getSession();
    logEvent(session?.user || "prashant", "admin", "LOGOUT", "Logged out from Admin Portal");
    clearSession();
    router.push("/");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background relative overflow-hidden p-6">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="absolute top-6 right-6">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-secondary/50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      <div className="text-center mb-12 relative z-10">
        <h1 className="text-4xl font-bold mb-4">Select Portal</h1>
        <p className="text-foreground/60 max-w-md mx-auto">
          Welcome back, Prashant. Please select which side of the platform you want to manage.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl relative z-10">
        {/* Client Portal Card */}
        <button
          onClick={() => router.push("/portal/client")}
          className="group text-left bg-card/60 backdrop-blur-xl border border-border rounded-3xl p-8 hover:bg-secondary/40 hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-1 shadow-xl hover:shadow-primary/20"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Client Portal</h2>
          <p className="text-foreground/60 mb-8 h-12">
            Access the customer-facing interface. Simulate transactions, goals, and portfolio viewing.
          </p>
          <div className="flex items-center text-primary font-semibold">
            Enter Portal <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Server Portal Card */}
        <button
          onClick={() => router.push("/portal/server")}
          className="group text-left bg-card/60 backdrop-blur-xl border border-border rounded-3xl p-8 hover:bg-secondary/40 hover:border-accent/50 transition-all duration-300 transform hover:-translate-y-1 shadow-xl hover:shadow-accent/20"
        >
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Building2 className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Server / Admin Portal</h2>
          <p className="text-foreground/60 mb-8 h-12">
            Access backend operations. Manage KYC approvals, branch settings, and system-wide telemetry.
          </p>
          <div className="flex items-center text-accent font-semibold">
            Enter Portal <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>
    </div>
  );
}
