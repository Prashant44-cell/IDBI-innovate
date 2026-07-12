/* eslint-disable */
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, ShieldCheck, CreditCard, Fingerprint, Settings,
  ChevronRight, LogOut, Camera, Lock, X, Check, AlertCircle, PencilLine, PlusCircle
} from "lucide-react";
import { UserProfile, verifyPassword, updateProfile } from "@/lib/db";

interface ProfileTabProps {
  userProfile: UserProfile | null;
  profileImage: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleProfileImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  biometricEnabled: boolean;
  setActiveModal: (val: string | null) => void;
  setShowLogoutConfirm: (val: boolean) => void;
  setShowKYC: (val: boolean) => void;
  onFaceReCapture: () => void;
  onProfileUpdated: () => void;
}

export default function ProfileTab({
  userProfile,
  profileImage,
  fileInputRef,
  handleProfileImageChange,
  biometricEnabled,
  setActiveModal,
  setShowLogoutConfirm,
  setShowKYC,
  onFaceReCapture,
  onProfileUpdated,
}: ProfileTabProps) {
  const [showPasswordVerify, setShowPasswordVerify] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState("");
  const [pendingAction, setPendingAction] = useState<"face" | null>(null);

  const kycStatus = userProfile?.kycStatus ?? "none";
  const displayImage = profileImage || userProfile?.profileImage;

  const requestPasswordVerification = (action: "face") => {
    setPendingAction(action);
    setPwInput("");
    setPwError("");
    setShowPasswordVerify(true);
  };

  const handlePasswordConfirm = async () => {
    if (!userProfile) return;
    const valid = await verifyPassword(userProfile.email, pwInput);
    if (!valid) { setPwError("Incorrect password. Please try again."); return; }
    setShowPasswordVerify(false);
    if (pendingAction === "face") onFaceReCapture();
    setPendingAction(null);
  };

  return (
    <div className="p-6 space-y-6 pb-32 relative">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>

      {/* Avatar card */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex items-center gap-4">
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div className="w-16 h-16 bg-gradient-to-tr from-primary to-accent rounded-full p-0.5">
            <div className="w-full h-full bg-background rounded-full flex items-center justify-center overflow-hidden">
              {displayImage ? (
                <img src={displayImage} alt="Profile" className="w-full h-full object-cover rounded-full" />
              ) : (
                <User className="w-8 h-8 text-foreground/50" />
              )}
            </div>
          </div>
          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-5 h-5 text-white" />
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleProfileImageChange}
        />
        <div className="flex-1">
          <h2 className="text-xl font-bold">{userProfile?.name ?? "User"}</h2>
          <p className="text-sm text-foreground/60">{userProfile?.email ?? ""}</p>
          {/* KYC Badge */}
          <button
            onClick={() => setShowKYC(true)}
            className={`flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md w-max transition-colors ${
              kycStatus === "verified"
                ? "bg-success/10 text-success"
                : kycStatus === "pending"
                ? "bg-warning/10 text-warning"
                : "bg-danger/10 text-danger/80"
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {kycStatus === "verified" ? "KYC Verified" : kycStatus === "pending" ? "KYC Pending" : "KYC Required"}
            </span>
            <ChevronRight className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* Security Score */}
      <div className="bg-gradient-to-r from-success/20 to-success/5 border border-success/30 rounded-3xl p-5 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-success mb-1">Security Score</h3>
          <p className="text-xs text-foreground/70">Your account is highly secure.</p>
        </div>
        <div className="w-12 h-12 rounded-full border-4 border-success flex items-center justify-center font-bold text-success">
          {kycStatus === "verified" ? 98 : kycStatus === "pending" ? 75 : 50}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button className="w-full bg-card border border-border rounded-2xl p-4 flex items-center justify-between hover:bg-secondary/40 transition-all text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <PencilLine className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Edit Profile</p>
              <p className="text-xs text-foreground/50">Update contact info</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-foreground/40" />
        </button>
        <button onClick={() => setActiveModal("banks")} className="w-full bg-card border border-border rounded-2xl p-4 flex items-center justify-between hover:bg-secondary/40 transition-all text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
              <PlusCircle className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="font-medium text-sm">Link Bank Account</p>
              <p className="text-xs text-foreground/50">Securely connect your bank</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-foreground/40" />
        </button>
      </div>

      {/* Account & Security */}
      <div className="space-y-2">
        <h3 className="font-semibold px-2 mb-2 text-foreground/80">Account & Security</h3>
        {[
          { name: "Linked Bank Accounts", icon: CreditCard,  value: "2 Accounts", action: () => setActiveModal("banks") },
          { name: "Biometric Login",      icon: Fingerprint, value: biometricEnabled ? "Enabled" : "Disabled", action: () => setActiveModal("biometric") },
          { name: "Face ID",              icon: Camera,      value: userProfile?.faceRegistered ? "Registered" : "Not set", action: () => requestPasswordVerification("face") },
          { name: "Privacy Settings",     icon: ShieldCheck, value: "", action: () => setActiveModal("privacy") },
          { name: "App Settings",         icon: Settings,    value: "", action: () => setActiveModal("appsettings") },
        ].map((item) => (
          <button
            key={item.name}
            onClick={item.action}
            className="w-full bg-card border border-border rounded-2xl p-4 flex items-center justify-between hover:bg-secondary/40 active:scale-[0.98] transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                <item.icon className="w-5 h-5 text-foreground/80" />
              </div>
              <span className="font-medium text-sm">{item.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {item.value && (
                <span className={`text-xs font-medium ${
                  item.name === "Biometric Login"
                    ? biometricEnabled ? "text-success" : "text-danger/70"
                    : item.name === "Face ID"
                    ? userProfile?.faceRegistered ? "text-success" : "text-foreground/50"
                    : "text-foreground/50"
                }`}>
                  {item.value}
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-foreground/40" />
            </div>
          </button>
        ))}
      </div>

      {/* KYC button */}
      <button
        onClick={() => setShowKYC(true)}
        className="w-full py-3.5 rounded-2xl border border-success/40 bg-success/5 text-success font-semibold flex items-center justify-center gap-2 hover:bg-success/10 transition-colors"
      >
        <ShieldCheck className="w-5 h-5" />
        {kycStatus === "none" ? "Complete KYC Verification" : kycStatus === "pending" ? "View KYC Status" : "KYC Documents ✓"}
      </button>

      <button
        onClick={() => setShowLogoutConfirm(true)}
        className="w-full py-4 rounded-2xl border border-danger/30 text-danger font-semibold flex items-center justify-center gap-2 hover:bg-danger/10 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        Log Out
      </button>

      {/* Password Verification Modal */}
      <AnimatePresence>
        {showPasswordVerify && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowPasswordVerify(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="w-full max-w-sm bg-card border border-border rounded-3xl p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold">Confirm Password</h3>
                  <p className="text-xs text-foreground/50">
                    {pendingAction === "face" ? "Required to update Face ID" : "Security verification"}
                  </p>
                </div>
                <button onClick={() => setShowPasswordVerify(false)} className="ml-auto p-2 hover:bg-secondary rounded-full">
                  <X className="w-4 h-4 text-foreground/50" />
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="password"
                  value={pwInput}
                  onChange={(e) => { setPwInput(e.target.value); setPwError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handlePasswordConfirm()}
                  placeholder="Enter your password"
                  autoFocus
                  className="w-full bg-secondary/30 border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50"
                />
                {pwError && (
                  <div className="flex items-center gap-2 text-danger text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {pwError}
                  </div>
                )}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setShowPasswordVerify(false)}
                    className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-secondary/40 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordConfirm}
                    disabled={!pwInput}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
