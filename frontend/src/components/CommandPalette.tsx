'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface SearchItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  href: string;
  category: string;
}

const SEARCH_ITEMS: SearchItem[] = [
  // Pages
  { id: 'home', title: 'Home', subtitle: 'Landing page', icon: '', href: '/', category: 'Pages' },
  { id: 'dashboard', title: 'Dashboard', subtitle: 'My property & voting power', icon: '', href: '/dashboard', category: 'Pages' },
  { id: 'proposals', title: 'Proposals', subtitle: 'Vote on governance proposals', icon: '', href: '/proposals', category: 'Pages' },
  { id: 'treasury', title: 'Treasury', subtitle: 'Community funds & balances', icon: '', href: '/treasury', category: 'Pages' },
  { id: 'dues', title: 'Pay Dues', subtitle: 'Quarterly & annual payments', icon: '', href: '/dues', category: 'Pages' },
  { id: 'messages', title: 'Messages', subtitle: 'Community inbox', icon: '', href: '/messages', category: 'Pages' },
  { id: 'documents', title: 'Documents', subtitle: 'On-chain document registry', icon: '', href: '/documents', category: 'Pages' },
  { id: 'calendar', title: 'Calendar', subtitle: 'Events & deadlines', icon: '', href: '/calendar', category: 'Pages' },
  { id: 'meetings', title: 'Board Meetings', subtitle: 'Schedule & RSVP to meetings', icon: '', href: '/calendar/meetings', category: 'Pages' },
  { id: 'alerts', title: 'Alerts', subtitle: 'Community alerts & notices', icon: '', href: '/alerts', category: 'Pages' },
  { id: 'directory', title: 'Directory', subtitle: 'Homeowner directory', icon: '', href: '/directory', category: 'Pages' },
  { id: 'announcements', title: 'Announcements', subtitle: 'Community news', icon: '', href: '/announcements', category: 'Pages' },
  { id: 'maintenance', title: 'Maintenance', subtitle: 'Submit & track requests', icon: '', href: '/maintenance', category: 'Pages' },
  { id: 'violations', title: 'Violations', subtitle: 'HOA violations tracker', icon: '', href: '/violations', category: 'Pages' },
  { id: 'community', title: 'Community', subtitle: 'Posts & discussions', icon: '', href: '/community', category: 'Pages' },
  { id: 'profile', title: 'Profile', subtitle: 'Your homeowner profile', icon: '', href: '/profile', category: 'Pages' },
  { id: 'reservations', title: 'Reservations', subtitle: 'Book amenities', icon: '', href: '/reservations', category: 'Pages' },
  { id: 'surveys', title: 'Surveys', subtitle: 'Community surveys', icon: '', href: '/surveys', category: 'Pages' },
  { id: 'transparency', title: 'Transparency', subtitle: 'On-chain data explorer', icon: '', href: '/transparency', category: 'Pages' },
  { id: 'admin', title: 'Admin', subtitle: 'Board administration tools', icon: '', href: '/admin', category: 'Pages' },
  { id: 'vehicles', title: 'Vehicles', subtitle: 'Register vehicles', icon: '', href: '/vehicles', category: 'Pages' },
  { id: 'pets', title: 'Pets', subtitle: 'Register pets', icon: '', href: '/pets', category: 'Pages' },
  { id: 'map', title: 'Neighborhood Map', subtitle: 'Property map view', icon: '', href: '/map', category: 'Pages' },
  { id: 'assistant', title: 'AI Assistant', subtitle: 'HOA AI helper', icon: '', href: '/assistant', category: 'Pages' },
  { id: 'violations', title: 'Violations', subtitle: 'HOA violation tracker', icon: '', href: '/violations', category: 'Pages' },
  { id: 'architectural', title: 'Arch Review', subtitle: 'Architectural review requests', icon: '', href: '/architectural', category: 'Pages' },
  { id: 'rules', title: 'Rules', subtitle: 'HOA rules & regulations', icon: '', href: '/rules', category: 'Pages' },
  { id: 'safety', title: 'Safety', subtitle: 'Community safety info', icon: '', href: '/safety', category: 'Pages' },
  { id: 'emergency', title: 'Emergency', subtitle: 'Emergency contacts & info', icon: '', href: '/emergency', category: 'Pages' },
  { id: 'newsletter', title: 'Newsletter', subtitle: 'Community newsletter', icon: '', href: '/newsletter', category: 'Pages' },
  { id: 'activity', title: 'Activity Log', subtitle: 'On-chain activity feed', icon: '', href: '/activity', category: 'Pages' },
  { id: 'contractors', title: 'Contractors', subtitle: 'Approved contractor directory', icon: '', href: '/contractors', category: 'Pages' },
  { id: 'utilities', title: 'Utilities', subtitle: 'Utility management', icon: '', href: '/utilities', category: 'Pages' },
  { id: 'contracts', title: 'Contracts', subtitle: 'Smart contracts', icon: '', href: '/contracts', category: 'Pages' },
  { id: 'lost-found', title: 'Lost & Found', subtitle: 'Community lost & found', icon: '', href: '/lost-found', category: 'Pages' },
  { id: 'gallery', title: 'Gallery', subtitle: 'Community photo gallery', icon: '', href: '/gallery', category: 'Pages' },
  { id: 'parking', title: 'Parking', subtitle: 'Parking management', icon: '', href: '/parking', category: 'Pages' },
  { id: 'reservations', title: 'Reservations', subtitle: 'Book amenities', icon: '', href: '/reservations', category: 'Pages' },
  { id: 'health', title: 'Health Score', subtitle: 'Community health metrics', icon: '', href: '/health', category: 'Pages' },
  { id: 'onboarding', title: 'Onboarding', subtitle: 'Setup wizard for new residents', icon: '', href: '/onboarding', category: 'Pages' },
  { id: 'checkout', title: 'Move Out', subtitle: 'Move-out / checkout process', icon: '', href: '/checkout', category: 'Pages' },
  { id: 'reports', title: 'Annual Report', subtitle: 'Community annual report', icon: '', href: '/reports/annual', category: 'Pages' },
  { id: 'noise', title: 'Noise Complaint', subtitle: 'Submit a noise complaint', icon: '', href: '/complaints/noise', category: 'Pages' },
  { id: 'leaderboard', title: 'Leaderboard', subtitle: 'Community engagement rankings', icon: '', href: '/community/leaderboard', category: 'Pages' },
  { id: 'voting-power', title: 'Voting Power', subtitle: 'Your governance weight', icon: '', href: '/governance/voting-power', category: 'Pages' },
  { id: 'gov-stats', title: 'Gov Stats', subtitle: 'Governance statistics', icon: '', href: '/governance/stats', category: 'Pages' },
  { id: 'survey-builder', title: 'Survey Builder', subtitle: 'Create community surveys', icon: '', href: '/surveys/builder', category: 'Pages' },
  { id: 'reimbursement', title: 'Reimbursement', subtitle: 'Request expense reimbursement', icon: '', href: '/treasury/reimbursement', category: 'Pages' },
  { id: 'vendors', title: 'Vendors', subtitle: 'Approved vendors list', icon: '', href: '/treasury/vendors', category: 'Pages' },
  { id: 'amenities', title: 'Amenities', subtitle: 'Community amenities', icon: '', href: '/amenities', category: 'Pages' },
  { id: 'marketplace', title: 'Marketplace', subtitle: 'Community marketplace', icon: '', href: '/marketplace', category: 'Pages' },
  { id: 'notifications', title: 'Notifications', subtitle: 'Notification settings', icon: '', href: '/settings/notifications', category: 'Pages' },
];

