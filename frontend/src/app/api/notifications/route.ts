import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/notifications?wallet=0x...
export async function GET(request: Request) {
  const url = new URL(request.url);
  const wallet = url.searchParams.get('wallet');
  if (!wallet) return NextResponse.json({ error: 'wallet required' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('hoa_notifications')
    .select('*')
    .eq('wallet_address', wallet.toLowerCase())
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// PATCH /api/notifications — Mark as read
export async function PATCH(request: Request) {
  const body = await request.json();
  const { id } = body;

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('hoa_notifications')
    .update({ read: true })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// POST /api/notifications — Create notification (internal use)
export async function POST(request: Request) {
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
}
