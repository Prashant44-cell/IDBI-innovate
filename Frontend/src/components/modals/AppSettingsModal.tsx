"use client";

import { X, Settings } from "lucide-react";
import { motion } from "framer-motion";

interface AppSettings {
  darkMode: boolean;
  pushNotifications: boolean;
  soundEffects: boolean;
  inrCurrency: boolean;
  compactView: boolean;
}

interface AppSettingsModalProps {
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onClose: () => void;
}

export default function AppSettingsModal({ appSettings, setAppSettings, onClose }: AppSettingsModalProps) {
  const toggleItems = [
    { key: "darkMode" as const, label: "Dark Mode", sub: "Use dark theme across the app" },
    { key: "pushNotifications" as const, label: "Push Notifications", sub: "Alerts for goals & market updates" },
    { key: "soundEffects" as const, label: "Sound Effects", sub: "Play sounds for transactions" },
    { key: "inrCurrency" as const, label: "Show INR (₹)", sub: "Display amounts in Indian Rupees" },
    { key: "compactView" as const, label: "Compact View", sub: "Reduce spacing for more content" },
  ];

  const handleToggle = (key: keyof AppSettings) => {
    setAppSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div>
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-warning/10 rounded-2xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-warning" />
          </div>
          <h2 className="text-lg font-bold">App Settings</h2>
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
              className={`relative w-12 h-6 rounded-full transition-colors ${appSettings[item.key] ? "bg-primary" : "bg-secondary border border-border"}`}
            >
              <motion.div
                animate={{ x: appSettings[item.key] ? 24 : 2 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
              />
            </button>
          </div>
        ))}
      </div>
      <div className="px-6 pb-4 pt-2 border-t border-border/30 mt-2">
        <p className="text-xs text-center text-foreground/30">Assist IQ v1.0.0 · Built with ❤️ for India</p>
      </div>
    </div>
  );
}
