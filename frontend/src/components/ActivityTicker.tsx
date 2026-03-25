'use client';

import { useActivityFeed, type ActivityItem } from '@/hooks/useActivityFeed';
import { useMemo } from 'react';

const BASESCAN = 'https://sepolia.basescan.org/tx';

function timeAgo(unix: number): string {
  const diff = Math.floor(Date.now() / 1000) - unix;
  if (diff < 60) return `${Math.max(0, diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-2xl mb-4">
        🔗
      </div>
      <p className="text-sm text-gray-500 font-medium">No recent on-chain activity</p>
      <p className="text-xs text-gray-600 mt-1">Events will appear here as they happen</p>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
      <div className="w-8 h-8 rounded-lg bg-white/5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="h-3 bg-white/5 rounded-full w-3/4 mb-2" />
        <div className="h-2 bg-white/5 rounded-full w-1/3" />
      </div>
      <div className="h-2 bg-white/5 rounded-full w-12 shrink-0" />
    </div>
  );
}

interface EventRowProps {
  item: ActivityItem;
  isNew: boolean;
}

function EventRow({ item, isNew }: EventRowProps) {
  const handleClick = () => {
    window.open(`${BASESCAN}/${item.txHash}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleClick}
      className={[
        'w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl',
        'transition-all duration-300 group cursor-pointer',
        'hover:bg-white/5 hover:border-purple-500/20',
        'border border-transparent',
        isNew
          ? 'bg-purple-500/8 border-purple-500/25 shadow-[0_0_12px_rgba(168,85,247,0.12)] activity-ticker-slide-in'
          : 'activity-ticker-slide-in',
      ].join(' ')}
      style={{ animationFillMode: 'both' }}
      aria-label={`${item.description} — view on BaseScan`}
    >
      {/* Icon */}
      <div className={[
        'w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0',
        'transition-transform duration-200 group-hover:scale-110',
        isNew ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-white/5 border border-white/10',
      ].join(' ')}>
        {item.icon}
      </div>

      {/* Description */}
      <div className="flex-1 min-w-0">
        <p className={[
          'text-xs font-medium leading-snug truncate',
          isNew ? 'text-purple-200' : 'text-gray-300 group-hover:text-gray-100',
          'transition-colors duration-200',
        ].join(' ')}>
          {item.description}
        </p>
        <p className="text-[10px] text-gray-600 mt-0.5 truncate">
          Tx: {item.txHash.slice(0, 10)}...{item.txHash.slice(-6)}
        </p>
      </div>

      {/* Timestamp */}
      <div className="shrink-0 flex flex-col items-end gap-1">
        <span className="text-[10px] text-gray-500 whitespace-nowrap">
          {timeAgo(item.timestamp)}
        </span>
        {isNew && (
          <span className="text-[9px] font-semibold text-purple-400 uppercase tracking-wider">New</span>
        )}
      </div>
    </button>
  );
}

export interface ActivityTickerProps {
  className?: string;
  maxHeight?: string;
}

export function ActivityTicker({ className = '', maxHeight = '480px' }: ActivityTickerProps) {
  const { events, isLoading, lastFetched, newIds } = useActivityFeed();

  return (
    <div className={`glass-card rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
        <div className="flex items-center gap-2.5">
          {/* Pulsing live dot */}
          <div className="relative flex items-center justify-center">
            <span className="absolute inline-flex w-3 h-3 rounded-full bg-green-400/30 animate-ping" />
            <span className="relative inline-flex w-2 h-2 rounded-full bg-green-400" />
          </div>
          <h3 className="text-sm font-bold text-gray-200 tracking-wide">Live Activity</h3>
          <span className="text-[10px] font-medium text-gray-600 bg-white/5 px-2 py-0.5 rounded-full border border-white/8">
            Base Sepolia
          </span>
        </div>

        <div className="flex items-center gap-2">
          {lastFetched && (
            <span className="text-[10px] text-gray-600 hidden sm:block">
              Updated {timeAgo(Math.floor(lastFetched.getTime() / 1000))}
            </span>
          )}
          <span className="text-[10px] text-gray-600 bg-white/5 px-2 py-0.5 rounded-full border border-white/8">
            {events.length} events
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        className="overflow-y-auto divide-y divide-white/5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
        style={{ maxHeight }}
      >
        {isLoading ? (
          <div className="divide-y divide-white/5">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState />
        ) : (
          events.map((item) => (
            <EventRow key={item.id} item={item} isNew={newIds.has(item.id)} />
          ))
        )}
      </div>

      {/* Footer */}
      {!isLoading && events.length > 0 && (
        <div className="px-5 py-3 border-t border-white/8 flex items-center justify-between">
          <span className="text-[10px] text-gray-600">
            Showing last {events.length} events · Auto-refreshes every 30s
          </span>
          <a
            href="https://sepolia.basescan.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-purple-400/70 hover:text-purple-400 transition-colors duration-150"
          >
            View all on BaseScan →
          </a>
        </div>
      )}
    </div>
  );
}

export default ActivityTicker;
