/* eslint-disable */
"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Check, RefreshCw, X } from "lucide-react";

interface FaceCaptureProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function FaceCapture({ onSuccess, onCancel }: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamReady, setStreamReady] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setStreamReady(true);
      }
    } catch (err: any) {
      setError("Camera access denied. Face registration simulated.");
      setStreamReady(true); // allow simulated capture
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const handleCapture = () => {
    if (captured) return;
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setCaptured(true);
      stopCamera();
      setTimeout(() => onSuccess(), 1200);
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Camera viewport */}
      <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-primary/60 shadow-[0_0_40px_rgba(59,130,246,0.35)]">
        {/* Live feed or placeholder */}
        {streamReady && !error ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover scale-x-[-1]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center">
              <Camera className="w-10 h-10 text-slate-400" />
            </div>
          </div>
        )}

        {/* Corner brackets overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* TL */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-sm" />
          {/* TR */}
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-sm" />
          {/* BL */}
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-sm" />
          {/* BR */}
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-sm" />
        </div>

        {/* Scanning laser */}
        <AnimatePresence>
          {scanning && (
            <motion.div
              initial={{ top: "10%" }}
              animate={{ top: "90%" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
              className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent pointer-events-none"
              style={{ position: "absolute" }}
            />
          )}
        </AnimatePresence>

        {/* Success overlay */}
        <AnimatePresence>
          {captured && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-success/30 backdrop-blur-sm flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15 }}
                className="w-16 h-16 bg-success rounded-full flex items-center justify-center shadow-lg"
              >
                <Check className="w-9 h-9 text-white" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status text */}
      <div className="text-center">
        <p className="font-semibold text-sm text-foreground/90">
          {captured
            ? "Face Registered! ✅"
            : scanning
            ? "Scanning face..."
            : "Position your face in the circle"}
        </p>
        <p className="text-xs text-foreground/50 mt-1">
          {captured
            ? "Redirecting you..."
            : error
            ? error
            : "Make sure your face is well-lit and centered"}
        </p>
      </div>

      {/* Buttons */}
      {!captured && (
        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-border font-semibold text-sm hover:bg-secondary/40 transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
          <button
            onClick={handleCapture}
            disabled={scanning}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {scanning ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" /> Capture Face
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
