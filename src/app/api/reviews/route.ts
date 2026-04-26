import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRole } from '@/lib/auth';
import { reviewSchema } from '@/lib/validations';
import { checkRateLimit, getClientIp, PUBLIC_READ_LIMIT } from '@/lib/rate-limit';
import { createNotification } from '@/lib/notifications';

// POST /api/reviews — Client: create a review for a completed booking
export async function POST(request: NextRequest) {
  try {
    const payload = await verifyRole(request, ['CLIENT']);
    const userId = Number(payload.sub);

    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { bookingId, rating, reviewTextRo, reviewTextEn } = parsed.data;

    // IDOR-safe: ownership baked into query (uniform 404 prevents enumeration)
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, clientId: userId },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 },
      );
    }

    if (booking.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Only completed bookings can be reviewed' },
        { status: 400 },
      );
    }

    // Verify no existing review for this user+booking combination
    const existingReview = await prisma.review.findUnique({
      where: { unique_user_booking_review: { userId, bookingId } },
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: 'You have already reviewed this booking' },
        { status: 409 },
      );
    }

    const review = await prisma.review.create({
      data: {
        userId,
        clientName: payload.name,
        artistId: booking.artistId,
        bookingId,
        rating,
        reviewTextRo: reviewTextRo || null,
        reviewTextEn: reviewTextEn || null,
        source: 'website',
        isApproved: false,
      },
    });

    // Notify all admins about the new review to moderate
    prisma.user.findMany({
      where: { role: 'SUPER_ADMIN', isActive: true },
      select: { id: true },
    }).then((admins) => {
      for (const admin of admins) {
        createNotification({
          userId: admin.id,
          type: 'review_new',
          title: 'Review nou de moderat',
          message: `${payload.name} a lasat un review cu ${rating} stele`,
          link: '/admin/reviews',
        });
      }
    }).catch(() => {});

    return NextResponse.json(
      { success: true, data: review },
      { status: 201 },
    );
  } catch (error) {
    console.error('Create review error:', error);
    const message =
      error instanceof Error && error.message === 'Insufficient permissions'
        ? 'Unauthorized'
        : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

// GET /api/reviews — Public: list approved visible reviews
export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`reviews-read:${ip}`, PUBLIC_READ_LIMIT);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
      );
    }

    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get('artistId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    const where: Record<string, unknown> = {
      isApproved: true,
      isVisible: true,
    };
    if (artistId) where.artistId = parseInt(artistId);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          artist: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Fetch reviews error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
