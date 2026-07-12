"use client";

import { ArrowLeft, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface SpendingTabProps {
  setActiveTab: (val: string) => void;
}

export default function SpendingTab({ setActiveTab }: SpendingTabProps) {
  const transactions = [
    { label: "Swiggy Order", cat: "Food", amount: "-₹340", time: "Today, 1:30 PM", icon: "🍔" },
    { label: "Salary Credit", cat: "Income", amount: "+₹85,000", time: "Today, 9:00 AM", icon: "💰" },
    { label: "Uber Ride", cat: "Travel", amount: "-₹220", time: "Yesterday", icon: "🚗" },
    { label: "Netflix", cat: "Entertainment", amount: "-₹649", time: "Jun 22", icon: "🎬" },
    { label: "Electricity Bill", cat: "Utilities", amount: "-₹1,450", time: "Jun 21", icon: "⚡" },
  ];

  return (
    <div className="p-6 space-y-5 pb-32">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => setActiveTab("home")} className="p-2 bg-card rounded-full border border-border">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Spending & Save</h1>
          <p className="text-xs text-foreground/60">Track your monthly expenses</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-success/10 border border-success/20 rounded-2xl p-4">
          <p className="text-xs text-foreground/60 mb-1">This Month Saved</p>
          <p className="text-2xl font-bold text-success">₹52,600</p>
          <p className="text-xs text-success mt-1">↑ 8% vs last month</p>
        </div>
        <div className="bg-danger/10 border border-danger/20 rounded-2xl p-4">
          <p className="text-xs text-foreground/60 mb-1">Total Spent</p>
          <p className="text-2xl font-bold text-danger">₹32,400</p>
          <p className="text-xs text-danger mt-1">↑ 3% vs last month</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex justify-between items-center mb-2">
          <p className="font-semibold text-sm">Monthly Budget</p>
          <p className="text-xs text-foreground/50">₹32,400 / ₹40,000</p>
        </div>
        <div className="w-full bg-border rounded-full h-2.5">
          <div className="bg-gradient-to-r from-primary to-accent h-2.5 rounded-full" style={{ width: "81%" }} />
        </div>
        <p className="text-xs text-foreground/50 mt-2">₹7,600 remaining this month</p>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Recent Transactions</h3>
        <div className="space-y-2">
          {transactions.map((t, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-lg">{t.icon}</div>
                <div>
                  <p className="font-medium text-sm">{t.label}</p>
                  <p className="text-xs text-foreground/50">{t.cat} · {t.time}</p>
                </div>
              </div>
              <p className={`font-bold text-sm ${t.amount.startsWith("+") ? "text-success" : "text-foreground"}`}>
                {t.amount}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
