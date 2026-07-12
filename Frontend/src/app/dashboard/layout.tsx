"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { getSession } from "@/lib/session";
import { logEvent } from "@/lib/auditLogger";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "client") {
      logEvent(
        session?.user || "anonymous",
        session?.role || "unknown",
        "SECURITY_VIOLATION",
        "Attempted to access Client Dashboard without valid client session"
      );
      router.replace("/?error=unauthorized");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen relative pb-24">
      {/* Dynamic background lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-accent/10 rounded-full blur-[80px] pointer-events-none -z-10" />
      
      {/* Page Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </main>

      {/* Floating Bottom Nav */}
      <BottomNav />
    </div>
  );
}
