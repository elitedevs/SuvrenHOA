'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  Wrench, Leaf, Laptop, ChefHat, Baby, PawPrint, Plus, X, Users, Handshake, Filter,
} from 'lucide-react';

type Category = 'Tech' | 'Garden' | 'Home Repair' | 'Cooking' | 'Childcare' | 'Pets';
type ListingType = 'offer' | 'request';

interface SkillListing {
  id: string;
  type: ListingType;
  category: Category;
  skill: string;
  description: string;
  lot: string;
  name: string;
  createdAt: string;
  matched?: boolean;
}

const CATEGORIES: { id: Category; icon: React.ElementType; color: string; bg: string; border: string }[] = [
  { id: 'Tech', icon: Laptop, color: 'text-[var(--steel)]', bg: 'bg-[var(--steel)]/10', border: 'border-[rgba(90,122,154,0.20)]' },
  { id: 'Garden', icon: Leaf, color: 'text-[#3A7D6F]', bg: 'bg-[rgba(58,125,111,0.10)]', border: 'border-[rgba(42,93,79,0.20)]' },
  { id: 'Home Repair', icon: Wrench, color: 'text-[#B09B71]', bg: 'bg-[rgba(176,155,113,0.10)]', border: 'border-[rgba(176,155,113,0.40)]/20' },
  { id: 'Cooking', icon: ChefHat, color: 'text-[#8B5A5A]', bg: 'bg-[rgba(139,90,90,0.10)]', border: 'border-[rgba(139,90,90,0.20)]' },
  { id: 'Childcare', icon: Baby, color: 'text-pink-400', bg: 'bg-pink-400/10', border: 'border-pink-400/20' },
  { id: 'Pets', icon: PawPrint, color: 'text-[#B09B71]', bg: 'bg-[rgba(176,155,113,0.10)]', border: 'border-amber-400/20' },
];

const DEMO_LISTINGS: SkillListing[] = [
  { id: '1', type: 'offer', category: 'Tech', skill: 'Smart Home Setup', description: 'Can help set up smart devices, home automation, and network troubleshooting', lot: '8', name: 'Ryan M.', createdAt: '2026-03-20T10:00:00Z' },
  { id: '2', type: 'offer', category: 'Garden', skill: 'Vegetable Garden Planning', description: 'Expert in raised bed gardens, companion planting, and seasonal scheduling', lot: '17', name: 'Eleanor W.', createdAt: '2026-03-18T09:00:00Z' },
  { id: '3', type: 'request', category: 'Tech', skill: 'WiFi & Router Help', description: 'Need help extending WiFi coverage to garage and backyard', lot: '11', name: 'Tom R.', createdAt: '2026-03-22T14:00:00Z' },
  { id: '4', type: 'offer', category: 'Home Repair', skill: 'Basic Plumbing', description: 'Can fix leaky faucets, running toilets, and basic pipe issues', lot: '15', name: 'Carlos B.', createdAt: '2026-03-15T11:00:00Z' },
  { id: '5', type: 'request', category: 'Garden', skill: 'Lawn Aeration Advice', description: 'Looking for help with soil aeration and overseeding schedule', lot: '6', name: 'Sarah K.', createdAt: '2026-03-21T16:00:00Z' },
  { id: '6', type: 'offer', category: 'Cooking', skill: 'Meal Prep Coaching', description: 'Can teach batch cooking and healthy meal planning for families', lot: '9', name: 'Aisha P.', createdAt: '2026-03-19T12:00:00Z' },
  { id: '7', type: 'request', category: 'Pets', skill: 'Dog Walking Coverage', description: 'Need occasional dog walking help during work travel', lot: '13', name: 'Mark V.', createdAt: '2026-03-23T08:00:00Z' },
  { id: '8', type: 'offer', category: 'Pets', skill: 'Pet Sitting', description: 'Happy to watch dogs, cats, or small animals while neighbors travel', lot: '12', name: 'Jenny L.', createdAt: '2026-03-17T15:00:00Z' },
];

function getCategoryConfig(cat: Category) {
  return CATEGORIES.find((c) => c.id === cat)!;
}

function findMatches(listing: SkillListing, all: SkillListing[]): SkillListing[] {
  const opposite = listing.type === 'offer' ? 'request' : 'offer';
  return all.filter((l) => l.type === opposite && l.category === listing.category && l.id !== listing.id);
}

