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
        <span className="text-xs text-gray-500 font-semibold uppercase tracking-widest">
          Step {current} of {total}
        </span>
        <span className="text-xs text-amber-400 font-semibold">
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
                  ? 'linear-gradient(90deg, #c9a96e, #b8942e)'
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
          ? 'border-green-500/30 bg-green-500/5'
          : 'border-gray-700/40 bg-gray-800/30'
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
        <p className="text-sm font-semibold text-gray-200">{label}</p>
        {sublabel && <p className="text-xs text-gray-500 mt-0.5">{sublabel}</p>}
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
          <h1 className="text-2xl font-extrabold text-gray-100 mb-1">
            Move-Out Checklist
          </h1>
          <p className="text-sm text-gray-500">
            Faircroft HOA · Property #{tokenId ?? '—'}
          </p>
        </div>
      )}

      {step < TOTAL_STEPS && <StepIndicator current={step} total={TOTAL_STEPS} />}

      {/* ── Step 1: Checklist ── */}
      {step === 1 && (
        <div className="glass-card rounded-2xl p-7 border-l-2 border-l-amber-500/50 animate-fade-in">
          <h2 className="text-xl font-bold mb-1">Pre-Move Checklist</h2>
          <p className="text-sm text-gray-500 mb-6">
            Complete all items before proceeding.
          </p>

          {/* Dues status */}
          <div
            className={`p-4 rounded-xl border mb-4 ${
              isCurrent === false
                ? 'border-red-500/30 bg-red-500/5'
                : 'border-green-500/30 bg-green-500/5'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isCurrent !== false ? (
                  <span className="text-green-400 text-lg">✅</span>
                ) : (
                  <span className="text-red-400 text-lg">❌</span>
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-200">HOA Dues</p>
                  <p className="text-xs text-gray-500">
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
                  className="text-xs text-red-400 hover:text-red-300 underline"
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
            <label className="text-xs text-gray-500 font-semibold uppercase tracking-wide block mb-1.5">
              Forwarding Address
            </label>
            <input
              className="w-full bg-gray-800/60 border border-gray-700/60 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
              placeholder="Where should we send final correspondence?"
              value={forwardingAddress}
              onChange={(e) => setForwardingAddress(e.target.value)}
            />
          </div>

          <button
            onClick={goNext}
            disabled={!step1Valid || isCurrent === false}
            className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all"
          >
            Continue →
          </button>
          {isCurrent === false && (
            <p className="text-xs text-red-400 text-center mt-3">
              Outstanding dues must be paid before proceeding.
            </p>
          )}
          {isCurrent !== false && !step1Valid && (
            <p className="text-xs text-gray-500 text-center mt-3">
              Complete all checklist items to continue.
            </p>
          )}
        </div>
      )}

      {/* ── Step 2: Final Settlement ── */}
      {step === 2 && (
        <div className="glass-card rounded-2xl p-7 animate-fade-in">
          <h2 className="text-xl font-bold mb-1">Final Settlement</h2>
          <p className="text-sm text-gray-500 mb-6">
            Confirm all financial obligations are met.
          </p>

          {/* Outstanding dues */}
          <div
            className={`p-5 rounded-xl border mb-6 ${
              isCurrent === false
                ? 'border-red-500/30 bg-red-500/8'
                : 'border-green-500/30 bg-green-500/5'
            }`}
          >
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">
              Outstanding Balance
            </p>
            {isCurrent === false ? (
              <div>
                <p className="text-2xl font-extrabold text-red-300 mb-1">
                  ${amountOwed}
                </p>
                <p className="text-sm text-gray-400 mb-4">
                  {quartersOwed} quarter{quartersOwed !== 1 ? 's' : ''} past due
                </p>
                <Link
                  href="/dues"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 text-sm font-semibold text-red-300 transition-all"
                >
                  💳 Pay Outstanding Balance
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <p className="text-lg font-bold text-green-300">
                  No outstanding balance
                </p>
              </div>
            )}
          </div>

          {/* Confirmation */}
          <div className="border border-amber-500/20 rounded-xl p-4 mb-7 bg-amber-500/5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={obligationsConfirmed}
                onChange={(e) => setObligationsConfirmed(e.target.checked)}
                disabled={isCurrent === false}
                className="mt-0.5 w-4 h-4 rounded accent-amber-500"
              />
              <span className="text-sm text-gray-300">
                I confirm all HOA obligations have been met and I am ready to
                transfer ownership of this property.
              </span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={goBack}
              className="flex-1 py-3 rounded-xl bg-gray-800/60 border border-gray-700/50 text-gray-400 hover:text-gray-200 font-semibold text-sm transition-all"
            >
              ← Back
            </button>
            <button
              onClick={goNext}
              disabled={!step2Valid}
              className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all"
            >
              Confirm →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Confirmation ── */}
      {step === 3 && (
        <div className="glass-card rounded-2xl p-10 text-center animate-fade-in border-l-2 border-l-amber-500/50">
          <div className="flex justify-center mb-5"><Home className="w-12 h-12 text-[#c9a96e]" /></div>
          <h2 className="text-2xl font-extrabold mb-2">
            Thank You, Neighbor
          </h2>
          <p className="text-gray-400 text-sm mb-3 max-w-sm mx-auto">
            Thank you for being part of the Faircroft community. We wish you
            all the best in your new home.
          </p>
          <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-4 mb-8 text-left">
            <p className="text-xs text-blue-300 font-semibold uppercase tracking-wide mb-1">
              ℹ️ On-Chain Transfer
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Property ownership transfer happens on-chain when the Property NFT
              is transferred to the new owner&apos;s wallet. The board will
              coordinate this step with you and the buyer.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-800/60 border border-gray-700/50 text-gray-300 hover:text-white font-semibold text-sm transition-all"
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
        <div className="text-5xl mb-2">📦</div>
        <h2 className="text-xl font-bold">Move-Out Wizard</h2>
        <p className="text-gray-400 text-sm">Connect your wallet to begin</p>
        <ConnectButton label="Connect Wallet" />
      </div>
    );
  }

  return <CheckoutWizard />;
}
