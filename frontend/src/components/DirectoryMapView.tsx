'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface Resident {
  id: string;
  lot_number: number;
  display_name: string;
  years_in_community?: number;
  board_role?: string;
}

interface LotPosition {
  lotNumber: number;
  x: number; // 0-100 percent
  y: number; // 0-100 percent
}

// Simplified lot grid layout — 10×15 = 150 lots in a Faircroft neighborhood grid
function generateLotPositions(): LotPosition[] {
  const positions: LotPosition[] = [];
  const COLS = 15;
  const ROWS = 10;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const lot = row * COLS + col + 1;
      if (lot > 150) break;
      positions.push({
        lotNumber: lot,
        x: 5 + (col / (COLS - 1)) * 90,
        y: 5 + (row / (ROWS - 1)) * 90,
      });
    }
  }
  return positions;
}

const LOT_POSITIONS = generateLotPositions();

interface DirectoryMapViewProps {
  residents: Resident[];
  onClose?: () => void;
}

export function DirectoryMapView({ residents, onClose }: DirectoryMapViewProps) {
  const [selected, setSelected] = useState<Resident | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; lot: number } | null>(null);

  const residentByLot = new Map<number, Resident>(
    residents.map(r => [r.lot_number, r])
  );

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[oklch(0.18_0.005_60)] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-[#D4C4A0]">Neighborhood Map View</h3>
          <p className="text-xs text-[var(--text-disabled)] mt-0.5">Click a lot to see resident info</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 text-[var(--text-disabled)] hover:text-[var(--text-body)] rounded-lg hover:bg-[rgba(245,240,232,0.05)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-4 flex flex-col lg:flex-row gap-4">
        {/* Map */}
        <div className="relative flex-1 min-h-[280px] bg-[#0d1a0d]/30 rounded-xl border border-[rgba(42,93,79,0.30)] overflow-hidden">
          {/* Street labels */}
          <div className="absolute inset-x-0 top-1 text-center text-[9px] text-[var(--text-disabled)] font-medium uppercase tracking-widest">
            Faircroft Drive
          </div>
          <div className="absolute inset-x-0 bottom-1 text-center text-[9px] text-[var(--text-disabled)] font-medium uppercase tracking-widest">
            Oak Meadow Lane
          </div>
          <div className="absolute inset-y-0 left-1 text-center writing-vertical text-[9px] text-[var(--text-disabled)] font-medium" style={{ writingMode: 'vertical-rl', display: 'flex', alignItems: 'center' }}>
            Willow Creek Blvd
          </div>

          {/* Grid overlay */}
          <svg className="absolute inset-0 w-full h-full opacity-5" viewBox="0 0 100 100" preserveAspectRatio="none">
            {Array.from({ length: 16 }, (_, i) => (
              <line key={`v${i}`} x1={i * 6.5} y1={0} x2={i * 6.5} y2={100} stroke="#B09B71" strokeWidth={0.3} />
            ))}
            {Array.from({ length: 11 }, (_, i) => (
              <line key={`h${i}`} x1={0} y1={i * 10} x2={100} y2={i * 10} stroke="#B09B71" strokeWidth={0.3} />
            ))}
          </svg>

          {/* Lot dots */}
          {LOT_POSITIONS.map(pos => {
            const resident = residentByLot.get(pos.lotNumber);
            const isSelected = selected?.lot_number === pos.lotNumber;
            const hasResident = !!resident;

            return (
              <button
                key={pos.lotNumber}
                onClick={() => {
                  setSelected(isSelected ? null : (resident || null));
                  setTooltip(null);
                }}
                onMouseEnter={() => setTooltip({ x: pos.x, y: pos.y, lot: pos.lotNumber })}
                onMouseLeave={() => setTooltip(null)}
                className={`absolute w-3 h-3 rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ${
                  isSelected
                    ? 'ring-2 ring-white ring-offset-1 ring-offset-transparent scale-150 z-20'
                    : 'hover:scale-125 z-10'
                }`}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  background: isSelected
                    ? '#D4C4A0'
                    : hasResident
                      ? resident?.board_role
                        ? '#B09B71'
                        : 'rgba(201,169,110,0.6)'
                      : 'rgba(255,255,255,0.1)',
                  border: hasResident ? 'none' : '1px solid rgba(255,255,255,0.1)',
                }}
                title={`Lot #${pos.lotNumber}`}
              />
            );
          })}

          {/* Tooltip */}
          {tooltip && (
            <div
              className="absolute z-30 pointer-events-none bg-[var(--surface-2)] border border-[#B09B71]/30 rounded-lg px-2 py-1 text-[10px] text-[var(--text-body)]"
              style={{
                left: `${Math.min(tooltip.x + 3, 80)}%`,
                top: `${Math.max(tooltip.y - 8, 5)}%`,
              }}
            >
              Lot #{tooltip.lot}
              {residentByLot.has(tooltip.lot) && (
                <> — {residentByLot.get(tooltip.lot)?.display_name}</>
              )}
            </div>
          )}
        </div>

        {/* Sidebar: selected or legend */}
        <div className="w-full lg:w-56 space-y-3">
          {selected ? (
            <div className="glass-card rounded-xl p-4 border border-[#B09B71]/20">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B09B71] to-[var(--brass-deep)] flex items-center justify-center text-sm font-normal text-[var(--surface-2)] mb-3">
                {selected.display_name?.charAt(0) || '?'}
              </div>
              <p className="text-sm font-medium text-[#D4C4A0]">{selected.display_name || 'Anonymous'}</p>
              <p className="text-xs text-[var(--text-disabled)] mt-0.5">Lot #{selected.lot_number}</p>
              {selected.board_role && (
                <p className="text-xs text-[#B09B71] font-medium mt-1">{selected.board_role}</p>
              )}
              {selected.years_in_community && (
                <p className="text-xs text-[var(--text-disabled)] mt-2">{selected.years_in_community} years in community</p>
              )}
              <button
                onClick={() => setSelected(null)}
                className="mt-3 text-xs text-[var(--text-disabled)] hover:text-[var(--text-muted)] transition-colors"
              >
                ← Back to map
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--text-disabled)] uppercase tracking-wide">Legend</p>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <div className="w-3 h-3 rounded-full bg-[#B09B71]" />
                Board member
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <div className="w-3 h-3 rounded-full bg-[rgba(201,169,110,0.6)]" />
                Registered resident
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <div className="w-3 h-3 rounded-full bg-[rgba(255,255,255,0.1)] border border-[rgba(245,240,232,0.10)]" />
                Vacant / no data
              </div>
              <p className="text-[10px] text-[var(--text-disabled)] mt-2 leading-relaxed">
                {residents.length} lots have registered residents.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
