'use client';

import { PropertyData } from '@/hooks/useProperty';

interface PropertySelectorProps {
  properties: PropertyData[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

/**
 * Property switcher — shown when a wallet holds multiple property NFTs.
 * Renders as a horizontal pill bar for quick switching.
 */
export function PropertySelector({ properties, selectedIndex, onSelect }: PropertySelectorProps) {
  if (properties.length <= 1) return null;

  return (
    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
      <span className="text-xs tracking-widest uppercase text-[var(--text-disabled)] shrink-0 mr-1">
        Properties ({properties.length})
      </span>
      {properties.map((prop, i) => (
        <button
          key={prop.tokenId}
          onClick={() => onSelect(i)}
          className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 min-h-[40px] ${
            i === selectedIndex
              ? 'bg-[rgba(176,155,113,0.25)] border border-[rgba(176,155,113,0.40)] text-[#D4C4A0] shadow-sm shadow-[rgba(176,155,113,0.08)]'
              : 'bg-[rgba(26,26,30,0.40)] border border-[rgba(245,240,232,0.06)] text-[var(--text-muted)] hover:bg-[rgba(245,240,232,0.06)] hover:text-[var(--text-body)]'
          }`}
        >
          Lot #{prop.lotNumber}
          {prop.streetAddress && (
            <span className="ml-2 text-xs text-[var(--text-disabled)] font-normal hidden sm:inline">
              {prop.streetAddress.split(',')[0]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
