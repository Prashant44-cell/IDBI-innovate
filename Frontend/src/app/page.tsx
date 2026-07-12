"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ShieldCheck, Mail, ArrowRight, Eye, EyeOff, AlertCircle, Building2, UserPlus, LogIn } from "lucide-react";
import { setSession, getSession } from "@/lib/session";
import { registerUser, loginUser } from "@/lib/db";
import { logEvent } from "@/lib/auditLogger";
import Link from "next/link";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (searchParams.get("mode") === "register") {
      setIsRegistering(true);
    }

    const errorParam = searchParams.get("error");
    if (errorParam === "unauthorized") {
      setError("Access Denied: Unauthorized route attempt.");
      logEvent("unknown", "visitor", "UNAUTHORIZED_ROUTE_ATTEMPT", "Attempted to access restricted route without credentials");
    } else if (errorParam === "expired") {
      setError("Session expired. Please login again.");
      logEvent("unknown", "visitor", "SESSION_EXPIRED", "Session expired due to inactivity");
    }

    const session = getSession();
    if (session) {
      if (session.role === "admin") {
        router.replace("/portal");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [router, searchParams]);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (isRegistering && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    if (isRegistering) {
      const name = email.split("@")[0];
      const { success } = await registerUser(name, email, password);
      if (success) {
        setSuccess("Account created successfully! Logging you in...");
        logEvent(email, "client", "REGISTRATION_SUCCESS", "New client account created");

        setTimeout(() => {
          setSession("client", email);
          router.replace("/dashboard");
        }, 1200);
      } else {
        setError("Account with this email already exists.");
        logEvent(email, "client", "REGISTRATION_FAILED", "Attempted to register existing email");
        setLoading(false);
      }
    } else {
      const { success } = await loginUser(email, password);
      if (success) {
        setSession("client", email);
        logEvent(email, "client", "LOGIN_SUCCESS", "Logged into Client Dashboard");
        router.replace("/dashboard");
      } else {
        setError("Invalid credentials. Please check your email or password.");
        logEvent(email, "client", "LOGIN_FAILED", "Failed client login attempt");
        setLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="flex flex-col min-h-screen p-6 relative bg-background overflow-hidden">
      {/* Light Theme Ornaments */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="pt-16 pb-8 relative z-10">
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20"
          >
            <ShieldCheck className="w-8 h-8 text-white" />
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-3xl font-extrabold text-center mb-2 tracking-tight">
            {isRegistering ? "Create Account" : "Client Portal"}
          </h1>
          <p className="text-foreground/60 text-center flex items-center justify-center gap-1 text-sm font-medium">
            <Lock className="w-3.5 h-3.5 text-success" />
            Secure & Encrypted Banking
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
              type="email" 
              placeholder="Email address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-secondary/50 border border-border/60 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-foreground/40 font-medium"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
            <input 
              type={showPassword ? "text" : "password"}
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-secondary/50 border border-border/60 rounded-2xl py-4 pl-12 pr-12 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-foreground/40 font-medium"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-primary transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {!isRegistering && (
            <div className="flex justify-end">
              <button className="text-sm text-primary font-semibold hover:text-primary/80 transition-colors">
                Forgot password?
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 text-danger text-sm bg-danger/5 border border-danger/20 rounded-xl px-4 py-3 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 flex items-center gap-2 text-success text-sm bg-success/5 border border-success/20 rounded-xl px-4 py-3 font-medium">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            {success}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 disabled:opacity-70"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              {isRegistering ? "Create Account" : "Sign In"}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        <div className="mt-8 flex flex-col items-center gap-4">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError("");
              setSuccess("");
            }}
            className="text-sm text-foreground/60 font-medium hover:text-primary transition-colors"
          >
            {isRegistering ? "Already have an account? Sign in" : "New user? Create an account"}
          </button>

        </div>
      </motion.div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
