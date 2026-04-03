'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Shield, CreditCard, Users, AlertTriangle, Vote } from 'lucide-react';

type NotifCategory = 'Governance' | 'Dues' | 'Community' | 'Safety';

interface Notification {
  id: string;
  category: NotifCategory;
  icon: string;
  title: string;
  description: string;
  time: Date;
  read: boolean;
}

const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    category: 'Governance',
    icon: '',
    title: 'New Proposal: Park Renovation',
    description: 'A new proposal to renovate the community park has been submitted. Voting ends in 5 days.',
    time: new Date(Date.now() - 1000 * 60 * 25),
    read: false,
  },
  {
    id: 'n2',
    category: 'Dues',
    icon: '',
    title: 'Dues Reminder',
    description: 'Your monthly dues of $150 are due in 3 days. Auto-pay is not enabled.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: false,
  },
  {
    id: 'n3',
    category: 'Community',
    icon: '',
    title: 'Community BBQ This Saturday!',
    description: 'Join us at the common area for our quarterly neighborhood BBQ. RSVP by Friday.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 5),
    read: false,
  },
  {
    id: 'n4',
    category: 'Safety',
    icon: '',
    title: 'Safety Alert: Suspicious Activity',
    description: 'A resident reported suspicious activity near lot 45. Please stay alert and report anything unusual.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 23),
    read: true,
  },
  {
    id: 'n5',
    category: 'Governance',
    icon: '',
    title: 'Meeting Minutes Posted',
    description: 'Minutes from the March 20 board meeting have been posted to the documents section.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 26),
    read: true,
  },
  {
    id: 'n6',
    category: 'Community',
    icon: '',
    title: 'You made the Leaderboard!',
    description: 'Congratulations! You ranked #3 in Governance Champions this month.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 48),
    read: true,
  },
  {
    id: 'n7',
    category: 'Dues',
    icon: '',
    title: 'Payment Confirmed',
    description: 'Your dues payment of $150 has been confirmed on-chain. Transaction: 0xab12...cd34',
    time: new Date(Date.now() - 1000 * 60 * 60 * 72),
    read: true,
  },
];

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function getDateGroup(date: Date): 'Today' | 'Yesterday' | 'Older' {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (d.getTime() === today.getTime()) return 'Today';
  if (d.getTime() === yesterday.getTime()) return 'Yesterday';
  return 'Older';
}

const CATEGORY_ICONS: Record<NotifCategory, React.ElementType> = {
  Governance: Vote,
  Dues: CreditCard,
  Community: Users,
  Safety: Shield,
};

const CATEGORY_COLORS: Record<NotifCategory, string> = {
  Governance: 'text-[var(--steel)]',
  Dues: 'text-[#B09B71]',
  Community: 'text-[#3A7D6F]',
  Safety: 'text-[#8B5A5A]',
};

const FILTER_TABS = ['All', 'Governance', 'Dues', 'Community', 'Safety'] as const;
type FilterTab = typeof FILTER_TABS[number];

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(SAMPLE_NOTIFICATIONS);
  const [filter, setFilter] = useState<FilterTab>('All');
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = filter === 'All'
    ? notifications
    : notifications.filter(n => n.category === filter);

  // Group by date
  const groups: Record<string, Notification[]> = {};
  filtered.forEach(n => {
    const group = getDateGroup(n.time);
    if (!groups[group]) groups[group] = [];
    groups[group].push(n);
  });

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-[var(--text-muted)] hover:text-[#B09B71] hover:bg-[rgba(245,240,232,0.04)] transition-all cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] rounded-full bg-[#B09B71] text-[var(--surface-2)] text-[9px] font-medium flex items-center justify-center px-0.5">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Slide-out panel */}
      {open && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div
            className="absolute inset-0 bg-black/40 pointer-events-auto"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-0 right-0 h-full w-full sm:w-[400px] pointer-events-auto flex flex-col"
            style={{ background: '#1A1A1E', borderLeft: '1px solid rgba(201,169,110,0.15)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(245,240,232,0.06)]">
              <div>
                <h2 className="text-base font-medium text-[var(--parchment)]">Notifications</h2>
                <p className="text-xs text-[var(--text-disabled)]">{unreadCount} unread</p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-[#B09B71] hover:text-[#D4C4A0] flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-[rgba(245,240,232,0.06)] text-[var(--text-muted)] hover:text-[var(--parchment)] transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 px-4 py-2 border-b border-[rgba(245,240,232,0.04)] overflow-x-auto">
              {FILTER_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    filter === tab
                      ? 'bg-[#B09B71]/15 text-[#D4C4A0] border border-[#B09B71]/25'
                      : 'text-[var(--text-disabled)] hover:text-[var(--text-body)]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="text-center py-16 text-[var(--text-disabled)]">
                  <div className="text-4xl mb-3"></div>
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                (['Today', 'Yesterday', 'Older'] as const).map(groupName => {
                  const items = groups[groupName];
                  if (!items?.length) return null;
                  return (
                    <div key={groupName}>
                      <div className="px-5 py-2 text-[11px] font-medium text-[var(--text-disabled)] uppercase tracking-widest sticky top-0"
                        style={{ background: '#1A1A1E' }}
                      >
                        {groupName}
                      </div>
                      {items.map(notif => {
                        const CatIcon = CATEGORY_ICONS[notif.category];
                        return (
                          <div
                            key={notif.id}
                            onClick={() => markRead(notif.id)}
                            className={`flex gap-3 px-5 py-4 border-b border-[rgba(245,240,232,0.03)] cursor-pointer transition-colors hover:bg-[rgba(245,240,232,0.03)] ${
                              !notif.read ? 'bg-[#B09B71]/[0.04]' : ''
                            }`}
                          >
                            <div className="relative shrink-0">
                              <div className="w-9 h-9 rounded-full bg-[rgba(245,240,232,0.06)] flex items-center justify-center text-lg">
                                {notif.icon}
                              </div>
                              {!notif.read && (
                                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#B09B71] border border-[var(--divider)]" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <span className={`text-xs font-medium ${!notif.read ? 'text-[var(--parchment)]' : 'text-[var(--text-muted)]'}`}>
                                  {notif.title}
                                </span>
                                <span className="text-[10px] text-[var(--text-disabled)] whitespace-nowrap shrink-0">
                                  {timeAgo(notif.time)}
                                </span>
                              </div>
                              <p className="text-[11px] text-[var(--text-disabled)] mt-0.5 line-clamp-2">{notif.description}</p>
                              <div className={`flex items-center gap-1 mt-1.5 ${CATEGORY_COLORS[notif.category]}`}>
                                <CatIcon className="w-3 h-3" />
                                <span className="text-[10px] font-medium">{notif.category}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
