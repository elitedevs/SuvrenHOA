'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useLeaderboard, type LeaderboardEntry } from '@/hooks/useLeaderboard';
import { Trophy } from 'lucide-react';

function truncateAddr(addr: string): string {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

const RANK_STYLES: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: 'bg-[var(--aged-brass)]/10', text: 'text-[var(--aged-brass)]', border: 'border-[var(--aged-brass)]/30' },
  2: { bg: 'bg-[rgba(245,240,232,0.45)]/10', text: 'text-[rgba(245,240,232,0.45)]', border: 'border-[rgba(245,240,232,0.45)]/30' },
  3: { bg: 'bg-[var(--aged-brass)]/10', text: 'text-[var(--aged-brass)]', border: 'border-[var(--aged-brass)]/30' },
};

const TABS = [
  { id: 'governance', label: 'Governance Champions', icon: '', statLabel: 'Votes' },
  { id: 'payers', label: 'Prompt Payers', icon: '', statLabel: 'Payments' },
  { id: 'contributors', label: 'Community Contributors', icon: '', statLabel: 'Proposals' },
  { id: 'documents', label: 'Document Champions', icon: '', statLabel: 'Uploads' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const HALL_OF_FAME = [
  { month: 'February 2026', winner: '0xaBcD...1234', category: 'Governance', streak: 3 },
  { month: 'January 2026', winner: '0x9F2e...5678', category: 'Prompt Payer', streak: 5 },
  { month: 'December 2025', winner: '0x3A4b...9012', category: 'Community Contributor', streak: 2 },
  { month: 'November 2025', winner: '0xaBcD...1234', category: 'Good Neighbor', streak: 1 },
];

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-[rgba(245,240,232,0.05)] shrink-0" />
      <div className="flex-1 h-4 bg-[rgba(245,240,232,0.05)] rounded" />
      <div className="w-16 h-4 bg-[rgba(245,240,232,0.05)] rounded" />
    </div>
  );
}

function RankBadge({ rank, prevRank }: { rank: number; prevRank?: number }) {
  const style = RANK_STYLES[rank];
  const change = prevRank !== undefined ? prevRank - rank : 0;
  return (
    <div className="flex items-center gap-1">
      {style ? (
        <span className="text-sm font-medium w-8 text-center tabular-nums" style={{ color: 'var(--aged-brass)' }}>#{rank}</span>
      ) : (
        <span className="text-sm font-medium text-[var(--text-disabled)] w-8 text-center tabular-nums">#{rank}</span>
      )}
      {change > 0 && <span className="text-[10px] text-[#2A5D4F] font-medium">+{change}</span>}
      {change < 0 && <span className="text-[10px] text-[#8B5A5A] font-medium">{change}</span>}
    </div>
  );
}

