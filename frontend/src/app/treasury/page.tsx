'use client';

import { useTreasury } from '@/hooks/useTreasury';

export default function TreasuryPage() {
  const {
    totalBalance,
    operatingBalance,
    reserveBalance,
    expenditureCount,
  } = useTreasury();

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Community Treasury</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
          <h3 className="text-sm text-gray-400 mb-1">Total Balance</h3>
          <p className="text-2xl font-bold">${totalBalance}</p>
          <p className="text-xs text-gray-500 mt-1">USDC</p>
        </div>
        <div className="p-6 rounded-xl border border-green-900/50 bg-green-950/20">
          <h3 className="text-sm text-green-400 mb-1">Operating Fund</h3>
          <p className="text-2xl font-bold text-green-400">${operatingBalance}</p>
          <p className="text-xs text-gray-500 mt-1">80% of dues</p>
        </div>
        <div className="p-6 rounded-xl border border-blue-900/50 bg-blue-950/20">
          <h3 className="text-sm text-blue-400 mb-1">Reserve Fund</h3>
          <p className="text-2xl font-bold text-blue-400">${reserveBalance}</p>
          <p className="text-xs text-gray-500 mt-1">20% of dues</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Expenditures</h2>
        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
          {expenditureCount} total
        </span>
      </div>

      {expenditureCount === 0 ? (
        <div className="p-8 rounded-xl border border-gray-800 bg-gray-900/50 text-center text-gray-500">
          <p className="text-2xl mb-2">💰</p>
          <p>No expenditures yet</p>
          <p className="text-sm mt-1">All community spending will be recorded here with full transparency</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* TODO: Fetch and display expenditure list */}
          <p className="text-sm text-gray-500">Loading expenditures...</p>
        </div>
      )}

      <div className="mt-8 p-4 rounded-xl border border-purple-900/30 bg-purple-950/10">
        <h3 className="text-sm font-medium text-purple-400 mb-1">🔗 On-Chain Transparency</h3>
        <p className="text-xs text-gray-400">
          Every dollar in and out is permanently recorded on the Base blockchain.
          Anyone can verify these numbers — they cannot be altered.
        </p>
      </div>
    </div>
  );
}
