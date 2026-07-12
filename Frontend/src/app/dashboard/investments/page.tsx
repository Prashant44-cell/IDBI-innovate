"use client";

import { ArrowLeft, TrendingUp, ShieldAlert, Star, Flame } from "lucide-react";
import Link from "next/link";

const recommendations = [
  { name: "Nifty 50 Index Fund", type: "Mutual Fund", risk: "Moderate", returns: "12-15%", icon: TrendingUp, badge: "Popular" },
  { name: "Digital Gold", type: "Commodity", risk: "Low", returns: "8-10%", icon: Star, badge: "Safe" },
  { name: "Tech Growth Portfolio", type: "Stocks", risk: "High", returns: "18-22%", icon: Flame, badge: "High Return" },
  { name: "Corporate Bonds", type: "Fixed Income", risk: "Low", returns: "7-9%", icon: ShieldAlert, badge: "" },
];

export default function Investments() {
  return (
    <div className="p-6 space-y-6 pb-24">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="p-2 bg-card rounded-full border border-border">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">Investments</h1>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
        <h3 className="text-sm text-foreground/60 mb-2">Risk Profile</h3>
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-2xl font-bold text-accent">Aggressive</h2>
          <Link href="#" className="text-primary text-sm font-medium hover:underline">Retake Quiz</Link>
        </div>
        
        <div className="flex gap-1 h-3 mb-2">
          <div className="flex-1 bg-success/20 rounded-l-full" />
          <div className="flex-1 bg-warning/20" />
          <div className="flex-1 bg-accent border border-accent/50 rounded-r-full shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
        </div>
        <div className="flex justify-between text-xs text-foreground/50">
          <span>Conservative</span>
          <span>Moderate</span>
          <span className="text-accent font-medium">Aggressive</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">AI Recommendations</h3>
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">Updated just now</span>
        </div>

        <div className="grid gap-4">
          {recommendations.map((rec, i) => (
            <div key={i} className="bg-card border border-border rounded-3xl p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full group-hover:bg-primary/10 transition-colors" />
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                    <rec.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{rec.name}</h4>
                    <p className="text-xs text-foreground/50">{rec.type}</p>
                  </div>
                </div>
                {rec.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                    rec.badge === 'Safe' ? 'border-success text-success bg-success/10' :
                    rec.badge === 'High Return' ? 'border-danger text-danger bg-danger/10' :
                    'border-primary text-primary bg-primary/10'
                  }`}>
                    {rec.badge}
                  </span>
                )}
              </div>

              <div className="flex gap-4 relative z-10">
                <div className="flex-1 bg-secondary/50 rounded-2xl p-3 border border-white/5">
                  <p className="text-[10px] text-foreground/50 mb-1">Risk Level</p>
                  <p className={`text-sm font-semibold ${
                    rec.risk === 'High' ? 'text-danger' :
                    rec.risk === 'Moderate' ? 'text-warning' : 'text-success'
                  }`}>{rec.risk}</p>
                </div>
                <div className="flex-1 bg-secondary/50 rounded-2xl p-3 border border-white/5">
                  <p className="text-[10px] text-foreground/50 mb-1">Expected Return</p>
                  <p className="text-sm font-semibold text-success">{rec.returns}</p>
                </div>
              </div>
              
              <button className="w-full mt-4 py-3 bg-secondary hover:bg-primary hover:text-white transition-colors rounded-xl text-sm font-semibold border border-border hover:border-transparent">
                Invest Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
