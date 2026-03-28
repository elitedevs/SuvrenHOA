'use client';

import Link from 'next/link';

// Mock governance stats — replace with real on-chain aggregation as needed
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
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-10 page-enter" data-section="governance">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link href="/proposals" className="text-gray-500 hover:text-[#c9a96e] text-sm transition-colors">← Proposals</Link>
      </div>
      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Governance</p>
        <h1 className="text-3xl font-normal tracking-tight">Stats Dashboard</h1>
        <p className="text-base text-gray-400 mt-2">Aggregate metrics for community governance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Proposals', value: MOCK_STATS.totalProposals, color: 'blue' },
          { label: 'Pass Rate', value: `${MOCK_STATS.passRate}%`, color: 'green' },
          { label: 'Avg Turnout', value: `${MOCK_STATS.avgTurnout}%`, color: 'amber' },
          { label: 'Avg Voting Period', value: `${MOCK_STATS.avgVotingPeriodDays}d`, color: 'purple' },
        ].map(stat => (
          <div key={stat.label} className="glass-card rounded-lg hover-lift p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-md bg-[#c9a96e]/10 border border-[#c9a96e]/20 flex items-center justify-center text-lg">
                
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-normal text-[#c9a96e]">{stat.value}</p>
            <p className="text-[10px] text-gray-500 mt-1 font-semibold uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Proposal Bar Chart */}
        <div className="glass-card rounded-lg p-6">
          <p className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Monthly Proposal Volume</p>
          <div className="flex items-end gap-2 h-36">
            {MOCK_STATS.monthlyProposals.map(m => {
              const heightPct = maxBarCount > 0 ? (m.count / maxBarCount) * 100 : 0;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-[#c9a96e] font-bold">{m.count}</span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-[#b8942e] to-[#c9a96e] transition-all duration-700"
                    style={{ height: `${Math.max(heightPct, 8)}%`, minHeight: '6px' }}
                  />
                  <span className="text-[10px] text-gray-500">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Most Active Voters */}
        <div className="glass-card rounded-lg p-6">
          <p className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Most Active Voters</p>
          <div className="space-y-3">
            {MOCK_STATS.mostActiveVoters.map((voter, i) => (
              <div key={voter.address} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  i === 0 ? 'bg-[#c9a96e]/20 text-[#c9a96e] border border-[#c9a96e]/30' :
                  i === 1 ? 'bg-gray-600/30 text-gray-300 border border-gray-600/30' :
                  'bg-gray-800/40 text-gray-500 border border-gray-700/30'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-200 truncate">{voter.address}</p>
                  <p className="text-[10px] text-gray-500">Lot #{voter.lot}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-[#c9a96e]">{voter.votes}</p>
                  <p className="text-[10px] text-gray-500">votes</p>
                </div>
                {/* Bar */}
                <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden shrink-0">
                  <div
                    className="h-full bg-gradient-to-r from-[#b8942e] to-[#c9a96e] rounded-full"
                    style={{ width: `${(voter.votes / MOCK_STATS.mostActiveVoters[0].votes) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pass/Fail breakdown */}
      <div className="glass-card rounded-lg p-6">
        <p className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Pass / Fail Breakdown</p>
        <div className="flex items-center gap-4 mb-3">
          <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ backgroundColor: '#2A5D4F', width: `${MOCK_STATS.passRate}%` }}
            />
          </div>
          <span className="text-sm font-bold text-[#2A5D4F] shrink-0">{MOCK_STATS.passRate}%</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xl font-bold text-[#2A5D4F]">{Math.round(MOCK_STATS.totalProposals * MOCK_STATS.passRate / 100)}</p>
            <p className="text-[10px] text-gray-500">Passed</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-[#6B3A3A]">{Math.round(MOCK_STATS.totalProposals * (1 - MOCK_STATS.passRate / 100))}</p>
            <p className="text-[10px] text-gray-500">Failed/Defeated</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-[#c9a96e]">{MOCK_STATS.totalProposals}</p>
            <p className="text-[10px] text-gray-500">Total</p>
          </div>
        </div>
      </div>
    </div>
  );
}
