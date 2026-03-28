'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  Droplets, Cloud, Sun, Timer, BarChart2, ToggleLeft, ToggleRight, Leaf, AlertTriangle,
} from 'lucide-react';

interface Zone {
  id: string;
  name: string;
  area: string;
  schedule: { days: string[]; startTime: string; durationMin: number };
  gallonsPerCycle: number;
  lastRun: string;
  status: 'active' | 'paused' | 'off';
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DEMO_ZONES: Zone[] = [
  { id: '1', name: 'Front Entrance', area: 'Zone A', schedule: { days: ['Mon', 'Wed', 'Fri'], startTime: '05:00', durationMin: 20 }, gallonsPerCycle: 180, lastRun: '2026-03-24', status: 'active' },
  { id: '2', name: 'North Perimeter', area: 'Zone B', schedule: { days: ['Tue', 'Thu', 'Sat'], startTime: '05:20', durationMin: 25 }, gallonsPerCycle: 220, lastRun: '2026-03-25', status: 'active' },
  { id: '3', name: 'Clubhouse Lawn', area: 'Zone C', schedule: { days: ['Mon', 'Wed', 'Fri'], startTime: '05:45', durationMin: 30 }, gallonsPerCycle: 280, lastRun: '2026-03-24', status: 'active' },
  { id: '4', name: 'Pool Surrounds', area: 'Zone D', schedule: { days: ['Tue', 'Sat'], startTime: '06:00', durationMin: 15 }, gallonsPerCycle: 120, lastRun: '2026-03-22', status: 'paused' },
  { id: '5', name: 'South Beds', area: 'Zone E', schedule: { days: ['Mon', 'Thu'], startTime: '06:20', durationMin: 18 }, gallonsPerCycle: 150, lastRun: '2026-03-24', status: 'active' },
  { id: '6', name: 'East Boundary', area: 'Zone F', schedule: { days: ['Wed', 'Sun'], startTime: '05:30', durationMin: 22 }, gallonsPerCycle: 190, lastRun: '2026-03-23', status: 'off' },
];

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'text-[#3A7D6F]', bg: 'bg-[#3A7D6F]/10', border: 'border-[rgba(42,93,79,0.20)]', dot: 'bg-[#3A7D6F]' },
  paused: { label: 'Paused', color: 'text-[#B09B71]', bg: 'bg-[rgba(176,155,113,0.10)]', border: 'border-[rgba(176,155,113,0.20)]', dot: 'bg-[#B09B71]' },
  off: { label: 'Off', color: 'text-[var(--text-disabled)]', bg: 'bg-[rgba(245,240,232,0.04)]', border: 'border-[rgba(245,240,232,0.08)]', dot: 'bg-[rgba(245,240,232,0.12)]' },
};

const ZONE_GRID = [
  ['Zone A', 'Zone B', 'Zone C'],
  ['Zone F', '', 'Zone D'],
  ['Zone E', '', ''],
];

