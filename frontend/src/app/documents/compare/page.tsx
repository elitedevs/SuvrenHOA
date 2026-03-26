'use client';

import { useState } from 'react';
import { GitCompare, Plus, Minus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface DocVersion {
  id: string;
  title: string;
  version: string;
  date: string;
  content: string;
}

const SAMPLE_DOCS: DocVersion[] = [
  {
    id: 'v1',
    title: 'CC&Rs — Revision 4',
    version: 'v4.0',
    date: '2024-01-15',
    content: `ARTICLE I — DEFINITIONS
1.1 "Association" means Faircroft Homeowners Association, Inc.
1.2 "Lot" means any plot of land within the community.
1.3 "Common Areas" means all real property owned by the Association.

ARTICLE II — MEMBERSHIP
2.1 Every Owner of a Lot shall be a Member of the Association.
2.2 Membership shall be appurtenant to and may not be separated from ownership.
2.3 Annual dues shall be assessed at $1,800 per Lot per year.
2.4 Dues are due on January 1st of each calendar year.

ARTICLE III — ARCHITECTURAL CONTROL
3.1 No structure shall be erected without prior written approval.
3.2 All exterior colors must conform to the approved palette.
3.3 Landscaping must be maintained in good condition at all times.
3.4 Fences must not exceed 6 feet in height.

ARTICLE IV — USE RESTRICTIONS
4.1 Lots shall be used for single-family residential purposes only.
4.2 No commercial activity shall be conducted on any Lot.
4.3 Pets are limited to two per household.
4.4 Vehicles must be parked in garages or designated areas.`,
  },
  {
    id: 'v2',
    title: 'CC&Rs — Revision 5',
    version: 'v5.0',
    date: '2026-02-20',
    content: `ARTICLE I — DEFINITIONS
1.1 "Association" means Faircroft Homeowners Association, Inc.
1.2 "Lot" means any plot of land within the community.
1.3 "Common Areas" means all real property owned by the Association for community use.
1.4 "NFT Membership Token" means the blockchain token representing HOA membership.

ARTICLE II — MEMBERSHIP
2.1 Every Owner of a Lot shall be a Member of the Association.
2.2 Membership shall be represented by a non-transferable NFT on the Base blockchain.
2.3 Annual dues shall be assessed at $2,100 per Lot per year.
2.4 Dues are due on January 1st of each calendar year.
2.5 All votes shall be conducted via on-chain governance mechanisms.

ARTICLE III — ARCHITECTURAL CONTROL
3.1 No structure shall be erected without prior written approval from the Board.
3.2 All exterior colors must conform to the approved palette.
3.3 Landscaping must be maintained in good condition at all times.
3.4 Fences must not exceed 6 feet in height.
3.5 Solar panels and EV charging equipment are expressly permitted.

ARTICLE IV — USE RESTRICTIONS
4.1 Lots shall be used for single-family residential purposes only.
4.2 No commercial activity shall be conducted on any Lot.
4.3 Pets are limited to three per household.
4.4 Vehicles must be parked in garages or designated areas.
4.5 Short-term rentals (under 30 days) are prohibited.`,
  },
  {
    id: 'v3',
    title: 'Pool Rules — 2024',
    version: 'v2.1',
    date: '2024-06-01',
    content: `COMMUNITY POOL RULES

1. Pool hours: 7am – 10pm daily
2. No lifeguard on duty — swim at your own risk
3. Children under 12 must be accompanied by an adult
4. No glass containers in pool area
5. Maximum occupancy: 30 persons
6. Guests limited to 2 per household
7. No running on pool deck
8. Shower before entering pool`,
  },
  {
    id: 'v4',
    title: 'Pool Rules — 2026',
    version: 'v2.4',
    date: '2026-03-01',
    content: `COMMUNITY POOL RULES

1. Pool hours: 7am – 11pm daily (extended by community vote)
2. No lifeguard on duty — swim at your own risk
3. Children under 14 must be accompanied by an adult
4. No glass containers in pool area
5. Maximum occupancy: 40 persons (post-renovation capacity)
6. Guests limited to 4 per household
7. No running on pool deck
8. Shower before entering pool
9. Pool access requires valid HOA membership token
10. Reservations required for private events`,
  },
];

function diffLines(a: string, b: string): { type: 'same' | 'added' | 'removed'; line: string }[] {
  const linesA = a.split('\n');
  const linesB = b.split('\n');
  const result: { type: 'same' | 'added' | 'removed'; line: string }[] = [];

  // Simple LCS-based diff
  const maxLen = Math.max(linesA.length, linesB.length);
  let ai = 0, bi = 0;

  while (ai < linesA.length || bi < linesB.length) {
    if (ai >= linesA.length) {
      result.push({ type: 'added', line: linesB[bi++] });
    } else if (bi >= linesB.length) {
      result.push({ type: 'removed', line: linesA[ai++] });
    } else if (linesA[ai] === linesB[bi]) {
      result.push({ type: 'same', line: linesA[ai] });
      ai++; bi++;
    } else {
      // Look ahead to find a match
      const lookAhead = 5;
      let foundInB = -1, foundInA = -1;
      for (let d = 1; d <= lookAhead; d++) {
        if (bi + d < linesB.length && linesA[ai] === linesB[bi + d]) { foundInB = d; break; }
      }
      for (let d = 1; d <= lookAhead; d++) {
        if (ai + d < linesA.length && linesA[ai + d] === linesB[bi]) { foundInA = d; break; }
      }
      if (foundInB !== -1 && (foundInA === -1 || foundInB <= foundInA)) {
        for (let d = 0; d < foundInB; d++) result.push({ type: 'added', line: linesB[bi++] });
      } else if (foundInA !== -1) {
        for (let d = 0; d < foundInA; d++) result.push({ type: 'removed', line: linesA[ai++] });
      } else {
        result.push({ type: 'removed', line: linesA[ai++] });
        result.push({ type: 'added', line: linesB[bi++] });
      }
    }
  }

  return result;
}

export default function DocumentComparePage() {
  const [docA, setDocA] = useState<string>('v1');
  const [docB, setDocB] = useState<string>('v2');
  const [view, setView] = useState<'split' | 'unified'>('unified');

  const a = SAMPLE_DOCS.find(d => d.id === docA);
  const b = SAMPLE_DOCS.find(d => d.id === docB);
  const diff = a && b ? diffLines(a.content, b.content) : [];

  const added = diff.filter(d => d.type === 'added').length;
  const removed = diff.filter(d => d.type === 'removed').length;

  return (
    <div className="min-h-screen bg-[oklch(0.06_0.005_60)] p-6 lg:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/documents" className="flex items-center gap-1.5 text-xs text-[oklch(0.45_0.01_60)] hover:text-[#B09B71] transition-colors mb-4">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Documents
          </Link>
          <h1 className="text-3xl font-bold text-[#D4C4A0] mb-2 flex items-center gap-3">
            <GitCompare className="w-8 h-8 text-[#B09B71]" /> Document Comparison
          </h1>
          <p className="text-[oklch(0.50_0.01_60)]">Side-by-side diff viewer for CC&R amendments and policy changes</p>
        </div>

        {/* Doc selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {[
            { label: 'Original Version', val: docA, set: setDocA, color: 'border-red-700/40' },
            { label: 'New Version', val: docB, set: setDocB, color: 'border-green-700/40' },
          ].map(({ label, val, set, color }) => (
            <div key={label}>
              <label className="block text-xs text-[oklch(0.45_0.01_60)] mb-1.5 font-medium uppercase tracking-wide">{label}</label>
              <select
                value={val}
                onChange={e => set(e.target.value)}
                className={`w-full bg-[oklch(0.12_0.005_60)] border-2 ${color} rounded-xl px-4 py-3 text-sm text-[#D4C4A0] focus:outline-none focus:border-[#B09B71] transition-colors`}
              >
                {SAMPLE_DOCS.map(d => (
                  <option key={d.id} value={d.id}>{d.title} ({d.version}) — {d.date}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Stats & view toggle */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
          <div className="flex gap-3 text-sm">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(42,93,79,0.10)] border border-green-700/30 text-[#3A7D6F]">
              <Plus className="w-3.5 h-3.5" /> {added} added
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(107,58,58,0.10)] border border-red-700/30 text-[#8B5A5A]">
              <Minus className="w-3.5 h-3.5" /> {removed} removed
            </span>
          </div>
          <div className="flex gap-1.5 p-1 bg-[oklch(0.10_0.005_60)] rounded-xl border border-[oklch(0.18_0.005_60)]">
            {(['unified', 'split'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} className={`px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${view === v ? 'bg-[#b8942e] text-[#1a1a1a]' : 'text-[oklch(0.50_0.01_60)] hover:text-[#D4C4A0]'}`}>{v}</button>
            ))}
          </div>
        </div>

        {/* Diff view */}
        {a && b && docA !== docB ? (
          view === 'unified' ? (
            <div className="bg-[oklch(0.10_0.005_60)] border border-[oklch(0.18_0.005_60)] rounded-2xl overflow-hidden">
              <div className="flex items-center gap-4 px-4 py-3 bg-[oklch(0.12_0.005_60)] border-b border-[oklch(0.18_0.005_60)] text-xs text-[oklch(0.45_0.01_60)]">
                <span className="text-[#8B5A5A] font-mono">--- {a.title} ({a.version})</span>
                <span className="text-[#3A7D6F] font-mono">+++ {b.title} ({b.version})</span>
              </div>
              <div className="overflow-x-auto">
                <div className="font-mono text-xs">
                  {diff.map((line, i) => (
                    <div key={i} className={`flex items-start px-4 py-0.5 ${
                      line.type === 'added' ? 'bg-[rgba(42,93,79,0.10)] border-l-2 border-[rgba(42,93,79,0.30)]'
                      : line.type === 'removed' ? 'bg-[rgba(107,58,58,0.10)] border-l-2 border-[rgba(107,58,58,0.30)]'
                      : ''
                    }`}>
                      <span className={`w-5 shrink-0 text-center mr-3 ${
                        line.type === 'added' ? 'text-[#3A7D6F]' : line.type === 'removed' ? 'text-[#8B5A5A]' : 'text-[oklch(0.30_0.005_60)]'
                      }`}>
                        {line.type === 'added' ? '+' : line.type === 'removed' ? '−' : ' '}
                      </span>
                      <span className={
                        line.type === 'added' ? 'text-[rgba(42,93,79,0.80)]'
                        : line.type === 'removed' ? 'text-[#8B5A5A] line-through'
                        : 'text-[oklch(0.65_0.01_60)]'
                      }>{line.line || '\u00A0'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {[
                { doc: a, lines: diff.filter(d => d.type !== 'added'), color: 'border-red-700/30', label: 'Original' },
                { doc: b, lines: diff.filter(d => d.type !== 'removed'), color: 'border-green-700/30', label: 'New' },
              ].map(({ doc, lines, color, label }) => (
                <div key={label} className={`bg-[oklch(0.10_0.005_60)] border-2 ${color} rounded-2xl overflow-hidden`}>
                  <div className={`px-4 py-3 border-b ${color} bg-[oklch(0.12_0.005_60)] text-xs font-medium ${label === 'Original' ? 'text-[#8B5A5A]' : 'text-[#3A7D6F]'}`}>
                    {label}: {doc.title} ({doc.version})
                  </div>
                  <div className="overflow-x-auto p-4 font-mono text-xs space-y-0.5">
                    {lines.map((line, i) => (
                      <div key={i} className={`px-2 py-0.5 rounded ${line.type === 'removed' ? 'bg-[rgba(107,58,58,0.10)] text-[#8B5A5A] line-through' : line.type === 'added' ? 'bg-[rgba(42,93,79,0.10)] text-[rgba(42,93,79,0.80)]' : 'text-[oklch(0.60_0.01_60)]'}`}>
                        {line.line || '\u00A0'}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-16 bg-[oklch(0.10_0.005_60)] border border-[oklch(0.18_0.005_60)] rounded-2xl text-[oklch(0.40_0.01_60)]">
            {docA === docB ? 'Select two different document versions to compare' : 'Select documents above'}
          </div>
        )}
      </div>
    </div>
  );
}
