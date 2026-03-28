'use client';

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { useProperty } from '@/hooks/useProperty';
import { useDuesStatus } from '@/hooks/useTreasury';
import { CheckCircle, Home } from 'lucide-react';

// ── Step Indicator ────────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs tracking-widest uppercase text-[var(--text-disabled)]">
          Step {current} of {total}
        </span>
        <span className="text-xs text-[#B09B71] font-medium">
          {Math.round((current / total) * 100)}%
        </span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-all duration-500"
            style={{
              background:
                i < current
                  ? 'linear-gradient(90deg, #B09B71, #b8942e)'
                  : 'rgba(255,255,255,0.08)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Checkbox Row ─────────────────────────────────────────────────────────────
function CheckRow({
  checked,
  onChange,
  label,
  sublabel,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sublabel?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
        checked
          ? 'border-[rgba(42,93,79,0.25)] bg-[#3A7D6F]/5'
          : 'border-[rgba(245,240,232,0.06)] bg-[rgba(26,26,30,0.30)]'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="mt-0.5 w-4 h-4 rounded accent-green-500"
      />
      <div>
        <p className="text-sm font-medium text-[var(--parchment)]">{label}</p>
        {sublabel && <p className="text-xs text-[var(--text-disabled)] mt-0.5">{sublabel}</p>}
      </div>
    </label>
  );
}

// ── Main Checkout Wizard ──────────────────────────────────────────────────────
function CheckoutWizard() {
  const { tokenId } = useProperty();
  const { isCurrent, quartersOwed, amountOwed } = useDuesStatus(tokenId);
  const [step, setStep] = useState(1);

  // Step 1 state
  const [keyFobReturned, setKeyFobReturned] = useState(false);
  const [poolKeyReturned, setPoolKeyReturned] = useState(false);
  const [forwardingAddress, setForwardingAddress] = useState('');

  // Step 2 state
  const [obligationsConfirmed, setObligationsConfirmed] = useState(false);

  const TOTAL_STEPS = 3;

  const step1Valid = keyFobReturned && poolKeyReturned;
  const step2Valid = obligationsConfirmed && (isCurrent === true || isCurrent === undefined);

  const goNext = useCallback(() => {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  }, [step]);

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="max-w-lg mx-auto px-4 py-10 page-enter">
      {step < TOTAL_STEPS && (
        <div className="mb-6">
          <h1 className="text-2xl font-normal text-[var(--parchment)] mb-1">
            Move-Out Checklist
          </h1>
          <p className="text-sm text-[var(--text-disabled)]">
            Faircroft HOA · Property #{tokenId ?? '—'}
          </p>
        </div>
      )}

      {step < TOTAL_STEPS && <StepIndicator current={step} total={TOTAL_STEPS} />}

      {/* ── Step 1: Checklist ── */}
      {step === 1 && (
        <div className="glass-card rounded-xl p-7 animate-fade-in">
          <h2 className="text-xl font-medium mb-1">Pre-Move Checklist</h2>
          <p className="text-sm text-[var(--text-disabled)] mb-6">
            Complete all items before proceeding.
          </p>

          {/* Dues status */}
          <div
            className={`p-4 rounded-xl border mb-4 ${
              isCurrent === false
                ? 'border-[rgba(107,58,58,0.25)] bg-[#8B5A5A]/5'
                : 'border-[rgba(42,93,79,0.25)] bg-[#3A7D6F]/5'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isCurrent !== false ? (
                  <span className="text-[#3A7D6F] text-lg"></span>
                ) : (
                  <span className="text-[#8B5A5A] text-lg"></span>
                )}
                <div>
                  <p className="text-sm font-medium text-[var(--parchment)]">HOA Dues</p>
                  <p className="text-xs text-[var(--text-disabled)]">
                    {isCurrent === undefined
                      ? 'Checking...'
                      : isCurrent
                      ? 'All dues are current'
                      : `${quartersOwed} quarters owed · $${amountOwed}`}
                  </p>
                </div>
              </div>
              {isCurrent === false && (
                <Link
                  href="/dues"
                  className="text-xs text-[#8B5A5A] hover:text-[#8B5A5A] underline"
                >
                  Pay now →
                </Link>
              )}
            </div>
          </div>

          <div className="space-y-3 mb-7">
            <CheckRow
              checked={keyFobReturned}
              onChange={setKeyFobReturned}
              label="Key Fob Returned"
              sublabel="Return to the HOA office or a board member"
            />
            <CheckRow
              checked={poolKeyReturned}
              onChange={setPoolKeyReturned}
              label="Pool Key Returned"
              sublabel="Drop in the key return box at the pool gate"
            />
          </div>

          <div className="mb-7">
            <label className="text-xs tracking-widest uppercase text-[var(--text-disabled)] block mb-1.5">
              Forwarding Address
            </label>
            <input
              className="w-full bg-[rgba(26,26,30,0.60)] border border-[rgba(245,240,232,0.08)] rounded-xl px-4 py-3 text-sm text-[var(--parchment)] placeholder-[rgba(245,240,232,0.25)] focus:outline-none focus:border-amber-500/50"
              placeholder="Where should we send final correspondence?"
              value={forwardingAddress}
              onChange={(e) => setForwardingAddress(e.target.value)}
            />
          </div>

          <button
            onClick={goNext}
            disabled={!step1Valid || isCurrent === false}
            className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-[#B09B71] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--text-heading)] font-medium text-sm transition-all"
          >
            Continue →
          </button>
          {isCurrent === false && (
            <p className="text-xs text-[#8B5A5A] text-center mt-3">
              Outstanding dues must be paid before proceeding.
            </p>
          )}
          {isCurrent !== false && !step1Valid && (
            <p className="text-xs text-[var(--text-disabled)] text-center mt-3">
              Complete all checklist items to continue.
            </p>
          )}
        </div>
      )}

      {/* ── Step 2: Final Settlement ── */}
      {step === 2 && (
        <div className="glass-card rounded-xl p-7 animate-fade-in">
          <h2 className="text-xl font-medium mb-1">Final Settlement</h2>
          <p className="text-sm text-[var(--text-disabled)] mb-6">
            Confirm all financial obligations are met.
          </p>

          {/* Outstanding dues */}
          <div
            className={`p-5 rounded-xl border mb-6 ${
              isCurrent === false
                ? 'border-[rgba(107,58,58,0.25)] bg-[#8B5A5A]/8'
                : 'border-[rgba(42,93,79,0.25)] bg-[#3A7D6F]/5'
            }`}
          >
            <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-3">
              Outstanding Balance
            </p>
            {isCurrent === false ? (
              <div>
                <p className="text-2xl font-normal text-[#8B5A5A] mb-1">
                  ${amountOwed}
                </p>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  {quartersOwed} quarter{quartersOwed !== 1 ? 's' : ''} outstanding
                </p>
                <Link
                  href="/dues"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[rgba(107,58,58,0.15)] border border-[rgba(107,58,58,0.25)] hover:bg-[rgba(139,90,90,0.30)] text-sm font-medium text-[#8B5A5A] transition-all"
                >
                   Pay Outstanding Balance
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-[#3A7D6F]" />
                <p className="text-lg font-medium text-[#3A7D6F]">
                  No outstanding balance
                </p>
              </div>
            )}
          </div>

          {/* Confirmation */}
          <div className="border border-[rgba(176,155,113,0.20)] rounded-xl p-4 mb-7 bg-[#B09B71]/5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={obligationsConfirmed}
                onChange={(e) => setObligationsConfirmed(e.target.checked)}
                disabled={isCurrent === false}
                className="mt-0.5 w-4 h-4 rounded accent-amber-500"
              />
              <span className="text-sm text-[var(--text-body)]">
                I confirm all HOA obligations have been met and I am ready to
                transfer ownership of this property.
              </span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={goBack}
              className="flex-1 py-3 rounded-xl bg-[rgba(26,26,30,0.60)] border border-[rgba(245,240,232,0.08)] text-[var(--text-muted)] hover:text-[var(--parchment)] font-medium text-sm transition-all"
            >
              ← Back
            </button>
            <button
              onClick={goNext}
              disabled={!step2Valid}
              className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-[#B09B71] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--text-heading)] font-medium text-sm transition-all"
            >
              Confirm →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Confirmation ── */}
      {step === 3 && (
        <div className="glass-card rounded-xl p-10 text-center animate-fade-in">
          <div className="flex justify-center mb-5"><Home className="w-12 h-12 text-[#B09B71]" /></div>
          <h2 className="text-2xl font-normal mb-2">
            Thank You, Neighbor
          </h2>
          <p className="text-[var(--text-muted)] text-sm mb-3 max-w-sm mx-auto">
            Thank you for being part of the Faircroft community. We wish you
            all the best in your new home.
          </p>
          <div className="bg-[var(--steel)]/8 border border-[rgba(90,122,154,0.20)] rounded-xl p-4 mb-8 text-left">
            <p className="text-xs text-[var(--steel)] font-medium uppercase tracking-wide mb-1">
              ℹ On-Chain Transfer
            </p>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Property ownership transfer happens on-chain when the Property NFT
              is transferred to the new owner&apos;s wallet. The board will
              coordinate this step with you and the buyer.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[rgba(26,26,30,0.60)] border border-[rgba(245,240,232,0.08)] text-[var(--text-body)] hover:text-[var(--text-heading)] font-medium text-sm transition-all"
          >
            ← Return to Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-5xl mb-2"></div>
        <h2 className="text-xl font-medium">Move-Out Wizard</h2>
        <p className="text-[var(--text-muted)] text-sm">Connect your wallet to begin</p>
        <ConnectButton label="Connect Wallet" />
      </div>
    );
  }

  return <CheckoutWizard />;
}
