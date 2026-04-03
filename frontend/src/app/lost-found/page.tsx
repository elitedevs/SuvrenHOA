'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface LostFoundItem {
  id: string;
  type: 'lost' | 'found';
  title: string;
  description: string;
  date: string;
  location: string;
  contactLot: string;
  category: string;
  status: 'active' | 'claimed';
  postedAt: string;
}

const STORAGE_KEY = 'faircroft_lost_found_v1';

const SAMPLE: LostFoundItem[] = [
  {
    id: 'LF-001', type: 'lost', title: 'Orange tabby cat',
    description: 'Friendly male tabby, answers to "Mango". Has a teal collar with bell.',
    date: '2026-03-25', location: 'Near building C / community garden',
    contactLot: '14', category: 'Pets', status: 'active',
    postedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'LF-002', type: 'found', title: 'Set of house keys',
    description: 'Found 3 keys on a blue carabiner near the mailboxes on Oak Lane.',
    date: '2026-03-24', location: 'Mailbox area, Oak Lane',
    contactLot: '27', category: 'Keys', status: 'active',
    postedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'LF-003', type: 'found', title: 'Child\'s pink bicycle',
    description: 'Small pink bike with training wheels and basket, found near pool area.',
    date: '2026-03-20', location: 'Pool area entrance',
    contactLot: '8', category: 'Bikes', status: 'claimed',
    postedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
];

const CATEGORIES = ['All', 'Pets', 'Keys', 'Bikes', 'Electronics', 'Jewelry', 'Clothing', 'Documents', 'Other'];

export default function LostFoundPage() {
  const { isConnected } = useAccount();
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'lost' | 'found' | 'claimed'>('all');
  const [catFilter, setCatFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'lost' as 'lost' | 'found', title: '', description: '', date: '', location: '', contactLot: '', category: 'Other' });

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    setItems(raw ? JSON.parse(raw) : SAMPLE);
  }, []);

  const save = (next: LostFoundItem[]) => {
    setItems(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const post = () => {
    if (!form.title || !form.description || !form.location || !form.contactLot) return;
    const item: LostFoundItem = {
      id: `LF-${String(items.length + 1).padStart(3, '0')}`,
      ...form,
      status: 'active',
      postedAt: new Date().toISOString(),
    };
    save([item, ...items]);
    setForm({ type: 'lost', title: '', description: '', date: '', location: '', contactLot: '', category: 'Other' });
    setShowForm(false);
  };

  const markClaimed = (id: string) => {
    save(items.map(i => i.id === id ? { ...i, status: 'claimed' } : i));
  };

  const filtered = items.filter(i => {
    if (filter === 'claimed') return i.status === 'claimed';
    if (filter === 'lost' || filter === 'found') {
      if (i.type !== filter) return false;
      if (i.status === 'claimed') return false;
    }
    if (catFilter !== 'All' && i.category !== catFilter) return false;
    return true;
  });

  if (!isConnected) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <p className="text-[var(--text-muted)] mb-4">Sign in to view Lost & Found</p>
      <ConnectButton label="Sign In" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-medium">Lost & Found</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Post and find lost items in the community</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] text-sm font-medium transition-all shrink-0">
          {showForm ? '← Back' : ' Post Item'}
        </button>
      </div>

      {showForm && (
        <div className="glass-card rounded-xl p-6 space-y-4 mb-6">
          <h2 className="text-lg font-medium">Post a Lost or Found Item</h2>
          <div className="flex gap-3">
            {(['lost', 'found'] as const).map(t => (
              <button key={t} onClick={() => setForm({...form, type: t})}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium capitalize border transition-all ${
                  form.type === t
                    ? t === 'lost' ? 'bg-[rgba(107,58,58,0.12)] text-[#8B5A5A] border-[rgba(107,58,58,0.25)]' : 'bg-[rgba(42,93,79,0.15)] text-[#3A7D6F] border-[rgba(42,93,79,0.25)]'
                    : 'glass-card text-[var(--text-muted)]'
                }`}>
                {t === 'lost' ? ' Lost Item' : ' Found Item'}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Item Title</label>
            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              placeholder="e.g. Orange tabby cat, set of keys..." className="w-full px-3 py-2.5 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[#B09B71]/50 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              placeholder="Details that help identify the item..." rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-sm focus:border-[#B09B71]/50 focus:outline-none resize-none" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Date</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                className="w-full px-3 py-2 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-xs focus:border-[#B09B71]/50 focus:outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-[var(--text-muted)] mb-1">Location</label>
              <input value={form.location} onChange={e => setForm({...form, location: e.target.value})}
                placeholder="Where it was lost/found" className="w-full px-3 py-2 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-xs focus:border-[#B09B71]/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Your Lot #</label>
              <input value={form.contactLot} onChange={e => setForm({...form, contactLot: e.target.value})}
                placeholder="42" className="w-full px-3 py-2 rounded-xl bg-[rgba(26,26,30,0.80)] border border-[rgba(245,240,232,0.08)] text-xs focus:border-[#B09B71]/50 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Category</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.slice(1).map(c => (
                <button key={c} onClick={() => setForm({...form, category: c})}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${form.category === c ? 'bg-[#B09B71]/15 text-[#B09B71] border border-[#B09B71]/30' : 'glass-card text-[var(--text-muted)]'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-[rgba(245,240,232,0.08)] text-sm font-medium hover:bg-[rgba(245,240,232,0.04)] transition-colors">Cancel</button>
            <button onClick={post} disabled={!form.title || !form.description || !form.location || !form.contactLot}
              className="flex-1 py-3 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] disabled:opacity-50 text-sm font-medium transition-all">
              Post Item
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(['all', 'lost', 'found', 'claimed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter === f ? 'bg-[#B09B71]/15 text-[#B09B71] border border-[#B09B71]/30' : 'glass-card text-[var(--text-muted)]'}`}>
            {f}
          </button>
        ))}
        <div className="w-px bg-[var(--surface-2)] self-stretch mx-1" />
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCatFilter(c)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${catFilter === c ? 'bg-[#B09B71]/15 text-[#B09B71] border border-[#B09B71]/30' : 'glass-card text-[var(--text-muted)]'}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full glass-card rounded-xl p-12 text-center">
            <p className="text-4xl mb-3"></p>
            <p className="text-[var(--text-muted)]">No items in this category</p>
          </div>
        ) : filtered.map(item => (
          <div key={item.id} className={`glass-card rounded-xl overflow-hidden ${item.status === 'claimed' ? 'opacity-60' : ''}`}>
            {/* Photo placeholder */}
            <div className={`h-32 flex items-center justify-center text-4xl ${
              item.type === 'lost' ? 'bg-[rgba(107,58,58,0.10)]' : 'bg-[rgba(42,93,79,0.10)]'
            }`}>
              {item.category === 'Pets' ? '' : item.category === 'Keys' ? '' : item.category === 'Bikes' ? '' :
               item.category === 'Electronics' ? '' : item.category === 'Jewelry' ? '' : ''}
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                  item.status === 'claimed' ? 'bg-[rgba(245,240,232,0.04)] text-[var(--text-muted)] border-[rgba(245,240,232,0.08)]' :
                  item.type === 'lost' ? 'bg-[rgba(107,58,58,0.10)] text-[#8B5A5A] border-[rgba(107,58,58,0.20)]' : 'bg-[rgba(42,93,79,0.10)] text-[#3A7D6F] border-[rgba(42,93,79,0.20)]'
                }`}>
                  {item.status === 'claimed' ? ' Claimed' : item.type === 'lost' ? ' Lost' : ' Found'}
                </span>
                <span className="text-[10px] text-[var(--text-disabled)]">{item.category}</span>
              </div>
              <h3 className="font-medium text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-[var(--text-muted)] mb-3 leading-relaxed">{item.description}</p>
              <div className="space-y-1 text-[11px] text-[var(--text-disabled)]">
                <p> {item.location}</p>
                {item.date && <p> {item.date}</p>}
                <p> Contact Lot #{item.contactLot}</p>
              </div>
              {item.status === 'active' && (
                <button onClick={() => markClaimed(item.id)}
                  className="mt-3 w-full py-2 rounded-xl border border-[rgba(42,93,79,0.25)] text-[#3A7D6F] text-xs font-medium hover:bg-[rgba(42,93,79,0.10)] transition-colors">
                  Mark as Claimed 
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
