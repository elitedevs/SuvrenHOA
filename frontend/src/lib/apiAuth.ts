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
 * an active board member. Use for any endpoint that performs board-only write actions
 * (creating announcements, reviewing architectural requests, etc.).
 *
 * CR-02: queries `hoa_board_members` (the actual source of truth for board membership)
 * instead of `profiles.wallet_address` which does not exist in the live schema.
 * The old query always returned null → every board route silently 403'd for everyone.
 */
export function withBoardAuth(handler: AuthenticatedHandler) {
  return async (request: Request) => {
    const address = await getAuthenticatedAddress();
    if (!address) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const normalizedAddress = normalizeAddress(address);

    const { data: boardMember } = await supabaseAdmin
      .from('hoa_board_members')
      .select('id')
      .eq('wallet_address', normalizedAddress)
      .eq('active', true)
      .single();

    if (!boardMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return handler(request, { address: normalizedAddress });
  };
}
