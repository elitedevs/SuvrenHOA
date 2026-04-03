'use client';

import { useState } from 'react';
import { useTreasury } from '@/hooks/useTreasury';
import { TreasuryProjections } from '@/components/TreasuryProjections';
import Link from 'next/link';
import { FileText, BarChart2 } from 'lucide-react';

function exportTreasuryPDF() {
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
          <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-1">Community Finance</p>
          <h1 className="text-3xl sm:text-4xl font-medium gradient-text">Community Treasury</h1>
          <p className="text-sm text-[var(--text-muted)] mt-2">
            Every dollar publicly recorded and verifiable
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/treasury/budget"
            className="no-print w-full sm:w-auto shrink-0 flex items-center gap-2 px-4 py-2.5 text-sm transition-all"
            style={{
              background: 'transparent',
              border: '1px solid rgba(176, 155, 113, 0.3)',
              color: '#B09B71',
              borderRadius: '8px',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(176, 155, 113, 0.05)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
          >
            <BarChart2 className="w-4 h-4 opacity-60" /> Budget Planner
          </Link>
          <button
            onClick={exportTreasuryPDF}
            className="no-print w-full sm:w-auto shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgba(245,240,232,0.04)] hover:bg-[rgba(245,240,232,0.06)] text-sm text-[var(--text-muted)] hover:text-[var(--text-body)] transition-all"
            title="Export as PDF"
          >
            <FileText className="w-4 h-4 opacity-60" /> Export PDF
          </button>
        </div>
      </div>

      {/* Hero — prose statement with ONE featured number */}
      <div className="glass-card rounded-xl p-10 text-center mb-6 card-enter card-enter-delay-1">
        <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-6">Total Community Balance</p>
        <div className="flex items-baseline justify-center gap-3 mb-5">
          <span className="text-4xl sm:text-5xl font-normal gradient-text number-reveal">${totalBalance}</span>
          <span className="text-xl font-normal text-[var(--text-disabled)]">USDC</span>
        </div>
        <p className="text-sm text-[var(--text-muted)] max-w-lg mx-auto leading-relaxed">
          The community treasury holds ${totalBalance} USDC, with ${operatingBalance} allocated to day-to-day operations and ${reserveBalance} held in long-term reserves.
        </p>
      </div>

      {/* Operating + Reserve */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8 card-enter card-enter-delay-2">
        {/* Operating Fund */}
        <div className="glass-card-success rounded-xl p-7">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-2">Operating Fund</p>
              <p className="text-3xl font-normal" style={{ color: '#2A5D4F' }}>${operatingBalance}</p>
              <p className="text-xs text-[var(--text-disabled)] mt-1">USDC · Day-to-day expenses</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-[var(--text-disabled)]">
              <span>80% of dues</span>
              <span style={{ color: '#2A5D4F' }}>{operatingPct.toFixed(0)}%</span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill bg-gradient-to-r from-[#2A5D4F] to-[#3A7D6F]"
                style={{ width: `${operatingPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Reserve Fund */}
        <div className="glass-card-info rounded-xl p-7">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-2">Reserve Fund</p>
              <p className="text-3xl font-normal" style={{ color: '#8B9BB0' }}>${reserveBalance}</p>
              <p className="text-xs text-[var(--text-disabled)] mt-1">USDC · Long-term reserves</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-[var(--text-disabled)]">
              <span>20% of dues</span>
              <span style={{ color: '#8B9BB0' }}>{reservePct.toFixed(0)}%</span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${reservePct}%`, background: '#8B9BB0' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Allocation bar */}
      <div className="glass-card rounded-xl p-6 mb-8 card-enter card-enter-delay-2">
        <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-4">Allocation Overview</p>
        <div className="h-2 rounded-full overflow-hidden flex">
          <div
            className="bg-gradient-to-r from-[#2A5D4F] to-[#3A7D6F] transition-all duration-700"
            style={{ width: `${operatingPct}%` }}
          />
          <div
            className="transition-all duration-700"
            style={{ width: `${reservePct}%`, background: '#8B9BB0' }}
          />
        </div>
        <div className="flex justify-between mt-3 text-xs text-[var(--text-disabled)]">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: '#2A5D4F' }} />
            <span>Operating <span style={{ color: '#2A5D4F' }}>{operatingPct.toFixed(0)}%</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: '#8B9BB0' }} />
            <span>Reserve <span style={{ color: '#8B9BB0' }}>{reservePct.toFixed(0)}%</span></span>
          </div>
        </div>
      </div>

      {/* Expenditures */}
      <div className="card-enter card-enter-delay-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-normal text-[var(--parchment)]">Expenditures</h2>
          <span className="px-3 py-1.5 rounded-lg text-xs bg-[rgba(245,240,232,0.04)] text-[var(--text-disabled)]">
            {expenditureCount} total
          </span>
        </div>

        {expenditureCount === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <div className="w-14 h-14 rounded-xl bg-[rgba(245,240,232,0.04)] flex items-center justify-center mx-auto mb-4">
              <BarChart2 className="w-6 h-6 opacity-20" />
            </div>
            <h3 className="text-lg font-normal mb-2 text-[var(--text-body)]">No Expenditures Yet</h3>
            <p className="text-sm text-[var(--text-disabled)] max-w-md mx-auto">
              All community spending will be recorded here with full transparency.
              Every transaction is permanently verifiable.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-disabled)]">Loading expenditures...</p>
          </div>
        )}
      </div>

      {/* Financial Projections */}
      <div className="mb-8 card-enter card-enter-delay-3">
        <TreasuryProjections />
      </div>

      {/* Spending Breakdown */}
      <SpendingBreakdown />

      {/* Transparency banner */}
      <div className="mt-8 glass-card rounded-xl p-6 bg-[rgba(26,26,26,0.30)] card-enter card-enter-delay-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[rgba(176,155,113,0.08)] flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-[#B09B71] opacity-40" />
          </div>
          <div>
            <h3 className="text-sm font-normal text-[var(--text-body)] mb-1">Financial Transparency</h3>
            <p className="text-xs text-[var(--text-disabled)] leading-relaxed">
              Every dollar in and out is permanently recorded and publicly auditable.
              Anyone can verify these numbers at any time — they cannot be altered.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const SPENDING_CATEGORIES = [
  { label: 'Maintenance', pct: 40, color: '#B09B71', bg: 'bg-[#B09B71]' },
  { label: 'Landscaping', pct: 25, color: '#5A7A9A', bg: 'bg-[var(--steel)]' },
  { label: 'Reserves', pct: 20, color: '#3A7D6F', bg: 'bg-[#3A7D6F]' },
  { label: 'Admin', pct: 15, color: '#8A7550', bg: 'bg-[#8A7550]' },
];

