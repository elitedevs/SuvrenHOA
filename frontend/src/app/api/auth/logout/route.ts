import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const limited = await applyRateLimit(request, 'auth:logout', RATE_LIMITS.write);
  if (limited) return limited;

  const session = await getSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}
