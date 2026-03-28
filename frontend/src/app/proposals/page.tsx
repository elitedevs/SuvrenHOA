'use client';

import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { useProperty } from '@/hooks/useProperty';
import { useContracts } from '@/hooks/useContracts';
import {
  useGovernorSettings,
  useProposeWithCategory,
  useProposalEvents,
  useProposalState,
  useProposalCategory,
  useProposalVotes,
  CATEGORIES,
  PROPOSAL_STATES,
  STATE_COLORS,
  type ProposalEvent,
} from '@/hooks/useProposals';
import { ProposalTemplates } from '@/components/ProposalTemplates';

// ─── State badge styles ───────────────────────────────────────────────────────

const STATE_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  Pending: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  Active: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  Canceled: { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
  Defeated: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  Succeeded: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  Queued: { color: 'text-[#c9a96e]', bg: 'bg-[#c9a96e]/10', border: 'border-[#c9a96e]/20' },
  Expired: { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
  Executed: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
};

// ─── Entry point ──────────────────────────────────────────────────────────────

export default function ProposalsPage() {
  const { isConnected } = useAccount();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-8 sm:py-12 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">Governance</p>
          <h1 className="text-3xl font-normal tracking-tight">Proposals</h1>
          <p className="text-base text-gray-400 mt-2 font-medium">
            Create, vote, and execute community governance proposals
          </p>
        </div>
        {isConnected && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-5 py-3 rounded-md bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] active:scale-95 text-sm font-bold transition-all duration-200 shrink-0 shadow-[0_0_20px_rgba(201,169,110,0.25)] min-h-[44px]"
          >
            {showCreate ? '← Back to Proposals' : '+ New Proposal'}
          </button>
        )}
      </div>

      {!isConnected ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <p className="text-gray-400 text-base font-medium">Sign in to participate in governance</p>
          <ConnectButton label="Sign In" />
        </div>
      ) : showCreate ? (
        <CreateProposal onClose={() => setShowCreate(false)} />
      ) : (
        <ProposalsDashboard />
      )}
    </div>
  );
}

// ─── Proposals Dashboard ─────────────────────────────────────────────────────

