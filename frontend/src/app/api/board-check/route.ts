import { NextRequest, NextResponse } from 'next/server';
import { supabaseAnon } from '@/lib/supabase-anon';
import { normalizeAddress } from '@/lib/address';
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const limited = applyRateLimit(request, 'board-check:get', RATE_LIMITS.read);
  if (limited) return limited;

  const wallet = request.nextUrl.searchParams.get('wallet');
  if (!wallet) {
    return NextResponse.json({ isBoard: false });
  }

  const normalized = normalizeAddress(wallet);

  const { data, error } = await supabaseAnon
    .from('hoa_board_members')
    .select('id')
    .eq('active', true)
    .ilike('wallet_address', normalized)
    .limit(1);

  if (error) {
    return NextResponse.json({ error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message }, { status: 500 });
  }

  return NextResponse.json({ isBoard: (data?.length ?? 0) > 0 });
}
