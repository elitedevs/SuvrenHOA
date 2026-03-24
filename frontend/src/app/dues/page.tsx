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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-5xl mb-2">💳</div>
        <p className="text-gray-400 text-base font-medium">Sign in to pay dues</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  return <DuesPanel />;
}

type Step = 'select' | 'approve' | 'pay' | 'done';

const STEPS: { id: Step; label: string; short: string }[] = [
  { id: 'select', label: 'Select Amount', short: 'Select' },
  { id: 'approve', label: 'Approve USDC', short: 'Approve' },
  { id: 'pay', label: 'Submit Payment', short: 'Pay' },
  { id: 'done', label: 'Complete', short: 'Done' },
];

function DuesPanel() {
  const { address, hasProperty, tokenId } = useProperty();
  const { quarterlyDues, annualAmount, annualDiscount } = useTreasury();
  const { isCurrent, quartersOwed, amountOwed } = useDuesStatus(tokenId);
  const usdcBalance = useUSDCBalance(address);
  const allowance = useUSDCAllowance(address);
  const { approve, payDues, isApproving, isApproved, isPaying, isPaid, payHash } = usePayDues();

  const [selectedQuarters, setSelectedQuarters] = useState<number | null>(null);
  const [step, setStep] = useState<Step>('select');

  if (!hasProperty) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 page-enter">
        <div className="glass-card rounded-2xl p-12 text-center border-l-2 border-l-amber-500/40">
          <div className="text-5xl mb-4">🏠</div>
          <h2 className="text-xl font-bold mb-3">No Property Found</h2>
          <p className="text-gray-400 text-sm">You need a Property NFT to pay dues.</p>
        </div>
      </div>
    );
  }

  const quarterlyNum = parseFloat(quarterlyDues.replace(/,/g, ''));
  const paymentOptions = [
    { quarters: 1, label: '1 Quarter', amount: quarterlyNum, recommended: false },
    { quarters: 2, label: '2 Quarters', amount: quarterlyNum * 2, recommended: false },
    { quarters: 3, label: '3 Quarters', amount: quarterlyNum * 3, recommended: false },
    {
      quarters: 4,
      label: `Annual`,
      amount: parseFloat(annualAmount.replace(/,/g, '')),
      recommended: true,
      savings: (quarterlyNum * 4 - parseFloat(annualAmount.replace(/,/g, ''))).toFixed(2),
      discount: annualDiscount,
    },
  ];

  const selectedOption = paymentOptions.find(o => o.quarters === selectedQuarters);

  const handlePay = () => {
    if (!selectedOption || tokenId === undefined) return;
    const amountStr = selectedOption.amount.toFixed(2);

    if (allowance < selectedOption.amount) {
      setStep('approve');
      approve(amountStr);
    } else {
      setStep('pay');
      payDues(tokenId, selectedOption.quarters);
    }
  };

  // Auto-advance from approve to pay
  if (isApproved && step === 'approve' && tokenId !== undefined && selectedQuarters !== null) {
    setStep('pay');
    payDues(tokenId, selectedQuarters);
  }

  if (isPaid && step !== 'done') {
    setStep('done');
  }

  const currentStepIndex = STEPS.findIndex(s => s.id === step);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 page-enter">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">Payments</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Pay Dues</h1>
      </div>

      {/* Step Progression */}
      {step !== 'done' && (
        <div className="mb-8 page-enter page-enter-delay-1">
          <div className="flex items-center justify-between">
            {STEPS.slice(0, 3).map((s, i) => {
              const isActive = s.id === step;
              const isDone = STEPS.findIndex(x => x.id === step) > i;

              return (
                <div key={s.id} className="flex items-center flex-1">
                  {/* Step bubble */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      isDone
                        ? 'bg-green-500/20 border border-green-500/40 text-green-400'
                        : isActive
                        ? 'bg-purple-600/30 border border-purple-500/50 text-purple-300 shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                        : 'bg-gray-800/60 border border-gray-700/40 text-gray-600'
                    }`}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <span className={`text-[11px] font-semibold whitespace-nowrap ${
                      isActive ? 'text-purple-300' : isDone ? 'text-green-400' : 'text-gray-600'
                    }`}>
                      {s.short}
                    </span>
                  </div>

                  {/* Connector line (not after last) */}
                  {i < 2 && (
                    <div className={`flex-1 h-px mx-3 mb-4 transition-all duration-500 ${
                      STEPS.findIndex(x => x.id === step) > i
                        ? 'bg-gradient-to-r from-green-500/50 to-purple-500/30'
                        : 'bg-gray-800'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* USDC Balance + Status */}
      <div className="grid grid-cols-2 gap-4 mb-6 page-enter page-enter-delay-1">
        <div className="glass-card rounded-2xl p-5">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">USDC Balance</p>
          <p className="text-2xl font-extrabold text-gray-100">${usdcBalance.toFixed(2)}</p>
          <p className="text-[11px] text-gray-600 mt-1">on Base network</p>
        </div>
        <div className={`rounded-2xl p-5 ${
          isCurrent === undefined
            ? 'glass-card'
            : isCurrent
            ? 'glass-card-success'
            : 'glass-card-danger'
        }`}>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">
            Lot #{tokenId} Status
          </p>
          {isCurrent === undefined ? (
            <div className="skeleton h-7 w-20 rounded-lg" />
          ) : isCurrent ? (
            <p className="text-2xl font-extrabold text-green-400">Current</p>
          ) : (
            <>
              <p className="text-2xl font-extrabold text-red-400">Past Due</p>
              <p className="text-xs text-red-300/70 mt-1">${amountOwed} owed</p>
            </>
          )}
        </div>
      </div>

      {/* Done State */}
      {step === 'done' ? (
        <div className="glass-card-success rounded-2xl p-12 text-center border-l-2 border-l-green-500/50 pulse-glow-green page-enter">
          <div className="w-20 h-20 rounded-full bg-green-500/15 border-2 border-green-500/30 flex items-center justify-center text-4xl mx-auto mb-6">
            ✅
          </div>
          <h3 className="text-2xl font-extrabold text-green-400 mb-3">Payment Successful!</h3>
          <p className="text-sm text-gray-400 mb-2 max-w-sm mx-auto">
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
            className="block mx-auto mt-6 px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm font-bold transition-colors min-h-[44px]"
          >
            Done
          </button>
        </div>
      ) : (
        <>
          {/* Payment Options — radio-style */}
          <div className="mb-6 page-enter page-enter-delay-2">
            <h2 className="text-base font-bold text-gray-200 mb-3">Select Payment Amount</h2>
            <div className="space-y-3">
              {paymentOptions.map(({ quarters, label, amount, recommended, savings, discount }) => {
                const isSelected = selectedQuarters === quarters;
                return (
                  <button
                    key={quarters}
                    onClick={() => setSelectedQuarters(quarters)}
                    className={`w-full p-5 rounded-2xl border text-left flex items-center gap-4 transition-all duration-200 min-h-[72px] ${
                      isSelected
                        ? 'border-purple-400/60 bg-purple-950/30 shadow-[0_0_16px_rgba(139,92,246,0.15)]'
                        : recommended
                        ? 'border-purple-500/20 bg-purple-950/10 hover:border-purple-500/40'
                        : 'border-gray-700/60 bg-gray-900/30 hover:border-gray-600/60'
                    }`}
                  >
                    {/* Radio indicator */}
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                      isSelected
                        ? 'border-purple-400 bg-purple-400'
                        : 'border-gray-600'
                    }`}>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>

                    {/* Labels */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-gray-100">{label}</p>
                        {recommended && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 font-bold">
                            {discount}% off
                          </span>
                        )}
                      </div>
                      {recommended && savings && (
                        <p className="text-xs text-purple-400 font-medium mt-0.5">
                          Save ${savings} vs quarterly
                        </p>
                      )}
                    </div>

                    {/* Amount */}
                    <span className="text-xl font-extrabold text-gray-100">
                      ${amount.toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePay}
            disabled={!selectedQuarters || isApproving || isPaying}
            className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-base font-bold transition-all duration-200 shadow-[0_0_24px_rgba(139,92,246,0.2)] hover:shadow-[0_0_32px_rgba(139,92,246,0.35)] active:scale-[0.98] min-h-[56px]"
          >
            {isApproving ? '⏳ Approving USDC...' :
             isPaying ? '⛓️ Processing Payment...' :
             selectedOption ? `Pay $${selectedOption.amount.toFixed(2)} USDC` :
             'Select a payment option'}
          </button>

          {/* Info */}
          <div className="mt-4 text-xs text-gray-500 text-center space-y-1">
            <p>Paid in USDC on Base. 80% → operating fund · 20% → reserve fund.</p>
            {selectedOption && usdcBalance < selectedOption.amount && (
              <p className="text-red-400 font-medium">
                ⚠️ Insufficient balance. You need ${selectedOption.amount.toFixed(2)} but have ${usdcBalance.toFixed(2)}.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
