import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminRequest } from '@/lib/auth';
import { bookingStatusSchema } from '@/lib/validations';
import { sendBookingStatusUpdateEmail } from '@/lib/email';
import { logAuditEvent } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import { sendPushToUser } from '@/lib/push';
import { formatLocalDateKey } from '@/lib/utils';
import { proxifyReferenceImages } from '@/lib/booking';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/bookings/[id] — Admin: get booking details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await verifyAdminRequest(request);

    const { id } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(id) },
      include: {
        artist: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 },
      );
    }

    // ARTIST role: can only see own bookings
    if (admin.role === 'ARTIST' && admin.artistId !== booking.artistId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...booking,
        referenceImages: proxifyReferenceImages(booking.id, booking.referenceImages),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}

// PUT /api/bookings/[id] — Admin: update booking status/notes
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await verifyAdminRequest(request);

    const { id } = await params;
    const body = await request.json();

    const parsed = bookingStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Fetch current booking to check previous status and ownership
    const current = await prisma.booking.findUnique({
      where: { id: parseInt(id) },
      select: { status: true, artistId: true, clientId: true },
    });

    if (!current) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 },
      );
    }

    // ARTIST role: can only update own bookings
    if (admin.role === 'ARTIST' && admin.artistId !== current.artistId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 },
      );
    }

    const booking = await prisma.booking.update({
      where: { id: parseInt(id) },
      data: {
        status: parsed.data.status,
        adminNotes: parsed.data.adminNotes,
        ...(parsed.data.clientNotes !== undefined ? { clientNotes: parsed.data.clientNotes } : {}),
      },
      include: {
        artist: { select: { id: true, name: true, slug: true } },
      },
    });

    // Send status update email to client when status changes
    if (parsed.data.status !== current.status) {
      sendBookingStatusUpdateEmail({
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        artistName: booking.artist.name,
        referenceCode: booking.referenceCode,
        newStatus: parsed.data.status,
        consultationDate: booking.consultationDate
          ? formatLocalDateKey(booking.consultationDate)
          : undefined,
        consultationTime: booking.consultationTime || undefined,
        adminNotes: parsed.data.adminNotes || undefined,
        language: (booking.language as 'ro' | 'en') || 'ro',
      }).catch(() => {
        // Email failure shouldn't block status update
      });
    }

    // Aftercare email is now sent via cron job 7 days after completion (matches email content)
    // Loyalty awarding is no longer automatic — the artist explicitly grants
    // points via POST /api/artist/loyalty after marking a booking as completed.
    // The "10-points surprise" notification still happens, but it's triggered
    // from inside that endpoint when the artist actually awards points.

    // In-app notification to client about status change
    if (parsed.data.status !== current.status && current.clientId) {
      const statusLabels: Record<string, string> = {
        contacted: 'Te-am contactat',
        confirmed: 'Programare confirmata',
        completed: 'Sedinta finalizata',
        cancelled: 'Programare anulata',
      };
      const label = statusLabels[parsed.data.status];
      if (label) {
        createNotification({
          userId: current.clientId,
          type: 'booking_status',
          title: label,
          message: `Programarea ta cu ${booking.artist.name} — ${label.toLowerCase()}`,
          link: '/account/bookings',
        });
        sendPushToUser(current.clientId, {
          title: label,
          body: `Programarea ta cu ${booking.artist.name} — ${label.toLowerCase()}`,
          url: '/account/bookings',
          tag: `booking-status-${booking.id}`,
        });
      }
    }

    // Audit log
    if (parsed.data.status !== current.status) {
      logAuditEvent({
        userId: Number(admin.sub),
        action: 'booking.status_change',
        targetType: 'booking',
        targetId: booking.id,
        details: { from: current.status, to: parsed.data.status },
      });
    }

    return NextResponse.json({ success: true, data: booking });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized or booking not found' },
      { status: 401 },
    );
  }
}
