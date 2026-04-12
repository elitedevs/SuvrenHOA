/**
 * Passkey Authentication Service for SuvrenHOA
 * WebAuthn/FIDO2 implementation using @simplewebauthn/browser
 * Credentials stored in Supabase (passkey_credentials, passkey_challenges tables)
 *
 * Ported from suvren.co — adapted to use createSupabaseBrowser() instead of
 * a global singleton, and to work within a Next.js client context.
 */

import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/browser';
import { createSupabaseBrowser } from '@/lib/supabase-browser';

// ── Types ───────────────────────────────────────────────────────────────────

export interface PasskeyUser {
  email: string;
  credentialId: string;
  authenticatedAt: number;
}

export interface PasskeyRegistrationResult {
  success: boolean;
  credentialId?: string;
  error?: string;
}

export interface PasskeyAuthenticationResult {
  success: boolean;
  user?: PasskeyUser;
  error?: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

const RP_NAME = 'SuvrenHOA';
const CHALLENGE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

function getRpId(): string {
  if (typeof window === 'undefined') return 'localhost';
  return window.location.hostname;
}

// ── Browser Support ─────────────────────────────────────────────────────────

export function isPasskeySupported(): boolean {
  return browserSupportsWebAuthn();
}

// ── Challenge Management ────────────────────────────────────────────────────

function generateChallenge(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function storeChallenge(
  supabase: ReturnType<typeof createSupabaseBrowser>,
  challenge: string,
  type: 'registration' | 'authentication',
  userEmail?: string,
): Promise<string> {
  const expiresAt = new Date(Date.now() + CHALLENGE_EXPIRY_MS).toISOString();

  const { data, error } = await supabase
    .from('passkey_challenges')
    .insert({
      challenge,
      type,
      user_email: userEmail ?? null,
      expires_at: expiresAt,
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to store challenge: ${error.message}`);
  return (data as { id: string }).id;
}

async function consumeChallenge(
  supabase: ReturnType<typeof createSupabaseBrowser>,
  challengeId: string,
  expectedType: 'registration' | 'authentication',
): Promise<void> {
  const { data, error } = await supabase
    .from('passkey_challenges')
    .select('*')
    .eq('id', challengeId)
    .eq('type', expectedType)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) throw new Error('Challenge not found or expired');
  await supabase.from('passkey_challenges').delete().eq('id', challengeId);
}

// ── Registration ────────────────────────────────────────────────────────────

export async function registerPasskey(
  email: string,
): Promise<PasskeyRegistrationResult> {
  if (!isPasskeySupported()) {
    return { success: false, error: 'Passkeys are not supported in this browser' };
  }

  const supabase = createSupabaseBrowser();

  try {
    const challenge = generateChallenge();
    const challengeId = await storeChallenge(supabase, challenge, 'registration', email);

    const userId = btoa(email);
    const registrationOptions: PublicKeyCredentialCreationOptionsJSON = {
      rp: { name: RP_NAME, id: getRpId() },
      user: { id: userId, name: email, displayName: email },
      challenge,
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },   // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      timeout: 60000,
      attestation: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'required',
      },
      excludeCredentials: [],
    };

    let registrationResponse: RegistrationResponseJSON;
    try {
      registrationResponse = await startRegistration({ optionsJSON: registrationOptions });
    } catch (webauthnError) {
      await supabase.from('passkey_challenges').delete().eq('id', challengeId);
      if (webauthnError instanceof Error) {
        if (webauthnError.name === 'NotAllowedError') {
          return { success: false, error: 'Registration was cancelled or not allowed' };
        }
        if (webauthnError.name === 'InvalidStateError') {
          return { success: false, error: 'A passkey for this device already exists' };
        }
        return { success: false, error: webauthnError.message };
      }
      return { success: false, error: 'Registration failed' };
    }

    await consumeChallenge(supabase, challengeId, 'registration');

    const clientData = JSON.parse(
      atob(registrationResponse.response.clientDataJSON.replace(/-/g, '+').replace(/_/g, '/'))
    );
    if (clientData.type !== 'webauthn.create') {
      return { success: false, error: 'Invalid credential type' };
    }

    const publicKey = registrationResponse.response.attestationObject ?? '';

    const { error: insertError } = await supabase
      .from('passkey_credentials')
      .insert({
        user_email: email,
        credential_id: registrationResponse.id,
        public_key: publicKey,
        counter: 0,
      });

    if (insertError) throw new Error(`Failed to store credential: ${insertError.message}`);

    return { success: true, credentialId: registrationResponse.id };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Registration failed';
    return { success: false, error: msg };
  }
}

// ── Authentication ──────────────────────────────────────────────────────────

export async function authenticateWithPasskey(
  email?: string,
): Promise<PasskeyAuthenticationResult> {
  if (!isPasskeySupported()) {
    return { success: false, error: 'Passkeys are not supported in this browser' };
  }

  const supabase = createSupabaseBrowser();

  try {
    const challenge = generateChallenge();
    const challengeId = await storeChallenge(supabase, challenge, 'authentication', email);

    let allowCredentials: Array<{ id: string; type: 'public-key' }> = [];

    if (email) {
      const { data: credentials, error: fetchError } = await supabase
        .from('passkey_credentials')
        .select('credential_id')
        .eq('user_email', email);

      if (fetchError) throw new Error(`Failed to fetch credentials: ${fetchError.message}`);

      if (credentials && credentials.length > 0) {
        allowCredentials = (credentials as Array<{ credential_id: string }>).map((c) => ({
          id: c.credential_id,
          type: 'public-key' as const,
        }));
      }
    }

    const authOptions: PublicKeyCredentialRequestOptionsJSON = {
      challenge,
      timeout: 60000,
      userVerification: 'required',
      rpId: getRpId(),
      allowCredentials,
    };

    let authResponse: AuthenticationResponseJSON;
    try {
      authResponse = await startAuthentication({ optionsJSON: authOptions });
    } catch (webauthnError) {
      await supabase.from('passkey_challenges').delete().eq('id', challengeId);
      if (webauthnError instanceof Error) {
        if (webauthnError.name === 'NotAllowedError') {
          return { success: false, error: 'Authentication was cancelled or not allowed' };
        }
        return { success: false, error: webauthnError.message };
      }
      return { success: false, error: 'Authentication failed' };
    }

    await consumeChallenge(supabase, challengeId, 'authentication');

    const { data: storedCredential, error: lookupError } = await supabase
      .from('passkey_credentials')
      .select('*')
      .eq('credential_id', authResponse.id)
      .single();

    if (lookupError || !storedCredential) {
      return { success: false, error: 'Credential not found. Please register first.' };
    }

    const cred = storedCredential as { credential_id: string; user_email: string; counter: number };

    const rawClientData = authResponse.response.clientDataJSON.replace(/-/g, '+').replace(/_/g, '/');
    const padding = rawClientData.length % 4;
    const paddedClientData = padding ? rawClientData + '='.repeat(4 - padding) : rawClientData;
    const clientData = JSON.parse(atob(paddedClientData)) as { type: string };

    if (clientData.type !== 'webauthn.get') {
      return { success: false, error: 'Invalid credential type in response' };
    }

    await supabase
      .from('passkey_credentials')
      .update({ counter: cred.counter + 1, last_used_at: new Date().toISOString() })
      .eq('credential_id', authResponse.id);

    const resolvedEmail = email ?? cred.user_email;

    return {
      success: true,
      user: { email: resolvedEmail, credentialId: authResponse.id, authenticatedAt: Date.now() },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Authentication failed';
    return { success: false, error: msg };
  }
}

// ── Queries ─────────────────────────────────────────────────────────────────

export async function userHasPasskeys(email: string): Promise<boolean> {
  try {
    const supabase = createSupabaseBrowser();
    const { data, error } = await supabase
      .from('passkey_credentials')
      .select('id')
      .eq('user_email', email)
      .limit(1);

    if (error) return false;
    return !!(data && data.length > 0);
  } catch {
    return false;
  }
}
