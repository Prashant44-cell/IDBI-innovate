/* eslint-disable */
"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ShieldCheck, Upload, CheckCircle, Clock, FileText, AlertCircle, ChevronDown, ChevronUp
} from "lucide-react";
import { KYCDoc, getKYCDocs, updateKYCDoc } from "@/lib/db";

interface KYCModalProps {
  email: string;
  onClose: () => void;
  onKYCUpdated: () => void;
}

const DOC_INFO: Record<KYCDoc["type"], { sides: ("front" | "back")[]; note: string }> = {
  aadhaar:         { sides: ["front", "back"],  note: "Upload both sides of your Aadhaar card" },
  pan:             { sides: ["front"],          note: "Upload the front of your PAN card" },
  voter_id:        { sides: ["front", "back"],  note: "Upload both sides of your Voter ID" },
  passport:        { sides: ["front"],          note: "Upload the photo page of your Passport" },
  driving_licence: { sides: ["front", "back"],  note: "Upload both sides of your Driving Licence" },
};

function StatusBadge({ status }: { status: KYCDoc["status"] }) {
  if (status === "verified")
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
        <CheckCircle className="w-3 h-3" /> Verified
      </span>
    );
  if (status === "under_review")
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-warning bg-warning/10 px-2 py-0.5 rounded-full">
        <Clock className="w-3 h-3" /> Under Review
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-xs font-bold text-foreground/40 bg-secondary px-2 py-0.5 rounded-full">
      <Upload className="w-3 h-3" /> Not Uploaded
    </span>
  );
}

export default function KYCModal({ email, onClose, onKYCUpdated }: KYCModalProps) {
  const [docs, setDocs] = useState<KYCDoc[]>(() => getKYCDocs(email));
  const [expandedDoc, setExpandedDoc] = useState<KYCDoc["type"] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUpload, setPendingUpload] = useState<{ type: KYCDoc["type"]; side: "front" | "back" } | null>(null);

  const verifiedCount = docs.filter((d) => d.status === "verified").length;
  const uploadedCount = docs.filter((d) => d.frontImage !== null).length;
  const overallStatus = verifiedCount >= 1 ? "verified" : uploadedCount > 0 ? "pending" : "none";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingUpload) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const imageData = ev.target?.result as string;
      const update: Partial<Pick<KYCDoc, "frontImage" | "backImage" | "status">> = {};
      if (pendingUpload.side === "front") update.frontImage = imageData;
      else update.backImage = imageData;

      updateKYCDoc(email, pendingUpload.type, update);
      setDocs(getKYCDocs(email));
      onKYCUpdated();
      setPendingUpload(null);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const triggerUpload = (type: KYCDoc["type"], side: "front" | "back") => {
    setPendingUpload({ type, side });
    setTimeout(() => fileInputRef.current?.click(), 50);
  };

  // Simulate verification for a document (mark as verified after 1.5s)
  const simulateVerify = (type: KYCDoc["type"]) => {
    setTimeout(() => {
      updateKYCDoc(email, type, { status: "verified" });
      setDocs(getKYCDocs(email));
      onKYCUpdated();
    }, 1500);
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
        className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success/10 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-success" />
            </div>
            <div>
              <h2 className="font-bold text-base">KYC Verification</h2>
              <p className="text-xs text-foreground/50">Upload Indian government documents</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X className="w-5 h-5 text-foreground/60" />
          </button>
        </div>

        {/* Overall Status Banner */}
        <div className={`mx-4 mt-4 rounded-2xl p-3 flex items-center gap-3 shrink-0 ${
          overallStatus === "verified" ? "bg-success/10 border border-success/30" :
          overallStatus === "pending"  ? "bg-warning/10 border border-warning/30" :
                                        "bg-secondary border border-border"
        }`}>
          {overallStatus === "verified" ? (
            <CheckCircle className="w-5 h-5 text-success shrink-0" />
          ) : overallStatus === "pending" ? (
            <Clock className="w-5 h-5 text-warning shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-foreground/40 shrink-0" />
          )}
          <div>
            <p className={`text-sm font-bold ${
              overallStatus === "verified" ? "text-success" :
              overallStatus === "pending"  ? "text-warning" : "text-foreground/60"
            }`}>
              {overallStatus === "verified" ? "KYC Verified ✓" :
               overallStatus === "pending"  ? "Documents Under Review" :
                                             "KYC Not Started"}
            </p>
            <p className="text-xs text-foreground/50">
              {uploadedCount} of 5 documents uploaded · {verifiedCount} verified
            </p>
          </div>
        </div>

        {/* Docs list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <p className="text-xs text-foreground/50 font-semibold uppercase tracking-wider px-1">
            Accepted Documents (upload any 1 or more)
          </p>

          {docs.map((doc) => {
            const info = DOC_INFO[doc.type];
            const isExpanded = expandedDoc === doc.type;
            const hasFront = !!doc.frontImage && doc.frontImage !== "demo";
            const hasBack = !!doc.backImage && doc.backImage !== "demo";

            return (
              <div key={doc.type} className="bg-secondary/30 border border-border rounded-2xl overflow-hidden">
                {/* Doc row */}
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors"
                  onClick={() => setExpandedDoc(isExpanded ? null : doc.type)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-card border border-border rounded-xl flex items-center justify-center">
                      <FileText className="w-4 h-4 text-foreground/60" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm">{doc.label}</p>
                      <p className="text-xs text-foreground/50">{info.sides.length === 2 ? "Front & Back" : "Front only"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={doc.status} />
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-foreground/40" /> : <ChevronDown className="w-4 h-4 text-foreground/40" />}
                  </div>
                </button>

                {/* Expanded upload area */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-border/50"
                    >
                      <div className="p-4 space-y-3">
                        <p className="text-xs text-foreground/50">{info.note}</p>

                        <div className={`grid gap-3 ${info.sides.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
                          {info.sides.map((side) => {
                            const hasImg = side === "front" ? (hasFront || doc.frontImage === "demo") : (hasBack || doc.backImage === "demo");
                            return (
                              <button
                                key={side}
                                onClick={() => !hasImg && triggerUpload(doc.type, side)}
                                className={`relative rounded-xl border-2 border-dashed p-4 flex flex-col items-center gap-2 transition-all ${
                                  hasImg
                                    ? "border-success/50 bg-success/5 cursor-default"
                                    : "border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                                }`}
                              >
                                {hasImg ? (
                                  <>
                                    <CheckCircle className="w-6 h-6 text-success" />
                                    <span className="text-xs font-semibold text-success capitalize">{side} ✓</span>
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-6 h-6 text-foreground/40" />
                                    <span className="text-xs text-foreground/50 capitalize">Upload {side}</span>
                                  </>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Simulate verification button for uploaded docs */}
                        {doc.frontImage && doc.status === "under_review" && (
                          <button
                            onClick={() => simulateVerify(doc.type)}
                            className="w-full py-2.5 rounded-xl bg-success/10 border border-success/30 text-success text-sm font-semibold hover:bg-success/20 transition-colors"
                          >
                            ✓ Mark as Verified (Demo)
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border/50 shrink-0">
          <p className="text-xs text-foreground/40 text-center">
            Documents are stored locally and not shared with third parties
          </p>
        </div>
      </motion.div>
    </div>
  );
}
