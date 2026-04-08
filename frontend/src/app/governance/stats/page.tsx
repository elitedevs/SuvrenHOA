'use client';

import Link from 'next/link';
import { FileText, CheckCircle, Users, Clock } from 'lucide-react';

// Mock governance stats — replace with real data aggregation as needed
const MOCK_STATS = {
  totalProposals: 24,
  passRate: 72,
  avgTurnout: 58,
  avgVotingPeriodDays: 5,
  mostActiveVoters: [
    { address: '0x1234...5678', lot: 3, votes: 18 },
    { address: '0xABCD...EF01', lot: 7, votes: 15 },
    { address: '0x9876...4321', lot: 12, votes: 14 },
    { address: '0x5555...AAAA', lot: 1, votes: 11 },
    { address: '0xDEAD...BEEF', lot: 22, votes: 9 },
  ],
  monthlyProposals: [
    { month: 'Oct', count: 2 },
    { month: 'Nov', count: 4 },
    { month: 'Dec', count: 1 },
    { month: 'Jan', count: 5 },
    { month: 'Feb', count: 6 },
    { month: 'Mar', count: 6 },
  ],
};

export default function GovernanceStatsPage() {
  const maxBarCount = Math.max(...MOCK_STATS.monthlyProposals.map(m => m.count));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 page-enter">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link href="/proposals" className="text-[var(--text-disabled)] hover:text-[#B09B71] text-sm transition-colors">← Proposals</Link>
      </div>
      <div className="mb-8">
        <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-1">Governance</p>
        <h1 className="text-3xl sm:text-4xl font-medium gradient-text">Stats Dashboard</h1>
        <p className="text-base text-[var(--text-muted)] mt-2">Aggregate metrics for community governance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Proposals', value: MOCK_STATS.totalProposals ?? 0, icon: <FileText className="w-5 h-5 text-[#B09B71]" /> },
          { label: 'Pass Rate', value: `${MOCK_STATS.passRate ?? 0}%`, icon: <CheckCircle className="w-5 h-5 text-[#B09B71]" /> },
          { label: 'Avg Turnout', value: `${MOCK_STATS.avgTurnout ?? 0}%`, icon: <Users className="w-5 h-5 text-[#B09B71]" /> },
          { label: 'Avg Voting Period', value: `${MOCK_STATS.avgVotingPeriodDays ?? 0}d`, icon: <Clock className="w-5 h-5 text-[#B09B71]" /> },
        ].map(stat => (
          <div key={stat.label} className="glass-card rounded-xl hover-lift p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-[rgba(176,155,113,0.10)] border border-[rgba(176,155,113,0.20)] flex items-center justify-center">
                {stat.icon}
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-normal text-[#B09B71] number-reveal">{stat.value}</p>
            <p className="text-[10px] text-[var(--text-disabled)] mt-1 font-medium uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Proposal Bar Chart */}
        <div className="glass-card rounded-xl p-6">
          <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-5">Monthly Proposal Volume</p>
          <div className="flex items-end gap-2 h-36">
            {MOCK_STATS.monthlyProposals.map(m => {
              const heightPct = maxBarCount > 0 ? (m.count / maxBarCount) * 100 : 0;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-[#B09B71] font-medium">{m.count}</span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-[var(--brass-deep)] to-[#B09B71] transition-all duration-700"
                    style={{ height: `${Math.max(heightPct, 8)}%`, minHeight: '6px' }}
                  />
                  <span className="text-[10px] text-[var(--text-disabled)]">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Most Active Voters */}
        <div className="glass-card rounded-xl p-6">
          <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-4">Most Active Voters</p>
          <div className="space-y-3">
            {MOCK_STATS.mostActiveVoters.map((voter, i) => (
              <div key={voter.address} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                  i === 0 ? 'bg-[rgba(176,155,113,0.20)] text-[#B09B71] border border-[rgba(176,155,113,0.30)]' :
                  i === 1 ? 'bg-[rgba(245,240,232,0.06)] text-[var(--text-body)] border border-[rgba(245,240,232,0.06)]' :
                  'bg-[rgba(26,26,30,0.40)] text-[var(--text-disabled)] border border-[rgba(245,240,232,0.06)]'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--parchment)] truncate">{voter.address}</p>
                  <p className="text-[10px] text-[var(--text-disabled)]">Lot #{voter.lot}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-[#B09B71]">{voter.votes}</p>
                  <p className="text-[10px] text-[var(--text-disabled)]">votes</p>
                </div>
                {/* Bar */}
                <div className="w-16 h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden shrink-0">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--brass-deep)] to-[#B09B71] rounded-full"
                    style={{ width: `${(voter.votes / MOCK_STATS.mostActiveVoters[0].votes) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pass/Fail breakdown */}
      <div className="glass-card rounded-xl p-6">
        <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-4">Pass / Fail Breakdown</p>
        <div className="flex items-center gap-4 mb-3">
          <div className="flex-1 h-4 bg-[var(--surface-2)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#2A5D4F] to-[#2A5D4F] rounded-full transition-all duration-700"
              style={{ width: `${MOCK_STATS.passRate}%` }}
            />
          </div>
          <span className="text-sm font-medium text-[#2A5D4F] shrink-0">{MOCK_STATS.passRate}%</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xl font-medium text-[#2A5D4F]">{Math.round(MOCK_STATS.totalProposals * MOCK_STATS.passRate / 100)}</p>
            <p className="text-[10px] text-[var(--text-disabled)]">Passed</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-medium text-[#8B5A5A]">{Math.round(MOCK_STATS.totalProposals * (1 - MOCK_STATS.passRate / 100))}</p>
            <p className="text-[10px] text-[var(--text-disabled)]">Failed/Defeated</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-medium text-[#B09B71]">{MOCK_STATS.totalProposals}</p>
            <p className="text-[10px] text-[var(--text-disabled)]">Total</p>
          </div>
        </div>
      </div>
    </div>
  );
}
