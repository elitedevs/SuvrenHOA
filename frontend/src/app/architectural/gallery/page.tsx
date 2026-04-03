'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { ChevronLeft, X } from 'lucide-react';

interface GalleryItem {
  id: string;
  title: string;
  description: string;
  details: string;
  approved: boolean;
  colors?: string[];
}

interface GalleryCategory {
  id: string;
  name: string;
  emoji: string;
  items: GalleryItem[];
}

const GALLERY_CATEGORIES: GalleryCategory[] = [
  {
    id: 'fences',
    name: 'Fence Styles',
    emoji: '',
    items: [
      {
        id: 'fence-1',
        title: 'Wood Privacy Fence',
        description: 'Standard approved privacy fence — 6ft max height',
        details: 'Vertical boards, natural or stained wood only. Cedar or pine preferred. No lattice tops on front yard fences.',
        approved: true,
      },
      {
        id: 'fence-2',
        title: 'Aluminum Picket Fence',
        description: 'Classic aluminum picket — 4ft max, front yard only',
        details: 'Black or white aluminum only. Picket spacing must not exceed 4 inches. Galvanized prohibited.',
        approved: true,
      },
      {
        id: 'fence-3',
        title: 'Split Rail Fence',
        description: 'Rustic split rail — decorative only, not privacy',
        details: 'Natural cedar wood only. Maximum 2 rails. Not suitable as pet containment.',
        approved: true,
      },
      {
        id: 'fence-4',
        title: 'Chain Link Fence',
        description: 'Chain link — backyard only, must be coated',
        details: 'Black or dark green vinyl-coated chain link only. Not permitted in front yard or side yards visible from street.',
        approved: true,
      },
      {
        id: 'fence-5',
        title: 'Corrugated Metal / Wood Pallet',
        description: 'Not approved — aesthetic violation',
        details: 'Corrugated metal panels, wood pallets, and temporary fencing materials are not approved for permanent installation.',
        approved: false,
      },
    ],
  },
  {
    id: 'paint',
    name: 'Paint Colors',
    emoji: '',
    items: [
      {
        id: 'paint-1',
        title: 'Exterior Body Colors',
        description: 'Approved color families for main exterior body',
        details: 'Earth tones, warm whites, grays, and muted blues/greens. Saturated or neon colors require board approval.',
        approved: true,
        colors: ['#D4C5A9', '#C4B59B', '#A8896C', '#8B7355', '#6B5E4B'],
      },
      {
        id: 'paint-2',
        title: 'Trim & Accent Colors',
        description: 'Approved trim and accent colors',
        details: 'Contrasting whites, creams, or dark tones that complement the body color. Trim must be distinct from body.',
        approved: true,
        colors: ['#FFFFFF', '#F5F5F0', '#1A1A1A', '#2C2C2C', '#4A4A4A'],
      },
      {
        id: 'paint-3',
        title: 'Door Colors',
        description: 'Front door accent colors — more latitude given',
        details: 'Bold door colors are permitted as accent. Deep red, navy, forest green, and black are popular choices.',
        approved: true,
        colors: ['#8B1A1A', '#1B2A4A', '#2D4A2D', '#1A1A1A', '#8B6914'],
      },
      {
        id: 'paint-4',
        title: 'Prohibited Colors',
        description: 'Colors that require board pre-approval',
        details: 'Bright/neon yellows, oranges, reds, and purples. Hot pink, lime green, or any "theme park" palette.',
        approved: false,
        colors: ['#FF0000', '#FF6600', '#FFFF00', '#FF00FF', '#00FF00'],
      },
    ],
  },
  {
    id: 'landscaping',
    name: 'Landscaping',
    emoji: '',
    items: [
      {
        id: 'land-1',
        title: 'Foundation Plantings',
        description: 'Approved shrubs and plants for house foundation',
        details: 'Boxwood, azalea, holly, and ornamental grasses are popular choices. Plants should not exceed 1st floor window height at maturity.',
        approved: true,
      },
      {
        id: 'land-2',
        title: 'Lawn Standards',
        description: 'Grass height and maintenance requirements',
        details: 'Lawn must be maintained below 6 inches. Edging along walkways and driveways required. No bare/dead patches exceeding 10% of lawn area.',
        approved: true,
      },
      {
        id: 'land-3',
        title: 'Mulch & Edging',
        description: 'Approved mulch types and edging materials',
        details: 'Natural wood mulch (brown, black, or red). Rubber mulch and white rock not recommended. Metal or plastic edging to contain beds.',
        approved: true,
      },
      {
        id: 'land-4',
        title: 'Raised Garden Beds',
        description: 'Vegetable gardens — backyard only',
        details: 'Raised beds in rear yard only. Maximum 4 raised beds per property. Must be maintained and weed-free. No raised beds in front or side yards.',
        approved: true,
      },
      {
        id: 'land-5',
        title: 'Prohibited Landscaping',
        description: 'Not approved without board variance',
        details: 'Artificial turf in front yard, decorative rocks as primary lawn cover, large vehicle storage visible from street, and unsecured compost piles.',
        approved: false,
      },
    ],
  },
  {
    id: 'structures',
    name: 'Structures',
    emoji: '',
    items: [
      {
        id: 'struct-1',
        title: 'Sheds & Storage',
        description: 'Utility sheds — rear yard, max 120 sq ft',
        details: 'Must match home exterior color. Setback minimum 5ft from property line. Permit required for structures over 80 sq ft. No front yard placement.',
        approved: true,
      },
      {
        id: 'struct-2',
        title: 'Decks & Patios',
        description: 'Decks and patios — requires architectural review',
        details: 'Must obtain architectural review approval before construction. Materials must complement home exterior. Elevated decks require city permit.',
        approved: true,
      },
      {
        id: 'struct-3',
        title: 'Playsets & Trampolines',
        description: 'Outdoor play equipment — rear yard preferred',
        details: 'Rear yard placement required. Side yard permitted if not visible from street. Must be maintained in good condition. Tarps not acceptable for covering.',
        approved: true,
      },
    ],
  },
];

