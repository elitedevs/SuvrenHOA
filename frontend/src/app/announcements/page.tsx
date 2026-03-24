'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  authorRole: string;
  timestamp: Date;
  priority: 'urgent' | 'important' | 'info';
  readBy: number;
  totalResidents: number;
}

const DEMO_ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    title: '🚨 Water Main Repair — Expect Low Pressure March 25-26',
    content: 'The city will be performing water main repairs on Faircroft Dr between lots 40-60. Expect low water pressure or intermittent outages between 8am-5pm both days. Please fill containers in advance if needed.',
    author: 'Board of Directors',
    authorRole: 'Board',
    timestamp: new Date('2026-03-24'),
    priority: 'urgent',
    readBy: 67,
    totalResidents: 150,
  },
  {
    id: '2',
    title: '📋 Q2 Board Meeting — April 8th at 7pm',
    content: 'The quarterly board meeting will be held at the Faircroft Clubhouse on April 8th at 7pm. Virtual attendance available via Zoom (link will be emailed). Agenda includes: pool renovation proposal, 2026 budget review, and the new landscaping contract.\n\nAll homeowners are encouraged to attend. Written questions can be submitted in advance via the Community forum.',
    author: 'Rick Morang',
    authorRole: 'President',
    timestamp: new Date('2026-03-22'),
    priority: 'important',
    readBy: 43,
    totalResidents: 150,
  },
  {
    id: '3',
    title: '🌿 Spring Landscaping Schedule',
    content: 'Spring landscaping begins April 1st. Crews will work Monday-Friday, 7am-4pm. Schedule:\n• Week 1 (Apr 1-5): Common areas, entrance\n• Week 2 (Apr 8-12): Lots 1-50\n• Week 3 (Apr 15-19): Lots 51-100\n• Week 4 (Apr 22-26): Lots 101-150\n\nPlease remove items from front yards before your scheduled week.',
    author: 'Grounds Committee',
    authorRole: 'Committee',
    timestamp: new Date('2026-03-20'),
    priority: 'info',
    readBy: 89,
    totalResidents: 150,
  },
  {
    id: '4',
    title: '🏊 Pool Opening Day — May 1st',
    content: 'The community pool opens May 1st! New this year:\n• Extended hours: 7am-9pm (was 9am-8pm)\n• New pool furniture arriving April 15\n• Updated key fob access — pick up your new fob at the clubhouse April 25-30\n\nPool rules and key form available in Documents.',
    author: 'Nicole Tyburski',
    authorRole: 'Secretary',
    timestamp: new Date('2026-03-18'),
    priority: 'info',
    readBy: 112,
    totalResidents: 150,
  },
  {
    id: '5',
    title: '💰 Q1 Financial Summary Available',
    content: 'The Q1 2026 financial summary has been posted to the Documents section. Key highlights:\n• Total dues collected: $28,400 (94.7% collection rate)\n• Operating expenses: $18,200\n• Reserve contribution: $7,100\n• Current reserve balance: $89,450\n\nFull details in the Treasury dashboard.',
    author: 'Board of Directors',
    authorRole: 'Board',
    timestamp: new Date('2026-03-15'),
    priority: 'important',
    readBy: 78,
    totalResidents: 150,
  },
];

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
          {DEMO_ANNOUNCEMENTS.length} announcements
        </div>
      </div>

      <div className="space-y-4">
        {DEMO_ANNOUNCEMENTS.map(announcement => (
          <AnnouncementCard key={announcement.id} announcement={announcement} />
        ))}
      </div>
    </div>
  );
}

function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const style = PRIORITY_STYLES[announcement.priority];
  const timeAgo = getTimeAgo(announcement.timestamp);
  const readPercent = Math.round((announcement.readBy / announcement.totalResidents) * 100);

  return (
    <div className={`glass-card rounded-xl border-l-4 ${style.border} overflow-hidden`}>
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
            <div className="w-6 h-6 rounded-full bg-purple-600/20 flex items-center justify-center text-[10px] font-bold text-purple-400">
              {announcement.author[0]}
            </div>
            <div>
              <p className="text-xs font-medium">{announcement.author}</p>
              <p className="text-[10px] text-gray-500">{announcement.authorRole}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500">Read by</p>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-purple-500/60"
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
