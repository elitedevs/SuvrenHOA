import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/reservations — List reservations with optional amenity filter
export async function GET(request: Request) {
  const url = new URL(request.url);
  const amenity = url.searchParams.get('amenity');

  let query = supabaseAdmin
    .from('hoa_reservations')
    .select('*')
    .gte('date', new Date().toISOString().split('T')[0]) // Future only
    .order('date', { ascending: true })
    .limit(50);

  if (amenity) {
    query = query.eq('amenity_id', amenity);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST /api/reservations — Create reservation
export async function POST(request: Request) {
  const body = await request.json();
  const { amenity_id, wallet_address, lot_number, date, time_slot, notes } = body;

  if (!amenity_id || !wallet_address || !date || !time_slot) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Check for conflicts
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
    .insert({ amenity_id, wallet_address, lot_number, date, time_slot, notes, status: 'confirmed' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
