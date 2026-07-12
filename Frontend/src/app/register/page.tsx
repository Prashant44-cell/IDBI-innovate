"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This route used to render a second, disconnected registration form that
// never persisted an account (it just faked a delay and redirected to the
// dashboard). Registration now lives in one place — the toggle on "/" —
// backed by the real, hashed user store in lib/db.ts.
export default function RegisterRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/?mode=register");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}
