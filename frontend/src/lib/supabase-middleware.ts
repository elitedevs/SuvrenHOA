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

  // M-04: separate exact-match routes from prefix-match routes to avoid accidentally
  // exposing sub-paths of protected routes. API routes must always be exact matches.
  const publicExactRoutes = new Set([
    '/login',
    '/signup',
    '/invite/accept',
    // API routes — exact only: a prefix match on e.g. '/api/founding' would expose
    // '/api/founding/[id]' (board approval endpoint) as a public route
    '/api/health',
    '/api/launch/signup',
    '/api/founding/apply',
    '/api/newsletter',
  ]);

  // Marketing page prefixes — sub-pages (e.g. /blog/post-slug) should also be public
  const publicPrefixes = [
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

  const isPublicRoute =
    publicExactRoutes.has(pathname) ||
    publicPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'));

  // Short-circuit for public routes — no Supabase call needed.
  // This guarantees public API endpoints like /api/newsletter are never blocked
  // even if Supabase is unreachable or env vars are missing.
  if (isPublicRoute) {
    const res = NextResponse.next({ request });
    res.headers.set('Content-Security-Policy', buildCsp(nonce));
    // Pass nonce to layout/components via request header (Next.js App Router convention)
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
