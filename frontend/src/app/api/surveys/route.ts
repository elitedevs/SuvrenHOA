import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/surveys
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('hoa_surveys')
    .select('*, hoa_survey_options(*), hoa_survey_responses(*)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST /api/surveys — Create survey with options
export async function POST(request: Request) {
  const body = await request.json();
  const { title, description, created_by, anonymous, closes_in_days, options } = body;

  if (!title || !options || options.length < 2) {
    return NextResponse.json({ error: 'Title and at least 2 options required' }, { status: 400 });
  }

  const closes_at = new Date();
  closes_at.setDate(closes_at.getDate() + (closes_in_days || 7));

  // Create survey
  const { data: survey, error: surveyError } = await supabaseAdmin
    .from('hoa_surveys')
    .insert({
      title,
      description,
      created_by: created_by || 'board',
      anonymous: anonymous || false,
      closes_at: closes_at.toISOString(),
    })
    .select()
    .single();

  if (surveyError) return NextResponse.json({ error: surveyError.message }, { status: 500 });

  // Create options
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
}

// PATCH /api/surveys — Vote on a survey
export async function PATCH(request: Request) {
  const body = await request.json();
  const { survey_id, option_id, wallet_address } = body;

  if (!survey_id || !option_id || !wallet_address) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Check if already voted
  const { data: existing } = await supabaseAdmin
    .from('hoa_survey_responses')
    .select('id')
    .eq('survey_id', survey_id)
    .eq('wallet_address', wallet_address.toLowerCase())
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'Already voted' }, { status: 409 });
  }

  const { data, error } = await supabaseAdmin
    .from('hoa_survey_responses')
    .insert({
      survey_id,
      option_id,
      wallet_address: wallet_address.toLowerCase(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
