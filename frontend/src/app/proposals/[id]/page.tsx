'use client';

import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useContracts } from '@/hooks/useContracts';
import { useReadContract } from 'wagmi';
import {
  useProposalState,
  useProposalVotes,
  useProposalQuorum,
  useProposalCategory,
  useCastVote,
  PROPOSAL_STATES,
} from '@/hooks/useProposals';
import { useProperty } from '@/hooks/useProperty';
import { useState } from 'react';
import { ProposalTimeline } from '@/components/ProposalTimeline';

const STATE_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  Pending: { color: 'text-[#B09B71]', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  Active: { color: 'text-[#5A7A9A]', bg: 'bg-[rgba(90,122,154,0.10)]', border: 'border-[rgba(90,122,154,0.20)]' },
  Canceled: { color: 'text-[rgba(245,240,232,0.50)]', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
  Defeated: { color: 'text-[#8B5A5A]', bg: 'bg-[rgba(107,58,58,0.10)]', border: 'border-[rgba(107,58,58,0.20)]' },
  Succeeded: { color: 'text-[#3A7D6F]', bg: 'bg-[rgba(42,93,79,0.10)]', border: 'border-[rgba(42,93,79,0.20)]' },
  Queued: { color: 'text-[#B09B71]', bg: 'bg-[#B09B71]/10', border: 'border-[#B09B71]/20' },
  Expired: { color: 'text-[rgba(245,240,232,0.50)]', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
  Executed: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
};

export default function ProposalDetailPage() {
  const params = useParams();
  const proposalId = params.id && /^\d+$/.test(params.id as string) ? BigInt(params.id as string) : undefined;
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-[rgba(245,240,232,0.50)] mb-4">Sign in to view and vote on proposals</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  if (!proposalId) {
    return <div className="text-center py-12 text-[rgba(245,240,232,0.35)]">Invalid proposal ID</div>;
  }

  return <ProposalDetail proposalId={proposalId} />;
}

function ProposalDetail({ proposalId }: { proposalId: bigint }) {
  const { governor } = useContracts();
  const { stateLabel, stateColor } = useProposalState(proposalId);
  const { against, forVotes, abstain, total } = useProposalVotes(proposalId);
  const quorumRequired = useProposalQuorum(proposalId);
  const category = useProposalCategory(proposalId);
  const { hasProperty, votes } = useProperty();
  const { castVote, isPending, isConfirming, isSuccess, hash } = useCastVote();

  const [selectedVote, setSelectedVote] = useState<number | null>(null);

  // Get proposal description from on-chain metadata
  const { data: metadataUri } = useReadContract({
    ...governor,
    functionName: 'proposalMetadataUri',
    args: [proposalId],
  });

  const { data: proposalSnapshot } = useReadContract({
    ...governor,
    functionName: 'proposalSnapshot',
    args: [proposalId],
  });

  const { data: proposalDeadline } = useReadContract({
    ...governor,
    functionName: 'proposalDeadline',
    args: [proposalId],
  });

  const style = STATE_STYLES[stateLabel || 'Pending'] || STATE_STYLES.Pending;
  const isActive = stateLabel === 'Active';
  const totalVotes = forVotes + against + abstain;
  const forPercent = totalVotes > 0 ? (forVotes / totalVotes) * 100 : 0;
  const againstPercent = totalVotes > 0 ? (against / totalVotes) * 100 : 0;
  const abstainPercent = totalVotes > 0 ? (abstain / totalVotes) * 100 : 0;
  const quorumPercent = quorumRequired > 0 ? Math.min((totalVotes / quorumRequired) * 100, 100) : 100;

  const deadlineDate = proposalDeadline ? new Date(Number(proposalDeadline) * 1000) : null;
  const snapshotDate = proposalSnapshot ? new Date(Number(proposalSnapshot) * 1000) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 flex-wrap mb-3">
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${style.bg} ${style.color} ${style.border}`}>
            {stateLabel || 'Loading...'}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#B09B71]/10 text-[#B09B71] border border-[#B09B71]/20">
            {category.icon} {category.label}
          </span>
          <span className="text-xs text-[rgba(245,240,232,0.35)]">
            Quorum: {category.quorum} · Pass: {category.threshold}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          Proposal #{proposalId.toString().slice(0, 8)}...
        </h1>
        <p className="text-sm text-[rgba(245,240,232,0.50)] font-mono break-all">
          ID: {proposalId.toString()}
        </p>
      </div>

      {/* Vote Results */}
      <div className="glass-card rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Vote Results</h2>

        {/* Vote bars */}
        <div className="space-y-4 mb-6">
          <VoteBar label="For" count={forVotes} percent={forPercent} color="green" icon="" />
          <VoteBar label="Against" count={against} percent={againstPercent} color="red" icon="" />
          <VoteBar label="Abstain" count={abstain} percent={abstainPercent} color="gray" icon="" />
        </div>

        {/* Quorum progress */}
        <div className="pt-4 border-t border-white/5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-[rgba(245,240,232,0.50)]">Quorum Progress</span>
            <span className={quorumPercent >= 100 ? 'text-[#3A7D6F]' : 'text-[rgba(245,240,232,0.50)]'}>
              {totalVotes} / {quorumRequired} votes ({quorumPercent.toFixed(0)}%)
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${quorumPercent >= 100 ? 'bg-[#3A7D6F]' : 'bg-[#B09B71]/80'}`}
              style={{ width: `${Math.min(quorumPercent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Cast Vote */}
      {isActive && hasProperty && (
        <div className="glass-card rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Cast Your Vote</h2>
          <p className="text-sm text-[rgba(245,240,232,0.50)] mb-4">
            You have <span className="text-[#B09B71] font-bold">{votes}</span> vote{votes !== 1 ? 's' : ''}.
            Choose your position:
          </p>

          {isSuccess ? (
            <div className="p-4 rounded-xl bg-green-950/20 border border-green-900/50 text-center">
              <p className="text-[#3A7D6F] font-medium"> Vote submitted!</p>
              {hash && (
                <a href={`https://sepolia.basescan.org/tx/${hash}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-[#B09B71] hover:underline font-mono mt-2 block">
                  View transaction →
                </a>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { value: 1, label: 'For', icon: '', color: 'green' },
                  { value: 0, label: 'Against', icon: '', color: 'red' },
                  { value: 2, label: 'Abstain', icon: '', color: 'gray' },
                ].map(({ value, label, icon, color }) => (
                  <button
                    key={value}
                    onClick={() => setSelectedVote(value)}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      selectedVote === value
                        ? `border-${color}-500/50 bg-${color}-950/30 ring-1 ring-${color}-500/30`
                        : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{icon}</span>
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => selectedVote !== null && castVote(proposalId, selectedVote)}
                disabled={selectedVote === null || isPending || isConfirming}
                className="w-full py-3 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[#1a1a1a] disabled:opacity-50 text-sm font-medium transition-all"
              >
                {isPending ? '⏳ Confirm in Wallet...' :
                 isConfirming ? ' Submitting Vote...' :
                 selectedVote === null ? 'Select your vote above' :
                 `Submit Vote: ${['Against', 'For', 'Abstain'][selectedVote]}`}
              </button>
            </>
          )}
        </div>
      )}

      {/* Not active messages */}
      {!isActive && stateLabel && (
        <div className="glass-card rounded-xl p-6 mb-6 text-center">
          <p className="text-[rgba(245,240,232,0.50)]">
            {stateLabel === 'Pending' && '⏳ Voting opens after the 1-day delay period'}
            {stateLabel === 'Succeeded' && ' This proposal passed! Waiting to be queued.'}
            {stateLabel === 'Queued' && '⏱ In timelock — will be executable after the delay period'}
            {stateLabel === 'Executed' && ' This proposal has been executed!'}
            {stateLabel === 'Defeated' && ' This proposal was defeated'}
            {stateLabel === 'Canceled' && ' This proposal was canceled by the board'}
            {stateLabel === 'Expired' && '⏰ This proposal expired without execution'}
          </p>
        </div>
      )}

      {/* Proposal Lifecycle Timeline */}
      {stateLabel && (
        <div className="mb-6">
          <ProposalTimeline currentState={stateLabel} />
        </div>
      )}

      {/* Dates Timeline */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Key Dates</h2>
        <div className="space-y-4">
          <TimelineItem
            label="Snapshot"
            value={snapshotDate ? snapshotDate.toLocaleString() : '—'}
            description="Voting power captured at this timestamp"
            active
          />
          <TimelineItem
            label="Voting Opens"
            value={snapshotDate ? snapshotDate.toLocaleString() : '—'}
            description="1-day delay after proposal creation"
            active={stateLabel === 'Active' || stateLabel === 'Succeeded' || stateLabel === 'Defeated'}
          />
          <TimelineItem
            label="Voting Closes"
            value={deadlineDate ? deadlineDate.toLocaleString() : '—'}
            description="7-day voting period"
            active={stateLabel === 'Succeeded' || stateLabel === 'Defeated' || stateLabel === 'Queued' || stateLabel === 'Executed'}
          />
          <TimelineItem
            label="Execution"
            value={stateLabel === 'Executed' ? ' Done' : 'Pending'}
            description="After timelock delay (2-7 days based on category)"
            active={stateLabel === 'Executed'}
          />
        </div>
      </div>
    </div>
  );
}

function VoteBar({ label, count, percent, color, icon }: {
  label: string; count: number; percent: number; color: string; icon: string;
}) {
  const colorClass = color === 'green' ? 'bg-[#3A7D6F]' : color === 'red' ? 'bg-[#8B5A5A]' : 'bg-gray-500';
  const textClass = color === 'green' ? 'text-[#3A7D6F]' : color === 'red' ? 'text-[#8B5A5A]' : 'text-[rgba(245,240,232,0.50)]';

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className={`font-medium ${textClass}`}>{icon} {label}</span>
        <span className="text-[rgba(245,240,232,0.50)]">{count} vote{count !== 1 ? 's' : ''} ({percent.toFixed(1)}%)</span>
      </div>
      <div className="h-3 rounded-full bg-gray-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function TimelineItem({ label, value, description, active }: {
  label: string; value: string; description: string; active: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${active ? 'bg-[#B09B71]/80' : 'bg-gray-700'}`} />
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-[rgba(245,240,232,0.35)]">{value}</span>
        </div>
        <p className="text-[10px] text-[rgba(245,240,232,0.35)]">{description}</p>
      </div>
    </div>
  );
}
