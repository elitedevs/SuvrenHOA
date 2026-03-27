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

    return last12.map(({ year, month }) => {
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      const isPaid = paidMonths.some(p => p.startsWith(key));
      const isFuture = new Date(year, month, 1) > now;

      let status: PaymentStatus = 'missed';
      if (isFuture) status = 'pending';
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
    <div className="glass-card rounded-lg p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">Payment History</p>
          <h2 className="text-base font-bold text-gray-100">Last 12 Months</h2>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-green-500/70" />
            <span className="text-gray-400">{paidCount} Paid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-red-500/50" />
            <span className="text-gray-400">{missedCount} Missed</span>
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
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {shortMonth}: <span className={status === 'paid' ? 'text-green-400' : status === 'missed' ? 'text-red-400' : 'text-gray-500'}>
                  {status === 'paid' ? ' Paid' : status === 'missed' ? ' Missed' : '— Pending'}
                </span>
              </div>

              {/* Bar */}
              <div className="w-full relative flex items-end" style={{ height: '100%' }}>
                <div
                  className={`w-full rounded-t transition-all duration-500 ${
                    status === 'paid'
                      ? 'bg-gradient-to-t from-green-600/80 to-green-400/80 border-t border-green-500/40'
                      : status === 'missed'
                      ? 'bg-gradient-to-t from-red-900/60 to-red-700/40 border-t border-red-500/20'
                      : 'bg-gray-800/40 border-t border-gray-700/20'
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
            <span className="text-[9px] text-gray-600 font-medium">{shortMonth}</span>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
        <span className="text-gray-500">
          {paidCount === 0
            ? 'No payment history found'
            : `${paidCount} of 12 months paid`}
        </span>
        {missedCount > 0 && (
          <span className="text-red-400 font-medium">
            {missedCount} missed payment{missedCount !== 1 ? 's' : ''}
          </span>
        )}
        {missedCount === 0 && paidCount > 0 && (
          <span className="text-green-400 font-medium"> All clear!</span>
        )}
      </div>
    </div>
  );
}
