'use client';

import { useMemo } from 'react';

const VIOLATION_TYPES = [
  'Tall Grass',
  'Parking',
  'Trash',
  'Noise',
  'Pets',
  'Structures',
  'Landscaping',
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Sample heatmap data — row = month (0-11), col = type
const SAMPLE_DATA: number[][] = [
  [1, 2, 0, 1, 0, 1, 0], // Jan
  [1, 1, 0, 0, 0, 0, 0], // Feb
  [2, 2, 1, 1, 1, 0, 1], // Mar
  [4, 3, 2, 2, 1, 1, 2], // Apr
  [7, 3, 2, 2, 2, 1, 3], // May
  [8, 4, 3, 3, 2, 1, 4], // Jun
  [9, 5, 3, 4, 2, 2, 3], // Jul
  [8, 4, 3, 3, 2, 2, 2], // Aug
  [5, 3, 2, 2, 1, 1, 2], // Sep
  [3, 2, 1, 1, 1, 1, 1], // Oct
  [2, 2, 1, 1, 0, 0, 1], // Nov
  [1, 1, 1, 0, 0, 0, 0], // Dec
];

function heatColor(value: number, max: number): string {
  if (value === 0) return 'rgba(255,255,255,0.03)';
  const intensity = value / max;
  if (intensity <= 0.2) return 'rgba(201,169,110,0.15)';
  if (intensity <= 0.4) return 'rgba(201,169,110,0.30)';
  if (intensity <= 0.6) return 'rgba(201,169,110,0.50)';
  if (intensity <= 0.8) return 'rgba(201,169,110,0.70)';
  return 'rgba(201,169,110,0.90)';
}

interface ViolationHeatmapProps {
  data?: number[][];
}

export function ViolationHeatmap({ data = SAMPLE_DATA }: ViolationHeatmapProps) {
  const maxVal = useMemo(() => Math.max(...data.flat()), [data]);

  // Column totals
  const typeTotals = useMemo(() =>
    VIOLATION_TYPES.map((_, j) => data.reduce((sum, row) => sum + row[j], 0)),
    [data]
  );
  // Row totals
  const monthTotals = useMemo(() =>
    data.map(row => row.reduce((a, b) => a + b, 0)),
    [data]
  );

  const now = new Date();
  const currentMonth = now.getMonth();

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-sm font-bold text-[#D4C4A0]">Violation Heatmap</h2>
          <p className="text-xs text-[rgba(245,240,232,0.35)] mt-1">Density by type and month — darker = more violations</p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-1 text-[10px] text-[rgba(245,240,232,0.25)]">
          <span>Low</span>
          {[0.15, 0.30, 0.50, 0.70, 0.90].map(a => (
            <div
              key={a}
              className="w-4 h-4 rounded"
              style={{ background: `rgba(201,169,110,${a})` }}
            />
          ))}
          <span>High</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[520px]">
          {/* Header row: violation types */}
          <div className="grid mb-1" style={{ gridTemplateColumns: '48px repeat(7, 1fr) 40px' }}>
            <div />
            {VIOLATION_TYPES.map(type => (
              <div key={type} className="text-[9px] text-[rgba(245,240,232,0.35)] font-medium text-center px-0.5 leading-tight">
                {type}
              </div>
            ))}
            <div className="text-[9px] text-[rgba(245,240,232,0.25)] text-center">Total</div>
          </div>

          {/* Data rows */}
          {MONTHS.map((month, mi) => (
            <div
              key={month}
              className={`grid gap-1 mb-1 items-center ${mi === currentMonth ? 'ring-1 ring-[#B09B71]/30 rounded-lg' : ''}`}
              style={{ gridTemplateColumns: '48px repeat(7, 1fr) 40px' }}
            >
              <div className={`text-[10px] font-medium pr-2 text-right ${mi === currentMonth ? 'text-[#B09B71]' : 'text-[rgba(245,240,232,0.35)]'}`}>
                {month}
              </div>
              {VIOLATION_TYPES.map((_, ti) => {
                const val = data[mi]?.[ti] ?? 0;
                return (
                  <div
                    key={ti}
                    className="h-7 rounded flex items-center justify-center text-[10px] font-bold transition-all hover:scale-105 cursor-default"
                    style={{ background: heatColor(val, maxVal), color: val > 0 ? 'rgba(232,213,163,0.9)' : 'transparent' }}
                    title={`${month} / ${VIOLATION_TYPES[ti]}: ${val}`}
                  >
                    {val > 0 ? val : ''}
                  </div>
                );
              })}
              <div className="text-[10px] text-[rgba(245,240,232,0.35)] text-center font-medium">
                {monthTotals[mi]}
              </div>
            </div>
          ))}

          {/* Footer: column totals */}
          <div className="grid mt-2 pt-2 border-t border-[oklch(0.15_0.005_60)]" style={{ gridTemplateColumns: '48px repeat(7, 1fr) 40px' }}>
            <div className="text-[9px] text-[rgba(245,240,232,0.25)] text-right pr-2 font-semibold">Total</div>
            {typeTotals.map((t, i) => (
              <div key={i} className="text-[10px] text-[#B09B71] text-center font-bold">{t}</div>
            ))}
            <div className="text-[10px] text-[rgba(245,240,232,0.50)] text-center font-bold">
              {typeTotals.reduce((a, b) => a + b, 0)}
            </div>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-[rgba(245,240,232,0.25)] mt-4">
        * Highlighted row = current month. Data reflects {new Date().getFullYear()} violations.
      </p>
    </div>
  );
}
