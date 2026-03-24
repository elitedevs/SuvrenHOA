'use client';

import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { useContracts } from './useContracts';

/**
 * Get all property data for the connected wallet.
 * Returns lot info, voting power, dues status, and delegation info.
 */
export function useProperty() {
  const { address } = useAccount();
  const { propertyNFT } = useContracts();

  // How many NFTs does this wallet hold?
  const { data: balance } = useReadContract({
    ...propertyNFT,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

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

  // If wallet holds a token, get the token ID via tokenOfOwnerByIndex(address, 0)
  const { data: tokenId } = useReadContract({
    ...propertyNFT,
    functionName: 'tokenOfOwnerByIndex',
    args: address ? [address, BigInt(0)] : undefined,
    query: { enabled: !!address && !!balance && (balance as bigint) > BigInt(0) },
  });

  // Get property info for the token
  const { data: propertyInfo } = useReadContract({
    ...propertyNFT,
    functionName: 'getProperty',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined },
  });

  const hasProperty = balance !== undefined && (balance as bigint) > BigInt(0);

  return {
    address,
    hasProperty,
    balance: balance ? Number(balance) : 0,
    votes: votes ? Number(votes) : 0,
    delegatee: delegatee as string | undefined,
    totalSupply: totalSupply ? Number(totalSupply) : 0,
    tokenId: tokenId !== undefined ? Number(tokenId) : undefined,
    propertyInfo: propertyInfo as {
      lotNumber: bigint;
      squareFootage: bigint;
      lastDuesTimestamp: bigint;
      streetAddress: string;
    } | undefined,
  };
}
