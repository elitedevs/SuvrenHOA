import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require auth
  const publicRoutes = [
    // Auth flows
    '/login',
    '/signup',
    '/invite/accept',
    // API routes that are publicly accessible
    '/api/health',
    '/api/launch/signup',
    '/api/founding/apply',
    '/api/newsletter',
    // Marketing / static pages
    '/about',
    '/pricing',
    '/security',
    '/contact',
    '/blog',
    '/docs',
    '/demo',
    '/founding',
    '/launch',
    '/press',
    '/landing',
    '/community',
  ];

  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  // Short-circuit for public routes — no Supabase call needed.
  // This guarantees public API endpoints like /api/newsletter are never blocked
  // even if Supabase is unreachable or env vars are missing.
  if (isPublicRoute) {
    return NextResponse.next({ request });
  }

  // For / and all protected routes, initialize Supabase and check auth
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect authenticated users from / to /dashboard
  if (user && pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Redirect unauthenticated users to /login (/ is allowed unauthenticated)
  if (!user && pathname !== '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
