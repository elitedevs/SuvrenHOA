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
      <div className="glass-card rounded-lg p-5 border-l-2 border-l-green-500/50 transition-all duration-300">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-green-500/15 border border-green-500/25 flex items-center justify-center text-lg shrink-0">
              
            </div>
            <div>
              <p className="text-sm font-bold text-green-400">Dues Current</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Save ${annualSavings} with annual plan ({annualDiscount}% off)
              </p>
            </div>
          </div>
          <Link
            href="/dues"
            className="text-xs text-[#c9a96e] hover:text-[#e8d5a3] font-semibold whitespace-nowrap transition-colors"
          >
            Pay Annual →
          </Link>
        </div>
      </div>
    );
  }

  if (isOverdue) {
    return (
      <div className="glass-card rounded-lg p-5 border-l-2 border-l-red-500/50 transition-all duration-300">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center text-lg shrink-0">
              
            </div>
            <div>
              <p className="text-sm font-bold text-red-400">
                {quartersOwed} quarter{quartersOwed > 1 ? 's' : ''} overdue
              </p>
              <p className="text-xs text-gray-500 mt-0.5">${amountOwed.toFixed(2)} USDC owed</p>
            </div>
          </div>
          <Link
            href="/dues"
            className="text-xs px-3 py-1.5 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 font-semibold whitespace-nowrap transition-all"
          >
            Pay Now →
          </Link>
        </div>
      </div>
    );
  }

  // Upcoming / near-due state
  return (
    <div className="glass-card rounded-lg p-5 border-l-2 border-l-amber-500/50 transition-all duration-300">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-lg shrink-0">
            
          </div>
          <div>
            <p className="text-sm font-bold text-amber-400">
              Dues due soon — ${quarterlyNum.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Save ${annualSavings} with annual plan</p>
          </div>
        </div>
        <Link
          href="/dues"
          className="text-xs px-3 py-1.5 rounded-lg bg-amber-600/20 border border-amber-500/30 text-amber-400 hover:bg-amber-600/30 font-semibold whitespace-nowrap transition-all"
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
      <div className="rounded-lg p-6 border border-green-500/20 bg-green-500/5 border-l-2 border-l-green-500/50 transition-all duration-300">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-green-500/15 border border-green-500/25 flex items-center justify-center text-xl shrink-0">
            
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-green-400 mb-1">
              You&apos;re all paid up! 
            </h3>
            <p className="text-sm text-gray-400">
              Lot #{tokenId} is current on dues. Next quarter coming up — stay ahead with annual payments.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-xl bg-green-500/5 border border-green-500/15">
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Annual Plan Savings</p>
            <p className="text-xl font-normal text-green-400">${annualSavings}</p>
            <p className="text-xs text-gray-600 mt-0.5">vs paying quarterly ({annualDiscount}% discount)</p>
          </div>
          <Link
            href="/dues"
            className="px-5 py-2.5 rounded-xl bg-green-600/20 border border-green-500/30 text-green-400 hover:bg-green-600/30 text-sm font-bold transition-all whitespace-nowrap"
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
      <div className="rounded-lg p-6 border border-red-500/20 bg-red-500/5 border-l-2 border-l-red-500/50 transition-all duration-300">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center text-xl shrink-0">
            
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-red-400 mb-1">
              {quartersOwed} Quarter{quartersOwed > 1 ? 's' : ''} Past Due
            </h3>
            <p className="text-sm text-gray-400">
              Total owed: <span className="text-red-300 font-bold">${amountOwed.toFixed(2)} USDC</span>
              {!socialLoading && unpaidCount !== undefined && unpaidCount > 0 && (
                <> · Your lot is <span className="text-red-300 font-semibold">1 of only {unpaidCount}</span> remaining unpaid</>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-xl bg-red-500/5 border border-red-500/15 mb-4">
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Amount Owed</p>
            <p className="text-xl font-normal text-red-400">${amountOwed.toFixed(2)} USDC</p>
            <p className="text-xs text-gray-600 mt-0.5">
              {quartersOwed} × ${quarterlyNum.toFixed(2)} quarterly
            </p>
          </div>
          <Link
            href="/dues"
            className="px-5 py-2.5 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 text-sm font-bold transition-all whitespace-nowrap"
          >
            Pay Now →
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
    <div className="rounded-lg p-6 border border-amber-500/20 bg-amber-500/5 border-l-2 border-l-amber-500/50 transition-all duration-300">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-xl shrink-0">
          
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-amber-400 mb-1">
            Dues Coming Up — ${quarterlyNum.toFixed(2)}
          </h3>
          <p className="text-sm text-gray-400">
            Your quarterly dues are due soon. Pay annual now and save ${annualSavings} ({annualDiscount}% discount).
            {!socialLoading && paidCount > 0 && (
              <>
                {' '}
                <span className="text-amber-300 font-semibold">{paidCount} of {totalProperties} neighbors</span> have already paid this quarter.
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 mb-4">
        <div className="flex-1">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Annual Savings</p>
          <p className="text-xl font-normal text-amber-400">Save ${annualSavings}</p>
          <p className="text-xs text-gray-600 mt-0.5">pay 4 quarters at {annualDiscount}% off</p>
        </div>
        <Link
          href="/dues"
          className="px-5 py-2.5 rounded-xl bg-amber-600/20 border border-amber-500/30 text-amber-400 hover:bg-amber-600/30 text-sm font-bold transition-all whitespace-nowrap"
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
    <div className="mt-3 pt-3 border-t border-gray-800/50">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-500 font-semibold">Community Payment Status</p>
        <p className="text-xs text-gray-400 font-bold">
          {paidCount}/{totalProperties} current
        </p>
      </div>
      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all duration-700"
          style={{ width: `${paidPercentage}%` }}
        />
      </div>
      <p className="text-[11px] text-gray-600 mt-1">{paidPercentage}% of properties paid this quarter</p>
    </div>
  );
}
