import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * OAuth callback handler.
 *
 * After a user authenticates with Google/GitHub, Supabase redirects here with
 * an authorization `code` query parameter. We exchange that code for a session
 * (which sets the Supabase auth cookies), then redirect to /dashboard.
 *
 * This route MUST be listed in the Supabase dashboard under
 * Authentication -> URL Configuration -> Redirect URLs as:
 *   https://hoa.suvren.co/auth/callback
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  // Derive the public origin from forwarded headers (Cloudflare / reverse proxy)
  // so we don't redirect to the Docker container's internal hostname.
  const forwardedHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : (process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin);

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method is called from a Server Component.
              // This can be ignored if you have middleware refreshing sessions.
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If code exchange failed or no code present, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
