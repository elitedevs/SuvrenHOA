'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAnnouncements } from '@/hooks/useAnnouncements';

// Using Announcement type from useAnnouncements hook



const PRIORITY_STYLES = {
  urgent: {
    border: 'border-l-red-500',
    bg: 'bg-red-500/5',
    badge: 'bg-red-500/10 text-red-400 border-red-500/20',
    label: '🚨 Urgent',
  },
  important: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-500/5',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    label: '⚡ Important',
  },
  info: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-500/5',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    label: 'ℹ️ Info',
  },
};

export default function AnnouncementsPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 mb-4">Sign in to see announcements</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  const { data: announcements, isLoading } = useAnnouncements();
  const items = announcements || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Announcements</h1>
          <p className="text-sm text-gray-400 mt-1">
            Official updates from the board and committees
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="w-2 h-2 rounded-full bg-green-500 status-dot" />
          {items.length} announcements
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading announcements...</div>
      ) : items.length === 0 ? (
        <div className="glass-card rounded-xl hover-lift p-12 text-center">
          <p className="text-4xl mb-3">📢</p>
          <h3 className="font-medium mb-1">No announcements yet</h3>
          <p className="text-sm text-gray-400">Board announcements will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((announcement: any) => (
            <AnnouncementCard key={announcement.id} announcement={announcement} />
          ))}
        </div>
      )}
    </div>
  );
}

function AnnouncementCard({ announcement }: { announcement: any }) {
  const style = PRIORITY_STYLES[announcement.priority as keyof typeof PRIORITY_STYLES] || PRIORITY_STYLES.info;
  const timeAgo = getTimeAgo(new Date(announcement.created_at));
  const readPercent = Math.round((announcement.read_by || 0 / announcement.total_residents || 150) * 100);

  return (
    <div className={`glass-card rounded-xl hover-lift border-l-4 ${style.border} overflow-hidden`}>
      <div className={`p-6 ${style.bg}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${style.badge}`}>
                {style.label}
              </span>
              <span className="text-[10px] text-gray-500">{timeAgo}</span>
            </div>
            <h3 className="font-semibold text-base leading-snug">{announcement.title}</h3>
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
              {announcement.author_name[0]}
            </div>
            <div>
              <p className="text-xs font-medium">{announcement.author_name}</p>
              <p className="text-[10px] text-gray-500">{announcement.author_role}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500">Read by</p>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#c9a96e]/60"
                  style={{ width: `${readPercent}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-400">{readPercent}%</span>
            </div>
          </div>
        </div>
      </div>
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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
