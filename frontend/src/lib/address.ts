import { getAddress } from 'viem';

/**
 * Normalize an Ethereum address: lowercase for storage, checksummed for display.
 * Returns lowercase by default for consistent DB lookups.
 */
export function normalizeAddress(addr: string): string {
  try {
    return getAddress(addr).toLowerCase();
  } catch {
    return addr.toLowerCase();
  }
}

/**
 * Return checksummed (EIP-55) version for display purposes.
 */
export function checksumAddress(addr: string): string {
  try {
    return getAddress(addr);
  } catch {
    return addr;
  }
}
