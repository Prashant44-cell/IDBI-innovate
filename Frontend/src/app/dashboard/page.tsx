"use client";

import { useState } from "react";
import HomeTab from "@/components/dashboard/HomeTab";
import NotificationsModal from "@/components/modals/NotificationsModal";

export default function DashboardHome() {
  const [activeTab, setActiveTab] = useState("home");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, type: "alert", title: "EMI Due Tomorrow", body: "Your car loan EMI of ₹12,500 is due tomorrow.", time: "10m ago", read: false },
    { id: 2, type: "security", title: "New Login Detected", body: "We noticed a login from a new device in Mumbai.", time: "1h ago", read: false },
    { id: 3, type: "offer", title: "Pre-approved Loan", body: "You are eligible for a personal loan up to ₹5,00,000.", time: "2h ago", read: true },
  ]);

  // Mock data for the HomeTab
  const portfolioData = [
    { name: "Mon", value: 400000 },
    { name: "Tue", value: 410000 },
    { name: "Wed", value: 405000 },
    { name: "Thu", value: 420000 },
    { name: "Fri", value: 428500 },
  ];

  return (
    <>
      <HomeTab 
        unreadCount={notifications.filter(n => !n.read).length}
        setShowNotifications={setShowNotifications}
        setActiveTab={setActiveTab}
        portfolioData={portfolioData}
        userName="Client"
      />
      
      {showNotifications && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-background/80 backdrop-blur-sm p-4 pt-16">
          <NotificationsModal
            notifications={notifications}
            setNotifications={setNotifications}
            onClose={() => setShowNotifications(false)}
          />
        </div>
      )}
    </>
  );
}
