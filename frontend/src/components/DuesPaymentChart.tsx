'use client';

import { useMemo } from 'react';

type PaymentStatus = 'paid' | 'missed' | 'pending';

interface MonthData {
  month: string;
  shortMonth: string;
  year: number;
  status: PaymentStatus;
  amount?: number;
}

interface DuesPaymentChartProps {
  /** Array of paid quarter timestamps (ISO or YYYY-MM) */
  paidMonths?: string[];
  quarterlyAmount?: number;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getLast12Months(): { year: number; month: number }[] {
  const now = new Date();
  const result = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({ year: d.getFullYear(), month: d.getMonth() });
  }
  return result;
}

export function DuesPaymentChart({ paidMonths = [], quarterlyAmount = 450 }: DuesPaymentChartProps) {
  const months = useMemo((): MonthData[] => {
    const last12 = getLast12Months();
    const now = new Date();

    const hasAnyData = paidMonths.length > 0;

    return last12.map(({ year, month }) => {
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      const isPaid = paidMonths.some(p => p.startsWith(key));
      const isFuture = new Date(year, month, 1) > now;

      // If no payment data exists at all, don't mark months as missed — show as pending/unknown
      let status: PaymentStatus = 'missed';
      if (isFuture || !hasAnyData) status = 'pending';
      else if (isPaid) status = 'paid';

      return {
        month: key,
        shortMonth: MONTH_NAMES[month],
        year,
        status,
        amount: isPaid ? quarterlyAmount / 3 : undefined,
      };
    });
  }, [paidMonths, quarterlyAmount]);

  const paidCount = months.filter(m => m.status === 'paid').length;
  const missedCount = months.filter(m => m.status === 'missed').length;

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-1">Payment History</p>
          <h2 className="text-base font-medium text-[var(--parchment)]">Last 12 Months</h2>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-[rgba(58,125,111,0.70)]" />
            <span className="text-[var(--text-muted)]">{paidCount} Paid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-[rgba(139,90,90,0.50)]" />
            <span className="text-[var(--text-muted)]">{missedCount} Missed</span>
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-1.5 h-28 mb-3">
        {months.map(({ month, shortMonth, status }) => {
          const heightPct = status === 'paid' ? 100 : status === 'missed' ? 40 : 15;

          return (
            <div key={month} className="flex-1 flex flex-col items-center gap-1 group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[var(--surface-1)] border border-[rgba(245,240,232,0.08)] rounded-lg px-2 py-1 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {shortMonth}: <span className={status === 'paid' ? 'text-[#2A5D4F]' : status === 'missed' ? 'text-[#8B5A5A]' : 'text-[var(--text-disabled)]'}>
                  {status === 'paid' ? ' Paid' : status === 'missed' ? ' Missed' : '— Pending'}
                </span>
              </div>

              {/* Bar */}
              <div className="w-full relative flex items-end" style={{ height: '100%' }}>
                <div
                  className={`w-full rounded-t transition-all duration-500 ${
                    status === 'paid'
                      ? 'bg-gradient-to-t from-[rgba(42,93,79,0.80)] to-[rgba(58,125,111,0.70)] border-t border-[rgba(42,93,79,0.30)]'
                      : status === 'missed'
                      ? 'bg-gradient-to-t from-[rgba(107,58,58,0.60)] to-[rgba(139,90,90,0.40)] border-t border-[rgba(107,58,58,0.20)]'
                      : 'bg-[rgba(26,26,30,0.40)] border-t border-[rgba(245,240,232,0.04)]'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Month labels */}
      <div className="flex gap-1.5">
        {months.map(({ month, shortMonth }) => (
          <div key={month} className="flex-1 text-center">
            <span className="text-[9px] text-[var(--text-disabled)] font-medium">{shortMonth}</span>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-[rgba(245,240,232,0.05)] flex items-center justify-between text-xs">
        <span className="text-[var(--text-disabled)]">
          {paidCount === 0
            ? 'No payment history found'
            : `${paidCount} of 12 months paid`}
        </span>
        {missedCount > 0 && (
          <span className="text-[#8B5A5A] font-medium">
            {missedCount} missed payment{missedCount !== 1 ? 's' : ''}
          </span>
        )}
        {missedCount === 0 && paidCount > 0 && (
          <span className="text-[#2A5D4F] font-medium"> All clear!</span>
        )}
      </div>
    </div>
  );
}
