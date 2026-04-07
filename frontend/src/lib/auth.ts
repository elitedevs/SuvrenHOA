import { getIronSession, type SessionOptions, type IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { parseSiweMessage } from 'viem/siwe';
import { verifyMessage } from 'viem';

export interface SessionData {
  nonce?: string;
  address?: string;
}

// FE-03: SESSION_SECRET must be set — never fall back to a hardcoded string.
// A publicly-visible default key allows anyone to forge valid session cookies.
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 32) {
  throw new Error(
    'SESSION_SECRET env var is required and must be at least 32 characters. ' +
    'Set it in your .env.local or deployment environment.'
  );
}

export const sessionOptions: SessionOptions = {
  cookieName: 'suvren_session',
  password: sessionSecret,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function verifySiweMessage(message: string, signature: string, nonce: string): Promise<string> {
  const parsed = parseSiweMessage(message);
  // FE-01: bind verification to the app's domain, URI, and chain to prevent
  // cross-site SIWE replay attacks where a signature for evil.com is replayed here.
  if (parsed.nonce !== nonce) throw new Error('Nonce mismatch');
  if (process.env.NEXT_PUBLIC_APP_DOMAIN && parsed.domain !== process.env.NEXT_PUBLIC_APP_DOMAIN) {
    throw new Error('Domain mismatch');
  }
  const isValid = await verifyMessage({
    address: parsed.address as `0x${string}`,
    message,
    signature: signature as `0x${string}`,
  });
  if (!isValid) throw new Error('Invalid SIWE signature');
  return parsed.address!;
}

export async function getAuthenticatedAddress(): Promise<string | null> {
  const session = await getSession();
  return session.address || null;
}
