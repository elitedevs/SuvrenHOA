'use client';

import { useState, useEffect, useRef } from 'react';
import { TrendingDown, Share2, CheckCircle, XCircle, Minus } from 'lucide-react';

interface CompareRow {
  category: string;
  traditional: string;
  suvren: string;
  traditionalVal: number;
  suvrenVal: number;
  unit: string;
  higherIsBetter: boolean;
}

const BASE_ROWS: CompareRow[] = [
  { category: 'Annual Management Fee', traditional: 1800, suvren: 0, traditionalVal: 1800, suvrenVal: 0, unit: '$', higherIsBetter: false },
  { category: 'Document Storage', traditional: 480, suvren: 0, traditionalVal: 480, suvrenVal: 0, unit: '$', higherIsBetter: false },
  { category: 'Meeting Transparency', traditional: 20, suvren: 100, traditionalVal: 20, suvrenVal: 100, unit: '%', higherIsBetter: true },
  { category: 'Voting Accessibility', traditional: 30, suvren: 100, traditionalVal: 30, suvrenVal: 100, unit: '%', higherIsBetter: true },
  { category: 'Dispute Resolution (days)', traditional: 45, suvren: 7, traditionalVal: 45, suvrenVal: 7, unit: 'd', higherIsBetter: false },
  { category: 'Financial Audit Cost', traditional: 2400, suvren: 0, traditionalVal: 2400, suvrenVal: 0, unit: '$', higherIsBetter: false },
].map(r => ({ ...r, traditional: String(r.traditional), suvren: String(r.suvren) })) as CompareRow[];

function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = ref.current;
    const end = value;
    const duration = 800;
    const startTime = Date.now();
    const frame = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      setDisplayed(current);
      if (progress < 1) requestAnimationFrame(frame);
      else ref.current = end;
    };
    requestAnimationFrame(frame);
  }, [value]);

  return <span>{prefix}{displayed.toLocaleString()}{suffix}</span>;
}

