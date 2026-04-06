import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { supabaseAnon } from '@/lib/supabase-anon';
import { withAuth } from '@/lib/apiAuth';
import { vehicleCreateSchema } from '@/lib/validation';
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// GET — Public
export async function GET(request: Request) {
  const limited = applyRateLimit(request, 'vehicles:get', RATE_LIMITS.read);
  if (limited) return limited;

  const url = new URL(request.url);
  const lot = url.searchParams.get('lot');
  let query = supabaseAnon.from('hoa_vehicles').select('*').order('created_at', { ascending: false }).limit(100);
  if (lot) query = query.eq('lot_number', parseInt(lot));
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST — Authenticated
export const POST = withAuth(async (request, { address }) => {
  const limited = applyRateLimit(request, 'vehicles:post', RATE_LIMITS.write);
  if (limited) return limited;

  const body = await request.json();
  const parsed = vehicleCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { lot_number, make, model, year, color, license_plate, state, vehicle_type, is_guest, guest_name, valid_until } = parsed.data;

  const { data, error } = await supabaseAdmin
    .from('hoa_vehicles')
    .insert({ wallet_address: address, lot_number, make, model, year, color, license_plate, state: state || 'NC', vehicle_type: vehicle_type || 'car', is_guest, guest_name, valid_until })
    .select().single();
  if (error) return NextResponse.json({ error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
});
