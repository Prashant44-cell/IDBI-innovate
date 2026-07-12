/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Target, Plus, Sparkles, X, Check,
  Home, ShieldCheck, Plane, Car, GraduationCap, PiggyBank,
  TrendingUp, Wallet, Trash2, ChevronRight, Calendar
} from "lucide-react";
import { Goal, getGoals, addGoal, deleteGoal, updateGoal } from "@/lib/db";

interface GoalsTabProps {
  setActiveTab: (val: string) => void;
  userEmail: string;
}

const PRESET_GOALS = [
  { name: "Pay EMI Dues", emoji: "💳", category: "EMI/Debt",  color: "#ef4444", icon: Wallet,      defaultTarget: 50000  },
  { name: "Emergency Fund", emoji: "🛡️", category: "Savings",   color: "#10b981", icon: ShieldCheck, defaultTarget: 300000 },
  { name: "Buy a Home",     emoji: "🏡", category: "Housing",   color: "#3b82f6", icon: Home,        defaultTarget: 5000000},
  { name: "International Trip", emoji: "✈️", category: "Travel",    color: "#8b5cf6", icon: Plane,       defaultTarget: 200000 },
  { name: "New Car",        emoji: "🚗", category: "Lifestyle", color: "#f59e0b", icon: Car,         defaultTarget: 800000 },
  { name: "Child Education",emoji: "🎓", category: "Education", color: "#06b6d4", icon: GraduationCap, defaultTarget: 1000000},
  { name: "Retirement Fund",emoji: "🌅", category: "Savings",   color: "#a855f7", icon: TrendingUp,  defaultTarget: 5000000},
  { name: "Custom Goal",    emoji: "✨", category: "Other",     color: "#64748b", icon: Sparkles,    defaultTarget: 100000 },
];

const CATEGORY_OPTIONS = ["Housing", "Travel", "Education", "EMI/Debt", "Savings", "Lifestyle", "Other"];
const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7", "#64748b"];

