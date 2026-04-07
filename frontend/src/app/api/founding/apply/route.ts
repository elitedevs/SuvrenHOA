import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { z } from 'zod';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

// M-07: handle CORS preflight
export function OPTIONS() {
  return new Response(null, { status: 204 });
}

/** H-07: Server-safe HTML escaping for email templates (no DOM required). */
function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function getResend() {
  return process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
}

const applySchema = z.object({
  community_name: z.string().min(2).max(120).trim(),
  property_count: z.number().int().min(1).max(10000),
  contact_name: z.string().min(2).max(100).trim(),
  contact_email: z.string().email().max(254).toLowerCase(),
  contact_phone: z.string().max(30).optional(),
  role: z.enum(['board_president', 'board_member', 'property_manager', 'resident', 'other']),
  pain_points: z.array(z.string().max(80)).max(10).default([]),
  referral_source: z.string().max(120).optional(),
  additional_notes: z.string().max(1000).optional(),
});

export async function POST(request: Request) {
  const limited = await applyRateLimit(request, 'founding:apply', RATE_LIMITS.strict);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = applySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const data = parsed.data;

  // Check for duplicate email
  const { data: existing } = await supabaseAdmin
    .from('founding_applications')
    .select('id, status')
    .eq('contact_email', data.contact_email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'An application from this email already exists.', status: existing.status },
      { status: 409 }
    );
  }

  const { data: application, error } = await supabaseAdmin
    .from('founding_applications')
    .insert(data)
    .select('id')
    .single();

  if (error) {
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message },
      { status: 500 }
    );
  }

  // Send confirmation email (non-blocking)
  void sendApplicationReceivedEmail(data.contact_email, data.contact_name, data.community_name);

  // Notify admin (non-blocking)
  void sendAdminNotificationEmail(data);

  return NextResponse.json({ id: application.id, message: 'Application submitted successfully.' }, { status: 201 });
}

async function sendApplicationReceivedEmail(email: string, name: string, communityName: string) {
  const resend = getResend();
  if (!resend) return;
  try {
    await resend.emails.send({
      from: 'SuvrenHOA <founding@suvren.com>',
      to: email,
      subject: 'We received your Founding Community application',
      html: foundingReceivedHtml(name, communityName),
    });
  } catch (err) {
    console.error('[founding] email send failed:', err);
  }
}

async function sendAdminNotificationEmail(data: z.infer<typeof applySchema>) {
  const resend = getResend();
  if (!resend || !process.env.ADMIN_EMAIL) return;
  try {
    await resend.emails.send({
      from: 'SuvrenHOA <founding@suvren.com>',
      to: process.env.ADMIN_EMAIL,
      subject: `New Founding Application: ${data.community_name}`,
      html: `<p><strong>${esc(data.contact_name)}</strong> (${esc(data.contact_email)}) applied for the Founding Community Program on behalf of <strong>${esc(data.community_name)}</strong> (${esc(String(data.property_count))} units).</p><p>Role: ${esc(data.role)}</p><p>Pain points: ${esc(data.pain_points.join(', '))}</p><p>Referral: ${esc(data.referral_source || 'N/A')}</p><p>Notes: ${esc(data.additional_notes || 'N/A')}</p><p><a href="https://app.suvren.com/admin/founding">Review in Admin →</a></p>`,
    });
  } catch (err) {
    console.error('[founding] admin notify failed:', err);
  }
}

function foundingReceivedHtml(name: string, communityName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Application Received</title></head>
<body style="margin:0;padding:0;background:#0C0C0E;font-family:Inter,sans-serif;color:#E8E4DC;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:40px auto;">
    <tr><td style="background:#141416;border:1px solid #2A2A2E;border-radius:12px;padding:48px 40px;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="font-size:28px;font-weight:700;color:#B09B71;letter-spacing:0.02em;">SuvrenHOA</div>
        <div style="font-size:12px;color:#8A8070;margin-top:4px;letter-spacing:0.1em;text-transform:uppercase;">Founding Community Program</div>
      </div>
      <h1 style="font-size:24px;font-weight:600;color:#E8E4DC;margin:0 0 16px;">Application Received</h1>
      <p style="font-size:16px;line-height:1.6;color:#C4BAA8;margin:0 0 24px;">Hi ${name},</p>
      <p style="font-size:16px;line-height:1.6;color:#C4BAA8;margin:0 0 24px;">
        Thank you for applying to the <strong style="color:#B09B71;">SuvrenHOA Founding Community Program</strong> on behalf of <strong style="color:#E8E4DC;">${communityName}</strong>.
      </p>
      <p style="font-size:16px;line-height:1.6;color:#C4BAA8;margin:0 0 32px;">
        We review applications personally and will be in touch within 2–3 business days. As a founding member, you'll receive a lifetime 20% discount, priority support, a founding badge, and a direct line to our roadmap.
      </p>
      <div style="background:#1A1A1E;border:1px solid #2A2A2E;border-radius:8px;padding:20px 24px;margin-bottom:32px;">
        <p style="font-size:13px;font-weight:600;color:#B09B71;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.08em;">Your Benefits</p>
        <ul style="margin:0;padding:0 0 0 16px;color:#C4BAA8;font-size:14px;line-height:1.8;">
          <li>20% lifetime discount on your plan</li>
          <li>Priority support — real humans, fast</li>
          <li>Founding Community badge</li>
          <li>Early access to new features</li>
          <li>Direct input on our roadmap</li>
        </ul>
      </div>
      <p style="font-size:14px;color:#8A8070;text-align:center;margin:0;">
        Questions? Reply to this email or reach us at <a href="mailto:hello@suvren.com" style="color:#B09B71;">hello@suvren.com</a>
      </p>
    </td></tr>
    <tr><td style="padding:24px 0;text-align:center;">
      <p style="font-size:12px;color:#4A4A52;margin:0;">© 2026 Suvren LLC · <a href="https://suvren.com" style="color:#4A4A52;">suvren.com</a></p>
    </td></tr>
  </table>
</body>
</html>`;
}
