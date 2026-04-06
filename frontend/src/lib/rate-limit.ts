/**
 * Simple in-memory token-bucket rate limiter.
 * Replace with @upstash/ratelimit when Upstash is provisioned.
 */

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, TokenBucket>();

// Evict stale buckets every 5 minutes to prevent memory leaks
const EVICT_INTERVAL = 5 * 60 * 1000;
const BUCKET_TTL = 10 * 60 * 1000;
let lastEviction = Date.now();

function evictStale() {
  const now = Date.now();
  if (now - lastEviction < EVICT_INTERVAL) return;
  lastEviction = now;
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastRefill > BUCKET_TTL) buckets.delete(key);
  }
}

export interface RateLimitConfig {
  /** Max tokens (requests) in the bucket */
  limit: number;
  /** Window in milliseconds to fully refill */
  windowMs: number;
}

export const RATE_LIMITS = {
  /** 30 writes per minute */
  write: { limit: 30, windowMs: 60_000 } satisfies RateLimitConfig,
  /** 100 reads per minute */
  read: { limit: 100, windowMs: 60_000 } satisfies RateLimitConfig,
  /** Strict limit for abuse-prone endpoints: 5 per minute */
  strict: { limit: 5, windowMs: 60_000 } satisfies RateLimitConfig,
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

/**
 * Check and consume a token from the rate limit bucket.
 * @param key   Unique key, typically `${route}:${ip}`
 * @param config  Rate limit configuration
 */
export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  evictStale();
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket) {
    bucket = { tokens: config.limit, lastRefill: now };
    buckets.set(key, bucket);
  }

  // Refill tokens proportionally to elapsed time
  const elapsed = now - bucket.lastRefill;
  const refill = (elapsed / config.windowMs) * config.limit;
  bucket.tokens = Math.min(config.limit, bucket.tokens + refill);
  bucket.lastRefill = now;

  if (bucket.tokens < 1) {
    const resetMs = ((1 - bucket.tokens) / config.limit) * config.windowMs;
    return { allowed: false, remaining: 0, resetMs };
  }

  bucket.tokens -= 1;
  return { allowed: true, remaining: Math.floor(bucket.tokens), resetMs: 0 };
}

/**
 * Extract client IP from request headers (works behind reverse proxies).
 */
export function getClientIp(request: Request): string {
  const headers = new Headers(request.headers);
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

/**
 * Apply rate limiting to a request. Returns a 429 Response if limited, or null if allowed.
 */
export function applyRateLimit(
  request: Request,
  route: string,
  config: RateLimitConfig = RATE_LIMITS.write
): Response | null {
  const ip = getClientIp(request);
  const result = rateLimit(`${route}:${ip}`, config);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({ error: 'Too many requests', retryAfterMs: Math.ceil(result.resetMs) }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil(result.resetMs / 1000)),
        },
      }
    );
  }

  return null;
}
