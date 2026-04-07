import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/apiAuth';
import { profileUpdateSchema } from '@/lib/validation';
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// GET — Authenticated (user-specific)
export const GET = withAuth(async (request, { address }) => {
  const limited = await applyRateLimit(request, 'profile:get', RATE_LIMITS.read);
  if (limited) return limited;

  const { data, error } = await supabaseAdmin
    .from('hoa_profiles')
    .select('*')
    .eq('wallet_address', address)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message }, { status: 500 });
  }

  return NextResponse.json(data || { wallet_address: address, display_name: null });
});

// POST — Authenticated
export const POST = withAuth(async (request, { address }) => {
  const limited = await applyRateLimit(request, 'profile:post', RATE_LIMITS.write);
  if (limited) return limited;

  const body = await request.json();
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { display_name, lot_number, email, phone, bio, theme } = parsed.data;

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

  if (error) return NextResponse.json({ error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message }, { status: 500 });
  return NextResponse.json(data);
});
