import { type NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VALID_SOURCES = ['launch_page', 'press', 'social', 'referral', 'other'] as const;
type Source = (typeof VALID_SOURCES)[number];

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'newsletter', RATE_LIMITS.strict);
  if (limited) return limited;

  let email: string;
  let source: Source;
  try {
    const body = await req.json();
    email = (typeof body.email === 'string' ? body.email : '').trim().toLowerCase();
    const rawSource = body.source;
    source = VALID_SOURCES.includes(rawSource) ? rawSource : 'launch_page';
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!email || !EMAIL_RE.test(email)) {
    return Response.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('launch_signups')
    .insert({ email, source });

  if (error) {
    // unique_violation — already signed up, treat as success
    if (error.code === '23505') {
      return Response.json({ message: 'Already signed up' }, { status: 200 });
    }
    console.error('[newsletter] insert error:', error.message);
    return Response.json({ error: 'Failed to save. Please try again.' }, { status: 500 });
  }

  return Response.json({ message: 'Signed up successfully' }, { status: 201 });
}
