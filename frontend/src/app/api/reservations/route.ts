import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { supabaseAnon } from '@/lib/supabase-anon';
import { withAuth } from '@/lib/apiAuth';
import { reservationCreateSchema } from '@/lib/validation';
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// GET — Public
export async function GET(request: Request) {
  const limited = await applyRateLimit(request, 'reservations:get', RATE_LIMITS.read);
  if (limited) return limited;

  const url = new URL(request.url);
  const amenity = url.searchParams.get('amenity');

  let query = supabaseAnon
    .from('hoa_reservations')
    .select('*')
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true })
    .limit(50);

  if (amenity) {
    query = query.eq('amenity_id', amenity);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST — Authenticated
export const POST = withAuth(async (request, { address }) => {
  const limited = await applyRateLimit(request, 'reservations:post', RATE_LIMITS.write);
  if (limited) return limited;

  const body = await request.json();
  const parsed = reservationCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { amenity_id, lot_number, date, time_slot, notes } = parsed.data;

  const { data: existing } = await supabaseAdmin
    .from('hoa_reservations')
    .select('id')
    .eq('amenity_id', amenity_id)
    .eq('date', date)
    .eq('time_slot', time_slot)
    .neq('status', 'cancelled')
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'Time slot already reserved' }, { status: 409 });
  }

  const { data, error } = await supabaseAdmin
    .from('hoa_reservations')
    .insert({ amenity_id, wallet_address: address, lot_number, date, time_slot, notes, status: 'confirmed' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
});