function ColorSwatch({ color }: { color: string }) {
  return (
    <div
      className="w-8 h-8 rounded-lg border border-[rgba(245,240,232,0.10)] shadow"
      style={{ background: color }}
      title={color}
    />
  );
}

function GalleryCard({ item, onClick }: { item: GalleryItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`glass-card rounded-xl p-4 text-left w-full hover:border-[#B09B71]/30 border transition-all group ${
        item.approved ? 'border-[rgba(245,240,232,0.08)]' : 'border-[rgba(107,58,58,0.20)]'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-[var(--parchment)] group-hover:text-[#D4C4A0] transition-colors leading-tight">
          {item.title}
        </h4>
        <span className={`shrink-0 ml-2 text-[10px] font-medium px-2 py-0.5 rounded-full ${
          item.approved
            ? 'bg-[rgba(42,93,79,0.15)] text-[#3A7D6F] border border-[rgba(42,93,79,0.25)]'
            : 'bg-[rgba(107,58,58,0.12)] text-[#8B5A5A] border border-[rgba(139,90,90,0.25)]'
        }`}>
          {item.approved ? ' Approved' : ' Not Approved'}
        </span>
      </div>
      <p className="text-xs text-[var(--text-disabled)] leading-relaxed mb-3">{item.description}</p>
      {item.colors && (
        <div className="flex gap-1.5 flex-wrap">
          {item.colors.map(c => <ColorSwatch key={c} color={c} />)}
        </div>
      )}
      {!item.colors && (
        <div className={`h-16 rounded-lg flex items-center justify-center text-2xl ${
          item.approved ? 'bg-[#B09B71]/5 border border-[#B09B71]/10' : 'bg-[#8B5A5A]/5 border border-[rgba(139,90,90,0.10)]'
        }`}>
          {item.approved ? '' : ''}
        </div>
      )}
    </button>
  );
}

function ItemDetailModal({ item, onClose }: { item: GalleryItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="bg-[var(--surface-1)] border border-[#B09B71]/25 rounded-xl p-6 w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-medium text-[#D4C4A0]">{item.title}</h3>
          <button onClick={onClose} className="p-1.5 text-[var(--text-disabled)] hover:text-[var(--text-body)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full mb-4 ${
          item.approved
            ? 'bg-[rgba(42,93,79,0.15)] text-[#3A7D6F] border border-[rgba(42,93,79,0.25)]'
            : 'bg-[rgba(107,58,58,0.12)] text-[#8B5A5A] border border-[rgba(139,90,90,0.25)]'
        }`}>
          {item.approved ? ' Board Approved' : ' Requires Board Variance'}
        </div>

        {item.colors && (
          <div className="mb-4">
            <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-2">Color Examples</p>
            <div className="flex gap-2 flex-wrap">
              {item.colors.map(c => (
                <div key={c} className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-lg border border-[rgba(245,240,232,0.10)]" style={{ background: c }} />
                  <code className="text-[9px] text-[var(--text-disabled)]">{c}</code>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-4">{item.details}</p>

        <div className="pt-4 border-t border-[rgba(245,240,232,0.06)]">
          <p className="text-xs text-[var(--text-disabled)]">
            Need to submit for approval?{' '}
            <Link href="/architectural" className="text-[#B09B71] hover:text-[#D4C4A0]">
              Submit Architectural Review →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ArchitecturalGalleryPage() {
  const { isConnected } = useAccount();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-[var(--text-muted)] mb-4">Sign in to view architectural standards</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  const categories = activeCategory === 'all'
    ? GALLERY_CATEGORIES
    : GALLERY_CATEGORIES.filter(c => c.id === activeCategory);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 page-enter">
      {/* Header */}
      <div className="mb-8">
        <Link href="/architectural" className="flex items-center gap-1 text-xs text-[var(--text-disabled)] hover:text-[#B09B71] mb-4 transition-colors">
          <ChevronLeft className="w-3 h-3" /> Back to Arch Review
        </Link>
        <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-1">Standards Reference</p>
        <h1 className="text-3xl sm:text-4xl font-medium gradient-text">Architectural Standards Gallery</h1>
        <p className="text-[var(--text-muted)] text-sm mt-2">
          Visual guide to approved styles — review before submitting an architectural request
        </p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            activeCategory === 'all'
              ? 'bg-[#B09B71]/20 border border-[#B09B71]/40 text-[#D4C4A0]'
              : 'bg-[rgba(245,240,232,0.05)] border border-[rgba(245,240,232,0.08)] text-[var(--text-disabled)] hover:text-[var(--text-body)]'
          }`}
        >
          All
        </button>
        {GALLERY_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeCategory === cat.id
                ? 'bg-[#B09B71]/20 border border-[#B09B71]/40 text-[#D4C4A0]'
                : 'bg-[rgba(245,240,232,0.05)] border border-[rgba(245,240,232,0.08)] text-[var(--text-disabled)] hover:text-[var(--text-body)]'
            }`}
          >
            {cat.emoji} {cat.name}
          </button>
        ))}
      </div>

      {/* Categories */}
      {categories.map(category => (
        <div key={category.id} className="mb-10">
          <h2 className="flex items-center gap-2 text-base font-medium text-[#D4C4A0] mb-4">
            <span>{category.emoji}</span>
            {category.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.items.map(item => (
              <GalleryCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />
            ))}
          </div>
        </div>
      ))}

      {/* CTA */}
      <div className="mt-6 glass-card rounded-xl p-6 border border-[#B09B71]/15 text-center">
        <p className="text-sm font-medium text-[#D4C4A0] mb-2">Ready to make changes to your property?</p>
        <p className="text-xs text-[var(--text-disabled)] mb-4">Submit an architectural review request — board responds within 30 days</p>
        <Link
          href="/architectural"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--brass-deep)] to-[#B09B71] text-[var(--surface-2)] font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Submit Architectural Review
        </Link>
      </div>

      {selectedItem && <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
    </div>
  );
}
