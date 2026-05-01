import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { prisma } from '@/lib/prisma';
import { verifyRole } from '@/lib/auth';
import { sanitizeText } from '@/lib/validations';
import { logAuditEvent } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import { sendPushToUser } from '@/lib/push';

const MAX_POINTS_PER_AWARD = 3;
const MAX_DESCRIPTION_LENGTH = 200;

/**
 * POST /api/artist/loyalty
 *
 * Artist-scoped manual loyalty award. Allows the assigned artist (or any
 * SUPER_ADMIN acting on their behalf) to grant 1-3 loyalty points to the
 * client of one of their bookings, exactly once per booking.
 *
 * Body: { bookingId: number, points?: 1|2|3, description?: string }
 *
 * Idempotency: a unique (userId, bookingId, type='earn') tuple is enforced by
 * checking the existing transactions inside the same request — Prisma doesn't
 * have a partial unique index in MySQL, so we guard at the application layer.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyRole(request, ['ARTIST', 'SUPER_ADMIN']);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 },
      );
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payload' },
        { status: 400 },
      );
    }

    const payload = body as Record<string, unknown>;
    const bookingId = Number(payload.bookingId);
    const points = Number.isFinite(Number(payload.points))
      ? Math.trunc(Number(payload.points))
      : 1;
    const description = typeof payload.description === 'string'
      ? sanitizeText(payload.description.trim()).slice(0, MAX_DESCRIPTION_LENGTH)
      : '';

    if (!Number.isFinite(bookingId) || bookingId <= 0) {
      return NextResponse.json(
        { success: false, error: 'bookingId is required' },
        { status: 400 },
      );
    }

    if (points < 1 || points > MAX_POINTS_PER_AWARD) {
      return NextResponse.json(
        {
          success: false,
          error: `points must be between 1 and ${MAX_POINTS_PER_AWARD}`,
        },
        { status: 400 },
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        artistId: true,
        clientId: true,
        clientName: true,
        clientEmail: true,
        artist: { select: { name: true } },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 },
      );
    }

    if (auth.role === 'ARTIST' && auth.artistId !== booking.artistId) {
      return NextResponse.json(
        { success: false, error: 'You can only award loyalty for your own bookings' },
        { status: 403 },
      );
    }

    if (booking.status !== 'completed') {
      return NextResponse.json(
        {
          success: false,
          error: 'Loyalty can only be awarded for completed bookings',
        },
        { status: 400 },
      );
    }

    if (!booking.clientId) {
      return NextResponse.json(
        {
          success: false,
          error: 'GUEST_NO_ACCOUNT',
          message:
            'Client booked as guest. Invite them to register before awarding points.',
        },
        { status: 400 },
      );
    }

    // Idempotency: only one earn-per-booking is allowed.
    const existing = await prisma.loyaltyTransaction.findFirst({
      where: { bookingId: booking.id, type: 'earn' },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'ALREADY_AWARDED',
          message: 'Loyalty has already been awarded for this booking.',
        },
        { status: 409 },
      );
    }

    const transaction = await prisma.loyaltyTransaction.create({
      data: {
        userId: booking.clientId,
        bookingId: booking.id,
        type: 'earn',
        points,
        valueRon: 50.0 * points,
        description:
          description ||
          `Sedinta finalizata cu ${booking.artist.name}`,
        createdBy: Number(auth.sub),
      },
    });

    // Notify the client in-app + push.
    createNotification({
      userId: booking.clientId,
      type: 'loyalty_earned',
      title:
        points === 1
          ? 'Ai primit 1 punct fidelitate!'
          : `Ai primit ${points} puncte fidelitate!`,
      message: `Felicitari! ${
        points === 1 ? 'Un punct' : `${points} puncte`
      } pentru sedinta cu ${booking.artist.name}.`,
      link: '/account',
    }).catch((err) => {
      Sentry.captureException(err, {
        tags: { route: 'artist/loyalty/notify' },
      });
    });
    sendPushToUser(booking.clientId, {
      title: 'Punct fidelitate adaugat',
      body: `${points === 1 ? '1 punct' : `${points} puncte`} pentru sedinta cu ${booking.artist.name}.`,
      url: '/account',
      tag: `loyalty-${booking.id}`,
    }).catch((err) => {
      Sentry.captureException(err, {
        tags: { route: 'artist/loyalty/push' },
      });
    });

    // Surprise milestone every 10 earned points.
    const earnTotal = await prisma.loyaltyTransaction.aggregate({
      where: { userId: booking.clientId, type: 'earn' },
      _sum: { points: true },
    });
    const total = earnTotal._sum.points || 0;
    if (total > 0 && Math.floor(total / 10) > Math.floor((total - points) / 10)) {
      try {
        const { sendSurpriseNotification } = await import('@/lib/email');
        sendSurpriseNotification({
          clientName: booking.clientName,
          clientEmail: booking.clientEmail,
          totalPoints: total,
        }).catch((err) => {
          Sentry.captureException(err, {
            tags: { route: 'artist/loyalty/surprise-mail' },
          });
        });
        const admins = await prisma.user.findMany({
          where: { role: 'SUPER_ADMIN', isActive: true },
          select: { id: true },
        });
        for (const a of admins) {
          createNotification({
            userId: a.id,
            type: 'loyalty_earned',
            title: 'Surpriza loyalty de acordat!',
            message: `${booking.clientName} a atins ${total} puncte. Acorda surpriza!`,
            link: '/admin/loyalty',
          }).catch(() => {});
        }
      } catch (err) {
        Sentry.captureException(err, {
          tags: { route: 'artist/loyalty/surprise' },
        });
      }
    }

    logAuditEvent({
      userId: Number(auth.sub),
      action: 'loyalty.award_manual',
      targetType: 'loyalty_transaction',
      targetId: transaction.id,
      details: {
        bookingId: booking.id,
        clientId: booking.clientId,
        points,
        actorRole: auth.role,
      },
    }).catch(() => {});

    return NextResponse.json(
      { success: true, data: { transactionId: transaction.id, points, total } },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'Insufficient permissions') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }
    Sentry.captureException(error, {
      tags: { route: 'artist/loyalty/POST' },
    });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
