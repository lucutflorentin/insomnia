import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminRequest } from '@/lib/auth';
import { bookingStatusSchema } from '@/lib/validations';
import { sendBookingStatusUpdateEmail } from '@/lib/email';
import { logAuditEvent } from '@/lib/audit';
import { logSafe } from '@/lib/log';
import { createNotification } from '@/lib/notifications';
import { sendPushToUser } from '@/lib/push';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/bookings/[id] — Admin: get booking details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await verifyAdminRequest(request);

    const { id } = await params;
    // ARTIST role: scope ownership in the query for IDOR-safe 404 on others' bookings
    const where: Record<string, unknown> = { id: parseInt(id) };
    if (admin.role === 'ARTIST' && admin.artistId) {
      where.artistId = admin.artistId;
    }

    const booking = await prisma.booking.findFirst({
      where,
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

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    logSafe('booking.detail.get', error);
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

    // Rejected bookings require an explanatory adminNotes — clients deserve a reason.
    if (
      parsed.data.status === 'rejected' &&
      (!parsed.data.adminNotes || parsed.data.adminNotes.trim().length < 10)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'A reason (adminNotes, min 10 chars) is required when rejecting a booking.',
        },
        { status: 400 },
      );
    }

    // Fetch current booking, scoped to ARTIST ownership where applicable.
    // findFirst with ownership baked in returns null on others' bookings → uniform 404.
    const whereCurrent: Record<string, unknown> = { id: parseInt(id) };
    if (admin.role === 'ARTIST' && admin.artistId) {
      whereCurrent.artistId = admin.artistId;
    }
    const current = await prisma.booking.findFirst({
      where: whereCurrent,
      select: { status: true, artistId: true, clientId: true },
    });

    if (!current) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 },
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
        consultationDate: booking.consultationDate?.toISOString().split('T')[0],
        consultationTime: booking.consultationTime || undefined,
        adminNotes: parsed.data.adminNotes || undefined,
        language: (booking.language as 'ro' | 'en') || 'ro',
      }).catch(() => {
        // Email failure shouldn't block status update
      });
    }

    // Aftercare email is now sent via cron job 7 days after completion (matches email content)
    // Auto-award loyalty point when status changes to 'completed'
    if (parsed.data.status === 'completed' && current.status !== 'completed') {
      // Auto-award loyalty point if client is registered
      if (current.clientId) {
        try {
          await prisma.loyaltyTransaction.create({
            data: {
              userId: current.clientId,
              bookingId: booking.id,
              type: 'earn',
              points: 1,
              valueRon: 50.00,
              description: `Sedinta completata — ${booking.artist.name}`,
              createdBy: Number(admin.sub),
            },
          });

          // Notify client about earned loyalty point
          createNotification({
            userId: current.clientId,
            type: 'loyalty_earned',
            title: 'Ai primit 1 punct fidelitate!',
            message: `Felicitari! Ai castigat 1 punct (50 RON) pentru sedinta cu ${booking.artist.name}.`,
            link: '/account',
          });

          // Check if 10th point reached → notify admin for surprise
          const earnCount = await prisma.loyaltyTransaction.count({
            where: { userId: current.clientId, type: 'earn' },
          });
          if (earnCount > 0 && earnCount % 10 === 0) {
            const { sendSurpriseNotification } = await import('@/lib/email');
            sendSurpriseNotification({
              clientName: booking.clientName,
              clientEmail: booking.clientEmail,
              totalPoints: earnCount,
            }).catch(() => {});

            // Notify all admins in-app about the loyalty surprise milestone
            prisma.user.findMany({
              where: { role: 'SUPER_ADMIN', isActive: true },
              select: { id: true },
            }).then((admins) => {
              for (const a of admins) {
                createNotification({
                  userId: a.id,
                  type: 'loyalty_earned',
                  title: 'Surpriza loyalty de acordat!',
                  message: `${booking.clientName} a atins ${earnCount} puncte. Acorda surpriza!`,
                  link: '/admin/loyalty',
                });
              }
            }).catch(() => {});
          }
        } catch (loyaltyError) {
          logSafe('loyalty.award', loyaltyError);
        }
      }
    }

    // In-app notification to client about status change
    if (parsed.data.status !== current.status && current.clientId) {
      const statusLabels: Record<string, string> = {
        contacted: 'Te-am contactat',
        confirmed: 'Programare confirmata',
        completed: 'Sedinta finalizata',
        rejected: 'Programare refuzata',
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
  } catch (error) {
    logSafe('booking.detail.put', error);
    return NextResponse.json(
      { success: false, error: 'Unauthorized or booking not found' },
      { status: 401 },
    );
  }
}
