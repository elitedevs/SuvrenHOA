'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { publicClient } from '@/lib/publicClient';
import { CONTRACTS } from '@/config/contracts';
import PropertyNFTABI from '@/config/abis/PropertyNFT.json';

export interface NeighborLot {
  lotId: string;
  tokenId: string;
  ownerShort: string; // truncated address
  optedIn: boolean;
}

function getOptInKey(): string {
  return 'suvren_messaging_optins';
}

function loadOptIns(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(getOptInKey());
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function truncateAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function useDirectory() {
  const { address } = useAccount();
  const [lots, setLots] = useState<NeighborLot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchLots() {
      setLoading(true);
      setError(null);
      try {
        const contractAddress = CONTRACTS.baseSepolia.propertyNFT;

        // Get total minted count
        const totalMinted = await publicClient.readContract({
          address: contractAddress,
          abi: PropertyNFTABI,
          functionName: 'totalMinted',
        }) as bigint;

        const count = Number(totalMinted);
        if (count === 0) {
          setLots([]);
          return;
        }

        // Fetch all token IDs by index (tokens are 1-indexed typically)
        const tokenPromises: Promise<bigint>[] = [];
        for (let i = 0; i < count; i++) {
          tokenPromises.push(
            publicClient.readContract({
              address: contractAddress,
              abi: PropertyNFTABI,
              functionName: 'tokenByIndex',
              args: [BigInt(i)],
            }) as Promise<bigint>
          );
        }

        const tokenIds = await Promise.all(tokenPromises);

        // Fetch owner + property info for each token
        const detailPromises = tokenIds.map(async (tokenId) => {
          const [owner, propData] = await Promise.all([
            publicClient.readContract({
              address: contractAddress,
              abi: PropertyNFTABI,
              functionName: 'ownerOf',
              args: [tokenId],
            }) as Promise<string>,
            publicClient.readContract({
              address: contractAddress,
              abi: PropertyNFTABI,
              functionName: 'properties',
              args: [tokenId],
            }) as Promise<readonly [bigint, bigint, bigint, string]>,
          ]);

          // propData: [lotId, squareFootage, lastDuesUpdate, metadataURI]
          const lotIdNum = propData[0];

          return {
            tokenId: tokenId.toString(),
            lotId: lotIdNum.toString(),
            owner: owner.toLowerCase(),
          };
        });

        const details = await Promise.all(detailPromises);

        // Load opt-in data from localStorage
        const optIns = loadOptIns();

        const myAddr = address?.toLowerCase() ?? '';

        const neighborLots: NeighborLot[] = details.map((d) => ({
          lotId: d.lotId,
          tokenId: d.tokenId,
          ownerShort: truncateAddress(d.owner),
          // Check opt-in using their wallet store key pattern
          optedIn: optIns[d.owner] === true,
        }));

        // Filter out self
        const filtered = neighborLots.filter((l) => {
          const detail = details.find((d) => d.lotId === l.lotId);
          return detail?.owner !== myAddr;
        });

        if (!cancelled) setLots(filtered);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load directory');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLots();
    return () => { cancelled = true; };
  }, [address]);

  // Opted-in neighbors only (for new message picker)
  const optedInLots = lots.filter((l) => l.optedIn);

  return { lots, optedInLots, loading, error };
}
