import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const limited = applyRateLimit(request, 'auth:session', RATE_LIMITS.read);
  if (limited) return limited;

  const session = await getSession();
  return NextResponse.json({
    address: session.address || null,
    isAuthenticated: !!session.address,
  });
}
