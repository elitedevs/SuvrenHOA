'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAnnouncements } from '@/hooks/useAnnouncements';

// Priority system: critical > important > info > fyi
const PRIORITY_STYLES = {
  critical: {
    border: 'border-l-red-500',
    bg: 'bg-red-500/5',
    badge: 'bg-red-500/15 text-red-400 border-red-500/30',
    label: ' Critical',
    dot: 'bg-red-500',
  },
  urgent: {
    border: 'border-l-red-500',
    bg: 'bg-red-500/5',
    badge: 'bg-red-500/15 text-red-400 border-red-500/30',
    label: ' Urgent',
    dot: 'bg-red-500',
  },
  important: {
    border: 'border-l-[#c9a96e]',
    bg: 'bg-[#c9a96e]/5',
    badge: 'bg-[#c9a96e]/15 text-[#c9a96e] border-[#c9a96e]/30',
    label: ' Important',
    dot: 'bg-[#c9a96e]',
  },
  info: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-500/5',
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    label: 'ℹ Info',
    dot: 'bg-blue-500',
  },
  fyi: {
    border: 'border-l-gray-500',
    bg: 'bg-gray-500/5',
    badge: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
    label: ' FYI',
    dot: 'bg-gray-500',
  },
};

// LocalStorage for read state and pinned
const LS_READ = 'suvren_read_announcements';
const LS_PINNED = 'suvren_pinned_announcements';
const TOTAL_RESIDENTS = 150;

function getReadSet(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try { return new Set(JSON.parse(localStorage.getItem(LS_READ) || '[]')); }
  catch { return new Set(); }
}
function markRead(id: string) {
  const set = getReadSet();
  set.add(id);
  localStorage.setItem(LS_READ, JSON.stringify([...set]));
}
function getPinned(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try { return new Set(JSON.parse(localStorage.getItem(LS_PINNED) || '[]')); }
  catch { return new Set(); }
}
function togglePin(id: string) {
  const set = getPinned();
  set.has(id) ? set.delete(id) : set.add(id);
  localStorage.setItem(LS_PINNED, JSON.stringify([...set]));
}

