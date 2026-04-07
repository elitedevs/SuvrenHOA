import { NextResponse } from 'next/server';
import { getAuthenticatedAddress } from '@/lib/auth';
import { normalizeAddress } from '@/lib/address';
import { supabaseAdmin } from '@/lib/supabase';

type AuthenticatedHandler = (
  request: Request,
  context: { address: string }
) => Promise<NextResponse | Response>;

export function withAuth(handler: AuthenticatedHandler) {
  return async (request: Request) => {
    const address = await getAuthenticatedAddress();
    if (!address) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return handler(request, { address: normalizeAddress(address) });
  };
}

/**
 * H-02/H-03: Like withAuth but additionally verifies the wallet address belongs to
 * a board_member. Use for any endpoint that performs board-only write actions
 * (creating announcements, reviewing architectural requests, etc.).
 */
export function withBoardAuth(handler: AuthenticatedHandler) {
  return async (request: Request) => {
    const address = await getAuthenticatedAddress();
    if (!address) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const normalizedAddress = normalizeAddress(address);

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('wallet_address', normalizedAddress)
      .single();

    if (!profile || profile.role !== 'board_member') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return handler(request, { address: normalizedAddress });
  };
}
