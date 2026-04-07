import { NextResponse } from 'next/server';
import { getSession, verifySiweMessage } from '@/lib/auth';
import { authVerifySchema } from '@/lib/validation';
import { normalizeAddress } from '@/lib/address';
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const limited = await applyRateLimit(request, 'auth:verify', RATE_LIMITS.strict);
  if (limited) return limited;

  const body = await request.json();
  const parsed = authVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { message, signature } = parsed.data;
  const session = await getSession();

  if (!session.nonce) {
    return NextResponse.json({ error: 'No nonce found — request a nonce first' }, { status: 422 });
  }

  try {
    const address = await verifySiweMessage(message, signature, session.nonce);
    session.address = normalizeAddress(address);
    session.nonce = undefined;
    await session.save();
    return NextResponse.json({ address: session.address });
  } catch (e) {
    return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 });
  }
}
