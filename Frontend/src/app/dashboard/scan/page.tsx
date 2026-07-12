"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, ShieldCheck, QrCode, CheckCircle2, AlertCircle, Lock, Wallet } from "lucide-react";
import Link from "next/link";
import { logEvent } from "@/lib/auditLogger";
import { verifyMpin, getMpinLockStatus } from "@/lib/db";
import { getSession } from "@/lib/session";

export default function ScanQR() {
  const router = useRouter();
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"amount" | "mpin" | "confirm" | "success">("amount");
  const [amount, setAmount] = useState("500");
  const [mpin, setMpin] = useState("");
  const [message, setMessage] = useState("Enter the amount to pay and confirm the merchant details.");

  useEffect(() => {
    // Skip camera permissions for mock payment flow
    setPermissionGranted(true);
    setScanning(true);
    simulateScan();
  }, []);

  const simulateScan = () => {
    setTimeout(() => {
      setScanning(false);
      setStep("amount");
      setMessage("QR detected. Review the amount and complete the payment flow.");
    }, 1500);
  };

  const handleAmountNext = () => {
    if (!amount || Number(amount) <= 0) {
      setMessage("Enter a valid amount to continue.");
      return;
    }
    setStep("mpin");
    setMessage("Enter your payment MPIN to approve this payment.");
  };

  const handleMpinSubmit = async () => {
    if (mpin.length !== 6) {
      setMessage("Enter the full 6-digit MPIN to continue.");
      return;
    }
    const session = getSession();
    const userEmail = typeof session === 'string' ? session : (session?.user || "client@example.com");

    const lockStatus = getMpinLockStatus(userEmail);
    if (lockStatus.locked) {
      const minutes = Math.ceil(lockStatus.remainingMs / 60000);
      setMessage(`Too many incorrect attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`);
      return;
    }

    const correct = await verifyMpin(userEmail, mpin);
    if (!correct) {
      const updated = getMpinLockStatus(userEmail);
      setMessage(
        updated.locked
          ? "Too many incorrect attempts. Your account is temporarily locked."
          : `Incorrect MPIN. ${updated.attemptsRemaining} attempt${updated.attemptsRemaining === 1 ? "" : "s"} remaining.`
      );
      logEvent(userEmail, "client", "MPIN_VERIFY_FAILED", "Incorrect MPIN entered during QR payment");
      return;
    }

    // Auto-proceed to payment
    setPaymentSuccess(true);
    setStep("success");
    logEvent(userEmail, "client", "QR_PAYMENT_SUCCESS", `Successfully processed mock payment of ₹${amount}.`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-white relative">
      <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-20">
        <button onClick={() => router.back()} className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Secure Payment
        </div>
      </div>

      {!permissionGranted && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <Camera className="w-10 h-10 text-primary animate-pulse" />
          </div>
          <h2 className="text-xl font-bold mb-2">Initializing Scanner</h2>
          <p className="text-white/60 text-sm">Please wait while we prepare the QR scanner...</p>
        </div>
      )}

      {permissionGranted && scanning && (
        <div className="flex-1 relative flex items-center justify-center">
          {/* Mock Camera Feed Background */}
          <div className="absolute inset-0 bg-slate-800 animate-pulse" />
          
          {/* Scanner Overlay */}
          <div className="relative z-10 w-64 h-64 border-2 border-white/20 rounded-[2rem] overflow-hidden">
            <div className="absolute inset-0 border-4 border-primary rounded-[2rem] shadow-[0_0_20px_rgba(13,148,136,0.5)]" />
            <motion.div 
              initial={{ y: -250 }}
              animate={{ y: 250 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="w-full h-1 bg-primary shadow-[0_0_15px_rgba(13,148,136,1)]" 
            />
          </div>
          <div className="absolute bottom-32 text-center w-full z-10">
            <p className="font-semibold text-white tracking-wider animate-pulse">Scanning QR Code...</p>
            <p className="text-xs text-white/50 mt-2">Align the QR code within the frame</p>
          </div>
        </div>
      )}

      {permissionGranted && !paymentSuccess && !scanning && (
        <div className="flex-1 bg-slate-950/95 flex items-center justify-center p-6 z-20">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-4">
              <QrCode className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">Secure QR Payment</h2>
            </div>
            <p className="text-sm text-white/70 mb-4">{message}</p>

            {step === "amount" && (
              <div className="space-y-3">
                <div className="rounded-2xl bg-white/10 p-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-white/60">Amount</label>
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/70 px-3 py-3">
                    <Wallet className="w-4 h-4 text-primary" />
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-transparent text-white outline-none" placeholder="Enter amount" />
                  </div>
                </div>
                <button onClick={handleAmountNext} className="w-full rounded-2xl bg-primary px-4 py-3 font-semibold text-white">Continue</button>
              </div>
            )}

            {step === "mpin" && (
              <div className="space-y-3">
                <div className="rounded-2xl bg-white/10 p-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-white/60">Payment MPIN</label>
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/70 px-3 py-3">
                    <Lock className="w-4 h-4 text-primary" />
                    <input type="password" inputMode="numeric" maxLength={6} value={mpin} onChange={(e) => setMpin(e.target.value.replace(/\D/g, ""))} className="w-full bg-transparent text-white outline-none" placeholder="Enter 6-digit PIN" />
                  </div>
                </div>
                <button onClick={handleMpinSubmit} className="w-full rounded-2xl bg-primary px-4 py-3 font-semibold text-white">Verify MPIN</button>
              </div>
            )}


          </div>
        </div>
      )}

      {permissionGranted && paymentSuccess && (
        <div className="flex-1 bg-emerald-500 flex flex-col items-center justify-center text-center p-6 z-20">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 20 }}
            className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl"
          >
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-white mb-2"
          >
            Payment Successful!
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-emerald-100 font-medium mb-8"
          >
            ₹500.00 paid securely.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link href="/dashboard" className="px-8 py-3 bg-white text-emerald-600 font-bold rounded-2xl shadow-lg hover:bg-emerald-50 transition-colors">
              Return to Dashboard
            </Link>
          </motion.div>
        </div>
      )}
    </div>
  );
}
