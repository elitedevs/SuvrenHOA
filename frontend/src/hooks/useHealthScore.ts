'use client';

/**
 * useHealthScore — composite community health score (0-100).
 * Pure public reads via shared publicClient. No wallet required.
 */

import { useState, useEffect, useCallback } from 'react';
import { formatUnits } from 'viem';
import { publicClient } from '@/lib/publicClient';
import { getContracts } from '@/config/contracts';

import PropertyNFTAbi from '@/config/abis/PropertyNFT.json';
import FaircroftGovernorAbi from '@/config/abis/FaircroftGovernor.json';
import FaircroftTreasuryAbi from '@/config/abis/FaircroftTreasury.json';
import DocumentRegistryAbi from '@/config/abis/DocumentRegistry.json';

const contracts = getContracts(84532);

export type HealthFactor = {
  name: string;
  score: number;
  max: number;
  description: string;
  improvement: string;
  icon: string;
};

export type HealthScoreData = {
  score: number;
  grade: string;
  color: string;
  colorClass: string;
  factors: HealthFactor[];
  loading: boolean;
  error: string | null;
};

function getGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function getColor(score: number): string {
  if (score >= 71) return '#22c55e';
  if (score >= 41) return '#f59e0b';
  return '#ef4444';
}

function getColorClass(score: number): string {
  if (score >= 71) return 'text-green-400';
  if (score >= 41) return 'text-amber-400';
  return 'text-red-400';
}

