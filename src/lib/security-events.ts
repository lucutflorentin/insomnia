import crypto from 'crypto';
import * as Sentry from '@sentry/nextjs';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type SecuritySeverity = 'info' | 'warning' | 'critical';

interface SecurityEventParams {
  eventType: string;
  severity?: SecuritySeverity;
  source?: string;
  request?: Request;
  userId?: number;
  details?: Record<string, unknown>;
}

const SUSPICIOUS_PATTERNS: Array<{
  name: string;
  pattern: RegExp;
  severity: SecuritySeverity;
}> = [
  { name: 'env_probe', pattern: /(?:^|\/)\.env(?:$|[/?#])/i, severity: 'critical' },
  { name: 'git_probe', pattern: /(?:^|\/)\.git(?:\/|$|[?#])/i, severity: 'critical' },
  { name: 'path_traversal', pattern: /\.\.(?:\/|\\)|%2e%2e/i, severity: 'critical' },
  { name: 'wordpress_probe', pattern: /\/(?:wp-admin|wp-login|xmlrpc\.php)(?:\/|$|[?#])/i, severity: 'warning' },
  { name: 'php_probe', pattern: /\/(?:phpmyadmin|adminer|vendor\/phpunit)(?:\/|$|[?#])/i, severity: 'warning' },
  { name: 'xss_probe', pattern: /<script|%3cscript|javascript:/i, severity: 'warning' },
  { name: 'sql_probe', pattern: /union(?:\s|\+|%20)+select|sleep\(|benchmark\(|information_schema/i, severity: 'warning' },
];

let securityEventsUnavailable = false;

function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const salt =
    process.env.SECURITY_EVENT_SALT ||
    process.env.JWT_SECRET ||
    'insomnia-security-event-salt';
  return crypto.createHmac('sha256', salt).update(ip).digest('hex');
}

function getRequestIp(request: Request): string {
  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

function toJson(details: Record<string, unknown> | undefined) {
  if (!details) return undefined;
  return details as Prisma.InputJsonValue;
}

function shouldNotifySentry(severity: SecuritySeverity, eventType: string): boolean {
  if (severity === 'critical') return true;
  return [
    'rate_limit_exceeded',
    'suspicious_request',
    'auth_failed',
  ].includes(eventType);
}

function isMissingSecurityEventsTable(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    ['P2021', 'P2022'].includes(error.code)
  );
}

export async function recordSecurityEvent({
  eventType,
  severity = 'warning',
  source,
  request,
  userId,
  details,
}: SecurityEventParams): Promise<void> {
  const url = request ? new URL(request.url) : null;
  const ip = request ? getRequestIp(request) : null;
  const payload = {
    eventType,
    severity,
    source,
    userId,
    path: url?.pathname,
    method: request?.method,
    details,
  };

  if (shouldNotifySentry(severity, eventType)) {
    Sentry.captureMessage(`Security event: ${eventType}`, {
      level: severity === 'critical' ? 'error' : 'warning',
      tags: {
        security_event: eventType,
        severity,
        source: source || 'unknown',
      },
      extra: payload,
    });
  }

  if (securityEventsUnavailable) return;

  try {
    await prisma.securityEvent.create({
      data: {
        eventType,
        severity,
        source: source || null,
        ipHash: hashIp(ip),
        userId: userId || null,
        userAgent: request?.headers.get('user-agent')?.slice(0, 500) || null,
        path: url?.pathname || null,
        method: request?.method || null,
        details: toJson(details),
      },
    });
  } catch (error) {
    if (isMissingSecurityEventsTable(error)) {
      securityEventsUnavailable = true;
    }

    Sentry.captureException(error, {
      level: 'warning',
      tags: {
        lib: 'security-events',
        op: 'recordSecurityEvent',
        reason: securityEventsUnavailable ? 'missing_table' : 'runtime_error',
      },
      extra: payload,
    });
  }
}

export async function inspectRequestForAttack(
  request: Request,
  source: string,
): Promise<void> {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';
  const target = `${url.pathname} ${url.search} ${userAgent}`;
  const matches = SUSPICIOUS_PATTERNS.filter(({ pattern }) => pattern.test(target));

  if (matches.length === 0) return;

  const severity = matches.some((match) => match.severity === 'critical')
    ? 'critical'
    : 'warning';

  await recordSecurityEvent({
    eventType: 'suspicious_request',
    severity,
    source,
    request,
    details: {
      matches: matches.map((match) => match.name),
      queryPresent: url.search.length > 0,
    },
  });
}
