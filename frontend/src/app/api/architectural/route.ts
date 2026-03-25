import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

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

export async function POST(request: Request) {
  const body = await request.json();
  const { wallet_address, lot_number, title, description, modification_type, estimated_cost, contractor_name, start_date, completion_date } = body;

  if (!wallet_address || !lot_number || !title || !description || !modification_type) {
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
      request_number, wallet_address, lot_number, title, description, modification_type,
      estimated_cost, contractor_name, start_date, completion_date,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, status, reviewer_notes, conditions, reviewed_by } = body;

  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('hoa_architectural_requests')
    .update({
      status,
      reviewer_notes,
      conditions,
      reviewed_by,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
