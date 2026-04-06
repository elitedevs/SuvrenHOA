import { getIronSession, type SessionOptions, type IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SiweMessage } from 'siwe';

export interface SessionData {
  nonce?: string;
  address?: string;
}

export const sessionOptions: SessionOptions = {
  cookieName: 'suvren_session',
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_replace_me',
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
  const siweMessage = new SiweMessage(message);
  const { data } = await siweMessage.verify({ signature, nonce });
  return data.address;
}

export async function getAuthenticatedAddress(): Promise<string | null> {
  const session = await getSession();
  return session.address || null;
}
