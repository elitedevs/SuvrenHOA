'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAnnouncements } from '@/hooks/useAnnouncements';

// Priority system: critical > important > info > fyi
const PRIORITY_STYLES = {
  critical: {
    border: 'border-l-[#6B3A3A]',
    bg: 'bg-[#8B5A5A]/5',
    badge: 'bg-[rgba(107,58,58,0.12)] text-[#8B5A5A] border-[rgba(107,58,58,0.25)]',
    label: 'Critical',
    dot: 'bg-[#8B5A5A]',
  },
  urgent: {
    border: 'border-l-[#6B3A3A]',
    bg: 'bg-[#8B5A5A]/5',
    badge: 'bg-[rgba(107,58,58,0.12)] text-[#8B5A5A] border-[rgba(107,58,58,0.25)]',
    label: 'Urgent',
    dot: 'bg-[#8B5A5A]',
  },
  important: {
    border: 'border-l-[#B09B71]',
    bg: 'bg-[#B09B71]/5',
    badge: 'bg-[#B09B71]/15 text-[#B09B71] border-[#B09B71]/30',
    label: 'Important',
    dot: 'bg-[#B09B71]',
  },
  info: {
    border: 'border-l-[#B09B71]',
    bg: 'bg-[rgba(176,155,113,0.03)]',
    badge: 'bg-[rgba(176,155,113,0.10)] text-[#B09B71] border-[rgba(176,155,113,0.20)]',
    label: 'Info',
    dot: 'bg-[#B09B71]',
  },
  fyi: {
    border: 'border-l-[rgba(245,240,232,0.12)]',
    bg: 'bg-[rgba(245,240,232,0.02)]',
    badge: 'bg-[rgba(245,240,232,0.06)] text-[var(--text-muted)] border-[rgba(245,240,232,0.10)]',
    label: 'FYI',
    dot: 'bg-[rgba(245,240,232,0.12)]',
  },
};

// LocalStorage for read state and pinned
const LS_READ = 'suvren_read_announcements';
const LS_PINNED = 'suvren_pinned_announcements';
const TOTAL_RESIDENTS = 16;

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
        <p className="text-[var(--text-muted)] mb-4">Sign in to see announcements</p>
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-medium gradient-text sm:">Announcements</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Official updates from the board and committees</p>
        </div>
        <div className="flex items-center gap-3">
          {unread > 0 && (
            <span className="px-3 py-1 rounded-full bg-[#B09B71]/10 border border-[#B09B71]/20 text-[#B09B71] text-xs font-medium">
              {unread} unread
            </span>
          )}
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-disabled)]">
            <span className="w-2 h-2 rounded-full bg-[#3A7D6F] animate-pulse" />
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                priorityFilter === p ? 'bg-[#B09B71]/15 text-[#B09B71] border border-[#B09B71]/30' : 'glass-card text-[var(--text-muted)]'
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
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === 'active' ? 'bg-[#B09B71]/15 text-[#B09B71] border border-[#B09B71]/30' : 'glass-card text-[var(--text-muted)]'}`}>
          Active ({activeItems.length})
        </button>
        <button onClick={() => setActiveTab('archive')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === 'archive' ? 'bg-[#B09B71]/15 text-[#B09B71] border border-[#B09B71]/30' : 'glass-card text-[var(--text-muted)]'}`}>
          Archive ({archiveItems.length})
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-[var(--text-disabled)]">Loading announcements...</div>
      ) : activeTab === 'archive' ? (
        <ArchiveList items={archiveItems} readSet={readSet} />
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-lg hover-lift p-12 text-center">
          <h3 className="font-medium mb-1">No announcements</h3>
          <p className="text-sm text-[var(--text-muted)]">Board announcements will appear here</p>
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
    <div className={`glass-card rounded-lg hover-lift border-l-4 ${style.border} overflow-hidden ${!isRead ? 'ring-1 ring-white/5' : ''}`}>
      <div className={`p-6 ${style.bg}`}>
        {/* Pin indicator */}
        {isPinned && (
          <div className="flex items-center gap-1.5 text-[10px] text-[#B09B71] font-medium mb-2">
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
              <span className="text-[10px] text-[var(--text-disabled)]">{timeAgo}</span>
              {!isRead && <span className="w-1.5 h-1.5 rounded-full bg-[#B09B71] shrink-0" title="Unread" />}
            </div>
            <h3 className="font-medium text-base leading-snug">{announcement.title}</h3>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onPin}
              className={`p-1.5 rounded-lg transition-colors ${isPinned ? 'text-[#B09B71] bg-[#B09B71]/10' : 'text-[var(--text-disabled)] hover:text-[var(--text-muted)]'}`}
              title={isPinned ? 'Unpin' : 'Pin to top'}
            >
              {isPinned ? 'Unpin' : 'Pin'}
            </button>
            {!isRead && (
              <button
                onClick={onRead}
                className="text-[10px] px-2 py-1 rounded-lg bg-[rgba(26,26,30,0.50)] text-[var(--text-muted)] hover:text-[var(--parchment)] transition-colors"
              >
                Mark read
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="text-sm text-[var(--text-muted)] leading-relaxed whitespace-pre-line mb-4">
          {announcement.content}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[rgba(245,240,232,0.05)]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#B09B71]/15 flex items-center justify-center text-[10px] font-medium text-[#B09B71]">
              {announcement.author_name?.[0] || 'H'}
            </div>
            <div>
              <p className="text-xs font-medium">{announcement.author_name || 'HOA Board'}</p>
              <p className="text-[10px] text-[var(--text-disabled)]">{announcement.author_role || 'Board'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[var(--text-disabled)]">Read by {readCount} of {TOTAL_RESIDENTS}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-16 h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                <div className="h-full rounded-full bg-[#B09B71]/60" style={{ width: `${readPct}%` }} />
              </div>
              <span className="text-[10px] text-[var(--text-muted)]">{readPct}%</span>
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
      <div className="glass-card rounded-lg p-12 text-center">
        <h3 className="font-medium mb-1">No archived announcements</h3>
        <p className="text-sm text-[var(--text-muted)]">Announcements older than 60 days appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--text-disabled)]">Announcements older than 60 days</p>
      {items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(a => {
        const priority = a.priority as keyof typeof PRIORITY_STYLES;
        const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.info;
        return (
          <div key={a.id} className={`glass-card rounded-lg border-l-4 ${style.border} p-4 opacity-70`}>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${style.badge}`}>{style.label}</span>
              <span className="text-[10px] text-[var(--text-disabled)]">{new Date(a.created_at).toLocaleDateString()}</span>
            </div>
            <h4 className="text-sm font-medium text-[var(--text-body)]">{a.title}</h4>
            <p className="text-xs text-[var(--text-disabled)] mt-1 line-clamp-2">{a.content}</p>
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
