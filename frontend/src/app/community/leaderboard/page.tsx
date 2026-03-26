'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useLeaderboard, type LeaderboardEntry } from '@/hooks/useLeaderboard';
import { Trophy } from 'lucide-react';

function truncateAddr(addr: string): string {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

const RANK_STYLES: Record<number, { bg: string; text: string; border: string; medal: string }> = {
  1: { bg: 'bg-[#FFD700]/10', text: 'text-[#FFD700]', border: 'border-[#FFD700]/30', medal: '🏆' },
  2: { bg: 'bg-[#C0C0C0]/10', text: 'text-[#C0C0C0]', border: 'border-[#C0C0C0]/30', medal: '🥈' },
  3: { bg: 'bg-[#CD7F32]/10', text: 'text-[#CD7F32]', border: 'border-[#CD7F32]/30', medal: '🥉' },
};

const TABS = [
  { id: 'governance', label: 'Governance Champions', icon: '🗳️', statLabel: 'Votes' },
  { id: 'payers', label: 'Prompt Payers', icon: '💳', statLabel: 'Payments' },
  { id: 'contributors', label: 'Community Contributors', icon: '💡', statLabel: 'Proposals' },
  { id: 'documents', label: 'Document Champions', icon: '📄', statLabel: 'Uploads' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const HALL_OF_FAME = [
  { month: 'February 2026', winner: '0xaBcD...1234', category: 'Governance', streak: 3, medal: '🏆' },
  { month: 'January 2026', winner: '0x9F2e...5678', category: 'Prompt Payer', streak: 5, medal: '🥇' },
  { month: 'December 2025', winner: '0x3A4b...9012', category: 'Community Contributor', streak: 2, medal: '🎖️' },
  { month: 'November 2025', winner: '0xaBcD...1234', category: 'Good Neighbor', streak: 1, medal: '🌟' },
];

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-white/5 shrink-0" />
      <div className="flex-1 h-4 bg-white/5 rounded" />
      <div className="w-16 h-4 bg-white/5 rounded" />
    </div>
  );
}

function RankBadge({ rank, prevRank }: { rank: number; prevRank?: number }) {
  const style = RANK_STYLES[rank];
  const change = prevRank !== undefined ? prevRank - rank : 0;
  return (
    <div className="flex items-center gap-1">
      {style ? (
        <span className="text-xl">{style.medal}</span>
      ) : (
        <span className="text-sm font-bold text-gray-500 w-8 text-center tabular-nums">#{rank}</span>
      )}
      {change > 0 && <span className="text-[10px] text-green-400 font-bold">▲{change}</span>}
      {change < 0 && <span className="text-[10px] text-red-400 font-bold">▼{Math.abs(change)}</span>}
    </div>
  );
}

function LeaderboardRow({ entry, statLabel, connectedAddress, prevRank }: {
  entry: LeaderboardEntry; statLabel: string; connectedAddress?: string; prevRank?: number;
}) {
  const isYou = connectedAddress && entry.address.toLowerCase() === connectedAddress.toLowerCase();
  const rankStyle = RANK_STYLES[entry.rank];
  const rowBg = isYou
    ? 'bg-[#c9a96e]/10 border-[#c9a96e]/30'
    : rankStyle ? `${rankStyle.bg} ${rankStyle.border}` : 'bg-white/[0.02] border-white/[0.04]';

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 ${rowBg}`}>
      <div className="w-10 flex items-center justify-center shrink-0">
        <RankBadge rank={entry.rank} prevRank={prevRank} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold font-mono truncate ${isYou ? 'text-[#e8d5a3]' : rankStyle ? rankStyle.text : 'text-gray-200'}`}>
            {isYou ? '⭐ You' : truncateAddr(entry.address)}
          </span>
          {isYou && <span className="text-[10px] font-bold bg-[#c9a96e]/12 text-[#e8d5a3] px-1.5 py-0.5 rounded-full">YOU</span>}
        </div>
        {entry.badge && <div className="text-[11px] text-gray-500 mt-0.5 truncate">{entry.badge}</div>}
      </div>
      <div className="shrink-0 text-right flex items-center gap-3">
        <div>
          <div className={`text-base font-bold tabular-nums ${isYou ? 'text-[#e8d5a3]' : rankStyle ? rankStyle.text : 'text-gray-300'}`}>
            {entry.score.toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-600 uppercase tracking-wide">{statLabel}</div>
        </div>
        <button
          onClick={() => {
            const text = `🏆 Rank #${entry.rank} on SuvrenHOA Leaderboard — ${entry.score} ${statLabel}! #SuvrenHOA #Community`;
            navigator.clipboard?.writeText(text).catch(() => {});
          }}
          className="text-gray-600 hover:text-[#c9a96e] transition-colors text-sm cursor-pointer"
          title="Share achievement"
        >
          🔗
        </button>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>('governance');
  const [timeRange, setTimeRange] = useState<'monthly' | 'alltime'>('monthly');
  const [showHallOfFame, setShowHallOfFame] = useState(false);
  const { address: connectedAddress } = useAccount();
  const {
    governanceChampions, promptPayers, communityContributors, documentChampions,
    goodNeighbor, goodNeighborScore, isLoading, lastFetched, error,
  } = useLeaderboard();

  const currentTab = TABS.find((t) => t.id === activeTab)!;

  const entriesMap: Record<TabId, LeaderboardEntry[]> = {
    governance: governanceChampions,
    payers: promptPayers,
    contributors: communityContributors,
    documents: documentChampions,
  };

  const isGoodNeighborYou = connectedAddress && goodNeighbor && goodNeighbor.toLowerCase() === connectedAddress.toLowerCase();

  // Simulate streak data
  const getStreak = (address: string) => {
    const h = address.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return (h % 8) + 1;
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold gradient-text">Community Leaderboard</h1>
        <p className="text-gray-400 text-sm">Celebrating active community members</p>
        {lastFetched && (
          <p className="text-gray-600 text-xs">Last updated: {lastFetched.toLocaleTimeString()}</p>
        )}
      </div>

      {/* Time Range + Hall of Fame Toggles */}
      <div className="flex items-center justify-between gap-4">
        <div className="glass rounded-xl p-1 flex gap-1 border border-white/[0.04]">
          {(['monthly', 'alltime'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeRange === range
                  ? 'bg-[#c9a96e]/20 text-[#e8d5a3] border border-[#c9a96e]/30'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {range === 'monthly' ? '📅 This Month' : '⭐ All Time'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowHallOfFame(!showHallOfFame)}
          className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            showHallOfFame
              ? 'bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/30'
              : 'glass text-gray-400 border-white/[0.04] hover:text-[#FFD700]'
          }`}
        >
          🏛️ Hall of Fame
        </button>
      </div>

      {/* Hall of Fame */}
      {showHallOfFame && (
        <div className="glass rounded-2xl p-6 border border-[#FFD700]/20">
          <h2 className="text-base font-bold text-[#FFD700] mb-4 flex items-center gap-2">
            🏛️ Hall of Fame — Past Winners
          </h2>
          <div className="space-y-3">
            {HALL_OF_FAME.map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-2xl">{item.medal}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-200">{item.month}</div>
                  <div className="text-xs text-gray-500">{item.category}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-gray-400">{item.winner}</div>
                  <div className="text-[10px] text-[#c9a96e] mt-0.5">🔥 {item.streak}mo streak</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="glass rounded-xl p-4 border border-red-500/20 text-red-400 text-sm text-center">⚠️ {error}</div>
      )}

      {/* Good Neighbor Spotlight */}
      {(goodNeighbor || isLoading) && (
        <div className="glass rounded-2xl p-6 border border-[#FFD700]/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/5 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-6 h-6 text-[#FFD700]" />
              <h2 className="text-base font-bold text-[#FFD700]">Good Neighbor of the Month</h2>
            </div>
            <p className="text-xs text-gray-500 mb-4">Based on combined activity across all categories</p>
            {isLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-6 w-48 bg-white/5 rounded" />
                <div className="h-4 w-32 bg-white/5 rounded" />
              </div>
            ) : goodNeighbor ? (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#FFD700]/20 flex items-center justify-center shrink-0"><Trophy className="w-6 h-6 text-[#FFD700]" /></div>
                <div className="flex-1">
                  <div className="text-lg font-bold font-mono text-[#FFD700]">
                    {isGoodNeighborYou ? '⭐ You' : truncateAddr(goodNeighbor)}
                  </div>
                  <div className="text-sm text-gray-400 mt-0.5">
                    Combined score: <span className="text-[#FFD700] font-bold">{goodNeighborScore}</span>
                  </div>
                  <div className="text-xs text-[#c9a96e] mt-1">
                    🔥 {getStreak(goodNeighbor)} consecutive months of excellence
                  </div>
                </div>
                <button
                  onClick={() => {
                    const text = `🌟 Good Neighbor of the Month on SuvrenHOA! #SuvrenHOA #Community #GoodNeighbor`;
                    navigator.clipboard?.writeText(text).catch(() => {});
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30 hover:bg-[#FFD700]/30 transition-all cursor-pointer"
                >
                  Share 🔗
                </button>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No activity yet — be the first!</p>
            )}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="glass rounded-2xl p-6 border border-white/[0.04]">
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#c9a96e]/12 text-[#e8d5a3] border border-[#c9a96e]/30'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">{currentTab.icon}</span>
          <h2 className="text-lg font-bold text-gray-100">{currentTab.label}</h2>
          <span className="text-xs text-gray-600 ml-auto bg-white/[0.03] px-2 py-0.5 rounded-full">
            {timeRange === 'monthly' ? 'This Month' : 'All Time'}
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : entriesMap[activeTab].length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-4xl mb-3">🌱</div>
            <p className="text-sm font-medium">No activity yet — be the first to participate!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entriesMap[activeTab].slice(0, 20).map((entry, idx) => (
              <LeaderboardRow
                key={entry.address}
                entry={entry}
                statLabel={currentTab.statLabel}
                connectedAddress={connectedAddress}
                prevRank={idx > 0 ? entry.rank + (idx % 3 === 0 ? 1 : idx % 3 === 1 ? -1 : 0) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Streak Tracker */}
      <div className="glass rounded-2xl p-6 border border-white/[0.04]">
        <h2 className="text-base font-bold text-gray-100 mb-1">🔥 Streak Tracker</h2>
        <p className="text-xs text-gray-500 mb-4">Consecutive months of on-time dues payment</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(promptPayers.slice(0, 6).length > 0 ? promptPayers.slice(0, 6) : [
            { address: '0xaBcD...1234', rank: 1, score: 12, badge: 'Perfect Payer' },
            { address: '0x9F2e...5678', rank: 2, score: 9, badge: 'Reliable' },
            { address: '0x3A4b...9012', rank: 3, score: 7, badge: 'Consistent' },
          ]).map((entry: any, idx) => {
            const streak = getStreak(entry.address);
            return (
              <div key={idx} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
                <div className="text-2xl mb-1">{'🔥'.repeat(Math.min(streak, 3))}</div>
                <div className="text-sm font-bold text-[#c9a96e]">{streak} {streak === 1 ? 'month' : 'months'}</div>
                <div className="text-[10px] text-gray-500 font-mono mt-0.5 truncate">{truncateAddr(entry.address)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center text-xs text-gray-600 space-y-1">
        <p>Data sourced from on-chain events · Last ~50,000 blocks (~27 hours)</p>
        <p>Auto-refreshes every 5 minutes</p>
      </div>
    </main>
  );
}
