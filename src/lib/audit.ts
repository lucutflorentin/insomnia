import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { logSafe } from '@/lib/log';

export async function logAuditEvent(params: {
  userId: number;
  action: string;
  targetType: string;
  targetId?: string | number;
  details?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId != null ? String(params.targetId) : null,
        details: params.details ? (params.details as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch (error) {
    // Audit logging should never block operations
    logSafe('audit.log', error);
  }
}

/**
 * Log a failed authentication attempt — fire-and-forget. Resolves the user
 * record by email when present so the audit row carries a real FK; otherwise
 * logs to the safe console pipeline only.
 */
export async function logAuthFailure(params: {
  emailKey: string;
  reason: string;
  ip?: string;
}): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: params.emailKey.toLowerCase() },
      select: { id: true },
    });
    if (user) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'auth.failure',
          targetType: 'session',
          targetId: params.emailKey.slice(0, 50),
          details: { reason: params.reason, ip: params.ip } as Prisma.InputJsonValue,
        },
      });
    } else {
      // No matching account — surface the attempt via the safe console pipeline
      // so it lands in Sentry without leaking PII to a queryable audit row.
      logSafe('auth.failure.unknown', new Error(params.reason), {
        emailKeyHash: params.emailKey.length,
        ip: params.ip,
      });
    }
  } catch (error) {
    logSafe('audit.authFailure', error);
  }
}
