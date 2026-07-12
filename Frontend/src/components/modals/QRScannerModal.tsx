/* eslint-disable */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, QrCode, Camera, Upload, CheckCircle, AlertCircle,
  Zap, FlipHorizontal, Lock, Delete,
} from "lucide-react";

interface QRScannerModalProps {
  onClose: () => void;
  userEmail?: string;
  verifyMpinFn?: (mpin: string) => boolean | Promise<boolean>;
  hasMpin?: boolean;
}

const MOCK_QR_RESULTS = [
  { merchant: "BigBazaar", upiId: "bigbazaar@icici", amount: 1249, category: "Grocery" },
  { merchant: "Zomato Pay", upiId: "zomato@kotak", amount: 380, category: "Food" },
  { merchant: "Shell Petrol", upiId: "shell@hdfc", amount: 2100, category: "Fuel" },
  { merchant: "Apollo Pharmacy", upiId: "apollo@sbi", amount: 560, category: "Healthcare" },
];

const MPIN_KEYS = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

// ─── MPIN Overlay (inline, no extra modal layer) ──────────────────────────────
function MPINOverlay({
  paymentInfo,
  verifyFn,
  onSuccess,
  onCancel,
}: {
  paymentInfo: { merchant: string; amount: number; upiId: string };
  verifyFn: (mpin: string) => boolean | Promise<boolean>;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [digits, setDigits] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleKey = (key: string) => {
    setError("");
    if (key === "⌫") { setDigits((d) => d.slice(0, -1)); return; }
    if (digits.length >= 6) return;
    const next = [...digits, key];
    setDigits(next);
    if (next.length === 6) {
      setTimeout(async () => {
        const isCorrect = await verifyFn(next.join(""));
        if (isCorrect) {
          onSuccess();
        } else {
          const newAtt = attempts + 1;
          setAttempts(newAtt);
          setShake(true);
          setTimeout(() => { setShake(false); setDigits([]); }, 600);
          setError(newAtt >= 3
            ? "Too many wrong attempts. Try again later."
            : "Incorrect MPIN. Please try again.");
        }
      }, 180);
    }
  };

  return (
    <motion.div
      key="mpin"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2 w-full mb-1">
        <button onClick={onCancel} className="p-1.5 hover:bg-secondary rounded-full transition-colors">
          <X className="w-4 h-4 text-foreground/60" />
        </button>
        <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
          <Lock className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="font-bold text-sm">Enter MPIN</p>
          <p className="text-xs text-foreground/50">Authorize this payment</p>
        </div>
      </div>

      {/* Payment summary chip */}
      <div className="w-full bg-secondary/20 border border-border/50 rounded-2xl p-3 flex items-center justify-between">
        <div>
          <p className="font-bold text-sm">{paymentInfo.merchant}</p>
          <p className="text-xs text-foreground/40 font-mono">{paymentInfo.upiId}</p>
        </div>
        <p className="text-xl font-bold text-primary">
          ₹{paymentInfo.amount.toLocaleString("en-IN")}
        </p>
      </div>

      {/* Dot indicators */}
      <motion.div
        animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{ scale: i === digits.length - 1 ? [1, 1.3, 1] : 1 }}
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
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-danger text-xs bg-danger/10 border border-danger/30 rounded-xl px-3 py-2 w-full"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2.5 w-full max-w-[270px]">
        {MPIN_KEYS.map((key, idx) => {
          if (key === "") return <div key={idx} />;
          return (
            <motion.button
              key={idx}
              whileTap={{ scale: 0.88 }}
              onClick={() => handleKey(key)}
              disabled={key !== "⌫" && digits.length >= 6}
              className={`h-12 rounded-2xl flex items-center justify-center text-lg font-bold transition-colors
                ${key === "⌫"
                  ? "bg-secondary/40 hover:bg-secondary/70 text-foreground/70"
                  : "bg-secondary/30 hover:bg-secondary/60 border border-border/50 text-foreground"}`}
            >
              {key === "⌫" ? <Delete className="w-4 h-4" /> : key}
            </motion.button>
          );
        })}
      </div>

      <p className="text-[11px] text-foreground/40 text-center">
        🔐 MPIN secured — never shared with merchants
      </p>
    </motion.div>
  );
}

