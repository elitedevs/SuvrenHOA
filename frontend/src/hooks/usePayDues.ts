'use client';

import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { useContracts } from './useContracts';
import { erc20Abi, parseUnits } from 'viem';

/**
 * Hook for paying dues — handles USDC approval + payDues in sequence.
 * Returns granular pending/confirming states and error strings for each step.
 */
export function usePayDues() {
  const { treasury, usdc } = useContracts();

  // ── Approve ────────────────────────────────────────────────────────────────
  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApprovePending,
    error: approveWriteError,
  } = useWriteContract();

  const {
    isLoading: isApproveConfirming,
    isSuccess: isApproved,
    error: approveReceiptError,
  } = useWaitForTransactionReceipt({ hash: approveHash });

  // ── Pay Dues ───────────────────────────────────────────────────────────────
  const {
    writeContract: writePayDues,
    data: payHash,
    isPending: isPayPending,
    error: payWriteError,
  } = useWriteContract();

  const {
    isLoading: isPayConfirming,
    isSuccess: isPaid,
    error: payReceiptError,
  } = useWaitForTransactionReceipt({ hash: payHash });

  // ── Actions ────────────────────────────────────────────────────────────────
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
      args: [BigInt(tokenId ?? 0), BigInt(quarters ?? 0)],
    });
  };

  // ── Errors (normalized to strings) ────────────────────────────────────────
  const approveError =
    (approveWriteError?.message ?? approveReceiptError?.message ?? null);
  const payError =
    (payWriteError?.message ?? payReceiptError?.message ?? null);
  const error = approveError ?? payError ?? null;

  return {
    approve,
    payDues,
    // Granular approve states
    isApprovePending,
    isApproveConfirming,
    isApproved,
    approveError,
    approveHash,
    // Granular pay states
    isPayPending,
    isPayConfirming,
    isPaid,
    payError,
    payHash,
    // Combined error
    error,
    // Convenience combos (backward compat)
    isApproving: isApprovePending || isApproveConfirming,
    isPaying: isPayPending || isPayConfirming,
  };
}

/**
 * Check current USDC allowance for treasury.
 * Returns { value: number (in dollars), isLoading: boolean }
 */
export function useUSDCAllowance(ownerAddress: string | undefined) {
  const { treasury, usdc } = useContracts();

  const { data, isLoading } = useReadContract({
    address: usdc,
    abi: erc20Abi,
    functionName: 'allowance',
    args: ownerAddress ? [ownerAddress as `0x${string}`, treasury.address] : undefined,
    query: { enabled: !!ownerAddress, refetchInterval: 10_000 },
  });

  return {
    value: data ? Number(data) / 1e6 : 0,
    isLoading,
  };
}

/**
 * Check USDC balance.
 * Returns { value: number (in dollars), isLoading: boolean }
 */
export function useUSDCBalance(address: string | undefined) {
  const { usdc } = useContracts();

  const { data, isLoading } = useReadContract({
    address: usdc,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address, refetchInterval: 15_000 },
  });

  return {
    value: data ? Number(data) / 1e6 : 0,
    isLoading,
  };
}
