'use client';

import { useState, useRef, useEffect } from 'react';
import { useNotifications, useMarkRead, type Notification } from '@/hooks/useNotifications';
import Link from 'next/link';

/** Generate a pleasant chime using Web Audio API */
function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const now = ctx.currentTime;

    const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.18, now + i * 0.12 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.35);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.4);
    });
  } catch {
    // Audio unavailable — silently ignore
  }
}

export function NotificationBell() {
  const { notifications, unreadCount } = useNotifications();
  const markRead = useMarkRead();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef(unreadCount);

  // Play chime when new notifications arrive
  useEffect(() => {
    if (unreadCount > prevUnreadRef.current) {
      playChime();
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

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
        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm hover:bg-[rgba(245,240,232,0.05)] transition-colors relative"
        aria-label={`${unreadCount} unread notifications`}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M13 10.5V7a5 5 0 0 0-10 0v3.5L2 12h12l-1-1.5Z" />
          <path d="M9.5 13.5a1.5 1.5 0 0 1-3 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#8B5A5A] text-[9px] font-medium flex items-center justify-center text-[var(--text-heading)]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-10 w-80 max-h-96 overflow-y-auto glass rounded-xl border border-[rgba(245,240,232,0.06)] shadow-xl z-50">
          <div className="p-3 border-b border-[rgba(245,240,232,0.05)] flex items-center justify-between">
            <span className="text-sm font-medium">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-[10px] text-[#B09B71]">{unreadCount} new</span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm" style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                Nothing to report.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[rgba(245,240,232,0.05)]">
              {notifications.slice(0, 20).map((n: Notification) => (
                <div
                  key={n.id}
                  className={`p-3 hover:bg-[rgba(245,240,232,0.02)] transition-colors cursor-pointer ${!n.read ? 'bg-[rgba(176,155,113,0.05)]' : ''}`}
                  onClick={() => {
                    if (!n.read) markRead.mutate(n.id);
                    if (n.link) window.location.href = n.link;
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-[rgba(176,155,113,0.80)] mt-1.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-snug">{n.title}</p>
                      {n.message && (
                        <p className="text-[10px] text-[var(--text-disabled)] mt-0.5 line-clamp-2">{n.message}</p>
                      )}
                      <p className="text-[9px] text-[var(--text-disabled)] mt-1">
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
