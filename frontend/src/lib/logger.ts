/**
 * Environment-aware logger.
 * - dev: full output to console
 * - production: suppresses debug/info; errors go to stderr (picked up by Sentry)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isProd = process.env.NODE_ENV === 'production';

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  if (isProd && (level === 'debug' || level === 'info')) return;

  const entry = context
    ? `[${level.toUpperCase()}] ${message} ${JSON.stringify(context)}`
    : `[${level.toUpperCase()}] ${message}`;

  if (level === 'error') {
    console.error(entry);
  } else if (level === 'warn') {
    console.warn(entry);
  } else {
    console.log(entry);
  }
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => log('debug', msg, ctx),
  info:  (msg: string, ctx?: Record<string, unknown>) => log('info',  msg, ctx),
  warn:  (msg: string, ctx?: Record<string, unknown>) => log('warn',  msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => log('error', msg, ctx),
};

/**
 * Returns a safe error message for API responses.
 * In production, strips the raw error detail to avoid leaking DB schema,
 * stack traces, or internal service info to clients.
 */
export function safeErrorMessage(err: unknown, fallback = 'An unexpected error occurred'): string {
  if (!isProd) {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
  }
  return fallback;
}
