import { createClient } from '@supabase/supabase-js';

/**
 * Build-safe Supabase clients.
 *
 * We intentionally avoid throwing at module-import time. Next.js collects
 * page data at build by loading every route module, and Turbopack evaluates
 * imported modules eagerly. If this file threw (or a Proxy's `get` trap
 * threw), `next build` would die in environments where env vars only arrive
 * at container runtime — e.g. multi-stage docker builds.
 *
 * When env vars are missing we fall through to a harmless placeholder URL
 * so `createClient` can initialize. Any actual network call will then fail
 * at runtime with a Supabase error the route can log or surface as a 500,
 * which is the correct place for that failure to surface.
 */

const BUILD_PLACEHOLDER_URL = 'https://build-placeholder.invalid';
// createClient() throws if the key is empty/undefined, so we pass an
// obviously-fake placeholder when the env var is missing. Any real request
// will fail at runtime with a Supabase auth error — surfaced as a 500 by
// the route — which is where that failure actually belongs.
const BUILD_PLACEHOLDER_KEY = 'build-placeholder-key';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || BUILD_PLACEHOLDER_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || BUILD_PLACEHOLDER_KEY;
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || BUILD_PLACEHOLDER_KEY;

// Warn loudly in non-production if env is missing. In production we stay
// quiet because the build phase also hits this path and we don't want the
// log noise on every container start.
if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NODE_ENV !== 'production' &&
  process.env.NODE_ENV !== 'test'
) {
  console.warn(
    '[supabase] NEXT_PUBLIC_SUPABASE_URL not set — using build placeholder. ' +
      'Any database call will fail at runtime until env is configured.',
  );
}

// Server-side client (service role — full access, use in API routes only)
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Client-side client (anon key — RLS enforced)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
