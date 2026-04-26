import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuthRequest } from '@/lib/auth';
import { logSafe } from '@/lib/log';

// GET /api/client/bookings — Authenticated: get own booking history
export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAuthRequest(request);
    const userId = Number(payload.sub);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    const where = { clientId: userId };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          artist: { select: { id: true, name: true, slug: true } },
          reviews: {
            where: { userId },
            select: { id: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    const data = bookings.map(({ reviews, ...booking }) => ({
      ...booking,
      hasReview: reviews.length > 0,
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logSafe('client.bookings.list', error);
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}
