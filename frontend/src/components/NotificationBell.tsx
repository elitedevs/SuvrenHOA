'use client';

import { useState, useRef, useEffect } from 'react';
import { useNotifications, useMarkRead, type Notification } from '@/hooks/useNotifications';
import Link from 'next/link';

export function NotificationBell() {
  const { notifications, unreadCount } = useNotifications();
  const markRead = useMarkRead();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm hover:bg-white/5 transition-colors relative"
        aria-label={`${unreadCount} unread notifications`}
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold flex items-center justify-center text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-10 w-80 max-h-96 overflow-y-auto glass rounded-xl border border-gray-800 shadow-xl z-50">
          <div className="p-3 border-b border-white/5 flex items-center justify-between">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-[10px] text-purple-400">{unreadCount} new</span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.slice(0, 20).map((n: Notification) => (
                <div
                  key={n.id}
                  className={`p-3 hover:bg-white/[0.02] transition-colors cursor-pointer ${!n.read ? 'bg-purple-500/[0.03]' : ''}`}
                  onClick={() => {
                    if (!n.read) markRead.mutate(n.id);
                    if (n.link) window.location.href = n.link;
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-snug">{n.title}</p>
                      {n.message && (
                        <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      )}
                      <p className="text-[9px] text-gray-600 mt-1">
                        {getTimeAgo(new Date(n.created_at))}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
