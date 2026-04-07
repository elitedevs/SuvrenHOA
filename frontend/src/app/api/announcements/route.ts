import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { supabaseAnon } from '@/lib/supabase-anon';
import { withAuth } from '@/lib/apiAuth';
import { announcementCreateSchema } from '@/lib/validation';
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// GET /api/announcements — Public
export async function GET(request: Request) {
  const limited = await applyRateLimit(request, 'announcements:get', RATE_LIMITS.read);
  if (limited) return limited;

  const { data, error } = await supabaseAnon
    .from('hoa_announcements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message }, { status: 500 });

  const totalResidents = 150;

  const enriched = await Promise.all(
    (data || []).map(async (a) => {
      const { count } = await supabaseAnon
        .from('hoa_announcement_reads')
        .select('*', { count: 'exact', head: true })
        .eq('announcement_id', a.id);
      return { ...a, read_by: count || 0, total_residents: totalResidents };
    })
  );

  return NextResponse.json(enriched);
}

// POST /api/announcements — Authenticated (board only)
export const POST = withAuth(async (request, { address }) => {
  const limited = await applyRateLimit(request, 'announcements:post', RATE_LIMITS.write);
  if (limited) return limited;

  const body = await request.json();
  const parsed = announcementCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { title, content, author_name, author_role, priority } = parsed.data;

  const { data, error } = await supabaseAdmin
    .from('hoa_announcements')
    .insert({ title, content, author_name, author_role: author_role || 'Board', priority: priority || 'info' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
});