export default function ComparePage() {
  const [units, setUnits] = useState(48);
  const [copied, setCopied] = useState(false);

  const multiplier = units / 48;
  const annualSavings = Math.round((1800 + 480 + 2400 / 48) * multiplier);
  const perHome = Math.round(annualSavings / units);

  const handleShare = () => {
    const text = `SuvrenHOA saves our ${units}-home community $${annualSavings.toLocaleString()}/year vs traditional HOA management. 100% transparent, on-chain governance. #SuvrenHOA #BlockchainHOA`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[oklch(0.06_0.005_60)] p-6 lg:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-[#e8d5a3] mb-2">HOA Cost Comparison</h1>
          <p className="text-[oklch(0.50_0.01_60)]">See exactly how SuvrenHOA stacks up against traditional HOA management</p>
        </div>

        {/* Units slider */}
        <div className="mb-8 p-6 bg-[oklch(0.10_0.005_60)] border border-[oklch(0.18_0.005_60)] rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-[#e8d5a3]">Community Size</label>
            <span className="text-2xl font-bold text-[#c9a96e]">{units} homes</span>
          </div>
          <input
            type="range"
            min={10}
            max={500}
            value={units}
            onChange={(e) => setUnits(Number(e.target.value))}
            className="w-full accent-[#c9a96e]"
          />
          <div className="flex justify-between text-xs text-[oklch(0.40_0.01_60)] mt-1">
            <span>10</span><span>500</span>
          </div>
        </div>

        {/* Savings cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Annual Community Savings', value: annualSavings, prefix: '$', icon: TrendingDown, color: 'text-green-400', bg: 'bg-green-950/20 border-green-700/30' },
            { label: 'Per Home Per Year', value: perHome, prefix: '$', icon: TrendingDown, color: 'text-[#c9a96e]', bg: 'bg-[oklch(0.14_0.01_60)] border-[oklch(0.22_0.01_60)]' },
            { label: 'Transparency Score', value: 100, suffix: '%', icon: CheckCircle, color: 'text-[#c9a96e]', bg: 'bg-[oklch(0.14_0.01_60)] border-[oklch(0.22_0.01_60)]' },
          ].map(({ label, value, prefix, suffix, icon: Icon, color, bg }) => (
            <div key={label} className={`p-5 rounded-xl border ${bg}`}>
              <Icon className={`w-5 h-5 ${color} mb-2`} />
              <p className={`text-2xl font-bold ${color}`}>
                <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
              </p>
              <p className="text-xs text-[oklch(0.45_0.01_60)] mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div className="bg-[oklch(0.10_0.005_60)] border border-[oklch(0.18_0.005_60)] rounded-2xl overflow-hidden mb-6">
          <div className="grid grid-cols-3 bg-[oklch(0.14_0.005_60)] px-6 py-4 text-xs font-semibold uppercase tracking-widest text-[oklch(0.45_0.01_60)]">
            <div>Category</div>
            <div className="text-center">Traditional HOA</div>
            <div className="text-center text-[#c9a96e]">SuvrenHOA</div>
          </div>
          {BASE_ROWS.map((row, i) => {
            const tradVal = row.unit === '$' ? Math.round(row.traditionalVal * multiplier) : row.traditionalVal;
            const suvVal = row.unit === '$' ? Math.round(row.suvrenVal * multiplier) : row.suvrenVal;
            const tradBetter = row.higherIsBetter ? tradVal > suvVal : tradVal < suvVal;
            const suvBetter = row.higherIsBetter ? suvVal > tradVal : suvVal < tradVal;
            return (
              <div key={i} className={`grid grid-cols-3 px-6 py-4 items-center ${i % 2 === 0 ? '' : 'bg-[oklch(0.08_0.005_60)]'}`}>
                <div className="text-sm text-[#e8d5a3]">{row.category}</div>
                <div className={`text-center font-mono text-sm font-semibold ${tradBetter ? 'text-green-400' : suvBetter ? 'text-red-400' : 'text-[oklch(0.55_0.01_60)]'}`}>
                  {row.unit === '$' ? `$${tradVal.toLocaleString()}` : `${tradVal}${row.unit}`}
                  {tradBetter ? <CheckCircle className="inline w-3.5 h-3.5 ml-1.5" /> : suvBetter ? <XCircle className="inline w-3.5 h-3.5 ml-1.5" /> : <Minus className="inline w-3.5 h-3.5 ml-1.5" />}
                </div>
                <div className={`text-center font-mono text-sm font-bold ${suvBetter ? 'text-[#c9a96e]' : tradBetter ? 'text-red-400' : 'text-[oklch(0.55_0.01_60)]'}`}>
                  {row.unit === '$' ? `$${suvVal.toLocaleString()}` : `${suvVal}${row.unit}`}
                  {suvBetter ? <CheckCircle className="inline w-3.5 h-3.5 ml-1.5 text-[#b8942e]" /> : tradBetter ? <XCircle className="inline w-3.5 h-3.5 ml-1.5" /> : <Minus className="inline w-3.5 h-3.5 ml-1.5" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Qualitative comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {[
            { title: 'Traditional HOA', items: ['Opaque financial records', 'Management company markup', 'Paper-only voting (low turnout)', 'Dispute takes months', 'Documents easily lost/altered'], bad: true },
            { title: 'SuvrenHOA', items: ['100% on-chain treasury transparency', 'No management company fees', 'Digital voting accessible 24/7', 'Smart contract dispute resolution', 'Immutable document storage on blockchain'], bad: false },
          ].map(({ title, items, bad }) => (
            <div key={title} className={`p-6 rounded-xl border ${bad ? 'border-red-700/30 bg-red-950/10' : 'border-[#b8942e]/30 bg-[oklch(0.12_0.01_60)]'}`}>
              <h3 className={`font-semibold mb-4 ${bad ? 'text-red-400' : 'text-[#c9a96e]'}`}>{title}</h3>
              <ul className="space-y-2">
                {items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    {bad ? <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" /> : <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />}
                    <span className={bad ? 'text-[oklch(0.55_0.01_60)]' : 'text-[oklch(0.70_0.01_60)]'}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Share */}
        <div className="flex justify-end">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-[#b8942e]/50 text-[#c9a96e] hover:bg-[#b8942e]/10 transition-colors font-medium"
          >
            <Share2 className="w-4 h-4" />
            {copied ? 'Copied to clipboard!' : 'Share Results'}
          </button>
        </div>
      </div>
    </div>
  );
}
