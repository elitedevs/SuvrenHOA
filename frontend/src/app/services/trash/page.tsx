'use client';

import { useState } from 'react';
import { Printer, ClipboardList } from 'lucide-react';

type PickupType = 'trash' | 'recycling' | 'yard';

interface PickupDay {
  type: PickupType;
  label: string;
}

const TYPE_CONFIG: Record<PickupType, { color: string; bg: string; border: string; emoji: string; label: string }> = {
  trash:     { color: 'text-green-400',  bg: 'bg-green-400/20',  border: 'border-green-400/30',  emoji: '🗑️', label: 'Trash' },
  recycling: { color: 'text-blue-400',   bg: 'bg-blue-400/20',   border: 'border-blue-400/30',   emoji: '♻️', label: 'Recycling' },
  yard:      { color: 'text-[#c9a96e]',  bg: 'bg-[#c9a96e]/20', border: 'border-[#c9a96e]/30',  emoji: '🌿', label: 'Yard Waste' },
};

// Pickup schedule: 0=Sun,1=Mon,...,6=Sat
// Trash: Monday & Thursday; Recycling: Wednesday; Yard: Every other Monday
const PICKUP_RULES: { type: PickupType; dayOfWeek: number; weekParity?: 'even' | 'odd' }[] = [
  { type: 'trash', dayOfWeek: 1 },     // Monday
  { type: 'trash', dayOfWeek: 4 },     // Thursday
  { type: 'recycling', dayOfWeek: 3 }, // Wednesday
  { type: 'yard', dayOfWeek: 1, weekParity: 'even' }, // Every other Monday
];

// Holidays that delay by 1 day
const HOLIDAYS_2026: string[] = [
  '2026-01-01', '2026-01-19', '2026-02-16', '2026-05-25',
  '2026-07-04', '2026-09-07', '2026-11-26', '2026-12-25',
];

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getPickupsForMonth(year: number, month: number): Map<string, PickupType[]> {
  const result = new Map<string, PickupType[]>();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];
    const pickups: PickupType[] = [];
    const weekNum = getWeekNumber(date);

    for (const rule of PICKUP_RULES) {
      if (date.getDay() !== rule.dayOfWeek) continue;
      if (rule.weekParity === 'even' && weekNum % 2 !== 0) continue;
      if (rule.weekParity === 'odd' && weekNum % 2 !== 1) continue;
      pickups.push(rule.type);
    }

    if (pickups.length > 0) {
      result.set(dateStr, pickups);
    }
  }
  return result;
}

function getNextPickups(): { type: PickupType; date: Date }[] {
  const today = new Date();
  const results: { type: PickupType; date: Date }[] = [];

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const weekNum = getWeekNumber(date);

    for (const rule of PICKUP_RULES) {
      if (date.getDay() !== rule.dayOfWeek) continue;
      if (rule.weekParity === 'even' && weekNum % 2 !== 0) continue;
      if (rule.weekParity === 'odd' && weekNum % 2 !== 1) continue;
      results.push({ type: rule.type, date: new Date(date) });
    }
  }

  return results.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 4);
}

function getDaysUntil(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function TrashSchedulePage() {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const pickups = getPickupsForMonth(viewYear, viewMonth);
  const nextPickups = getNextPickups();

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const isHoliday = (dateStr: string) => HOLIDAYS_2026.includes(dateStr);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Trash & Recycling</h1>
          <p className="text-gray-400 text-sm mt-1">Pickup schedule for Faircroft HOA</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass border border-white/[0.08] text-sm text-gray-300 hover:text-gray-100 transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap mb-6">
        {(Object.entries(TYPE_CONFIG) as [PickupType, typeof TYPE_CONFIG[PickupType]][]).map(([type, cfg]) => (
          <div key={type} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${cfg.bg} ${cfg.border} border`}>
            <span className="text-sm">{cfg.emoji}</span>
            <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-400/10 border border-red-400/20">
          <span className="text-sm">🚫</span>
          <span className="text-xs font-semibold text-red-400">Holiday (delayed +1 day)</span>
        </div>
      </div>

      {/* Next Pickups Countdown */}
      <div className="glass rounded-2xl p-5 border border-white/[0.04] mb-6">
        <h2 className="text-sm font-bold text-gray-300 mb-4">📅 Upcoming Pickups</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {nextPickups.map((pickup, i) => {
            const daysUntil = getDaysUntil(pickup.date);
            const cfg = TYPE_CONFIG[pickup.type];
            return (
              <div key={i} className={`p-3 rounded-xl ${cfg.bg} border ${cfg.border} text-center`}>
                <div className="text-xl mb-1">{cfg.emoji}</div>
                <div className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {pickup.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                <div className={`text-xs font-bold mt-1 ${daysUntil === 0 ? 'text-yellow-400' : cfg.color}`}>
                  {daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow!' : `${daysUntil} days`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Calendar */}
      <div className="glass rounded-2xl p-5 border border-white/[0.04]">
        {/* Month Nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/[0.06] text-gray-400 cursor-pointer">‹</button>
          <h2 className="text-base font-bold text-gray-100">{MONTH_NAMES[viewMonth]} {viewYear}</h2>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/[0.06] text-gray-400 cursor-pointer">›</button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAY_NAMES.map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-gray-600 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const date = new Date(viewYear, viewMonth, day);
            const dateStr = date.toISOString().split('T')[0];
            const dayPickups = pickups.get(dateStr) || [];
            const isToday = dateStr === today.toISOString().split('T')[0];
            const holiday = isHoliday(dateStr);

            return (
              <div
                key={day}
                className={`relative rounded-lg p-1 min-h-[52px] flex flex-col items-center ${
                  isToday ? 'ring-1 ring-[#c9a96e]/50 bg-[#c9a96e]/5' : ''
                }`}
              >
                <span className={`text-[11px] font-semibold mb-1 ${isToday ? 'text-[#c9a96e]' : 'text-gray-500'}`}>{day}</span>
                <div className="flex flex-col gap-0.5 w-full">
                  {dayPickups.map((type, ti) => {
                    const cfg = TYPE_CONFIG[type];
                    return (
                      <div key={ti} className={`text-[9px] text-center rounded px-0.5 ${cfg.bg} ${cfg.color} font-semibold leading-tight py-0.5`} title={cfg.label}>
                        {cfg.emoji}
                      </div>
                    );
                  })}
                  {holiday && dayPickups.length > 0 && (
                    <div className="text-[9px] text-center rounded px-0.5 bg-red-400/15 text-red-400 font-semibold leading-tight py-0.5">🚫</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Schedule Summary */}
      <div className="glass rounded-2xl p-5 border border-white/[0.04] mt-6">
        <h2 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-[#c9a96e]" /> Weekly Schedule</h2>
        <div className="space-y-2">
          {[
            { day: 'Monday', pickups: ['🗑️ Trash', '🌿 Yard Waste (bi-weekly)'] },
            { day: 'Wednesday', pickups: ['♻️ Recycling'] },
            { day: 'Thursday', pickups: ['🗑️ Trash'] },
          ].map((row, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-sm font-semibold text-gray-300 w-24">{row.day}</span>
              <div className="flex gap-2 flex-wrap">
                {row.pickups.map((p, j) => <span key={j} className="text-xs text-gray-400">{p}</span>)}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-600 mt-3">
          * Holiday schedule: If a holiday falls on or before your pickup day, pickup is delayed by 1 business day.
        </p>
      </div>
    </main>
  );
}
