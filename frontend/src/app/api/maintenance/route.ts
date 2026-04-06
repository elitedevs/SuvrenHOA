import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { supabaseAnon } from '@/lib/supabase-anon';
import { withAuth } from '@/lib/apiAuth';
import { maintenanceCreateSchema } from '@/lib/validation';
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// GET — Public
export async function GET(request: Request) {
  const limited = applyRateLimit(request, 'maintenance:get', RATE_LIMITS.read);
  if (limited) return limited;

  const url = new URL(request.url);
  const status = url.searchParams.get('status');

  let query = supabaseAnon
    .from('hoa_maintenance_requests')
    .select('*, hoa_maintenance_updates(*)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST — Authenticated
export const POST = withAuth(async (request, { address }) => {
  const limited = applyRateLimit(request, 'maintenance:post', RATE_LIMITS.write);
  if (limited) return limited;

  const body = await request.json();
  const parsed = maintenanceCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { lot_number, title, description, category, location, priority } = parsed.data;

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
      wallet_address: address,
      lot_number,
      title,
      description,
      category: category || 'Other',
      location,
      priority: priority || 'medium',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
});
