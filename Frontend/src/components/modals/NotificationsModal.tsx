"use client";

import { X, Check, TrendingUp, TrendingDown, Bell, Shield, Gift } from "lucide-react";
import { motion } from "framer-motion";

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

interface NotificationsModalProps {
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  onClose: () => void;
}

export default function NotificationsModal({ notifications, setNotifications, onClose }: NotificationsModalProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  };

  const iconMap: Record<string, { icon: any; color: string; bg: string }> = {
    gain: { icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
    loss: { icon: TrendingDown, color: "text-danger", bg: "bg-danger/10" },
    alert: { icon: Bell, color: "text-warning", bg: "bg-warning/10" },
    security: { icon: Shield, color: "text-primary", bg: "bg-primary/10" },
    offer: { icon: Gift, color: "text-accent", bg: "bg-accent/10" },
  };

  return (
    <div className="w-full max-w-md bg-card border border-border rounded-b-3xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-danger text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-primary font-semibold hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              <Check className="w-3 h-3" /> Mark all read
            </button>
          )}
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X className="w-5 h-5 text-foreground/60" />
          </button>
        </div>
      </div>

      {/* Notification Items */}
      <div className="max-h-[70vh] overflow-y-auto divide-y divide-border/30">
        {notifications.map((n) => {
          const meta = iconMap[n.type] ?? iconMap.alert;
          const IconComp = meta.icon;
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-secondary/30 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
              onClick={() => handleRead(n.id)}
            >
              <div className={`mt-0.5 w-10 h-10 rounded-2xl ${meta.bg} flex items-center justify-center shrink-0`}>
                <IconComp className={`w-5 h-5 ${meta.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-semibold ${!n.read ? "text-foreground" : "text-foreground/70"}`}>
                    {n.title}
                  </p>
                  <span className="text-[10px] text-foreground/40 shrink-0">{n.time}</span>
                </div>
                <p className="text-xs text-foreground/60 mt-0.5 leading-relaxed">{n.body}</p>
              </div>
              {!n.read && <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />}
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border/50 text-center">
        <button className="text-xs text-foreground/40 hover:text-foreground/70 transition-colors">
          View all activity
        </button>
      </div>
    </div>
  );
}
