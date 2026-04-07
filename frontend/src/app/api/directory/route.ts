import { NextResponse } from 'next/server';
import { supabaseAnon } from '@/lib/supabase-anon';
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// GET — Public
export async function GET(request: Request) {
  const limited = await applyRateLimit(request, 'directory:get', RATE_LIMITS.read);
  if (limited) return limited;

  const [boardRes, committeesRes] = await Promise.all([
    supabaseAnon
      .from('hoa_board_members')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true }),
    supabaseAnon
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
