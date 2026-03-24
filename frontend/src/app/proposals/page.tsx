'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useProperty } from '@/hooks/useProperty';
import {
  useGovernorSettings,
  useProposeWithCategory,
  useCastVote,
  useProposalState,
  useProposalVotes,
  useProposalQuorum,
  useProposalCategory,
  CATEGORIES,
  PROPOSAL_STATES,
  STATE_COLORS,
} from '@/hooks/useProposals';

export default function ProposalsPage() {
  const { isConnected } = useAccount();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Proposals</h1>
          <p className="text-sm text-gray-400 mt-1">
            Create, vote, and execute community governance proposals
          </p>
        </div>
        {isConnected && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-sm font-medium transition-colors shrink-0"
          >
            {showCreate ? '← Back' : '+ New Proposal'}
          </button>
        )}
      </div>

      {!isConnected ? (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-gray-400 mb-4">Sign in to participate in governance</p>
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
    <div className="space-y-6">
      {/* Governance Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/50">
          <p className="text-2xl font-bold text-purple-400">{activeProposalCount}</p>
          <p className="text-xs text-gray-500">Active Proposals</p>
        </div>
        <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/50">
          <p className="text-2xl font-bold text-blue-400">{Math.round(votingDelay / 86400)}d</p>
          <p className="text-xs text-gray-500">Voting Delay</p>
        </div>
        <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/50">
          <p className="text-2xl font-bold text-green-400">{Math.round(votingPeriod / 86400)}d</p>
          <p className="text-xs text-gray-500">Voting Period</p>
        </div>
        <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/50">
          <p className="text-2xl font-bold text-amber-400">4</p>
          <p className="text-xs text-gray-500">Categories</p>
        </div>
      </div>

      {/* Category Guide */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CATEGORIES.map((cat) => (
          <div key={cat.value} className="p-4 rounded-xl border border-gray-800 bg-gray-900/50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{cat.icon}</span>
              <h3 className="font-medium text-sm">{cat.label}</h3>
            </div>
            <div className="flex gap-3 text-xs text-gray-400">
              <span>Quorum: <span className="text-gray-200">{cat.quorum}</span></span>
              <span>Pass: <span className="text-gray-200">{cat.threshold}</span></span>
            </div>
          </div>
        ))}
      </div>

      {/* Proposals List (empty for now — needs event indexing) */}
      <div className="p-12 rounded-xl border border-gray-800 bg-gray-900/50 text-center">
        <div className="text-5xl mb-4">🗳️</div>
        <h3 className="text-lg font-medium mb-2">No proposals yet</h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto mb-4">
          Any homeowner with a Property NFT can submit a proposal.
          Once submitted, the community votes over a 7-day period.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto mt-6">
          <div className="p-3 rounded-lg bg-gray-800/50 text-left">
            <p className="text-xs text-gray-400">Proposal lifecycle:</p>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {['Pending', 'Active', 'Succeeded', 'Queued', 'Executed'].map((s, i) => (
                <span key={s}>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded bg-${STATE_COLORS[s]}-500/10 text-${STATE_COLORS[s]}-400`}>
                    {s}
                  </span>
                  {i < 4 && <span className="text-gray-600 mx-0.5">→</span>}
                </span>
              ))}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-gray-800/50 text-left">
            <p className="text-xs text-gray-400">Voting options:</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-400">👍 For</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-400">👎 Against</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-gray-500/10 text-gray-400">🤷 Abstain</span>
            </div>
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
      <div className="p-8 rounded-xl border border-gray-800 bg-gray-900/50 text-center">
        <p className="text-4xl mb-4">🏠</p>
        <h3 className="text-lg font-medium mb-2">Property Required</h3>
        <p className="text-sm text-gray-400">
          You need a Property NFT (at least 1 vote) to create proposals.
        </p>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) return;

    const fullDescription = `# ${title}\n\n${description}`;

    // Simple no-op proposal for now (calls getDocumentCount on DocRegistry)
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
      <div className="p-8 rounded-xl border border-green-900/50 bg-green-950/20 text-center">
        <p className="text-4xl mb-4">✅</p>
        <h3 className="text-lg font-medium text-green-400 mb-2">Proposal Submitted!</h3>
        <p className="text-sm text-gray-400 mb-4">
          Your proposal is now in the Pending state. Voting opens after the 1-day delay.
        </p>
        {hash && (
          <a
            href={`https://sepolia.basescan.org/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-400 hover:underline font-mono"
          >
            View transaction →
          </a>
        )}
        <button
          onClick={onClose}
          className="block mx-auto mt-4 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm transition-colors"
        >
          Back to Proposals
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Proposal Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Hire new landscaping company for Q2"
            className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm placeholder-gray-500 focus:border-purple-500/50 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this proposal does, why it matters, and what changes when it passes..."
            rows={5}
            className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm placeholder-gray-500 focus:border-purple-500/50 focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Category</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  category === cat.value
                    ? 'border-purple-500/50 bg-purple-950/20'
                    : 'border-gray-800 bg-gray-800/30 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span className="text-sm font-medium">{cat.label}</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  Quorum {cat.quorum} · Pass {cat.threshold}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isPending || isConfirming || !title.trim() || !description.trim()}
        className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
      >
        {isPending ? '⏳ Confirm in Wallet...' :
         isConfirming ? '⛓️ Submitting On-Chain...' :
         'Submit Proposal'}
      </button>

      <div className="p-4 rounded-lg bg-purple-950/20 border border-purple-900/30">
        <h4 className="text-xs font-medium text-purple-400 mb-1">What happens next?</h4>
        <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
          <li>Proposal enters <strong>Pending</strong> state (1-day review period)</li>
          <li>Voting opens for <strong>7 days</strong></li>
          <li>If quorum + threshold met → <strong>Succeeded</strong></li>
          <li>Queue in Timelock (2-7 day delay based on category)</li>
          <li>Execute → changes take effect on-chain</li>
        </ol>
      </div>
    </div>
  );
}

// Need to import useContracts for the propose function
import { useContracts } from '@/hooks/useContracts';
