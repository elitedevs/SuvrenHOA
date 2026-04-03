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
    <div className="min-h-screen bg-[var(--obsidian)] p-6 lg:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-medium gradient-text text-[#D4C4A0] mb-2">HOA Cost Comparison</h1>
          <p className="text-[rgba(245,240,232,0.45)]">See exactly how SuvrenHOA stacks up against traditional HOA management</p>
        </div>

        {/* Units slider */}
        <div className="mb-8 p-6 bg-[#1A1A1E] border border-[rgba(245,240,232,0.06)] rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-[#D4C4A0]">Community Size</label>
            <span className="text-2xl font-medium text-[#B09B71]">{units} homes</span>
          </div>
          <input
            type="range"
            min={10}
            max={500}
            value={units}
            onChange={(e) => setUnits(Number(e.target.value))}
            className="w-full accent-[#B09B71]"
          />
          <div className="flex justify-between text-xs text-[rgba(245,240,232,0.25)] mt-1">
            <span>10</span><span>500</span>
          </div>
        </div>

        {/* Savings cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Annual Community Savings', value: annualSavings, prefix: '$', icon: TrendingDown, color: 'text-[#3A7D6F]', bg: 'bg-[rgba(42,93,79,0.08)] border-[rgba(42,93,79,0.30)]' },
            { label: 'Per Home Per Year', value: perHome, prefix: '$', icon: TrendingDown, color: 'text-[#B09B71]', bg: 'bg-[#1A1A1E] border-[rgba(245,240,232,0.10)]' },
            { label: 'Transparency Score', value: 100, suffix: '%', icon: CheckCircle, color: 'text-[#B09B71]', bg: 'bg-[#1A1A1E] border-[rgba(245,240,232,0.10)]' },
          ].map(({ label, value, prefix, suffix, icon: Icon, color, bg }) => (
            <div key={label} className={`p-5 rounded-xl border ${bg}`}>
              <Icon className={`w-5 h-5 ${color} mb-2`} />
              <p className={`text-2xl font-medium ${color}`}>
                <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div className="bg-[#1A1A1E] border border-[rgba(245,240,232,0.06)] rounded-xl overflow-hidden mb-6">
          <div className="grid grid-cols-3 bg-[#1A1A1E] px-6 py-4 text-xs font-medium uppercase tracking-widest text-[var(--text-muted)]">
            <div>Category</div>
            <div className="text-center">Traditional HOA</div>
            <div className="text-center text-[#B09B71]">SuvrenHOA</div>
          </div>
          {BASE_ROWS.map((row, i) => {
            const tradVal = row.unit === '$' ? Math.round(row.traditionalVal * multiplier) : row.traditionalVal;
            const suvVal = row.unit === '$' ? Math.round(row.suvrenVal * multiplier) : row.suvrenVal;
            const tradBetter = row.higherIsBetter ? tradVal > suvVal : tradVal < suvVal;
            const suvBetter = row.higherIsBetter ? suvVal > tradVal : suvVal < tradVal;
            return (
              <div key={i} className={`grid grid-cols-3 px-6 py-4 items-center ${i % 2 === 0 ? '' : 'bg-[#111113]'}`}>
                <div className="text-sm text-[#D4C4A0]">{row.category}</div>
                <div className={`text-center font-mono text-sm font-medium ${tradBetter ? 'text-[#3A7D6F]' : suvBetter ? 'text-[#8B5A5A]' : 'text-[var(--text-body)]'}`}>
                  {row.unit === '$' ? `$${tradVal.toLocaleString()}` : `${tradVal}${row.unit}`}
                  {tradBetter ? <CheckCircle className="inline w-3.5 h-3.5 ml-1.5" /> : suvBetter ? <XCircle className="inline w-3.5 h-3.5 ml-1.5" /> : <Minus className="inline w-3.5 h-3.5 ml-1.5" />}
                </div>
                <div className={`text-center font-mono text-sm font-medium ${suvBetter ? 'text-[#B09B71]' : tradBetter ? 'text-[#8B5A5A]' : 'text-[var(--text-body)]'}`}>
                  {row.unit === '$' ? `$${suvVal.toLocaleString()}` : `${suvVal}${row.unit}`}
                  {suvBetter ? <CheckCircle className="inline w-3.5 h-3.5 ml-1.5 text-[var(--brass-deep)]" /> : tradBetter ? <XCircle className="inline w-3.5 h-3.5 ml-1.5" /> : <Minus className="inline w-3.5 h-3.5 ml-1.5" />}
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
            <div key={title} className={`p-6 rounded-xl border ${bad ? 'border-[rgba(139,90,90,0.30)] bg-[rgba(139,90,90,0.05)]' : 'border-[var(--brass-deep)]/30 bg-[#1A1A1E]'}`}>
              <h3 className={`font-medium mb-4 ${bad ? 'text-[#8B5A5A]' : 'text-[#B09B71]'}`}>{title}</h3>
              <ul className="space-y-2">
                {items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    {bad ? <XCircle className="w-4 h-4 text-[#6B3A3A] shrink-0 mt-0.5" /> : <CheckCircle className="w-4 h-4 text-[#3A7D6F] shrink-0 mt-0.5" />}
                    <span className={bad ? 'text-[var(--text-body)]' : 'text-[rgba(245,240,232,0.80)]'}>{item}</span>
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
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--brass-deep)]/50 text-[#B09B71] hover:bg-[var(--brass-deep)]/10 transition-colors font-medium"
          >
            <Share2 className="w-4 h-4" />
            {copied ? 'Copied to clipboard!' : 'Share Results'}
          </button>
        </div>
      </div>
    </div>
  );
}
