import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/maintenance — List maintenance requests
export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');

  let query = supabaseAdmin
    .from('hoa_maintenance_requests')
    .select('*, hoa_maintenance_updates(*)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST /api/maintenance — Create maintenance request
export async function POST(request: Request) {
  const body = await request.json();
  const { wallet_address, lot_number, title, description, category, location, priority } = body;

  if (!wallet_address || !title || !description || !location) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Generate request number
  const year = new Date().getFullYear();
  const { count } = await supabaseAdmin
    .from('hoa_maintenance_requests')
    .select('*', { count: 'exact', head: true });
  const num = String((count || 0) + 1).padStart(3, '0');
  const request_number = `MR-${year}-${num}`;

  const { data, error } = await supabaseAdmin
    .from('hoa_maintenance_requests')
    .insert({
      request_number,
      wallet_address,
      lot_number,
      title,
      description,
      category: category || 'Other',
      location,
      priority: priority || 'medium',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
