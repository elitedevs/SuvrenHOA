'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface Newsletter {
  id: string;
  title: string;
  date: string;
  summary: string;
  content: string;
  pinned: boolean;
  createdAt: string;
}

const STORAGE_KEY = 'faircroft_newsletters_v1';

const SAMPLE: Newsletter[] = [
  {
    id: 'NL-001',
    title: 'Spring 2026 Community Newsletter',
    date: '2026-03-01',
    summary: 'Pool opening date confirmed, new landscaping vendor selected, and a recap of the February board meeting.',
    content: `Dear Faircroft Residents,

Spring is just around the corner and we have exciting news to share!

**Pool Opening:** The community pool will open for the season on May 15th. Hours will be 9 AM – 9 PM daily. The board has approved a new pool furniture refresh with upgraded loungers.

**Landscaping:** After reviewing three proposals, the board has selected GreenScape Pro as our new landscaping contractor. They will begin service April 1st.

**February Meeting Recap:** The board voted to approve the annual budget, with dues remaining unchanged at $425/month. Reserves are in excellent shape at 112% funded.

**Upcoming Events:**
- Spring Cleanup Day: April 12th
- Annual BBQ: June 14th
- Pool Party: July 4th

Thank you for being part of our wonderful community!

— The Faircroft HOA Board`,
    pinned: true,
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'NL-002',
    title: 'January 2026 Update',
    date: '2026-01-15',
    summary: 'New year message from the board, holiday decoration removal reminder, and road repair schedule.',
    content: `Happy New Year, Faircroft!

The board wishes all residents a wonderful 2026. A few updates as we start the new year:

**Holiday Decorations:** Please remove exterior holiday decorations by January 31st per community guidelines.

**Road Repairs:** The city has scheduled pothole repairs on Faircroft Drive for the week of January 20th. Expect some traffic delays.

**Architectural Submissions:** Reminder that any exterior modifications require ARB approval before work begins. Processing time is approximately 14 days.

Best,
The Board`,
    pinned: false,
    createdAt: new Date(Date.now() - 70 * 86400000).toISOString(),
  },
];

export default function NewsletterPage() {
  const { isConnected } = useAccount();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', summary: '', content: '' });
  const [isBoard] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    setNewsletters(raw ? JSON.parse(raw) : SAMPLE);
  }, []);

  const save = (next: Newsletter[]) => {
    setNewsletters(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const create = () => {
    if (!form.title || !form.date || !form.summary || !form.content) return;
    const nl: Newsletter = {
      id: `NL-${String(newsletters.length + 1).padStart(3, '0')}`,
      ...form,
      pinned: false,
      createdAt: new Date().toISOString(),
    };
    save([nl, ...newsletters]);
    setForm({ title: '', date: '', summary: '', content: '' });
    setShowCreate(false);
  };

  const togglePin = (id: string) => {
    save(newsletters.map(n => ({ ...n, pinned: n.id === id ? !n.pinned : false })));
  };

  const sorted = [...newsletters].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  if (!isConnected) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <p className="text-gray-400 mb-4">Sign in to view newsletters</p>
      <ConnectButton label="Sign In" />
    </div>
  );

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Community Newsletter</h1>
          <p className="text-sm text-gray-400 mt-1">Stay informed with community updates</p>
        </div>
        {isBoard && (
          <button onClick={() => setShowCreate(!showCreate)}
            className="px-5 py-2.5 rounded-md bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] text-sm font-medium transition-all shrink-0">
            {showCreate ? '← Back' : ' New Newsletter'}
          </button>
        )}
      </div>

      {showCreate && (
        <div className="glass-card rounded-md p-6 space-y-4 mb-6">
          <h2 className="text-lg font-semibold">Create Newsletter</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Title</label>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                placeholder="Spring 2026 Newsletter" className="w-full px-3 py-2.5 rounded-md bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Date</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                className="w-full px-3 py-2.5 rounded-md bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Summary (shown in list)</label>
            <input value={form.summary} onChange={e => setForm({...form, summary: e.target.value})}
              placeholder="Brief one-sentence summary..." className="w-full px-3 py-2.5 rounded-md bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Full Content</label>
            <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})}
              placeholder="Full newsletter content..." rows={10}
              className="w-full px-3 py-2.5 rounded-md bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none resize-y font-mono" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-md border border-gray-700 text-sm font-medium hover:bg-gray-800/50 transition-colors">Cancel</button>
            <button onClick={create} disabled={!form.title || !form.date || !form.summary || !form.content}
              className="flex-1 py-3 rounded-md bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] disabled:opacity-50 text-sm font-medium transition-all">
              Publish Newsletter
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {sorted.map(nl => (
          <div key={nl.id} className={`glass-card rounded-md overflow-hidden ${nl.pinned ? 'border border-[#c9a96e]/20' : ''}`}>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {nl.pinned && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#c9a96e]/10 text-[#c9a96e] border border-[#c9a96e]/20"> Current Issue</span>}
                    <span className="text-xs text-gray-500">{new Date(nl.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <h3 className="font-semibold text-base mb-2">{nl.title}</h3>
                  <p className="text-sm text-gray-400">{nl.summary}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {isBoard && (
                    <button onClick={() => togglePin(nl.id)}
                      className={`px-2 py-1.5 rounded-lg text-xs transition-colors ${nl.pinned ? 'text-[#c9a96e]' : 'text-gray-500 hover:text-gray-300'}`}>
                      
                    </button>
                  )}
                  <button onClick={() => setExpanded(expanded === nl.id ? null : nl.id)}
                    className="px-3 py-1.5 rounded-lg text-xs border border-gray-700 text-gray-300 hover:border-[#c9a96e]/30 hover:text-[#c9a96e] transition-colors">
                    {expanded === nl.id ? 'Collapse' : 'Read'}
                  </button>
                </div>
              </div>

              {expanded === nl.id && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="prose prose-invert prose-sm max-w-none">
                    {nl.content.split('\n').map((line, i) => {
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <p key={i} className="font-semibold text-[#c9a96e] mt-3 mb-1">{line.slice(2, -2)}</p>;
                      }
                      if (line.trim() === '') return <div key={i} className="h-2" />;
                      return <p key={i} className="text-sm text-gray-300 leading-relaxed">{line}</p>;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
