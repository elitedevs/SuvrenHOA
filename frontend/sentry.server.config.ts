import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NODE_ENV,

  enabled: process.env.NODE_ENV !== 'development' || !!process.env.SENTRY_FORCE_ENABLE,

  // Lower sample rate for server-side to control volume
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

  sampleRate: 1.0,

  beforeSend(event) {
    // Strip internal Supabase service role key if it somehow leaks into context
    if (event.extra) {
      for (const key of Object.keys(event.extra)) {
        if (key.toLowerCase().includes('key') || key.toLowerCase().includes('secret') || key.toLowerCase().includes('token')) {
          event.extra[key] = '[Filtered]';
        }
      }
    }
    return event;
  },
});
