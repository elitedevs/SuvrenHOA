'use client';

import { useState, useEffect } from 'react';
import { Sprout, Info, Calendar, Plus, X } from 'lucide-react';

interface Plot {
  id: string;
  row: number;
  col: number;
  status: 'available' | 'planted' | 'reserved';
  owner?: string;
  planted?: string;
  nextHarvest?: string;
  notes?: string;
}

function generatePlots(): Plot[] {
  const plots: Plot[] = [];
  const statuses: Plot['status'][] = ['available', 'planted', 'planted', 'reserved'];
  const plants = ['Tomatoes', 'Basil', 'Zucchini', 'Peppers', 'Herbs', 'Lettuce', 'Strawberries', 'Carrots'];
  const lots = ['12', '7', '9', '4', '14', '16', '5', '11'];
  let idx = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const status = statuses[idx % statuses.length];
      plots.push({
        id: `${r}-${c}`,
        row: r,
        col: c,
        status,
        owner: status !== 'available' ? `Lot ${lots[idx % lots.length]}` : undefined,
        planted: status === 'planted' ? plants[idx % plants.length] : undefined,
        nextHarvest: status === 'planted' ? `2026-0${(idx % 6) + 4}-${(idx % 20) + 1}`.replace('-0', '-') : undefined,
        notes: status === 'reserved' ? 'Reserved — awaiting confirmation' : undefined,
      });
      idx++;
    }
  }
  return plots;
}

const SEASONAL_TIPS: Record<string, string[]> = {
  Spring: ['Plant tomatoes, peppers after last frost', 'Start basil indoors', 'Direct sow carrots and lettuce'],
  Summer: ['Water deeply 2x/week', 'Harvest zucchini before overgrown', 'Watch for pests on tomatoes'],
  Fall: ['Plant cool-weather crops: kale, broccoli', 'Clear summer annuals', 'Prepare beds with compost'],
  Winter: ['Plan next year\'s layout', 'Order seeds early', 'Protect perennials with mulch'],
};

