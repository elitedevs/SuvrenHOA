/**
 * FE-04 fix: Distributed rate limiter backed by Upstash Redis.
 *
 * Vercel serverless functions run across many parallel instances; a process-local
 * Map gives each instance its own independent quota, letting a single IP achieve
 * `limit × N` requests per window.  This module uses @upstash/ratelimit (sliding
 * window) when UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are present so
 * the quota is shared across all instances.
 *
 * Graceful fallback: if the env vars are absent (local dev, CI) the module falls
 * back to an in-memory token-bucket.  A warning is logged in non-production
 * environments so misconfigured deployments are caught early.
 *
 * Setup: https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
 *   1. Create an Upstash Redis database.
 *   2. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to Vercel env vars.
 *   3. No code changes needed — this module detects the vars automatically.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ── Distributed limiter (Upstash) ─────────────────────────────────────────────

/**
 * Returns an Upstash Ratelimit instance for the given window spec, or null if
 * Upstash is not configured.  Instance is created lazily and memoised per spec.
 */
const _upstashCache = new Map<string, Ratelimit>();

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit | null {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const key = `${limit}:${windowMs}`;
  if (_upstashCache.has(key)) return _upstashCache.get(key)!;

  const redis = new Redis({ url, token });
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
    analytics: false,
    prefix: '@faircroft/rl',
  });
  _upstashCache.set(key, limiter);
  return limiter;
}

// ── In-memory fallback (single-instance only) ─────────────────────────────────

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const _buckets = new Map<string, TokenBucket>();

const EVICT_INTERVAL = 5 * 60 * 1000;
const BUCKET_TTL     = 10 * 60 * 1000;
let   _lastEviction  = Date.now();

function _evictStale() {
  const now = Date.now();
  if (now - _lastEviction < EVICT_INTERVAL) return;
  _lastEviction = now;
  for (const [k, b] of _buckets) {
    if (now - b.lastRefill > BUCKET_TTL) _buckets.delete(k);
  }
}

function _inMemoryLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  _evictStale();
  const now    = Date.now();
  let   bucket = _buckets.get(key);

  if (!bucket) {
    bucket = { tokens: limit, lastRefill: now };
    _buckets.set(key, bucket);
  }

  const elapsed = now - bucket.lastRefill;
  const refill  = (elapsed / windowMs) * limit;
  bucket.tokens   = Math.min(limit, bucket.tokens + refill);
  bucket.lastRefill = now;

  if (bucket.tokens < 1) {
    const resetMs = ((1 - bucket.tokens) / limit) * windowMs;
    return { allowed: false, remaining: 0, resetMs };
  }

  bucket.tokens -= 1;
  return { allowed: true, remaining: Math.floor(bucket.tokens), resetMs: 0 };
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface RateLimitConfig {
  /** Max tokens (requests) in the window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export const RATE_LIMITS = {
  /** 30 writes per minute */
  write:  { limit: 30,  windowMs: 60_000 } satisfies RateLimitConfig,
  /** 100 reads per minute */
  read:   { limit: 100, windowMs: 60_000 } satisfies RateLimitConfig,
  /** Strict limit for abuse-prone endpoints: 5 per minute */
  strict: { limit: 5,   windowMs: 60_000 } satisfies RateLimitConfig,
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

/**
 * Check and consume a token from the rate limit bucket.
 * Uses Upstash Redis when configured; falls back to in-memory.
 * @param key    Unique key, typically `${route}:${ip}`
 * @param config Rate limit configuration
 */
export async function rateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const upstash = getUpstashLimiter(config.limit, config.windowMs);

  if (upstash) {
    const { success, remaining, reset } = await upstash.limit(key);
    return {
      allowed:   success,
      remaining,
      resetMs: success ? 0 : Math.max(0, reset - Date.now()),
    };
  }

  // H-01: Fail closed in production — in-memory buckets are per-instance and allow
  // N×instances requests per window, defeating rate limiting across Vercel replicas.
  if (process.env.NODE_ENV === 'production') {
    console.error(
      '[rate-limit] H-01: UPSTASH_REDIS_REST_URL/TOKEN not set in production. ' +
      'Denying request (fail-closed). Configure Upstash to restore rate limiting.'
    );
    return { allowed: false, remaining: 0, resetMs: 60_000 };
  }

  // Dev/CI: warn and fall back to in-memory token bucket.
  if (process.env.NODE_ENV !== 'test') {
    console.warn(
      '[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set — ' +
      'using in-memory fallback (not safe across multiple instances).'
    );
  }

  return _inMemoryLimit(key, config.limit, config.windowMs);
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
 * Apply rate limiting to a request.
 * Returns a 429 Response if limited, null if allowed.
 */
export async function applyRateLimit(
  request: Request,
  route: string,
  config: RateLimitConfig = RATE_LIMITS.write
): Promise<Response | null> {
  const ip     = getClientIp(request);
  const result = await rateLimit(`${route}:${ip}`, config);

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
