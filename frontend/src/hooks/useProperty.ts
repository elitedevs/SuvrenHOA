'use client';

import { useState, useMemo } from 'react';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { useContracts } from './useContracts';

export interface PropertyData {
  tokenId: number;
  lotNumber: number;
  squareFootage: number;
  lastDuesTimestamp: number;
  streetAddress: string;
}

/**
 * Get all property data for the connected wallet.
 * Supports multiple properties — use selectedPropertyIndex to switch between them.
 * Single-property fields (tokenId, propertyInfo) point to the selected property for backward compat.
 */
export function useProperty() {
  const { address } = useAccount();
  const { propertyNFT } = useContracts();
  const [selectedPropertyIndex, setSelectedPropertyIndex] = useState(0);

  // How many NFTs does this wallet hold?
  const { data: balance } = useReadContract({
    ...propertyNFT,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const balanceNum = balance ? Number(balance) : 0;

  // Get voting power
  const { data: votes } = useReadContract({
    ...propertyNFT,
    functionName: 'getVotes',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Get who this wallet delegates to
  const { data: delegatee } = useReadContract({
    ...propertyNFT,
    functionName: 'delegates',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Get total supply (community size)
  const { data: totalSupply } = useReadContract({
    ...propertyNFT,
    functionName: 'totalSupply',
  });

  // Batch-fetch ALL token IDs for this wallet
  const tokenIdCalls = useMemo(() => {
    if (!address || balanceNum === 0) return [];
    return Array.from({ length: balanceNum }, (_, i) => ({
      address: propertyNFT.address,
      abi: propertyNFT.abi as readonly unknown[] as any,
      functionName: 'tokenOfOwnerByIndex',
      args: [address, BigInt(i)],
    }));
  }, [address, balanceNum, propertyNFT]);

  const { data: tokenIdResults } = useReadContracts({
    contracts: tokenIdCalls as any,
    query: { enabled: tokenIdCalls.length > 0 },
  });

  // Extract token IDs from results
  const tokenIds = useMemo(() => {
    if (!tokenIdResults) return [];
    return tokenIdResults
      .filter((r) => r.status === 'success' && r.result !== undefined)
      .map((r) => Number(r.result));
  }, [tokenIdResults]);

  // Batch-fetch property info for ALL token IDs
  const propertyInfoCalls = useMemo(() => {
    if (tokenIds.length === 0) return [];
    return tokenIds.map((id) => ({
      address: propertyNFT.address,
      abi: propertyNFT.abi as readonly unknown[] as any,
      functionName: 'getProperty',
      args: [BigInt(id)],
    }));
  }, [tokenIds, propertyNFT]);

  const { data: propertyInfoResults } = useReadContracts({
    contracts: propertyInfoCalls as any,
    query: { enabled: propertyInfoCalls.length > 0 },
  });

  // Build full property objects
  const properties: PropertyData[] = useMemo(() => {
    if (!propertyInfoResults || tokenIds.length === 0) return [];
    return propertyInfoResults
      .map((r, i) => {
        if (r.status !== 'success' || !r.result) return null;
        const info = r.result as {
          lotNumber: bigint;
          squareFootage: bigint;
          lastDuesTimestamp: bigint;
          streetAddress: string;
        };
        return {
          tokenId: tokenIds[i],
          lotNumber: Number(info.lotNumber),
          squareFootage: Number(info.squareFootage),
          lastDuesTimestamp: Number(info.lastDuesTimestamp),
          streetAddress: info.streetAddress,
        };
      })
      .filter((p): p is PropertyData => p !== null);
  }, [propertyInfoResults, tokenIds]);

  // Clamp selected index
  const safeIndex = properties.length > 0
    ? Math.min(selectedPropertyIndex, properties.length - 1)
    : 0;

  const selectedProperty = properties[safeIndex] ?? undefined;

  const hasProperty = balanceNum > 0;

  return {
    // Backward-compatible single-property fields (point to selected)
    address,
    hasProperty,
    balance: balanceNum,
    votes: votes ? Number(votes) : 0,
    delegatee: delegatee as string | undefined,
    totalSupply: totalSupply ? Number(totalSupply) : 0,
    tokenId: selectedProperty?.tokenId,
    propertyInfo: selectedProperty
      ? {
          lotNumber: BigInt(selectedProperty.lotNumber),
          squareFootage: BigInt(selectedProperty.squareFootage),
          lastDuesTimestamp: BigInt(selectedProperty.lastDuesTimestamp),
          streetAddress: selectedProperty.streetAddress,
        }
      : undefined,

    // Multi-property fields
    properties,
    selectedPropertyIndex: safeIndex,
    setSelectedPropertyIndex,
    hasMultipleProperties: properties.length > 1,
  };
}
