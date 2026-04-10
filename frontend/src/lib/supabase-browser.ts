import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Build-safety: when env vars are missing at build time or during SSR of a
// misconfigured deployment, return a stub client so the page can render. Any
// actual call will resolve to an error response rather than crashing the whole
// render. In a correctly-configured runtime, the real client is returned.
const BUILD_PLACEHOLDER_URL = 'https://build-placeholder.invalid';
const BUILD_PLACEHOLDER_KEY = 'build-placeholder-key';

function makeStubClient(): SupabaseClient {
  const notConfiguredError = {
    message: 'Supabase is not configured on this deployment.',
    name: 'SupabaseNotConfiguredError',
    status: 503,
  };

  const asyncErrorResult = async () => ({
    data: null,
    error: notConfiguredError,
  });

  // A Proxy that returns a callable that always resolves to an error result,
  // and is recursively chainable to cover builder-pattern calls like
  // `.from('x').select().eq(...)`.
  const chainableErrorStub: unknown = new Proxy(function noop() {}, {
    apply: () => asyncErrorResult(),
    get: (_target, prop) => {
      if (prop === 'then') return undefined; // keep thenable detection happy
      return chainableErrorStub;
    },
  });

  // Auth surface: covers the small subset of methods AuthContext uses
  // (getSession, onAuthStateChange, signOut). onAuthStateChange returns
  // { data: { subscription: { unsubscribe } } } — we mimic that shape.
  const authStub = {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: (_cb: unknown) => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
    signOut: async () => ({ error: null }),
    signInWithPassword: async () => ({
      data: { user: null, session: null },
      error: notConfiguredError,
    }),
    signUp: async () => ({
      data: { user: null, session: null },
      error: notConfiguredError,
    }),
  };

  return new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === 'auth') return authStub;
        return chainableErrorStub;
      },
    }
  ) as unknown as SupabaseClient;
}

export function createSupabaseBrowser(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isPlaceholder =
    !url ||
    !key ||
    url === BUILD_PLACEHOLDER_URL ||
    key === BUILD_PLACEHOLDER_KEY;

  if (isPlaceholder) {
    if (typeof window === 'undefined') {
      // Log once per cold start on the server so misconfig is visible.
      console.warn(
        '[supabase-browser] NEXT_PUBLIC_SUPABASE_URL / ANON_KEY missing — returning stub client.'
      );
    }
    return makeStubClient();
  }

  try {
    return createBrowserClient(url!, key!) as SupabaseClient;
  } catch (err) {
    if (typeof window === 'undefined') {
      console.warn(
        '[supabase-browser] createBrowserClient threw; returning stub:',
        err
      );
    }
    return makeStubClient();
  }
}
