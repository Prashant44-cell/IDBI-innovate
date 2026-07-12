"use client";

import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Sparkles, Utensils, Home, Plane, ShoppingBag, ArrowLeft } from "lucide-react";
import Link from "next/link";

const expensesData = [
  { name: 'Food', value: 12000, color: '#3b82f6', icon: Utensils },
  { name: 'Rent', value: 25000, color: '#8b5cf6', icon: Home },
  { name: 'Travel', value: 4500, color: '#10b981', icon: Plane },
  { name: 'Shopping', value: 8000, color: '#f59e0b', icon: ShoppingBag },
];

export default function SpendingAnalysis() {
  const total = expensesData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="p-2 bg-card rounded-full border border-border">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">Spending Analysis</h1>
      </div>

      <div className="bg-gradient-to-r from-accent/20 to-primary/20 border border-primary/20 rounded-2xl p-4 flex gap-4 items-start shadow-lg">
        <div className="p-2 bg-primary/20 rounded-full shrink-0">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-primary mb-1">AI Insight</h3>
          <p className="text-sm text-foreground/80 leading-relaxed">
            You are spending 15% more on Shopping this month. Reduce shopping by ₹3,000 to hit your savings goal!
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col items-center">
        <div className="h-48 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={expensesData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {expensesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-sm text-foreground/50">Total</span>
            <span className="text-xl font-bold">₹{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold mb-2">Categories</h3>
        {expensesData.map((item) => (
          <div key={item.name} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${item.color}20` }}>
                <item.icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-xs text-foreground/50">{((item.value / total) * 100).toFixed(0)}% of total</p>
              </div>
            </div>
            <span className="font-bold">₹{item.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
