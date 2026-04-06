import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/profile/link-wallet
 * Auto-links a wallet address to the authenticated user's profile.
 * Called when a user connects a wallet for the first time.
 */
export const POST = withAuth(async (request, { address }) => {
  const body = await request.json();
  const walletAddress = (body.wallet_address || address).toLowerCase();

  // Upsert profile with wallet address — only sets wallet_address if not already present
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
