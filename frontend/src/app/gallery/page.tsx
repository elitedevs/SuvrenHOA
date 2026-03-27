'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface GalleryPhoto {
  id: string;
  category: string;
  caption: string;
  description: string;
  date: string;
  postedBy: string; // lot number
  emoji: string; // placeholder
  likes: string[]; // wallet addresses
  postedAt: string;
}

const STORAGE_KEY = 'faircroft_gallery_v1';

const CATEGORIES = ['All', 'Events', 'Landscaping', 'Improvements', 'Pets', 'Seasonal'];

const CATEGORY_EMOJIS: Record<string, string> = {
  Events: '', Landscaping: '', Improvements: '', Pets: '', Seasonal: '',
};

const SAMPLE: GalleryPhoto[] = [
  { id: 'PH-001', category: 'Events', caption: 'Spring BBQ 2025', description: 'Annual spring barbecue at the community center. Great turnout!', date: '2025-05-20', postedBy: '7', emoji: '', likes: [], postedAt: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: 'PH-002', category: 'Landscaping', caption: 'New flower beds', description: 'Fresh perennial plantings along the main entrance. Selected by resident vote.', date: '2026-03-15', postedBy: '22', emoji: '', likes: [], postedAt: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: 'PH-003', category: 'Improvements', caption: 'Parking lot resurfaced', description: 'Section B parking lot completely repaved. No more potholes!', date: '2026-03-20', postedBy: '1', emoji: '', likes: [], postedAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 'PH-004', category: 'Pets', caption: 'Morning walk crew', description: 'Our regular morning dog walkers at the greenbelt. 8 dogs, 7 owners!', date: '2026-03-22', postedBy: '31', emoji: '', likes: [], postedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'PH-005', category: 'Seasonal', caption: 'First spring blooms', description: 'Cherry blossoms on Faircroft Drive. Peak bloom this weekend!', date: '2026-03-25', postedBy: '14', emoji: '', likes: [], postedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'PH-006', category: 'Events', caption: 'Kids Easter Hunt', description: 'Annual egg hunt drew 40+ kids. Thank you to the social committee!', date: '2025-04-01', postedBy: '8', emoji: '', likes: [], postedAt: new Date(Date.now() - 60 * 86400000).toISOString() },
];

