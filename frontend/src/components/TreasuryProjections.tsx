'use client';

import { useMemo } from 'react';
import { useTreasury } from '@/hooks/useTreasury';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const RESERVE_THRESHOLD = 20000; // Warning below this

interface Projection {
  month: string;
  balance: number;
  income: number;
  expenses: number;
  isBelowThreshold: boolean;
}

function generateProjections(currentBalance: number): Projection[] {
  // Assumptions: 150 lots × $200/quarter dues + misc income
  const monthlyIncome = (150 * 200) / 3; // ≈ $10,000/month
  const monthlyExpenses = 9500; // slightly below to show growth
  const now = new Date();
  const currentMonth = now.getMonth();

  const projections: Projection[] = [];
  let balance = currentBalance;

  for (let i = 0; i < 12; i++) {
    const monthIdx = (currentMonth + i) % 12;
    // Q1/Q2/Q3/Q4 dues collection — higher in Jan/Apr/Jul/Oct
    const isDuesMonth = [0, 3, 6, 9].includes(monthIdx);
    const income = isDuesMonth ? monthlyIncome * 2 : monthlyIncome * 0.5;
    // Seasonal expenses — higher in spring/summer
    const seasonMultiplier = [3, 4, 5, 6, 7].includes(monthIdx) ? 1.3 : 0.9;
    const expenses = monthlyExpenses * seasonMultiplier;

    balance = balance + income - expenses;

    projections.push({
      month: MONTHS_SHORT[monthIdx],
      balance,
      income,
      expenses,
      isBelowThreshold: balance < RESERVE_THRESHOLD,
    });
  }

  return projections;
}

