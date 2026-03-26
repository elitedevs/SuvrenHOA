'use client';

import { useState, useEffect, useRef } from 'react';
import { Share2, Shield, FileText, Landmark, Zap, TrendingUp, Award, Vote } from 'lucide-react';

function useCountUp(target: number, duration: number = 1500) {
  const [val, setVal] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const startTime = Date.now();
    const frame = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setVal(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(frame);
    };
    setTimeout(() => requestAnimationFrame(frame), 300);
  }, [target, duration]);

  return val;
}

const METRICS = [
  { label: 'Gas Saved vs Traditional', value: 4720, suffix: ' tons CO₂', icon: Zap, color: 'text-green-400', bg: 'bg-green-950/20 border-green-700/30', desc: 'By processing governance on-chain instead of paper/mail' },
  { label: 'Tamper-Proof Decisions', value: 847, suffix: '', icon: Shield, color: 'text-[#c9a96e]', bg: 'bg-[oklch(0.12_0.01_60)] border-[oklch(0.22_0.01_60)]', desc: 'Votes, proposals, and resolutions permanently recorded on-chain' },
  { label: 'Documents Stored On-Chain', value: 312, suffix: '', icon: FileText, color: 'text-blue-400', bg: 'bg-blue-950/20 border-blue-700/30', desc: 'CC&Rs, meeting minutes, financial reports — all immutable' },
  { label: 'Treasury Transparency Score', value: 98, suffix: '%', icon: Landmark, color: 'text-amber-400', bg: 'bg-amber-950/20 border-amber-700/30', desc: 'Every dollar trackable on-chain — the highest rating possible' },
];

const TIMELINE = [
  { date: 'Jan 2025', event: 'Faircroft DAO deployed on Polygon', type: 'milestone' },
  { date: 'Feb 2025', event: 'First on-chain vote: Pool Hours Amendment', type: 'vote' },
  { date: 'Mar 2025', event: '48 homeowner NFTs minted — community fully onboarded', type: 'milestone' },
  { date: 'Jun 2025', event: '$127,000 reserve fund moved to transparent smart contract', type: 'treasury' },
  { date: 'Sep 2025', event: '100th on-chain proposal passed', type: 'vote' },
  { date: 'Dec 2025', event: 'Annual report: 0 disputed decisions (all on-chain)', type: 'milestone' },
  { date: 'Mar 2026', event: 'Board election fully conducted on-chain — 94% participation', type: 'vote' },
];

