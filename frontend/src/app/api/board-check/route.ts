import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet');
  if (!wallet) {
    return NextResponse.json({ isBoard: false });
  }

  const { data, error } = await supabaseAdmin
    .from('hoa_board_members')
    .select('id')
    .eq('active', true)
    .ilike('wallet_address', wallet)
    .limit(1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ isBoard: (data?.length ?? 0) > 0 });
}
