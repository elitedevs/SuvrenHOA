import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

// H-10: generate a per-request nonce for CSP. crypto.randomUUID() is available in both
// Edge Runtime and Node.js runtimes; UUID format is valid for CSP nonce use.
function generateNonce(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

function buildCsp(nonce: string): string {
  const connectSrc = [
    "'self'",
    'https://*.supabase.co',
    'wss://*.supabase.co',
    'https://*.base.org',
    'https://*.alchemy.com',
    'https://*.infura.io',
    'https://base-rpc.publicnode.com',
    'https://base-sepolia-rpc.publicnode.com',
    'https://*.sentry.io',
    'https://*.ingest.sentry.io',
    'https://*.coinbase.com',
    'https://api.developer.coinbase.com',
  ].join(' ');

  return [
    "default-src 'self'",
    // H-10: nonce + strict-dynamic replaces unsafe-inline and unsafe-eval for scripts.
    // strict-dynamic propagates trust to dynamically-loaded scripts from trusted origins.
    `script-src 'nonce-${nonce}' 'strict-dynamic'`,
    // style-src still allows unsafe-inline — CSS cannot execute code and removing it
    // would break Tailwind/CSS-in-JS without a full hash extraction pipeline.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src ${connectSrc}`,
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
  ].join('; ');
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = generateNonce();

  // V8: Inverted routing model — use a protected-prefix DENYLIST instead of a
  // public-prefix allowlist. Unknown paths (e.g. /foo-bar-typo) now fall through
  // to Next.js which renders the styled not-found.tsx with a proper 404 status,
  // instead of silently redirecting to /login.
  //
  // Everything listed here requires authentication; everything else is either a
  // marketing page, a public API endpoint (allowlisted below), or a 404.
  const protectedPrefixes = [
    '/dashboard',
    '/activity',
    '/admin',
    '/alerts',
    '/amenities',
    '/announcements',
    '/architectural',
    '/assistant',
    '/calendar',
    '/checkout',
    '/compare',
    '/complaints',
    '/contractors',
    '/contracts',
    '/create-community',
    '/directory',
    '/documents',
    '/dues',
    '/emergency',
    '/energy',
    '/gallery',
    '/governance',
    '/health',
    '/inspections',
    '/insurance',
    '/loans',
    '/lost-found',
    '/maintenance',
    '/map',
    '/marketplace',
    '/messages',
    '/newsletter',
    '/onboarding',
    '/parking',
    '/pets',
    '/profile',
    '/proposals',
    '/reports',
    '/reservations',
    '/rules',
    '/safety',
    '/seasonal-decor',
    '/services',
    '/settings',
    '/surveys',
    '/transfer',
    '/transparency',
    '/treasury',
    '/utilities',
    '/vehicles',
    '/verify',
    '/violations',
    '/visitors',
  ];

  // Public API endpoints — exact-match only. Other /api/* routes are protected.
  const publicExactRoutes = new Set([
    '/login',
    '/signup',
    '/invite/accept',
    '/sitemap.xml',
    '/robots.txt',
    '/api/health',
    '/api/launch/signup',
    '/api/founding/apply',
    '/api/newsletter',
  ]);

  const isProtectedApi =
    pathname.startsWith('/api/') && !publicExactRoutes.has(pathname);

  const isProtected =
    isProtectedApi ||
    protectedPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + '/'),
    );

  // Root "/" is special: public, but authenticated users get redirected to
  // /dashboard. Needs a Supabase call but should NOT redirect unauth users.
  const isRoot = pathname === '/';

  // Non-protected AND not root: marketing pages, public APIs, unknown paths that
  // should resolve to 404. No Supabase call needed.
  if (!isProtected && !isRoot) {
    const res = NextResponse.next({ request });
    res.headers.set('Content-Security-Policy', buildCsp(nonce));
    res.headers.set('x-nonce', nonce);
    return res;
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

  supabaseResponse.headers.set('Content-Security-Policy', buildCsp(nonce));
  supabaseResponse.headers.set('x-nonce', nonce);
  return supabaseResponse;
}
