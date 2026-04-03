'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useProperty } from '@/hooks/useProperty';
import { useContracts } from '@/hooks/useContracts';
import {
  useGovernorSettings,
  useProposeWithCategory,
  CATEGORIES,
  STATE_COLORS,
} from '@/hooks/useProposals';
import { ProposalTemplates } from '@/components/ProposalTemplates';
import { Vote as VoteIcon, ChevronLeft } from 'lucide-react';

export default function ProposalsPage() {
  const { isConnected } = useAccount();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-1">Governance</p>
          <h1 className="text-3xl sm:text-4xl font-medium gradient-text">Proposals</h1>
          <p className="text-sm text-[var(--text-muted)] mt-2">
            Create, vote, and execute community governance proposals
          </p>
        </div>
        {isConnected && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="btn-primary px-5 py-3 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[#0C0C0E] active:scale-95 text-sm font-medium transition-all duration-200 shrink-0 min-h-[44px]"
          >
            {showCreate ? 'Back to Proposals' : '+ New Proposal'}
          </button>
        )}
      </div>

      {!isConnected ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <VoteIcon className="w-8 h-8 opacity-20 mb-2" />
          <p className="text-[var(--text-disabled)] text-base">Sign in to participate in governance</p>
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

function ProposalsDashboard() {
  const { activeProposalCount, votingDelay, votingPeriod } = useGovernorSettings();

  return (
    <div className="space-y-8">
      {/* Governance Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 card-enter card-enter-delay-1">
        {[
          { value: activeProposalCount, label: 'Active Proposals', color: 'text-[#B09B71]' },
          { value: `${Math.round(votingDelay / 86400)}d`, label: 'Voting Delay', color: 'text-[var(--text-body)]' },
          { value: `${Math.round(votingPeriod / 86400)}d`, label: 'Voting Period', color: 'text-[var(--text-body)]' },
          { value: '4', label: 'Categories', color: 'text-[var(--text-body)]' },
        ].map(({ value, label, color }) => (
          <div key={label} className="glass-card rounded-xl p-6">
            <p className={`text-3xl font-normal ${color} mb-1 number-reveal`}>{value}</p>
            <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)]">{label}</p>
          </div>
        ))}
      </div>

      {/* Category Guide */}
      <div className="card-enter card-enter-delay-2">
        <h2 className="text-lg font-normal text-[var(--text-body)] mb-4">Proposal Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CATEGORIES.map((cat, i) => {
            return (
              <div
                key={cat.value}
                className="glass-card rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="font-normal text-base text-[var(--parchment)]">{cat.label}</h3>
                </div>
                <div className="flex gap-4 text-xs text-[var(--text-disabled)]">
                  <span>
                    Quorum: <span className="text-[var(--text-body)]">{cat.quorum}</span>
                  </span>
                  <span>
                    Pass: <span className="text-[var(--text-body)]">{cat.threshold}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Proposals Empty State */}
      <div className="glass-card rounded-xl p-14 text-center card-enter card-enter-delay-3">
        <div className="w-20 h-20 rounded-xl bg-[rgba(176,155,113,0.08)] flex items-center justify-center mx-auto mb-6">
          <VoteIcon className="w-8 h-8 text-[#B09B71] opacity-40" />
        </div>
        <h3 className="text-xl font-normal mb-3 text-[var(--parchment)]">No proposals yet</h3>
        <p className="text-sm text-[var(--text-disabled)] max-w-md mx-auto leading-relaxed mb-8">
          Any homeowner with a verified property record can submit a proposal.
          Once submitted, the community votes over a 7-day period.
        </p>

        {/* Lifecycle timeline */}
        <div className="max-w-lg mx-auto">
          <p className="text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-4">Proposal Lifecycle</p>
          <div className="relative flex items-center justify-between">
            <div className="absolute left-[10%] right-[10%] top-4 h-px bg-gradient-to-r from-[rgba(176,155,113,0.10)] via-[rgba(176,155,113,0.25)] to-[rgba(176,155,113,0.10)]" />

            {['Pending', 'Active', 'Succeeded', 'Queued', 'Executed'].map((s, i) => {
              const stateColorMap: Record<string, string> = {
                Pending: 'text-[var(--text-disabled)] border-[var(--border-default)] bg-[rgba(245,240,232,0.04)]',
                Active: 'text-[var(--steel)] border-[rgba(90,122,154,0.30)] bg-[rgba(90,122,154,0.08)]',
                Succeeded: 'text-[#3A7D6F] border-[rgba(58,125,111,0.30)] bg-[rgba(58,125,111,0.08)]',
                Queued: 'text-[#B09B71] border-[rgba(176,155,113,0.30)] bg-[rgba(176,155,113,0.08)]',
                Executed: 'text-[#B09B71] border-[rgba(176,155,113,0.40)] bg-[rgba(176,155,113,0.10)]',
              };
              return (
                <div key={s} className="flex flex-col items-center gap-2 relative z-10">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs ${stateColorMap[s]}`}>
                    {i + 1}
                  </div>
                  <span className={`text-[10px] ${stateColorMap[s].split(' ')[0]}`}>{s}</span>
                </div>
              );
            })}
          </div>

          {/* Voting options */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className="text-xs px-3 py-1.5 rounded-lg bg-[rgba(42,93,79,0.10)] text-[#3A7D6F] border border-[rgba(42,93,79,0.20)]">
              For
            </span>
            <span className="text-xs px-3 py-1.5 rounded-lg bg-[rgba(107,58,58,0.10)] text-[#8B5A5A] border border-[rgba(107,58,58,0.20)]">
              Against
            </span>
            <span className="text-xs px-3 py-1.5 rounded-lg bg-[rgba(245,240,232,0.04)] text-[var(--text-disabled)] border border-[var(--border-default)]">
              Abstain
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateProposal({ onClose }: { onClose: () => void }) {
  const { hasProperty } = useProperty();
  const { propose, isPending, isConfirming, isSuccess, hash } = useProposeWithCategory();
  const { documentRegistry } = useContracts();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(0);

  if (!hasProperty) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <VoteIcon className="w-8 h-8 text-[#B09B71] opacity-40 mx-auto mb-4" />
        <h3 className="text-xl font-normal mb-3 text-[var(--parchment)]">Property Required</h3>
        <p className="text-sm text-[var(--text-disabled)] max-w-sm mx-auto">
          You need a verified property record (at least 1 vote) to create proposals.
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
      <div className="glass-card-success rounded-xl p-12 text-center pulse-glow-green">
        <div className="w-16 h-16 rounded-xl bg-[rgba(42,93,79,0.12)] border border-[rgba(42,93,79,0.20)] flex items-center justify-center mx-auto mb-6">
          <VoteIcon className="w-7 h-7 text-[#3A7D6F]" />
        </div>
        <h3 className="text-2xl font-normal text-[#3A7D6F] mb-3">Proposal Submitted</h3>
        <p className="text-sm text-[var(--text-disabled)] mb-6 max-w-sm mx-auto">
          Your proposal is in <strong className="text-[var(--text-body)]">Pending</strong> state. Voting opens after the 1-day review period.
        </p>
        {hash && (
          <a
            href={`https://sepolia.basescan.org/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#B09B71] hover:underline font-mono"
          >
            View transaction
          </a>
        )}
        <button
          onClick={onClose}
          className="block mx-auto mt-6 px-5 py-2.5 rounded-xl bg-[rgba(245,240,232,0.06)] hover:bg-[rgba(245,240,232,0.10)] text-sm transition-colors min-h-[44px]"
        >
          Back to Proposals
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Templates */}
      <ProposalTemplates onUseTemplate={({ title: t, description: d, category: c }) => {
        setTitle(t);
        setDescription(d);
        setCategory(c);
      }} />

      {/* Form */}
      <div className="glass-card rounded-xl p-8 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-2">
            Proposal Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Hire new landscaping company for Q2"
            className="w-full px-4 py-3.5 rounded-xl bg-[rgba(245,240,232,0.03)] border border-[var(--border-default)] text-sm placeholder-[rgba(245,240,232,0.20)] focus:border-[rgba(176,155,113,0.40)] focus:outline-none focus:ring-1 focus:ring-[rgba(176,155,113,0.15)] transition-all text-[var(--parchment)]"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this proposal does, why it matters, and what changes when it passes..."
            rows={6}
            className="w-full px-4 py-3.5 rounded-xl bg-[rgba(245,240,232,0.03)] border border-[var(--border-default)] text-sm placeholder-[rgba(245,240,232,0.20)] focus:border-[rgba(176,155,113,0.40)] focus:outline-none focus:ring-1 focus:ring-[rgba(176,155,113,0.15)] transition-all resize-none text-[var(--parchment)]"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs tracking-widest uppercase text-[var(--text-disabled)] mb-3">
            Category
          </label>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat, i) => {
              return (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 min-h-[44px] ${
                    category === cat.value
                      ? 'border-[rgba(176,155,113,0.50)] bg-[rgba(176,155,113,0.08)]'
                      : 'border-[var(--divider)] bg-[rgba(245,240,232,0.02)] hover:border-[var(--border-default)]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-normal text-[var(--parchment)]">{cat.label}</span>
                    {category === cat.value && (
                      <span className="ml-auto text-[10px] text-[#3A7D6F]">selected</span>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--text-disabled)]">
                    Quorum {cat.quorum} · Pass {cat.threshold}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isPending || isConfirming || !title.trim() || !description.trim()}
        className="btn-primary w-full py-4 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[#0C0C0E] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all duration-200 min-h-[52px]"
      >
        {isPending ? 'Confirm in Wallet...' :
         isConfirming ? 'Submitting...' :
         'Submit Proposal'}
      </button>

      {/* Info */}
      <div className="glass-card rounded-xl p-6 bg-[rgba(26,26,26,0.40)]">
        <h4 className="text-sm font-normal text-[var(--text-body)] mb-3">What happens next?</h4>
        <ol className="text-xs text-[var(--text-disabled)] space-y-2 list-decimal list-inside leading-relaxed">
          <li>Proposal enters <span className="text-[var(--text-body)]">Pending</span> state (1-day review period)</li>
          <li>Voting opens for <span className="text-[var(--text-body)]">7 days</span></li>
          <li>If quorum + threshold met → <span className="text-[var(--text-body)]">Succeeded</span></li>
          <li>Queue in Timelock (2–7 day delay based on category)</li>
          <li>Execute → changes take effect</li>
        </ol>
      </div>
    </div>
  );
}
