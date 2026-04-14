import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRole } from '@/lib/auth';

// GET /api/client/reviews — Get the current user's reviews (pending + approved)
export async function GET(request: NextRequest) {
  try {
    const payload = await verifyRole(request, ['CLIENT']);
    const userId = Number(payload.sub);

    const reviews = await prisma.review.findMany({
      where: { userId },
      include: {
        artist: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: reviews });
  } catch (error) {
    console.error('Fetch client reviews error:', error);
    const message =
      error instanceof Error && error.message === 'Insufficient permissions'
        ? 'Unauthorized'
        : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
