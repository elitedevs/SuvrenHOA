'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useProperty } from '@/hooks/useProperty';
import { useTreasury, useDuesStatus } from '@/hooks/useTreasury';
import { usePayDues, useUSDCBalance, useUSDCAllowance } from '@/hooks/usePayDues';
import { DuesReminder } from '@/components/DuesReminder';
import { useDuesSocialProof } from '@/hooks/useDuesSocialProof';
import { CreditCard, Home } from 'lucide-react';
import { DuesPaymentChart } from '@/components/DuesPaymentChart';
import { DuesCalculator } from '@/components/DuesCalculator';
import { DuesAutoPay } from '@/components/DuesAutoPay';

export default function DuesPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <CreditCard className="w-8 h-8 text-[var(--text-muted)] mb-2" />
        <p className="text-[var(--text-muted)] text-base font-medium">Sign in to pay dues</p>
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

function CommunityDuesStatus() {
  const { totalProperties, paidCount, unpaidCount, paidPercentage, loading } = useDuesSocialProof();

  if (loading) {
    return (
      <div className="glass-card rounded-xl hover-lift p-6 mb-6">
        <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-3">Community Dues Status</p>
        <div className="skeleton h-4 w-full rounded-lg mb-3" />
        <div className="skeleton h-2 w-full rounded-full" />
      </div>
    );
  }

  if (totalProperties === 0) return null;

  return (
    <div className="glass-card rounded-xl hover-lift p-6 mb-6 card-enter card-enter-delay-1">
      <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-4">Community Dues Status</p>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-[var(--parchment)]">
            {paidCount} of {totalProperties} properties current
          </p>
          <span className="text-sm font-medium text-[#3A7D6F]">{paidPercentage}%</span>
        </div>
        <div className="w-full h-3 bg-[var(--surface-2)] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#2A5D4F] to-[#3A7D6F] rounded-full transition-all duration-700"
            style={{ width: `${paidPercentage}%` }}
          />
        </div>
      </div>

      {/* Anonymous breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[#3A7D6F]/5 border border-[rgba(42,93,79,0.20)] p-4 text-center">
          <p className="text-2xl font-normal text-[#3A7D6F]">{paidCount}</p>
          <p className="text-xs text-[var(--text-disabled)] mt-1 font-medium">Paid This Quarter</p>
        </div>
        <div className="rounded-xl bg-[#8B5A5A]/5 border border-[rgba(107,58,58,0.20)] p-4 text-center">
          <p className="text-2xl font-normal text-[#8B5A5A]">{unpaidCount}</p>
          <p className="text-xs text-[var(--text-disabled)] mt-1 font-medium">Still Outstanding</p>
        </div>
      </div>

      <p className="text-[11px] text-[var(--text-disabled)] mt-3 text-center">
        Community data is anonymous — no names, just numbers.
      </p>
    </div>
  );
}

function DuesPanel() {
  const { address, hasProperty, tokenId } = useProperty();
  const { quarterlyDues, annualAmount, annualDiscount, loading: treasuryLoading, error: treasuryError } = useTreasury();
  const { isCurrent, quartersOwed, amountOwed, error: duesStatusError } = useDuesStatus(tokenId);
  const { value: usdcBalance, isLoading: balanceLoading } = useUSDCBalance(address);
  const { value: allowance, isLoading: allowanceLoading } = useUSDCAllowance(address);
  const {
    approve,
    payDues,
    isApprovePending,
    isApproveConfirming,
    isApproved,
    approveError,
    approveHash,
    isPayPending,
    isPayConfirming,
    isPaid,
    payError,
    payHash,
    error,
    isApproving,
    isPaying,
  } = usePayDues();

  const [selectedQuarters, setSelectedQuarters] = useState<number | null>(null);
  const [step, setStep] = useState<Step>('select');

  if (!hasProperty) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 page-enter">
        <div className="glass-card rounded-xl hover-lift p-12 text-center">
          <Home className="w-8 h-8 text-[#B09B71] mx-auto mb-4" />
          <h2 className="text-xl font-medium mb-3">No Property Found</h2>
          <p className="text-[var(--text-muted)] text-sm">You need a Property NFT to pay dues.</p>
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
  const hasInsufficientBalance = selectedOption ? usdcBalance < selectedOption.amount : false;
  const allowanceAlreadySet = selectedOption ? allowance >= selectedOption.amount : false;

  const handlePay = () => {
    if (!selectedOption || tokenId === undefined) return;
    const amountStr = selectedOption.amount.toFixed(2);

    if (allowanceAlreadySet) {
      // Skip approve — allowance already sufficient
      setStep('pay');
      payDues(tokenId, selectedOption.quarters);
    } else {
      setStep('approve');
      approve(amountStr);
    }
  };

  // Auto-advance from approve to pay once approval confirmed
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
        <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-1">Payments</p>
        <h1 className="text-3xl font-normal tracking-tight">Community Dues</h1>
      </div>

      {/* Treasury / DuesStatus errors */}
      {(treasuryError || duesStatusError) && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          ⚠️ {treasuryError ?? duesStatusError}
        </div>
      )}

      {/* Smart Dues Reminder */}
      <div className="mb-6 card-enter card-enter-delay-1">
        <DuesReminder />
      </div>

      {/* Community Dues Status */}
      <CommunityDuesStatus />

      {/* Step Progression */}
      {step !== 'done' && (
        <div className="mb-8 card-enter card-enter-delay-1">
          <div className="flex items-center justify-between">
            {STEPS.slice(0, 3).map((s, i) => {
              const isActive = s.id === step;
              const isDone = STEPS.findIndex(x => x.id === step) > i;

              return (
                <div key={s.id} className="flex items-center flex-1">
                  {/* Step bubble */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                      isDone
                        ? 'bg-[rgba(42,93,79,0.15)] border border-[rgba(42,93,79,0.30)] text-[#3A7D6F]'
                        : isActive
                        ? 'bg-[#B09B71]/20 border border-[#B09B71]/50 text-[#D4C4A0] shadow-[0_0_12px_rgba(201,169,110,0.25)]'
                        : 'bg-[var(--surface-2)] border border-[var(--divider)] text-[var(--text-disabled)]'
                    }`}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <span className={`text-[11px] font-medium whitespace-nowrap ${
                      isActive ? 'text-[#D4C4A0]' : isDone ? 'text-[#3A7D6F]' : 'text-[var(--text-disabled)]'
                    }`}>
                      {s.short}
                    </span>
                  </div>

                  {/* Connector line (not after last) */}
                  {i < 2 && (
                    <div className={`flex-1 h-px mx-3 mb-4 transition-all duration-500 ${
                      STEPS.findIndex(x => x.id === step) > i
                        ? 'bg-gradient-to-r from-[rgba(42,93,79,0.50)] to-[rgba(176,155,113,0.20)]'
                        : 'bg-[var(--surface-2)]'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* USDC Balance + Status */}
      <div className="grid grid-cols-2 gap-4 mb-6 card-enter card-enter-delay-1">
        <div className="glass-card rounded-xl hover-lift p-5">
          <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-2">USDC Balance</p>
          {balanceLoading ? (
            <div className="animate-pulse h-8 w-28 bg-[var(--surface-2)] rounded-lg mb-1" />
          ) : (
            <p className="text-2xl font-normal text-[var(--parchment)]">${usdcBalance.toFixed(2)}</p>
          )}
          <p className="text-[11px] text-[var(--text-disabled)] mt-1">on Base network</p>
        </div>
        <div className={`rounded-xl p-5 ${
          isCurrent === undefined
            ? 'glass-card'
            : isCurrent
            ? 'glass-card-success'
            : 'glass-card-danger'
        }`}>
          <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-2">
            Lot #{tokenId} Status
          </p>
          {isCurrent === undefined ? (
            <div className="animate-pulse h-7 w-20 bg-[var(--surface-2)] rounded-lg" />
          ) : isCurrent ? (
            <p className="text-2xl font-normal text-[#3A7D6F]">Current</p>
          ) : (
            <>
              <p className="text-2xl font-normal text-[#8B5A5A]">Payment Reminder</p>
              <p className="text-xs text-[#8B5A5A]/70 mt-1">${amountOwed} owed</p>
            </>
          )}
        </div>
      </div>

      {/* Done State */}
      {step === 'done' ? (
        <div className="glass-card-success rounded-xl p-12 text-center pulse-glow-green page-enter">
          <div className="w-20 h-20 rounded-full bg-[rgba(42,93,79,0.15)] border-2 border-[rgba(42,93,79,0.25)] flex items-center justify-center text-4xl mx-auto mb-6">
            ✓
          </div>
          <h3 className="text-2xl font-normal text-[#3A7D6F] mb-3">Payment Successful!</h3>
          <p className="text-sm text-[var(--text-muted)] mb-2 max-w-sm mx-auto">
            Your dues have been paid. The treasury has been updated on the network.
          </p>
          {payHash && (
            <a
              href={`https://sepolia.basescan.org/tx/${payHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#B09B71] hover:underline font-mono"
            >
              View transaction →
            </a>
          )}
          <button
            onClick={() => { setStep('select'); setSelectedQuarters(null); }}
            className="block mx-auto mt-6 px-6 py-3 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-sm font-medium transition-colors min-h-[44px]"
          >
            Done
          </button>
        </div>
      ) : (
        <>
          {/* Payment Options — radio-style */}
          <div className="mb-6 card-enter card-enter-delay-2">
            <h2 className="text-base font-medium text-[var(--parchment)] mb-3">Select Payment Amount</h2>
            {treasuryLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="animate-pulse h-[72px] rounded-xl bg-[var(--surface-2)]" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {paymentOptions.map(({ quarters, label, amount, recommended, savings, discount }) => {
                  const isSelected = selectedQuarters === quarters;
                  return (
                    <button
                      key={quarters}
                      onClick={() => setSelectedQuarters(quarters)}
                      className={`w-full p-5 rounded-xl border text-left flex items-center gap-4 transition-all duration-200 min-h-[72px] ${
                        isSelected
                          ? 'border-[#B09B71]/60 bg-[rgba(26,26,30,0.50)] shadow-[0_0_16px_rgba(201,169,110,0.12)]'
                          : recommended
                          ? 'border-[#B09B71]/20 bg-[rgba(26,26,30,0.30)] hover:border-[#B09B71]/40'
                          : 'border-[var(--divider)] bg-[var(--surface-1)] hover:border-[var(--border-default)]'
                      }`}
                    >
                      {/* Radio indicator */}
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                        isSelected
                          ? 'border-[#B09B71] bg-[#B09B71]'
                          : 'border-[var(--border-default)]'
                      }`}>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>

                      {/* Labels */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-[var(--parchment)]">{label}</p>
                          {recommended && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#B09B71]/15 border border-[#B09B71]/30 text-[#D4C4A0] font-medium">
                              {discount}% off
                            </span>
                          )}
                        </div>
                        {recommended && savings && (
                          <p className="text-xs text-[#B09B71] font-medium mt-0.5">
                            Save ${savings} vs quarterly
                          </p>
                        )}
                      </div>

                      {/* Amount */}
                      <span className="text-xl font-normal text-[var(--parchment)]">
                        ${amount.toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Transaction state feedback */}
          {(isApprovePending) && (
            <div className="mb-4 p-3 rounded-lg bg-[#B09B71]/10 border border-[#B09B71]/20 text-[#D4C4A0] text-sm">
              ⏳ Waiting for wallet confirmation...
            </div>
          )}
          {(isApproveConfirming && approveHash) && (
            <div className="mb-4 p-3 rounded-lg bg-[#B09B71]/10 border border-[#B09B71]/20 text-[#D4C4A0] text-sm">
              🔄 Approve submitted. Confirming...{' '}
              <a
                href={`https://sepolia.basescan.org/tx/${approveHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-mono text-xs"
              >
                {approveHash.slice(0, 10)}…
              </a>
            </div>
          )}
          {(isPayPending) && (
            <div className="mb-4 p-3 rounded-lg bg-[#B09B71]/10 border border-[#B09B71]/20 text-[#D4C4A0] text-sm">
              ⏳ Waiting for wallet confirmation...
            </div>
          )}
          {(isPayConfirming && payHash) && (
            <div className="mb-4 p-3 rounded-lg bg-[#B09B71]/10 border border-[#B09B71]/20 text-[#D4C4A0] text-sm">
              🔄 Transaction submitted. Confirming...{' '}
              <a
                href={`https://sepolia.basescan.org/tx/${payHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-mono text-xs"
              >
                {payHash.slice(0, 10)}…
              </a>
            </div>
          )}

          {/* Hook errors */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Insufficient balance warning */}
          {selectedOption && hasInsufficientBalance && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              ⚠️ Insufficient USDC balance. You need ${selectedOption.amount.toFixed(2)} but have ${usdcBalance.toFixed(2)}.
            </div>
          )}

          {/* Zero quarters guard (shouldn't happen with current options, but safety) */}
          {selectedQuarters === 0 && (
            <div className="mb-4 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--divider)] text-[var(--text-muted)] text-sm">
              Please select a payment option.
            </div>
          )}

          {/* Pay Button */}
          <button
            onClick={handlePay}
            disabled={
              !selectedQuarters ||
              selectedQuarters === 0 ||
              isApproving ||
              isPaying ||
              hasInsufficientBalance ||
              balanceLoading ||
              allowanceLoading
            }
            className="w-full py-4 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium transition-all duration-200 active:scale-[0.98] min-h-[56px]"
          >
            {isApprovePending ? '⏳ Waiting for wallet...' :
             isApproveConfirming ? '🔄 Confirming approval...' :
             isPayPending ? '⏳ Waiting for wallet...' :
             isPayConfirming ? '🔄 Confirming payment...' :
             !selectedQuarters ? 'Select a payment option' :
             hasInsufficientBalance ? 'Insufficient USDC balance' :
             selectedOption ? `Pay $${selectedOption.amount.toFixed(2)} USDC` :
             'Select a payment option'}
          </button>

          {/* Info */}
          <div className="mt-4 text-xs text-[var(--text-disabled)] text-center space-y-1">
            <p>Paid in USDC on Base. 80% → operating fund · 20% → reserve fund.</p>
            {allowanceAlreadySet && selectedOption && (
              <p className="text-[#3A7D6F]">
                ✓ USDC already approved — no approval step needed.
              </p>
            )}
          </div>
        </>
      )}

      {/* Payment History Chart */}
      <div className="mt-8 card-enter card-enter-delay-3">
        <DuesPaymentChart
          quarterlyAmount={parseFloat(quarterlyDues.replace(/,/g, '')) || 450}
        />
      </div>

      {/* Dues Calculator */}
      <div className="mt-8 card-enter card-enter-delay-3">
        <DuesCalculator baseQuarterlyRate={parseFloat(quarterlyDues.replace(/,/g, '')) || 450} />
      </div>

      {/* Auto-Pay */}
      <div className="mt-8 card-enter card-enter-delay-3">
        <DuesAutoPay walletAddress={address} />
      </div>
    </div>
  );
}