export default function GalleryPage() {
  const { isConnected, address } = useAccount();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [category, setCategory] = useState('All');
  const [lightbox, setLightbox] = useState<GalleryPhoto | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ category: 'Events', caption: '', description: '', date: '', postedBy: '', emoji: '' });

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    setPhotos(raw ? JSON.parse(raw) : SAMPLE);
  }, []);

  const save = (next: GalleryPhoto[]) => {
    setPhotos(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const upload = () => {
    if (!form.caption || !form.date || !form.postedBy) return;
    const p: GalleryPhoto = {
      id: `PH-${String(photos.length + 1).padStart(3, '0')}`,
      ...form,
      likes: [],
      postedAt: new Date().toISOString(),
    };
    save([p, ...photos]);
    setForm({ category: 'Events', caption: '', description: '', date: '', postedBy: '', emoji: '' });
    setShowUpload(false);
  };

  const toggleLike = (id: string) => {
    if (!address) return;
    save(photos.map(p => {
      if (p.id !== id) return p;
      const liked = p.likes.includes(address);
      return { ...p, likes: liked ? p.likes.filter(a => a !== address) : [...p.likes, address] };
    }));
    if (lightbox?.id === id) {
      const updated = photos.find(p => p.id === id);
      if (updated) setLightbox({ ...updated, likes: updated.likes.includes(address) ? updated.likes.filter(a => a !== address) : [...updated.likes, address] });
    }
  };

  const filtered = category === 'All' ? photos : photos.filter(p => p.category === category);

  if (!isConnected) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <p className="text-gray-400 mb-4">Sign in to view the gallery</p>
      <ConnectButton label="Sign In" />
    </div>
  );

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Community Gallery</h1>
          <p className="text-sm text-gray-400 mt-1">Shared moments from our neighborhood</p>
        </div>
        <button onClick={() => setShowUpload(!showUpload)}
          className="px-5 py-2.5 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] text-sm font-medium transition-all shrink-0">
          {showUpload ? '← Back' : ' Add Photo'}
        </button>
      </div>

      {showUpload && (
        <div className="glass-card rounded-xl p-6 space-y-4 mb-6">
          <h2 className="text-lg font-semibold">Add a Community Photo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Caption</label>
              <input value={form.caption} onChange={e => setForm({...form, caption: e.target.value})}
                placeholder="Brief title..." className="w-full px-3 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Date</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              placeholder="Tell us about this photo..." rows={2}
              className="w-full px-3 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none resize-none" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none">
                {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Your Lot #</label>
              <input value={form.postedBy} onChange={e => setForm({...form, postedBy: e.target.value})}
                placeholder="e.g. 42" className="w-full px-3 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Photo Emoji</label>
              <input value={form.emoji} onChange={e => setForm({...form, emoji: e.target.value})}
                placeholder="" className="w-full px-3 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-sm focus:border-[#c9a96e]/50 focus:outline-none" />
            </div>
          </div>
          <div className="p-3 rounded-xl bg-gray-800/30 text-xs text-gray-500">
             Photo uploads coming in a future update. For now, describe your photo and add an emoji.
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowUpload(false)} className="flex-1 py-3 rounded-xl border border-gray-700 text-sm font-medium hover:bg-gray-800/50 transition-colors">Cancel</button>
            <button onClick={upload} disabled={!form.caption || !form.date || !form.postedBy}
              className="flex-1 py-3 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] disabled:opacity-50 text-sm font-medium transition-all">
              Add to Gallery
            </button>
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${category === c ? 'bg-[#c9a96e]/15 text-[#c9a96e] border border-[#c9a96e]/30' : 'glass-card text-gray-400'}`}>
            {c !== 'All' && CATEGORY_EMOJIS[c]} {c}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map(photo => {
          const liked = address ? photo.likes.includes(address) : false;
          return (
            <div key={photo.id} className="glass-card rounded-xl overflow-hidden group cursor-pointer"
              onClick={() => setLightbox(photo)}>
              <div className="aspect-square flex items-center justify-center text-6xl bg-gradient-to-br from-gray-900 to-gray-800 group-hover:scale-105 transition-transform duration-300">
                {photo.emoji}
              </div>
              <div className="p-3">
                <p className="text-xs font-medium truncate">{photo.caption}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{photo.category} · {photo.date}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-gray-600">Lot #{photo.postedBy}</span>
                  <button onClick={e => { e.stopPropagation(); toggleLike(photo.id); }}
                    className={`flex items-center gap-1 text-[11px] transition-colors ${liked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'}`}>
                    {liked ? '' : ''} {photo.likes.length}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative z-10 max-w-lg w-full glass-card rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="aspect-video flex items-center justify-center text-[8rem] bg-gradient-to-br from-gray-900 to-gray-800">
              {lightbox.emoji}
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-base">{lightbox.caption}</h3>
                  <p className="text-xs text-gray-500">{lightbox.category} · {lightbox.date} · Lot #{lightbox.postedBy}</p>
                </div>
                <button onClick={() => setLightbox(null)} className="text-gray-500 hover:text-white transition-colors text-lg ml-3"></button>
              </div>
              {lightbox.description && <p className="text-sm text-gray-400 mb-4">{lightbox.description}</p>}
              <button onClick={() => toggleLike(lightbox.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors text-sm ${
                  address && lightbox.likes.includes(address)
                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                    : 'glass-card text-gray-400 hover:border-red-500/30 hover:text-red-400'
                }`}>
                {address && lightbox.likes.includes(address) ? '' : ''} {lightbox.likes.length} like{lightbox.likes.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
