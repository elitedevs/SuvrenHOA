'use client';

import { useEffect, useState, useCallback } from 'react';
import { publicClient } from '@/lib/publicClient';
import { getContracts } from '@/config/contracts';

import FaircroftGovernorAbi from '@/config/abis/FaircroftGovernor.json';
import FaircroftTreasuryAbi from '@/config/abis/FaircroftTreasury.json';
import DocumentRegistryAbi from '@/config/abis/DocumentRegistry.json';

const CHAIN_ID = 84532;
const BLOCK_SCAN_RANGE = BigInt(2000); // ~1.1 hours on Base (~2s blocks)
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export interface LeaderboardEntry {
  address: `0x${string}`;
  rank: number;
  score: number;
  badge?: string;
  extra?: string; // streak info, etc.
}

export interface LeaderboardData {
  governanceChampions: LeaderboardEntry[];
  promptPayers: LeaderboardEntry[];
  communityContributors: LeaderboardEntry[];
  documentChampions: LeaderboardEntry[];
  goodNeighbor: `0x${string}` | null;
  goodNeighborScore: number;
  isLoading: boolean;
  lastFetched: Date | null;
  error: string | null;
}

function safeAddr(addr: unknown): `0x${string}` | null {
  if (typeof addr === 'string' && addr.startsWith('0x') && addr.length === 42) {
    return addr.toLowerCase() as `0x${string}`;
  }
  return null;
}

function rankEntries(map: Map<string, number>, badgeFn?: (addr: string, score: number, rank: number) => string | undefined): LeaderboardEntry[] {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([addr, score], idx) => {
      const rank = idx + 1;
      return {
        address: addr as `0x${string}`,
        rank,
        score,
        badge: badgeFn ? badgeFn(addr, score, rank) : undefined,
      };
    });
}

