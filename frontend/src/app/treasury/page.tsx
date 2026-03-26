'use client';

import { useState } from 'react';
import { useTreasury } from '@/hooks/useTreasury';
import { TreasuryProjections } from '@/components/TreasuryProjections';
import Link from 'next/link';

function exportTreasuryPDF() {
  // Add print-specific class to body so @media print styles kick in
  document.body.classList.add('printing-treasury');
  window.print();
  setTimeout(() => document.body.classList.remove('printing-treasury'), 500);
}

export default function TreasuryPage() {
  const {
    totalBalance,
    operatingBalance,
    reserveBalance,
    expenditureCount,
  } = useTreasury();

  // Parse balances for progress bar calculation
  const total = parseFloat(totalBalance.replace(/,/g, '')) || 0;
  const operating = parseFloat(operatingBalance.replace(/,/g, '')) || 0;
  const reserve = parseFloat(reserveBalance.replace(/,/g, '')) || 0;

  const operatingPct = total > 0 ? (operating / total) * 100 : 80;
  const reservePct = total > 0 ? (reserve / total) * 100 : 20;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 page-enter">
      {/* Page header */}
      <div className="mb-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">On-Chain Finance</p>
          <h1 className="text-3xl font-extrabold tracking-tight">Community Treasury</h1>
          <p className="text-base text-gray-400 mt-2 font-medium">
            Every dollar publicly recorded and verifiable on the blockchain
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/treasury/budget"
            className="no-print w-full sm:w-auto shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#c9a96e]/10 border border-[#c9a96e]/20 hover:border-[#c9a96e]/40 text-sm font-medium text-[#c9a96e] hover:text-[#e8d5a3] transition-all"
          >
             Budget Planner
          </Link>
          <button
            onClick={exportTreasuryPDF}
            className="no-print w-full sm:w-auto shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800/60 border border-gray-700/60 hover:border-[#c9a96e]/30 text-sm font-medium text-gray-400 hover:text-[#e8d5a3] transition-all"
            title="Export as PDF"
          >
             Export PDF
          </button>
        </div>
      </div>

      {/* Hero Balance */}
      <div className="glass-card rounded-2xl hover-lift p-10 text-center glow-gold mb-6 border-l-2 border-l-[#c9a96e]/50 page-enter page-enter-delay-1">
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-4">Total Community Balance</p>
        <div className="flex items-baseline justify-center gap-3 mb-2">
          <span className="text-6xl sm:text-7xl font-black gradient-text">${totalBalance}</span>
          <span className="text-2xl font-bold text-gray-500">USDC</span>
        </div>
        <p className="text-sm text-gray-500 mt-2">Combined operating + reserve fund</p>
      </div>

      {/* Operating + Reserve as visual gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8 page-enter page-enter-delay-2">
        {/* Operating Fund */}
        <div className="glass-card-success rounded-2xl p-7 border-l-2 border-l-green-500/50">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-green-400/70 font-semibold uppercase tracking-wide mb-1">Operating Fund</p>
              <p className="text-3xl font-extrabold text-green-400">${operatingBalance}</p>
              <p className="text-xs text-gray-500 mt-1">USDC · Day-to-day expenses</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-xl">
              
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500 font-medium">
              <span>80% of dues</span>
              <span className="text-green-400 font-bold">{operatingPct.toFixed(0)}%</span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill bg-gradient-to-r from-green-600 to-green-400"
                style={{ width: `${operatingPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Reserve Fund */}
        <div className="glass-card-info rounded-2xl p-7 border-l-2 border-l-blue-500/50">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-blue-400/70 font-semibold uppercase tracking-wide mb-1">Reserve Fund</p>
              <p className="text-3xl font-extrabold text-blue-400">${reserveBalance}</p>
              <p className="text-xs text-gray-500 mt-1">USDC · Long-term reserves</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl">
              
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500 font-medium">
              <span>20% of dues</span>
              <span className="text-blue-400 font-bold">{reservePct.toFixed(0)}%</span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill bg-gradient-to-r from-blue-600 to-blue-400"
                style={{ width: `${reservePct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Balance allocation visual bar */}
      <div className="glass-card rounded-2xl hover-lift p-6 mb-8 page-enter page-enter-delay-2">
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-4">Allocation Overview</p>
        <div className="h-3 rounded-full overflow-hidden flex">
          <div
            className="bg-gradient-to-r from-green-600 to-green-400 transition-all duration-700"
            style={{ width: `${operatingPct}%` }}
          />
          <div
            className="bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-700"
            style={{ width: `${reservePct}%` }}
          />
        </div>
        <div className="flex justify-between mt-3 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span>Operating <span className="font-bold text-green-400">{operatingPct.toFixed(0)}%</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>Reserve <span className="font-bold text-blue-400">{reservePct.toFixed(0)}%</span></span>
          </div>
        </div>
      </div>

      {/* Expenditures section */}
      <div className="page-enter page-enter-delay-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-200">Expenditures</h2>
          <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-800/60 border border-gray-700/60 text-gray-400">
            {expenditureCount} total
          </span>
        </div>

        {expenditureCount === 0 ? (
          <div className="glass-card rounded-2xl hover-lift p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-800/50 border border-gray-700/30 flex items-center justify-center text-2xl mx-auto mb-4">
              
            </div>
            <h3 className="text-lg font-bold mb-2 text-gray-200">No Expenditures Yet</h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              All community spending will be recorded here with full transparency.
              Every transaction is verifiable on-chain — permanently.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Loading expenditures...</p>
          </div>
        )}
      </div>

      {/* Financial Projections */}
      <div className="mb-8 page-enter page-enter-delay-3">
        <TreasuryProjections />
      </div>

      {/* Spending Breakdown */}
      <SpendingBreakdown />

      {/* On-chain banner */}
      <div className="mt-8 glass-card rounded-2xl hover-lift p-6 border-l-2 border-l-[#c9a96e]/40 bg-[#1a1a1a]/30 page-enter page-enter-delay-4">
        <div className="flex items-start gap-3">
          <span className="text-xl"></span>
          <div>
            <h3 className="text-sm font-bold text-[#e8d5a3] mb-1">On-Chain Transparency</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Every dollar in and out is permanently recorded on the Base blockchain.
              Anyone can verify these numbers at any time — they cannot be altered.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const SPENDING_CATEGORIES = [
  { label: 'Maintenance', pct: 40, color: '#c9a96e', bg: 'bg-[#c9a96e]' },
  { label: 'Landscaping', pct: 25, color: '#60a5fa', bg: 'bg-blue-400' },
  { label: 'Reserves', pct: 20, color: '#4ade80', bg: 'bg-green-400' },
  { label: 'Admin', pct: 15, color: '#f59e0b', bg: 'bg-amber-400' },
];

function SpendingBreakdown() {
  // Build conic-gradient for the ring chart
  const conicParts: string[] = [];
  let cumulative = 0;
  SPENDING_CATEGORIES.forEach(({ pct, color }) => {
    conicParts.push(`${color} ${cumulative}% ${cumulative + pct}%`);
    cumulative += pct;
  });
  const conicGradient = `conic-gradient(${conicParts.join(', ')})`;

  return (
    <div className="glass-card rounded-2xl hover-lift p-6 mb-8 page-enter page-enter-delay-3">
      <h2 className="text-lg font-bold text-gray-200 mb-6">Spending Breakdown</h2>

      <div className="flex flex-col sm:flex-row items-center gap-8">
        {/* CSS Donut Ring */}
        <div className="relative shrink-0">
          <div
            className="w-40 h-40 rounded-full"
            style={{
              background: conicGradient,
              transition: 'all 0.7s ease',
            }}
          />
          {/* Inner cutout */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-[oklch(0.10_0.005_60)] flex flex-col items-center justify-center">
              <span className="text-[10px] text-gray-500 uppercase tracking-wide">Annual</span>
              <span className="text-sm font-bold text-[#c9a96e]">Budget</span>
              <span className="text-[10px] text-gray-400 font-semibold">$120K</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3 w-full">
          {SPENDING_CATEGORIES.map(({ label, pct, bg }) => (
            <div key={label} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${bg} shrink-0`} />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-300">{label}</span>
                  <span className="font-bold text-gray-200">{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-800/60">
                  <div
                    className={`h-1.5 rounded-full ${bg} transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  ~${Math.round(120000 * pct / 100).toLocaleString()} / year
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-gray-600 mt-5 pt-4 border-t border-gray-800/60">
        Based on $120,000 annual community budget · Percentages are approximate and updated quarterly
      </p>
    </div>
  );
}
