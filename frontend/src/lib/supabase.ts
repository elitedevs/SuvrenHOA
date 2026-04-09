import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Lazy Supabase clients.
 *
 * We intentionally avoid creating clients (or throwing on missing env) at
 * module-import time. Next.js collects page data at build time and imports
 * every route module — if this file threw at import, any missing env var
 * would break `next build` even though the value is only needed at runtime.
 *
 * Instead, we defer client creation until the first property access via a
 * Proxy. The throw for missing env still fires, but only when something
 * actually tries to talk to Supabase.
 */

function readEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing ${name} environment variable`);
  }
  return v;
}

let _admin: SupabaseClient | null = null;
function getAdmin(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(
      readEnv('NEXT_PUBLIC_SUPABASE_URL'),
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    );
  }
  return _admin;
}

let _anon: SupabaseClient | null = null;
function getAnon(): SupabaseClient {
  if (!_anon) {
    _anon = createClient(
      readEnv('NEXT_PUBLIC_SUPABASE_URL'),
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    );
  }
  return _anon;
}

// Proxies forward every property access to the real client, created on demand.
// Consumers keep their existing `supabaseAdmin.from(...)` syntax unchanged.
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getAdmin();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getAnon();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
