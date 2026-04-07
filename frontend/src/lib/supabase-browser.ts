import { createBrowserClient } from '@supabase/ssr';

// FE-17: validate env vars at call time rather than silently passing undefined.
// In dev the build succeeds even with missing env vars; this surfaces the error
// immediately with a clear message instead of a cryptic Supabase network failure.
export function createSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    const missing = [!url && 'NEXT_PUBLIC_SUPABASE_URL', !key && 'NEXT_PUBLIC_SUPABASE_ANON_KEY']
      .filter(Boolean)
      .join(', ');
    throw new Error(`[supabase-browser] Missing required env vars: ${missing}`);
  }

  return createBrowserClient(url, key);
}
