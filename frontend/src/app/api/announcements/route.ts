import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/announcements
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('hoa_announcements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get total resident count for read percentage (use hoa_profiles or hardcode for now)
  const totalResidents = 150;

  // Get read counts per announcement
  const enriched = await Promise.all(
    (data || []).map(async (a) => {
      const { count } = await supabaseAdmin
        .from('hoa_announcement_reads')
        .select('*', { count: 'exact', head: true })
        .eq('announcement_id', a.id);
      return { ...a, read_by: count || 0, total_residents: totalResidents };
    })
  );

  return NextResponse.json(enriched);
}

// POST /api/announcements — Create announcement (board only)
export async function POST(request: Request) {
  const body = await request.json();
  const { title, content, author_name, author_role, priority } = body;

  if (!title || !content || !author_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('hoa_announcements')
    .insert({ title, content, author_name, author_role: author_role || 'Board', priority: priority || 'info' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
