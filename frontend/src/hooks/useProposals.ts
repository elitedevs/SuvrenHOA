'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useContracts } from './useContracts';

export type ProposalCategory = 'Routine' | 'Financial' | 'Governance' | 'Constitutional';

export const CATEGORIES: { value: number; label: ProposalCategory; quorum: string; threshold: string; color: string; icon: string }[] = [
  { value: 0, label: 'Routine', quorum: '15%', threshold: '>50%', color: 'green', icon: '🔧' },
  { value: 1, label: 'Financial', quorum: '33%', threshold: '>50%', color: 'blue', icon: '💰' },
  { value: 2, label: 'Governance', quorum: '51%', threshold: '>50%', color: 'purple', icon: '⚖️' },
  { value: 3, label: 'Constitutional', quorum: '67%', threshold: '>66.7%', color: 'red', icon: '📜' },
];

export const PROPOSAL_STATES = [
  'Pending', 'Active', 'Canceled', 'Defeated', 'Succeeded', 'Queued', 'Expired', 'Executed',
] as const;

const STATE_COLORS: Record<string, string> = {
  Pending: 'yellow',
  Active: 'blue',
  Canceled: 'gray',
  Defeated: 'red',
  Succeeded: 'green',
  Queued: 'purple',
  Expired: 'gray',
  Executed: 'emerald',
};

export function useProposalState(proposalId: bigint | undefined) {
  const { governor } = useContracts();

  const { data: state } = useReadContract({
    ...governor,
    functionName: 'state',
    args: proposalId !== undefined ? [proposalId] : undefined,
    query: { enabled: proposalId !== undefined, refetchInterval: 30_000 },
  });

  const stateNum = state !== undefined ? Number(state) : undefined;
  const stateLabel = stateNum !== undefined ? PROPOSAL_STATES[stateNum] : undefined;
  const stateColor = stateLabel ? STATE_COLORS[stateLabel] || 'gray' : 'gray';

  return { state: stateNum, stateLabel, stateColor };
}

export function useProposalVotes(proposalId: bigint | undefined) {
  const { governor } = useContracts();

  const { data } = useReadContract({
    ...governor,
    functionName: 'proposalVotes',
    args: proposalId !== undefined ? [proposalId] : undefined,
    query: { enabled: proposalId !== undefined, refetchInterval: 30_000 },
  });

  const votes = data as [bigint, bigint, bigint] | undefined;

  return {
    against: votes ? Number(votes[0]) : 0,
    forVotes: votes ? Number(votes[1]) : 0,
    abstain: votes ? Number(votes[2]) : 0,
    total: votes ? Number(votes[0]) + Number(votes[1]) + Number(votes[2]) : 0,
  };
}

export function useProposalQuorum(proposalId: bigint | undefined) {
  const { governor } = useContracts();

  const { data } = useReadContract({
    ...governor,
    functionName: 'proposalQuorum',
    args: proposalId !== undefined ? [proposalId] : undefined,
    query: { enabled: proposalId !== undefined },
  });

  return data !== undefined ? Number(data) : 0;
}

export function useProposalCategory(proposalId: bigint | undefined) {
  const { governor } = useContracts();

  const { data } = useReadContract({
    ...governor,
    functionName: 'proposalCategories',
    args: proposalId !== undefined ? [proposalId] : undefined,
    query: { enabled: proposalId !== undefined },
  });

  const catNum = data !== undefined ? Number(data) : 0;
  return CATEGORIES[catNum] || CATEGORIES[0];
}

export function useCastVote() {
  const { governor } = useContracts();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const castVote = (proposalId: bigint, support: number) => {
    writeContract({
      ...governor,
      functionName: 'castVote',
      args: [proposalId, support],
    });
  };

  return { castVote, isPending, isConfirming, isSuccess, hash };
}

export function useProposeWithCategory() {
  const { governor } = useContracts();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const propose = (
    targets: `0x${string}`[],
    values: bigint[],
    calldatas: `0x${string}`[],
    description: string,
    category: number,
    metadataUri: string,
  ) => {
    writeContract({
      ...governor,
      functionName: 'proposeWithCategory',
      args: [targets, values, calldatas, description, category, metadataUri],
    });
  };

  return { propose, isPending, isConfirming, isSuccess, hash };
}

export function useGovernorSettings() {
  const { governor } = useContracts();

  const { data: votingDelay } = useReadContract({
    ...governor,
    functionName: 'votingDelay',
  });

  const { data: votingPeriod } = useReadContract({
    ...governor,
    functionName: 'votingPeriod',
  });

  const { data: proposalThreshold } = useReadContract({
    ...governor,
    functionName: 'proposalThreshold',
  });

  const { data: activeCount } = useReadContract({
    ...governor,
    functionName: 'activeProposalCount',
  });

  return {
    votingDelay: votingDelay ? Number(votingDelay) : 86400,
    votingPeriod: votingPeriod ? Number(votingPeriod) : 604800,
    proposalThreshold: proposalThreshold ? Number(proposalThreshold) : 1,
    activeProposalCount: activeCount ? Number(activeCount) : 0,
  };
}

export { STATE_COLORS };
