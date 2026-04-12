'use client';

import { useChainId } from 'wagmi';
import { getContracts } from '@/config/contracts';

import PropertyNFTAbi from '@/config/abis/PropertyNFT.json';
import FaircroftGovernorAbi from '@/config/abis/FaircroftGovernor.json';
import FaircroftTreasuryAbi from '@/config/abis/FaircroftTreasury.json';
import DocumentRegistryAbi from '@/config/abis/DocumentRegistry.json';
import DuesLendingAbi from '@/config/abis/DuesLending.json';
import TreasuryYieldAbi from '@/config/abis/TreasuryYield.json';
import VendorEscrowAbi from '@/config/abis/VendorEscrow.json';

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
    duesLending: {
      address: addresses.duesLending,
      abi: DuesLendingAbi,
    },
    treasuryYield: {
      address: addresses.treasuryYield,
      abi: TreasuryYieldAbi,
    },
    vendorEscrow: {
      address: addresses.vendorEscrow,
      abi: VendorEscrowAbi,
    },
    usdc: addresses.usdc,
    timelock: addresses.timelock,
  };
}
