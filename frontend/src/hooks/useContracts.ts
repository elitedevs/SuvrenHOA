'use client';

import { useChainId } from 'wagmi';
import { getContracts } from '@/config/contracts';

import PropertyNFTAbi from '@/config/abis/PropertyNFT.json';
import FaircroftGovernorAbi from '@/config/abis/FaircroftGovernor.json';
import FaircroftTreasuryAbi from '@/config/abis/FaircroftTreasury.json';
import DocumentRegistryAbi from '@/config/abis/DocumentRegistry.json';

export function useContracts() {
  const chainId = useChainId();
  const addresses = getContracts(chainId);

  return {
    propertyNFT: {
      address: addresses.propertyNFT,
      abi: PropertyNFTAbi,
    },
    governor: {
      address: addresses.governor,
      abi: FaircroftGovernorAbi,
    },
    treasury: {
      address: addresses.treasury,
      abi: FaircroftTreasuryAbi,
    },
    documentRegistry: {
      address: addresses.documentRegistry,
      abi: DocumentRegistryAbi,
    },
    usdc: addresses.usdc,
    timelock: addresses.timelock,
  };
}
