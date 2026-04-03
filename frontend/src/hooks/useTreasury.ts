'use client';

import { useReadContract } from 'wagmi';
import { useContracts } from './useContracts';
import { formatUnits } from 'viem';

/**
 * Get treasury balance and dues info.
 */
export function useTreasury() {
  const { treasury } = useContracts();

  const { data: snapshot, isLoading: snapLoading, error: snapError } = useReadContract({
    ...treasury,
    functionName: 'getTreasurySnapshot',
  });

  const { data: quarterlyDues, isLoading: duesLoading, error: duesError } = useReadContract({
    ...treasury,
    functionName: 'quarterlyDuesAmount',
  });

  const { data: annualDiscount, error: discountError } = useReadContract({
    ...treasury,
    functionName: 'annualDuesDiscount',
  });

  const { data: expenditureCount } = useReadContract({
    ...treasury,
    functionName: 'getExpenditureCount',
  });

  // Parse snapshot tuple: [totalBalance, operating, reserve, expenditureCount]
  const snap = snapshot as [bigint, bigint, bigint, bigint] | undefined;
  const total = snap ? formatUSDC(snap[0]) : '0.00';
  const operating = snap ? formatUSDC(snap[1]) : '0.00';
  const reserve = snap ? formatUSDC(snap[2]) : '0.00';

  const quarterly = quarterlyDues ? formatUSDC(quarterlyDues as bigint) : '200.00';
  const discount = annualDiscount ? Number(annualDiscount) / 100 : 5;

  const annualAmount = quarterlyDues
    ? formatUSDC((quarterlyDues as bigint) * BigInt(4) * BigInt(10000 - Number(annualDiscount ?? 0)) / BigInt(10000))
    : '760.00';

  const firstError = snapError ?? duesError ?? discountError;

  return {
    totalBalance: total,
    operatingBalance: operating,
    reserveBalance: reserve,
    quarterlyDues: quarterly,
    annualDiscount: discount,
    annualAmount,
    expenditureCount: expenditureCount ? Number(expenditureCount) : 0,
    loading: snapLoading || duesLoading,
    error: firstError ? (firstError as Error).message || 'Failed to load treasury data' : null,
  };
}

/**
 * Get dues status for a specific property
 */
export function useDuesStatus(tokenId: number | undefined) {
  const { treasury } = useContracts();

  const { data: isCurrent, error: isCurrentError } = useReadContract({
    ...treasury,
    functionName: 'isDuesCurrent',
    args: tokenId !== undefined ? [BigInt(tokenId)] : undefined,
    query: { enabled: tokenId !== undefined },
  });

  const { data: duesOwed } = useReadContract({
    ...treasury,
    functionName: 'getDuesOwed',
    args: tokenId !== undefined ? [BigInt(tokenId)] : undefined,
    query: { enabled: tokenId !== undefined },
  });

  return {
    isCurrent: isCurrent as boolean | undefined,
    quartersOwed: duesOwed ? Number((duesOwed as [bigint, bigint])[0]) : 0,
    amountOwed: duesOwed ? formatUSDC((duesOwed as [bigint, bigint])[1]) : '0.00',
    error: isCurrentError ? (isCurrentError as Error).message || 'Failed to load dues status' : null,
  };
}

function formatUSDC(wei: bigint): string {
  return parseFloat(formatUnits(wei, 6)).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
