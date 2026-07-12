/* eslint-disable */
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Delete, CheckCircle, AlertCircle } from "lucide-react";

interface MPINSetupProps {
  onSuccess: (mpin: string) => void;
  onSkip?: () => void;
  mode?: "create" | "confirm";
  mpinToConfirm?: string;
}

const KEYS = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

export default function MPINSetup({ onSuccess, onSkip, mode = "create", mpinToConfirm }: MPINSetupProps) {
  const [digits, setDigits] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const handleKey = (key: string) => {
    setError("");
    if (key === "⌫") {
      setDigits((d) => d.slice(0, -1));
      return;
    }
    if (digits.length >= 6) return;
    const next = [...digits, key];
    setDigits(next);

    if (next.length === 6) {
      // auto-validate
      setTimeout(() => {
        if (mode === "confirm") {
          if (next.join("") !== mpinToConfirm) {
            setShake(true);
            setTimeout(() => { setShake(false); setDigits([]); }, 600);
            setError("PINs do not match. Try again.");
          } else {
            onSuccess(next.join(""));
          }
        } else {
          onSuccess(next.join(""));
        }
      }, 180);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Title */}
      <div className="text-center">
        <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 mx-auto mb-4">
          <ShieldCheck className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-bold">
          {mode === "create" ? "Set Payment MPIN" : "Confirm MPIN"}
        </h2>
        <p className="text-sm text-foreground/60 mt-1">
          {mode === "create"
            ? "Create a secure 6-digit PIN for payments"
            : "Re-enter your 6-digit PIN to confirm"}
        </p>
      </div>

      {/* Dot indicators */}
      <motion.div
        animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-4"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              scale: i === digits.length - 1 ? [1, 1.3, 1] : 1,
            }}
            transition={{ duration: 0.15 }}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
              i < digits.length
                ? "bg-primary border-primary shadow-[0_0_12px_rgba(59,130,246,0.6)]"
                : "border-border bg-transparent"
            }`}
          />
        ))}
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-danger text-sm bg-danger/10 border border-danger/30 rounded-xl px-4 py-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
        {KEYS.map((key, idx) => {
          if (key === "") return <div key={idx} />;
          return (
            <motion.button
              key={idx}
              whileTap={{ scale: 0.88 }}
              onClick={() => handleKey(key)}
              disabled={key !== "⌫" && digits.length >= 6}
              className={`h-14 rounded-2xl flex items-center justify-center text-xl font-bold transition-colors
                ${key === "⌫"
                  ? "bg-secondary/40 hover:bg-secondary/70 text-foreground/70"
                  : "bg-secondary/30 hover:bg-secondary/60 border border-border/50 text-foreground"}
              `}
            >
              {key === "⌫" ? <Delete className="w-5 h-5" /> : key}
            </motion.button>
          );
        })}
      </div>

      {/* Skip button */}
      {onSkip && mode === "create" && (
        <button
          onClick={onSkip}
          className="text-sm text-foreground/40 hover:text-foreground/70 transition-colors mt-1"
        >
          Skip for now
        </button>
      )}
    </div>
  );
}
