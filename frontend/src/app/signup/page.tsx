import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createMetadata } from '@/lib/metadata';
import { supabaseAdmin } from '@/lib/supabase';
import SignupPageClient from './SignupPageClient';

/**
 * /signup is a gated door.
 *
 * Ryan's stance (2026-04-09): the product is still in stabilization and we
 * are NOT handing out public access. Only users holding a valid, unexpired
 * invitation token — or a founding-program approval tied to their email —
 * are allowed to land on this page and see the create-account form.
 *
 * Two invitation markers are accepted, and BOTH are validated against the
 * database before the form is rendered:
 *
 *   1. `?token=...` — primary invitation path. We look up the token via
 *      the `get_invitation_by_token` security-definer RPC (defined in
 *      004_invitations.sql), then require:
 *        • status = 'pending'
 *        • expires_at > now()
 *      A revoked, accepted, or expired token fails and is redirected to
 *      /waitlist. On success the invited email is locked into the signup
 *      form so the user cannot sign up under a different address than the
 *      one the admin invited.
 *
 *   2. `?founding=true&email=<addr>` — founding-program path used by the
 *      approval email in /api/founding/[id]/route.ts. We look up the
 *      `founding_applications` row by `contact_email` and require:
 *        • status = 'approved'
 *      No approved application = redirect to /waitlist. We also pull the
 *      contact_name to prefill the form.
 *
 * Anything else — no params, malformed token, founding flag without a
 * matching approved application — bounces to /waitlist. The goal is that
 * it should be impossible to land on the Create Your Account form without
 * the database first confirming that the visitor is on the guest list.
 *
 * NOTE ON SERVICE ROLE: we use supabaseAdmin for both lookups here:
 *   - For invitations, we call a security-definer RPC, so anon would
 *     technically work too — but staying consistent on one client keeps
 *     the gate logic uniform.
 *   - For founding_applications, the RLS policy restricts SELECT to
 *     authenticated board members, and this gate runs pre-auth, so we
 *     need the elevated client to check approval status.
 * This is read-only validation; no writes happen in this file.
 */

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  return {
    ...createMetadata({
      title: 'Create Your Account',
      description:
        'Create your SuvrenHOA account with your invitation token.',
      path: '/signup',
    }),
    robots: { index: false, follow: false },
  };
}

type SignupPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

type ValidatedInvitation = {
  kind: 'invitation';
  token: string;
  email: string;
  role: string;
  communityId: string;
  communityName: string;
};

type ValidatedFounding = {
  kind: 'founding';
  email: string;
  fullName: string;
  communityName: string;
};

type Validated = ValidatedInvitation | ValidatedFounding;

async function validateInvitationToken(token: string): Promise<ValidatedInvitation | null> {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_invitation_by_token', {
      invite_token: token,
    });

    if (error) {
      console.error('[signup gate] invitation rpc error:', error.message);
      return null;
    }
    // RPC returns a setof; supabase-js gives us an array.
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;
    if (row.status !== 'pending') return null;
    if (!row.expires_at || new Date(row.expires_at).getTime() <= Date.now()) {
      return null;
    }
    if (!row.email || !row.community_id) return null;

    return {
      kind: 'invitation',
      token,
      email: row.email,
      role: row.role ?? 'member',
      communityId: row.community_id,
      communityName: row.community_name ?? '',
    };
  } catch (err) {
    console.error('[signup gate] invitation validation threw:', err);
    return null;
  }
}

async function validateFoundingApplication(email: string): Promise<ValidatedFounding | null> {
  try {
    const normalized = email.trim().toLowerCase();
    if (!normalized || !normalized.includes('@')) return null;

    const { data, error } = await supabaseAdmin
      .from('founding_applications')
      .select('contact_email, contact_name, community_name, status')
      .ilike('contact_email', normalized)
      .eq('status', 'approved')
      .order('reviewed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[signup gate] founding lookup error:', error.message);
      return null;
    }
    if (!data) return null;

    return {
      kind: 'founding',
      email: data.contact_email,
      fullName: data.contact_name ?? '',
      communityName: data.community_name ?? '',
    };
  } catch (err) {
    console.error('[signup gate] founding validation threw:', err);
    return null;
  }
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const token = firstParam(params.token)?.trim();
  const founding = firstParam(params.founding)?.trim().toLowerCase();
  const emailParam = firstParam(params.email)?.trim();

  let validated: Validated | null = null;

  // Primary path: invitation token — validate against the invitations table
  // via the security-definer RPC.
  if (token && token.length > 0) {
    validated = await validateInvitationToken(token);
  }

  // Secondary path: founding-program approval — validate the email against
  // an approved founding_applications row.
  if (!validated && founding === 'true' && emailParam) {
    validated = await validateFoundingApplication(emailParam);
  }

  // Door is closed unless the visitor presents something the database
  // confirms. No grace period, no "maybe later" — just bounce to waitlist.
  if (!validated) {
    redirect('/waitlist');
  }

  // Pass the validated identity down to the client. The client uses these
  // to lock fields (email is non-editable for invitations) and to hide the
  // role selector when the invitation already dictates a role.
  if (validated.kind === 'invitation') {
    return (
      <SignupPageClient
        inviteToken={validated.token}
        lockedEmail={validated.email}
        lockedRole={validated.role}
        communityName={validated.communityName}
      />
    );
  }

  return (
    <SignupPageClient
      lockedEmail={validated.email}
      prefillName={validated.fullName}
      communityName={validated.communityName}
      foundingFlow
    />
  );
}
