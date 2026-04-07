import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { supabaseAnon } from '@/lib/supabase-anon';
import { withAuth, withBoardAuth } from '@/lib/apiAuth';
import { architecturalCreateSchema, architecturalPatchSchema } from '@/lib/validation';
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// GET — Public
export async function GET(request: Request) {
  const limited = await applyRateLimit(request, 'architectural:get', RATE_LIMITS.read);
  if (limited) return limited;

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const lot = url.searchParams.get('lot');

  let query = supabaseAnon
    .from('hoa_architectural_requests')
    .select('*, hoa_architectural_comments(*)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (status && status !== 'all') query = query.eq('status', status);
  if (lot) query = query.eq('lot_number', parseInt(lot));

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST — Authenticated
export const POST = withAuth(async (request, { address }) => {
  const limited = await applyRateLimit(request, 'architectural:post', RATE_LIMITS.write);
  if (limited) return limited;

  const body = await request.json();
  const parsed = architecturalCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { lot_number, title, description, modification_type, estimated_cost, contractor_name, start_date, completion_date } = parsed.data;

  const year = new Date().getFullYear();
  const { count } = await supabaseAdmin
    .from('hoa_architectural_requests')
    .select('*', { count: 'exact', head: true });
  const num = String((count || 0) + 1).padStart(3, '0');
  const request_number = `ARC-${year}-${num}`;

  const { data, error } = await supabaseAdmin
    .from('hoa_architectural_requests')
    .insert({
      request_number, wallet_address: address, lot_number, title, description, modification_type,
      estimated_cost, contractor_name, start_date, completion_date,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
});

// PATCH — Board members only (review/approve/reject)
export const PATCH = withBoardAuth(async (request, { address }) => {
  const limited = await applyRateLimit(request, 'architectural:patch', RATE_LIMITS.write);
  if (limited) return limited;

  const body = await request.json();
  const parsed = architecturalPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { id, status, reviewer_notes, conditions } = parsed.data;

  const { error } = await supabaseAdmin
    .from('hoa_architectural_requests')
    .update({
      status,
      reviewer_notes,
      conditions,
      reviewed_by: address,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return NextResponse.json({ error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
});
