'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Calculator, TrendingUp, CheckCircle, Clock, AlertCircle,
  ChevronRight, CreditCard, BarChart3, Landmark, Info,
} from 'lucide-react';

// ── Constants ──
const QUARTERLY_DUES = 200;
const INTEREST_RATE_APR = 0.05;
const ORIGINATION_FEE_BPS = 0.01;

// ── Mock active loan data ──
const MOCK_LOAN = {
  principal: 400,
  interest: 8.22,
  origination: 4.00,
  total: 412.22,
  installmentsTotal: 6,
  installmentsPaid: 3,
  perInstallment: 68.70,
  totalPaid: 206.10,
  remaining: 206.12,
  startDate: 'Jan 15, 2026',
  nextDue: 'April 15, 2026',
  schedule: [
    { n: 1, date: 'Feb 15, 2026',   amount: 68.70, status: 'paid'     },
    { n: 2, date: 'Mar 15, 2026',   amount: 68.70, status: 'paid'     },
    { n: 3, date: 'Apr 15, 2026',   amount: 68.70, status: 'paid'     },
    { n: 4, date: 'Apr 15, 2026',   amount: 68.70, status: 'upcoming' },
    { n: 5, date: 'May 15, 2026',   amount: 68.70, status: 'upcoming' },
    { n: 6, date: 'Jun 15, 2026',   amount: 68.72, status: 'upcoming' },
  ],
};

// ── Community stats ──
const COMMUNITY_STATS = {
  loansIssued: 12,
  activeLoans: 4,
  totalLent: 8400,
  interestEarned: 342,
  defaultRate: '0%',
  poolAvailable: 12600,
  poolTotal: 15000,
};

// ── Calculation helper ──
function calcLoan(quarters: number, installments: number) {
  const principal = quarters * QUARTERLY_DUES;
  const originationFee = Math.round(principal * ORIGINATION_FEE_BPS * 100) / 100;
  // Simple interest over the loan period (in months)
  const months = installments;
  const interest = Math.round(principal * INTEREST_RATE_APR * (months / 12) * 100) / 100;
  const total = principal + interest + originationFee;
  const perMonth = Math.round((total / installments) * 100) / 100;

  return { principal, interest, originationFee, total, perMonth };
}

// ── Status badge ──
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    paid: {
      background: 'rgba(42, 93, 79, 0.18)',
      color: '#3A7D6F',
      border: '1px solid rgba(42, 93, 79, 0.25)',
    },
    upcoming: {
      background: 'rgba(176, 155, 113, 0.10)',
      color: 'var(--aged-brass)',
      border: '1px solid rgba(176, 155, 113, 0.20)',
    },
    overdue: {
      background: 'rgba(107, 58, 58, 0.18)',
      color: '#8B5A5A',
      border: '1px solid rgba(107, 58, 58, 0.25)',
    },
  };

  const labels: Record<string, string> = {
    paid: 'Paid',
    upcoming: 'Upcoming',
    overdue: 'Overdue',
  };

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px]"
      style={styles[status] || styles.upcoming}
    >
      {labels[status] || status}
    </span>
  );
}

