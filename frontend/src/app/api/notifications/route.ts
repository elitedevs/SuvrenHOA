import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/apiAuth';
import { notificationCreateSchema, notificationPatchSchema } from '@/lib/validation';
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { normalizeAddress } from '@/lib/address';

export const dynamic = 'force-dynamic';

// GET — Authenticated (user-specific)
export const GET = withAuth(async (request, { address }) => {
  const limited = applyRateLimit(request, 'notifications:get', RATE_LIMITS.read);
  if (limited) return limited;

  const { data, error } = await supabaseAdmin
    .from('hoa_notifications')
    .select('*')
    .eq('wallet_address', address)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
});

// PATCH — Authenticated
export const PATCH = withAuth(async (request, { address }) => {
  const limited = applyRateLimit(request, 'notifications:patch', RATE_LIMITS.write);
  if (limited) return limited;

  const body = await request.json();
  const parsed = notificationPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { id } = parsed.data;

  const { error } = await supabaseAdmin
    .from('hoa_notifications')
    .update({ read: true })
    .eq('id', id)
    .eq('wallet_address', address);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
});

// POST — Authenticated (create notification)
export const POST = withAuth(async (request, { address }) => {
  const limited = applyRateLimit(request, 'notifications:post', RATE_LIMITS.write);
  if (limited) return limited;

  const body = await request.json();
  const parsed = notificationCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { wallet_address, type, title, message, link } = parsed.data;

  const { data, error } = await supabaseAdmin
    .from('hoa_notifications')
    .insert({ wallet_address: normalizeAddress(wallet_address), type: type || 'info', title, message: message || '', link })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
});
