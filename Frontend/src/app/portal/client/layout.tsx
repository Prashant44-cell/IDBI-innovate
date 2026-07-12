"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";
import { logEvent } from "@/lib/auditLogger";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "admin") {
      logEvent(
        session?.user || "anonymous",
        session?.role || "unknown",
        "SECURITY_VIOLATION",
        "Attempted to access Client Portal Sim without admin session"
      );
      router.push("/?error=unauthorized");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-background">
      {/* Client layout shell */}
      {children}
    </div>
  );
}
