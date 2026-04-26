import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuthRequest } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { logSafe } from '@/lib/log';

// Rate limits scoped to userId (preferred) — prevents IDOR brute-force enumeration.
const CANCEL_PER_MINUTE = { max: 3, windowSec: 60 };
const CANCEL_PER_DAY = { max: 10, windowSec: 24 * 60 * 60 };

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/client/bookings/[id]/cancel — Client: cancel own booking
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const payload = await verifyAuthRequest(request);
    const userId = Number(payload.sub);

    // Rate limit per userId (not IP) — tighter window on cancel actions
    const minute = checkRateLimit(`cancel:user:${userId}:min`, CANCEL_PER_MINUTE);
    if (!minute.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait.' },
        { status: 429, headers: { 'Retry-After': String(minute.retryAfterSec) } },
      );
    }
    const day = checkRateLimit(`cancel:user:${userId}:day`, CANCEL_PER_DAY);
    if (!day.allowed) {
      return NextResponse.json(
        { success: false, error: 'Daily cancellation limit reached.' },
        { status: 429, headers: { 'Retry-After': String(day.retryAfterSec) } },
      );
    }

    const { id } = await params;
    const bookingId = parseInt(id);

    if (isNaN(bookingId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid booking ID' },
        { status: 400 },
      );
    }

    // IDOR-safe: ownership baked into the query — uniform 404 response on
    // non-existent or non-owned IDs prevents enumeration.
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, clientId: userId },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            user: { select: { email: true } },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 },
      );
    }

    // Only allow cancellation of new or contacted bookings
    if (!['new', 'contacted'].includes(booking.status)) {
      return NextResponse.json(
        { success: false, error: 'Only bookings with status "new" or "contacted" can be cancelled.' },
        { status: 400 },
      );
    }

    // Check if the preferred date is at least 24 hours away.
    // For quick-form requests with no consultationDate, allow cancellation anytime.
    const now = new Date();
    if (booking.consultationDate) {
      const consultationDate = new Date(booking.consultationDate);
      const hoursUntilBooking = (consultationDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursUntilBooking < 24) {
        return NextResponse.json(
          { success: false, error: 'Bookings can only be cancelled at least 24 hours before the scheduled date.' },
          { status: 400 },
        );
      }
    }

    // Cancel the booking
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'cancelled',
        adminNotes: booking.adminNotes
          ? `${booking.adminNotes}\n--- Anulat de client la ${now.toISOString()} ---`
          : `--- Anulat de client la ${now.toISOString()} ---`,
      },
      include: {
        artist: { select: { id: true, name: true, slug: true } },
      },
    });

    // Send cancellation notification email to artist (non-blocking)
    try {
      const { sendBookingCancellationEmail } = await import('@/lib/email');
      const formattedDate = booking.consultationDate
        ? new Date(booking.consultationDate).toLocaleDateString('ro-RO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : 'De stabilit';
      sendBookingCancellationEmail({
        artistName: booking.artist.name,
        artistEmail: booking.artist.user?.email || '',
        clientName: booking.clientName,
        referenceCode: booking.referenceCode,
        consultationDate: formattedDate,
      }).catch((err) => logSafe('email.cancel', err));
    } catch {
      // Email import/send failure shouldn't block the response
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Booking cancelled successfully.',
    });
  } catch (error) {
    logSafe('booking.cancel', error);
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}
