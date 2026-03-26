import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/violations
export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const lot = url.searchParams.get('lot');

  let query = supabaseAdmin
    .from('hoa_violations')
    .select('*, hoa_violation_updates(*)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (status && status !== 'all') query = query.eq('status', status);
  if (lot) query = query.eq('accused_lot', parseInt(lot));

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST /api/violations — Report a violation
export async function POST(request: Request) {
  const body = await request.json();
  const { reported_by, reported_by_lot, accused_lot, category, title, description, location, ccr_section, anonymous_report } = body;

  if (!reported_by || !accused_lot || !title || !description || !category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Generate violation number
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
      reported_by: anonymous_report ? 'anonymous' : reported_by,
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create initial update
  await supabaseAdmin.from('hoa_violation_updates').insert({
    violation_id: data.id,
    action: 'status_change',
    new_status: 'reported',
    text: 'Violation reported and submitted for board review.',
    updated_by: anonymous_report ? 'anonymous' : reported_by,
  });

  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/violations — Update violation status (board action)
export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, status, notes, updated_by, fine_amount, cure_days, hearing_date } = body;

  if (!id || !status || !updated_by) {
    return NextResponse.json({ error: 'id, status, and updated_by required' }, { status: 400 });
  }

  // Get current violation
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log the status change
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
    updated_by,
  });

  return NextResponse.json({ ok: true, violation_number: current?.violation_number });
}