// ─── Main QRScannerModal ──────────────────────────────────────────────────────
export default function QRScannerModal({
  onClose,
  userEmail,
  verifyMpinFn,
  hasMpin = false,
}: QRScannerModalProps) {
  type Phase = "scanning" | "detected" | "mpin" | "confirm" | "success";
  const [phase, setPhase] = useState<Phase>("scanning");
  const [scanProgress, setScanProgress] = useState(0);
  const [mockResult] = useState(() => MOCK_QR_RESULTS[Math.floor(Math.random() * MOCK_QR_RESULTS.length)]);
  const [customAmount, setCustomAmount] = useState(mockResult.amount.toString());
  const [recipientNumber, setRecipientNumber] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const intervalRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanTimerRef = useRef<any>(null);

  // ── Camera helpers ──────────────────────────────────────────────────────────
  const startCamera = useCallback(async (facing: "environment" | "user" = "environment") => {
    try {
      // Stop any existing stream
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        setCameraStream(null);
      }
      setCameraError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setCameraStream(stream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      // Simulate QR detection after 2.5s of camera being open
      scanTimerRef.current = setTimeout(() => {
        stopCamera();
        setPhase("detected");
      }, 3000);
    } catch (err: any) {
      setCameraError(
        err?.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access."
          : err?.name === "NotFoundError"
          ? "No camera found on this device."
          : "Camera unavailable. Using simulation mode."
      );
      setCameraActive(false);
      // Fallback: start simulated scan
      startSimulatedScan();
    }
  }, [cameraStream]);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    clearTimeout(scanTimerRef.current);
    setCameraActive(false);
  }, [cameraStream]);

  const startSimulatedScan = () => {
    clearInterval(intervalRef.current);
    setScanProgress(0);
    intervalRef.current = setInterval(() => {
      setScanProgress((p) => {
        if (p >= 100) {
          clearInterval(intervalRef.current);
          setTimeout(() => setPhase("detected"), 200);
          return 100;
        }
        return p + 4;
      });
    }, 80);
  };

  // Attach stream to video element when both are ready
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraStream]);

  // Start scanning on mount
  useEffect(() => {
    startCamera(facingMode);
    return () => {
      stopCamera();
      clearInterval(intervalRef.current);
      clearTimeout(scanTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flipCamera = async () => {
    clearTimeout(scanTimerRef.current);
    const newFacing = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newFacing);
    await startCamera(newFacing);
  };

  // ── Payment flow ────────────────────────────────────────────────────────────
  const handleProceedToPay = () => {
    // If user has MPIN, ask for it before confirming
    if (hasMpin && verifyMpinFn) {
      setPhase("mpin");
    } else {
      setPhase("confirm");
    }
  };

  const handleMpinSuccess = () => {
    setPhase("success");
  };

  const handlePay = () => {
    setPhase("success");
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={onClose}
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
              <QrCode className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-base">Scan &amp; Pay</h2>
              <p className="text-xs text-foreground/50">
                {phase === "scanning" ? "Point camera at any UPI QR code" :
                 phase === "detected" ? "QR code detected!" :
                 phase === "mpin"     ? "Enter payment PIN" :
                 phase === "confirm"  ? "Review payment" : "Payment complete"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X className="w-5 h-5 text-foreground/60" />
          </button>
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">

            {/* ── Scanning Phase ── */}
            {phase === "scanning" && (
              <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">

                {/* Camera / viewfinder */}
                <div className="relative w-56 h-56 bg-black rounded-2xl overflow-hidden border border-border shadow-inner">
                  {cameraActive ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      {/* Flip button */}
                      <button
                        onClick={flipCamera}
                        className="absolute top-2 right-2 z-10 p-1.5 bg-black/50 backdrop-blur-sm rounded-lg border border-white/20 text-white"
                      >
                        <FlipHorizontal className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    /* Simulated camera fallback */
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                      <div className="absolute top-8 left-8 w-16 h-16 bg-white/5 rounded-lg blur-sm" />
                      <div className="absolute top-12 left-16 w-8 h-8 bg-white/5 rounded blur-sm" />
                      <div className="absolute bottom-8 right-8 w-20 h-20 bg-white/5 rounded-lg blur-sm" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <QrCode className="w-16 h-16 text-white/10" />
                      </div>
                    </div>
                  )}

                  {/* Corner brackets */}
                  <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl z-10" />
                  <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr z-10" />
                  <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl z-10" />
                  <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br z-10" />

                  {/* Laser scan line */}
                  <motion.div
                    animate={{ top: ["15%", "85%", "15%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent z-10"
                    style={{ position: "absolute" }}
                  />
                </div>

                {/* Camera status */}
                {cameraActive ? (
                  <div className="flex items-center gap-2 text-xs text-success">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    Camera active — scanning for QR
                  </div>
                ) : cameraError ? (
                  <div className="w-full">
                    <div className="flex items-center gap-2 text-xs text-warning bg-warning/10 border border-warning/30 rounded-xl px-3 py-2 mb-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {cameraError}
                    </div>
                    {/* Progress bar for simulated scan */}
                    <div className="flex justify-between text-xs text-foreground/50 mb-1.5">
                      <span>Simulating scan...</span>
                      <span>{scanProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-foreground/50">
                    <div className="w-2 h-2 rounded-full bg-foreground/20 animate-pulse" />
                    Starting camera...
                  </div>
                )}

                {/* Actions row */}
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => { stopCamera(); startSimulatedScan(); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-secondary/40 transition-colors"
                  >
                    <Upload className="w-4 h-4" /> Upload QR
                  </button>
                  {!cameraActive && (
                    <button
                      onClick={() => startCamera(facingMode)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-primary/40 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Camera className="w-4 h-4" /> Retry Camera
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Detected Phase ── */}
            {phase === "detected" && (
              <motion.div key="detected" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-bold text-sm">QR Code Detected!</span>
                </div>

                <div className="bg-secondary/30 border border-border rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground/50">Merchant</span>
                    <span className="font-bold text-sm">{mockResult.merchant}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground/50">UPI ID</span>
                    <span className="font-mono text-xs text-foreground/80">{mockResult.upiId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground/50">Category</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">{mockResult.category}</span>
                  </div>
                  <div className="border-t border-border/50 pt-3 space-y-3">
                    <div>
                      <span className="text-xs text-foreground/50 block mb-1.5">Recipient Number</span>
                      <input
                        type="tel"
                        value={recipientNumber}
                        onChange={(e) => setRecipientNumber(e.target.value)}
                        placeholder="Enter mobile / UPI number"
                        className="w-full bg-card border border-border rounded-xl py-2.5 px-3 text-sm font-medium focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <span className="text-xs text-foreground/50 block mb-1.5">Amount (₹)</span>
                      <input
                        type="number"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="w-full bg-card border border-border rounded-xl py-2.5 px-3 text-2xl font-bold focus:outline-none focus:border-primary/50 text-center"
                      />
                    </div>
                  </div>
                </div>

                {hasMpin && (
                  <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 border border-primary/20 rounded-xl px-3 py-2">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    MPIN will be required to confirm payment
                  </div>
                )}

                <button
                  onClick={handleProceedToPay}
                  disabled={!recipientNumber.trim() || Number(customAmount) <= 0}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-primary/25 disabled:opacity-60"
                >
                  <Zap className="w-5 h-5" /> Proceed to Pay ₹{Number(customAmount).toLocaleString("en-IN")}
                </button>
              </motion.div>
            )}

            {/* ── MPIN Phase ── */}
            {phase === "mpin" && verifyMpinFn && (
              <MPINOverlay
                paymentInfo={{ merchant: mockResult.merchant, amount: Number(customAmount), upiId: mockResult.upiId }}
                verifyFn={verifyMpinFn}
                onSuccess={handleMpinSuccess}
                onCancel={() => setPhase("detected")}
              />
            )}

            {/* ── Confirm Phase (no MPIN) ── */}
            {phase === "confirm" && (
              <motion.div key="confirm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
                <div className="text-center">
                  <p className="text-foreground/60 text-sm mb-1">Paying to</p>
                  <h3 className="text-2xl font-bold">{mockResult.merchant}</h3>
                  <p className="text-4xl font-bold text-primary mt-2">₹{Number(customAmount).toLocaleString("en-IN")}</p>
                  <p className="text-xs text-foreground/50 mt-1">{mockResult.upiId}</p>
                </div>

                <div className="bg-warning/10 border border-warning/30 rounded-xl p-3 flex gap-2">
                  <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <p className="text-xs text-warning/90">Verify merchant details before paying. Payments cannot be reversed.</p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setPhase("detected")} className="flex-1 py-3 rounded-xl border border-border font-semibold text-sm hover:bg-secondary/40 transition-colors">
                    Back
                  </button>
                  <button onClick={handlePay} className="flex-1 py-3 rounded-xl bg-success text-white font-bold text-sm hover:bg-success/90 transition-colors">
                    Confirm Pay
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Success Phase ── */}
            {phase === "success" && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 py-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12, delay: 0.1 }}
                  className="w-24 h-24 bg-success rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.4)]"
                >
                  <CheckCircle className="w-14 h-14 text-white" />
                </motion.div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-success">Payment Successful!</h3>
                  <p className="text-3xl font-bold mt-1">₹{Number(customAmount).toLocaleString("en-IN")}</p>
                  <p className="text-sm text-foreground/60 mt-1">Paid to {mockResult.merchant}</p>
                  <p className="text-xs text-foreground/40 mt-0.5">Ref: TXN{Date.now().toString().slice(-8)}</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-bold hover:opacity-90 transition-opacity"
                >
                  Done
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
