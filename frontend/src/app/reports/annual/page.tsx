'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { usePublicStats } from '@/hooks/usePublicData';

const YEAR = 2025;

// Mock annual data
const ANNUAL_DATA = {
  year: YEAR,
  community: 'Faircroft HOA',
  totalUnits: 150,
  occupiedUnits: 147,
  newResidents: 12,
  departingResidents: 9,

  // Finances
  duesCollected: 892500,
  duesBudgeted: 900000,
  totalExpenses: 743200,
  expensesBudgeted: 780000,
  reserveContributions: 112500,
  reserveBalance: 1247000,
  operatingBalance: 148300,
  treasuryBalance: 1395300,

  // Expenses breakdown
  expenses: [
    { category: 'Landscaping', amount: 187500, pct: 25 },
    { category: 'Pool & Amenities', amount: 125000, pct: 17 },
    { category: 'Management', amount: 108000, pct: 15 },
    { category: 'Insurance', amount: 97200, pct: 13 },
    { category: 'Utilities', amount: 89100, pct: 12 },
    { category: 'Maintenance/Repairs', amount: 74200, pct: 10 },
    { category: 'Administration', amount: 62200, pct: 8 },
  ],

  // Governance
  proposalsSubmitted: 18,
  proposalsPassed: 14,
  proposalsFailed: 3,
  proposalsWithdrawn: 1,
  boardMeetings: 12,
  boardMeetingAttendance: 68,
  residentVoterParticipation: 74,

  // Maintenance
  maintenanceRequests: 234,
  maintenanceCompleted: 228,
  avgResolutionDays: 4.2,
  emergencyResponses: 7,

  // Violations
  violationsReported: 43,
  violationsResolved: 39,
  violationsFined: 8,
  totalFinesCollected: 3200,

  // Amenities (bookings)
  amenityBookings: 892,
  poolVisits: 3400,
  clubhouseEvents: 47,

  // Treasury trend (monthly)
  monthlyTreasury: [
    { month: 'Jan', balance: 1210000 },
    { month: 'Feb', balance: 1198000 },
    { month: 'Mar', balance: 1256000 },
    { month: 'Apr', balance: 1242000 },
    { month: 'May', balance: 1218000 },
    { month: 'Jun', balance: 1234000 },
    { month: 'Jul', balance: 1290000 },
    { month: 'Aug', balance: 1278000 },
    { month: 'Sep', balance: 1302000 },
    { month: 'Oct', balance: 1318000 },
    { month: 'Nov', balance: 1375000 },
    { month: 'Dec', balance: 1395300 },
  ],
};

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
const fmtK = (n: number) => n >= 1000000 ? `$${(n / 1000000).toFixed(2)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;

export default function AnnualReportPage() {
  const { isConnected } = useAccount();
  const { totalProperties, totalTreasuryNum, documentsOnChain } = usePublicStats();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-[rgba(245,240,232,0.50)] mb-4">Sign in to view the annual report</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  // Use real on-chain data where available; keep mock for operational metrics not yet on-chain
  const liveUnits = totalProperties > 0 ? totalProperties : ANNUAL_DATA.totalUnits;
  const liveTreasury = totalTreasuryNum > 0 ? totalTreasuryNum : ANNUAL_DATA.treasuryBalance;
  const liveOccupancy = totalProperties > 0 ? Math.round((totalProperties / totalProperties) * 100) : Math.round(ANNUAL_DATA.occupiedUnits / ANNUAL_DATA.totalUnits * 100);

  const d = {
    ...ANNUAL_DATA,
    totalUnits: liveUnits,
    occupiedUnits: liveUnits, // on-chain minted = occupied
    treasuryBalance: liveTreasury,
  };
  const maxBalance = Math.max(...d.monthlyTreasury.map(m => m.balance));
  const minBalance = Math.min(...d.monthlyTreasury.map(m => m.balance));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter print:px-0">
      {/* Print button */}
      <div className="flex justify-end mb-6 print:hidden">
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[#1a1a1a] text-sm font-medium transition-all"
        >
           Export / Print
        </button>
      </div>

      {/* Cover */}
      <div className="glass-card rounded-2xl p-8 mb-6 bg-gradient-to-br from-[#B09B71]/10 to-transparent border border-[#B09B71]/20">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.15em] text-[#B09B71] font-semibold mb-2">Annual Report</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#D4C4A0] mb-1">{d.community}</h1>
            <p className="text-xl text-[rgba(245,240,232,0.50)]">Fiscal Year {d.year}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-[#B09B71]">{fmtK(d.treasuryBalance)}</div>
            <div className="text-xs text-[rgba(245,240,232,0.50)]">Total Treasury</div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#B09B71]/10">
          <StatBox label="Total Units" value={d.totalUnits.toString()} />
          <StatBox label="Occupancy Rate" value={`${Math.round(d.occupiedUnits / d.totalUnits * 100)}%`} />
          <StatBox label="New Residents" value={`+${d.newResidents}`} highlight />
          <StatBox label="Year Net" value={`+$${((d.duesCollected - d.totalExpenses - d.reserveContributions) / 1000).toFixed(0)}K`} highlight />
        </div>
      </div>

      {/* Financial Summary */}
      <Section title=" Financial Summary" subtitle="Revenue, expenses, and reserve fund status">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[rgba(245,240,232,0.35)]">Revenue</h4>
            <FinRow label="HOA Dues Collected" amount={d.duesCollected} budget={d.duesBudgeted} positive />
            <FinRow label="Violation Fines" amount={d.totalFinesCollected} />
            <div className="border-t border-white/5 pt-2">
              <FinRow label="Total Revenue" amount={d.duesCollected + d.totalFinesCollected} bold />
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[rgba(245,240,232,0.35)]">Expenditures</h4>
            <FinRow label="Operating Expenses" amount={d.totalExpenses} budget={d.expensesBudgeted} />
            <FinRow label="Reserve Contributions" amount={d.reserveContributions} />
            <div className="border-t border-white/5 pt-2">
              <FinRow label="Total Outflow" amount={d.totalExpenses + d.reserveContributions} bold />
            </div>
          </div>
        </div>

        {/* Expense breakdown bar chart */}
        <div className="mt-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[rgba(245,240,232,0.35)] mb-3">Expense Breakdown</h4>
          <div className="space-y-2">
            {d.expenses.map(e => (
              <div key={e.category}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[rgba(245,240,232,0.65)]">{e.category}</span>
                  <span className="text-[rgba(245,240,232,0.50)]">{fmt(e.amount)} ({e.pct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#b8942e] to-[#B09B71]"
                    style={{ width: `${e.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Treasury Trend */}
        <div className="mt-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[rgba(245,240,232,0.35)] mb-3">Treasury Balance Trend</h4>
          <div className="flex items-end gap-1 h-20">
            {d.monthlyTreasury.map(m => {
              const pct = ((m.balance - minBalance) / (maxBalance - minBalance)) * 80 + 20;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group">
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-[#b8942e] to-[#B09B71] transition-all opacity-80 hover:opacity-100"
                    style={{ height: `${pct}%` }}
                    title={`${m.month}: ${fmtK(m.balance)}`}
                  />
                  <span className="text-[8px] text-[rgba(245,240,232,0.25)]">{m.month}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-[rgba(245,240,232,0.25)] mt-1">
            <span>{fmtK(minBalance)}</span>
            <span className="text-[#B09B71]">End: {fmtK(d.treasuryBalance)}</span>
            <span>{fmtK(maxBalance)}</span>
          </div>
        </div>
      </Section>

      {/* Governance */}
      <Section title=" Governance" subtitle="Board activity, proposals, and resident participation">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <MetricCard label="Proposals" value={d.proposalsSubmitted} />
          <MetricCard label="Passed" value={d.proposalsPassed} color="green" />
          <MetricCard label="Failed" value={d.proposalsFailed} color="red" />
          <MetricCard label="Board Meetings" value={d.boardMeetings} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ProgressItem label="Proposal Pass Rate" value={Math.round(d.proposalsPassed / d.proposalsSubmitted * 100)} />
          <ProgressItem label="Voter Participation" value={d.residentVoterParticipation} />
          <ProgressItem label="Board Meeting Attendance" value={d.boardMeetingAttendance} />
          <ProgressItem label="Dues Collection Rate" value={Math.round(d.duesCollected / d.duesBudgeted * 100)} />
        </div>
      </Section>

      {/* Operations */}
      <Section title=" Operations & Maintenance" subtitle="Service requests, response times, and amenity usage">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <MetricCard label="Requests Filed" value={d.maintenanceRequests} />
          <MetricCard label="Completed" value={d.maintenanceCompleted} color="green" />
          <MetricCard label="Avg Days" value={d.avgResolutionDays} />
          <MetricCard label="Emergency" value={d.emergencyResponses} color="red" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="glass-card rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-[#B09B71]">{d.amenityBookings}</div>
            <div className="text-[10px] text-[rgba(245,240,232,0.35)]">Amenity Bookings</div>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-[#B09B71]">{d.poolVisits.toLocaleString()}</div>
            <div className="text-[10px] text-[rgba(245,240,232,0.35)]">Pool Visits</div>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-[#B09B71]">{d.clubhouseEvents}</div>
            <div className="text-[10px] text-[rgba(245,240,232,0.35)]">Clubhouse Events</div>
          </div>
        </div>
      </Section>

      {/* Violations */}
      <Section title=" Violations & Enforcement" subtitle="Community standards enforcement summary">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard label="Reported" value={d.violationsReported} />
          <MetricCard label="Resolved" value={d.violationsResolved} color="green" />
          <MetricCard label="Fined" value={d.violationsFined} color="red" />
          <MetricCard label="Fines Collected" value={`$${(d.totalFinesCollected / 100 * 100).toLocaleString()}`} />
        </div>
        <div className="mt-4">
          <ProgressItem label="Resolution Rate" value={Math.round(d.violationsResolved / d.violationsReported * 100)} />
        </div>
      </Section>

      {/* Footer */}
      <div className="mt-8 p-5 rounded-xl bg-[#B09B71]/5 border border-[#B09B71]/15 text-center">
        <p className="text-xs text-[rgba(245,240,232,0.50)]">
          {d.community} — {d.year} Annual Report · Generated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
        <p className="text-[10px] text-[rgba(245,240,232,0.25)] mt-1">
          All figures are estimates. Official audited financials available from the HOA management company upon request.
        </p>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-xl p-6 mb-6">
      <div className="mb-5">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-xs text-[rgba(245,240,232,0.50)] mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <div className={`text-xl font-bold ${highlight ? 'text-[#B09B71]' : 'text-[rgba(245,240,232,0.80)]'}`}>{value}</div>
      <div className="text-[10px] text-[rgba(245,240,232,0.35)]">{label}</div>
    </div>
  );
}

function FinRow({ label, amount, budget, positive, bold }: { label: string; amount: number; budget?: number; positive?: boolean; bold?: boolean }) {
  const variance = budget ? amount - budget : null;
  const isOver = variance !== null && variance > 0;
  return (
    <div className={`flex items-center justify-between ${bold ? 'font-semibold' : ''}`}>
      <span className={`text-sm ${bold ? 'text-[rgba(245,240,232,0.90)]' : 'text-[rgba(245,240,232,0.50)]'}`}>{label}</span>
      <div className="text-right">
        <span className={`text-sm ${bold ? 'text-[rgba(245,240,232,0.90)]' : 'text-[rgba(245,240,232,0.80)]'}`}>{fmt(amount)}</span>
        {budget && (
          <span className={`text-[10px] ml-2 ${
            positive ? (!isOver ? 'text-[#3A7D6F]' : 'text-[#8B5A5A]') : (isOver ? 'text-[#8B5A5A]' : 'text-[#3A7D6F]')
          }`}>
            {variance! > 0 ? '+' : ''}{fmt(variance!)}
          </span>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: number | string; color?: 'green' | 'red' }) {
  return (
    <div className="bg-gray-800/30 rounded-xl p-3 text-center">
      <div className={`text-2xl font-bold ${color === 'green' ? 'text-[#3A7D6F]' : color === 'red' ? 'text-[#8B5A5A]' : 'text-[#B09B71]'}`}>
        {value}
      </div>
      <div className="text-[10px] text-[rgba(245,240,232,0.35)]">{label}</div>
    </div>
  );
}

function ProgressItem({ label, value }: { label: string; value: number }) {
  const color = value >= 90 ? 'bg-[#3A7D6F]' : value >= 70 ? 'bg-[#B09B71]' : value >= 50 ? 'bg-[#B09B71]' : 'bg-[#8B5A5A]';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[rgba(245,240,232,0.50)]">{label}</span>
        <span className="text-[rgba(245,240,232,0.80)] font-medium">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
