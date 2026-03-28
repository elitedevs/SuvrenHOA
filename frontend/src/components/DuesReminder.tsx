'use client';

import { useDuesStatus, useTreasury } from '@/hooks/useTreasury';
import { useProperty } from '@/hooks/useProperty';
import { useDuesSocialProof } from '@/hooks/useDuesSocialProof';
import Link from 'next/link';

interface DuesReminderProps {
  compact?: boolean;
}

export function DuesReminder({ compact = false }: DuesReminderProps) {
  const { hasProperty, tokenId } = useProperty();
  const { isCurrent, quartersOwed, amountOwed } = useDuesStatus(tokenId);
  const { quarterlyDues, annualDiscount } = useTreasury();
  const {
    totalProperties,
    paidCount,
    unpaidCount,
    paidPercentage,
    annualSavings,
    loading: socialLoading,
  } = useDuesSocialProof();

  // Don't render if no property or still loading dues status
  if (!hasProperty || isCurrent === undefined) {
    return null;
  }

  const quarterlyNum = parseFloat(quarterlyDues.replace(/,/g, ''));
  const amountOwedNum = parseFloat(amountOwed.replace(/,/g, ''));

  const isOverdue = !isCurrent && quartersOwed > 0;

  if (compact) {
    return (
      <CompactReminder
        isCurrent={isCurrent}
        isOverdue={isOverdue}
        quartersOwed={quartersOwed}
        amountOwed={amountOwedNum}
        quarterlyNum={quarterlyNum}
        annualSavings={annualSavings}
        annualDiscount={annualDiscount}
        paidCount={paidCount}
        totalProperties={totalProperties}
        socialLoading={socialLoading}
        tokenId={tokenId}
      />
    );
  }

  return (
    <FullReminder
      isCurrent={isCurrent}
      isOverdue={isOverdue}
      quartersOwed={quartersOwed}
      amountOwed={amountOwedNum}
      quarterlyNum={quarterlyNum}
      annualSavings={annualSavings}
      annualDiscount={annualDiscount}
      paidCount={paidCount}
      unpaidCount={unpaidCount}
      totalProperties={totalProperties}
      paidPercentage={paidPercentage}
      socialLoading={socialLoading}
      tokenId={tokenId}
    />
  );
}

interface ReminderProps {
  isCurrent: boolean;
  isOverdue: boolean;
  quartersOwed: number;
  amountOwed: number;
  quarterlyNum: number;
  annualSavings: string;
  annualDiscount: number;
  paidCount: number;
  unpaidCount?: number;
  totalProperties: number;
  paidPercentage?: number;
  socialLoading: boolean;
  tokenId?: number;
}