export default function IrrigationPage() {
  const { isConnected } = useAccount();
  const [zones, setZones] = useState<Zone[]>(DEMO_ZONES);
  const [rainDelay, setRainDelay] = useState(false);
  const [rainDelayDays, setRainDelayDays] = useState(2);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('hoa_irrigation_zones');
    if (stored) { try { setZones(JSON.parse(stored)); } catch {} }
    const rd = localStorage.getItem('hoa_irrigation_rain_delay');
    if (rd) { try { const d = JSON.parse(rd); setRainDelay(d.active); setRainDelayDays(d.days); } catch {} }
  }, []);

  const saveZones = (z: Zone[]) => {
    setZones(z);
    localStorage.setItem('hoa_irrigation_zones', JSON.stringify(z));
  };

  const toggleStatus = (id: string) => {
    saveZones(zones.map((z) => z.id === id ? { ...z, status: z.status === 'active' ? 'paused' : 'active' } as Zone : z));
  };

  const toggleRainDelay = () => {
    const next = !rainDelay;
    setRainDelay(next);
    localStorage.setItem('hoa_irrigation_rain_delay', JSON.stringify({ active: next, days: rainDelayDays }));
  };

  const totalGallons = zones.filter((z) => z.status === 'active').reduce((s, z) => s + z.gallonsPerCycle * z.schedule.days.length, 0);
  const weeklyGallons = Math.round(totalGallons);
  const monthlyGallons = Math.round(totalGallons * 4.33);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-[var(--text-muted)] mb-4">Sign in to view irrigation management</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-medium flex items-center gap-3">
            <Droplets className="w-7 h-7 text-[#B09B71]" />
            Irrigation & Water
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Community irrigation zones, schedules, and water usage</p>
        </div>

        {/* Rain Delay Toggle */}
        <button
          onClick={toggleRainDelay}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
            rainDelay ? 'bg-[rgba(90,122,154,0.15)] border-[rgba(90,122,154,0.25)] text-[var(--steel)]' : 'glass-card border-[rgba(245,240,232,0.10)] text-[var(--text-muted)] hover:text-[var(--text-heading)]'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span className="text-sm font-medium">Rain Delay {rainDelay ? `(${rainDelayDays}d)` : 'Off'}</span>
          {rainDelay ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
        </button>
      </div>

      {rainDelay && (
        <div className="mb-6 p-4 rounded-xl bg-[rgba(90,122,154,0.10)] border border-[rgba(90,122,154,0.20)] flex items-center gap-3">
          <Cloud className="w-5 h-5 text-[var(--steel)] shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--steel)]">Rain Delay Active</p>
            <p className="text-xs text-[var(--text-muted)]">All zones paused for {rainDelayDays} days due to rain. Click above to cancel.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">Days:</span>
            {[1, 2, 3, 7].map((d) => (
              <button
                key={d}
                onClick={() => { setRainDelayDays(d); localStorage.setItem('hoa_irrigation_rain_delay', JSON.stringify({ active: true, days: d })); }}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${rainDelayDays === d ? 'bg-[var(--steel)] text-[var(--text-heading)]' : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'}`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Zones', value: String(zones.filter((z) => z.status === 'active').length), icon: Droplets, color: 'text-[var(--steel)]' },
          { label: 'Weekly Gallons', value: weeklyGallons.toLocaleString(), icon: BarChart2, color: 'text-[#B09B71]' },
          { label: 'Monthly Est.', value: (monthlyGallons / 1000).toFixed(1) + 'K gal', icon: Leaf, color: 'text-[#3A7D6F]' },
          { label: 'Paused Zones', value: String(zones.filter((z) => z.status !== 'active').length), icon: AlertTriangle, color: 'text-[#B09B71]' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-[var(--text-disabled)]">{label}</span>
            </div>
            <p className={`text-xl font-medium ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Zone Map */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">Zone Map</h2>
          <div className="glass-card rounded-xl p-4">
            <div className="grid grid-cols-3 gap-2">
              {ZONE_GRID.map((row, ri) =>
                row.map((cell, ci) => {
                  if (!cell) return <div key={`${ri}-${ci}`} />;
                  if (cell === '' || cell === '') {
                    return (
                      <div key={`${ri}-${ci}`} className="aspect-square rounded-lg bg-[rgba(26,26,30,0.60)] border border-[rgba(245,240,232,0.05)] flex items-center justify-center">
                        <span className="text-xl">{cell === '' ? '' : ''}</span>
                      </div>
                    );
                  }
                  const zone = zones.find((z) => z.area === cell);
                  if (!zone) return <div key={`${ri}-${ci}`} />;
                  const cfg = STATUS_CONFIG[rainDelay ? 'paused' : zone.status];
                  return (
                    <button
                      key={`${ri}-${ci}`}
                      onClick={() => setSelectedZone(zone)}
                      className={`aspect-square rounded-lg border ${cfg.border} ${cfg.bg} flex flex-col items-center justify-center gap-1 transition-all hover:scale-105 ${selectedZone?.id === zone.id ? 'ring-2 ring-[#B09B71]/50' : ''}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      <span className="text-[10px] font-medium text-[var(--text-heading)]">{zone.area}</span>
                    </button>
                  );
                })
              )}
            </div>
            <div className="mt-3 flex items-center justify-center gap-4">
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <div key={k} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${v.dot}`} />
                  <span className="text-xs text-[var(--text-disabled)]">{v.label}</span>
                </div>
              ))}
            </div>
          </div>

          {selectedZone && (
            <div className="mt-4 glass-card rounded-xl p-4 border border-[#B09B71]/20">
              <h3 className="font-medium text-[var(--text-heading)] text-sm mb-3">{selectedZone.name}</h3>
              <div className="space-y-2 text-xs text-[var(--text-muted)]">
                <div className="flex justify-between">
                  <span>Schedule</span>
                  <span className="text-[var(--text-heading)]">{selectedZone.schedule.days.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Start Time</span>
                  <span className="text-[var(--text-heading)]">{selectedZone.schedule.startTime}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration</span>
                  <span className="text-[var(--text-heading)]">{selectedZone.schedule.durationMin} min</span>
                </div>
                <div className="flex justify-between">
                  <span>Per cycle</span>
                  <span className="text-[var(--text-heading)]">{selectedZone.gallonsPerCycle} gal</span>
                </div>
                <div className="flex justify-between">
                  <span>Last run</span>
                  <span className="text-[var(--text-heading)]">{selectedZone.lastRun}</span>
                </div>
              </div>
              <button
                onClick={() => toggleStatus(selectedZone.id)}
                className={`mt-3 w-full px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedZone.status === 'active' ? 'bg-[rgba(176,155,113,0.20)] text-[#B09B71] border border-[rgba(176,155,113,0.20)] hover:bg-[rgba(176,155,113,0.30)]' : 'bg-[#3A7D6F]/20 text-[#3A7D6F] border border-[rgba(42,93,79,0.20)] hover:bg-[rgba(42,93,79,0.30)]'
                }`}
              >
                {selectedZone.status === 'active' ? 'Pause Zone' : 'Activate Zone'}
              </button>
            </div>
          )}
        </div>

        {/* Zone List */}
        <div className="lg:col-span-3">
          <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">All Zones</h2>
          <div className="space-y-3">
            {zones.map((zone) => {
              const cfg = STATUS_CONFIG[rainDelay ? 'paused' : zone.status];
              return (
                <div
                  key={zone.id}
                  className={`glass-card rounded-xl p-4 border ${cfg.border} cursor-pointer hover:border-[#B09B71]/30 transition-all ${selectedZone?.id === zone.id ? 'border-[#B09B71]/40' : ''}`}
                  onClick={() => setSelectedZone(zone)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                      <div>
                        <p className="text-sm font-medium text-[var(--text-heading)]">{zone.name}</p>
                        <p className="text-xs text-[var(--text-disabled)]">{zone.area} · {zone.schedule.days.join(', ')} @ {zone.schedule.startTime}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-[#B09B71]">{zone.gallonsPerCycle} gal</p>
                      <p className="text-xs text-[var(--text-disabled)]">{zone.schedule.durationMin} min</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
