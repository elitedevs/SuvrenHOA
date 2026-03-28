'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useMarketplace, MarketplaceCategory, MarketplaceType } from '@/hooks/useMarketplace';
import Link from 'next/link';
import { Plus, X, Tag, ShoppingBag, Megaphone } from 'lucide-react';

const CATEGORIES: MarketplaceCategory[] = ['Furniture', 'Electronics', 'Garden', 'Kids', 'Other'];
const TYPES: { value: MarketplaceType; label: string; emoji: string }[] = [
  { value: 'sale', label: 'For Sale', emoji: '' },
  { value: 'free', label: 'Free', emoji: '' },
  { value: 'wanted', label: 'Wanted', emoji: '' },
];

const CATEGORY_EMOJI: Record<MarketplaceCategory, string> = {
  Furniture: '',
  Electronics: '',
  Garden: '',
  Kids: '',
  Other: '',
};

function TypeBadge({ type }: { type: MarketplaceType }) {
  const styles: Record<MarketplaceType, string> = {
    sale: 'bg-[#B09B71]/15 text-[#B09B71] border-[#B09B71]/25',
    free: 'bg-[rgba(42,93,79,0.15)] text-[#3A7D6F] border-[rgba(42,93,79,0.25)]',
    wanted: 'bg-[rgba(90,122,154,0.12)] text-[var(--steel)] border-[rgba(90,122,154,0.25)]',
  };
  const labels: Record<MarketplaceType, string> = {
    sale: ' For Sale',
    free: ' Free',
    wanted: ' Wanted',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${styles[type]}`}>
      {labels[type]}
    </span>
  );
}

function NewListingModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: any) => void }) {
  const [form, setForm] = useState({
    type: 'sale' as MarketplaceType,
    title: '',
    description: '',
    price: '',
    category: 'Other' as MarketplaceCategory,
  });
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    onSubmit({
      ...form,
      price: form.type === 'sale' && form.price ? parseFloat(form.price) : null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[var(--surface-1)] border border-[#B09B71]/25 rounded-xl p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-[#D4C4A0]">New Listing</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-disabled)] hover:text-[var(--text-body)] hover:bg-[rgba(245,240,232,0.05)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div>
            <label className="text-xs tracking-widest uppercase text-[var(--text-disabled)] block mb-2">Type</label>
            <div className="flex gap-2">
              {TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: t.value }))}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                    form.type === t.value
                      ? 'bg-[#B09B71]/20 border-[#B09B71]/50 text-[#D4C4A0]'
                      : 'border-[rgba(245,240,232,0.08)] text-[var(--text-disabled)] hover:border-[rgba(245,240,232,0.10)]'
                  }`}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs tracking-widest uppercase text-[var(--text-disabled)] block mb-1.5">Title</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="What are you listing?"
              className="w-full px-3 py-2 rounded-xl bg-[rgba(245,240,232,0.05)] border border-[rgba(245,240,232,0.08)] focus:border-[#B09B71]/50 focus:outline-none text-sm text-[var(--parchment)] placeholder-[rgba(245,240,232,0.20)]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs tracking-widest uppercase text-[var(--text-disabled)] block mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe the item, condition, pickup details..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-[rgba(245,240,232,0.05)] border border-[rgba(245,240,232,0.08)] focus:border-[#B09B71]/50 focus:outline-none text-sm text-[var(--parchment)] placeholder-[rgba(245,240,232,0.20)] resize-none"
            />
          </div>

          {/* Price + Category */}
          <div className="grid grid-cols-2 gap-3">
            {form.type === 'sale' && (
              <div>
                <label className="text-xs tracking-widest uppercase text-[var(--text-disabled)] block mb-1.5">Price ($)</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="0.00"
                  min="0"
                  className="w-full px-3 py-2 rounded-xl bg-[rgba(245,240,232,0.05)] border border-[rgba(245,240,232,0.08)] focus:border-[#B09B71]/50 focus:outline-none text-sm text-[var(--parchment)] placeholder-[rgba(245,240,232,0.20)]"
                />
              </div>
            )}
            <div className={form.type === 'sale' ? '' : 'col-span-2'}>
              <label className="text-xs tracking-widest uppercase text-[var(--text-disabled)] block mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as MarketplaceCategory }))}
                className="w-full px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[rgba(245,240,232,0.08)] focus:border-[#B09B71]/50 focus:outline-none text-sm text-[var(--parchment)]"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>)}
              </select>
            </div>
          </div>

          {error && <p className="text-xs text-[#8B5A5A]">{error}</p>}

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[var(--brass-deep)] to-[#B09B71] text-[var(--surface-2)] font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Post Listing
          </button>
        </form>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const { isConnected } = useAccount();
  const { listings, addListing, removeListing, address } = useMarketplace();
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState<MarketplaceType | 'all'>('all');
  const [filterCat, setFilterCat] = useState<MarketplaceCategory | 'all'>('all');

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-[var(--text-muted)] mb-4">Sign in to access the marketplace</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  function handleSubmit(data: any) {
    addListing(data);
    setShowModal(false);
  }

  const filtered = listings.filter(l => {
    if (filterType !== 'all' && l.type !== filterType) return false;
    if (filterCat !== 'all' && l.category !== filterCat) return false;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 page-enter">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-1">Community</p>
          <h1 className="text-3xl font-normal tracking-tight">Marketplace</h1>
          <p className="text-[var(--text-muted)] text-sm mt-2">Buy, sell, or give away items within Faircroft</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--brass-deep)] to-[#B09B71] text-[var(--surface-2)] font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> New Listing
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="flex items-center gap-1 bg-[rgba(245,240,232,0.05)] rounded-xl p-1">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterType === 'all' ? 'bg-[#B09B71]/20 text-[#D4C4A0]' : 'text-[var(--text-disabled)] hover:text-[var(--text-body)]'}`}
          >
            All
          </button>
          {TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setFilterType(t.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterType === t.value ? 'bg-[#B09B71]/20 text-[#D4C4A0]' : 'text-[var(--text-disabled)] hover:text-[var(--text-body)]'}`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value as any)}
          className="px-3 py-2 rounded-xl bg-[rgba(245,240,232,0.05)] border border-[rgba(245,240,232,0.08)] text-xs text-[var(--text-muted)] focus:outline-none focus:border-[#B09B71]/40"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>)}
        </select>
      </div>

      {/* Listings */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag className="w-12 h-12 text-[var(--text-disabled)] mx-auto mb-4" />
          <p className="text-[var(--text-disabled)] font-medium">No listings yet</p>
          <p className="text-[var(--text-disabled)] text-sm mt-1">Be the first to post something!</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-[#B09B71]/15 border border-[#B09B71]/25 text-[#B09B71] text-sm font-medium hover:bg-[#B09B71]/25 transition-colors"
          >
            + Create Listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(listing => (
            <div key={listing.id} className="glass-card rounded-xl p-5 border border-[oklch(0.20_0.005_60)] hover:border-[#B09B71]/25 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <TypeBadge type={listing.type} />
                {listing.postedBy.toLowerCase() === address?.toLowerCase() && (
                  <button
                    onClick={() => removeListing(listing.id)}
                    className="p-1 rounded text-[var(--text-disabled)] hover:text-[#8B5A5A] transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <h3 className="font-medium text-sm text-[var(--parchment)] mb-1 leading-tight">{listing.title}</h3>
              {listing.description && (
                <p className="text-xs text-[var(--text-disabled)] mb-3 leading-relaxed line-clamp-3">{listing.description}</p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{CATEGORY_EMOJI[listing.category]}</span>
                  <span className="text-xs text-[var(--text-disabled)]">{listing.category}</span>
                </div>
                {listing.type === 'sale' && listing.price !== null && (
                  <span className="text-sm font-normal text-[#B09B71]">${listing.price.toLocaleString()}</span>
                )}
                {listing.type === 'free' && (
                  <span className="text-sm font-medium text-[#3A7D6F]">FREE</span>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-[oklch(0.15_0.005_60)] flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-disabled)]">
                  Lot #{listing.lotNumber ?? '?'}
                </span>
                <Link
                  href="/messages"
                  className="text-[11px] text-[#B09B71] hover:text-[#D4C4A0] font-medium transition-colors"
                >
                  Contact →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <NewListingModal onClose={() => setShowModal(false)} onSubmit={handleSubmit} />}
    </div>
  );
}
