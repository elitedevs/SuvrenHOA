'use client';

/**
 * usePublicData — reads on-chain data via shared publicClient.
 * No wallet connection required. Safe for public-facing pages.
 */

import { formatUnits } from 'viem';
import { useState, useEffect, useCallback } from 'react';
import { publicClient } from '@/lib/publicClient';
import { getContracts } from '@/config/contracts';
import { createLogger } from '@/lib/logger';

const log = createLogger('usePublicData');

import PropertyNFTAbi from '@/config/abis/PropertyNFT.json';
import FaircroftGovernorAbi from '@/config/abis/FaircroftGovernor.json';
import FaircroftTreasuryAbi from '@/config/abis/FaircroftTreasury.json';
import DocumentRegistryAbi from '@/config/abis/DocumentRegistry.json';

const contracts = getContracts(84532);

// Helpers
function formatUSDC(wei: bigint): string {
  return parseFloat(formatUnits(wei, 6)).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseUSDCToNumber(wei: bigint): number {
  return parseFloat(formatUnits(wei, 6));
}

export type PublicStats = {
  totalTreasuryStr: string;
  operatingFundStr: string;
  reserveFundStr: string;
  totalTreasuryNum: number;
  operatingFundNum: number;
  reserveFundNum: number;
  totalProperties: number;
  activeProposals: number;
  documentsOnChain: number;
  duesCollectionRate: number;
  totalExpenditures: number;
  loading: boolean;
  error: string | null;
};

// Stats hook
export function usePublicStats(): PublicStats {
  const [stats, setStats] = useState<PublicStats>({
    totalTreasuryStr: '0.00',
    operatingFundStr: '0.00',
    reserveFundStr: '0.00',
    totalTreasuryNum: 0,
    operatingFundNum: 0,
    reserveFundNum: 0,
    totalProperties: 0,
    activeProposals: 0,
    documentsOnChain: 0,
    duesCollectionRate: 0,
    totalExpenditures: 0,
    loading: true,
    error: null,
  });

  const fetchStats = useCallback(async () => {
    try {
      const [snapshot, totalSupply, activeProposals, docCount, expenditureCount] =
        await Promise.all([
          publicClient.readContract({
            address: contracts.treasury,
            abi: FaircroftTreasuryAbi,
            functionName: 'getTreasurySnapshot',
          }) as Promise<[bigint, bigint, bigint, bigint]>,
          publicClient.readContract({
            address: contracts.propertyNFT,
            abi: PropertyNFTAbi,
            functionName: 'totalSupply',
          }) as Promise<bigint>,
          publicClient.readContract({
            address: contracts.governor,
            abi: FaircroftGovernorAbi,
            functionName: 'activeProposalCount',
          }) as Promise<bigint>,
          publicClient.readContract({
            address: contracts.documentRegistry,
            abi: DocumentRegistryAbi,
            functionName: 'getDocumentCount',
          }) as Promise<bigint>,
          publicClient.readContract({
            address: contracts.treasury,
            abi: FaircroftTreasuryAbi,
            functionName: 'getExpenditureCount',
          }) as Promise<bigint>,
        ]);

      const supply = Number(totalSupply);

      // Dues collection rate: batch check isDuesCurrent for all token IDs
      let duesCurrentCount = 0;
      if (supply > 0) {
        const checks = await Promise.allSettled(
          Array.from({ length: Math.min(supply, 100) }, (_, i) =>
            publicClient.readContract({
              address: contracts.treasury,
              abi: FaircroftTreasuryAbi,
              functionName: 'isDuesCurrent',
              args: [BigInt(i + 1)],
            })
          )
        );
        duesCurrentCount = checks.filter(
          (r) => r.status === 'fulfilled' && r.value === true
        ).length;
      }

      setStats({
        totalTreasuryStr: formatUSDC(snapshot[0]),
        operatingFundStr: formatUSDC(snapshot[1]),
        reserveFundStr: formatUSDC(snapshot[2]),
        totalTreasuryNum: parseUSDCToNumber(snapshot[0]),
        operatingFundNum: parseUSDCToNumber(snapshot[1]),
        reserveFundNum: parseUSDCToNumber(snapshot[2]),
        totalProperties: supply,
        activeProposals: Number(activeProposals),
        documentsOnChain: Number(docCount),
        duesCollectionRate:
          supply > 0 ? Math.round((duesCurrentCount / Math.min(supply, 100)) * 100) : 0,
        totalExpenditures: Number(expenditureCount),
        loading: false,
        error: null,
      });
    } catch (err) {
      log.error('Failed to fetch public stats', err);
      setStats((prev) => ({ ...prev, loading: false, error: 'Unable to load on-chain data' }));
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, 30_000);
    return () => clearInterval(id);
  }, [fetchStats]);

  return stats;
}
