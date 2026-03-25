import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('hoa_pets').select('*').order('created_at', { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { wallet_address, lot_number, name, species, breed, color, weight, age, vaccinated, microchipped, notes } = body;
  if (!wallet_address || !name || !species) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('hoa_pets')
    .insert({ wallet_address, lot_number, name, species, breed, color, weight, age, vaccinated, microchipped, notes })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
