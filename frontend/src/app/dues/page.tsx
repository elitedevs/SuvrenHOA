'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function DuesPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 mb-4">Connect your wallet to pay dues</p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Pay Dues</h1>

      <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 mb-6">
        <h3 className="text-sm text-gray-400 mb-2">Current Status</h3>
        <p className="text-lg font-medium text-yellow-400">Loading...</p>
      </div>

      <div className="space-y-3">
        {[
          { label: '1 Quarter', amount: '$200.00', quarters: 1 },
          { label: '2 Quarters', amount: '$400.00', quarters: 2 },
          { label: '3 Quarters', amount: '$600.00', quarters: 3 },
          { label: 'Annual (5% discount)', amount: '$760.00', quarters: 4, recommended: true },
        ].map(({ label, amount, recommended }) => (
          <button
            key={label}
            className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
              recommended
                ? 'border-purple-500/50 bg-purple-950/20 hover:border-purple-400'
                : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
            }`}
          >
            <div>
              <p className="font-medium">{label}</p>
              {recommended && <p className="text-xs text-purple-400">Recommended</p>}
            </div>
            <span className="text-lg font-bold">{amount}</span>
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center">
        Dues are paid in USDC on Base. You&apos;ll need USDC in your wallet.
      </p>
    </div>
  );
}
