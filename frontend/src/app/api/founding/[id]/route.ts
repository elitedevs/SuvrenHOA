import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createSupabaseServer } from '@/lib/supabase-server';
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { z } from 'zod';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

function getResend() {
  return process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
}

const updateSchema = z.object({
  status: z.enum(['approved', 'rejected', 'waitlisted']),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await applyRateLimit(request, 'founding:update', RATE_LIMITS.write);
  if (limited) return limited;

  // Verify admin session
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'board_member') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { id } = await params;
  const { status } = parsed.data;

  // H-06: Verify the application exists before updating (IDOR guard).
  // Prevents blind updates to guessed IDs and surfaces invalid references explicitly.
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('founding_applications')
    .select('id')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  const { data: application, error } = await supabaseAdmin
    .from('founding_applications')
    .update({ status, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq('id', id)
    .select('contact_email, contact_name, community_name')
    .single();

  if (error) return NextResponse.json({ error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message }, { status: 500 });

  // Send status email (non-blocking)
  if (status === 'approved') {
    void sendApprovedEmail(application.contact_email, application.contact_name, application.community_name);
  } else if (status === 'waitlisted') {
    void sendWaitlistedEmail(application.contact_email, application.contact_name, application.community_name);
  }

  return NextResponse.json({ id, status });
}

async function sendApprovedEmail(email: string, name: string, communityName: string) {
  const resend = getResend();
  if (!resend) return;
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.suvren.com'}/signup?founding=true&email=${encodeURIComponent(email)}`;
  try {
    await resend.emails.send({
      from: 'SuvrenHOA <founding@suvren.com>',
      to: email,
      subject: `${communityName} — You're a Founding Community!`,
      html: approvedHtml(name, communityName, inviteLink),
    });
  } catch (err) {
    // Non-blocking; email send failure doesn't affect response
  }
}

async function sendWaitlistedEmail(email: string, name: string, communityName: string) {
  const resend = getResend();
  if (!resend) return;
  try {
    await resend.emails.send({
      from: 'SuvrenHOA <founding@suvren.com>',
      to: email,
      subject: `Your application for ${communityName} — Waitlist Update`,
      html: waitlistedHtml(name, communityName),
    });
  } catch (err) {
    // Non-blocking; email send failure doesn't affect response
  }
}

function approvedHtml(name: string, communityName: string, inviteLink: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>You're Approved!</title></head>
<body style="margin:0;padding:0;background:#0C0C0E;font-family:Inter,sans-serif;color:#E8E4DC;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:40px auto;">
    <tr><td style="background:#141416;border:1px solid #2A2A2E;border-radius:12px;padding:48px 40px;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="font-size:28px;font-weight:700;color:#B09B71;letter-spacing:0.02em;">SuvrenHOA</div>
      </div>
      <div style="text-align:center;margin-bottom:32px;">
        <div style="display:inline-block;background:linear-gradient(135deg,#B09B71,#8A7A55);border-radius:50%;width:64px;height:64px;line-height:64px;font-size:28px;text-align:center;">✓</div>
      </div>
      <h1 style="font-size:26px;font-weight:700;color:#B09B71;margin:0 0 16px;text-align:center;">Welcome to the Founding Community</h1>
      <p style="font-size:16px;line-height:1.6;color:#C4BAA8;margin:0 0 24px;">Hi ${name},</p>
      <p style="font-size:16px;line-height:1.6;color:#C4BAA8;margin:0 0 24px;">
        <strong style="color:#E8E4DC;">${communityName}</strong> has been approved as a <strong style="color:#B09B71;">SuvrenHOA Founding Community</strong>. You're among the first HOAs to govern transparently on the blockchain.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${inviteLink}" style="display:inline-block;background:linear-gradient(135deg,#B09B71,#8A7A55);color:#0C0C0E;font-weight:700;font-size:16px;padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.02em;">Get Started →</a>
      </div>
      <div style="background:#1A1A1E;border:1px solid #B09B7130;border-radius:8px;padding:20px 24px;margin-bottom:32px;">
        <p style="font-size:13px;font-weight:600;color:#B09B71;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.08em;">Your Founding Benefits Are Active</p>
        <ul style="margin:0;padding:0 0 0 16px;color:#C4BAA8;font-size:14px;line-height:1.8;">
          <li>20% lifetime discount — applied automatically</li>
          <li>Priority support queue</li>
          <li>Founding Community badge on your dashboard</li>
          <li>Early access to all new features</li>
          <li>Monthly roadmap call invitation</li>
        </ul>
      </div>
      <p style="font-size:14px;color:#8A8070;text-align:center;margin:0;">Questions? <a href="mailto:hello@suvren.com" style="color:#B09B71;">hello@suvren.com</a></p>
    </td></tr>
    <tr><td style="padding:24px 0;text-align:center;">
      <p style="font-size:12px;color:#4A4A52;margin:0;">© 2026 Suvren LLC · <a href="https://suvren.com" style="color:#4A4A52;">suvren.com</a></p>
    </td></tr>
  </table>
</body>
</html>`;
}

function waitlistedHtml(name: string, communityName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Waitlist Update</title></head>
<body style="margin:0;padding:0;background:#0C0C0E;font-family:Inter,sans-serif;color:#E8E4DC;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:40px auto;">
    <tr><td style="background:#141416;border:1px solid #2A2A2E;border-radius:12px;padding:48px 40px;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="font-size:28px;font-weight:700;color:#B09B71;letter-spacing:0.02em;">SuvrenHOA</div>
      </div>
      <h1 style="font-size:24px;font-weight:600;color:#E8E4DC;margin:0 0 16px;">You're on the Waitlist</h1>
      <p style="font-size:16px;line-height:1.6;color:#C4BAA8;margin:0 0 24px;">Hi ${name},</p>
      <p style="font-size:16px;line-height:1.6;color:#C4BAA8;margin:0 0 24px;">
        Thank you for your interest in the Founding Community Program for <strong style="color:#E8E4DC;">${communityName}</strong>. We've added you to our waitlist and will reach out as soon as a spot opens.
      </p>
      <p style="font-size:16px;line-height:1.6;color:#C4BAA8;margin:0 0 32px;">
        In the meantime, you can still sign up for early access to SuvrenHOA — all the core features, ready when you are.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="https://suvren.com/launch" style="display:inline-block;border:1px solid #B09B71;color:#B09B71;font-weight:600;font-size:15px;padding:12px 28px;border-radius:8px;text-decoration:none;">Stay Updated →</a>
      </div>
      <p style="font-size:14px;color:#8A8070;text-align:center;margin:0;">Questions? <a href="mailto:hello@suvren.com" style="color:#B09B71;">hello@suvren.com</a></p>
    </td></tr>
    <tr><td style="padding:24px 0;text-align:center;">
      <p style="font-size:12px;color:#4A4A52;margin:0;">© 2026 Suvren LLC · <a href="https://suvren.com" style="color:#4A4A52;">suvren.com</a></p>
    </td></tr>
  </table>
</body>
</html>`;
}