function fuzzyMatch(query: string, item: SearchItem): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  const text = `${item.title} ${item.subtitle || ''} ${item.category}`.toLowerCase();
  // Simple: all characters of query appear in order in text
  let qi = 0;
  for (let i = 0; i < text.length && qi < q.length; i++) {
    if (text[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

function scoreMatch(query: string, item: SearchItem): number {
  const q = query.toLowerCase();
  const title = item.title.toLowerCase();
  if (title === q) return 100;
  if (title.startsWith(q)) return 80;
  if (title.includes(q)) return 60;
  return 40;
}

export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredItems = query
    ? SEARCH_ITEMS
        .filter(item => fuzzyMatch(query, item))
        .sort((a, b) => scoreMatch(query, b) - scoreMatch(query, a))
        .slice(0, 8)
    : SEARCH_ITEMS.slice(0, 8);

  const open = useCallback(() => {
    setIsOpen(true);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  const navigate = useCallback((href: string) => {
    router.push(href);
    close();
  }, [router, close]);

  // Listen for custom event
  useEffect(() => {
    const handler = () => open();
    document.addEventListener('suvren:open-search', handler);
    return () => document.removeEventListener('suvren:open-search', handler);
  }, [open]);

  // Keyboard nav inside palette
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredItems.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) navigate(filteredItems[selectedIndex].href);
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, filteredItems, selectedIndex, close, navigate]);

  // Reset selection when query changes
  useEffect(() => { setSelectedIndex(0); }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Group by category for empty query
  const grouped: Record<string, SearchItem[]> = {};
  if (!query) {
    grouped['Quick Navigation'] = filteredItems;
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-start justify-center pt-[15vh] px-4"
      onClick={close}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative z-10 w-full max-w-lg rounded-xl border border-[#B09B71]/30 bg-[var(--obsidian)] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-[rgba(245,240,232,0.05)]">
          <span className="text-[var(--text-disabled)] text-lg"></span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages, proposals, documents..."
            className="flex-1 bg-transparent text-[var(--parchment)] placeholder-[rgba(245,240,232,0.20)] text-sm outline-none"
          />
          <kbd className="text-[10px] text-[var(--text-disabled)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded border border-[rgba(245,240,232,0.08)] font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-[var(--text-disabled)]">No results for &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            <div className="py-2">
              {!query && (
                <p className="px-4 py-1.5 text-[10px] text-[var(--text-disabled)] font-medium uppercase tracking-widest">
                  Quick Navigation
                </p>
              )}
              {filteredItems.map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.href)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    selectedIndex === i ? 'bg-[#B09B71]/10' : 'hover:bg-[rgba(245,240,232,0.03)]'
                  }`}
                >
                  <span className="text-lg w-7 flex-shrink-0 text-center">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${selectedIndex === i ? 'text-[#D4C4A0]' : 'text-[var(--parchment)]'}`}>
                      {item.title}
                    </p>
                    {item.subtitle && (
                      <p className="text-[11px] text-[var(--text-disabled)] truncate">{item.subtitle}</p>
                    )}
                  </div>
                  {selectedIndex === i && (
                    <span className="text-[10px] text-[var(--text-disabled)] font-mono shrink-0">↵ enter</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-[rgba(245,240,232,0.05)] flex items-center justify-between">
          <div className="flex items-center gap-3 text-[10px] text-[var(--text-disabled)]">
            <span>↑↓ navigate</span>
            <span>↵ select</span>
            <span>esc close</span>
          </div>
          <span className="text-[10px] text-[var(--text-disabled)]">⌘K to open</span>
        </div>
      </div>
    </div>
  );
}
