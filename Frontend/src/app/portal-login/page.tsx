"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Mail, ArrowRight, Eye, EyeOff, AlertCircle, Building2, Server } from "lucide-react";
import { setSession, getSession } from "@/lib/session";
import { logEvent } from "@/lib/auditLogger";
import Link from "next/link";

function ServerLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "unauthorized") {
      setError("Access Denied: Admin credentials required.");
    }
  }, [searchParams]);

  const handleLogin = () => {
    setLoading(true);
    setError("");
    
    setTimeout(() => {
      if (username === "prashant" && password === "1222333") {
        setSession("admin", "prashant");
        logEvent("prashant", "admin", "LOGIN_SUCCESS", "Logged into Server Mode (Admin Portal)");
        router.replace("/portal");
      } else {
        setError("Invalid server-admin credentials");
        logEvent(username, "admin", "LOGIN_FAILED", "Failed server login attempt");
        setLoading(false);
      }
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="flex flex-col min-h-screen p-6 relative bg-background overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="pt-16 pb-8 relative z-10">
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-16 h-16 bg-gradient-to-br from-secondary to-slate-800 rounded-2xl flex items-center justify-center shadow-lg border border-border"
          >
            <Server className="w-8 h-8 text-accent" />
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-3xl font-extrabold text-center mb-2 tracking-tight">
            Server Portal
          </h1>
          <p className="text-foreground/60 text-center flex items-center justify-center gap-1 text-sm font-medium">
            <Building2 className="w-4 h-4 text-accent" />
            Internal Administrative Access
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex-1 max-w-md w-full mx-auto glass p-8 rounded-[2rem] z-10 border border-border shadow-2xl"
      >
        <div className="space-y-4 mb-8">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
            <input 
              type="text" 
              placeholder="Enter admin username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="username"
              className="w-full bg-secondary/50 border border-border/60 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all font-medium placeholder:text-foreground/30"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
            <input 
              type={showPassword ? "text" : "password"}
              placeholder="Enter admin password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="current-password"
              className="w-full bg-secondary/50 border border-border/60 rounded-2xl py-4 pl-12 pr-12 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all font-medium placeholder:text-foreground/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-accent transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 text-danger text-sm bg-danger/5 border border-danger/20 rounded-xl px-4 py-3 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold text-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-lg disabled:opacity-70 border border-slate-700"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Authorize Access
              <ArrowRight className="w-5 h-5 text-accent" />
            </>
          )}
        </button>

        <div className="mt-8 flex flex-col items-center gap-4">
          <Link href="/" className="text-sm text-foreground/60 font-medium hover:text-primary transition-colors">
            Return to Client Portal
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function ServerLogin() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" /></div>}>
      <ServerLoginContent />
    </Suspense>
  );
}
