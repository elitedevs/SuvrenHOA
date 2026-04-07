import { NextResponse } from 'next/server';
import { generateSiweNonce } from 'viem/siwe';
import { getSession } from '@/lib/auth';
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// M-07: handle CORS preflight — next.config.ts sets the CORS headers; this returns 204
export function OPTIONS() {
  return new Response(null, { status: 204 });
}

export async function GET(request: Request) {
  // M-09: nonce is an auth endpoint — use strict limit (5/min) to match verify endpoint.
  // The previous write limit (30/min) was 6× more permissive than verify (5/min),
  // allowing an attacker to pre-generate many nonces without triggering rate limits.
  const limited = await applyRateLimit(request, 'auth:nonce', RATE_LIMITS.strict);
  if (limited) return limited;

  const session = await getSession();
  session.nonce = generateSiweNonce();
  session.nonceCreatedAt = Date.now(); // FE-10: record issue time for expiry check in verify
  await session.save();
  return NextResponse.json({ nonce: session.nonce });
}