function CompactReminder({
  isCurrent,
  isOverdue,
  quartersOwed,
  amountOwed,
  quarterlyNum,
  annualSavings,
  annualDiscount,
}: ReminderProps) {
  if (isCurrent) {
    return (
      <div className="glass-card rounded-xl p-5 transition-all duration-300">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[rgba(42,93,79,0.15)] border border-[rgba(42,93,79,0.25)] flex items-center justify-center text-lg shrink-0">
              
            </div>
            <div>
              <p className="text-sm font-medium text-[#3A7D6F]">Dues Current</p>
              <p className="text-xs text-[var(--text-disabled)] mt-0.5">
                Save ${annualSavings} with annual plan ({annualDiscount}% off)
              </p>
            </div>
          </div>
          <Link
            href="/dues"
            className="text-xs text-[#B09B71] hover:text-[#D4C4A0] font-medium whitespace-nowrap transition-colors"
          >
            Pay Annual →
          </Link>
        </div>
      </div>
    );
  }

  if (isOverdue) {
    return (
      <div className="glass-card rounded-xl p-5 transition-all duration-300">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[rgba(107,58,58,0.12)] border border-[rgba(139,90,90,0.25)] flex items-center justify-center text-lg shrink-0">
              
            </div>
            <div>
              <p className="text-sm font-medium text-[#8B5A5A]">
                {quartersOwed} quarter{quartersOwed > 1 ? 's' : ''} overdue
              </p>
              <p className="text-xs text-[var(--text-disabled)] mt-0.5">${amountOwed.toFixed(2)} USDC owed</p>
            </div>
          </div>
          <Link
            href="/dues"
            className="text-xs px-3 py-1.5 rounded-lg bg-[rgba(107,58,58,0.15)] border border-[rgba(107,58,58,0.25)] text-[#8B5A5A] hover:bg-[rgba(139,90,90,0.30)] font-medium whitespace-nowrap transition-all"
          >
            Settle Balance →
          </Link>
        </div>
      </div>
    );
  }

  // Upcoming / near-due state
  return (
    <div className="glass-card rounded-xl p-5 transition-all duration-300">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[rgba(176,155,113,0.12)] border border-[rgba(176,155,113,0.25)] flex items-center justify-center text-lg shrink-0">
          </div>
          <div>
            <p className="text-sm font-medium text-[#B09B71]">
              Dues due soon — ${quarterlyNum.toFixed(2)}
            </p>
            <p className="text-xs text-[var(--text-disabled)] mt-0.5">Save ${annualSavings} with annual plan</p>
          </div>
        </div>
        <Link
          href="/dues"
          className="text-xs px-3 py-1.5 rounded-lg bg-[rgba(176,155,113,0.15)] border border-[rgba(176,155,113,0.25)] text-[#B09B71] hover:bg-[rgba(176,155,113,0.25)] font-medium whitespace-nowrap transition-all"
        >
          Pay Dues →
        </Link>
      </div>
    </div>
  );
}

