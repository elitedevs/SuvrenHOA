import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/apiAuth';
import { linkWalletSchema } from '@/lib/validation';
import { normalizeAddress } from '@/lib/address';
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/profile/link-wallet
 * Auto-links a wallet address to the authenticated user's profile.
 */
export const POST = withAuth(async (request, { address }) => {
  const limited = applyRateLimit(request, 'link-wallet:post', RATE_LIMITS.write);
  if (limited) return limited;

  const body = await request.json();
  const parsed = linkWalletSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const walletAddress = normalizeAddress(parsed.data.wallet_address || address);

  const { data: existing } = await supabaseAdmin
    .from('hoa_profiles')
    .select('wallet_address')
    .eq('wallet_address', walletAddress)
    .single();

  if (existing) {
    return NextResponse.json({ linked: true, wallet_address: walletAddress });
  }

  const { error } = await supabaseAdmin
    .from('hoa_profiles')
    .upsert(
      {
        wallet_address: walletAddress,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'wallet_address' }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ linked: true, wallet_address: walletAddress });
});