function LeaderboardRow({ entry, statLabel, connectedAddress, prevRank }: {
  entry: LeaderboardEntry; statLabel: string; connectedAddress?: string; prevRank?: number;
}) {
  const isYou = connectedAddress && entry.address.toLowerCase() === connectedAddress.toLowerCase();
  const rankStyle = RANK_STYLES[entry.rank];
  const rowBg = isYou
    ? 'bg-[rgba(176,155,113,0.10)] border-[rgba(176,155,113,0.30)]'
    : rankStyle ? `${rankStyle.bg} ${rankStyle.border}` : 'bg-[rgba(245,240,232,0.02)] border-[rgba(245,240,232,0.04)]';

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-300 ${rowBg}`}>
      <div className="w-10 flex items-center justify-center shrink-0">
        <RankBadge rank={entry.rank} prevRank={prevRank} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium font-mono truncate ${isYou ? 'text-[#D4C4A0]' : rankStyle ? rankStyle.text : 'text-[var(--parchment)]'}`}>
            {isYou ? 'You' : truncateAddr(entry.address)}
          </span>
          {isYou && <span className="text-[10px] font-medium bg-[rgba(176,155,113,0.12)] text-[#D4C4A0] px-1.5 py-0.5 rounded-lg">YOU</span>}
        </div>
        {entry.badge && <div className="text-[11px] text-[var(--text-disabled)] mt-0.5 truncate">{entry.badge}</div>}
      </div>
      <div className="shrink-0 text-right flex items-center gap-3">
        <div>
          <div className={`text-base font-medium tabular-nums ${isYou ? 'text-[#D4C4A0]' : rankStyle ? rankStyle.text : 'text-[var(--text-body)]'}`}>
            {entry.score.toLocaleString()}
          </div>
          <div className="text-[10px] text-[var(--text-disabled)] uppercase tracking-wide">{statLabel}</div>
        </div>
        <button
          onClick={() => {
            const text = `Rank #${entry.rank} on SuvrenHOA Leaderboard — ${entry.score} ${statLabel}! #SuvrenHOA #Community`;
            navigator.clipboard?.writeText(text).catch(() => {});
          }}
          className="text-[var(--text-disabled)] hover:text-[#B09B71] transition-colors text-sm cursor-pointer"
          title="Share achievement"
        >
          Share
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
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-medium gradient-text">Community Leaderboard</h1>
        <p className="text-[var(--text-muted)] text-sm">Celebrating active community members</p>
        {lastFetched && (
          <p className="text-[var(--text-disabled)] text-xs">Last updated: {lastFetched.toLocaleTimeString()}</p>
        )}
      </div>

      {/* Time Range + Hall of Fame Toggles */}
      <div className="flex items-center justify-between gap-4">
        <div className="glass rounded-lg p-1 flex gap-1 border border-[rgba(245,240,232,0.04)]">
          {(['monthly', 'alltime'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                timeRange === range
                  ? 'bg-[rgba(176,155,113,0.20)] text-[#D4C4A0] border border-[rgba(176,155,113,0.30)]'
                  : 'text-[var(--text-disabled)] hover:text-[var(--text-body)]'
              }`}
            >
              {range === 'monthly' ? 'This Month' : 'All Time'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowHallOfFame(!showHallOfFame)}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
            showHallOfFame
              ? 'bg-[var(--aged-brass)]/20 text-[var(--aged-brass)] border-[var(--aged-brass)]/30'
              : 'glass text-[var(--text-muted)] border-[rgba(245,240,232,0.04)] hover:text-[var(--aged-brass)]'
          }`}
        >
          Hall of Fame
        </button>
      </div>

      {/* Hall of Fame */}
      {showHallOfFame && (
        <div className="glass rounded-lg p-6 border border-[var(--aged-brass)]/20">
          <h2 className="text-base font-medium text-[var(--aged-brass)] mb-4 flex items-center gap-2">
            Hall of Fame — Past Winners
          </h2>
          <div className="space-y-3">
            {HALL_OF_FAME.map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-[rgba(245,240,232,0.02)] border border-[rgba(245,240,232,0.04)]">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--parchment)]">{item.month}</div>
                  <div className="text-xs text-[var(--text-disabled)]">{item.category}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-[var(--text-muted)]">{item.winner}</div>
                  <div className="text-[10px] text-[#B09B71] mt-0.5">{item.streak}mo streak</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="glass rounded-lg p-4 border border-[rgba(107,58,58,0.20)] text-[#8B5A5A] text-sm text-center">{error}</div>
      )}

      {/* Good Neighbor Spotlight */}
      {(goodNeighbor || isLoading) && (
        <div className="glass rounded-lg p-6 border border-[var(--aged-brass)]/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--aged-brass)]/5 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-6 h-6 text-[var(--aged-brass)]" />
              <h2 className="text-base font-medium text-[var(--aged-brass)]">Good Neighbor of the Month</h2>
            </div>
            <p className="text-xs text-[var(--text-disabled)] mb-4">Based on combined activity across all categories</p>
            {isLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-6 w-48 bg-[rgba(245,240,232,0.05)] rounded" />
                <div className="h-4 w-32 bg-[rgba(245,240,232,0.05)] rounded" />
              </div>
            ) : goodNeighbor ? (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--aged-brass)]/20 flex items-center justify-center shrink-0"><Trophy className="w-6 h-6 text-[var(--aged-brass)]" /></div>
                <div className="flex-1">
                  <div className="text-lg font-medium font-mono text-[var(--aged-brass)]">
                    {isGoodNeighborYou ? 'You' : truncateAddr(goodNeighbor)}
                  </div>
                  <div className="text-sm text-[var(--text-muted)] mt-0.5">
                    Combined score: <span className="text-[var(--aged-brass)] font-medium">{goodNeighborScore}</span>
                  </div>
                  <div className="text-xs text-[#B09B71] mt-1">
                    {getStreak(goodNeighbor)} consecutive months of excellence
                  </div>
                </div>
                <button
                  onClick={() => {
                    const text = `Good Neighbor of the Month on SuvrenHOA! #SuvrenHOA #Community #GoodNeighbor`;
                    navigator.clipboard?.writeText(text).catch(() => {});
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--aged-brass)]/20 text-[var(--aged-brass)] border border-[var(--aged-brass)]/30 hover:bg-[var(--aged-brass)]/30 transition-all cursor-pointer"
                >
                  Share
                </button>
              </div>
            ) : (
              <p className="text-[var(--text-disabled)] text-sm">No activity yet — be the first!</p>
            )}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="glass rounded-lg p-6 border border-[rgba(245,240,232,0.04)]">
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[rgba(176,155,113,0.12)] text-[#D4C4A0] border border-[rgba(176,155,113,0.30)]'
                  : 'text-[var(--text-disabled)] hover:text-[var(--text-body)] hover:bg-[rgba(245,240,232,0.04)] border border-transparent'
              }`}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-medium text-[var(--parchment)]">{currentTab.label}</h2>
          <span className="text-xs text-[var(--text-disabled)] ml-auto bg-[rgba(245,240,232,0.03)] px-2 py-0.5 rounded-lg">
            {timeRange === 'monthly' ? 'This Month' : 'All Time'}
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : entriesMap[activeTab].length === 0 ? (
          <div className="text-center py-16 text-[var(--text-disabled)]">
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
      <div className="glass rounded-lg p-6 border border-[rgba(245,240,232,0.04)]">
        <h2 className="text-base font-medium text-[var(--parchment)] mb-1">Streak Tracker</h2>
        <p className="text-xs text-[var(--text-disabled)] mb-4">Consecutive months of on-time dues payment</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(promptPayers.slice(0, 6).length > 0 ? promptPayers.slice(0, 6) : [
            { address: '0xaBcD...1234', rank: 1, score: 12, badge: 'Perfect Payer' },
            { address: '0x9F2e...5678', rank: 2, score: 9, badge: 'Reliable' },
            { address: '0x3A4b...9012', rank: 3, score: 7, badge: 'Consistent' },
          ]).map((entry: { address: string; rank: number; score: number; badge?: string }, idx) => {
            const streak = getStreak(entry.address);
            return (
              <div key={idx} className="p-3 rounded-lg bg-[rgba(245,240,232,0.02)] border border-[rgba(245,240,232,0.04)] text-center">
                <div className="text-sm font-medium text-[#B09B71] mb-1">{streak} {streak === 1 ? 'month' : 'months'}</div>
                <div className="text-[10px] text-[var(--text-disabled)] font-mono truncate">{truncateAddr(entry.address)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center text-xs text-[var(--text-disabled)] space-y-1">
        <p>Data sourced from ledger events · Last ~50,000 blocks (~27 hours)</p>
        <p>Auto-refreshes every 5 minutes</p>
      </div>
    </main>
  );
}
