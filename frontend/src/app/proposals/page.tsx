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

export default function ProposalsPage() {
  const { isConnected } = useAccount();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">Governance</p>
          <h1 className="text-3xl font-extrabold tracking-tight">Proposals</h1>
          <p className="text-base text-gray-400 mt-2 font-medium">
            Create, vote, and execute community governance proposals
          </p>
        </div>
        {isConnected && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-5 py-3 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] active:scale-95 text-sm font-bold transition-all duration-200 shrink-0 shadow-[0_0_20px_rgba(201,169,110,0.25)] min-h-[44px]"
          >
            {showCreate ? '← Back to Proposals' : '+ New Proposal'}
          </button>
        )}
      </div>

      {!isConnected ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="text-5xl mb-2">🗳️</div>
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

function ProposalsDashboard() {
  const { activeProposalCount, votingDelay, votingPeriod } = useGovernorSettings();

  return (
    <div className="space-y-8">
      {/* Governance Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 page-enter page-enter-delay-1">
        {[
          { value: activeProposalCount, label: 'Active Proposals', color: 'text-[#c9a96e]' },
          { value: `${Math.round(votingDelay / 86400)}d`, label: 'Voting Delay', color: 'text-blue-400' },
          { value: `${Math.round(votingPeriod / 86400)}d`, label: 'Voting Period', color: 'text-green-400' },
          { value: '4', label: 'Categories', color: 'text-amber-400' },
        ].map(({ value, label, color }) => (
          <div key={label} className="glass-card rounded-2xl hover-lift p-6">
            <p className={`text-3xl font-extrabold ${color} mb-1`}>{value}</p>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </div>

      {/* Category Guide — colored left borders */}
      <div className="page-enter page-enter-delay-2">
        <h2 className="text-lg font-bold text-gray-200 mb-4">Proposal Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CATEGORIES.map((cat, i) => {
            const borderColors = [
              'border-l-[#c9a96e]/60',
              'border-l-blue-500/60',
              'border-l-green-500/60',
              'border-l-amber-500/60',
            ];
            const bgColors = [
              'bg-[#c9a96e]/5',
              'bg-blue-500/5',
              'bg-green-500/5',
              'bg-amber-500/5',
            ];
            return (
              <div
                key={cat.value}
                className={`glass-card rounded-2xl hover-lift p-6 border-l-2 ${borderColors[i % 4]} ${bgColors[i % 4]}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">{cat.icon}</span>
                  <h3 className="font-bold text-base text-gray-100">{cat.label}</h3>
                </div>
                <div className="flex gap-4 text-xs text-gray-400">
                  <span>
                    Quorum: <span className="text-gray-200 font-semibold">{cat.quorum}</span>
                  </span>
                  <span>
                    Pass: <span className="text-gray-200 font-semibold">{cat.threshold}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Proposals Empty State */}
      <div className="glass-card rounded-2xl hover-lift p-14 text-center page-enter page-enter-delay-3">
        <div className="w-20 h-20 rounded-2xl bg-[#c9a96e]/10 border border-[#c9a96e]/20 flex items-center justify-center text-4xl mx-auto mb-6">
          🗳️
        </div>
        <h3 className="text-xl font-bold mb-3">No proposals yet</h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed mb-8">
          Any homeowner with a Property NFT can submit a proposal.
          Once submitted, the community votes over a 7-day period.
        </p>

        {/* Lifecycle timeline */}
        <div className="max-w-lg mx-auto">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-4">Proposal Lifecycle</p>
          <div className="relative flex items-center justify-between">
            {/* Connecting line */}
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

          {/* Voting options */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className="text-xs px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 font-semibold">
              👍 For
            </span>
            <span className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 font-semibold">
              👎 Against
            </span>
            <span className="text-xs px-3 py-1.5 rounded-lg bg-gray-500/10 text-gray-400 border border-gray-500/20 font-semibold">
              🤷 Abstain
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
      <div className="glass-card rounded-2xl hover-lift p-12 text-center border-l-2 border-l-amber-500/40">
        <div className="text-5xl mb-4">🏠</div>
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
      <div className="glass-card-success rounded-2xl p-12 text-center border-l-2 border-l-green-500/50 pulse-glow-green">
        <div className="w-16 h-16 rounded-2xl bg-green-500/15 border border-green-500/25 flex items-center justify-center text-3xl mx-auto mb-6">
          ✅
        </div>
        <h3 className="text-2xl font-extrabold text-green-400 mb-3">Proposal Submitted!</h3>
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
            View transaction →
          </a>
        )}
        <button
          onClick={onClose}
          className="block mx-auto mt-6 px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm font-semibold transition-colors min-h-[44px]"
        >
          Back to Proposals
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Form */}
      <div className="glass-card rounded-2xl hover-lift p-8 space-y-6">
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
            className="w-full px-4 py-3.5 rounded-xl bg-gray-900/60 border border-gray-700/60 text-sm placeholder-gray-600 focus:border-[#c9a96e]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a96e]/20 transition-all text-gray-100"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this proposal does, why it matters, and what changes when it passes..."
            rows={6}
            className="w-full px-4 py-3.5 rounded-xl bg-gray-900/60 border border-gray-700/60 text-sm placeholder-gray-600 focus:border-[#c9a96e]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a96e]/20 transition-all resize-none text-gray-100"
          />
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
                'border-green-500/50 bg-green-500/10',
                'border-amber-500/50 bg-amber-500/10',
              ];
              const activeBorders = [
                'border-[#c9a96e]/70',
                'border-blue-400/70',
                'border-green-400/70',
                'border-amber-400/70',
              ];
              return (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 min-h-[44px] ${
                    category === cat.value
                      ? `${borderColors[i % 4]} ${activeBorders[i % 4]} shadow-sm`
                      : 'border-gray-700/60 bg-gray-800/30 hover:border-gray-600/60'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-base">{cat.icon}</span>
                    <span className="text-sm font-bold text-gray-100">{cat.label}</span>
                    {category === cat.value && (
                      <span className="ml-auto text-xs text-green-400">✓</span>
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
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isPending || isConfirming || !title.trim() || !description.trim()}
        className="w-full py-4 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold transition-all duration-200 shadow-[0_0_24px_rgba(201,169,110,0.2)] hover:shadow-[0_0_32px_rgba(201,169,110,0.35)] min-h-[52px]"
      >
        {isPending ? '⏳ Confirm in Wallet...' :
         isConfirming ? '⛓️ Submitting On-Chain...' :
         'Submit Proposal'}
      </button>

      {/* Info */}
      <div className="glass-card rounded-2xl hover-lift p-6 border-l-2 border-l-[#c9a96e]/40 bg-[#1a1a1a]/40">
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
