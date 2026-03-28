'use client';

import { useTreasury } from '@/hooks/useTreasury';

function exportTreasuryPDF() {
  document.body.classList.add('printing-treasury');
  window.print();
  setTimeout(() => document.body.classList.remove('printing-treasury'), 500);
}

export default function TreasuryPage() {
  const {
    totalBalance,
    operatingBalance,
    reserveBalance,
    expenditureCount,
  } = useTreasury();

  const total = parseFloat(totalBalance.replace(/,/g, '')) || 0;
  const operating = parseFloat(operatingBalance.replace(/,/g, '')) || 0;
  const reserve = parseFloat(reserveBalance.replace(/,/g, '')) || 0;
  const operatingPct = total > 0 ? (operating / total) * 100 : 80;
  const reservePct = total > 0 ? (reserve / total) * 100 : 20;

  return (
    <div className="max-w-[960px] mx-auto px-6 py-10 page-enter" data-section="treasury">
      {/* Header */}
      <div className="mb-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
            Finance
          </p>
          <h1 className="text-3xl tracking-tight" style={{ fontWeight: 400 }}>Community Treasury</h1>
          <p className="text-[15px] mt-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Every dollar publicly recorded and permanently verifiable
          </p>
        </div>
        <button
          onClick={exportTreasuryPDF}
          className="no-print shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-md text-[13px] transition-all"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}
          title="Export as PDF"
        >
          Export PDF
        </button>
      </div>

      {/* Hero — prose style, not giant number */}
      <div className="glass-card rounded-lg p-10 mb-6 page-enter page-enter-delay-1">
        <p className="text-[11px] uppercase tracking-widest mb-6" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
          Total Community Balance
        </p>
        <div className="flex items-baseline gap-3 mb-3">
          <span
            className="font-heading"
            style={{
              fontFamily: 'var(--font-heading), Georgia, serif',
              fontSize: '48px',
              fontWeight: 400,
              letterSpacing: '-0.03em',
              color: 'var(--accent-brass)',
            }}
          >
            ${totalBalance}
          </span>
          <span
            className="text-[13px] uppercase tracking-widest"
            style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}
          >
            USDC
          </span>
        </div>
        <p className="text-[15px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          The community treasury holds ${totalBalance} USDC, with ${operatingBalance} allocated to
          day-to-day operations and ${reserveBalance} held in long-term reserves.
        </p>
      </div>

      {/* Fund cards — verdigris for operating, steel-brass for reserve */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8 page-enter page-enter-delay-2">
        {/* Operating Fund */}
        <div
          className="glass-card rounded-lg p-7"
          style={{ borderLeft: '2px solid rgba(42, 93, 79, 0.4)' }}
        >
          <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: '#5A9E8F', letterSpacing: '0.08em' }}>
            Operating Fund
          </p>
          <p
            className="text-3xl font-heading mb-1"
            style={{ fontFamily: 'var(--font-heading), Georgia, serif', fontWeight: 400, color: '#5A9E8F' }}
          >
            ${operatingBalance}
          </p>
          <p className="text-[12px] mb-4" style={{ color: 'var(--text-muted)' }}>USDC · Day-to-day expenses</p>

          <div className="space-y-2">
            <div className="flex justify-between text-[12px]" style={{ color: 'var(--text-muted)' }}>
              <span>80% of dues</span>
              <span style={{ color: '#5A9E8F' }}>{operatingPct.toFixed(0)}%</span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${operatingPct}%`, background: '#2A5D4F' }}
              />
            </div>
          </div>
        </div>

        {/* Reserve Fund */}
        <div
          className="glass-card rounded-lg p-7"
          style={{ borderLeft: '2px solid rgba(139, 155, 176, 0.3)' }}
        >
          <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: '#8B9BB0', letterSpacing: '0.08em' }}>
            Reserve Fund
          </p>
          <p
            className="text-3xl font-heading mb-1"
            style={{ fontFamily: 'var(--font-heading), Georgia, serif', fontWeight: 400, color: '#8B9BB0' }}
          >
            ${reserveBalance}
          </p>
          <p className="text-[12px] mb-4" style={{ color: 'var(--text-muted)' }}>USDC · Long-term reserves</p>

          <div className="space-y-2">
            <div className="flex justify-between text-[12px]" style={{ color: 'var(--text-muted)' }}>
              <span>20% of dues</span>
              <span style={{ color: '#8B9BB0' }}>{reservePct.toFixed(0)}%</span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${reservePct}%`, background: '#6B7B90' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Allocation bar — verdigris + steel-brass */}
      <div className="glass-card rounded-lg p-6 mb-8 page-enter page-enter-delay-2">
        <p className="text-[11px] uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
          Allocation Overview
        </p>
        <div className="h-2 rounded-full overflow-hidden flex" style={{ background: 'rgba(245, 240, 232, 0.04)' }}>
          <div
            className="transition-all duration-700"
            style={{ width: `${operatingPct}%`, background: '#2A5D4F' }}
          />
          <div
            className="transition-all duration-700"
            style={{ width: `${reservePct}%`, background: '#6B7B90' }}
          />
        </div>
        <div className="flex justify-between mt-3 text-[12px]" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: '#2A5D4F' }} />
            <span>Operating <span style={{ color: '#5A9E8F' }}>{operatingPct.toFixed(0)}%</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: '#6B7B90' }} />
            <span>Reserve <span style={{ color: '#8B9BB0' }}>{reservePct.toFixed(0)}%</span></span>
          </div>
        </div>
      </div>

      {/* Expenditures */}
      <div className="page-enter page-enter-delay-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg" style={{ fontWeight: 400 }}>Expenditures</h2>
          <span
            className="px-3 py-1.5 rounded-md text-[12px]"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
          >
            {expenditureCount} total
          </span>
        </div>

        {expenditureCount === 0 ? (
          <div className="glass-card rounded-lg p-12 text-center">
            <p
              className="font-heading mb-2"
              style={{
                fontFamily: 'var(--font-heading), Georgia, serif',
                fontStyle: 'italic',
                fontSize: '16px',
                color: 'var(--text-secondary)',
              }}
            >
              No expenditures recorded yet.
            </p>
            <p className="text-[13px] max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
              Every dollar spent will appear here, verified permanently.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[14px]" style={{ color: 'var(--text-muted)' }}>Loading expenditures...</p>
          </div>
        )}
      </div>

      {/* Spending Breakdown — brass bars, no donut */}
      <SpendingBreakdown />

      {/* Transparency banner */}
      <div className="mt-8 glass-card rounded-lg p-6 page-enter page-enter-delay-4" style={{ borderLeft: '2px solid rgba(176, 155, 113, 0.25)' }}>
        <h3 className="text-[18px] mb-2" style={{ fontFamily: "var(--font-heading), Georgia, serif", fontStyle: "italic", fontWeight: 400, color: "var(--accent-brass)" }}>Transparency</h3>
        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Every dollar in and out is permanently recorded. Anyone can verify these numbers at any time — they cannot be altered.
        </p>
      </div>
    </div>
  );
}

const SPENDING_CATEGORIES = [
  { label: 'Maintenance', pct: 40, amount: 48000 },
  { label: 'Landscaping', pct: 25, amount: 30000 },
  { label: 'Reserves', pct: 20, amount: 24000 },
  { label: 'Admin', pct: 15, amount: 18000 },
];

function SpendingBreakdown() {
  return (
    <div className="glass-card rounded-lg p-6 mb-8 page-enter page-enter-delay-3">
      <h2 className="text-lg mb-6" style={{ fontWeight: 400 }}>Spending Breakdown</h2>

      <div className="space-y-4">
        {SPENDING_CATEGORIES.map(({ label, pct, amount }, i) => {
          const opacities = [0.8, 0.6, 0.4, 0.25];
          return (
            <div key={label}>
              <div className="flex justify-between text-[13px] mb-1.5">
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {pct}% · ~${amount.toLocaleString()}/yr
                </span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: 'rgba(245, 240, 232, 0.04)' }}>
                <div
                  className="h-1.5 rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: 'var(--accent-brass)',
                    opacity: opacities[i] ?? 0.4,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] mt-5 pt-4" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)' }}>
        Based on $120,000 annual community budget · Updated quarterly
      </p>
    </div>
  );
}
