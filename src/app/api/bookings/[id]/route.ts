import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminRequest } from '@/lib/auth';
import { bookingStatusSchema } from '@/lib/validations';
import { sendAftercareReminder } from '@/lib/email';

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

    return NextResponse.json({ success: true, data: booking });
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
      },
      include: {
        artist: { select: { id: true, name: true, slug: true } },
      },
    });

    // Send aftercare email when status changes to 'completed'
    if (parsed.data.status === 'completed' && current.status !== 'completed') {
      sendAftercareReminder({
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        artistName: booking.artist.name,
        language: (booking.language as 'ro' | 'en') || 'ro',
      }).catch(() => {
        // Email failure shouldn't block status update
      });

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
          }
        } catch (loyaltyError) {
          console.error('Loyalty point award failed:', loyaltyError);
        }
      }
    }

    return NextResponse.json({ success: true, data: booking });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized or booking not found' },
      { status: 401 },
    );
  }
}
