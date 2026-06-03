import "server-only";

/**
 * In-process sliding-window rate limiter. Good enough for single-instance
 * deployment; the DB UNIQUE constraint on stamps is the real defence against
 * duplicate writes.
 *
 * Trade-off: scaled deployments (Vercel autoscaling) get per-instance limits,
 * not global. Real protection in that scenario should move to a Postgres- or
 * Upstash-backed implementation. Acceptable for MVP given the event runs at
 * a known peak of ~50 RPS.
 */

interface Bucket {
  /** Timestamps of recent events within the window (ms since epoch). */
  events: number[];
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  retryAfterMs: number;
}

export interface RateLimitOptions {
  /** Max events allowed within the window. */
  max: number;
  /** Sliding window in milliseconds. */
  windowMs: number;
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - options.windowMs;

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { events: [] };
    buckets.set(key, bucket);
  }

  // Drop events outside the window.
  while (bucket.events.length && bucket.events[0]! < cutoff) {
    bucket.events.shift();
  }

  if (bucket.events.length >= options.max) {
    const oldest = bucket.events[0]!;
    return {
      allowed: false,
      currentCount: bucket.events.length,
      retryAfterMs: Math.max(0, oldest + options.windowMs - now),
    };
  }

  bucket.events.push(now);
  return {
    allowed: true,
    currentCount: bucket.events.length,
    retryAfterMs: 0,
  };
}

/**
 * Per-PIC limit: 10 scans/sec — guards against rogue clients spamming.
 */
export const SCAN_LIMIT_PIC: RateLimitOptions = { max: 10, windowMs: 1_000 };

/**
 * Per-booth limit: 100 scans/sec — back-pressure if a whole booth's clients
 * have gone wild.
 */
export const SCAN_LIMIT_BOOTH: RateLimitOptions = { max: 100, windowMs: 1_000 };

/**
 * Test-only: clear all buckets between runs.
 */
export function _resetForTests() {
  buckets.clear();
}
