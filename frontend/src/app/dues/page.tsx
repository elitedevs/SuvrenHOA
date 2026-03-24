'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useProperty } from '@/hooks/useProperty';
import { useTreasury, useDuesStatus } from '@/hooks/useTreasury';
import { usePayDues, useUSDCBalance, useUSDCAllowance } from '@/hooks/usePayDues';

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
  const { address, hasProperty, tokenId } = useProperty();
  const { quarterlyDues, annualAmount, annualDiscount } = useTreasury();
  const { isCurrent, quartersOwed, amountOwed } = useDuesStatus(tokenId);
  const usdcBalance = useUSDCBalance(address);
  const allowance = useUSDCAllowance(address);
  const { approve, payDues, isApproving, isApproved, isPaying, isPaid, payHash } = usePayDues();

  const [selectedQuarters, setSelectedQuarters] = useState<number | null>(null);
  const [step, setStep] = useState<'select' | 'approve' | 'pay' | 'done'>('select');

  if (!hasProperty) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 text-center">
        <p className="text-4xl mb-4">🏠</p>
        <h2 className="text-lg font-medium mb-2">No Property Found</h2>
        <p className="text-gray-400 text-sm">You need a Property NFT to pay dues.</p>
      </div>
    );
  }

  const quarterlyNum = parseFloat(quarterlyDues.replace(/,/g, ''));
  const paymentOptions = [
    { quarters: 1, label: '1 Quarter', amount: quarterlyNum },
    { quarters: 2, label: '2 Quarters', amount: quarterlyNum * 2 },
    { quarters: 3, label: '3 Quarters', amount: quarterlyNum * 3 },
    { quarters: 4, label: `Annual (${annualDiscount}% off)`, amount: parseFloat(annualAmount.replace(/,/g, '')), recommended: true },
  ];

  const selectedOption = paymentOptions.find(o => o.quarters === selectedQuarters);

  const handlePay = () => {
    if (!selectedOption || tokenId === undefined) return;

    const amountStr = selectedOption.amount.toFixed(2);

    if (allowance < selectedOption.amount) {
      // Need approval first
      setStep('approve');
      approve(amountStr);
    } else {
      // Already approved, pay directly
      setStep('pay');
      payDues(tokenId, selectedOption.quarters);
    }
  };

  // Auto-advance from approve to pay
  if (isApproved && step === 'approve' && tokenId !== undefined && selectedQuarters !== null) {
    setStep('pay');
    payDues(tokenId, selectedQuarters);
  }

  if (isPaid) {
    if (step !== 'done') setStep('done');
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <h1 className="text-2xl font-bold mb-6">Pay Dues</h1>

      {/* USDC Balance */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-gray-800 bg-gray-900/50 mb-4">
        <div>
          <p className="text-xs text-gray-500">Your USDC Balance</p>
          <p className="text-lg font-bold">${usdcBalance.toFixed(2)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Lot #{tokenId}</p>
        </div>
      </div>

      {/* Status Card */}
      <div className={`p-5 rounded-xl border mb-6 ${
        isCurrent === undefined ? 'border-gray-800 bg-gray-900/50' :
        isCurrent ? 'border-green-900/50 bg-green-950/20' : 'border-red-900/50 bg-red-950/20'
      }`}>
        <h3 className="text-sm text-gray-400 mb-2">Current Status</h3>
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

      {step === 'done' ? (
        <div className="p-8 rounded-xl border border-green-900/50 bg-green-950/20 text-center">
          <p className="text-4xl mb-4">✅</p>
          <h3 className="text-lg font-medium text-green-400 mb-2">Payment Successful!</h3>
          <p className="text-sm text-gray-400 mb-4">
            Your dues have been paid. The treasury has been updated on-chain.
          </p>
          {payHash && (
            <a
              href={`https://sepolia.basescan.org/tx/${payHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-purple-400 hover:underline font-mono"
            >
              View transaction →
            </a>
          )}
          <button
            onClick={() => { setStep('select'); setSelectedQuarters(null); }}
            className="block mx-auto mt-4 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm transition-colors"
          >
            Done
          </button>
        </div>
      ) : (
        <>
          {/* Payment Options */}
          <h2 className="text-lg font-semibold mb-3">Select Payment</h2>
          <div className="space-y-3 mb-6">
            {paymentOptions.map(({ quarters, label, amount, recommended }) => (
              <button
                key={quarters}
                onClick={() => setSelectedQuarters(quarters)}
                className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                  selectedQuarters === quarters
                    ? 'border-purple-500 bg-purple-950/30 ring-1 ring-purple-500/30'
                    : recommended
                    ? 'border-purple-500/30 bg-purple-950/10 hover:border-purple-500/50'
                    : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
                }`}
              >
                <div>
                  <p className="font-medium">{label}</p>
                  {recommended && <p className="text-xs text-purple-400">Recommended — save ${(quarterlyNum * 4 - amount).toFixed(2)}</p>}
                </div>
                <span className="text-lg font-bold">${amount.toFixed(2)}</span>
              </button>
            ))}
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePay}
            disabled={!selectedQuarters || isApproving || isPaying}
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            {isApproving ? '⏳ Approving USDC...' :
             isPaying ? '⛓️ Processing Payment...' :
             selectedQuarters ? `Pay $${selectedOption?.amount.toFixed(2)} USDC` :
             'Select a payment option'}
          </button>

          <p className="text-xs text-gray-500 mt-4 text-center">
            Dues are paid in USDC on Base. 80% goes to operating fund, 20% to reserve.
            {usdcBalance < (selectedOption?.amount || 0) && (
              <span className="text-red-400 block mt-1">
                ⚠️ Insufficient USDC balance. You need ${selectedOption?.amount.toFixed(2)} but have ${usdcBalance.toFixed(2)}.
              </span>
            )}
          </p>
        </>
      )}
    </div>
  );
}
