import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { supabaseAnon } from '@/lib/supabase-anon';
import { withAuth } from '@/lib/apiAuth';
import { surveyCreateSchema, surveyVoteSchema } from '@/lib/validation';
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// GET — Public
export async function GET(request: Request) {
  const limited = applyRateLimit(request, 'surveys:get', RATE_LIMITS.read);
  if (limited) return limited;

  const { data, error } = await supabaseAnon
    .from('hoa_surveys')
    .select('*, hoa_survey_options(*), hoa_survey_responses(*)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST — Authenticated (create survey)
export const POST = withAuth(async (request, { address }) => {
  const limited = applyRateLimit(request, 'surveys:post', RATE_LIMITS.write);
  if (limited) return limited;

  const body = await request.json();
  const parsed = surveyCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { title, description, anonymous, closes_in_days, options } = parsed.data;

  const closes_at = new Date();
  closes_at.setDate(closes_at.getDate() + (closes_in_days || 7));

  const { data: survey, error: surveyError } = await supabaseAdmin
    .from('hoa_surveys')
    .insert({
      title,
      description,
      created_by: address,
      anonymous: anonymous || false,
      closes_at: closes_at.toISOString(),
    })
    .select()
    .single();

  if (surveyError) return NextResponse.json({ error: surveyError.message }, { status: 500 });

  const optionRows = options.map((label: string, i: number) => ({
    survey_id: survey.id,
    label,
    sort_order: i,
  }));

  const { error: optError } = await supabaseAdmin
    .from('hoa_survey_options')
    .insert(optionRows);

  if (optError) return NextResponse.json({ error: optError.message }, { status: 500 });

  return NextResponse.json(survey, { status: 201 });
});

// PATCH — Authenticated (vote)
// Uses session-verified address for deduplication — not user-supplied wallet
export const PATCH = withAuth(async (request, { address }) => {
  const limited = applyRateLimit(request, 'surveys:patch', RATE_LIMITS.write);
  if (limited) return limited;

  const body = await request.json();
  const parsed = surveyVoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { survey_id, option_id } = parsed.data;

  // Dedup using session-verified address (not user-supplied)
  const { data: existing } = await supabaseAdmin
    .from('hoa_survey_responses')
    .select('id')
    .eq('survey_id', survey_id)
    .eq('wallet_address', address)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'Already voted' }, { status: 409 });
  }

  const { data, error } = await supabaseAdmin
    .from('hoa_survey_responses')
    .insert({
      survey_id,
      option_id,
      wallet_address: address,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});
