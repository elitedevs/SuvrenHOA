import { NextResponse } from 'next/server';
import { generateNonce } from 'siwe';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  session.nonce = generateNonce();
  await session.save();
  return NextResponse.json({ nonce: session.nonce });
}
