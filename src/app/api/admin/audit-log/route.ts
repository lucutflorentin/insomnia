import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySuperAdmin } from '@/lib/auth';

// GET /api/admin/audit-log — Super Admin: list audit events
export async function GET(request: NextRequest) {
  try {
    await verifySuperAdmin(request);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'));
    const action = searchParams.get('action') || '';

    const where: Record<string, unknown> = {};
    if (action) where.action = { contains: action };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}
