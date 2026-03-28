'use client';

import { useEffect, useState, useCallback } from 'react';
import { createLogger } from '@/lib/logger';

const log = createLogger('useActivityFeed');

import { publicClient } from '@/lib/publicClient';
import { getContracts } from '@/config/contracts';

import PropertyNFTAbi from '@/config/abis/PropertyNFT.json';
import FaircroftGovernorAbi from '@/config/abis/FaircroftGovernor.json';
import FaircroftTreasuryAbi from '@/config/abis/FaircroftTreasury.json';
import DocumentRegistryAbi from '@/config/abis/DocumentRegistry.json';

export interface ActivityItem {
  id: string;           // unique key: txHash-logIndex
  icon: string;
  description: string;
  txHash: `0x${string}`;
  blockNumber: bigint;
  timestamp: number;    // unix seconds, estimated from block
  isNew?: boolean;      // true for first ~5s after appearing
}


const CHAIN_ID = 84532;
const BLOCK_SCAN_RANGE = BigInt(2000); // ~14 hours on Base (~2s blocks)
const MAX_EVENTS = 20;
const BASESCAN = 'https://sepolia.basescan.org/tx';

function truncateAddr(addr: string): string {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function usdcAmount(raw: bigint): string {
  const n = Number(raw) / 1_000_000;
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

async function fetchEvents(): Promise<ActivityItem[]> {
  const contracts = getContracts(CHAIN_ID);

  let toBlock: bigint;
  try {
    toBlock = await publicClient.getBlockNumber();
  } catch {
    return [];
  }
  const fromBlock = toBlock > BLOCK_SCAN_RANGE ? toBlock - BLOCK_SCAN_RANGE : BigInt(0);

  const items: ActivityItem[] = [];

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

  // 1. PropertyNFT — PropertyMinted (new property)
  const mintedLogs = await safeGetLogs({
    address: contracts.propertyNFT,
    abi: PropertyNFTAbi as readonly unknown[],
    eventName: 'PropertyMinted',
    fromBlock,
    toBlock,
  });
  for (const log of mintedLogs) {
    const { tokenId, owner, lotNumber, streetAddress } = log.args ?? {};
    const lotNum = lotNumber !== undefined ? `Lot #${Number(lotNumber)}` : `Property #${tokenId}`;
    const ownerStr = owner ? truncateAddr(owner) : '?';
    items.push({
      id: `${log.transactionHash}-${log.logIndex}`,
      icon: '',
      description: `${lotNum} minted to ${ownerStr}${streetAddress ? ` — ${streetAddress}` : ''}`,
      txHash: log.transactionHash,
      blockNumber: log.blockNumber,
      timestamp: 0,
    });
  }

  // 2. PropertyNFT — Transfer (non-mint transfers)
  const transferLogs = await safeGetLogs({
    address: contracts.propertyNFT,
    abi: PropertyNFTAbi as readonly unknown[],
    eventName: 'Transfer',
    fromBlock,
    toBlock,
  });
  for (const log of transferLogs) {
    const { from, to, tokenId } = log.args ?? {};
    // Skip mint events (from === address zero) — covered by PropertyMinted
    if (from === '0x0000000000000000000000000000000000000000') continue;
    const fromStr = from ? truncateAddr(from) : '?';
    const toStr = to ? truncateAddr(to) : '?';
    items.push({
      id: `${log.transactionHash}-${log.logIndex}`,
      icon: '',
      description: `Property #${tokenId} transferred from ${fromStr} to ${toStr}`,
      txHash: log.transactionHash,
      blockNumber: log.blockNumber,
      timestamp: 0,
    });
  }

  // 3. FaircroftGovernor — ProposalCreated
  const proposalLogs = await safeGetLogs({
    address: contracts.governor,
    abi: FaircroftGovernorAbi as readonly unknown[],
    eventName: 'ProposalCreated',
    fromBlock,
    toBlock,
  });
  for (const log of proposalLogs) {
    const { description } = log.args ?? {};
    // Description may have "# Title\n..." format — grab first line
    const title = description
      ? description.split('\n')[0].replace(/^#+\s*/, '').trim().slice(0, 60)
      : 'New Proposal';
    items.push({
      id: `${log.transactionHash}-${log.logIndex}`,
      icon: '',
      description: `New Proposal: '${title}'`,
      txHash: log.transactionHash,
      blockNumber: log.blockNumber,
      timestamp: 0,
    });
  }

  // 4. FaircroftGovernor — VoteCast
  const voteLogs = await safeGetLogs({
    address: contracts.governor,
    abi: FaircroftGovernorAbi as readonly unknown[],
    eventName: 'VoteCast',
    fromBlock,
    toBlock,
  });
  for (const log of voteLogs) {
    const { voter, support, reason } = log.args ?? {};
    const supportLabel = support === 0 ? 'AGAINST' : support === 1 ? 'FOR' : 'ABSTAIN';
    const voterStr = voter ? truncateAddr(voter) : '?';
    const reasonStr = reason && reason.trim().length > 0 ? ` — "${reason.trim().slice(0, 40)}"` : '';
    items.push({
      id: `${log.transactionHash}-${log.logIndex}`,
      icon: support === 1 ? '' : support === 0 ? '' : '',
      description: `${voterStr} voted ${supportLabel}${reasonStr}`,
      txHash: log.transactionHash,
      blockNumber: log.blockNumber,
      timestamp: 0,
    });
  }

  // 5. FaircroftTreasury — DuesPaid
  const duesPaidLogs = await safeGetLogs({
    address: contracts.treasury,
    abi: FaircroftTreasuryAbi as readonly unknown[],
    eventName: 'DuesPaid',
    fromBlock,
    toBlock,
  });
  for (const log of duesPaidLogs) {
    const { tokenId, payer, amount } = log.args ?? {};
    const payerStr = payer ? truncateAddr(payer) : '?';
    const amountStr = amount !== undefined ? usdcAmount(BigInt(amount)) : '?';
    items.push({
      id: `${log.transactionHash}-${log.logIndex}`,
      icon: '',
      description: `$${amountStr} USDC dues paid by Lot #${tokenId} (${payerStr})`,
      txHash: log.transactionHash,
      blockNumber: log.blockNumber,
      timestamp: 0,
    });
  }

  // 6. FaircroftTreasury — ExpenditureMade
  const expenditureLogs = await safeGetLogs({
    address: contracts.treasury,
    abi: FaircroftTreasuryAbi as readonly unknown[],
    eventName: 'ExpenditureMade',
    fromBlock,
    toBlock,
  });
  for (const log of expenditureLogs) {
    const { amount, description } = log.args ?? {};
    const amountStr = amount !== undefined ? usdcAmount(BigInt(amount)) : '?';
    const descStr = description ? description.trim().slice(0, 50) : 'Expenditure';
    items.push({
      id: `${log.transactionHash}-${log.logIndex}`,
      icon: '',
      description: `$${amountStr} spent: '${descStr}'`,
      txHash: log.transactionHash,
      blockNumber: log.blockNumber,
      timestamp: 0,
    });
  }

  // 7. DocumentRegistry — DocumentRegistered
  const docLogs = await safeGetLogs({
    address: contracts.documentRegistry,
    abi: DocumentRegistryAbi as readonly unknown[],
    eventName: 'DocumentRegistered',
    fromBlock,
    toBlock,
  });
  for (const log of docLogs) {
    const { title } = log.args ?? {};
    const titleStr = title ? title.slice(0, 60) : 'New Document';
    items.push({
      id: `${log.transactionHash}-${log.logIndex}`,
      icon: '',
      description: `New document: '${titleStr}'`,
      txHash: log.transactionHash,
      blockNumber: log.blockNumber,
      timestamp: 0,
    });
  }

  // Deduplicate by id (in case Transfer overlaps PropertyMinted tx)
  const seen = new Set<string>();
  const deduped = items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  // Sort by block number descending (most recent first)
  deduped.sort((a, b) => (a.blockNumber > b.blockNumber ? -1 : a.blockNumber < b.blockNumber ? 1 : 0));

  // Assign estimated timestamps based on block number
  // Base Sepolia: ~2s per block
  const now = Math.floor(Date.now() / 1000);
  const latestBlockNum = toBlock;
  for (const item of deduped) {
    const blockDiff = Number(latestBlockNum - item.blockNumber);
    item.timestamp = now - blockDiff * 2;
  }

  return deduped.slice(0, MAX_EVENTS);
}

export function useActivityFeed() {
  const [events, setEvents] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  const load = useCallback(async (isRefresh = false) => {
    try {
      const fetched = await fetchEvents();

      if (isRefresh) {
        setEvents((prev) => {
          const prevIds = new Set(prev.map((e) => e.id));
          const freshIds = new Set<string>();
          for (const e of fetched) {
            if (!prevIds.has(e.id)) freshIds.add(e.id);
          }
          if (freshIds.size > 0) {
            setNewIds(freshIds);
            setTimeout(() => setNewIds(new Set()), 5000);
          }
          return fetched;
        });
      } else {
        setEvents(fetched);
      }
      setLastFetched(new Date());
    } catch (err) {
      log.error('Failed to fetch events', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    load(false);
  }, [load]);

  // Poll every 30s
  useEffect(() => {
    const interval = setInterval(() => load(true), 30_000);
    return () => clearInterval(interval);
  }, [load]);

  return { events, isLoading, lastFetched, newIds };
}
