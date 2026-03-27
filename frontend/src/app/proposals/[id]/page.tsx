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
  useProposalEta,
  useHasVoted,
  useCastVote,
  useQueueProposal,
  useExecuteProposal,
  useProposalEvents,
  PROPOSAL_STATES,
} from '@/hooks/useProposals';
import { useProperty } from '@/hooks/useProperty';
import { useState, useMemo } from 'react';
import { ProposalTimeline } from '@/components/ProposalTimeline';

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

export default function ProposalDetailPage() {
  const params = useParams();
  const proposalId = params.id ? BigInt(params.id as string) : undefined;
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 mb-4">Sign in to view and vote on proposals</p>
        <ConnectButton label="Sign In" />
      </div>
    );
  }

  if (!proposalId) {
    return <div className="text-center py-12 text-gray-500">Invalid proposal ID</div>;
  }

  return <ProposalDetail proposalId={proposalId} />;
}

function ProposalDetail({ proposalId }: { proposalId: bigint }) {
  const { governor } = useContracts();
  const { stateLabel, stateColor } = useProposalState(proposalId);
  const { against, forVotes, abstain, total: totalVotes } = useProposalVotes(proposalId);
  const quorumRequired = useProposalQuorum(proposalId);
  const category = useProposalCategory(proposalId);
  const eta = useProposalEta(proposalId);
  const hasVoted = useHasVoted(proposalId);
  const { hasProperty, votes } = useProperty();

  const { castVote, isPending: castPending, isConfirming: castConfirming, isSuccess: castSuccess, hash: castHash } = useCastVote();
  const { queueProposal, isPending: queuePending, isConfirming: queueConfirming, isSuccess: queueSuccess, hash: queueHash } = useQueueProposal();
  const { executeProposal, isPending: execPending, isConfirming: execConfirming, isSuccess: execSuccess, hash: execHash } = useExecuteProposal();

  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [voteReason, setVoteReason] = useState('');

  // Get proposal event data to reconstruct targets/values/calldatas for queue/execute
  const { proposals } = useProposalEvents();
  const proposalEvent = useMemo(
    () => proposals.find((p) => p.proposalId === proposalId),
    [proposals, proposalId],
  );

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
  const isSucceeded = stateLabel === 'Succeeded';
  const isQueued = stateLabel === 'Queued';
  const forPercent = totalVotes > 0 ? (forVotes / totalVotes) * 100 : 0;
  const againstPercent = totalVotes > 0 ? (against / totalVotes) * 100 : 0;
  const abstainPercent = totalVotes > 0 ? (abstain / totalVotes) * 100 : 0;
  const quorumPercent = quorumRequired > 0 ? Math.min((totalVotes / quorumRequired) * 100, 100) : 100;

  const deadlineDate = proposalDeadline ? new Date(Number(proposalDeadline) * 1000) : null;
  const snapshotDate = proposalSnapshot ? new Date(Number(proposalSnapshot) * 1000) : null;
  const etaDate = eta ? new Date(eta * 1000) : null;

  // Countdown to eta
  const now = Math.floor(Date.now() / 1000);
  const etaCountdown = eta > now ? eta - now : 0;
  const countdownStr = etaCountdown > 0
    ? etaCountdown > 86400
      ? `${Math.floor(etaCountdown / 86400)}d ${Math.floor((etaCountdown % 86400) / 3600)}h remaining`
      : etaCountdown > 3600
      ? `${Math.floor(etaCountdown / 3600)}h ${Math.floor((etaCountdown % 3600) / 60)}m remaining`
      : `${Math.floor(etaCountdown / 60)}m remaining`
    : null;

  // Extract title from description
  const description = proposalEvent?.description || '';
  const firstLine = description.split('\n')[0];
  const title = firstLine.startsWith('# ') ? firstLine.slice(2) : firstLine.slice(0, 80) || `Proposal #${proposalId.toString().slice(0, 8)}`;

  const handleCastVote = () => {
    if (selectedVote !== null) {
      castVote(proposalId, selectedVote, voteReason || undefined);
    }
  };

  const handleQueue = () => {
    if (!proposalEvent) return;
    queueProposal(
      proposalEvent.targets,
      proposalEvent.values,
      proposalEvent.calldatas,
      proposalEvent.description,
    );
  };

  const handleExecute = () => {
    if (!proposalEvent) return;
    executeProposal(
      proposalEvent.targets,
      proposalEvent.values,
      proposalEvent.calldatas,
      proposalEvent.description,
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 page-enter">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 flex-wrap mb-3">
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${style.bg} ${style.color} ${style.border}`}>
            {stateLabel || 'Loading...'}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#c9a96e]/10 text-[#c9a96e] border border-[#c9a96e]/20">
            {category.icon} {category.label}
          </span>
          <span className="text-xs text-gray-500">
            Quorum: {category.quorum} · Pass: {category.threshold}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{title}</h1>
        <p className="text-sm text-gray-400 font-mono break-all">
          ID: {proposalId.toString()}
        </p>
        {proposalEvent && (
          <p className="text-xs text-gray-600 mt-1">
            Proposed by {proposalEvent.proposer.slice(0, 6)}…{proposalEvent.proposer.slice(-4)}
          </p>
        )}
      </div>

      {/* Vote Results */}
      <div className="glass-card rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Vote Results</h2>
        <div className="space-y-4 mb-6">
          <VoteBar label="For" count={forVotes} percent={forPercent} color="green" icon="👍" />
          <VoteBar label="Against" count={against} percent={againstPercent} color="red" icon="👎" />
          <VoteBar label="Abstain" count={abstain} percent={abstainPercent} color="gray" icon="🤷" />
        </div>
        {/* Quorum progress */}
        <div className="pt-4 border-t border-white/5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-400">Quorum Progress</span>
            <span className={quorumPercent >= 100 ? 'text-green-400' : 'text-gray-400'}>
              {totalVotes} / {quorumRequired} votes ({quorumPercent.toFixed(0)}%)
              {quorumPercent >= 100 && ' ✅'}
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${quorumPercent >= 100 ? 'bg-green-500' : 'bg-[#c9a96e]/80'}`}
              style={{ width: `${Math.min(quorumPercent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Cast Vote */}
      {isActive && hasProperty && (
        <div className="glass-card rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-1">Cast Your Vote</h2>

          {hasVoted ? (
            <div className="p-4 rounded-xl bg-[#c9a96e]/10 border border-[#c9a96e]/20 text-center mt-4">
              <p className="text-[#c9a96e] font-semibold">✅ You have already voted on this proposal</p>
            </div>
          ) : castSuccess ? (
            <div className="p-4 rounded-xl bg-green-950/20 border border-green-900/50 text-center mt-4">
              <p className="text-green-400 font-medium">✅ Vote submitted!</p>
              {castHash && (
                <a
                  href={`https://sepolia.basescan.org/tx/${castHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#c9a96e] hover:underline font-mono mt-2 block"
                >
                  View on BaseScan →
                </a>
              )}
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-400 mb-4">
                You have <span className="text-[#c9a96e] font-bold">{votes}</span> vote{votes !== 1 ? 's' : ''}.
                Choose your position:
              </p>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { value: 1, label: 'For', icon: '👍', borderActive: 'border-green-500/50 bg-green-950/30 ring-1 ring-green-500/30' },
                  { value: 0, label: 'Against', icon: '👎', borderActive: 'border-red-500/50 bg-red-950/30 ring-1 ring-red-500/30' },
                  { value: 2, label: 'Abstain', icon: '🤷', borderActive: 'border-gray-500/50 bg-gray-800/60 ring-1 ring-gray-500/30' },
                ].map(({ value, label, icon, borderActive }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedVote(value)}
                    className={`p-4 rounded-xl border text-center transition-all min-h-[44px] ${
                      selectedVote === value
                        ? borderActive
                        : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{icon}</span>
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>

              {/* Optional reason */}
              <div className="mb-4">
                <label className="block text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">
                  Reason <span className="text-gray-600 normal-case font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={voteReason}
                  onChange={(e) => setVoteReason(e.target.value)}
                  placeholder="Why are you voting this way? (stored on-chain)"
                  className="w-full px-4 py-3 rounded-xl bg-gray-900/60 border border-gray-700/60 text-sm placeholder-gray-600 focus:border-[#c9a96e]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a96e]/20 transition-all text-gray-100"
                />
              </div>

              <button
                onClick={handleCastVote}
                disabled={selectedVote === null || castPending || castConfirming}
                className="w-full py-3 rounded-xl bg-[#c9a96e] hover:bg-[#e8d5a3] text-[#1a1a1a] disabled:opacity-50 text-sm font-bold transition-all min-h-[44px]"
              >
                {castPending ? '⏳ Confirm in Wallet...' :
                 castConfirming ? '⛓️ Submitting Vote...' :
                 selectedVote === null ? 'Select your vote above' :
                 `Submit Vote: ${['Against', 'For', 'Abstain'][selectedVote]}`}
              </button>
            </>
          )}
        </div>
      )}

      {/* Queue for Execution */}
      {isSucceeded && (
        <div className="glass-card rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2">Queue for Execution</h2>
          <p className="text-sm text-gray-400 mb-4">
            This proposal passed. Queue it to the timelock before it can be executed.
          </p>
          {queueSuccess ? (
            <div className="p-4 rounded-xl bg-green-950/20 border border-green-900/50 text-center">
              <p className="text-green-400 font-medium">✅ Queued in timelock!</p>
              {queueHash && (
                <a href={`https://sepolia.basescan.org/tx/${queueHash}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-[#c9a96e] hover:underline font-mono mt-2 block">
                  View on BaseScan →
                </a>
              )}
            </div>
          ) : (
            <button
              onClick={handleQueue}
              disabled={queuePending || queueConfirming || !proposalEvent}
              className="w-full py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 disabled:opacity-50 text-sm font-bold transition-all min-h-[44px]"
            >
              {queuePending ? '⏳ Confirm in Wallet...' :
               queueConfirming ? '⛓️ Queuing...' :
               '⏱️ Queue for Execution'}
            </button>
          )}
        </div>
      )}

      {/* Execute */}
      {isQueued && (
        <div className="glass-card rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2">Execute Proposal</h2>
          {countdownStr ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
              <p className="text-amber-300 text-sm font-semibold">⏱️ Timelock: {countdownStr}</p>
              {etaDate && (
                <p className="text-xs text-gray-500 mt-1">Executable after {etaDate.toLocaleString()}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 mb-4">
              Timelock delay has passed. This proposal is ready to execute.
            </p>
          )}
          {execSuccess ? (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/50 text-center">
              <p className="text-emerald-400 font-medium text-lg">🎉 Proposal Executed!</p>
              {execHash && (
                <a href={`https://sepolia.basescan.org/tx/${execHash}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-[#c9a96e] hover:underline font-mono mt-2 block">
                  View on BaseScan →
                </a>
              )}
            </div>
          ) : (
            <button
              onClick={handleExecute}
              disabled={execPending || execConfirming || !proposalEvent || !!countdownStr}
              className="w-full py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold transition-all min-h-[44px]"
            >
              {execPending ? '⏳ Confirm in Wallet...' :
               execConfirming ? '⛓️ Executing...' :
               countdownStr ? `🔒 Locked — ${countdownStr}` :
               '🚀 Execute Proposal'}
            </button>
          )}
        </div>
      )}

      {/* Not active/actionable info messages */}
      {!isActive && !isSucceeded && !isQueued && stateLabel && (
        <div className="glass-card rounded-xl p-6 mb-6 text-center">
          <p className="text-gray-400">
            {stateLabel === 'Pending' && '⏳ Voting opens after the 1-day delay period'}
            {stateLabel === 'Executed' && '🎉 This proposal has been executed on-chain!'}
            {stateLabel === 'Defeated' && '❌ This proposal was defeated'}
            {stateLabel === 'Canceled' && '🚫 This proposal was canceled'}
            {stateLabel === 'Expired' && '⏰ This proposal expired without execution'}
          </p>
        </div>
      )}

      {/* Timeline */}
      {stateLabel && (
        <div className="mb-6">
          <ProposalTimeline currentState={stateLabel} />
        </div>
      )}

      {/* Description */}
      {description && (
        <div className="glass-card rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Proposal Description</h2>
          <DescriptionContent text={description} />
        </div>
      )}

      {/* Key Dates */}
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
            label="Timelock ETA"
            value={etaDate ? etaDate.toLocaleString() : '—'}
            description="Earliest execution time after queuing"
            active={stateLabel === 'Queued' || stateLabel === 'Executed'}
          />
          <TimelineItem
            label="Execution"
            value={stateLabel === 'Executed' ? '✅ Done' : 'Pending'}
            description="After timelock delay (2-7 days based on category)"
            active={stateLabel === 'Executed'}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function VoteBar({ label, count, percent, color, icon }: {
  label: string; count: number; percent: number; color: string; icon: string;
}) {
  const colorClass = color === 'green' ? 'bg-green-500' : color === 'red' ? 'bg-red-500' : 'bg-gray-500';
  const textClass = color === 'green' ? 'text-green-400' : color === 'red' ? 'text-red-400' : 'text-gray-400';

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className={`font-medium ${textClass}`}>{icon} {label}</span>
        <span className="text-gray-400">{count} vote{count !== 1 ? 's' : ''} ({percent.toFixed(1)}%)</span>
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
      <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${active ? 'bg-[#c9a96e]/80' : 'bg-gray-700'}`} />
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-gray-500">{value}</span>
        </div>
        <p className="text-[10px] text-gray-500">{description}</p>
      </div>
    </div>
  );
}

function DescriptionContent({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return <h2 key={i} className="text-base font-bold text-gray-200 mt-3 mb-1">{line.slice(3)}</h2>;
        if (line.startsWith('# ')) return <h1 key={i} className="text-lg font-bold text-gray-100 mt-2 mb-1">{line.slice(2)}</h1>;
        if (line.startsWith('- ')) return <li key={i} className="text-gray-300 text-sm ml-4 list-disc">{line.slice(2)}</li>;
        if (line.trim() === '') return <br key={i} />;
        return <p key={i} className="text-gray-300 text-sm leading-relaxed">{line}</p>;
      })}
    </div>
  );
}
