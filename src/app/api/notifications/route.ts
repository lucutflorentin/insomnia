import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuthRequest } from '@/lib/auth';

// GET /api/notifications — Get own notifications
export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAuthRequest(request);
    const userId = Number(payload.sub);

    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}
