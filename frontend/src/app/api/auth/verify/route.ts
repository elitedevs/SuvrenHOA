import { NextResponse } from 'next/server';
import { getSession, verifySiweMessage } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { message, signature } = await request.json();

  if (!message || !signature) {
    return NextResponse.json({ error: 'message and signature required' }, { status: 400 });
  }

  const session = await getSession();

  if (!session.nonce) {
    return NextResponse.json({ error: 'No nonce found — request a nonce first' }, { status: 422 });
  }

  try {
    const address = await verifySiweMessage(message, signature, session.nonce);
    session.address = address.toLowerCase();
    session.nonce = undefined;
    await session.save();
    return NextResponse.json({ address: session.address });
  } catch (e) {
    return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 });
  }
}
