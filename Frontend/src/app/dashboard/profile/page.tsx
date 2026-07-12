"use client";

import { useState, useEffect } from "react";
import { User, ShieldCheck, CreditCard, Settings, LogOut, ChevronRight, AlertTriangle, X, Upload, CheckCircle2, PencilLine, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getSession, clearSession } from "@/lib/session";
import { clearSession as clearDbSession, setMpin } from "@/lib/db";
import { logEvent } from "@/lib/auditLogger";

export default function Profile() {
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [session, setSessionState] = useState<any>(null);
  
  // KYC State
  const [showKYC, setShowKYC] = useState(false);
  const [kycStatus, setKycStatus] = useState("none");
  const [kycLoading, setKycLoading] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showLinkBank, setShowLinkBank] = useState(false);
  const [profileName, setProfileName] = useState("Client");
  const [profileEmail, setProfileEmail] = useState("client@example.com");
  const [profilePhone, setProfilePhone] = useState("+91 98765 43210");
  const [profileAddress, setProfileAddress] = useState("Mumbai, India");
  const [profileDob, setProfileDob] = useState("");
  const [profileGender, setProfileGender] = useState("");
  const [profileMpin, setProfileMpin] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [bankMessage, setBankMessage] = useState("");

  useEffect(() => {
    const s = getSession();
    if (s) {
      setSessionState(s);
      setProfileName(s.user?.split("@")[0] || "Client");
      setProfileEmail(s.user || "client@example.com");
    }
    const status = localStorage.getItem("kyc_status") || "none";
    setKycStatus(status);
  }, []);

  const handleLogout = () => {
    setLoggingOut(true);
    logEvent(session?.user || "client", "client", "LOGOUT", "Logged out from Client Dashboard");
    // Clear all session data
    clearSession();
    clearDbSession();
    if (typeof window !== "undefined") {
      localStorage.removeItem("idbi_current_session");
    }
    setTimeout(() => {
      router.replace("/");
    }, 300);
  };

  const handleKYCUpload = () => {
    setKycLoading(true);
    setTimeout(() => {
      setKycLoading(false);
      setKycStatus("verified");
      localStorage.setItem("kyc_status", "verified");
      logEvent(session?.user || "client", "client", "KYC_VERIFIED", "User successfully completed Mock Document KYC verification");
      setTimeout(() => setShowKYC(false), 1500);
    }, 2000);
  };

  const handleProfileSave = async () => {
    setSessionState((prev: any) => ({ ...prev, user: profileEmail }));
    if (profileMpin && profileMpin.length === 6) {
      await setMpin(profileEmail, profileMpin);
    }
    setShowEditProfile(false);
    logEvent(profileEmail, "client", "PROFILE_UPDATED", "Client profile information updated");
  };

  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfileImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLinkBank = () => {
    setBankMessage("Bank link request sent for review. You can add the account later from settings.");
    setShowLinkBank(false);
  };

  return (
    <div className="p-6 space-y-6 pb-24">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>

      {/* User Card */}
      <div className="bg-white border border-border rounded-3xl p-6 shadow-sm flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-tr from-primary to-accent rounded-full p-0.5 relative">
          <div className="w-full h-full bg-background rounded-full border-2 border-background overflow-hidden flex items-center justify-center">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-foreground/50" />
            )}
          </div>
          <label className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer shadow-lg">
            <Upload className="w-3 h-3" />
            <input type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden" />
          </label>
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{session?.user?.split("@")[0] || "Client"}</h2>
          <p className="text-sm text-foreground/60">{session?.user || "client@example.com"}</p>
          <button 
            onClick={() => setShowKYC(true)}
            className={`flex items-center gap-1 mt-2 px-2 py-0.5 rounded-md w-max border transition-all ${
              kycStatus === "verified" ? "bg-success/10 text-success border-success/30" : "bg-warning/10 text-warning border-warning/30 hover:bg-warning/20"
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {kycStatus === "verified" ? "KYC Verified" : "KYC Pending - Complete Now"}
            </span>
          </button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button onClick={() => setShowEditProfile(true)} className="w-full bg-white border border-border rounded-2xl p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors shadow-sm text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <PencilLine className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm">Edit Profile</p>
              <p className="text-xs text-foreground/50">Update your details</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-foreground/40" />
        </button>
        <button onClick={() => setShowLinkBank(true)} className="w-full bg-white border border-border rounded-2xl p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors shadow-sm text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
              <PlusCircle className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="font-bold text-sm">Link Bank Account</p>
              <p className="text-xs text-foreground/50">Connect securely</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-foreground/40" />
        </button>
      </div>

      {/* Security Score */}
      <div className="bg-gradient-to-r from-success/20 to-success/5 border border-success/30 rounded-3xl p-5 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-success mb-1">Security Score</h3>
          <p className="text-xs text-foreground/70 font-semibold">Your account is highly secure.</p>
        </div>
        <div className="w-12 h-12 rounded-full border-4 border-success flex items-center justify-center font-bold text-success shadow-[0_0_10px_rgba(16,185,129,0.3)]">
          {kycStatus === "verified" ? 98 : 75}
        </div>
      </div>

      <button 
        onClick={() => setShowLogoutConfirm(true)}
        className="w-full py-4 rounded-2xl border border-danger/30 text-danger font-bold flex items-center justify-center gap-2 hover:bg-danger/10 transition-colors shadow-sm"
      >
        <LogOut className="w-5 h-5" />
        Log Out
      </button>

      {/* Settings Options */}
      <div className="space-y-2">
        <h3 className="font-bold px-2 mb-2 text-foreground/80">Account & Security</h3>
        
        {[
          { name: "Linked Bank Accounts", icon: CreditCard, value: "2 Accounts" },
          { name: "Document Verification (KYC)", icon: ShieldCheck, value: kycStatus === "verified" ? "Verified" : "Action Required", action: () => setShowKYC(true) },
          { name: "Privacy Settings", icon: ShieldCheck, value: "" },
          { name: "App Settings", icon: Settings, value: "" },
        ].map((item, i) => (
          <button 
            key={i} 
            onClick={item.action} 
            className="w-full bg-white border border-border rounded-2xl p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors shadow-sm text-left active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <span className="font-bold text-sm">{item.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {item.value && (
                <span className={`text-xs font-bold ${item.value === "Action Required" ? "text-warning" : item.value === "Verified" ? "text-success" : "text-foreground/50"}`}>
                  {item.value}
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-foreground/40" />
            </div>
          </button>
        ))}
      </div>

      {bankMessage && (
        <div className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success font-medium">
          {bankMessage}
        </div>
      )}

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm" onClick={() => setShowEditProfile(false)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} className="w-full max-w-sm bg-white border border-border rounded-3xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Edit Profile</h3>
                <button onClick={() => setShowEditProfile(false)} className="p-2 hover:bg-secondary rounded-full">
                  <X className="w-4 h-4 text-foreground/60" />
                </button>
              </div>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto px-1 py-1">
                {/* Inline Photo Upload */}
                <div className="flex justify-center mb-2">
                  <div className="w-20 h-20 bg-secondary rounded-full overflow-hidden flex items-center justify-center relative border border-border">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-foreground/40" />
                    )}
                    <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
                      <Upload className="w-4 h-4 mb-1" />
                      <span className="text-[10px] font-bold">Upload</span>
                      <input type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden" />
                    </label>
                  </div>
                </div>
                
                <input value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Full name" className="w-full rounded-xl border border-border px-3 py-2.5 text-sm" />
                <input value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} placeholder="Email" className="w-full rounded-xl border border-border px-3 py-2.5 text-sm" />
                <input value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} placeholder="Phone number" className="w-full rounded-xl border border-border px-3 py-2.5 text-sm" />
                
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={profileDob} onChange={(e) => setProfileDob(e.target.value)} className="w-full rounded-xl border border-border px-3 py-2.5 text-sm" />
                  <select value={profileGender} onChange={(e) => setProfileGender(e.target.value)} className="w-full rounded-xl border border-border px-3 py-2.5 text-sm bg-transparent">
                    <option value="">Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <textarea value={profileAddress} onChange={(e) => setProfileAddress(e.target.value)} placeholder="Address" rows={2} className="w-full rounded-xl border border-border px-3 py-2.5 text-sm" />
                
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mt-4">
                  <p className="text-xs font-bold text-primary mb-2">Setup TPIN for Payments</p>
                  <input type="password" inputMode="numeric" maxLength={6} value={profileMpin} onChange={(e) => setProfileMpin(e.target.value.replace(/\D/g, ""))} placeholder="Enter 6-digit PIN" className="w-full rounded-xl border border-border px-3 py-2.5 text-sm bg-white" />
                </div>

                <button onClick={handleProfileSave} className="w-full rounded-xl bg-primary px-3 py-3 text-sm font-semibold text-white mt-2">Save Changes</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLinkBank && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm" onClick={() => setShowLinkBank(false)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} className="w-full max-w-sm bg-white border border-border rounded-3xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Link Bank Account</h3>
                <button onClick={() => setShowLinkBank(false)} className="p-2 hover:bg-secondary rounded-full">
                  <X className="w-4 h-4 text-foreground/60" />
                </button>
              </div>
              <div className="space-y-3">
                <input placeholder="Bank name" className="w-full rounded-xl border border-border px-3 py-2.5 text-sm" />
                <input placeholder="Account holder name" className="w-full rounded-xl border border-border px-3 py-2.5 text-sm" />
                <input placeholder="IFSC / Routing number" className="w-full rounded-xl border border-border px-3 py-2.5 text-sm" />
                <button onClick={handleLinkBank} className="w-full rounded-xl bg-accent px-3 py-3 text-sm font-semibold text-white">Submit Request</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KYC Upload Modal */}
      <AnimatePresence>
        {showKYC && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm"
            onClick={() => setShowKYC(false)}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="w-full max-w-sm bg-white border border-border rounded-3xl p-6 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setShowKYC(false)} className="absolute top-4 right-4 p-2 hover:bg-secondary rounded-full">
                <X className="w-4 h-4 text-foreground/50" />
              </button>
              
              <div className="text-center mb-6 mt-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold">Document Verification</h3>
                <p className="text-xs text-foreground/60 mt-1 font-medium">Upload Aadhar or PAN for Full Access</p>
              </div>

              {kycStatus === "verified" && !kycLoading ? (
                <div className="bg-success/10 border border-success/30 rounded-2xl p-6 text-center">
                  <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-2" />
                  <p className="font-bold text-success">KYC Verified!</p>
                  <p className="text-xs text-success/80 mt-1">Your identity has been confirmed.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:bg-secondary/30 transition-colors cursor-pointer group">
                    <Upload className="w-8 h-8 text-foreground/40 mx-auto mb-2 group-hover:text-primary transition-colors" />
                    <p className="text-sm font-bold text-foreground/60 group-hover:text-primary transition-colors">Tap to Upload Document</p>
                    <p className="text-[10px] text-foreground/40 mt-1">JPEG, PNG, PDF up to 5MB</p>
                  </div>
                  
                  <button
                    onClick={handleKYCUpload}
                    disabled={kycLoading}
                    className="w-full py-4 rounded-xl bg-primary text-white font-bold flex justify-center items-center gap-2 hover:bg-primary/90 disabled:opacity-70 transition-colors shadow-lg shadow-primary/20"
                  >
                    {kycLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Submit for Verification"
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-sm bg-white border border-border rounded-3xl p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-danger/10 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-danger" />
                </div>
                <button onClick={() => setShowLogoutConfirm(false)} className="p-2 hover:bg-secondary rounded-full transition-colors">
                  <X className="w-5 h-5 text-foreground/60" />
                </button>
              </div>
              <h3 className="text-lg font-bold mb-1">Log Out?</h3>
              <p className="text-sm text-foreground/60 mb-6 font-medium">You will be redirected to the login screen. Your data is safely stored.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 rounded-xl border border-border font-bold text-sm hover:bg-secondary/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex-1 py-3 rounded-xl bg-danger text-white font-bold text-sm hover:bg-danger/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {loggingOut ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
