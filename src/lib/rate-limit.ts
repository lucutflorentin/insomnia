/**
 * Rate limiter for API routes.
 * Uses Prisma-backed buckets for distributed production limits and falls back
 * to in-memory buckets when the database table is not available yet.
 */
import crypto from 'crypto';
import * as Sentry from '@sentry/nextjs';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { recordSecurityEvent } from '@/lib/security-events';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
let databaseRateLimitUnavailable = false;

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

interface RateLimitOptions {
  request?: Request;
  source?: string;
  eventType?: string;
}

function hashRateLimitKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

function isMissingRateLimitTable(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    ['P2021', 'P2022'].includes(error.code)
  );
}

/**
 * Check in-memory rate limit for a given key (typically IP + route).
 */
function checkMemoryRateLimit(
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

async function checkDatabaseRateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + config.windowSec * 1000);
  const bucketKey = hashRateLimitKey(key);

  const incremented = await prisma.rateLimitBucket.updateMany({
    where: {
      key: bucketKey,
      resetAt: { gt: now },
      count: { lt: config.max },
    },
    data: { count: { increment: 1 } },
  });

  if (incremented.count > 0) {
    const current = await prisma.rateLimitBucket.findUnique({
      where: { key: bucketKey },
      select: { count: true },
    });

    return {
      allowed: true,
      remaining: Math.max(0, config.max - (current?.count ?? config.max)),
      retryAfterSec: 0,
    };
  }

  const existing = await prisma.rateLimitBucket.findUnique({
    where: { key: bucketKey },
  });

  if (!existing || existing.resetAt <= now) {
    await prisma.rateLimitBucket.upsert({
      where: { key: bucketKey },
      create: { key: bucketKey, count: 1, resetAt },
      update: { count: 1, resetAt },
    });
    return { allowed: true, remaining: config.max - 1, retryAfterSec: 0 };
  }

  const retryAfterSec = Math.max(
    1,
    Math.ceil((existing.resetAt.getTime() - now.getTime()) / 1000),
  );
  return { allowed: false, remaining: 0, retryAfterSec };
}

/**
 * Check rate limit for a given key (typically IP + route).
 * Set RATE_LIMIT_MODE=memory to force local-only buckets.
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
  options: RateLimitOptions = {},
): Promise<RateLimitResult> {
  let result: RateLimitResult;

  if (process.env.RATE_LIMIT_MODE === 'memory' || databaseRateLimitUnavailable) {
    result = checkMemoryRateLimit(key, config);
  } else {
    try {
      result = await checkDatabaseRateLimit(key, config);
    } catch (error) {
      if (isMissingRateLimitTable(error)) {
        databaseRateLimitUnavailable = true;
      }

      Sentry.captureException(error, {
        level: 'warning',
        tags: {
          lib: 'rate-limit',
          mode: 'database',
          reason: databaseRateLimitUnavailable ? 'missing_table' : 'runtime_error',
        },
        extra: { source: options.source },
      });
      result = checkMemoryRateLimit(key, config);
    }
  }

  if (!result.allowed && options.request) {
    await recordSecurityEvent({
      eventType: options.eventType || 'rate_limit_exceeded',
      severity: 'warning',
      source: options.source,
      request: options.request,
      details: {
        retryAfterSec: result.retryAfterSec,
        windowSec: config.windowSec,
        max: config.max,
      },
    });
  }

  return result;
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
