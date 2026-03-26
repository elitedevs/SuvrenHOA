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
      <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide shrink-0 mr-1">
        Properties ({properties.length})
      </span>
      {properties.map((prop, i) => (
        <button
          key={prop.tokenId}
          onClick={() => onSelect(i)}
          className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[40px] ${
            i === selectedIndex
              ? 'bg-[#c9a96e]/25 border border-[#c9a96e]/40 text-[#e8d5a3] shadow-sm shadow-[#c9a96e]/8'
              : 'bg-gray-800/40 border border-gray-700/40 text-gray-400 hover:bg-gray-800/60 hover:text-gray-300'
          }`}
        >
          <span className="mr-1.5">🏠</span>
          Lot #{prop.lotNumber}
          {prop.streetAddress && (
            <span className="ml-2 text-xs text-gray-500 font-normal hidden sm:inline">
              {prop.streetAddress.split(',')[0]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
