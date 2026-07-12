"use client";

import { X, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

interface PrivacyToggles {
  analyticsSharing: boolean;
  transactionAlerts: boolean;
  marketingEmails: boolean;
  twoFactorAuth: boolean;
  locationAccess: boolean;
}

interface PrivacyModalProps {
  privacyToggles: PrivacyToggles;
  setPrivacyToggles: React.Dispatch<React.SetStateAction<PrivacyToggles>>;
  onClose: () => void;
}

export default function PrivacyModal({ privacyToggles, setPrivacyToggles, onClose }: PrivacyModalProps) {
  const toggleItems = [
    { key: "twoFactorAuth" as const, label: "Two-Factor Auth", sub: "Require OTP on every login" },
    { key: "transactionAlerts" as const, label: "Transaction Alerts", sub: "Get notified on every debit/credit" },
    { key: "analyticsSharing" as const, label: "Analytics Sharing", sub: "Help improve Assist IQ with usage data" },
    { key: "locationAccess" as const, label: "Location Access", sub: "Personalize offers by your region" },
    { key: "marketingEmails" as const, label: "Marketing Emails", sub: "Receive offers and newsletters" },
  ];

  const handleToggle = (key: keyof PrivacyToggles) => {
    setPrivacyToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div>
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-success/10 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-success" />
          </div>
          <h2 className="text-lg font-bold">Privacy Settings</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
          <X className="w-5 h-5 text-foreground/60" />
        </button>
      </div>
      <div className="px-6 py-4 space-y-1">
        {toggleItems.map((item) => (
          <div key={item.key} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
            <div>
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="text-xs text-foreground/50">{item.sub}</p>
            </div>
            <button
              onClick={() => handleToggle(item.key)}
              className={`relative w-12 h-6 rounded-full transition-colors ${privacyToggles[item.key] ? "bg-success" : "bg-secondary border border-border"}`}
            >
              <motion.div
                animate={{ x: privacyToggles[item.key] ? 24 : 2 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
              />
            </button>
          </div>
        ))}
      </div>
      <div className="px-6 pb-6" />
    </div>
  );
}
