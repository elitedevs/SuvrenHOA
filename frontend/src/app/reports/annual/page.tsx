'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

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

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 mb-4">Sign in to view the annual report</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  const d = ANNUAL_DATA;
  const maxBalance = Math.max(...d.monthlyTreasury.map(m => m.balance));
  const minBalance = Math.min(...d.monthlyTreasury.map(m => m.balance));

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter print:px-0">
      {/* Print button */}
      <div className="flex justify-end mb-6 print:hidden">
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] text-sm font-medium transition-all"
        >
           Export / Print
        </button>
      </div>

      {/* Cover */}
      <div className="glass-card rounded-lg p-8 mb-6 bg-gradient-to-br from-[#c9a96e]/10 to-transparent border border-[#c9a96e]/20">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.15em] text-[#c9a96e] font-semibold mb-2">Annual Report</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#e8d5a3] mb-1">{d.community}</h1>
            <p className="text-xl text-gray-400">Fiscal Year {d.year}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-[#c9a96e]">{fmtK(d.treasuryBalance)}</div>
            <div className="text-xs text-gray-400">Total Treasury</div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#c9a96e]/10">
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
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Revenue</h4>
            <FinRow label="HOA Dues Collected" amount={d.duesCollected} budget={d.duesBudgeted} positive />
            <FinRow label="Violation Fines" amount={d.totalFinesCollected} />
            <div className="border-t border-white/5 pt-2">
              <FinRow label="Total Revenue" amount={d.duesCollected + d.totalFinesCollected} bold />
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Expenditures</h4>
            <FinRow label="Operating Expenses" amount={d.totalExpenses} budget={d.expensesBudgeted} />
            <FinRow label="Reserve Contributions" amount={d.reserveContributions} />
            <div className="border-t border-white/5 pt-2">
              <FinRow label="Total Outflow" amount={d.totalExpenses + d.reserveContributions} bold />
            </div>
          </div>
        </div>

        {/* Expense breakdown bar chart */}
        <div className="mt-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Expense Breakdown</h4>
          <div className="space-y-2">
            {d.expenses.map(e => (
              <div key={e.category}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-300">{e.category}</span>
                  <span className="text-gray-400">{fmt(e.amount)} ({e.pct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#b8942e] to-[#c9a96e]"
                    style={{ width: `${e.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Treasury Trend */}
        <div className="mt-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Treasury Balance Trend</h4>
          <div className="flex items-end gap-1 h-20">
            {d.monthlyTreasury.map(m => {
              const pct = ((m.balance - minBalance) / (maxBalance - minBalance)) * 80 + 20;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group">
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-[#b8942e] to-[#c9a96e] transition-all opacity-80 hover:opacity-100"
                    style={{ height: `${pct}%` }}
                    title={`${m.month}: ${fmtK(m.balance)}`}
                  />
                  <span className="text-[8px] text-gray-600">{m.month}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-gray-600 mt-1">
            <span>{fmtK(minBalance)}</span>
            <span className="text-[#c9a96e]">End: {fmtK(d.treasuryBalance)}</span>
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
            <div className="text-2xl font-bold text-[#c9a96e]">{d.amenityBookings}</div>
            <div className="text-[10px] text-gray-500">Amenity Bookings</div>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-[#c9a96e]">{d.poolVisits.toLocaleString()}</div>
            <div className="text-[10px] text-gray-500">Pool Visits</div>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-[#c9a96e]">{d.clubhouseEvents}</div>
            <div className="text-[10px] text-gray-500">Clubhouse Events</div>
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
      <div className="mt-8 p-5 rounded-xl bg-[#c9a96e]/5 border border-[#c9a96e]/15 text-center">
        <p className="text-xs text-gray-400">
          {d.community} — {d.year} Annual Report · Generated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
        <p className="text-[10px] text-gray-600 mt-1">
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
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <div className={`text-xl font-bold ${highlight ? 'text-[#c9a96e]' : 'text-gray-200'}`}>{value}</div>
      <div className="text-[10px] text-gray-500">{label}</div>
    </div>
  );
}

function FinRow({ label, amount, budget, positive, bold }: { label: string; amount: number; budget?: number; positive?: boolean; bold?: boolean }) {
  const variance = budget ? amount - budget : null;
  const isOver = variance !== null && variance > 0;
  return (
    <div className={`flex items-center justify-between ${bold ? 'font-semibold' : ''}`}>
      <span className={`text-sm ${bold ? 'text-gray-100' : 'text-gray-400'}`}>{label}</span>
      <div className="text-right">
        <span className={`text-sm ${bold ? 'text-gray-100' : 'text-gray-200'}`}>{fmt(amount)}</span>
        {budget && (
          <span className={`text-[10px] ml-2 ${
            positive ? (!isOver ? 'text-green-400' : 'text-red-400') : (isOver ? 'text-red-400' : 'text-green-400')
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
      <div className={`text-2xl font-bold ${color === 'green' ? 'text-green-400' : color === 'red' ? 'text-red-400' : 'text-[#c9a96e]'}`}>
        {value}
      </div>
      <div className="text-[10px] text-gray-500">{label}</div>
    </div>
  );
}

function ProgressItem({ label, value }: { label: string; value: number }) {
  const color = value >= 90 ? 'bg-green-500' : value >= 70 ? 'bg-[#c9a96e]' : value >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-200 font-medium">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
