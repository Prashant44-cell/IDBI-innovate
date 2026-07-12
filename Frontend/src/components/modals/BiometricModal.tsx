"use client";

import { X, Fingerprint } from "lucide-react";
import { motion } from "framer-motion";

interface BiometricModalProps {
  biometricEnabled: boolean;
  setBiometricEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  onClose: () => void;
}

export default function BiometricModal({ biometricEnabled, setBiometricEnabled, onClose }: BiometricModalProps) {
  return (
    <div>
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent/10 rounded-2xl flex items-center justify-center">
            <Fingerprint className="w-5 h-5 text-accent" />
          </div>
          <h2 className="text-lg font-bold">Biometric Login</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
          <X className="w-5 h-5 text-foreground/60" />
        </button>
      </div>
      <div className="px-6 py-8 flex flex-col items-center gap-6">
        <motion.div
          animate={{ scale: biometricEnabled ? [1, 1.05, 1] : 1 }}
          transition={{ repeat: biometricEnabled ? Infinity : 0, duration: 2 }}
          className={`w-28 h-28 rounded-full flex items-center justify-center border-4 ${biometricEnabled ? "border-success bg-success/10" : "border-border bg-secondary"}`}
        >
          <Fingerprint className={`w-14 h-14 ${biometricEnabled ? "text-success" : "text-foreground/40"}`} />
        </motion.div>
        <div className="text-center">
          <p className={`text-lg font-bold ${biometricEnabled ? "text-success" : "text-foreground/60"}`}>
            {biometricEnabled ? "Biometric Active" : "Biometric Disabled"}
          </p>
          <p className="text-sm text-foreground/50 mt-1">
            {biometricEnabled ? "Your fingerprint is used to secure this app." : "Enable to use fingerprint login."}
          </p>
        </div>
        <button
          onClick={() => setBiometricEnabled((v) => !v)}
          className={`w-full py-4 rounded-2xl font-semibold text-base transition-all ${biometricEnabled ? "bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20" : "bg-success text-white hover:bg-success/90"}`}
        >
          {biometricEnabled ? "Disable Biometric" : "Enable Biometric"}
        </button>
      </div>
    </div>
  );
}