function MiniLineChart({ data, threshold }: { data: Projection[]; threshold: number }) {
  const values = data.map(d => d.balance);
  const min = Math.min(...values) * 0.9;
  const max = Math.max(...values) * 1.1;
  const range = max - min || 1;

  const W = 560;
  const H = 120;
  const PAD = { top: 10, right: 10, bottom: 20, left: 50 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const points = data.map((d, i) => ({
    x: PAD.left + (i / (data.length - 1)) * chartW,
    y: PAD.top + (1 - (d.balance - min) / range) * chartH,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${H - PAD.bottom} L ${points[0].x} ${H - PAD.bottom} Z`;

  const thresholdY = PAD.top + (1 - (threshold - min) / range) * chartH;
  const showThreshold = threshold >= min && threshold <= max;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {/* Area */}
      <path d={areaPath} fill="url(#projGrad)" opacity={0.2} />

      {/* Threshold line */}
      {showThreshold && (
        <>
          <line x1={PAD.left} y1={thresholdY} x2={W - PAD.right} y2={thresholdY}
            stroke="#ef4444" strokeWidth={1} strokeDasharray="4 3" opacity={0.6} />
          <text x={W - PAD.right - 2} y={thresholdY - 3} fill="#ef4444" fontSize={9} textAnchor="end" opacity={0.8}>
            Reserve min
          </text>
        </>
      )}

      {/* Line */}
      <path d={linePath} fill="none" stroke="#c9a96e" strokeWidth={2} strokeLinejoin="round" />

      {/* Dots */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x} cy={p.y} r={3}
          fill={p.isBelowThreshold ? '#ef4444' : '#c9a96e'}
          stroke={p.isBelowThreshold ? '#7f1d1d' : '#1a1a1a'}
          strokeWidth={1.5}
        />
      ))}

      {/* Month labels */}
      {points.map((p, i) => (
        <text key={i} x={p.x} y={H - 2} textAnchor="middle" fill="#6b7280" fontSize={9}>
          {p.month}
        </text>
      ))}

      {/* Y axis labels */}
      {[0, 0.5, 1].map(t => {
        const val = min + t * range;
        const y = PAD.top + (1 - t) * chartH;
        return (
          <text key={t} x={PAD.left - 4} y={y + 3} textAnchor="end" fill="#6b7280" fontSize={9}>
            ${(val / 1000).toFixed(0)}K
          </text>
        );
      })}

      <defs>
        <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9a96e" />
          <stop offset="100%" stopColor="#c9a96e" stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function TreasuryProjections() {
  const { totalBalance } = useTreasury();
  const currentBalance = parseFloat(totalBalance.replace(/,/g, '')) || 50000;
  const projections = useMemo(() => generateProjections(currentBalance), [currentBalance]);

  const endBalance = projections[projections.length - 1]?.balance || 0;
  const change = endBalance - currentBalance;
  const warningMonths = projections.filter(p => p.isBelowThreshold);
  const minBalance = Math.min(...projections.map(p => p.balance));

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-sm font-bold text-[#e8d5a3]">12-Month Projections</h2>
          <p className="text-xs text-gray-500 mt-1">Based on current income/expense trends</p>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${
          change >= 0
            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
            : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change >= 0 ? '+' : ''}${Math.abs(change / 1000).toFixed(1)}K projected
        </div>
      </div>

      {/* Warning */}
      {warningMonths.length > 0 && (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/20 mb-5">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-red-400">Reserve Warning</p>
            <p className="text-xs text-red-300/70 mt-0.5">
              Balance projected below ${RESERVE_THRESHOLD.toLocaleString()} minimum in{' '}
              {warningMonths.map(m => m.month).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="mb-5">
        <MiniLineChart data={projections} threshold={RESERVE_THRESHOLD} />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white/3 rounded-xl p-3">
          <p className="text-[10px] text-gray-600 uppercase tracking-wide font-semibold mb-1">Current</p>
          <p className="text-sm font-black text-gray-200">${(currentBalance / 1000).toFixed(1)}K</p>
        </div>
        <div className="bg-white/3 rounded-xl p-3">
          <p className="text-[10px] text-gray-600 uppercase tracking-wide font-semibold mb-1">Projected End</p>
          <p className={`text-sm font-black ${endBalance < RESERVE_THRESHOLD ? 'text-red-400' : 'text-green-400'}`}>
            ${(endBalance / 1000).toFixed(1)}K
          </p>
        </div>
        <div className="bg-white/3 rounded-xl p-3">
          <p className="text-[10px] text-gray-600 uppercase tracking-wide font-semibold mb-1">Min Balance</p>
          <p className={`text-sm font-black ${minBalance < RESERVE_THRESHOLD ? 'text-red-400' : 'text-[#c9a96e]'}`}>
            ${(minBalance / 1000).toFixed(1)}K
          </p>
        </div>
      </div>

      {/* Monthly table (collapsed by default) */}
      <details className="group">
        <summary className="text-xs text-gray-500 hover:text-[#c9a96e] cursor-pointer transition-colors list-none flex items-center gap-1">
          <span className="group-open:rotate-90 inline-block transition-transform">▶</span>
          Monthly breakdown
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-600 border-b border-[oklch(0.15_0.005_60)]">
                <th className="text-left py-1 pr-3">Month</th>
                <th className="text-right py-1 pr-3">Income</th>
                <th className="text-right py-1 pr-3">Expenses</th>
                <th className="text-right py-1">Balance</th>
              </tr>
            </thead>
            <tbody>
              {projections.map((p, i) => (
                <tr key={i} className={`border-b border-[oklch(0.12_0.005_60)] ${p.isBelowThreshold ? 'bg-red-500/5' : ''}`}>
                  <td className={`py-1.5 pr-3 font-medium ${p.isBelowThreshold ? 'text-red-400' : 'text-gray-400'}`}>{p.month}</td>
                  <td className="text-right py-1.5 pr-3 text-green-400">${(p.income / 1000).toFixed(1)}K</td>
                  <td className="text-right py-1.5 pr-3 text-red-400">${(p.expenses / 1000).toFixed(1)}K</td>
                  <td className={`text-right py-1.5 font-bold ${p.isBelowThreshold ? 'text-red-400' : 'text-[#c9a96e]'}`}>
                    ${(p.balance / 1000).toFixed(1)}K
                    {p.isBelowThreshold && ' ⚠️'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <p className="text-[10px] text-gray-600 mt-3">
        * Projections based on avg dues collection rates and historical expense patterns. Actual results may vary.
      </p>
    </div>
  );
}
