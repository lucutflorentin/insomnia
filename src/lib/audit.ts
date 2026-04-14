import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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
    console.error('Audit log failed:', error);
  }
}
