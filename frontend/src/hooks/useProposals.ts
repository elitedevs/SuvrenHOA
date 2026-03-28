'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { useContracts } from './useContracts';
import { publicClient, CHAIN_ID } from '@/lib/publicClient';
import { parseAbiItem, keccak256, toBytes } from 'viem';
import { useEffect, useState, useCallback } from 'react';
import FaircroftGovernorAbi from '@/config/abis/FaircroftGovernor.json';
import { getContracts } from '@/config/contracts';

export type ProposalCategory = 'Routine' | 'Financial' | 'Governance' | 'Constitutional';

export const CATEGORIES: { value: number; label: ProposalCategory; quorum: string; threshold: string; color: string; icon?: string }[] = [
  { value: 0, label: 'Routine', quorum: '15%', threshold: '>50%', color: 'green' },
  { value: 1, label: 'Financial', quorum: '33%', threshold: '>50%', color: 'blue' },
  { value: 2, label: 'Governance', quorum: '51%', threshold: '>50%', color: 'amber' },
  { value: 3, label: 'Constitutional', quorum: '67%', threshold: '>66.7%', color: 'red' },
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
  Queued: 'amber',
  Expired: 'gray',
  Executed: 'emerald',
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProposalEvent {
  proposalId: bigint;
  proposer: `0x${string}`;
  targets: `0x${string}`[];
  values: bigint[];
  calldatas: `0x${string}`[];
  description: string;
  voteStart: bigint;
  voteEnd: bigint;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
}

// ─── Proposal List (from events) ──────────────────────────────────────────────

export function useProposalEvents() {
  const [proposals, setProposals] = useState<ProposalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const addresses = getContracts(CHAIN_ID);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const logs = await publicClient.getLogs({
        address: addresses.governor,
        event: parseAbiItem(
          'event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 voteStart, uint256 voteEnd, string description)',
        ),
        fromBlock: BigInt(0),
        toBlock: 'latest',
      });

      const parsed: ProposalEvent[] = logs.map((log) => {
        const args = log.args as {
          proposalId: bigint;
          proposer: `0x${string}`;
          targets: `0x${string}`[];
          values: bigint[];
          calldatas: `0x${string}`[];
          voteStart: bigint;
          voteEnd: bigint;
          description: string;
        };
        return {
          proposalId: args.proposalId,
          proposer: args.proposer,
          targets: args.targets,
          values: args.values,
          calldatas: args.calldatas,
          description: args.description,
          voteStart: args.voteStart,
          voteEnd: args.voteEnd,
          blockNumber: log.blockNumber ?? BigInt(0),
          transactionHash: log.transactionHash ?? ('0x' as `0x${string}`),
        };
      });

      // newest first
      setProposals(parsed.reverse());
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, [addresses.governor]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { proposals, isLoading, error, refetch: fetch };
}

// ─── Per-Proposal Reads ────────────────────────────────────────────────────────

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

export function useProposalEta(proposalId: bigint | undefined) {
  const { governor } = useContracts();

  const { data } = useReadContract({
    ...governor,
    functionName: 'proposalEta',
    args: proposalId !== undefined ? [proposalId] : undefined,
    query: { enabled: proposalId !== undefined, refetchInterval: 30_000 },
  });

  return data ? Number(data) : 0;
}

// ─── hasVoted ─────────────────────────────────────────────────────────────────

export function useHasVoted(proposalId: bigint | undefined) {
  const { governor } = useContracts();
  const { address } = useAccount();

  const { data } = useReadContract({
    ...governor,
    functionName: 'hasVoted',
    args: proposalId !== undefined && address ? [proposalId, address] : undefined,
    query: { enabled: proposalId !== undefined && !!address, refetchInterval: 30_000 },
  });

  return !!data;
}

// ─── castVoteWithReason ────────────────────────────────────────────────────────

export function useCastVote() {
  const { governor } = useContracts();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const castVote = (proposalId: bigint, support: number, reason?: string) => {
    if (reason && reason.trim()) {
      writeContract({
        ...governor,
        functionName: 'castVoteWithReason',
        args: [proposalId, support, reason.trim()],
      });
    } else {
      writeContract({
        ...governor,
        functionName: 'castVote',
        args: [proposalId, support],
      });
    }
  };

  return { castVote, isPending, isConfirming, isSuccess, hash, error };
}

// ─── Queue ─────────────────────────────────────────────────────────────────────

export function useQueueProposal() {
  const { governor } = useContracts();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const queueProposal = (
    targets: `0x${string}`[],
    values: bigint[],
    calldatas: `0x${string}`[],
    description: string,
  ) => {
    const descHash = keccak256(toBytes(description)) as `0x${string}`;
    writeContract({
      ...governor,
      functionName: 'queue',
      args: [targets, values, calldatas, descHash],
    });
  };

  return { queueProposal, isPending, isConfirming, isSuccess, hash, error };
}

// ─── Execute ───────────────────────────────────────────────────────────────────

export function useExecuteProposal() {
  const { governor } = useContracts();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const executeProposal = (
    targets: `0x${string}`[],
    values: bigint[],
    calldatas: `0x${string}`[],
    description: string,
  ) => {
    const descHash = keccak256(toBytes(description)) as `0x${string}`;
    writeContract({
      ...governor,
      functionName: 'execute',
      args: [targets, values, calldatas, descHash],
      value: BigInt(0),
    });
  };

  return { executeProposal, isPending, isConfirming, isSuccess, hash, error };
}

// ─── Propose ───────────────────────────────────────────────────────────────────

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

// ─── Governor Settings ─────────────────────────────────────────────────────────

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
