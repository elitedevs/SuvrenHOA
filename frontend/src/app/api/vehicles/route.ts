import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lot = url.searchParams.get('lot');
  let query = supabaseAdmin.from('hoa_vehicles').select('*').order('created_at', { ascending: false }).limit(100);
  if (lot) query = query.eq('lot_number', parseInt(lot));
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { wallet_address, lot_number, make, model, year, color, license_plate, state, vehicle_type, is_guest, guest_name, valid_until } = body;
  if (!wallet_address || !make || !model || !color || !license_plate) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('hoa_vehicles')
    .insert({ wallet_address, lot_number, make, model, year, color, license_plate, state: state || 'NC', vehicle_type: vehicle_type || 'car', is_guest, guest_name, valid_until })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
