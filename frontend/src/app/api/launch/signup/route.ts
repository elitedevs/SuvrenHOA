import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const signupSchema = z.object({
  email: z.string().email().max(254).toLowerCase(),
  name: z.string().max(100).trim().optional(),
  source: z.enum(['launch_page', 'press', 'social', 'referral', 'other']).default('launch_page'),
  referrer: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  const limited = applyRateLimit(request, 'launch:signup', RATE_LIMITS.strict);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('launch_signups')
    .upsert(parsed.data, { onConflict: 'email', ignoreDuplicates: true })
    .select('id')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { id: data?.id, message: "You're on the list. We'll notify you at launch." },
    { status: 201 }
  );
}

export async function GET(request: Request) {
  const limited = applyRateLimit(request, 'launch:count', RATE_LIMITS.read);
  if (limited) return limited;

  const { count, error } = await supabaseAdmin
    .from('launch_signups')
    .select('*', { count: 'exact', head: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ count: count ?? 0 });
}