export default function SkillsExchangePage() {
  const { isConnected } = useAccount();
  const [listings, setListings] = useState<SkillListing[]>(DEMO_LISTINGS);
  const [filterCat, setFilterCat] = useState<Category | null>(null);
  const [filterType, setFilterType] = useState<ListingType | 'all'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<SkillListing | null>(null);
  const [form, setForm] = useState({ type: 'offer' as ListingType, category: 'Tech' as Category, skill: '', description: '' });
  const [myLot] = useState('42');

  useEffect(() => {
    const stored = localStorage.getItem('hoa_skills_listings');
    if (stored) { try { setListings(JSON.parse(stored)); } catch {} }
  }, []);

  const save = (l: SkillListing[]) => {
    setListings(l);
    localStorage.setItem('hoa_skills_listings', JSON.stringify(l));
  };

  const create = () => {
    if (!form.skill.trim()) return;
    const n: SkillListing = {
      id: Date.now().toString(),
      ...form,
      lot: myLot,
      name: `Lot ${myLot}`,
      createdAt: new Date().toISOString(),
    };
    save([n, ...listings]);
    setShowCreate(false);
    setForm({ type: 'offer', category: 'Tech', skill: '', description: '' });
  };

  const remove = (id: string) => save(listings.filter((l) => l.id !== id));

  const filtered = listings.filter((l) => {
    if (filterCat && l.category !== filterCat) return false;
    if (filterType !== 'all' && l.type !== filterType) return false;
    return true;
  });

  const offers = filtered.filter((l) => l.type === 'offer');
  const requests = filtered.filter((l) => l.type === 'request');

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-[var(--text-muted)] mb-4">Sign in to join the skills exchange</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  const ListingCard = ({ listing }: { listing: SkillListing }) => {
    const cfg = getCategoryConfig(listing.category);
    const Icon = cfg.icon;
    const matches = findMatches(listing, listings);
    const isMine = listing.lot === myLot;

    return (
      <div className={`glass-card rounded-xl p-4 border ${listing.type === 'offer' ? 'border-[rgba(42,93,79,0.15)]' : 'border-[rgba(90,122,154,0.15)]'}`}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-start gap-2.5">
            <div className={`p-1.5 rounded-lg ${cfg.bg} border ${cfg.border} shrink-0`}>
              <Icon className={`w-4 h-4 ${cfg.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-heading)]">{listing.skill}</p>
              <p className="text-xs text-[var(--text-disabled)]">{listing.lot === myLot ? 'You' : `Lot #${listing.lot} · ${listing.name}`}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${listing.type === 'offer' ? 'bg-[rgba(58,125,111,0.10)] text-[#3A7D6F]' : 'bg-[var(--steel)]/10 text-[var(--steel)]'}`}>
              {listing.type === 'offer' ? 'CAN HELP' : 'NEEDS HELP'}
            </span>
            {isMine && (
              <button onClick={() => remove(listing.id)} className="p-1 rounded text-[var(--text-disabled)] hover:text-[#8B5A5A] transition-colors">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-1">{listing.description}</p>
        {matches.length > 0 && (
          <button
            onClick={() => setSelectedMatch(listing)}
            className="mt-2 flex items-center gap-1.5 text-xs text-[#B09B71] hover:underline"
          >
            <Handshake className="w-3.5 h-3.5" />
            {matches.length} compatible {listing.type === 'offer' ? 'request' : 'offer'}{matches.length > 1 ? 's' : ''}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-medium gradient-text sm: flex items-center gap-3">
            <Handshake className="w-7 h-7 text-[#B09B71]" />
            Skills Exchange
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Neighbors helping neighbors — share what you know, get what you need</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Listing
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Skills Offered', value: listings.filter((l) => l.type === 'offer').length, color: 'text-[#3A7D6F]' },
          { label: 'Skills Needed', value: listings.filter((l) => l.type === 'request').length, color: 'text-[var(--steel)]' },
          { label: 'Potential Matches', value: listings.filter((l) => findMatches(l, listings).length > 0).length, color: 'text-[#B09B71]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card rounded-xl p-4 text-center">
            <p className={`text-2xl font-medium ${color}`}>{value}</p>
            <p className="text-xs text-[var(--text-disabled)] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        <button
          onClick={() => setFilterCat(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!filterCat ? 'bg-[#B09B71] text-[var(--surface-2)]' : 'glass-card text-[var(--text-muted)] hover:text-[var(--text-heading)]'}`}
        >
          All
        </button>
        {CATEGORIES.map(({ id, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => setFilterCat(filterCat === id ? null : id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterCat === id ? 'bg-[#B09B71] text-[var(--surface-2)]' : 'glass-card text-[var(--text-muted)] hover:text-[var(--text-heading)]'}`}
          >
            <Icon className={`w-3.5 h-3.5 ${filterCat === id ? '' : color}`} />
            {id}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Offers */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#3A7D6F]" />
            <h2 className="text-sm font-medium text-[#3A7D6F] uppercase tracking-wider">I Can Help ({offers.length})</h2>
          </div>
          <div className="space-y-3">
            {offers.map((l) => <ListingCard key={l.id} listing={l} />)}
            {offers.length === 0 && (
              <div className="glass-card rounded-xl p-6 text-center">
                <Users className="w-7 h-7 text-[var(--text-disabled)] mx-auto mb-2" />
                <p className="text-xs text-[var(--text-muted)]">No offers in this category yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Requests */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[var(--steel)]" />
            <h2 className="text-sm font-medium text-[var(--steel)] uppercase tracking-wider">I Need Help ({requests.length})</h2>
          </div>
          <div className="space-y-3">
            {requests.map((l) => <ListingCard key={l.id} listing={l} />)}
            {requests.length === 0 && (
              <div className="glass-card rounded-xl p-6 text-center">
                <Users className="w-7 h-7 text-[var(--text-disabled)] mx-auto mb-2" />
                <p className="text-xs text-[var(--text-muted)]">No requests in this category yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Match Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="glass-card rounded-xl p-6 w-full max-w-md border border-[rgba(176,155,113,0.20)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium">Compatible {selectedMatch.type === 'offer' ? 'Requests' : 'Offers'}</h2>
              <button onClick={() => setSelectedMatch(null)} className="p-1 rounded text-[var(--text-disabled)] hover:text-[var(--text-heading)]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {findMatches(selectedMatch, listings).map((m) => {
                const cfg = getCategoryConfig(m.category);
                const Icon = cfg.icon;
                return (
                  <div key={m.id} className="p-3 rounded-xl bg-[var(--surface-2)] border border-[rgba(245,240,232,0.10)]">
                    <div className="flex items-start gap-2.5">
                      <div className={`p-1.5 rounded-lg ${cfg.bg} border ${cfg.border}`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-heading)]">{m.skill}</p>
                        <p className="text-xs text-[var(--text-muted)]">Lot #{m.lot} · {m.name}</p>
                        <p className="text-xs text-[var(--text-disabled)] mt-1">{m.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-[var(--text-disabled)] mt-4 text-center">Connect through the Directory or Community forum</p>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="glass-card rounded-xl p-6 w-full max-w-md border border-[rgba(176,155,113,0.20)]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-medium">Add Skills Listing</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded text-[var(--text-disabled)] hover:text-[var(--text-heading)]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-2 block">I want to...</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['offer', 'request'] as ListingType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm((f) => ({ ...f, type: t }))}
                      className={`py-2 rounded-lg text-sm font-medium transition-colors ${form.type === t ? 'bg-[#B09B71] text-[var(--surface-2)]' : 'glass-card text-[var(--text-muted)] hover:text-[var(--text-heading)]'}`}
                    >
                      {t === 'offer' ? ' Offer Help' : ' Request Help'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-2 block">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map(({ id, icon: Icon, color }) => (
                    <button
                      key={id}
                      onClick={() => setForm((f) => ({ ...f, category: id }))}
                      className={`flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-medium transition-colors ${form.category === id ? 'bg-[#B09B71] text-[var(--surface-2)]' : 'glass-card text-[var(--text-muted)] hover:text-[var(--text-heading)]'}`}
                    >
                      <Icon className={`w-4 h-4 ${form.category === id ? '' : color}`} />
                      {id}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Skill / Service</label>
                <input
                  value={form.skill}
                  onChange={(e) => setForm((f) => ({ ...f, skill: e.target.value }))}
                  placeholder="e.g. Smart Home Setup"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[rgba(245,240,232,0.10)] text-sm text-[var(--text-heading)] placeholder-[rgba(245,240,232,0.20)] focus:border-[rgba(176,155,113,0.50)] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Briefly describe what you can help with or what you need..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[rgba(245,240,232,0.10)] text-sm text-[var(--text-heading)] placeholder-[rgba(245,240,232,0.20)] focus:border-[rgba(176,155,113,0.50)] focus:outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 rounded-lg border border-[rgba(245,240,232,0.10)] text-sm text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors">Cancel</button>
              <button onClick={create} className="flex-1 px-4 py-2 rounded-lg bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] text-sm font-medium transition-colors">Post Listing</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