function ProposalsDashboard() {
  const { activeProposalCount, votingDelay, votingPeriod } = useGovernorSettings();
  const { proposals, isLoading, error, refetch } = useProposalEvents();

  const [stateFilter, setStateFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  return (
    <div className="space-y-8">
      {/* Governance Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 page-enter page-enter-delay-1">
        {[
          { value: activeProposalCount, label: 'Active Proposals', color: 'text-[#c9a96e]' },
          { value: `${Math.round(votingDelay / 86400)}d`, label: 'Voting Delay', color: 'text-blue-400' },
          { value: `${Math.round(votingPeriod / 86400)}d`, label: 'Voting Period', color: 'text-green-400' },
          { value: proposals.length, label: 'Total Proposals', color: 'text-amber-400' },
        ].map(({ value, label, color }) => (
          <div key={label} className="glass-card rounded-lg hover-lift p-6">
            <p className={`text-3xl font-normal ${color} mb-1`}>{value}</p>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 page-enter page-enter-delay-2">
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-500 self-center font-semibold uppercase tracking-wider">State:</span>
          {['All', ...PROPOSAL_STATES].map((s) => (
            <button
              key={s}
              onClick={() => setStateFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                stateFilter === s
                  ? 'bg-[#c9a96e] text-[#1a1a1a]'
                  : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700/60'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-500 self-center font-semibold uppercase tracking-wider">Category:</span>
          {['All', ...CATEGORIES.map((c) => c.label)].map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                categoryFilter === c
                  ? 'bg-[#c9a96e] text-[#1a1a1a]'
                  : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700/60'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Proposal List */}
      <div className="space-y-4 page-enter page-enter-delay-3">
        {isLoading ? (
          <div className="glass-card rounded-lg p-12 text-center">
                        <p className="text-gray-400 text-sm">Loading proposals from chain…</p>
          </div>
        ) : error ? (
          <div className="glass-card rounded-lg p-12 text-center border-l-2 border-l-red-500/40">
            <p className="text-red-400 text-sm mb-4">Failed to load proposals</p>
            <button
              onClick={refetch}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-semibold transition-colors"
            >
              Retry
            </button>
          </div>
        ) : proposals.length === 0 ? (
          <EmptyState />
        ) : (
          <ProposalList
            proposals={proposals}
            stateFilter={stateFilter}
            categoryFilter={categoryFilter}
          />
        )}
      </div>
    </div>
  );
}

// ─── Proposal List ────────────────────────────────────────────────────────────

function ProposalList({
  proposals,
  stateFilter,
  categoryFilter,
}: {
  proposals: ProposalEvent[];
  stateFilter: string;
  categoryFilter: string;
}) {
  return (
    <div className="space-y-3">
      {proposals.map((p) => (
        <ProposalCard
          key={p.proposalId.toString()}
          proposal={p}
          stateFilter={stateFilter}
          categoryFilter={categoryFilter}
        />
      ))}
    </div>
  );
}

// ─── Proposal Card (reads live state per proposal) ────────────────────────────

function ProposalCard({
  proposal,
  stateFilter,
  categoryFilter,
}: {
  proposal: ProposalEvent;
  stateFilter: string;
  categoryFilter: string;
}) {
  const { stateLabel } = useProposalState(proposal.proposalId);
  const category = useProposalCategory(proposal.proposalId);
  const { forVotes, against, abstain } = useProposalVotes(proposal.proposalId);

  // Filter logic
  if (stateFilter !== 'All' && stateLabel !== stateFilter) return null;
  if (categoryFilter !== 'All' && category.label !== categoryFilter) return null;

  const style = STATE_STYLES[stateLabel || 'Pending'] || STATE_STYLES.Pending;
  const total = forVotes + against + abstain;
  const forPercent = total > 0 ? (forVotes / total) * 100 : 0;

  // Extract title from description (first line after "# ")
  const firstLine = proposal.description.split('\n')[0];
  const title = firstLine.startsWith('# ') ? firstLine.slice(2) : firstLine.slice(0, 80) || `Proposal #${proposal.proposalId.toString().slice(0, 8)}`;
  const body = proposal.description.split('\n').slice(1).join(' ').replace(/#+/g, '').replace(/\*\*/g, '').trim();

  return (
    <Link href={`/proposals/${proposal.proposalId.toString()}`}>
      <div className="glass-card rounded-lg hover-lift p-6 cursor-pointer transition-all duration-200 hover:border-[#c9a96e]/20 border border-transparent">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${style.bg} ${style.color} ${style.border}`}>
                {stateLabel || '…'}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-[#c9a96e]/10 text-[#c9a96e] border border-[#c9a96e]/20">
                {category.icon} {category.label}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-base font-bold text-gray-100 mb-1 truncate">{title}</h3>
            {body && (
              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{body}</p>
            )}

            {/* Meta */}
            <div className="flex items-center gap-3 mt-3 text-[11px] text-gray-600">
              <span>By {proposal.proposer.slice(0, 6)}…{proposal.proposer.slice(-4)}</span>
              <span>·</span>
              <span>ID {proposal.proposalId.toString().slice(0, 10)}…</span>
            </div>
          </div>

          {/* Vote bar mini */}
          <div className="shrink-0 w-28 hidden sm:block">
            <div className="text-[10px] text-gray-500 text-right mb-1">{total} votes</div>
            <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-700"
                style={{ width: `${forPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] mt-1">
              <span className="text-green-400">{forPercent.toFixed(0)}% For</span>
              <span className="text-gray-500">→</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="glass-card rounded-lg hover-lift p-14 text-center">
            <h3 className="text-xl font-bold mb-3">No proposals yet</h3>
      <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed mb-8">
        Any homeowner with a Property NFT can submit a proposal.
        Once submitted, the community votes over a 7-day period.
      </p>

      {/* Lifecycle timeline */}
      <div className="max-w-lg mx-auto">
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-4">Proposal Lifecycle</p>
        <div className="relative flex items-center justify-between">
          <div className="absolute left-[10%] right-[10%] top-4 h-px bg-gradient-to-r from-[#c9a96e]/20 via-[#c9a96e]/40 to-[#c9a96e]/20" />
          {['Pending', 'Active', 'Succeeded', 'Queued', 'Executed'].map((s, i) => {
            const stateColorMap: Record<string, string> = {
              Pending: 'text-gray-400 border-gray-600/40 bg-gray-500/10',
              Active: 'text-blue-400 border-blue-500/40 bg-blue-500/10',
              Succeeded: 'text-green-400 border-green-500/40 bg-green-500/10',
              Queued: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
              Executed: 'text-[#c9a96e] border-[#c9a96e]/40 bg-[#c9a96e]/10',
            };
            return (
              <div key={s} className="flex flex-col items-center gap-2 relative z-10">
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold ${stateColorMap[s]}`}>
                  {i + 1}
                </div>
                <span className={`text-[10px] font-semibold ${stateColorMap[s].split(' ')[0]}`}>{s}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-3 mt-8">
          <span className="text-xs px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 font-semibold">
             For
          </span>
          <span className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 font-semibold">
             Against
          </span>
          <span className="text-xs px-3 py-1.5 rounded-lg bg-gray-500/10 text-gray-400 border border-gray-500/20 font-semibold">
             Abstain
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Create Proposal ──────────────────────────────────────────────────────────

function CreateProposal({ onClose }: { onClose: () => void }) {
  const { hasProperty } = useProperty();
  const { propose, isPending, isConfirming, isSuccess, hash } = useProposeWithCategory();
  const { documentRegistry } = useContracts();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const selectedCategory = CATEGORIES[category];

  if (!hasProperty) {
    return (
      <div className="glass-card rounded-lg hover-lift p-12 text-center border-l-2 border-l-amber-500/40">
                <h3 className="text-xl font-bold mb-3">Property Required</h3>
        <p className="text-sm text-gray-400 max-w-sm mx-auto">
          You need a Property NFT (at least 1 vote) to create proposals.
        </p>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) return;
    const fullDescription = `# ${title}\n\n${description}`;
    propose(
      [documentRegistry.address as `0x${string}`],
      [BigInt(0)],
      ['0x' as `0x${string}`],
      fullDescription,
      category,
      '',
    );
  };

  if (isSuccess) {
    return (
      <div className="glass-card rounded-lg p-12 text-center border-l-2 border-l-green-500/50">
                <h3 className="text-2xl font-normal text-green-400 mb-3">Proposal Submitted!</h3>
        <p className="text-sm text-gray-400 mb-6 max-w-sm mx-auto">
          Your proposal is in <strong>Pending</strong> state. Voting opens after the 1-day review period.
        </p>
        {hash && (
          <a
            href={`https://sepolia.basescan.org/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#c9a96e] hover:underline font-mono"
          >
            View transaction on BaseScan →
          </a>
        )}
        <button
          onClick={onClose}
          className="block mx-auto mt-6 px-5 py-2.5 rounded-md bg-gray-800 hover:bg-gray-700 text-sm font-semibold transition-colors min-h-[44px]"
        >
          Back to Proposals
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      <ProposalTemplates onUseTemplate={({ title: t, description: d, category: c }) => {
        setTitle(t);
        setDescription(d);
        setCategory(c);
      }} />

      <div className="glass-card rounded-lg hover-lift p-8 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Proposal Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Hire new landscaping company for Q2"
            className="w-full px-4 py-3.5 rounded-md bg-gray-900/60 border border-gray-700/60 text-sm placeholder-gray-600 focus:border-[#c9a96e]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a96e]/20 transition-all text-gray-100"
          />
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-gray-300">
              Description <span className="text-gray-500 font-normal">(Markdown)</span>
            </label>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs text-[#c9a96e] hover:text-[#e8d5a3] transition-colors font-semibold"
            >
              {showPreview ? ' Edit' : ' Preview'}
            </button>
          </div>
          {showPreview ? (
            <div className="w-full px-4 py-3.5 rounded-md bg-gray-900/60 border border-gray-700/60 text-sm text-gray-300 min-h-[160px] prose prose-invert prose-sm max-w-none leading-relaxed">
              {description ? (
                <MarkdownPreview text={description} />
              ) : (
                <span className="text-gray-600">Nothing to preview yet…</span>
              )}
            </div>
          ) : (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this proposal does, why it matters, and what changes when it passes..."
              rows={8}
              className="w-full px-4 py-3.5 rounded-md bg-gray-900/60 border border-gray-700/60 text-sm placeholder-gray-600 focus:border-[#c9a96e]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a96e]/20 transition-all resize-none text-gray-100 font-mono"
            />
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-3">
            Category
          </label>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat, i) => {
              const borderColors = [
                'border-[#c9a96e]/50 bg-[#c9a96e]/10',
                'border-blue-500/50 bg-blue-500/10',
                'border-amber-500/50 bg-amber-500/10',
                'border-red-500/50 bg-red-500/10',
              ];
              const activeBorders = [
                'border-[#c9a96e]/70',
                'border-blue-400/70',
                'border-amber-400/70',
                'border-red-400/70',
              ];
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`p-4 rounded-md border text-left transition-all duration-200 min-h-[44px] ${
                    category === cat.value
                      ? `${borderColors[i % 4]} ${activeBorders[i % 4]} shadow-sm`
                      : 'border-gray-700/60 bg-gray-800/30 hover:border-gray-600/60'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-base">{cat.icon}</span>
                    <span className="text-sm font-bold text-gray-100">{cat.label}</span>
                    {category === cat.value && (
                      <span className="ml-auto text-xs text-green-400"></span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Quorum {cat.quorum} · Pass {cat.threshold}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quorum Estimate */}
        <div className="rounded-md bg-[#c9a96e]/5 border border-[#c9a96e]/15 px-5 py-4">
          <p className="text-xs font-semibold text-[#e8d5a3] mb-1">
            {selectedCategory.icon} {selectedCategory.label} — Quorum Requirement
          </p>
          <p className="text-xs text-gray-400 leading-relaxed">
            Requires <strong className="text-gray-200">{selectedCategory.quorum}</strong> of total voting supply to participate,
            with <strong className="text-gray-200">{selectedCategory.threshold}</strong> voting For to pass.
            {category === 3 && ' Constitutional changes require a supermajority.'}
          </p>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isPending || isConfirming || !title.trim() || !description.trim()}
        className="w-full py-4 rounded-md bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold transition-all duration-200 shadow-[0_0_24px_rgba(201,169,110,0.2)] hover:shadow-[0_0_32px_rgba(201,169,110,0.35)] min-h-[52px]"
      >
        {isPending ? ' Confirm in Wallet...' :
         isConfirming ? ' Submitting On-Chain...' :
         'Submit Proposal'}
      </button>

      <div className="glass-card rounded-lg hover-lift p-6 border-l-2 border-l-[#c9a96e]/40 bg-[#1a1a1a]/40">
        <h4 className="text-sm font-bold text-[#e8d5a3] mb-3">What happens next?</h4>
        <ol className="text-xs text-gray-400 space-y-2 list-decimal list-inside leading-relaxed">
          <li>Proposal enters <strong className="text-gray-300">Pending</strong> state (1-day review period)</li>
          <li>Voting opens for <strong className="text-gray-300">7 days</strong></li>
          <li>If quorum + threshold met → <strong className="text-gray-300">Succeeded</strong></li>
          <li>Queue in Timelock (2–7 day delay based on category)</li>
          <li>Execute → changes take effect on-chain</li>
        </ol>
      </div>
    </div>
  );
}

// ─── Simple markdown preview ──────────────────────────────────────────────────

function MarkdownPreview({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return <h2 key={i} className="text-base font-bold text-gray-200 mt-3">{line.slice(3)}</h2>;
        if (line.startsWith('# ')) return <h1 key={i} className="text-lg font-bold text-gray-100 mt-2">{line.slice(2)}</h1>;
        if (line.startsWith('- ')) return <li key={i} className="text-gray-300 ml-4 list-disc">{line.slice(2)}</li>;
        if (line.trim() === '') return <br key={i} />;
        return <p key={i} className="text-gray-300 text-sm leading-relaxed">{line}</p>;
      })}
    </div>
  );
}
