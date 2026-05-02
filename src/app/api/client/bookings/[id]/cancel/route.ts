import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuthRequest } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { recordSecurityEvent } from '@/lib/security-events';

const CANCEL_LIMIT = { max: 5, windowSec: 60 };

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/client/bookings/[id]/cancel — Client: cancel own booking
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const payload = await verifyAuthRequest(request);
    const userId = Number(payload.sub);

    // Rate limit
    const ip = getClientIp(request);
    const rl = await checkRateLimit(
      `cancel-booking:${ip}`,
      CANCEL_LIMIT,
      { request, source: 'api/client/bookings/cancel' },
    );
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
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

    // Fetch booking with artist info (email is on the artist's User record)
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
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

    // Verify ownership
    if (booking.clientId !== userId) {
      await recordSecurityEvent({
        eventType: 'booking_cancel_unauthorized',
        severity: 'warning',
        source: 'api/client/bookings/cancel',
        request,
        userId,
        details: { bookingId },
      });
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 },
      );
    }

    // Only allow cancellation of new or contacted bookings
    if (!['new', 'contacted'].includes(booking.status)) {
      return NextResponse.json(
        { success: false, error: 'Only bookings with status "new" or "contacted" can be cancelled.' },
        { status: 400 },
      );
    }

    // Check if the preferred date is at least 24 hours away
    const now = new Date();
    const consultationDate = booking.consultationDate ? new Date(booking.consultationDate) : null;
    const hoursUntilBooking = consultationDate
      ? (consultationDate.getTime() - now.getTime()) / (1000 * 60 * 60)
      : null;

    if (hoursUntilBooking !== null && hoursUntilBooking < 24) {
      return NextResponse.json(
        { success: false, error: 'Bookings can only be cancelled at least 24 hours before the scheduled date.' },
        { status: 400 },
      );
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
      sendBookingCancellationEmail({
        artistName: booking.artist.name,
        artistEmail: booking.artist.user?.email || '',
        clientName: booking.clientName,
        referenceCode: booking.referenceCode,
        consultationDate: consultationDate
          ? consultationDate.toLocaleDateString('ro-RO', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : 'De stabilit',
      }).catch((err) => console.error('Failed to send cancellation email:', err));
    } catch {
      // Email import/send failure shouldn't block the response
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Booking cancelled successfully.',
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}
