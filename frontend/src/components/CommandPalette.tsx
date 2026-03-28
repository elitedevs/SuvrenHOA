'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface SearchItem {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  category: string;
}

const SEARCH_ITEMS: SearchItem[] = [
  // Pages
  { id: 'home', title: 'Home', subtitle: 'Landing page', href: '/', category: 'Pages' },
  { id: 'dashboard', title: 'Dashboard', subtitle: 'My property & voting power', href: '/dashboard', category: 'Pages' },
  { id: 'proposals', title: 'Proposals', subtitle: 'Vote on governance proposals', href: '/proposals', category: 'Pages' },
  { id: 'treasury', title: 'Treasury', subtitle: 'Community funds & balances', href: '/treasury', category: 'Pages' },
  { id: 'dues', title: 'Pay Dues', subtitle: 'Quarterly & annual payments', href: '/dues', category: 'Pages' },
  { id: 'messages', title: 'Messages', subtitle: 'Community inbox', href: '/messages', category: 'Pages' },
  { id: 'documents', title: 'Documents', subtitle: 'On-chain document registry', href: '/documents', category: 'Pages' },
  { id: 'calendar', title: 'Calendar', subtitle: 'Events & deadlines', href: '/calendar', category: 'Pages' },
  { id: 'meetings', title: 'Board Meetings', subtitle: 'Schedule & RSVP to meetings', href: '/calendar/meetings', category: 'Pages' },
  { id: 'alerts', title: 'Alerts', subtitle: 'Community alerts & notices', href: '/alerts', category: 'Pages' },
  { id: 'directory', title: 'Directory', subtitle: 'Homeowner directory', href: '/directory', category: 'Pages' },
  { id: 'announcements', title: 'Announcements', subtitle: 'Community news', href: '/announcements', category: 'Pages' },
  { id: 'maintenance', title: 'Maintenance', subtitle: 'Submit & track requests', href: '/maintenance', category: 'Pages' },
  { id: 'violations', title: 'Violations', subtitle: 'HOA violations tracker', href: '/violations', category: 'Pages' },
  { id: 'community', title: 'Community', subtitle: 'Posts & discussions', href: '/community', category: 'Pages' },
  { id: 'profile', title: 'Profile', subtitle: 'Your homeowner profile', href: '/profile', category: 'Pages' },
  { id: 'reservations', title: 'Reservations', subtitle: 'Book amenities', href: '/reservations', category: 'Pages' },
  { id: 'surveys', title: 'Surveys', subtitle: 'Community surveys', href: '/surveys', category: 'Pages' },
  { id: 'transparency', title: 'Transparency', subtitle: 'On-chain data explorer', href: '/transparency', category: 'Pages' },
  { id: 'admin', title: 'Admin', subtitle: 'Board administration tools', href: '/admin', category: 'Pages' },
  { id: 'vehicles', title: 'Vehicles', subtitle: 'Register vehicles', href: '/vehicles', category: 'Pages' },
  { id: 'pets', title: 'Pets', subtitle: 'Register pets', href: '/pets', category: 'Pages' },
  { id: 'map', title: 'Neighborhood Map', subtitle: 'Property map view', href: '/map', category: 'Pages' },
  { id: 'assistant', title: 'AI Assistant', subtitle: 'HOA AI helper', href: '/assistant', category: 'Pages' },
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
        className="relative z-10 w-full max-w-lg rounded-lg border border-[#c9a96e]/30 bg-[#0d0d0d] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages, proposals, documents..."
            className="flex-1 bg-transparent text-[var(--text-primary)] placeholder-gray-600 text-sm outline-none"
          />
          <kbd className="text-[10px] text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-500">No results for &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            <div className="py-2">
              {!query && (
                <p className="px-4 py-1.5 text-[10px] text-gray-600 font-semibold uppercase tracking-widest">
                  Quick Navigation
                </p>
              )}
              {filteredItems.map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.href)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    selectedIndex === i ? 'bg-[#c9a96e]/10' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <span className="text-lg w-7 flex-shrink-0 text-center"></span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${selectedIndex === i ? 'text-[#e8d5a3]' : 'text-[var(--text-primary)]'}`}>
                      {item.title}
                    </p>
                    {item.subtitle && (
                      <p className="text-[11px] text-gray-500 truncate">{item.subtitle}</p>
                    )}
                  </div>
                  {selectedIndex === i && (
                    <span className="text-[10px] text-gray-600 font-mono shrink-0">↵ enter</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[10px] text-gray-600">
            <span>↑↓ navigate</span>
            <span>↵ select</span>
            <span>esc close</span>
          </div>
          <span className="text-[10px] text-gray-600">K to open</span>
        </div>
      </div>
    </div>
  );
}
