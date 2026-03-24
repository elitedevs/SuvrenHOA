'use client';

import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { useContracts } from './useContracts';
import { erc20Abi, parseUnits } from 'viem';

/**
 * Hook for paying dues — handles USDC approval + payDues in sequence
 */
export function usePayDues() {
  const { treasury, usdc } = useContracts();

  // USDC Approve
  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApproving,
  } = useWriteContract();

  const { isLoading: isApproveTxPending, isSuccess: isApproved } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // Pay Dues
  const {
    writeContract: writePayDues,
    data: payHash,
    isPending: isPaying,
  } = useWriteContract();

  const { isLoading: isPayTxPending, isSuccess: isPaid } = useWaitForTransactionReceipt({
    hash: payHash,
  });

  const approve = (amount: string) => {
    const parsed = parseUnits(amount, 6); // USDC has 6 decimals
    writeApprove({
      address: usdc,
      abi: erc20Abi,
      functionName: 'approve',
      args: [treasury.address, parsed],
    });
  };

  const payDues = (tokenId: number, quarters: number) => {
    writePayDues({
      ...treasury,
      functionName: 'payDues',
      args: [BigInt(tokenId), BigInt(quarters)],
    });
  };

  return {
    approve,
    payDues,
    isApproving: isApproving || isApproveTxPending,
    isApproved,
    isPaying: isPaying || isPayTxPending,
    isPaid,
    approveHash,
    payHash,
  };
}

/**
 * Check current USDC allowance for treasury
 */
export function useUSDCAllowance(ownerAddress: string | undefined) {
  const { treasury, usdc } = useContracts();

  const { data } = useReadContract({
    address: usdc,
    abi: erc20Abi,
    functionName: 'allowance',
    args: ownerAddress ? [ownerAddress as `0x${string}`, treasury.address] : undefined,
    query: { enabled: !!ownerAddress, refetchInterval: 10_000 },
  });

  return data ? Number(data) / 1e6 : 0; // Return in dollars
}

/**
 * Check USDC balance
 */
export function useUSDCBalance(address: string | undefined) {
  const { usdc } = useContracts();

  const { data } = useReadContract({
    address: usdc,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });

  return data ? Number(data) / 1e6 : 0; // Return in dollars
}
