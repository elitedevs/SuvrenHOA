'use client';

import { useState, useEffect } from 'react';
import { publicClient } from '@/lib/publicClient';
import { getContracts } from '@/config/contracts';
import { formatUnits } from 'viem';

import PropertyNFTAbi from '@/config/abis/PropertyNFT.json';
import FaircroftTreasuryAbi from '@/config/abis/FaircroftTreasury.json';

const contracts = getContracts(84532);

export interface DuesSocialProof {
  totalProperties: number;
  paidCount: number;
  unpaidCount: number;
  paidPercentage: number;
  quarterlyAmount: string;
  annualSavings: string;
  loading: boolean;
}

export function useDuesSocialProof(): DuesSocialProof {
  const [data, setData] = useState<DuesSocialProof>({
    totalProperties: 0,
    paidCount: 0,
    unpaidCount: 0,
    paidPercentage: 0,
    quarterlyAmount: '200.00',
    annualSavings: '40.00',
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchSocialProof() {
      try {
        const [totalSupplyRaw, quarterlyRaw, discountRaw] = await Promise.all([
          publicClient.readContract({
            address: contracts.propertyNFT,
            abi: PropertyNFTAbi as never[],
            functionName: 'totalSupply',
          }),
          publicClient.readContract({
            address: contracts.treasury,
            abi: FaircroftTreasuryAbi as never[],
            functionName: 'quarterlyDuesAmount',
          }),
          publicClient.readContract({
            address: contracts.treasury,
            abi: FaircroftTreasuryAbi as never[],
            functionName: 'annualDuesDiscount',
          }),
        ]);

        const total = Number(totalSupplyRaw as bigint);
        const quarterly = parseFloat(formatUnits(quarterlyRaw as bigint, 6));
        const discountBps = Number(discountRaw as bigint);
        const annualFull = quarterly * 4;
        const annualWithDiscount = (annualFull * (10000 - discountBps)) / 10000;
        const savings = annualFull - annualWithDiscount;

        if (total === 0 || cancelled) {
          setData({
            totalProperties: 0,
            paidCount: 0,
            unpaidCount: 0,
            paidPercentage: 0,
            quarterlyAmount: quarterly.toFixed(2),
            annualSavings: savings.toFixed(2),
            loading: false,
          });
          return;
        }

        // Get all token IDs via tokenByIndex (multicall)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const indexCalls = Array.from({ length: total }, (_, i) => ({
          address: contracts.propertyNFT as `0x${string}`,
          abi: PropertyNFTAbi,
          functionName: 'tokenByIndex',
          args: [BigInt(i)],
        })) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

        const tokenIdResults = await publicClient.multicall({ contracts: indexCalls });
        const tokenIds = tokenIdResults
          .filter((r) => r.status === 'success')
          .map((r) => r.result as bigint);

        // Batch-check isDuesCurrent for each token
        const dueCalls = tokenIds.map((id) => ({
          address: contracts.treasury as `0x${string}`,
          abi: FaircroftTreasuryAbi,
          functionName: 'isDuesCurrent',
          args: [id],
        })) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

        const dueResults = await publicClient.multicall({ contracts: dueCalls });
        const paidCount = dueResults.filter(
          (r) => r.status === 'success' && r.result === true
        ).length;

        if (!cancelled) {
          setData({
            totalProperties: total,
            paidCount,
            unpaidCount: total - paidCount,
            paidPercentage: total > 0 ? Math.round((paidCount / total) * 100) : 0,
            quarterlyAmount: quarterly.toFixed(2),
            annualSavings: savings.toFixed(2),
            loading: false,
          });
        }
      } catch (err) {
        console.error('useDuesSocialProof error:', err);
        if (!cancelled) {
          setData((prev) => ({ ...prev, loading: false }));
        }
      }
    }

    fetchSocialProof();
    return () => { cancelled = true; };
  }, []);

  return data;
}
