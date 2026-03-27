'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useLeaderboard, type LeaderboardEntry } from '@/hooks/useLeaderboard';

// ── Helpers ──────────────────────────────────────────────────────────────────

function truncateAddr(addr: string): string {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

const RANK_STYLES: Record<number, { bg: string; text: string; border: string; medal: string }> = {
  1: {
    bg: 'bg-[#FFD700]/10',
    text: 'text-[#FFD700]',
    border: 'border-[#FFD700]/30',
    medal: '🏆',
  },
  2: {
    bg: 'bg-[#C0C0C0]/10',
    text: 'text-[#C0C0C0]',
    border: 'border-[#C0C0C0]/30',
    medal: '🥈',
  },
  3: {
    bg: 'bg-[#CD7F32]/10',
    text: 'text-[#CD7F32]',
    border: 'border-[#CD7F32]/30',
    medal: '🥉',
  },
};

const TABS = [
  { id: 'governance', label: 'Governance Champions', icon: '🗳️', statLabel: 'Votes' },
  { id: 'payers', label: 'Prompt Payers', icon: '💳', statLabel: 'Payments' },
  { id: 'contributors', label: 'Community Contributors', icon: '💡', statLabel: 'Proposals' },
  { id: 'documents', label: 'Document Champions', icon: '📄', statLabel: 'Uploads' },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ── Sub-components ────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-white/5 shrink-0" />
      <div className="flex-1 h-4 bg-white/5 rounded" />
      <div className="w-16 h-4 bg-white/5 rounded" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 text-gray-500">
      <div className="text-4xl mb-3">🌱</div>
      <p className="text-sm font-medium">No activity yet — be the first to participate!</p>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const style = RANK_STYLES[rank];
  if (style) {
    return (
      <span className={`text-xl`} aria-label={`Rank ${rank}`}>
        {style.medal}
      </span>
    );
  }
  return (
    <span className="text-sm font-bold text-gray-500 w-8 text-center tabular-nums">
      #{rank}
    </span>
  );
}

function LeaderboardRow({
  entry,
  statLabel,
  connectedAddress,
}: {
  entry: LeaderboardEntry;
  statLabel: string;
  connectedAddress?: string;
}) {
  const isYou =
    connectedAddress &&
    entry.address.toLowerCase() === connectedAddress.toLowerCase();

  const rankStyle = RANK_STYLES[entry.rank];
  const rowBg = isYou
    ? 'bg-[#c9a96e]/10 border-[#c9a96e]/30'
    : rankStyle
    ? `${rankStyle.bg} ${rankStyle.border}`
    : 'bg-white/[0.02] border-white/[0.04]';

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 ${rowBg}`}
    >
      {/* Rank */}
      <div className="w-8 flex items-center justify-center shrink-0">
        <RankBadge rank={entry.rank} />
      </div>

      {/* Address + badge info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-semibold font-mono truncate ${
              isYou ? 'text-[#e8d5a3]' : rankStyle ? rankStyle.text : 'text-gray-200'
            }`}
          >
            {isYou ? '⭐ You' : truncateAddr(entry.address)}
          </span>
          {isYou && (
            <span className="text-[10px] font-bold bg-[#c9a96e]/12 text-[#e8d5a3] px-1.5 py-0.5 rounded-full">
              YOU
            </span>
          )}
        </div>
        {entry.badge && (
          <div className="text-[11px] text-gray-500 mt-0.5 truncate">{entry.badge}</div>
        )}
      </div>

      {/* Score */}
      <div className="shrink-0 text-right">
        <div
          className={`text-base font-bold tabular-nums ${
            isYou ? 'text-[#e8d5a3]' : rankStyle ? rankStyle.text : 'text-gray-300'
          }`}
        >
          {entry.score.toLocaleString()}
        </div>
        <div className="text-[10px] text-gray-600 uppercase tracking-wide">{statLabel}</div>
      </div>
    </div>
  );
}

function LeaderboardList({
  entries,
  statLabel,
  connectedAddress,
  isLoading,
}: {
  entries: LeaderboardEntry[];
  statLabel: string;
  connectedAddress?: string;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-2">
      {entries.slice(0, 20).map((entry) => (
        <LeaderboardRow
          key={entry.address}
          entry={entry}
          statLabel={statLabel}
          connectedAddress={connectedAddress}
        />
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>('governance');
  const { address: connectedAddress } = useAccount();
  const {
    governanceChampions,
    promptPayers,
    communityContributors,
    documentChampions,
    goodNeighbor,
    goodNeighborScore,
    isLoading,
    lastFetched,
    error,
  } = useLeaderboard();

  const currentTab = TABS.find((t) => t.id === activeTab)!;

  const entriesMap: Record<TabId, LeaderboardEntry[]> = {
    governance: governanceChampions,
    payers: promptPayers,
    contributors: communityContributors,
    documents: documentChampions,
  };

  const isGoodNeighborYou =
    connectedAddress &&
    goodNeighbor &&
    goodNeighbor.toLowerCase() === connectedAddress.toLowerCase();

  return (
    <main className="max-w-[960px] mx-auto px-4 py-8 space-y-8">
      {/* ── Header ── */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold gradient-text">Community Leaderboard</h1>
        <p className="text-gray-400 text-sm">Celebrating active community members</p>
        {lastFetched && (
          <p className="text-gray-600 text-xs">
            Last updated: {lastFetched.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* ── Error State ── */}
      {error && (
        <div className="glass rounded-xl p-4 border border-red-500/20 text-red-400 text-sm text-center">
          ⚠️ {error}
        </div>
      )}

      {/* ── Good Neighbor Spotlight ── */}
      {(goodNeighbor || isLoading) && (
        <div className="glass rounded-2xl p-6 border border-[#FFD700]/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/5 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🌟</span>
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
                <div className="w-12 h-12 rounded-full bg-[#FFD700]/20 flex items-center justify-center text-2xl shrink-0">
                  🏆
                </div>
                <div>
                  <div className="text-lg font-bold font-mono text-[#FFD700]">
                    {isGoodNeighborYou ? '⭐ You' : truncateAddr(goodNeighbor)}
                  </div>
                  {isGoodNeighborYou && (
                    <span className="text-[10px] font-bold bg-[#c9a96e]/12 text-[#e8d5a3] px-1.5 py-0.5 rounded-full">
                      YOU
                    </span>
                  )}
                  <div className="text-sm text-gray-400 mt-1">
                    Combined score: <span className="text-[#FFD700] font-bold">{goodNeighborScore}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No activity yet — be the first to participate!</p>
            )}
          </div>
        </div>
      )}

      {/* ── Tab Navigation ── */}
      <div className="glass rounded-2xl p-6 border border-white/[0.04]">
        {/* Tabs */}
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

        {/* Tab Title */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">{currentTab.icon}</span>
          <h2 className="text-lg font-bold text-gray-100">{currentTab.label}</h2>
          {!isLoading && entriesMap[activeTab].length > 0 && (
            <span className="text-xs text-gray-600 ml-auto">
              {entriesMap[activeTab].length} participant{entriesMap[activeTab].length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Leaderboard List */}
        <LeaderboardList
          entries={entriesMap[activeTab]}
          statLabel={currentTab.statLabel}
          connectedAddress={connectedAddress}
          isLoading={isLoading}
        />
      </div>

      {/* ── Footer Info ── */}
      <div className="text-center text-xs text-gray-600 space-y-1">
        <p>Data sourced from on-chain events · Last ~50,000 blocks (~27 hours)</p>
        <p>Auto-refreshes every 5 minutes</p>
      </div>
    </main>
  );
}