function StatCard({ label, value, suffix, icon: Icon, color, bg, desc }: typeof METRICS[0]) {
  const displayed = useCountUp(value);
  return (
    <div className={`p-6 rounded-2xl border ${bg} flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <Icon className={`w-6 h-6 ${color}`} />
        <span className={`text-4xl font-black ${color} tabular-nums`}>{displayed.toLocaleString()}{suffix}</span>
      </div>
      <div>
        <p className={`font-semibold text-sm ${color} mb-1`}>{label}</p>
        <p className="text-xs text-[oklch(0.45_0.01_60)]">{desc}</p>
      </div>
    </div>
  );
}

export default function ImpactPage() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'timeline'>('metrics');

  const share = () => {
    const text = `🏠 Faircroft HOA Blockchain Impact Report:\n• 847 tamper-proof decisions on-chain\n• 312 documents permanently stored\n• 98% treasury transparency score\n• 4,720 tons CO₂ saved vs traditional HOA\n\nPowered by SuvrenHOA — the future of community governance. #BlockchainHOA #SuvrenHOA`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[oklch(0.06_0.005_60)] p-6 lg:p-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-7 h-7 text-[#c9a96e]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[#b8942e] bg-[#b8942e]/10 px-2 py-0.5 rounded-full">Community Impact Report</span>
            </div>
            <h1 className="text-3xl font-bold text-[#e8d5a3] mb-2">Faircroft HOA — Blockchain Impact</h1>
            <p className="text-[oklch(0.50_0.01_60)]">Measuring how on-chain governance has transformed our community since January 2025</p>
          </div>
          <button
            onClick={share}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#b8942e]/50 text-[#c9a96e] hover:bg-[#b8942e]/10 transition-colors font-medium"
          >
            <Share2 className="w-4 h-4" />
            {copied ? '✓ Copied!' : 'Share Report'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-8 p-1 bg-[oklch(0.10_0.005_60)] rounded-xl border border-[oklch(0.18_0.005_60)] w-fit">
          {[['metrics', 'Impact Metrics', TrendingUp], ['timeline', 'Milestone Timeline', Shield]] .map(([key, label, Icon]: any) => (
            <button key={key} onClick={() => setActiveTab(key)} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === key ? 'bg-[#b8942e] text-[#1a1a1a]' : 'text-[oklch(0.55_0.01_60)] hover:text-[#e8d5a3]'}`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {activeTab === 'metrics' && (
          <>
            {/* Big stat grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
              {METRICS.map(m => <StatCard key={m.label} {...m} />)}
            </div>

            {/* Community comparison */}
            <div className="bg-[oklch(0.10_0.005_60)] border border-[oklch(0.18_0.005_60)] rounded-2xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-[#e8d5a3] mb-5">Faircroft vs. National HOA Average</h2>
              <div className="space-y-4">
                {[
                  { label: 'Voter Participation', us: 89, them: 23, unit: '%' },
                  { label: 'Financial Transparency', us: 98, them: 31, unit: '%' },
                  { label: 'Dispute Resolution Speed', us: 7, them: 45, unit: ' days', lowerBetter: true },
                  { label: 'Document Accessibility', us: 100, them: 40, unit: '%' },
                  { label: 'Resident Satisfaction', us: 87, them: 52, unit: '%' },
                ].map(({ label, us, them, unit, lowerBetter }) => {
                  const usWins = lowerBetter ? us < them : us > them;
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-xs text-[oklch(0.45_0.01_60)] mb-2">
                        <span>{label}</span>
                        <div className="flex gap-4">
                          <span className="text-[#c9a96e] font-bold">Faircroft: {us}{unit}</span>
                          <span>National avg: {them}{unit}</span>
                        </div>
                      </div>
                      <div className="relative h-2 bg-[oklch(0.18_0.005_60)] rounded-full">
                        <div className="absolute left-0 top-0 h-2 bg-[oklch(0.25_0.005_60)] rounded-full" style={{ width: `${Math.min(them, 100)}%` }} />
                        <div className={`absolute left-0 top-0 h-2 rounded-full ${usWins ? 'bg-[#b8942e]' : 'bg-red-600'}`} style={{ width: `${Math.min(us, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shareable card */}
            <div className="bg-gradient-to-br from-[#1a1a1a] via-[oklch(0.12_0.01_60)] to-[#1a1a1a] border border-[#b8942e]/40 rounded-2xl p-8 text-center">
              <p className="text-xs uppercase tracking-widest text-[#b8942e] mb-3 font-semibold">Faircroft HOA — Blockchain Community</p>
              <h3 className="text-2xl font-black text-[#e8d5a3] mb-6">The Numbers Speak For Themselves</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { n: '847', label: 'On-Chain Votes' },
                  { n: '98%', label: 'Transparency' },
                  { n: '312', label: 'Docs Stored' },
                  { n: '89%', label: 'Participation' },
                ].map(({ n, label }) => (
                  <div key={label}>
                    <p className="text-3xl font-black text-[#c9a96e]">{n}</p>
                    <p className="text-xs text-[oklch(0.45_0.01_60)] mt-1">{label}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[oklch(0.35_0.01_60)] mt-6">Powered by SuvrenHOA • Polygon Blockchain • Since 2025</p>
            </div>
          </>
        )}

        {activeTab === 'timeline' && (
          <div className="bg-[oklch(0.10_0.005_60)] border border-[oklch(0.18_0.005_60)] rounded-2xl p-8">
            <h2 className="text-lg font-semibold text-[#e8d5a3] mb-8">Community Milestones</h2>
            <div className="space-y-0">
              {TIMELINE.map(({ date, event, type }, i) => (
                <div key={i} className="flex gap-5">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      type === 'milestone' ? 'bg-[#b8942e] text-[#1a1a1a]'
                      : type === 'vote' ? 'bg-blue-900/50 border-2 border-blue-600/50 text-blue-300'
                      : 'bg-green-900/50 border-2 border-green-600/50 text-green-300'
                    }`}>
                      {type === 'milestone' ? <Award className="w-4 h-4" /> : type === 'vote' ? <Vote className="w-4 h-4" /> : <Landmark className="w-4 h-4" />}
                    </div>
                    {i < TIMELINE.length - 1 && <div className="w-0.5 h-12 bg-[oklch(0.20_0.005_60)] my-1" />}
                  </div>
                  <div className="pb-8 pt-2">
                    <span className="text-xs text-[#b8942e] font-semibold">{date}</span>
                    <p className="text-sm text-[#e8d5a3] mt-0.5">{event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
