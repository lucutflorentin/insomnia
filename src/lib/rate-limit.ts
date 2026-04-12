/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window approach with automatic cleanup.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  /** Max requests allowed in the window */
  max: number;
  /** Window duration in seconds */
  windowSec: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

/**
 * Check rate limit for a given key (typically IP + route).
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowSec * 1000 });
    return { allowed: true, remaining: config.max - 1, retryAfterSec: 0 };
  }

  if (entry.count >= config.max) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  entry.count++;
  return { allowed: true, remaining: config.max - entry.count, retryAfterSec: 0 };
}

/**
 * Extract client IP from request headers.
 */
export function getClientIp(request: Request): string {
  // Vercel sets x-real-ip authoritatively; prefer it over x-forwarded-for
  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

// Pre-configured limiters
export const AUTH_LIMIT = { max: 10, windowSec: 60 };       // 10 attempts / minute
export const REGISTER_LIMIT = { max: 5, windowSec: 60 };    // 5 registrations / minute
export const BOOKING_LIMIT = { max: 10, windowSec: 60 };    // 10 bookings / minute
export const UPLOAD_LIMIT = { max: 20, windowSec: 60 };     // 20 uploads / minute
export const CANCEL_LIMIT = { max: 5, windowSec: 60 };      // 5 cancellations / minute
export const PASSWORD_RESET_LIMIT = { max: 5, windowSec: 15 * 60 }; // 5 attempts / 15 min
export const PASSWORD_CHANGE_LIMIT = { max: 5, windowSec: 15 * 60 }; // 5 attempts / 15 min
export const PUBLIC_READ_LIMIT = { max: 60, windowSec: 60 };  // 60 reads / minute
