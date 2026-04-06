import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

// GET — Authenticated (user-specific)
export const GET = withAuth(async (request, { address }) => {
  const { data, error } = await supabaseAdmin
    .from('hoa_profiles')
    .select('*')
    .eq('wallet_address', address)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || { wallet_address: address, display_name: null });
});

// POST — Authenticated
export const POST = withAuth(async (request, { address }) => {
  const body = await request.json();
  const { display_name, lot_number, email, phone, bio, theme } = body;

  const { data, error } = await supabaseAdmin
    .from('hoa_profiles')
    .upsert({
      wallet_address: address,
      display_name,
      lot_number,
      email,
      phone,
      bio,
      theme,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'wallet_address' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});
