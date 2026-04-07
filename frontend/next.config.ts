import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// H-10: CSP is now generated per-request in supabase-middleware.ts using a nonce,
// which eliminates unsafe-inline and unsafe-eval from script-src. The static headers
// below handle non-CSP security headers and CORS (which don't need per-request values).

const nextConfig: NextConfig = {
  output: 'standalone',

  async headers() {
    const isProd = process.env.NODE_ENV === 'production';
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: isProd
              ? (process.env.NEXT_PUBLIC_APP_URL || 'https://app.suvren.com')
              : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
          },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PATCH, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          // CSP intentionally omitted here — set dynamically with nonce in middleware
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || 'suvren',
  project: process.env.SENTRY_PROJECT || 'suvren-hoa',
  silent: !process.env.CI,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
    deleteSourcemapsAfterUpload: true,
  },
});
