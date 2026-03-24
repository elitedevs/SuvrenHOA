import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/profile?wallet=0x...
export async function GET(request: Request) {
  const url = new URL(request.url);
  const wallet = url.searchParams.get('wallet');

  if (!wallet) return NextResponse.json({ error: 'wallet required' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('hoa_profiles')
    .select('*')
    .eq('wallet_address', wallet.toLowerCase())
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || { wallet_address: wallet.toLowerCase(), display_name: null });
}

// POST /api/profile — Create or update profile
export async function POST(request: Request) {
  const body = await request.json();
  const { wallet_address, display_name, lot_number, email, phone, bio, theme } = body;

  if (!wallet_address) return NextResponse.json({ error: 'wallet_address required' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('hoa_profiles')
    .upsert({
      wallet_address: wallet_address.toLowerCase(),
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
}
