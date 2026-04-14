import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuthRequest } from '@/lib/auth';

// PUT /api/notifications/read-all — Mark all notifications as read
export async function PUT(request: NextRequest) {
  try {
    const payload = await verifyAuthRequest(request);
    const userId = Number(payload.sub);

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}
