import { createClient } from '@supabase/supabase-js';

// See lib/supabase.ts for the rationale on why we don't throw at import time.
const BUILD_PLACEHOLDER_URL = 'https://build-placeholder.invalid';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || BUILD_PLACEHOLDER_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Server-side Supabase client using the anon key.
 * RLS policies are enforced. Use for read-only public endpoints
 * that don't need elevated privileges.
 */
export const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