// ── Section A: Loan Calculator ──
function LoanCalculator() {
  const [quarters, setQuarters] = useState(2);
  const [installments, setInstallments] = useState(6);

  const calc = useMemo(() => calcLoan(quarters, installments), [quarters, installments]);

  return (
    <div className="glass-card rounded-xl p-8 card-enter card-enter-delay-1">
      <div className="flex items-start gap-3 mb-6">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(176, 155, 113, 0.10)' }}
        >
          <Calculator className="w-4 h-4" style={{ color: 'var(--aged-brass)' }} />
        </div>
        <div>
          <h2
            className="text-lg font-normal mb-0.5"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-heading)' }}
          >
            Explore Your Options
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            See how a payment plan would work for your situation
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {/* Quarters selector */}
        <div>
          <label className="block text-[10px] tracking-widest uppercase mb-3" style={{ color: 'var(--text-disabled)' }}>
            Quarters to Cover
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((q) => (
              <button
                key={q}
                onClick={() => setQuarters(q)}
                className="flex-1 py-2.5 rounded-xl text-sm transition-all duration-200"
                style={{
                  background: quarters === q ? 'rgba(176, 155, 113, 0.14)' : 'rgba(245, 240, 232, 0.03)',
                  border: quarters === q ? '1px solid rgba(176, 155, 113, 0.35)' : '1px solid rgba(245, 240, 232, 0.06)',
                  color: quarters === q ? 'var(--aged-brass)' : 'var(--text-muted)',
                }}
              >
                Q{q}
              </button>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-disabled)' }}>
            {quarters} quarter{quarters !== 1 ? 's' : ''} · ${quarters * QUARTERLY_DUES} USDC
          </p>
        </div>

        {/* Installments selector */}
        <div>
          <label className="block text-[10px] tracking-widest uppercase mb-3" style={{ color: 'var(--text-disabled)' }}>
            Monthly Payments
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min={2}
              max={12}
              step={1}
              value={installments}
              onChange={(e) => setInstallments(Number(e.target.value))}
              className="w-full accent-[#B09B71]"
              style={{ accentColor: 'var(--aged-brass)' }}
            />
            <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-disabled)' }}>
              <span>2 months</span>
              <span className="font-normal" style={{ color: 'var(--aged-brass)' }}>{installments} months</span>
              <span>12 months</span>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div
        className="rounded-xl p-5 mb-6"
        style={{ background: 'rgba(245, 240, 232, 0.025)', border: '1px solid rgba(245, 240, 232, 0.06)' }}
      >
        <p className="text-[10px] tracking-widest uppercase mb-4" style={{ color: 'var(--text-disabled)' }}>
          Payment Breakdown
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] mb-1" style={{ color: 'var(--text-disabled)' }}>Principal</p>
            <p className="text-base font-normal" style={{ color: 'var(--text-body)' }}>${calc.principal.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[11px] mb-1" style={{ color: 'var(--text-disabled)' }}>Interest (5% APR)</p>
            <p className="text-base font-normal" style={{ color: 'var(--text-body)' }}>${calc.interest.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[11px] mb-1" style={{ color: 'var(--text-disabled)' }}>Origination (1%)</p>
            <p className="text-base font-normal" style={{ color: 'var(--text-body)' }}>${calc.originationFee.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[11px] mb-1" style={{ color: 'var(--text-disabled)' }}>Total Owed</p>
            <p className="text-base font-normal" style={{ color: 'var(--text-body)' }}>${calc.total.toFixed(2)}</p>
          </div>
        </div>

        <div
          className="mt-4 pt-4 flex items-center justify-between"
          style={{ borderTop: '1px solid rgba(245, 240, 232, 0.06)' }}
        >
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Monthly amount</span>
          <span className="text-2xl font-normal" style={{ color: 'var(--aged-brass)' }}>
            ${calc.perMonth.toFixed(2)}<span className="text-sm ml-1" style={{ color: 'var(--text-disabled)' }}>/mo</span>
          </span>
        </div>
      </div>

      {/* Apply button — disabled (smart contract not deployed) */}
      <div className="flex items-start gap-3">
        <button
          disabled
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all cursor-not-allowed"
          style={{
            background: 'rgba(176, 155, 113, 0.06)',
            border: '1px solid rgba(176, 155, 113, 0.12)',
            color: 'rgba(176, 155, 113, 0.35)',
          }}
        >
          <CreditCard className="w-4 h-4" />
          Apply for Payment Plan
        </button>
        <div className="flex items-center gap-1.5 mt-2.5">
          <Info className="w-3 h-3" style={{ color: 'var(--text-disabled)' }} />
          <span className="text-xs" style={{ color: 'var(--text-disabled)' }}>
            On-chain settlement launching soon
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Section B: Active Loan Dashboard ──
function ActiveLoanDashboard() {
  const loan = MOCK_LOAN;
  const progressPct = (loan.installmentsPaid / loan.installmentsTotal) * 100;

  return (
    <div className="card-enter card-enter-delay-2">
      <div className="flex items-center gap-2 mb-5">
        <h2
          className="text-xl font-normal"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-heading)' }}
        >
          Your Active Plan
        </h2>
        <span
          className="text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-lg"
          style={{
            background: 'rgba(42, 93, 79, 0.12)',
            color: '#3A7D6F',
            border: '1px solid rgba(42, 93, 79, 0.20)',
          }}
        >
          In Progress
        </span>
      </div>

      {/* Overview card */}
      <div className="glass-card rounded-xl p-6 mb-4">
        {/* Next payment prominent */}
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl mb-5"
          style={{ background: 'rgba(176, 155, 113, 0.07)', border: '1px solid rgba(176, 155, 113, 0.14)' }}
        >
          <Clock className="w-4 h-4 shrink-0" style={{ color: 'var(--aged-brass)' }} />
          <div className="flex-1">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Next payment due </span>
            <span className="text-sm font-normal" style={{ color: 'var(--aged-brass)' }}>{loan.nextDue}</span>
          </div>
          <span className="text-base font-normal" style={{ color: 'var(--aged-brass)' }}>
            ${loan.perInstallment.toFixed(2)}
          </span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          <div>
            <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: 'var(--text-disabled)' }}>Borrowed</p>
            <p className="text-lg font-normal" style={{ color: 'var(--text-body)' }}>${loan.principal.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: 'var(--text-disabled)' }}>Total Owed</p>
            <p className="text-lg font-normal" style={{ color: 'var(--text-body)' }}>${loan.total.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: 'var(--text-disabled)' }}>Paid</p>
            <p className="text-lg font-normal" style={{ color: '#3A7D6F' }}>${loan.totalPaid.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: 'var(--text-disabled)' }}>Remaining</p>
            <p className="text-lg font-normal" style={{ color: 'var(--text-body)' }}>${loan.remaining.toFixed(2)}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--text-disabled)' }}>
              {loan.installmentsPaid} of {loan.installmentsTotal} payments made
            </span>
            <span className="text-xs font-normal" style={{ color: 'var(--aged-brass)' }}>
              {Math.round(progressPct)}%
            </span>
          </div>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, #8A7550, #B09B71)',
              }}
            />
          </div>
        </div>

        {/* Make payment button */}
        <div className="mt-5 flex items-center gap-3">
          <button
            disabled
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm cursor-not-allowed"
            style={{
              background: 'rgba(176, 155, 113, 0.06)',
              border: '1px solid rgba(176, 155, 113, 0.12)',
              color: 'rgba(176, 155, 113, 0.35)',
            }}
          >
            <CreditCard className="w-4 h-4" />
            Make Payment
          </button>
          <div className="flex items-center gap-1.5">
            <Info className="w-3 h-3" style={{ color: 'var(--text-disabled)' }} />
            <span className="text-xs" style={{ color: 'var(--text-disabled)' }}>
              On-chain settlement launching soon
            </span>
          </div>
        </div>
      </div>

      {/* Payment schedule table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div
          className="px-6 py-4"
          style={{ borderBottom: '1px solid rgba(245, 240, 232, 0.06)' }}
        >
          <p className="text-[10px] tracking-widest uppercase" style={{ color: 'var(--text-disabled)' }}>
            Payment Schedule
          </p>
        </div>
        <div className="divide-y" style={{ borderColor: 'rgba(245, 240, 232, 0.04)' }}>
          {loan.schedule.map((row) => (
            <div
              key={row.n}
              className="flex items-center gap-4 px-6 py-3.5 transition-colors"
              style={{
                background: row.status === 'upcoming' && row.n === loan.installmentsPaid + 1
                  ? 'rgba(176, 155, 113, 0.03)'
                  : 'transparent',
              }}
            >
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0"
                style={{
                  background: row.status === 'paid'
                    ? 'rgba(42, 93, 79, 0.14)'
                    : 'rgba(245, 240, 232, 0.04)',
                  color: row.status === 'paid' ? '#3A7D6F' : 'var(--text-disabled)',
                }}
              >
                {row.status === 'paid' ? <CheckCircle className="w-3.5 h-3.5" /> : row.n}
              </span>
              <div className="flex-1">
                <p className="text-sm font-normal" style={{ color: 'var(--text-body)' }}>
                  Payment {row.n}
                  {row.n === loan.installmentsPaid + 1 && (
                    <span className="ml-2 text-[10px]" style={{ color: 'var(--aged-brass)' }}>← next</span>
                  )}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-disabled)' }}>{row.date}</p>
              </div>
              <span className="text-sm" style={{ color: 'var(--text-body)' }}>
                ${row.amount.toFixed(2)}
              </span>
              <StatusBadge status={row.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Section C: Community Stats ──
function CommunityLendingStats() {
  const s = COMMUNITY_STATS;
  const poolPct = (s.poolAvailable / s.poolTotal) * 100;

  return (
    <div className="card-enter card-enter-delay-3">
      <div className="flex items-center gap-3 mb-5">
        <h2
          className="text-xl font-normal"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-heading)' }}
        >
          Community Lending Pool
        </h2>
        <Landmark className="w-4 h-4 opacity-30" />
      </div>

      <div className="glass-card rounded-xl p-6">
        {/* Pool availability */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] tracking-widest uppercase" style={{ color: 'var(--text-disabled)' }}>
              Pool Available
            </span>
            <span className="text-sm font-normal" style={{ color: 'var(--aged-brass)' }}>
              ${s.poolAvailable.toLocaleString()} of ${s.poolTotal.toLocaleString()}
            </span>
          </div>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{
                width: `${poolPct}%`,
                background: 'linear-gradient(90deg, #8A7550, #B09B71)',
              }}
            />
          </div>
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-disabled)' }}>
            Reserve allocation — {Math.round(poolPct)}% available
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          <div>
            <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: 'var(--text-disabled)' }}>
              Total Issued
            </p>
            <p className="text-2xl font-normal" style={{ color: 'var(--text-body)' }}>{s.loansIssued}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-disabled)' }}>plans since launch</p>
          </div>
          <div>
            <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: 'var(--text-disabled)' }}>
              Active Plans
            </p>
            <p className="text-2xl font-normal" style={{ color: 'var(--aged-brass)' }}>{s.activeLoans}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-disabled)' }}>currently repaying</p>
          </div>
          <div>
            <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: 'var(--text-disabled)' }}>
              Total Lent
            </p>
            <p className="text-2xl font-normal" style={{ color: 'var(--text-body)' }}>${s.totalLent.toLocaleString()}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-disabled)' }}>USDC deployed</p>
          </div>
          <div>
            <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: 'var(--text-disabled)' }}>
              Interest Earned
            </p>
            <p className="text-2xl font-normal" style={{ color: '#3A7D6F' }}>${s.interestEarned}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-disabled)' }}>returned to reserve</p>
          </div>
          <div>
            <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: 'var(--text-disabled)' }}>
              Default Rate
            </p>
            <p className="text-2xl font-normal" style={{ color: '#3A7D6F' }}>{s.defaultRate}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-disabled)' }}>perfect record</p>
          </div>
          <div className="flex flex-col justify-center">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(42, 93, 79, 0.08)', border: '1px solid rgba(42, 93, 79, 0.15)' }}
            >
              <BarChart3 className="w-4 h-4 shrink-0" style={{ color: '#3A7D6F' }} />
              <div>
                <p className="text-[10px]" style={{ color: '#3A7D6F' }}>All-time healthy</p>
                <p className="text-[9px]" style={{ color: 'var(--text-disabled)' }}>No defaults recorded</p>
              </div>
            </div>
          </div>
        </div>

        <div
          className="mt-5 pt-4 flex items-start gap-2"
          style={{ borderTop: '1px solid rgba(245, 240, 232, 0.05)' }}
        >
          <Info className="w-3 h-3 mt-0.5 shrink-0" style={{ color: 'var(--text-disabled)' }} />
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-disabled)' }}>
            Aggregate data only. No individual member information is disclosed. All plan activity is
            recorded on-chain for full transparency.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──
