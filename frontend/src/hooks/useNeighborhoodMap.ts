'use client';

import { useState, useEffect, useCallback } from 'react';
import { publicClient } from '@/lib/publicClient';
import { CONTRACTS } from '@/config/contracts';
import PropertyNFTAbi from '@/config/abis/PropertyNFT.json';
import FaircroftTreasuryAbi from '@/config/abis/FaircroftTreasury.json';

export interface LotData {
  tokenId: number;
  lotNumber: number;
  streetAddress: string;
  sqft: number;
  owner: string;
  isDuesCurrent: boolean | null;
}

export interface UseNeighborhoodMapReturn {
  lots: LotData[];
  loading: boolean;
  error: string | null;
  totalSupply: number;
  refresh: () => void;
}

const REFRESH_INTERVAL = 2 * 60 * 1000; // 2 minutes

export function useNeighborhoodMap(): UseNeighborhoodMapReturn {
  const [lots, setLots] = useState<LotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSupply, setTotalSupply] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const contracts = CONTRACTS.baseSepolia;

      const supply = await publicClient.readContract({
        address: contracts.propertyNFT,
        abi: PropertyNFTAbi,
        functionName: 'totalSupply',
      }) as bigint;

      const totalCount = Number(supply);
      setTotalSupply(totalCount);

      if (totalCount === 0) {
        setLots([]);
        return;
      }

      const tokenIds = Array.from({ length: totalCount }, (_, i) => BigInt(i + 1));

      const [propertyResults, ownerResults, duesResults] = await Promise.all([
        Promise.all(
          tokenIds.map((tokenId) =>
            publicClient
              .readContract({
                address: contracts.propertyNFT,
                abi: PropertyNFTAbi,
                functionName: 'getProperty',
                args: [tokenId],
              })
              .catch(() => null)
          )
        ),
        Promise.all(
          tokenIds.map((tokenId) =>
            publicClient
              .readContract({
                address: contracts.propertyNFT,
                abi: PropertyNFTAbi,
                functionName: 'ownerOf',
                args: [tokenId],
              })
              .catch(() => null)
          )
        ),
        Promise.all(
          tokenIds.map((tokenId) =>
            publicClient
              .readContract({
                address: contracts.treasury,
                abi: FaircroftTreasuryAbi,
                functionName: 'isDuesCurrent',
                args: [tokenId],
              })
              .catch(() => null)
          )
        ),
      ]);

      const lotsData: LotData[] = tokenIds.map((tokenId, i) => {
        const prop = propertyResults[i] as {
          lotNumber: bigint;
          squareFootage: bigint;
          streetAddress: string;
        } | null;
        const owner = ownerResults[i] as string | null;
        const dues = duesResults[i] as boolean | null;

        return {
          tokenId: Number(tokenId),
          lotNumber: prop ? Number(prop.lotNumber) : Number(tokenId),
          streetAddress: prop?.streetAddress ?? 'Unknown Address',
          sqft: prop ? Number(prop.squareFootage) : 0,
          owner: owner ?? '0x0000000000000000000000000000000000000000',
          isDuesCurrent: dues,
        };
      });

      setLots(lotsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load neighborhood data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { lots, loading, error, totalSupply, refresh: fetchData };
}
