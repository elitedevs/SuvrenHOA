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
  { key: 'water', label: 'Water', icon: '', color: '#3b82f6' },
  { key: 'electric', label: 'Electric', icon: '', color: '#eab308' },
  { key: 'gas', label: 'Gas', icon: '', color: '#f97316' },
  { key: 'internet', label: 'Internet', icon: '', color: '#8b5cf6' },
  { key: 'waste', label: 'Waste', icon: '', color: '#22c55e' },
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
      <p className="text-gray-400 mb-4">Sign in to view utility data</p>
      <ConnectButton label="Sign In" />
    </div>
  );

  if (data.length === 0) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  const latest = data[data.length - 1];
  const prevYear = data.slice(0, 12);
  const thisYear = data.slice(data.length - 12);

  const totalLatest = UTIL_CONFIG.reduce((s, u) => s + (latest as any)[u.key], 0);
  const maxBar = Math.max(...data.map(d => (d as any)[selectedUtil]));
  const cfg = UTIL_CONFIG.find(u => u.key === selectedUtil)!;

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Utility Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Community-wide utility cost tracking</p>
        </div>
        <div className="flex gap-2">
          {(['overview', 'trend', 'breakdown'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-2 rounded-md text-xs font-medium capitalize transition-all ${view === v ? 'bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/30' : 'glass-card text-gray-400'}`}>
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
              className={`glass-card rounded-md p-4 text-left transition-all ${selectedUtil === u.key ? 'border-[#c9a96e]/30 bg-[#c9a96e]/5' : 'hover:border-gray-600'}`}>
              <p className="text-lg mb-1">{u.icon}</p>
              <p className="text-[10px] text-gray-400">{u.label}</p>
              <p className="text-base font-bold" style={{ color: u.color }}>${actual.toLocaleString()}</p>
              <p className={`text-[10px] ${over ? 'text-red-400' : 'text-green-400'}`}>
                {over ? '↑' : '↓'} vs ${budget.toLocaleString()} budget
              </p>
            </button>
          );
        })}
      </div>

      {view === 'overview' && (
        <>
          <div className="glass-card rounded-md p-5 mb-5">
            <h3 className="text-sm font-semibold mb-4">Current Month Total: ${totalLatest.toLocaleString()}</h3>
            <div className="space-y-3">
              {UTIL_CONFIG.map(u => {
                const actual = (latest as any)[u.key];
                const budget = BUDGET[u.key];
                const pct = Math.min(100, (actual / budget) * 100);
                return (
                  <div key={u.key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">{u.icon} {u.label}</span>
                      <span className={pct > 100 ? 'text-red-400' : 'text-gray-300'}>${actual.toLocaleString()} / ${budget.toLocaleString()}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-800">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: pct > 100 ? '#ef4444' : u.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-card rounded-md p-5">
            <h3 className="text-sm font-semibold mb-1">Year-over-Year Comparison</h3>
            <p className="text-xs text-gray-500 mb-4">Total community spend</p>
            <div className="grid grid-cols-2 gap-4">
              {UTIL_CONFIG.map(u => {
                const thisTotal = thisYear.reduce((s, d) => s + (d as any)[u.key], 0);
                const prevTotal = prevYear.reduce((s, d) => s + (d as any)[u.key], 0);
                const delta = prevTotal > 0 ? ((thisTotal - prevTotal) / prevTotal) * 100 : 0;
                return (
                  <div key={u.key} className="p-3 rounded-md bg-gray-800/30">
                    <p className="text-xs text-gray-400">{u.icon} {u.label}</p>
                    <p className="text-sm font-semibold mt-1">${thisTotal.toLocaleString()}</p>
                    <p className={`text-[10px] ${delta < 0 ? 'text-green-400' : 'text-red-400'}`}>
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
        <div className="glass-card rounded-md p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold">{cfg.icon} {cfg.label} — 12-Month Trend</h3>
            <div className="flex gap-1">
              {UTIL_CONFIG.map(u => (
                <button key={u.key} onClick={() => setSelectedUtil(u.key)}
                  className={`px-2 py-1 rounded text-[10px] transition-all ${selectedUtil === u.key ? 'text-white' : 'text-gray-500'}`}
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
                    <div className="absolute -top-5 hidden group-hover:block bg-gray-800 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap">
                      ${val.toLocaleString()}
                    </div>
                  </div>
                  <span className="text-[9px] text-gray-500">{monthNames[parseInt(label) - 1]}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-gray-500 mt-4 pt-4 border-t border-gray-800">
            <span>Budget: ${BUDGET[selectedUtil].toLocaleString()}/mo</span>
            <span>Avg: ${Math.round(data.reduce((s,d) => s+(d as any)[selectedUtil],0)/data.length).toLocaleString()}/mo</span>
            <span>Latest: ${(latest as any)[selectedUtil].toLocaleString()}</span>
          </div>
        </div>
      )}

      {view === 'breakdown' && (
        <div className="glass-card rounded-md p-5">
          <h3 className="text-sm font-semibold mb-4">Per-Unit Breakdown — {latest.month}</h3>
          <p className="text-xs text-gray-500 mb-4">{TOTAL_UNITS} occupied units</p>
          <div className="space-y-4">
            {UTIL_CONFIG.map(u => {
              const total = (latest as any)[u.key];
              const perUnit = total / TOTAL_UNITS;
              return (
                <div key={u.key} className="flex items-center gap-4 p-3 rounded-md bg-gray-800/30">
                  <span className="text-2xl">{u.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{u.label}</p>
                    <p className="text-xs text-gray-500">Community total: ${total.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: u.color }}>${perUnit.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-500">per unit</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-3 rounded-md bg-[#c9a96e]/5 border border-[#c9a96e]/10">
            <p className="text-xs text-[#c9a96e] font-medium">Total per unit this month</p>
            <p className="text-xl font-bold text-white">${(totalLatest / TOTAL_UNITS).toFixed(2)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
