/* eslint-disable */
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, Delete, AlertCircle, Lock } from "lucide-react";

interface MPINVerifyProps {
  onSuccess: () => void;
  onCancel: () => void;
  verifyFn: (mpin: string) => boolean | Promise<boolean>;
  paymentInfo?: {
    merchant: string;
    amount: number;
    upiId: string;
  };
}

const KEYS = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

export default function MPINVerify({ onSuccess, onCancel, verifyFn, paymentInfo }: MPINVerifyProps) {
  const [digits, setDigits] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);

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
      setTimeout(async () => {
        const mpin = next.join("");
        const isCorrect = await verifyFn(mpin);
        if (isCorrect) {
          onSuccess();
        } else {
          setAttempts((prev) => {
            const newAttempts = prev + 1;
            if (newAttempts >= 3) {
              setError("Wrong MPIN. 0 attempts remaining. Account may be locked.");
            } else {
              setError("Incorrect MPIN. Please try again.");
            }
            return newAttempts;
          });
          setShake(true);
          setTimeout(() => { setShake(false); setDigits([]); }, 600);
        }
      }, 180);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 120, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="w-full max-w-sm bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-base">Enter MPIN</h2>
              <p className="text-xs text-foreground/50">Authorize this payment</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X className="w-5 h-5 text-foreground/60" />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-5">
          {/* Payment summary */}
          {paymentInfo && (
            <div className="w-full bg-secondary/20 border border-border/50 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground/50">Paying to</p>
                <p className="font-bold text-sm">{paymentInfo.merchant}</p>
                <p className="text-xs text-foreground/40 font-mono mt-0.5">{paymentInfo.upiId}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  ₹{paymentInfo.amount.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          )}

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
                className="flex items-center gap-2 text-danger text-sm bg-danger/10 border border-danger/30 rounded-xl px-4 py-2 w-full"
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

          <p className="text-xs text-foreground/40 text-center">
            🔐 Your MPIN is encrypted and never stored in plain text
          </p>
        </div>
      </motion.div>
    </div>
  );
}
