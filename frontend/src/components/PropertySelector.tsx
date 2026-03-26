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
      <span className="text-xs tracking-widest uppercase text-[rgba(245,240,232,0.35)] shrink-0 mr-1">
        Properties ({properties.length})
      </span>
      {properties.map((prop, i) => (
        <button
          key={prop.tokenId}
          onClick={() => onSelect(i)}
          className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[40px] ${
            i === selectedIndex
              ? 'bg-[#B09B71]/25 border border-[#B09B71]/40 text-[#D4C4A0] shadow-sm shadow-[#B09B71]/8'
              : 'bg-gray-800/40 border border-gray-700/40 text-[rgba(245,240,232,0.50)] hover:bg-gray-800/60 hover:text-[rgba(245,240,232,0.65)]'
          }`}
        >
          <span className="mr-1.5"></span>
          Lot #{prop.lotNumber}
          {prop.streetAddress && (
            <span className="ml-2 text-xs text-[rgba(245,240,232,0.35)] font-normal hidden sm:inline">
              {prop.streetAddress.split(',')[0]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
