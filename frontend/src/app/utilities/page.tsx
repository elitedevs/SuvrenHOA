'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface UtilityMonth {
  month: string; // YYYY-MM
  water: number;
  electric: number;
  gas: number;
  internet: number;
  waste: number;
}

const BUDGET: Record<string, number> = {
  water: 3200,
  electric: 4800,
  gas: 1200,
  internet: 400,
  waste: 600,
};

const STORAGE_KEY = 'faircroft_utilities_v1';

function generateSampleData(): UtilityMonth[] {
  const months: UtilityMonth[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push({
      month: m,
      water: Math.round(2800 + Math.random() * 800),
      electric: Math.round(4200 + Math.random() * 1200),
      gas: Math.round(900 + Math.random() * 600),
      internet: Math.round(380 + Math.random() * 40),
      waste: Math.round(550 + Math.random() * 100),
    });
  }
  return months;
}

const UTIL_CONFIG = [
  { key: 'water', label: 'Water', icon: '', color: '#2C2C2E' },
  { key: 'electric', label: 'Electric', icon: '', color: '#B09B71' },
  { key: 'gas', label: 'Gas', icon: '', color: '#b8942e' },
  { key: 'internet', label: 'Internet', icon: '', color: '#8B5A5A' },
  { key: 'waste', label: 'Waste', icon: '', color: '#2A5D4F' },
];

const TOTAL_UNITS = 50;

