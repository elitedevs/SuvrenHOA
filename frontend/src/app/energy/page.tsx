'use client';

import { useState } from 'react';
import { Zap, Sun, Leaf, TrendingDown, Calculator } from 'lucide-react';

const TIPS_BY_SEASON: Record<string, { tip: string; savings: string; icon: string }[]> = {
  Summer: [
    { tip: 'Set AC to 78°F when home, 85°F when away', savings: 'Save ~$40/mo', icon: '' },
    { tip: 'Use ceiling fans to feel 4°F cooler', savings: 'Save ~$15/mo', icon: '' },
    { tip: 'Close blinds during peak sun hours (10am–4pm)', savings: 'Save ~$20/mo', icon: '' },
    { tip: 'Run dishwasher/laundry after 9pm', savings: 'Save ~$12/mo', icon: '' },
  ],
  Winter: [
    { tip: 'Set heat to 68°F when home, 60°F when away', savings: 'Save ~$35/mo', icon: '' },
    { tip: 'Seal drafts around doors and windows', savings: 'Save ~$25/mo', icon: '' },
    { tip: 'Use a programmable thermostat', savings: 'Save ~$50/mo', icon: '' },
    { tip: 'Wash clothes in cold water', savings: 'Save ~$10/mo', icon: '' },
  ],
  Spring: [
    { tip: 'Open windows instead of running AC', savings: 'Save ~$60/mo', icon: '' },
    { tip: 'Service your HVAC before summer', savings: 'Save ~$80/season', icon: '' },
    { tip: 'Install LED bulbs throughout home', savings: 'Save ~$20/mo', icon: '' },
    { tip: 'Add insulation to your attic', savings: 'Save ~$150/yr', icon: '' },
  ],
  Fall: [
    { tip: 'Take advantage of mild temps — open windows', savings: 'Save ~$45/mo', icon: '' },
    { tip: 'Check weatherstripping before winter', savings: 'Save ~$30/season', icon: '' },
    { tip: 'Reverse ceiling fan direction for heat', savings: 'Save ~$18/mo', icon: '' },
    { tip: 'Unplug electronics when not in use', savings: 'Save ~$8/mo', icon: '' },
  ],
};

const GREEN_IMPROVEMENTS = [
  { name: 'Solar Panels (5kW)', cost: 15000, annualSavings: 1800, roi: 8.3, payback: '8.3 years', co2: '4.2 tons/yr' },
  { name: 'Heat Pump Water Heater', cost: 1200, annualSavings: 320, roi: 26.7, payback: '3.75 years', co2: '0.8 tons/yr' },
  { name: 'Smart Thermostat', cost: 250, annualSavings: 180, roi: 72, payback: '1.4 years', co2: '0.5 tons/yr' },
  { name: 'Attic Insulation', cost: 2500, annualSavings: 400, roi: 16, payback: '6.25 years', co2: '1.1 tons/yr' },
  { name: 'LED Lighting Retrofit', cost: 400, annualSavings: 240, roi: 60, payback: '1.67 years', co2: '0.3 tons/yr' },
];