function SpendingBreakdown() {
  const conicParts: string[] = [];
  let cumulative = 0;
  SPENDING_CATEGORIES.forEach(({ pct, color }) => {
    conicParts.push(`${color} ${cumulative}% ${cumulative + pct}%`);
    cumulative += pct;
  });
  const conicGradient = `conic-gradient(${conicParts.join(', ')})`;

  return (
    <div className="glass-card rounded-xl p-6 mb-8 card-enter card-enter-delay-3">
      <h2 className="text-lg font-normal text-[var(--parchment)] mb-6">Spending Breakdown</h2>

      <div className="flex flex-col sm:flex-row items-center gap-8">
        {/* CSS Donut Ring */}
        <div className="relative shrink-0">
          <div
            className="w-40 h-40 rounded-full"
            style={{ background: conicGradient, transition: 'all 0.7s ease' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-[var(--obsidian)] flex flex-col items-center justify-center">
              <span className="text-[10px] tracking-widest uppercase text-[var(--text-disabled)]">Annual</span>
              <span className="text-sm font-normal text-[#B09B71]">Budget</span>
              <span className="text-[10px] text-[var(--text-disabled)]">$120K</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3 w-full">
          {SPENDING_CATEGORIES.map(({ label, pct, bg }) => (
            <div key={label} className="flex items-center gap-3 list-item-enter">
              <div className={`w-2.5 h-2.5 rounded-full ${bg} shrink-0`} />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--text-body)]">{label}</span>
                  <span className="text-[var(--text-muted)]">{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[rgba(245,240,232,0.04)]">
                  <div
                    className={`h-1.5 rounded-full ${bg} transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-[var(--text-disabled)] mt-0.5">
                  ~${Math.round(120000 * pct / 100).toLocaleString()} / year
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-[var(--text-disabled)] mt-5 pt-4 border-t border-[var(--divider)]">
        Based on $120,000 annual community budget · Percentages are approximate and updated quarterly
      </p>
    </div>
  );
}
