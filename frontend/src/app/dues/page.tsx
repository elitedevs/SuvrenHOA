'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useProperty } from '@/hooks/useProperty';
import { useTreasury, useDuesStatus } from '@/hooks/useTreasury';

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

  return <DuesPanel />;
}

function DuesPanel() {
  const { hasProperty, tokenId } = useProperty();
  const { quarterlyDues, annualAmount, annualDiscount } = useTreasury();
  const { isCurrent, quartersOwed, amountOwed } = useDuesStatus(tokenId);

  if (!hasProperty) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8 text-center">
        <p className="text-4xl mb-4">🏠</p>
        <h2 className="text-lg font-medium mb-2">No Property Found</h2>
        <p className="text-gray-400 text-sm">You need a Property NFT to pay dues.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Pay Dues</h1>

      {/* Status Card */}
      <div className={`p-6 rounded-xl border mb-6 ${
        isCurrent === undefined ? 'border-gray-800 bg-gray-900/50' :
        isCurrent ? 'border-green-900/50 bg-green-950/20' : 'border-red-900/50 bg-red-950/20'
      }`}>
        <h3 className="text-sm text-gray-400 mb-2">Current Status — Lot #{tokenId}</h3>
        {isCurrent === undefined ? (
          <p className="text-lg font-medium text-gray-500">Loading...</p>
        ) : isCurrent ? (
          <p className="text-lg font-medium text-green-400">✓ Dues are current</p>
        ) : (
          <>
            <p className="text-lg font-medium text-red-400">
              {quartersOwed} quarter{quartersOwed !== 1 ? 's' : ''} past due
            </p>
            <p className="text-sm text-gray-400 mt-1">Amount owed: ${amountOwed}</p>
          </>
        )}
      </div>

      {/* Payment Options */}
      <h2 className="text-lg font-semibold mb-3">Payment Options</h2>
      <div className="space-y-3">
        {[
          { label: '1 Quarter', amount: `$${quarterlyDues}`, quarters: 1 },
          { label: '2 Quarters', amount: `$${(parseFloat(quarterlyDues) * 2).toFixed(2)}`, quarters: 2 },
          { label: '3 Quarters', amount: `$${(parseFloat(quarterlyDues) * 3).toFixed(2)}`, quarters: 3 },
          { label: `Annual (${annualDiscount}% discount)`, amount: `$${annualAmount}`, quarters: 4, recommended: true },
        ].map(({ label, amount, quarters, recommended }) => (
          <button
            key={quarters}
            className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
              recommended
                ? 'border-purple-500/50 bg-purple-950/20 hover:border-purple-400'
                : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
            }`}
            onClick={() => {
              // TODO: Wire up USDC approve + payDues transaction
              console.log(`Pay ${quarters} quarter(s)`);
            }}
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
        80% goes to the operating fund, 20% to the reserve.
      </p>
    </div>
  );
}