export default function UtilitiesPage() {
  const { isConnected } = useAccount();
  const [data, setData] = useState<UtilityMonth[]>([]);
  const [selectedUtil, setSelectedUtil] = useState('electric');
  const [view, setView] = useState<'overview' | 'trend' | 'breakdown'>('overview');

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    setData(raw ? JSON.parse(raw) : generateSampleData());
  }, []);

  if (!isConnected) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <p className="text-[var(--text-muted)] mb-4">Sign in to view utility data</p>
      <ConnectButton label="Sign In" />
    </div>
  );

  if (data.length === 0) return <div className="text-center py-12 text-[var(--text-disabled)]">Loading...</div>;

  const latest = data[data.length - 1];
  const prevYear = data.slice(0, 12);
  const thisYear = data.slice(data.length - 12);

  const totalLatest = UTIL_CONFIG.reduce((s, u) => s + (latest as any)[u.key], 0);
  const maxBar = Math.max(...data.map(d => (d as any)[selectedUtil]));
  const cfg = UTIL_CONFIG.find(u => u.key === selectedUtil)!;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-medium gradient-text sm:">Utility Dashboard</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Community-wide utility cost tracking</p>
        </div>
        <div className="flex gap-2">
          {(['overview', 'trend', 'breakdown'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all ${view === v ? 'bg-[rgba(176,155,113,0.15)] text-[#B09B71] border border-[rgba(176,155,113,0.30)]' : 'glass-card text-[var(--text-muted)]'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {UTIL_CONFIG.map(u => {
          const actual = (latest as any)[u.key];
          const budget = BUDGET[u.key];
          const over = actual > budget;
          return (
            <button key={u.key} onClick={() => { setSelectedUtil(u.key); setView('trend'); }}
              className={`glass-card rounded-xl p-4 text-left transition-all ${selectedUtil === u.key ? 'border-[rgba(176,155,113,0.30)] bg-[rgba(176,155,113,0.05)]' : 'hover:border-[rgba(245,240,232,0.10)]'}`}>
              <p className="text-lg mb-1">{u.icon}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{u.label}</p>
              <p className="text-base font-medium" style={{ color: u.color }}>${actual.toLocaleString()}</p>
              <p className={`text-[10px] ${over ? 'text-[#8B5A5A]' : 'text-[#2A5D4F]'}`}>
                {over ? '↑' : '↓'} vs ${budget.toLocaleString()} budget
              </p>
            </button>
          );
        })}
      </div>

      {view === 'overview' && (
        <>
          <div className="glass-card rounded-xl p-5 mb-5">
            <h3 className="text-sm font-medium mb-4">Current Month Total: ${totalLatest.toLocaleString()}</h3>
            <div className="space-y-3">
              {UTIL_CONFIG.map(u => {
                const actual = (latest as any)[u.key];
                const budget = BUDGET[u.key];
                const pct = Math.min(100, (actual / budget) * 100);
                const over = actual > budget;
                return (
                  <div key={u.key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--text-muted)] flex items-center gap-1">
                        {u.icon} {u.label}
                        {over && (
                          <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full bg-[rgba(107,58,58,0.12)] text-[#8B5A5A] border border-[rgba(107,58,58,0.25)] font-medium">
                            OVER BUDGET
                          </span>
                        )}
                      </span>
                      <span className={over ? 'text-[#8B5A5A] font-medium' : 'text-[var(--text-body)]'}>${actual.toLocaleString()} / ${budget.toLocaleString()}</span>
                    </div>
                    <div className={`h-2 rounded-full bg-[var(--surface-2)] ${over ? 'ring-1 ring-[rgba(107,58,58,0.50)]/50' : ''}`}>
                      <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: over ? '#8B5A5A' : u.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-medium mb-1">Year-over-Year Comparison</h3>
            <p className="text-xs text-[var(--text-disabled)] mb-4">Total community spend</p>
            <div className="grid grid-cols-2 gap-4">
              {UTIL_CONFIG.map(u => {
                const thisTotal = thisYear.reduce((s, d) => s + (d as any)[u.key], 0);
                const prevTotal = prevYear.reduce((s, d) => s + (d as any)[u.key], 0);
                const delta = prevTotal > 0 ? ((thisTotal - prevTotal) / prevTotal) * 100 : 0;
                return (
                  <div key={u.key} className="p-3 rounded-xl bg-[rgba(26,26,30,0.30)]">
                    <p className="text-xs text-[var(--text-muted)]">{u.icon} {u.label}</p>
                    <p className="text-sm font-medium mt-1">${thisTotal.toLocaleString()}</p>
                    <p className={`text-[10px] ${delta < 0 ? 'text-[#2A5D4F]' : 'text-[#8B5A5A]'}`}>
                      {delta > 0 ? '+' : ''}{delta.toFixed(1)}% vs last year
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {view === 'trend' && (
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-medium">{cfg.icon} {cfg.label} — 12-Month Trend</h3>
            <div className="flex gap-1">
              {UTIL_CONFIG.map(u => (
                <button key={u.key} onClick={() => setSelectedUtil(u.key)}
                  className={`px-2 py-1 rounded text-[10px] transition-all ${selectedUtil === u.key ? 'text-[var(--text-heading)]' : 'text-[var(--text-disabled)]'}`}
                  style={selectedUtil === u.key ? { backgroundColor: u.color + '33', color: u.color } : {}}>
                  {u.icon}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-2 h-40">
            {data.slice(-12).map((d, i) => {
              const val = (d as any)[selectedUtil];
              const height = maxBar > 0 ? (val / maxBar) * 100 : 0;
              const label = d.month.slice(5); // MM
              const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="relative w-full flex items-end justify-center" style={{ height: '120px' }}>
                    <div className="w-full rounded-t-md transition-all group-hover:opacity-80"
                      style={{ height: `${height}%`, backgroundColor: cfg.color + '80', minHeight: '4px' }} />
                    <div className="absolute -top-5 hidden group-hover:block bg-[var(--surface-2)] text-[var(--text-heading)] text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap">
                      ${val.toLocaleString()}
                    </div>
                  </div>
                  <span className="text-[9px] text-[var(--text-disabled)]">{monthNames[parseInt(label) - 1]}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-[var(--text-disabled)] mt-4 pt-4 border-t border-[rgba(245,240,232,0.06)]">
            <span>Budget: ${BUDGET[selectedUtil].toLocaleString()}/mo</span>
            <span>Avg: ${Math.round(data.reduce((s,d) => s+(d as any)[selectedUtil],0)/data.length).toLocaleString()}/mo</span>
            <span>Latest: ${(latest as any)[selectedUtil].toLocaleString()}</span>
          </div>
        </div>
      )}

      {view === 'breakdown' && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-medium mb-4">Per-Unit Breakdown — {latest.month}</h3>
          <p className="text-xs text-[var(--text-disabled)] mb-4">{TOTAL_UNITS} occupied units</p>
          <div className="space-y-4">
            {UTIL_CONFIG.map(u => {
              const total = (latest as any)[u.key];
              const perUnit = total / TOTAL_UNITS;
              return (
                <div key={u.key} className="flex items-center gap-4 p-3 rounded-xl bg-[rgba(26,26,30,0.30)]">
                  <span className="text-2xl">{u.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{u.label}</p>
                    <p className="text-xs text-[var(--text-disabled)]">Community total: ${total.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium" style={{ color: u.color }}>${perUnit.toFixed(2)}</p>
                    <p className="text-[10px] text-[var(--text-disabled)]">per unit</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-[rgba(176,155,113,0.05)] border border-[rgba(176,155,113,0.10)]">
            <p className="text-xs text-[#B09B71] font-medium">Total per unit this month</p>
            <p className="text-xl font-medium text-[var(--text-heading)]">${(totalLatest / TOTAL_UNITS).toFixed(2)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
