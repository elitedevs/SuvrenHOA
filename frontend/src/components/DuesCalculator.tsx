'use client';

import { useState, useEffect, useRef } from 'react';

const TIERS = [
  { id: 'standard', label: 'Standard', multiplier: 1.0, description: 'Lots under 10,000 sqft' },
  { id: 'premium', label: 'Premium', multiplier: 1.25, description: 'Lots 10,000–20,000 sqft' },
  { id: 'estate', label: 'Estate', multiplier: 1.5, description: 'Lots over 20,000 sqft' },
];

const TRADITIONAL_MIN = 15000;
const TRADITIONAL_MAX = 50000;
const SUVREN_MONTHLY = 0.35;

interface Props {
  baseQuarterlyRate?: number;
}

function useAnimatedNumber(target: number, duration = 800) {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const fromRef = useRef<number>(target);

  useEffect(() => {
    fromRef.current = display;
    startRef.current = performance.now();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const animate = (now: number) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = fromRef.current + (target - fromRef.current) * eased;
      setDisplay(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return Math.round(display);
}

export function DuesCalculator({ baseQuarterlyRate = 450 }: Props) {
  const [sqft, setSqft] = useState('5000');
  const [tierId, setTierId] = useState('standard');

  const tier = TIERS.find(t => t.id === tierId) || TIERS[0];
  const monthly = (baseQuarterlyRate * tier.multiplier) / 3;
  const annual = monthly * 12;
  const traditionalMid = (TRADITIONAL_MIN + TRADITIONAL_MAX) / 2;
  const savings = traditionalMid - annual;

  const animatedSavings = useAnimatedNumber(Math.round(savings));
  const animatedAnnual = useAnimatedNumber(Math.round(annual));

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">Dues Calculator</p>
          <h3 className="text-lg font-bold text-gray-100">See Your Savings</h3>
        </div>
        <div className="text-2xl">🧮</div>
      </div>

      {/* Lot sqft input */}
      <div className="mb-4">
        <label className="block text-xs text-gray-400 mb-2">Lot Size (sqft)</label>
        <input
          type="number"
          value={sqft}
          onChange={e => {
            setSqft(e.target.value);
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val)) {
              if (val < 10000) setTierId('standard');
              else if (val <= 20000) setTierId('premium');
              else setTierId('estate');
            }
          }}
          placeholder="e.g. 8500"
          min={500}
          max={100000}
          className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-sm placeholder-gray-500 focus:border-[#c9a96e]/50 focus:outline-none"
        />
      </div>

      {/* Tier selector */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {TIERS.map(t => (
          <button
            key={t.id}
            onClick={() => setTierId(t.id)}
            className={`rounded-xl p-3 text-center transition-all border ${
              tierId === t.id
                ? 'border-[#c9a96e]/50 bg-[#c9a96e]/10 text-[#e8d5a3]'
                : 'border-gray-700/50 bg-gray-800/40 text-gray-400 hover:border-gray-600'
            }`}
          >
            <p className="text-xs font-bold">{t.label}</p>
            <p className="text-[10px] mt-0.5 opacity-70">{t.multiplier}×</p>
          </button>
        ))}
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-xl bg-[#c9a96e]/5 border border-[#c9a96e]/20 p-4">
          <p className="text-[10px] text-gray-500 mb-1">Monthly</p>
          <p className="text-xl font-extrabold text-[#c9a96e]">${monthly.toFixed(2)}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">USDC / month</p>
        </div>
        <div className="rounded-xl bg-[#c9a96e]/5 border border-[#c9a96e]/20 p-4">
          <p className="text-[10px] text-gray-500 mb-1">Annual</p>
          <p className="text-xl font-extrabold text-[#c9a96e]">${animatedAnnual.toLocaleString()}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">USDC / year</p>
        </div>
      </div>

      {/* Savings vs traditional */}
      <div className="rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">💰</span>
          <p className="text-sm font-bold text-green-400">vs. Traditional HOA</p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-[10px] text-gray-500">Traditional HOA</p>
            <p className="text-sm font-bold text-gray-300">$15K–$50K/yr</p>
            <p className="text-[10px] text-gray-500">Management company fees</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500">SuvrenHOA</p>
            <p className="text-sm font-bold text-[#c9a96e]">$0.35/mo</p>
            <p className="text-[10px] text-gray-500">Platform fee only</p>
          </div>
        </div>
        <div className="h-px bg-green-500/20 my-3" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-500">Estimated Annual Savings</p>
            <p className="text-2xl font-extrabold text-green-400">
              ${animatedSavings.toLocaleString()}
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-green-500/15 border border-green-500/30">
            <span className="text-xs font-bold text-green-400">
              {Math.round((savings / traditionalMid) * 100)}% saved
            </span>
          </div>
        </div>
        <p className="text-[10px] text-gray-500 mt-2">
          Compared to median traditional HOA management cost of ${traditionalMid.toLocaleString()}/yr
        </p>
      </div>
    </div>
  );
}
