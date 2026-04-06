import { type UserOperation } from 'viem/account-abstraction';

const PAYMASTER_URL = process.env.NEXT_PUBLIC_PAYMASTER_URL;

/**
 * Sponsors a user operation via the Coinbase Paymaster.
 * Sends the UO to the paymaster endpoint which returns the paymasterAndData field.
 */
export async function sponsorTransaction(
  userOp: UserOperation<'0.6'> | UserOperation<'0.7'>
): Promise<{ paymasterAndData: `0x${string}` }> {
  if (!PAYMASTER_URL) {
    throw new Error(
      'NEXT_PUBLIC_PAYMASTER_URL not configured. Gas sponsorship unavailable.'
    );
  }

  const res = await fetch(PAYMASTER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'pm_sponsorUserOperation',
      params: [userOp],
    }),
  });

  if (!res.ok) {
    throw new Error(`Paymaster request failed: ${res.status}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`Paymaster error: ${data.error.message}`);
  }

  return data.result;
}

/**
 * Returns true if a paymaster URL is configured,
 * meaning gas sponsorship is available.
 */
export function isPaymasterConfigured(): boolean {
  return !!PAYMASTER_URL;
}
