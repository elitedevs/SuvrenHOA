import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { withAuth } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

// GET — Authenticated (user-specific)
export const GET = withAuth(async (request, { address }) => {
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
  const body = await request.json();
  const { id } = body;

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

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
  const body = await request.json();
  const { wallet_address, type, title, message, link } = body;

  if (!wallet_address || !title) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('hoa_notifications')
    .insert({ wallet_address: wallet_address.toLowerCase(), type: type || 'info', title, message: message || '', link })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
});
