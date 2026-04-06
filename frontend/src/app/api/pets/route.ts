import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { supabaseAnon } from '@/lib/supabase-anon';
import { withAuth } from '@/lib/apiAuth';
import { petCreateSchema } from '@/lib/validation';
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// GET — Public
export async function GET(request: Request) {
  const limited = applyRateLimit(request, 'pets:get', RATE_LIMITS.read);
  if (limited) return limited;

  const { data, error } = await supabaseAnon
    .from('hoa_pets').select('*').order('created_at', { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST — Authenticated
export const POST = withAuth(async (request, { address }) => {
  const limited = applyRateLimit(request, 'pets:post', RATE_LIMITS.write);
  if (limited) return limited;

  const body = await request.json();
  const parsed = petCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { lot_number, name, species, breed, color, weight, age, vaccinated, microchipped, notes } = parsed.data;

  const { data, error } = await supabaseAdmin
    .from('hoa_pets')
    .insert({ wallet_address: address, lot_number, name, species, breed, color, weight, age, vaccinated, microchipped, notes })
    .select().single();
  if (error) return NextResponse.json({ error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
});
