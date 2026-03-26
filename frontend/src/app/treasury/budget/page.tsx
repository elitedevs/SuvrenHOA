'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface BudgetCategory {
  name: string;
  emoji: string;
  thisYear: number;
  lastYear: number;
  color: string;
}

const DEFAULT_BUDGET: BudgetCategory[] = [
  { name: 'Maintenance', emoji: '🔧', thisYear: 35000, lastYear: 32000, color: '#c9a96e' },
  { name: 'Landscaping', emoji: '🌿', thisYear: 18000, lastYear: 16500, color: '#4ade80' },
  { name: 'Insurance', emoji: '🛡️', thisYear: 22000, lastYear: 21000, color: '#60a5fa' },
  { name: 'Reserves', emoji: '🏦', thisYear: 24000, lastYear: 24000, color: '#a78bfa' },
  { name: 'Legal', emoji: '⚖️', thisYear: 8000, lastYear: 5000, color: '#fb923c' },
  { name: 'Admin', emoji: '📋', thisYear: 6000, lastYear: 5500, color: '#f472b6' },
  { name: 'Events', emoji: '🎉', thisYear: 7000, lastYear: 6000, color: '#34d399' },
];

const LS_KEY = 'suvren_budget_2026';

function loadBudget(): BudgetCategory[] {
  if (typeof window === 'undefined') return DEFAULT_BUDGET;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      return DEFAULT_BUDGET.map((d, i) => ({ ...d, thisYear: saved[i]?.thisYear ?? d.thisYear }));
    }
  } catch {}
  return DEFAULT_BUDGET;
}

function saveBudget(budget: BudgetCategory[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(budget));
}

function PieChart({ categories, total }: { categories: BudgetCategory[]; total: number }) {
  let cumulative = 0;
  const segments = categories.map((cat) => {
    const pct = total > 0 ? cat.thisYear / total : 0;
    const startAngle = cumulative * 360;
    cumulative += pct;
    const endAngle = cumulative * 360;
    return { ...cat, pct, startAngle, endAngle };
  });

  function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function describeArc(cx: number, cy: number, r: number, start: number, end: number) {
    const s = polarToCartesian(cx, cy, r, start);
    const e = polarToCartesian(cx, cy, r, end);
    const large = end - start > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg width="180" height="180" viewBox="0 0 180 180" className="shrink-0">
        {segments.map((seg, i) => {
          if (seg.pct === 0) return null;
          const endAngle = seg.startAngle + (seg.endAngle - seg.startAngle) - 0.5;
          return (
            <path
              key={i}
              d={describeArc(90, 90, 80, seg.startAngle, Math.max(seg.startAngle + 0.1, endAngle))}
              fill={seg.color}
              opacity={0.85}
              stroke="#1a1a1a"
              strokeWidth={2}
            />
          );
        })}
        <circle cx="90" cy="90" r="40" fill="#1a1a1a" />
        <text x="90" y="85" textAnchor="middle" fill="#e8d5a3" fontSize="12" fontWeight="bold">Total</text>
        <text x="90" y="102" textAnchor="middle" fill="#c9a96e" fontSize="11">
          ${(total / 1000).toFixed(0)}K
        </text>
      </svg>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
        {segments.map((seg) => (
          <div key={seg.name} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: seg.color }} />
            <span className="text-gray-400">{seg.name}</span>
            <span className="text-gray-500 font-mono">{(seg.pct * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BudgetPlannerPage() {
  const { isConnected } = useAccount();
  const [budget, setBudget] = useState<BudgetCategory[]>(loadBudget);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 mb-4">Sign in to view the budget planner</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  const total = budget.reduce((s, c) => s + c.thisYear, 0);
  const lastTotal = budget.reduce((s, c) => s + c.lastYear, 0);
  const diff = total - lastTotal;

  function updateAmount(i: number, val: string) {
    const n = parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
    setBudget(prev => {
      const next = [...prev];
      next[i] = { ...next[i], thisYear: n };
      return next;
    });
  }

  function handleSave() {
    saveBudget(budget);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 page-enter">
      {/* Header */}
      <div className="mb-8">
        <Link href="/treasury" className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#c9a96e] mb-4 transition-colors">
          <ChevronLeft className="w-3 h-3" /> Back to Treasury
        </Link>
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">Annual Planning</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Budget Planner</h1>
        <p className="text-gray-400 text-sm mt-2">Plan and allocate annual HOA budget — FY 2026</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">FY 2026 Total</p>
          <p className="text-2xl font-black text-[#c9a96e]">${total.toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">FY 2025 Total</p>
          <p className="text-2xl font-black text-gray-400">${lastTotal.toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">YoY Change</p>
          <p className={`text-2xl font-black ${diff > 0 ? 'text-red-400' : diff < 0 ? 'text-green-400' : 'text-gray-400'}`}>
            {diff >= 0 ? '+' : ''}${diff.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Pie chart */}
      <div className="glass-card rounded-2xl p-7 mb-8">
        <h2 className="text-sm font-bold text-[#e8d5a3] mb-5">Budget Allocation</h2>
        <PieChart categories={budget} total={total} />
      </div>

      {/* Categories table */}
      <div className="glass-card rounded-2xl overflow-hidden mb-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[oklch(0.18_0.005_60)]">
          <h2 className="text-sm font-bold text-[#e8d5a3]">Category Breakdown</h2>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button
                  onClick={() => { setBudget(loadBudget()); setEditing(false); }}
                  className="text-xs px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-300 border border-gray-700/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[#c9a96e]/20 border border-[#c9a96e]/30 text-[#e8d5a3] hover:bg-[#c9a96e]/30 transition-colors"
                >
                  Save
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="text-xs px-3 py-1.5 rounded-lg bg-[#c9a96e]/10 border border-[#c9a96e]/20 text-[#c9a96e] hover:bg-[#c9a96e]/20 transition-colors"
              >
                ✏️ Edit (Board Only)
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-[oklch(0.15_0.005_60)]">
          {budget.map((cat, i) => {
            const pct = total > 0 ? (cat.thisYear / total) * 100 : 0;
            const yoyDiff = cat.thisYear - cat.lastYear;
            return (
              <div key={cat.name} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                <span className="text-xl w-8 text-center">{cat.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-200">{cat.name}</span>
                    <div className="flex items-center gap-4">
                      {editing ? (
                        <input
                          type="number"
                          value={cat.thisYear}
                          onChange={e => updateAmount(i, e.target.value)}
                          className="w-28 px-2 py-1 text-right text-sm bg-white/5 border border-[#c9a96e]/30 rounded-lg text-[#e8d5a3] focus:outline-none focus:border-[#c9a96e]/60"
                        />
                      ) : (
                        <span className="text-sm font-bold text-[#e8d5a3]">${cat.thisYear.toLocaleString()}</span>
                      )}
                      <span className={`text-xs font-medium w-16 text-right ${yoyDiff > 0 ? 'text-red-400' : yoyDiff < 0 ? 'text-green-400' : 'text-gray-600'}`}>
                        {yoyDiff >= 0 ? '+' : ''}${yoyDiff.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500 w-10 text-right">{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: cat.color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 bg-white/[0.02] border-t border-[oklch(0.18_0.005_60)] flex items-center justify-between">
          <span className="text-sm font-bold text-gray-300">Total Budget</span>
          <span className="text-lg font-black text-[#c9a96e]">${total.toLocaleString()}</span>
        </div>
      </div>

      {saved && (
        <div className="fixed bottom-6 right-6 bg-[#c9a96e] text-[#1a1a1a] px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg">
          ✅ Budget saved!
        </div>
      )}
    </div>
  );
}
