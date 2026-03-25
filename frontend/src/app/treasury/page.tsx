'use client';

import { useTreasury } from '@/hooks/useTreasury';

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
      <div className="mb-10">
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">On-Chain Finance</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Community Treasury</h1>
        <p className="text-base text-gray-400 mt-2 font-medium">
          Every dollar publicly recorded and verifiable on the blockchain
        </p>
      </div>

      {/* Hero Balance */}
      <div className="glass-card rounded-2xl hover-lift p-10 text-center glow-purple mb-6 border-l-2 border-l-purple-500/50 page-enter page-enter-delay-1">
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
              🏗️
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
              🏦
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
          <div className="glass-card rounded-2xl hover-lift p-12 text-center">
            {/* Chart placeholder */}
            <div className="w-full h-32 rounded-xl bg-gray-800/30 border border-gray-700/30 flex items-center justify-center mb-6">
              <div className="flex items-end gap-2 h-16">
                {[40, 65, 30, 80, 55, 45, 70].map((h, i) => (
                  <div
                    key={i}
                    className="w-6 rounded-t bg-purple-500/20 border-t border-purple-500/30"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide mb-4">
              Expenditure chart — coming soon
            </p>
            <div className="w-14 h-14 rounded-2xl bg-gray-800/50 border border-gray-700/30 flex items-center justify-center text-2xl mx-auto mb-4">
              💰
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

      {/* On-chain banner */}
      <div className="mt-8 glass-card rounded-2xl hover-lift p-6 border-l-2 border-l-purple-500/40 bg-purple-950/10 page-enter page-enter-delay-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">🔗</span>
          <div>
            <h3 className="text-sm font-bold text-purple-300 mb-1">On-Chain Transparency</h3>
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
