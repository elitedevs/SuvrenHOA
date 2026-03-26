'use client';

import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Users } from 'lucide-react';

interface SpotlightEntry {
  id: string;
  lot: string;
  name: string;
  funFact: string;
  contribution: string;
  weekOf: string;
}

const DEFAULT_SPOTLIGHTS: SpotlightEntry[] = [
  {
    id: '1',
    lot: '42',
    name: 'The Martinez Family',
    funFact: 'Have lived in Faircroft for 12 years — longer than anyone!',
    contribution: 'Organized the spring block party that brought 60 neighbors together',
    weekOf: '2026-03-23',
  },
  {
    id: '2',
    lot: '17',
    name: 'Eleanor Whitfield',
    funFact: 'Former landscape architect with 30 years of experience',
    contribution: 'Redesigned the community entrance garden pro bono',
    weekOf: '2026-03-16',
  },
  {
    id: '3',
    lot: '88',
    name: 'The Okonkwo Family',
    funFact: 'Speak four languages between them',
    contribution: 'Started the community tool-lending library in their garage',
    weekOf: '2026-03-09',
  },
];

function getWeekKey(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${week}`;
}

export function ResidentSpotlight() {
  const [spotlights, setSpotlights] = useState<SpotlightEntry[]>(DEFAULT_SPOTLIGHTS);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem('hoa_resident_spotlights');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) setSpotlights(parsed);
      } catch {}
    }
    // Auto-select spotlight for current week
    const weekKey = getWeekKey();
    const stored2 = localStorage.getItem('hoa_spotlight_weekidx');
    if (stored2) {
      try {
        const { week, idx } = JSON.parse(stored2);
        if (week === weekKey) setCurrentIdx(idx);
      } catch {}
    }
  }, []);

  const current = spotlights[currentIdx] ?? spotlights[0];
  if (!current) return null;

  const prev = () => setCurrentIdx((i) => (i - 1 + spotlights.length) % spotlights.length);
  const next = () => setCurrentIdx((i) => (i + 1) % spotlights.length);

  return (
    <div className="glass-card rounded-2xl p-5 border border-[#c9a96e]/20 relative overflow-hidden">
      {/* Glow accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#c9a96e]/5 blur-2xl rounded-full pointer-events-none" />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#c9a96e]/15">
            <Star className="w-4 h-4 text-[#c9a96e]" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#c9a96e]">Resident Spotlight</span>
        </div>
        {spotlights.length > 1 && (
          <div className="flex items-center gap-1">
            <button onClick={prev} className="p-1 rounded-md text-gray-500 hover:text-[#c9a96e] transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-500">{currentIdx + 1}/{spotlights.length}</span>
            <button onClick={next} className="p-1 rounded-md text-gray-500 hover:text-[#c9a96e] transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#c9a96e]/30 to-[#b8942e]/20 border border-[#c9a96e]/30 flex items-center justify-center shrink-0">
          <Users className="w-6 h-6 text-[#c9a96e]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-white text-sm">{current.name}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#c9a96e]/15 text-[#c9a96e] font-medium border border-[#c9a96e]/20">
              Lot #{current.lot}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1 italic">"{current.funFact}"</p>
          <div className="mt-2 p-2.5 rounded-lg bg-[#1a1a1a]/60 border border-[#c9a96e]/10">
            <p className="text-xs text-gray-300">
              <span className="text-[#c9a96e] font-medium">Community contribution: </span>
              {current.contribution}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {spotlights.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIdx(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIdx ? 'bg-[#c9a96e] w-4' : 'bg-gray-600 hover:bg-gray-400'}`}
          />
        ))}
      </div>
    </div>
  );
}
