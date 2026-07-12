"use client";

import { X, CreditCard } from "lucide-react";

interface BankAccountsModalProps {
  onClose: () => void;
}

export default function BankAccountsModal({ onClose }: BankAccountsModalProps) {
  const accounts = [
    { bank: "HDFC Bank", type: "Savings Account", no: "••••  ••••  4821", balance: "₹1,84,200", color: "from-blue-600 to-blue-800" },
    { bank: "SBI Bank", type: "Current Account", no: "••••  ••••  9034", balance: "₹2,44,300", color: "from-indigo-600 to-purple-700" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-bold">Linked Bank Accounts</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
          <X className="w-5 h-5 text-foreground/60" />
        </button>
      </div>
      <div className="px-6 py-4 space-y-3">
        {accounts.map((acc, i) => (
          <div key={i} className={`bg-gradient-to-br ${acc.color} rounded-2xl p-4 text-white relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl -translate-y-4 translate-x-4" />
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div>
                <p className="text-white/70 text-xs font-medium">{acc.type}</p>
                <p className="font-bold text-base">{acc.bank}</p>
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <p className="text-white/60 text-xs mb-1 relative z-10">{acc.no}</p>
            <div className="flex items-center justify-between relative z-10">
              <p className="font-bold text-xl">{acc.balance}</p>
              <button className="text-xs text-white/60 hover:text-white/90 border border-white/30 rounded-full px-3 py-1 transition-colors">
                Remove
              </button>
            </div>
          </div>
        ))}
        <button className="w-full py-3 border-2 border-dashed border-border rounded-2xl text-sm text-foreground/50 hover:text-primary hover:border-primary/50 transition-all flex items-center justify-center gap-2 mt-2">
          + Add New Account
        </button>
      </div>
      <div className="px-6 pb-6" />
    </div>
  );
}
