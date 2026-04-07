import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { supabaseAnon } from '@/lib/supabase-anon';
import { withAuth } from '@/lib/apiAuth';
import { violationCreateSchema, violationPatchSchema } from '@/lib/validation';
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// GET — Public
export async function GET(request: Request) {
  const limited = await applyRateLimit(request, 'violations:get', RATE_LIMITS.read);
  if (limited) return limited;

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const lot = url.searchParams.get('lot');

  let query = supabaseAnon
    .from('hoa_violations')
    .select('*, hoa_violation_updates(*)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (status && status !== 'all') query = query.eq('status', status);
  if (lot) query = query.eq('accused_lot', parseInt(lot));

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST — Authenticated (report violation)
// Strict rate limit + spam detection for anonymous reporting abuse
export const POST = withAuth(async (request, { address }) => {
  const limited = await applyRateLimit(request, 'violations:post', RATE_LIMITS.strict);
  if (limited) return limited;

  const body = await request.json();
  const parsed = violationCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { reported_by_lot, accused_lot, category, title, description, location, ccr_section, anonymous_report } = parsed.data;

  // Spam detection: check for duplicate submissions from same user in last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: recent } = await supabaseAdmin
    .from('hoa_violations')
    .select('description')
    .eq('reported_by', anonymous_report ? 'anonymous' : address)
    .gte('created_at', oneHourAgo);

  if (recent && recent.length >= 3) {
    return NextResponse.json({ error: 'Too many violation reports. Please wait before submitting more.' }, { status: 429 });
  }

  // Reject if description is identical to a recent submission
  if (recent?.some((r) => r.description === description)) {
    return NextResponse.json({ error: 'Duplicate report detected' }, { status: 409 });
  }

  const year = new Date().getFullYear();
  const { count } = await supabaseAdmin
    .from('hoa_violations')
    .select('*', { count: 'exact', head: true });
  const num = String((count || 0) + 1).padStart(3, '0');
  const violation_number = `VIO-${year}-${num}`;

  const { data, error } = await supabaseAdmin
    .from('hoa_violations')
    .insert({
      violation_number,
      reported_by: anonymous_report ? 'anonymous' : address,
      reported_by_lot,
      accused_lot,
      category,
      title,
      description,
      location,
      ccr_section,
      anonymous_report: anonymous_report || false,
      status: 'reported',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message }, { status: 500 });

  await supabaseAdmin.from('hoa_violation_updates').insert({
    violation_id: data.id,
    action: 'status_change',
    new_status: 'reported',
    text: 'Violation reported and submitted for board review.',
    updated_by: anonymous_report ? 'anonymous' : address,
  });

  return NextResponse.json(data, { status: 201 });
});

// PATCH — Board members only (FE-02: verify board membership before allowing status changes)
export const PATCH = withAuth(async (request, { address }) => {
  const limited = await applyRateLimit(request, 'violations:patch', RATE_LIMITS.write);
  if (limited) return limited;

  // FE-02: only active board members may update violations — any authenticated
  // homeowner could otherwise dismiss their own violation or erase their fine.
  const { data: boardMember } = await supabaseAdmin
    .from('hoa_board_members')
    .select('id')
    .eq('active', true)
    .ilike('wallet_address', address)
    .limit(1)
    .single();

  if (!boardMember) {
    return NextResponse.json({ error: 'Board access required' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = violationPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { id, status, notes, fine_amount, cure_days, hearing_date } = parsed.data;

  const { data: current } = await supabaseAdmin
    .from('hoa_violations')
    .select('status, violation_number')
    .eq('id', id)
    .single();

  const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (notes) updates.review_notes = notes;
  if (fine_amount !== undefined) updates.fine_amount = fine_amount;
  if (cure_days) {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + cure_days);
    updates.cure_deadline = deadline.toISOString();
  }
  if (hearing_date) updates.hearing_date = hearing_date;

  const { error } = await supabaseAdmin
    .from('hoa_violations')
    .update(updates)
    .eq('id', id);

  if (error) return NextResponse.json({ error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message }, { status: 500 });

  const statusMessages: Record<string, string> = {
    'under-review': 'Board is reviewing this violation report.',
    'dismissed': `Board dismissed this report. ${notes || ''}`,
    'notice-issued': 'Formal violation notice issued to homeowner.',
    'cure-period': `Homeowner has ${cure_days || 14} days to correct the violation.`,
    'cured': 'Homeowner submitted proof of compliance. Violation resolved.',
    'disputed': 'Homeowner has disputed this violation. Hearing requested.',
    'hearing': `Hearing scheduled${hearing_date ? ' for ' + new Date(hearing_date).toLocaleDateString() : ''}.`,
    'ruling-upheld': `Board ruling: Violation upheld. ${notes || ''}`,
    'ruling-modified': `Board ruling: Modified. ${notes || ''}`,
    'ruling-dismissed': `Board ruling: Dismissed after hearing. ${notes || ''}`,
    'fined': `Fine of $${((fine_amount || 0) / 100).toFixed(2)} issued.`,
    'appealed': 'Community appeal initiated. Governance vote will determine outcome.',
    'appeal-upheld': 'Community vote: Ruling upheld.',
    'appeal-overturned': 'Community vote: Ruling overturned. Violation dismissed, fine refunded.',
    'resolved': 'Violation fully resolved.',
    'closed': 'Violation administratively closed.',
  };

  await supabaseAdmin.from('hoa_violation_updates').insert({
    violation_id: id,
    action: 'status_change',
    old_status: current?.status,
    new_status: status,
    text: statusMessages[status] || `Status changed to ${status}.`,
    updated_by: address,
  });

  return NextResponse.json({ ok: true, violation_number: current?.violation_number });
});
