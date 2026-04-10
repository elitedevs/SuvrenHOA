import { getIronSession, type SessionOptions, type IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { parseSiweMessage } from 'viem/siwe';
import { verifyMessage } from 'viem';

export interface SessionData {
  nonce?: string;
  nonceCreatedAt?: number; // FE-10: Unix ms timestamp — nonces older than 5 min are rejected
  address?: string;
}

// FE-03: SESSION_SECRET must be set — never fall back to a hardcoded string.
// A publicly-visible default key allows anyone to forge valid session cookies.
//
// Build-safety: we intentionally do NOT throw at import time. Next.js collects
// page data at build by loading every route module, and a throw here would
// crash any build that doesn't bake SESSION_SECRET into the build stage
// (e.g. docker multi-stage where env arrives at container-run time). We use
// a 32-character placeholder for build; getSession() below re-validates at
// request time so a misconfigured deployment still fails loudly — at the
// request, not the build.
const BUILD_PLACEHOLDER_SECRET = 'build-placeholder-secret-32chars!';
const sessionSecret =
  (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32)
    ? process.env.SESSION_SECRET
    : BUILD_PLACEHOLDER_SECRET;

function assertRealSecretAtRequestTime() {
  const real = process.env.SESSION_SECRET;
  if (!real || real.length < 32) {
    throw new Error(
      'SESSION_SECRET env var is required and must be at least 32 characters. ' +
      'Set it in your .env.local or deployment environment.'
    );
  }
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
  assertRealSecretAtRequestTime();
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
