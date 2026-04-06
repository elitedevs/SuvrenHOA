import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,

  environment: process.env.NODE_ENV,

  // Reduce noise in development
  enabled: process.env.NODE_ENV !== 'development' || !!process.env.SENTRY_FORCE_ENABLE,

  // Capture 10% of transactions in prod for performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Capture 100% of errors; adjust down if volume is high
  sampleRate: 1.0,

  // Session replay: capture 1% of sessions, 100% of sessions with errors
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Strip wallet addresses and PII from breadcrumbs
  beforeBreadcrumb(breadcrumb) {
    if (breadcrumb.category === 'console' && process.env.NODE_ENV === 'production') {
      return null; // suppress console breadcrumbs in prod
    }
    return breadcrumb;
  },

  // Scrub sensitive fields from event data
  beforeSend(event) {
    if (event.request?.cookies) {
      event.request.cookies = {};
    }
    if (event.request?.headers?.['authorization']) {
      event.request.headers['authorization'] = '[Filtered]';
    }
    return event;
  },
});