async function fetchLeaderboardData(): Promise<Omit<LeaderboardData, 'isLoading' | 'lastFetched' | 'error'>> {
  const contracts = getContracts(CHAIN_ID);
  
  let toBlock: bigint;
  try {
    toBlock = await publicClient.getBlockNumber();
  } catch {
    throw new Error('Failed to get block number');
  }
  const fromBlock = toBlock > BLOCK_SCAN_RANGE ? toBlock - BLOCK_SCAN_RANGE : BigInt(0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type AnyLog = any;
  const safeGetLogs = async (params: Parameters<typeof publicClient.getContractEvents>[0]): Promise<AnyLog[]> => {
    try {
      // Cast required: viem's strict overloads don't infer args without literal ABI
      return await publicClient.getContractEvents(params as Parameters<typeof publicClient.getContractEvents>[0]) as AnyLog[];
    } catch {
      return [];
    }
  };

  // --- 1. Governance Champions: VoteCast events ---
  const voteLogs = await safeGetLogs({
    address: contracts.governor,
    abi: FaircroftGovernorAbi as readonly unknown[],
    eventName: 'VoteCast',
    fromBlock,
    toBlock,
  });

  const voteMap = new Map<string, number>();
  for (const log of voteLogs) {
    const addr = safeAddr(log.args?.voter);
    if (!addr) continue;
    voteMap.set(addr, (voteMap.get(addr) ?? 0) + 1);
  }

  // Also track total proposals to calculate participation rate
  const proposalCreatedLogs = await safeGetLogs({
    address: contracts.governor,
    abi: FaircroftGovernorAbi as readonly unknown[],
    eventName: 'ProposalCreated',
    fromBlock,
    toBlock,
  });
  const totalProposals = proposalCreatedLogs.length || 1;

  const governanceChampions = rankEntries(voteMap, (addr, score, rank) => {
    const rate = Math.min(100, Math.round((score / totalProposals) * 100));
    if (rank === 1) return `👑 ${rate}% participation`;
    return `${rate}% participation`;
  });

  // --- 2. Prompt Payers: DuesPaid events ---
  const duesPaidLogs = await safeGetLogs({
    address: contracts.treasury,
    abi: FaircroftTreasuryAbi as readonly unknown[],
    eventName: 'DuesPaid',
    fromBlock,
    toBlock,
  });

  // Track: count per payer + earliest payment (for "first to pay" badge)
  const payerMap = new Map<string, { count: number; firstBlock: bigint }>();
  for (const log of duesPaidLogs) {
    const addr = safeAddr(log.args?.payer);
    if (!addr) continue;
    const blockNum = log.blockNumber as bigint;
    const existing = payerMap.get(addr);
    if (!existing) {
      payerMap.set(addr, { count: 1, firstBlock: blockNum });
    } else {
      payerMap.set(addr, {
        count: existing.count + 1,
        firstBlock: blockNum < existing.firstBlock ? blockNum : existing.firstBlock,
      });
    }
  }

  // Find earliest block overall for "first to pay" badge
  let earliestBlock = toBlock;
  for (const { firstBlock } of payerMap.values()) {
    if (firstBlock < earliestBlock) earliestBlock = firstBlock;
  }

  const scorePayerMap = new Map<string, number>();
  for (const [addr, { count }] of payerMap.entries()) {
    scorePayerMap.set(addr, count);
  }

  const promptPayers = rankEntries(scorePayerMap, (addr, score, rank) => {
    const data = payerMap.get(addr);
    if (!data) return undefined;
    const isFirst = data.firstBlock === earliestBlock;
    const streakStr = `Paid on time ${score} quarter${score !== 1 ? 's' : ''} in a row`;
    if (rank === 1 && isFirst) return `🥇 First to pay! ${streakStr}`;
    if (isFirst) return `⚡ First to pay this period`;
    return streakStr;
  });

  // --- 3. Community Contributors: ProposalCreated events ---
  const proposerMap = new Map<string, number>();
  for (const log of proposalCreatedLogs) {
    const addr = safeAddr(log.args?.proposer);
    if (!addr) continue;
    proposerMap.set(addr, (proposerMap.get(addr) ?? 0) + 1);
  }

  const communityContributors = rankEntries(proposerMap, (addr, score, rank) => {
    if (rank === 1) return `🏅 Top contributor`;
    return `${score} proposal${score !== 1 ? 's' : ''} submitted`;
  });

  // --- 4. Document Champions: DocumentRegistered events ---
  const docLogs = await safeGetLogs({
    address: contracts.documentRegistry,
    abi: DocumentRegistryAbi as readonly unknown[],
    eventName: 'DocumentRegistered',
    fromBlock,
    toBlock,
  });

  const docMap = new Map<string, number>();
  for (const log of docLogs) {
    const addr = safeAddr(log.args?.uploadedBy);
    if (!addr) continue;
    docMap.set(addr, (docMap.get(addr) ?? 0) + 1);
  }

  const documentChampions = rankEntries(docMap, (addr, score, rank) => {
    if (rank === 1) return `📚 Top uploader`;
    return `${score} doc${score !== 1 ? 's' : ''} uploaded`;
  });

  // --- Good Neighbor of the Month: combined score ---
  // votes × 1 + payments × 2 + proposals × 3 + docs × 2
  const combinedMap = new Map<string, number>();
  const addToMap = (m: Map<string, number>, weight: number) => {
    for (const [addr, count] of m.entries()) {
      combinedMap.set(addr, (combinedMap.get(addr) ?? 0) + count * weight);
    }
  };
  addToMap(voteMap, 1);
  addToMap(scorePayerMap, 2);
  addToMap(proposerMap, 3);
  addToMap(docMap, 2);

  let goodNeighbor: `0x${string}` | null = null;
  let goodNeighborScore = 0;
  for (const [addr, score] of combinedMap.entries()) {
    if (score > goodNeighborScore) {
      goodNeighborScore = score;
      goodNeighbor = addr as `0x${string}`;
    }
  }

  return {
    governanceChampions,
    promptPayers,
    communityContributors,
    documentChampions,
    goodNeighbor,
    goodNeighborScore,
  };
}

export function useLeaderboard(): LeaderboardData {
  const [data, setData] = useState<Omit<LeaderboardData, 'isLoading' | 'lastFetched' | 'error'>>({
    governanceChampions: [],
    promptPayers: [],
    communityContributors: [],
    documentChampions: [],
    goodNeighbor: null,
    goodNeighborScore: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const result = await fetchLeaderboardData();
      setData(result);
      setLastFetched(new Date());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load leaderboard';
      setError(msg);
      console.error('[useLeaderboard] error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const interval = setInterval(() => load(), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [load]);

  return { ...data, isLoading, lastFetched, error };
}