function FullReminder({
  isCurrent,
  isOverdue,
  quartersOwed,
  amountOwed,
  quarterlyNum,
  annualSavings,
  annualDiscount,
  paidCount,
  unpaidCount,
  totalProperties,
  paidPercentage,
  socialLoading,
  tokenId,
}: ReminderProps) {
  if (isCurrent) {
    return (
      <div className="rounded-xl p-6 border border-[rgba(42,93,79,0.20)] bg-[#3A7D6F]/5 transition-all duration-300">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[rgba(42,93,79,0.15)] border border-[rgba(42,93,79,0.25)] flex items-center justify-center text-xl shrink-0">
            
          </div>
          <div className="flex-1">
            <h3 className="text-base font-medium text-[#3A7D6F] mb-1">
              You&apos;re all paid up!
            </h3>
            <p className="text-sm text-[var(--text-muted)]">
              Lot #{tokenId} is current on dues. Next quarter coming up — stay ahead with annual payments.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-xl bg-[#3A7D6F]/5 border border-[rgba(42,93,79,0.15)]">
          <div className="flex-1">
            <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-1">Annual Plan Savings</p>
            <p className="text-xl font-normal text-[#3A7D6F]">${annualSavings}</p>
            <p className="text-xs text-[var(--text-disabled)] mt-0.5">vs paying quarterly ({annualDiscount}% discount)</p>
          </div>
          <Link
            href="/dues"
            className="px-5 py-2.5 rounded-xl bg-[rgba(42,93,79,0.15)] border border-[rgba(42,93,79,0.25)] text-[#3A7D6F] hover:bg-[rgba(42,93,79,0.30)] text-sm font-medium transition-all whitespace-nowrap"
          >
            Switch to Annual →
          </Link>
        </div>

        {!socialLoading && totalProperties > 0 && (
          <SocialProofBar
            paidCount={paidCount}
            totalProperties={totalProperties}
            paidPercentage={paidPercentage ?? 0}
          />
        )}
      </div>
    );
  }

  if (isOverdue) {
    return (
      <div className="rounded-xl p-6 border border-[rgba(107,58,58,0.20)] bg-[#8B5A5A]/5 transition-all duration-300">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[rgba(107,58,58,0.12)] border border-[rgba(139,90,90,0.25)] flex items-center justify-center text-xl shrink-0">
            
          </div>
          <div className="flex-1">
            <h3 className="text-base font-medium text-[#8B5A5A] mb-1">
              {quartersOwed} Quarter{quartersOwed > 1 ? 's' : ''} Payment Reminder
            </h3>
            <p className="text-sm text-[var(--text-muted)]">
              Total owed: <span className="text-[#8B5A5A] font-medium">${amountOwed.toFixed(2)} USDC</span>
              {!socialLoading && unpaidCount !== undefined && unpaidCount > 0 && (
                <> · Your lot is <span className="text-[#8B5A5A] font-medium">1 of only {unpaidCount}</span> remaining unpaid</>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-xl bg-[#8B5A5A]/5 border border-[rgba(139,90,90,0.15)] mb-4">
          <div className="flex-1">
            <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-1">Amount Owed</p>
            <p className="text-xl font-normal text-[#8B5A5A]">${amountOwed.toFixed(2)} USDC</p>
            <p className="text-xs text-[var(--text-disabled)] mt-0.5">
              {quartersOwed} × ${quarterlyNum.toFixed(2)} quarterly
            </p>
          </div>
          <Link
            href="/dues"
            className="px-5 py-2.5 rounded-xl bg-[rgba(107,58,58,0.15)] border border-[rgba(107,58,58,0.25)] text-[#8B5A5A] hover:bg-[rgba(139,90,90,0.30)] text-sm font-medium transition-all whitespace-nowrap"
          >
            Settle Balance →
          </Link>
        </div>

        {!socialLoading && totalProperties > 0 && (
          <SocialProofBar
            paidCount={paidCount}
            totalProperties={totalProperties}
            paidPercentage={paidPercentage ?? 0}
          />
        )}
      </div>
    );
  }

  // Upcoming / near-due state
  return (
    <div className="rounded-xl p-6 border border-[rgba(176,155,113,0.20)] bg-[#B09B71]/5 transition-all duration-300">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[rgba(176,155,113,0.12)] border border-[rgba(176,155,113,0.25)] flex items-center justify-center text-xl shrink-0">
        </div>
        <div className="flex-1">
          <h3 className="text-base font-medium text-[#B09B71] mb-1">
            Dues Coming Up — ${quarterlyNum.toFixed(2)}
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            Your quarterly dues are due soon. Pay annual now and save ${annualSavings} ({annualDiscount}% discount).
            {!socialLoading && paidCount > 0 && (
              <>
                {' '}
                <span className="text-[#B09B71] font-medium">{paidCount} of {totalProperties} neighbors</span> have already paid this quarter.
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 p-4 rounded-xl bg-[#B09B71]/5 border border-[rgba(176,155,113,0.15)] mb-4">
        <div className="flex-1">
          <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-1">Annual Savings</p>
          <p className="text-xl font-normal text-[#B09B71]">Save ${annualSavings}</p>
          <p className="text-xs text-[var(--text-disabled)] mt-0.5">pay 4 quarters at {annualDiscount}% off</p>
        </div>
        <Link
          href="/dues"
          className="px-5 py-2.5 rounded-xl bg-[rgba(176,155,113,0.15)] border border-[rgba(176,155,113,0.25)] text-[#B09B71] hover:bg-[rgba(176,155,113,0.25)] text-sm font-medium transition-all whitespace-nowrap"
        >
          Pay Dues →
        </Link>
      </div>

      {!socialLoading && totalProperties > 0 && (
        <SocialProofBar
          paidCount={paidCount}
          totalProperties={totalProperties}
          paidPercentage={paidPercentage ?? 0}
        />
      )}
    </div>
  );
}

function SocialProofBar({
  paidCount,
  totalProperties,
  paidPercentage,
}: {
  paidCount: number;
  totalProperties: number;
  paidPercentage: number;
}) {
  return (
    <div className="mt-3 pt-3 border-t border-[rgba(245,240,232,0.04)]">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-[var(--text-disabled)] font-medium">Community Payment Status</p>
        <p className="text-xs text-[var(--text-muted)] font-medium">
          {paidCount}/{totalProperties} current
        </p>
      </div>
      <div className="w-full h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#2A5D4F] to-[#3A7D6F] rounded-full transition-all duration-700"
          style={{ width: `${paidPercentage}%` }}
        />
      </div>
      <p className="text-[11px] text-[var(--text-disabled)] mt-1">{paidPercentage}% of properties paid this quarter</p>
    </div>
  );
}