export default function EnergyPage() {
  const [season, setSeason] = useState<'Summer' | 'Winter' | 'Spring' | 'Fall'>('Summer');
  const [lotSqft, setLotSqft] = useState(2200);
  const [currentBill, setCurrentBill] = useState(180);

  const solarPotentialKwh = Math.round(lotSqft * 0.08 * 5.5);
  const solarSavings = Math.round(solarPotentialKwh * 0.12);
  const solarPercent = Math.min(100, Math.round((solarSavings / currentBill) * 100));

  return (
    <div className="min-h-screen bg-[oklch(0.06_0.005_60)] p-6 lg:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-[#D4C4A0] mb-2 flex items-center gap-3">
            <Zap className="w-8 h-8 text-[#B09B71]" /> Home Energy Dashboard
          </h1>
          <p className="text-[oklch(0.50_0.01_60)]">Energy tips, solar potential, and green improvement ROI for your home</p>
        </div>

        {/* Community Totals */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Avg Monthly Bill', val: '$163', sub: 'Community average', icon: TrendingDown, color: 'text-[#B09B71]' },
            { label: 'Solar Homes', val: '14', sub: 'Out of 16 homes', icon: Sun, color: 'text-[#B09B71]' },
            { label: 'CO₂ Reduced', val: '47t', sub: 'This year', icon: Leaf, color: 'text-[#3A7D6F]' },
            { label: 'Green Score', val: '72/100', sub: 'Community rating', icon: Zap, color: 'text-[#B09B71]' },
          ].map(({ label, val, sub, icon: Icon, color }) => (
            <div key={label} className="bg-[oklch(0.10_0.005_60)] border border-[oklch(0.18_0.005_60)] rounded-xl p-4">
              <Icon className={`w-5 h-5 ${color} mb-2`} />
              <p className={`text-2xl font-bold ${color}`}>{val}</p>
              <p className="text-xs text-[oklch(0.45_0.01_60)] font-medium mt-0.5">{label}</p>
              <p className="text-xs text-[oklch(0.35_0.01_60)]">{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          {/* Seasonal Tips */}
          <div className="bg-[oklch(0.10_0.005_60)] border border-[oklch(0.18_0.005_60)] rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-[#D4C4A0] mb-4">Seasonal Energy Tips</h2>
            <div className="flex gap-1.5 mb-5 p-1 bg-[oklch(0.08_0.005_60)] rounded-xl">
              {(['Summer', 'Winter', 'Spring', 'Fall'] as const).map(s => (
                <button key={s} onClick={() => setSeason(s)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${season === s ? 'bg-[#b8942e] text-[#1a1a1a]' : 'text-[oklch(0.50_0.01_60)] hover:text-[#D4C4A0]'}`}>{s}</button>
              ))}
            </div>
            <div className="space-y-3">
              {TIPS_BY_SEASON[season].map((tip, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[oklch(0.13_0.005_60)]">
                  <span className="text-xl shrink-0">{tip.icon}</span>
                  <div>
                    <p className="text-sm text-[#D4C4A0]">{tip.tip}</p>
                    <p className="text-xs text-[#3A7D6F] mt-0.5 font-medium">{tip.savings}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Solar Calculator */}
          <div className="bg-[oklch(0.10_0.005_60)] border border-[oklch(0.18_0.005_60)] rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-[#D4C4A0] mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#B09B71]" /> Solar Potential Calculator
            </h2>
            <div className="space-y-4">
              <div>
                <label className="flex justify-between text-xs text-[oklch(0.50_0.01_60)] mb-1.5">
                  <span>Home Size (sqft)</span><span className="text-[#B09B71] font-medium">{lotSqft.toLocaleString()} sqft</span>
                </label>
                <input type="range" min={1000} max={6000} step={100} value={lotSqft} onChange={e => setLotSqft(Number(e.target.value))} className="w-full accent-[#B09B71]" />
              </div>
              <div>
                <label className="flex justify-between text-xs text-[oklch(0.50_0.01_60)] mb-1.5">
                  <span>Current Monthly Bill</span><span className="text-[#B09B71] font-medium">${currentBill}</span>
                </label>
                <input type="range" min={80} max={500} step={10} value={currentBill} onChange={e => setCurrentBill(Number(e.target.value))} className="w-full accent-[#B09B71]" />
              </div>

              <div className="mt-4 space-y-3 p-4 bg-[oklch(0.13_0.005_60)] rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[oklch(0.45_0.01_60)]">Solar Generation Potential</span>
                  <span className="text-sm font-bold text-[#B09B71]">{solarPotentialKwh.toLocaleString()} kWh/yr</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[oklch(0.45_0.01_60)]">Estimated Annual Savings</span>
                  <span className="text-sm font-bold text-[#3A7D6F]">${solarSavings.toLocaleString()}/yr</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[oklch(0.45_0.01_60)]">Bill Offset</span>
                  <span className="text-sm font-bold text-[#B09B71]">{solarPercent}%</span>
                </div>
                <div className="w-full bg-[oklch(0.18_0.005_60)] rounded-full h-2 mt-1">
                  <div className="bg-gradient-to-r from-[#8A7550] to-[#B09B71] h-2 rounded-full transition-all duration-500" style={{ width: `${solarPercent}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Green Improvements Table */}
        <div className="bg-[oklch(0.10_0.005_60)] border border-[oklch(0.18_0.005_60)] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[oklch(0.15_0.005_60)]">
            <h2 className="text-lg font-semibold text-[#D4C4A0] flex items-center gap-2">
              <Leaf className="w-5 h-5 text-[#3A7D6F]" /> Green Improvements & ROI
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-[oklch(0.40_0.01_60)] bg-[oklch(0.12_0.005_60)]">
                  {['Improvement', 'Cost', 'Annual Savings', 'ROI %', 'Payback', 'CO₂ Saved'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GREEN_IMPROVEMENTS.map((item, i) => (
                  <tr key={i} className={`text-sm ${i % 2 === 0 ? '' : 'bg-[oklch(0.08_0.005_60)]'}`}>
                    <td className="px-4 py-3 text-[#D4C4A0] font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-[oklch(0.55_0.01_60)]">${item.cost.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[#3A7D6F] font-medium">${item.annualSavings}/yr</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${item.roi > 50 ? 'text-[#3A7D6F]' : item.roi > 20 ? 'text-[#B09B71]' : 'text-[oklch(0.55_0.01_60)]'}`}>{item.roi}%</span>
                    </td>
                    <td className="px-4 py-3 text-[oklch(0.55_0.01_60)]">{item.payback}</td>
                    <td className="px-4 py-3 text-[#3A7D6F] text-xs">{item.co2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
