import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

// GET — Public
export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const lot = url.searchParams.get('lot');

  let query = supabaseAdmin
    .from('hoa_architectural_requests')
    .select('*, hoa_architectural_comments(*)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (status && status !== 'all') query = query.eq('status', status);
  if (lot) query = query.eq('lot_number', parseInt(lot));

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST — Authenticated, uses session address
export const POST = withAuth(async (request, { address }) => {
  const body = await request.json();
  const { lot_number, title, description, modification_type, estimated_cost, contractor_name, start_date, completion_date } = body;

  if (!lot_number || !title || !description || !modification_type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
});

// PATCH — Authenticated (board review)
export const PATCH = withAuth(async (request, { address }) => {
  const body = await request.json();
  const { id, status, reviewer_notes, conditions } = body;

  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 });

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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
});