function ProgressRing({ pct, color, size = 56 }: { pct: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" strokeWidth={6} fill="transparent" className="text-border" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={6} fill="transparent"
        strokeDasharray={circ} strokeDashoffset={circ - dash}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

type FormMode = "preset" | "form" | null;

export default function GoalsTab({ setActiveTab, userEmail }: GoalsTabProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [selectedPreset, setSelectedPreset] = useState<(typeof PRESET_GOALS)[0] | null>(null);

  // Form fields
  const [formName, setFormName]         = useState("");
  const [formEmoji, setFormEmoji]       = useState("✨");
  const [formCategory, setFormCategory] = useState("Other");
  const [formTarget, setFormTarget]     = useState("");
  const [formSaved, setFormSaved]       = useState("");
  const [formDate, setFormDate]         = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formContribution, setFormContribution] = useState("");
  const [formColor, setFormColor]       = useState(COLORS[0]);

  // Edit saved amount inline
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editAmount, setEditAmount]       = useState("");

  useEffect(() => {
    if (userEmail) setGoals(getGoals(userEmail));
  }, [userEmail]);

  const reload = () => setGoals(getGoals(userEmail));

  const openPreset = (preset: (typeof PRESET_GOALS)[0]) => {
    setSelectedPreset(preset);
    setFormName(preset.name);
    setFormEmoji(preset.emoji);
    setFormCategory(preset.category);
    setFormColor(preset.color);
    setFormTarget(preset.defaultTarget.toString());
    setFormSaved("");
    setFormDate("");
    setFormDuration("");
    setFormContribution("");
    setFormMode("form");
  };

  const openCustom = () => {
    setSelectedPreset(null);
    setFormName("");
    setFormEmoji("✨");
    setFormCategory("Other");
    setFormColor(COLORS[0]);
    setFormTarget("");
    setFormSaved("");
    setFormDate("");
    setFormDuration("");
    setFormContribution("");
    setFormMode("preset");
  };

  const handleAddGoal = () => {
    if (!formName.trim() || !formTarget) return;
    addGoal(userEmail, {
      name: `${formName}`,
      category: formCategory,
      emoji: formEmoji,
      targetAmount: Number(formTarget),
      savedAmount: Number(formSaved) || 0,
      targetDate: formDate,
      color: formColor,
      durationMonths: formDuration ? Number(formDuration) : null,
      monthlyContribution: formContribution ? Number(formContribution) : null,
    });
    reload();
    setFormMode(null);
  };

  const handleDelete = (id: string) => {
    deleteGoal(userEmail, id);
    reload();
  };

  const handleUpdateSaved = (goalId: string) => {
    if (!editAmount) { setEditingGoalId(null); return; }
    updateGoal(userEmail, goalId, { savedAmount: Number(editAmount) });
    reload();
    setEditingGoalId(null);
  };

  const totalTargetAmount = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved        = goals.reduce((s, g) => s + g.savedAmount, 0);
  const overallPct        = totalTargetAmount > 0 ? Math.round((totalSaved / totalTargetAmount) * 100) : 0;

  return (
    <div className="flex flex-col min-h-screen pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md p-5 pb-3 border-b border-border/40">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => setActiveTab("home")} className="p-2 bg-card rounded-full border border-border">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">My Goals</h1>
            <p className="text-xs text-foreground/60">Track your financial milestones</p>
          </div>
          <button
            onClick={openCustom}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary to-accent text-white font-semibold text-sm rounded-full shadow-lg shadow-primary/25 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> Add Goal
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Overall progress card */}
        {goals.length > 0 && (
          <div className="bg-gradient-to-br from-accent/20 to-primary/10 border border-accent/20 rounded-3xl p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground/60 mb-1">Overall Goal Progress</p>
              <p className="text-3xl font-bold">{overallPct}%</p>
              <p className="text-xs text-foreground/50 mt-1">
                ₹{totalSaved.toLocaleString("en-IN")} of ₹{totalTargetAmount.toLocaleString("en-IN")} · {goals.length} goal{goals.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="relative w-16 h-16">
              <ProgressRing pct={overallPct} color="#8b5cf6" size={64} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Target className="w-6 h-6 text-accent" />
              </div>
            </div>
          </div>
        )}

        {/* Goal cards */}
        <AnimatePresence>
          {goals.map((g) => {
            const pct = g.targetAmount > 0 ? Math.round((g.savedAmount / g.targetAmount) * 100) : 0;
            const capped = Math.min(pct, 100);
            return (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card border border-border rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{ backgroundColor: g.color + "20" }}>
                      {g.emoji}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{g.name}</p>
                      <p className="text-xs text-foreground/50">
                        {g.category} {g.targetDate && `· Due ${g.targetDate}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: g.color }}>{capped}%</span>
                    <button onClick={() => handleDelete(g.id)} className="p-1.5 hover:bg-danger/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-danger/60" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-border rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${capped}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-2 rounded-full"
                    style={{ backgroundColor: g.color }}
                  />
                </div>

                {/* Amounts row */}
                <div className="flex items-center justify-between">
                  {editingGoalId === g.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        placeholder={g.savedAmount.toString()}
                        className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary/50"
                        autoFocus
                      />
                      <button onClick={() => handleUpdateSaved(g.id)} className="p-1.5 bg-success rounded-lg">
                        <Check className="w-4 h-4 text-white" />
                      </button>
                      <button onClick={() => setEditingGoalId(null)} className="p-1.5 bg-secondary rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingGoalId(g.id); setEditAmount(g.savedAmount.toString()); }}
                      className="text-xs text-foreground/50 hover:text-foreground/80 transition-colors"
                    >
                      ₹{g.savedAmount.toLocaleString("en-IN")} saved · tap to update
                    </button>
                  )}
                  <span className="text-xs text-foreground/40">of ₹{g.targetAmount.toLocaleString("en-IN")}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty state */}
        {goals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
            <div className="w-20 h-20 bg-card border border-border rounded-full flex items-center justify-center">
              <Target className="w-10 h-10 text-foreground/30" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground/70">No goals yet</h3>
              <p className="text-sm text-foreground/50 mt-1">Add your first financial goal to start tracking</p>
            </div>
            <button
              onClick={openCustom}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4 inline mr-1" /> Set Your First Goal
            </button>
          </div>
        )}

        {/* AI Optimize button */}
        {goals.length > 0 && (
          <button
            onClick={() => setActiveTab("advisor")}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-accent to-primary text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-accent/25"
          >
            <Sparkles className="w-5 h-5" /> Ask AI to Optimize Goals
          </button>
        )}
      </div>

      {/* ── Add Goal Overlay ── */}
      <AnimatePresence>
        {formMode !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-end justify-center p-4"
            onClick={() => setFormMode(null)}
          >
            <motion.div
              initial={{ y: 120, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 120, opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
              className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 shrink-0">
                <h2 className="font-bold text-lg">
                  {formMode === "preset" ? "Choose a Goal Type" : `Set Up: ${formName}`}
                </h2>
                <button onClick={() => setFormMode(null)} className="p-2 hover:bg-secondary rounded-full transition-colors">
                  <X className="w-5 h-5 text-foreground/60" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-5 space-y-4">
                {/* Preset Picker */}
                {formMode === "preset" && (
                  <div className="grid grid-cols-2 gap-3">
                    {PRESET_GOALS.map((preset) => {
                      const Icon = preset.icon;
                      return (
                        <button
                          key={preset.name}
                          onClick={() => openPreset(preset)}
                          className="bg-secondary/30 border border-border rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all text-center active:scale-95"
                        >
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                            style={{ backgroundColor: preset.color + "20" }}>
                            {preset.emoji}
                          </div>
                          <p className="text-xs font-semibold leading-tight">{preset.name}</p>
                          <p className="text-[10px] text-foreground/50">{preset.category}</p>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Form */}
                {formMode === "form" && (
                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-1.5 block">Goal Name</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formEmoji}
                          onChange={(e) => setFormEmoji(e.target.value)}
                          maxLength={2}
                          className="w-14 bg-secondary/30 border border-border rounded-xl py-3 text-center text-xl focus:outline-none focus:border-primary/50"
                        />
                        <input
                          type="text"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="e.g. Pay off car EMI"
                          className="flex-1 bg-secondary/30 border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50"
                        />
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-1.5 block">Category</label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full bg-secondary/30 border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 appearance-none"
                      >
                        {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    {/* Target & Saved amounts */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-1.5 block">Target Amount (₹)</label>
                        <input
                          type="number"
                          value={formTarget}
                          onChange={(e) => setFormTarget(e.target.value)}
                          placeholder="500000"
                          className="w-full bg-secondary/30 border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-1.5 block">Already Saved (₹)</label>
                        <input
                          type="number"
                          value={formSaved}
                          onChange={(e) => setFormSaved(e.target.value)}
                          placeholder="0"
                          className="w-full bg-secondary/30 border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50"
                        />
                      </div>
                    </div>

                    {/* Target date */}
                    <div>
                      <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-1.5 block">
                        <Calendar className="w-3 h-3 inline mr-1" />Target Date (optional)
                      </label>
                      <input
                        type="month"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full bg-secondary/30 border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-1.5 block">Duration (months)</label>
                        <input
                          type="number"
                          min="1"
                          value={formDuration}
                          onChange={(e) => setFormDuration(e.target.value)}
                          placeholder="12"
                          className="w-full bg-secondary/30 border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-1.5 block">Monthly Save (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={formContribution}
                          onChange={(e) => setFormContribution(e.target.value)}
                          placeholder="5000"
                          className="w-full bg-secondary/30 border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50"
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-secondary/20 p-3 text-sm text-foreground/70">
                      <p className="font-semibold text-foreground/80">Plan summary</p>
                      <p className="mt-1">{formContribution ? `Save ₹${Number(formContribution).toLocaleString('en-IN')} every month` : 'Add a monthly contribution to build a concrete plan'}</p>
                      {formDuration ? <p className="mt-1">Aim to reach the target in {formDuration} months.</p> : null}
                    </div>

                    {/* Color */}
                    <div>
                      <label className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-1.5 block">Color</label>
                      <div className="flex gap-2">
                        {COLORS.map((c) => (
                          <button
                            key={c}
                            onClick={() => setFormColor(c)}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${formColor === c ? "border-white scale-110" : "border-transparent scale-100"}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Preview */}
                    {formName && formTarget && (
                      <div className="bg-secondary/30 border border-border rounded-2xl p-4 space-y-2">
                        <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">Preview</p>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                            style={{ backgroundColor: formColor + "20" }}>
                            {formEmoji}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{formName}</p>
                            <p className="text-xs text-foreground/50">₹{(Number(formSaved) || 0).toLocaleString("en-IN")} of ₹{Number(formTarget).toLocaleString("en-IN")}</p>
                          </div>
                          <span className="text-sm font-bold" style={{ color: formColor }}>
                            {formTarget ? Math.round(((Number(formSaved) || 0) / Number(formTarget)) * 100) : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-border rounded-full h-1.5">
                          <div className="h-1.5 rounded-full" style={{
                            backgroundColor: formColor,
                            width: `${formTarget ? Math.min(Math.round(((Number(formSaved) || 0) / Number(formTarget)) * 100), 100) : 0}%`
                          }} />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={() => setFormMode("preset")}
                        className="flex-1 py-3 rounded-xl border border-border font-semibold text-sm hover:bg-secondary/40 transition-colors"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={handleAddGoal}
                        disabled={!formName.trim() || !formTarget}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Save Goal ✓
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