export default function GardenPage() {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [selected, setSelected] = useState<Plot | null>(null);
  const [showReserve, setShowReserve] = useState(false);
  const [reserveName, setReserveName] = useState('');
  const [reserveLot, setReserveLot] = useState('');
  const [season] = useState<'Spring' | 'Summer' | 'Fall' | 'Winter'>('Spring');

  useEffect(() => {
    const stored = localStorage.getItem('garden-plots');
    if (stored) setPlots(JSON.parse(stored));
    else setPlots(generatePlots());
  }, []);

  const handleReserve = () => {
    if (!selected || !reserveLot) return;
    const updated = plots.map(p =>
      p.id === selected.id ? { ...p, status: 'reserved' as const, owner: `Lot ${reserveLot}`, notes: `Reserved by ${reserveName || 'Resident'}, Lot ${reserveLot}` } : p
    );
    setPlots(updated);
    localStorage.setItem('garden-plots', JSON.stringify(updated));
    setShowReserve(false);
    setSelected(null);
    setReserveName('');
    setReserveLot('');
  };

  const plotColor = (status: Plot['status']) => {
    if (status === 'planted') return 'bg-[#2A5D4F] hover:bg-[#2A5D4F] border-[rgba(42,93,79,0.30)]';
    if (status === 'reserved') return 'bg-[var(--brass-deep)] hover:bg-[#B09B71] border-[#8A7A5A]';
    return 'bg-[rgba(176,155,113,0.12)] hover:bg-[rgba(176,155,113,0.18)] border-[rgba(176,155,113,0.20)]';
  };

  const stats = plots.length
    ? {
        available: plots.filter(p => p.status === 'available').length,
        planted: plots.filter(p => p.status === 'planted').length,
        reserved: plots.filter(p => p.status === 'reserved').length,
      }
    : { available: 0, planted: 0, reserved: 0 };

  return (
    <div className="min-h-screen bg-[var(--obsidian)] p-6 lg:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-medium gradient-text text-[#D4C4A0] mb-2 flex items-center gap-3">
              <Sprout className="w-8 h-8 text-[#2A5D4F]" /> Community Garden
            </h1>
            <p className="text-[rgba(245,240,232,0.45)]">8×8 shared garden — click a plot to view details or reserve</p>
          </div>
          <div className="flex gap-3 text-xs">
            {[
              { label: 'Available', color: 'bg-[rgba(176,155,113,0.12)]', val: stats.available },
              { label: 'Planted', color: 'bg-[#2A5D4F]', val: stats.planted },
              { label: 'Reserved', color: 'bg-[var(--brass-deep)]', val: stats.reserved },
            ].map(({ label, color, val }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-sm ${color}`} />
                <span className="text-[var(--text-body)]">{label} ({val})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Garden grid */}
          <div className="xl:col-span-2">
            <div className="bg-[#1A1A1E] border border-[rgba(245,240,232,0.06)] rounded-xl p-6">
              <div className="grid grid-cols-8 gap-2">
                {plots.map((plot) => (
                  <button
                    key={plot.id}
                    onClick={() => setSelected(plot)}
                    title={`Plot ${plot.row + 1}-${plot.col + 1}: ${plot.status}`}
                    className={`aspect-square rounded-md border-2 transition-all duration-150 ${plotColor(plot.status)} ${selected?.id === plot.id ? 'ring-2 ring-white ring-offset-1 ring-offset-[#1A1A1E]' : ''}`}
                  />
                ))}
              </div>
              <div className="mt-4 text-xs text-[rgba(245,240,232,0.25)] text-center">Row A–H × Column 1–8 • 64 total plots</div>
            </div>
          </div>

          {/* Right panel */}
          <div className="space-y-4">
            {/* Selected plot detail */}
            {selected ? (
              <div className="bg-[#1A1A1E] border border-[rgba(245,240,232,0.06)] rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-[#D4C4A0]">
                    Plot {String.fromCharCode(65 + selected.row)}{selected.col + 1}
                  </h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    selected.status === 'planted' ? 'bg-[rgba(42,93,79,0.40)] text-[#2A5D4F]'
                    : selected.status === 'reserved' ? 'bg-[rgba(176,155,113,0.20)] text-[#B09B71]'
                    : 'bg-[rgba(245,240,232,0.06)] text-[var(--text-body)]'
                  }`}>{selected.status}</span>
                </div>
                <div className="space-y-2 text-sm">
                  {selected.owner && <div className="flex justify-between"><span className="text-[var(--text-muted)]">Owner</span><span className="text-[#D4C4A0]">{selected.owner}</span></div>}
                  {selected.planted && <div className="flex justify-between"><span className="text-[var(--text-muted)]">Growing</span><span className="text-[#D4C4A0]">{selected.planted}</span></div>}
                  {selected.nextHarvest && <div className="flex justify-between"><span className="text-[var(--text-muted)]">Next Harvest</span><span className="text-[#D4C4A0]">{selected.nextHarvest}</span></div>}
                  {selected.notes && <p className="text-xs text-[rgba(245,240,232,0.45)] italic mt-2">{selected.notes}</p>}
                  {selected.status === 'available' && (
                    <button
                      onClick={() => setShowReserve(true)}
                      className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[var(--brass-deep)] text-[var(--surface-2)] font-medium text-sm hover:bg-[#B09B71] transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Reserve This Plot
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#1A1A1E] border border-[rgba(245,240,232,0.06)] rounded-xl p-5 text-center">
                <Info className="w-8 h-8 text-[var(--text-disabled)] mx-auto mb-2" />
                <p className="text-sm text-[var(--text-muted)]">Click a plot to view details</p>
              </div>
            )}

            {/* Seasonal calendar */}
            <div className="bg-[#1A1A1E] border border-[rgba(245,240,232,0.06)] rounded-xl p-5">
              <h3 className="font-medium text-[#D4C4A0] mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#B09B71]" /> {season} Planting Tips
              </h3>
              <ul className="space-y-2">
                {SEASONAL_TIPS[season].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[var(--text-body)]">
                    <span className="text-[#2A5D4F] shrink-0"></span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Reserve modal */}
      {showReserve && selected && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1A1E] border border-[rgba(245,240,232,0.10)] rounded-xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-[#D4C4A0]">Reserve Plot {String.fromCharCode(65 + selected.row)}{selected.col + 1}</h3>
              <button onClick={() => setShowReserve(false)}><X className="w-4 h-4 text-[var(--text-muted)]" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Your Name</label>
                <input value={reserveName} onChange={e => setReserveName(e.target.value)} placeholder="Jane Smith" className="w-full bg-[#222228] border border-[rgba(245,240,232,0.12)] rounded-lg px-3 py-2 text-sm text-[#D4C4A0] focus:outline-none focus:border-[#B09B71]" />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Lot Number *</label>
                <input value={reserveLot} onChange={e => setReserveLot(e.target.value)} placeholder="12" className="w-full bg-[#222228] border border-[rgba(245,240,232,0.12)] rounded-lg px-3 py-2 text-sm text-[#D4C4A0] focus:outline-none focus:border-[#B09B71]" />
              </div>
              <button onClick={handleReserve} disabled={!reserveLot} className="w-full py-2.5 rounded-xl bg-[var(--brass-deep)] text-[var(--surface-2)] font-medium disabled:opacity-40 hover:bg-[#B09B71] transition-colors">
                Submit Reservation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
