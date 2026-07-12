"use client";

import { ArrowLeft, TrendingUp, Sparkles } from "lucide-react";

interface InvestTabProps {
  setActiveTab: (val: string) => void;
}

export default function InvestTab({ setActiveTab }: InvestTabProps) {
  const funds = [
    { name: "Nifty 50 Index Fund", category: "Large Cap", returns: "+18.4%", risk: "Low", amount: "₹1,20,000", color: "text-success" },
    { name: "Mirae Asset Emerging", category: "Mid Cap", returns: "+24.1%", risk: "Medium", amount: "₹85,000", color: "text-warning" },
    { name: "HDFC Small Cap Fund", category: "Small Cap", returns: "+31.6%", risk: "High", amount: "₹45,000", color: "text-danger" },
    { name: "SBI Gold ETF", category: "Commodity", returns: "+12.3%", risk: "Low", amount: "₹28,000", color: "text-success" },
  ];

  return (
    <div className="p-6 space-y-5 pb-32">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => setActiveTab("home")} className="p-2 bg-card rounded-full border border-border">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Investments</h1>
          <p className="text-xs text-foreground/60">Your active portfolio</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 rounded-3xl p-5">
        <p className="text-sm text-foreground/60 mb-1">Total Invested</p>
        <h2 className="text-3xl font-bold mb-3">₹2,78,000</h2>
        <div className="flex gap-4">
          <div className="flex-1 bg-white/5 rounded-2xl p-3">
            <p className="text-xs text-foreground/50 mb-1">Current Value</p>
            <p className="font-bold text-success">₹3,41,250</p>
          </div>
          <div className="flex-1 bg-white/5 rounded-2xl p-3">
            <p className="text-xs text-foreground/50 mb-1">Total Gain</p>
            <p className="font-bold text-success flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />+₹63,250
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Your Funds</h3>
        <div className="space-y-3">
          {funds.map((f, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{f.name}</p>
                  <p className="text-xs text-foreground/50">{f.category} · Risk: {f.risk}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold text-sm ${f.color}`}>{f.returns}</p>
                <p className="text-xs text-foreground/50">{f.amount}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => setActiveTab("advisor")}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
      >
        <Sparkles className="w-5 h-5" />
        Get AI Investment Advice
      </button>
    </div>
  );
}
