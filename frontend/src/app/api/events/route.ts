import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { supabaseAnon } from '@/lib/supabase-anon';
import { withAuth } from '@/lib/apiAuth';
import { eventCreateSchema, eventRsvpSchema } from '@/lib/validation';
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// GET — Public
export async function GET(request: Request) {
  const limited = await applyRateLimit(request, 'events:get', RATE_LIMITS.read);
  if (limited) return limited;

  const { data, error } = await supabaseAnon
    .from('hoa_events')
    .select('*, hoa_event_rsvps(*)')
    .gte('start_time', new Date(Date.now() - 7 * 86400000).toISOString())
    .order('start_time', { ascending: true })
    .limit(50);

  if (error) return NextResponse.json({ error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST — Authenticated
export const POST = withAuth(async (request, { address }) => {
  const limited = await applyRateLimit(request, 'events:post', RATE_LIMITS.write);
  if (limited) return limited;

  const body = await request.json();
  const parsed = eventCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { title, description, location, event_type, start_time, end_time, all_day, max_attendees, rsvp_required } = parsed.data;

  const { data, error } = await supabaseAdmin
    .from('hoa_events')
    .insert({ title, description, location, event_type: event_type || 'community', start_time, end_time, all_day, created_by: address, max_attendees, rsvp_required })
    .select().single();

  if (error) return NextResponse.json({ error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
});

// PATCH — Authenticated (RSVP)
export const PATCH = withAuth(async (request, { address }) => {
  const limited = await applyRateLimit(request, 'events:patch', RATE_LIMITS.write);
  if (limited) return limited;

  const body = await request.json();
  const parsed = eventRsvpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { event_id, status } = parsed.data;

  const { data, error } = await supabaseAdmin
    .from('hoa_event_rsvps')
    .upsert({ event_id, wallet_address: address, status: status || 'going' }, { onConflict: 'event_id,wallet_address' })
    .select().single();

  if (error) return NextResponse.json({ error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message }, { status: 500 });
  return NextResponse.json(data);
});
