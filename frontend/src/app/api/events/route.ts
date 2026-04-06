import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

// GET — Public
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('hoa_events')
    .select('*, hoa_event_rsvps(*)')
    .gte('start_time', new Date(Date.now() - 7 * 86400000).toISOString())
    .order('start_time', { ascending: true })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST — Authenticated
export const POST = withAuth(async (request, { address }) => {
  const body = await request.json();
  const { title, description, location, event_type, start_time, end_time, all_day, max_attendees, rsvp_required } = body;

  if (!title || !start_time) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('hoa_events')
    .insert({ title, description, location, event_type: event_type || 'community', start_time, end_time, all_day, created_by: address, max_attendees, rsvp_required })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
});

// PATCH — Authenticated (RSVP), uses session address
export const PATCH = withAuth(async (request, { address }) => {
  const body = await request.json();
  const { event_id, status } = body;

  if (!event_id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('hoa_event_rsvps')
    .upsert({ event_id, wallet_address: address, status: status || 'going' }, { onConflict: 'event_id,wallet_address' })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});
