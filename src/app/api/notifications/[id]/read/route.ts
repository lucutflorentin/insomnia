import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuthRequest } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/notifications/[id]/read — Mark notification as read
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const payload = await verifyAuthRequest(request);
    const userId = Number(payload.sub);
    const { id } = await params;

    await prisma.notification.updateMany({
      where: { id: parseInt(id), userId },
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
