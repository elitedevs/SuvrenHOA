import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

// GET — Public
export async function GET(request: Request) {
  const url = new URL(request.url);
  const amenity = url.searchParams.get('amenity');

  let query = supabaseAdmin
    .from('hoa_reservations')
    .select('*')
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true })
    .limit(50);

  if (amenity) {
    query = query.eq('amenity_id', amenity);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST — Authenticated
export const POST = withAuth(async (request, { address }) => {
  const body = await request.json();
  const { amenity_id, lot_number, date, time_slot, notes } = body;

  if (!amenity_id || !date || !time_slot) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
});
