'use client';

import { useState, useMemo } from 'react';
import { useActivityFeed, ActivityItem } from '@/hooks/useActivityFeed';
import { ClipboardList } from 'lucide-react';

const PAGE_SIZE = 10;

const EVENT_FILTERS = [
  { label: 'All Events', icon: '', match: null },
  { label: 'Properties', icon: '', match: [''] },
  { label: 'Votes', icon: '', match: ['', '', '', ''] },
  { label: 'Treasury', icon: '', match: ['', ''] },
  { label: 'Documents', icon: '', match: [''] },
];

function timeAgo(timestamp: number): string {
  const diff = Math.floor(Date.now() / 1000) - timestamp;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function ActivityPage() {
  const { events, isLoading, lastFetched } = useActivityFeed();
  const [activeFilter, setActiveFilter] = useState<string[] | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!activeFilter) return events;
    return events.filter((e: ActivityItem) => activeFilter.includes(e.icon));
  }, [events, activeFilter]);

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = paginated.length < filtered.length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 page-enter">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-1">On-Chain Events</p>
        <h1 className="text-3xl font-normal tracking-tight">Activity Log</h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          Unified feed of all on-chain events — newest first
          {lastFetched && (
            <span className="ml-2 text-[var(--text-disabled)]">· Updated {timeAgo(Math.floor(lastFetched.getTime() / 1000))}</span>
          )}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {EVENT_FILTERS.map((f) => {
          const isActive = JSON.stringify(f.match) === JSON.stringify(activeFilter);
          return (
            <button
              key={f.label}
              onClick={() => { setActiveFilter(f.match); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border ${
                isActive
                  ? 'bg-[#B09B71]/15 text-[#B09B71] border-[#B09B71]/30'
                  : 'text-[var(--text-muted)] border-[rgba(245,240,232,0.08)] hover:border-[rgba(245,240,232,0.10)] hover:text-[var(--text-body)]'
              }`}
            >
              {f.icon} {f.label}
            </button>
          );
        })}
      </div>

      {/* Feed */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-5 flex gap-4">
              <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 rounded w-3/4" />
                <div className="skeleton h-3 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <ClipboardList className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No events found</h3>
          <p className="text-sm text-[var(--text-muted)]">
            {activeFilter ? 'Try a different filter' : 'No on-chain events in the last ~14 hours'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {paginated.map((event: ActivityItem, i: number) => (
            <a
              key={event.id}
              href={`https://sepolia.basescan.org/tx/${event.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card rounded-xl p-4 flex items-start gap-4 hover:border-[#B09B71]/20 border border-transparent transition-all group block"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="w-10 h-10 rounded-xl bg-[rgba(26,26,30,0.60)] flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                {event.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--parchment)] leading-snug">{event.description}</p>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-[var(--text-disabled)]">
                  <span>{timeAgo(event.timestamp)}</span>
                  <span className="text-[var(--text-disabled)]">·</span>
                  <span className="font-mono text-[var(--text-disabled)]">
                    Block #{Number(event.blockNumber).toLocaleString()}
                  </span>
                  <span className="text-[#B09B71]/60 group-hover:text-[#B09B71] transition-colors">↗ Basescan</span>
                </div>
              </div>
            </a>
          ))}

          {hasMore && (
            <button
              onClick={() => setPage(p => p + 1)}
              className="w-full py-3 rounded-xl border border-[rgba(245,240,232,0.08)] text-sm text-[var(--text-muted)] hover:text-[var(--text-body)] hover:border-[#B09B71]/30 transition-all font-medium"
            >
              Load more ({filtered.length - paginated.length} remaining)
            </button>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-8 glass-card rounded-xl p-4">
        <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-3">Event Types</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { icon: '', label: 'Property mint / transfer' },
            { icon: '', label: 'Proposal created' },
            { icon: '', label: 'Vote cast' },
            { icon: '', label: 'Dues payment' },
            { icon: '', label: 'Treasury expenditure' },
            { icon: '', label: 'Document registered' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-xs text-[var(--text-disabled)]">
              <span>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