export function useHealthScore(): HealthScoreData {
  const [data, setData] = useState<HealthScoreData>({
    score: 0,
    grade: 'F',
    color: '#ef4444',
    colorClass: 'text-red-400',
    factors: [],
    loading: true,
    error: null,
  });

  const calculate = useCallback(async () => {
    try {
      const [snapshot, totalSupplyRaw, activeProposalsRaw, docCountRaw] =
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
        ]);

      const totalProperties = Number(totalSupplyRaw);
      const activeProposals = Number(activeProposalsRaw);
      const docCount = Number(docCountRaw);
      const treasuryTotal = parseFloat(formatUnits(snapshot[0], 6));
      const reserveFund = parseFloat(formatUnits(snapshot[2], 6));

      // Count executed proposals via event logs
      let executedProposals = 0;
      try {
        const latestBlock = await publicClient.getBlockNumber();
        const fromBlock = latestBlock > BigInt(50000) ? latestBlock - BigInt(50000) : BigInt(0);
        const logs = await publicClient.getLogs({
          address: contracts.governor,
          event: {
            type: 'event',
            name: 'ProposalExecuted',
            inputs: [{ name: 'proposalId', type: 'uint256', indexed: false }],
          } as const,
          fromBlock,
          toBlock: 'latest',
        });
        executedProposals = logs.length;
      } catch {
        // Non-critical — skip if RPC doesn't support range
      }

      // ── Dues Collection Rate (30 pts) ──────────────────────
      let duesCurrentCount = 0;
      const limit = Math.min(totalProperties, 100);
      if (totalProperties > 0) {
        const checks = await Promise.allSettled(
          Array.from({ length: limit }, (_, i) =>
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
      const duesRate = totalProperties > 0 ? duesCurrentCount / limit : 0;
      const duesScore = Math.round(duesRate * 30);

      // ── Treasury Health (20 pts + 5 reserve bonus) ─────────
      let treasuryScore = 0;
      if (treasuryTotal >= 1000) {
        treasuryScore = 20;
      } else {
        treasuryScore = Math.round((treasuryTotal / 1000) * 20);
      }
      if (treasuryTotal > 0 && reserveFund / treasuryTotal > 0.2) {
        treasuryScore = Math.min(25, treasuryScore + 5);
      }

      // ── Governance Participation (20 pts) ──────────────────
      let govScore = 0;
      if (activeProposals > 0) govScore += 10;
      if (executedProposals > 5) govScore += 10;

      // ── Document Compliance (15 pts) ───────────────────────
      let docScore = 0;
      if (docCount >= 16) docScore = 15;
      else if (docCount >= 6) docScore = 10;
      else if (docCount >= 1) docScore = 5;

      // ── Community Size (15 pts) ────────────────────────────
      let sizeScore = 0;
      if (totalProperties >= 21) sizeScore = 15;
      else if (totalProperties >= 6) sizeScore = 10;
      else if (totalProperties >= 1) sizeScore = 5;

      const total = Math.min(100, duesScore + treasuryScore + govScore + docScore + sizeScore);

      const behind = limit - duesCurrentCount;
      const treasuryFmt = treasuryTotal.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      const needed = (1000 - treasuryTotal).toFixed(2);
      const reservePct = treasuryTotal > 0 ? ((reserveFund / treasuryTotal) * 100).toFixed(0) : '0';

      const factors: HealthFactor[] = [
        {
          name: 'Dues Collection',
          score: duesScore,
          max: 30,
          description: `${duesCurrentCount} of ${limit} properties current`,
          improvement:
            duesRate < 1
              ? `${behind} ${behind === 1 ? 'property' : 'properties'} behind on dues`
              : 'All dues are current — excellent!',
          icon: '💳',
        },
        {
          name: 'Treasury Health',
          score: treasuryScore,
          max: 25,
          description: `$${treasuryFmt} total funds`,
          improvement:
            treasuryTotal < 1000
              ? `Need $${needed} more to reach full treasury score`
              : Number(reservePct) <= 20
              ? `Increase reserve fund above 20% for bonus points (currently ${reservePct}%)`
              : 'Treasury is healthy with strong reserves!',
          icon: '💰',
        },
        {
          name: 'Governance',
          score: govScore,
          max: 20,
          description: `${activeProposals} active proposal${activeProposals !== 1 ? 's' : ''}, ${executedProposals} executed`,
          improvement:
            activeProposals === 0 && executedProposals <= 5
              ? 'Create proposals to engage the community'
              : executedProposals <= 5
              ? `Execute ${6 - executedProposals} more proposal${6 - executedProposals === 1 ? '' : 's'} for full governance score`
              : 'Governance is active — great participation!',
          icon: '🗳️',
        },
        {
          name: 'Document Compliance',
          score: docScore,
          max: 15,
          description: `${docCount} document${docCount !== 1 ? 's' : ''} on-chain`,
          improvement:
            docCount === 0
              ? 'Upload CC&Rs and bylaws to start building compliance'
              : docCount < 6
              ? `Upload ${6 - docCount} more document${6 - docCount === 1 ? '' : 's'} to improve score`
              : docCount < 16
              ? `Upload ${16 - docCount} more document${16 - docCount === 1 ? '' : 's'} for maximum score`
              : 'Document compliance is excellent!',
          icon: '📄',
        },
        {
          name: 'Community Size',
          score: sizeScore,
          max: 15,
          description: `${totalProperties} ${totalProperties !== 1 ? 'properties' : 'property'} registered`,
          improvement:
            totalProperties === 0
              ? 'Register properties to grow the community'
              : totalProperties < 6
              ? `Add ${6 - totalProperties} more ${6 - totalProperties === 1 ? 'property' : 'properties'} for next tier`
              : totalProperties < 21
              ? `Add ${21 - totalProperties} more ${21 - totalProperties === 1 ? 'property' : 'properties'} for maximum size score`
              : 'Community has reached full size score!',
          icon: '🏠',
        },
      ];

      setData({
        score: total,
        grade: getGrade(total),
        color: getColor(total),
        colorClass: getColorClass(total),
        factors,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('[useHealthScore]', err);
      setData((prev) => ({ ...prev, loading: false, error: 'Unable to compute health score' }));
    }
  }, []);

  useEffect(() => {
    calculate();
    const id = setInterval(calculate, 60_000);
    return () => clearInterval(id);
  }, [calculate]);

  return data;
}
