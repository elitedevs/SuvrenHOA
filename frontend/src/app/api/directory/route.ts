import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET — Public
export async function GET() {
  const [boardRes, committeesRes] = await Promise.all([
    supabaseAdmin
      .from('hoa_board_members')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true }),
    supabaseAdmin
      .from('hoa_committees')
      .select('*, hoa_committee_members(*)')
      .eq('active', true),
  ]);

  if (boardRes.error) return NextResponse.json({ error: boardRes.error.message }, { status: 500 });
  if (committeesRes.error) return NextResponse.json({ error: committeesRes.error.message }, { status: 500 });

  return NextResponse.json({
    board: boardRes.data || [],
    committees: committeesRes.data || [],
  });
}
