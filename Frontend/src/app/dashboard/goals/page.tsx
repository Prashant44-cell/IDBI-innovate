"use client";

import { useState, useEffect } from "react";
import { Target, Plus, Car, Home, Plane, ArrowLeft, TrendingUp, Wallet, GraduationCap, X } from "lucide-react";
import Link from "next/link";
import { getGoals, addGoal, Goal } from "@/lib/db";
import { getSession } from "@/lib/session";
import { motion, AnimatePresence } from "framer-motion";

const PRESETS = [
  { name: "Dream Home", category: "Housing", icon: Home, emoji: "🏡", color: "#3b82f6" },
  { name: "New Car", category: "Lifestyle", icon: Car, emoji: "🚗", color: "#8b5cf6" },
  { name: "Vacation", category: "Travel", icon: Plane, emoji: "✈️", color: "#10b981" },
  { name: "Education", category: "Education", icon: GraduationCap, emoji: "🎓", color: "#f59e0b" },
  { name: "Emergency", category: "Savings", icon: Wallet, emoji: "🛡️", color: "#ef4444" },
];

export default function GoalPlanning() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Add Goal Form State
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
  const [targetAmount, setTargetAmount] = useState("");
  const [durationMonths, setDurationMonths] = useState("");
  const [monthlySavings, setMonthlySavings] = useState(0);

  useEffect(() => {
    const session = getSession();
    const email = typeof session === 'string' ? session : (session?.user || "client@example.com");
    setUserEmail(email);
    setGoals(getGoals(email));
  }, []);

  useEffect(() => {
    const target = Number(targetAmount) || 0;
    const months = Number(durationMonths) || 0;
    if (target > 0 && months > 0) {
      setMonthlySavings(Math.ceil(target / months));
    } else {
      setMonthlySavings(0);
    }
  }, [targetAmount, durationMonths]);

  const handleAddGoal = () => {
    if (!targetAmount || !durationMonths) return;
    
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + Number(durationMonths));
    const targetDateStr = targetDate.toISOString().substring(0, 7); // YYYY-MM
    
    addGoal(userEmail, {
      name: selectedPreset.name,
      category: selectedPreset.category,
      emoji: selectedPreset.emoji,
      targetAmount: Number(targetAmount),
      savedAmount: 0,
      targetDate: targetDateStr,
      color: selectedPreset.color,
      durationMonths: Number(durationMonths),
      monthlyContribution: monthlySavings,
    });
    
    setGoals(getGoals(userEmail));
    setShowAddModal(false);
    setTargetAmount("");
    setDurationMonths("");
  };

  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.savedAmount, 0);

  return (
    <div className="p-6 space-y-6 pb-24 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 bg-card rounded-full border border-border hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">Goal Planning</h1>
        </div>
        <button onClick={() => setShowAddModal(true)} className="p-2 bg-primary rounded-full text-white shadow-lg shadow-primary/30 hover:scale-105 transition-transform">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-2xl rounded-full" />
        <div className="flex items-start justify-between relative z-10">
          <div>
            <p className="text-sm text-foreground/60 mb-1">Total Goals Value</p>
            <h2 className="text-3xl font-bold">₹{(totalTarget / 100000).toFixed(1)}L</h2>
          </div>
          <div className="w-12 h-12 bg-card border border-border rounded-xl flex items-center justify-center">
            <Target className="w-6 h-6 text-primary" />
          </div>
        </div>
        <div className="mt-6 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-success" />
          <p className="text-sm text-foreground/80">You have saved <span className="text-success font-bold">₹{(totalSaved / 100000).toFixed(1)}L</span> so far!</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Your Goals</h3>
        {goals.length === 0 && (
          <div className="text-center py-10 bg-secondary/20 rounded-3xl border border-border border-dashed">
            <Target className="w-10 h-10 text-foreground/30 mx-auto mb-3" />
            <p className="text-foreground/60 text-sm">No goals set yet. Click + to add your first goal!</p>
          </div>
        )}
        
        {goals.map((goal) => {
          const progress = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
          return (
            <div key={goal.id} className="bg-card border border-border rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-xl shadow-inner" style={{ backgroundColor: `${goal.color}20` }}>
                  {goal.emoji}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{goal.name}</h4>
                  <p className="text-xs text-foreground/50">Target: {goal.targetDate}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">₹{(goal.savedAmount / 100000).toFixed(1)}L</p>
                  <p className="text-[10px] text-foreground/50 font-semibold uppercase">of ₹{(goal.targetAmount / 100000).toFixed(1)}L</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-semibold text-foreground/60">
                  <span>{progress.toFixed(1)}% Achieved</span>
                  <span>₹{(goal.targetAmount - goal.savedAmount).toLocaleString()} left</span>
                </div>
                <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden border border-border/50">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 relative overflow-hidden"
                    style={{ width: `${progress}%`, backgroundColor: goal.color }}
                  >
                    <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite] -translate-x-full" style={{ backgroundImage: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)" }} />
                  </div>
                </div>
                {goal.monthlyContribution && (
                  <p className="text-[10px] text-right text-foreground/50 font-medium">Monthly Savings: ₹{goal.monthlyContribution.toLocaleString()}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Goal Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} className="w-full max-w-sm bg-white border border-border rounded-3xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2"><Target className="w-5 h-5 text-primary"/> Add New Goal</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-secondary rounded-full">
                  <X className="w-4 h-4 text-foreground/60" />
                </button>
              </div>
              
              <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                <div>
                  <label className="text-xs font-bold text-foreground/70 uppercase mb-2 block">Select Category</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {PRESETS.map((p) => (
                      <button 
                        key={p.name}
                        onClick={() => setSelectedPreset(p)}
                        className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-colors ${selectedPreset.name === p.name ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary/30 hover:bg-secondary text-foreground/70'}`}
                      >
                        <span>{p.emoji}</span> {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground/70 uppercase mb-1 block">Target Amount (₹)</label>
                  <input type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="e.g. 500000" className="w-full rounded-xl border border-border px-3 py-3 text-sm font-bold" />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground/70 uppercase mb-1 block">Duration (Months)</label>
                  <input type="number" value={durationMonths} onChange={(e) => setDurationMonths(e.target.value)} placeholder="e.g. 12" className="w-full rounded-xl border border-border px-3 py-3 text-sm font-bold" />
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                  <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">Required Monthly Savings</p>
                  <p className="text-2xl font-extrabold text-primary">₹{monthlySavings.toLocaleString()}</p>
                </div>

                <button 
                  onClick={handleAddGoal} 
                  disabled={!targetAmount || !durationMonths}
                  className="w-full rounded-xl bg-primary px-3 py-3.5 text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                >
                  Create Goal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