export default function LoansPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 page-enter">
      {/* Header */}
      <div className="mb-8 card-enter">
        <div className="flex items-center gap-2 mb-1">
          <Link
            href="/treasury"
            className="text-xs tracking-widest uppercase transition-colors"
            style={{ color: 'var(--text-disabled)' }}
          >
            Treasury
          </Link>
          <ChevronRight className="w-3 h-3" style={{ color: 'var(--text-disabled)' }} />
          <span className="text-xs tracking-widest uppercase" style={{ color: 'var(--aged-brass)' }}>
            Payment Plans
          </span>
        </div>
        <h1
          className="text-3xl font-normal mt-2 mb-1"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-heading)' }}
        >
          Payment Plans
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Flexible payment options for your community dues — split into monthly amounts at 5% APR
        </p>
      </div>

      {/* Section A: Calculator */}
      <div className="mb-10">
        <LoanCalculator />
      </div>

      {/* Divider */}
      <div className="mb-10" style={{ height: '1px', background: 'rgba(245, 240, 232, 0.05)' }} />

      {/* Section B: Active Loan */}
      <div className="mb-10">
        <ActiveLoanDashboard />
      </div>

      {/* Divider */}
      <div className="mb-10" style={{ height: '1px', background: 'rgba(245, 240, 232, 0.05)' }} />

      {/* Section C: Community Stats */}
      <CommunityLendingStats />
    </div>
  );
}