export default function AnnouncementsPage() {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'active' | 'archive'>('active');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [readSet, setReadSet] = useState<Set<string>>(new Set());
  const [pinnedSet, setPinnedSet] = useState<Set<string>>(new Set());
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    setReadSet(getReadSet());
    setPinnedSet(getPinned());
  }, []);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 mb-4">Sign in to see announcements</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  const { data: announcements, isLoading } = useAnnouncements();
  const items = (announcements || []) as any[];

  // Separate active from archive (older than 60 days)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 60);
  const activeItems = items.filter(a => new Date(a.created_at) >= cutoff);
  const archiveItems = items.filter(a => new Date(a.created_at) < cutoff);

  // Sort: pinned first, then by date
  const sorted = [...activeItems].sort((a, b) => {
    const aPin = pinnedSet.has(a.id) ? 1 : 0;
    const bPin = pinnedSet.has(b.id) ? 1 : 0;
    if (bPin !== aPin) return bPin - aPin;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const filtered = priorityFilter === 'all'
    ? sorted
    : sorted.filter(a => a.priority === priorityFilter);

  const unread = activeItems.filter(a => !readSet.has(a.id)).length;

  const handleRead = (id: string) => {
    markRead(id);
    setReadSet(new Set([...readSet, id]));
  };

  const handlePin = (id: string) => {
    togglePin(id);
    const next = new Set(pinnedSet);
    next.has(id) ? next.delete(id) : next.add(id);
    setPinnedSet(next);
  };

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold"> Announcements</h1>
          <p className="text-sm text-gray-400 mt-1">Official updates from the board and committees</p>
        </div>
        <div className="flex items-center gap-3">
          {unread > 0 && (
            <span className="px-3 py-1 rounded-full bg-[#c9a96e]/10 border border-[#c9a96e]/20 text-[#c9a96e] text-xs font-medium">
              {unread} unread
            </span>
          )}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {activeItems.length} active
          </div>
        </div>
      </div>

      {/* Priority legend */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {['all', 'critical', 'important', 'info', 'fyi'].map(p => {
          const style = p !== 'all' ? PRIORITY_STYLES[p as keyof typeof PRIORITY_STYLES] : null;
          return (
            <button key={p} onClick={() => setPriorityFilter(p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                priorityFilter === p ? 'bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/30' : 'glass-card text-gray-400'
              }`}>
              {style && <span className={`w-2 h-2 rounded-full ${style.dot}`} />}
              {p === 'all' ? 'All' : PRIORITY_STYLES[p as keyof typeof PRIORITY_STYLES]?.label}
            </button>
          );
        })}
      </div>

      {/* Tab */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-md text-xs font-medium transition-all ${activeTab === 'active' ? 'bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/30' : 'glass-card text-gray-400'}`}>
          Active ({activeItems.length})
        </button>
        <button onClick={() => setActiveTab('archive')}
          className={`px-4 py-2 rounded-md text-xs font-medium transition-all ${activeTab === 'archive' ? 'bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/30' : 'glass-card text-gray-400'}`}>
           Archive ({archiveItems.length})
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading announcements...</div>
      ) : activeTab === 'archive' ? (
        <ArchiveList items={archiveItems} readSet={readSet} />
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-md hover-lift p-12 text-center">
                    <h3 className="font-medium mb-1">No announcements</h3>
          <p className="text-sm text-gray-400">Board announcements will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((announcement: any) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              isPinned={pinnedSet.has(announcement.id)}
              isRead={readSet.has(announcement.id)}
              onPin={() => handlePin(announcement.id)}
              onRead={() => handleRead(announcement.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AnnouncementCard({ announcement, isPinned, isRead, onPin, onRead }: {
  announcement: any;
  isPinned: boolean;
  isRead: boolean;
  onPin: () => void;
  onRead: () => void;
}) {
  const priority = announcement.priority as keyof typeof PRIORITY_STYLES;
  const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.info;
  const timeAgo = getTimeAgo(new Date(announcement.created_at));

  // Simulated read count (would come from backend)
  const readCount = Math.floor(Math.random() * 60 + 80);
  const readPct = Math.min(100, Math.round(readCount / TOTAL_RESIDENTS * 100));

  return (
    <div className={`glass-card rounded-md hover-lift border-l-4 ${style.border} overflow-hidden ${!isRead ? 'ring-1 ring-white/5' : ''}`}>
      <div className={`p-6 ${style.bg}`}>
        {/* Pin indicator */}
        {isPinned && (
          <div className="flex items-center gap-1.5 text-[10px] text-[#c9a96e] font-medium mb-2">
             Pinned
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${style.badge}`}>
                {style.label}
              </span>
              <span className="text-[10px] text-gray-500">{timeAgo}</span>
              {!isRead && <span className="w-1.5 h-1.5 rounded-full bg-[#c9a96e] shrink-0" title="Unread" />}
            </div>
            <h3 className="font-semibold text-base leading-snug">{announcement.title}</h3>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onPin}
              className={`p-1.5 rounded-lg transition-colors ${isPinned ? 'text-[#c9a96e] bg-[#c9a96e]/10' : 'text-gray-600 hover:text-gray-400'}`}
              title={isPinned ? 'Unpin' : 'Pin to top'}
            >
              
            </button>
            {!isRead && (
              <button
                onClick={onRead}
                className="text-[10px] px-2 py-1 rounded-lg bg-gray-800/50 text-gray-400 hover:text-gray-200 transition-colors"
              >
                Mark read
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="text-sm text-gray-400 leading-relaxed whitespace-pre-line mb-4">
          {announcement.content}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#c9a96e]/15 flex items-center justify-center text-[10px] font-bold text-[#c9a96e]">
              {announcement.author_name?.[0] || 'H'}
            </div>
            <div>
              <p className="text-xs font-medium">{announcement.author_name || 'HOA Board'}</p>
              <p className="text-[10px] text-gray-500">{announcement.author_role || 'Board'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500">Read by {readCount} of {TOTAL_RESIDENTS}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-16 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                <div className="h-full rounded-full bg-[#c9a96e]/60" style={{ width: `${readPct}%` }} />
              </div>
              <span className="text-[10px] text-gray-400">{readPct}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArchiveList({ items, readSet }: { items: any[]; readSet: Set<string> }) {
  if (items.length === 0) {
    return (
      <div className="glass-card rounded-md p-12 text-center">
                <h3 className="font-medium mb-1">No archived announcements</h3>
        <p className="text-sm text-gray-400">Announcements older than 60 days appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">Announcements older than 60 days</p>
      {items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(a => {
        const priority = a.priority as keyof typeof PRIORITY_STYLES;
        const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.info;
        return (
          <div key={a.id} className={`glass-card rounded-md border-l-4 ${style.border} p-4 opacity-70`}>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${style.badge}`}>{style.label}</span>
              <span className="text-[10px] text-gray-600">{new Date(a.created_at).toLocaleDateString()}</span>
            </div>
            <h4 className="text-sm font-medium text-gray-300">{a.title}</h4>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.content}</p>
          </div>
        );
      })}
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
