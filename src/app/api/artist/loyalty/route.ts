import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminRequest } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
import { sendPushToUser } from '@/lib/push';

// POST /api/artist/loyalty — Artist: award bonus points to a client from a completed booking
export async function POST(request: NextRequest) {
  try {
    const artist = await verifyAdminRequest(request);

    const body = await request.json();
    const { bookingId, points, description } = body;

    if (!bookingId || !points) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: bookingId, points' },
        { status: 400 },
      );
    }

    if (typeof points !== 'number' || !Number.isInteger(points) || points < 1 || points > 10) {
      return NextResponse.json(
        { success: false, error: 'Points must be an integer between 1 and 10' },
        { status: 400 },
      );
    }

    // Fetch booking and verify ownership
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        clientId: true,
        clientName: true,
        artistId: true,
        artist: { select: { name: true } },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 },
      );
    }

    // ARTIST can only award points on their own bookings
    if (artist.role === 'ARTIST' && artist.artistId !== booking.artistId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 },
      );
    }

    if (booking.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Can only award points for completed bookings' },
        { status: 400 },
      );
    }

    if (!booking.clientId) {
      return NextResponse.json(
        { success: false, error: 'Cannot award points to guest bookings (client not registered)' },
        { status: 400 },
      );
    }

    // Check if bonus was already awarded for this booking by this artist
    const existing = await prisma.loyaltyTransaction.findFirst({
      where: {
        bookingId: booking.id,
        type: 'bonus',
        createdBy: Number(artist.sub),
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Bonus already awarded for this booking' },
        { status: 409 },
      );
    }

    const transaction = await prisma.loyaltyTransaction.create({
      data: {
        userId: booking.clientId,
        bookingId: booking.id,
        type: 'bonus',
        points,
        valueRon: points * 50,
        description: description || `Bonus de la ${booking.artist.name}`,
        createdBy: Number(artist.sub),
      },
    });

    // Notify client
    createNotification({
      userId: booking.clientId,
      type: 'loyalty_earned',
      title: `Bonus: +${points} punct${points > 1 ? 'e' : ''}!`,
      message: `${booking.artist.name} ti-a acordat ${points} punct${points > 1 ? 'e' : ''} bonus (${points * 50} RON).`,
      link: '/account/loyalty',
    });

    sendPushToUser(booking.clientId, {
      title: `Bonus: +${points} punct${points > 1 ? 'e' : ''}!`,
      body: `${booking.artist.name} ti-a acordat un bonus de loialitate.`,
      url: '/account/loyalty',
      tag: `loyalty-bonus-${booking.id}`,
    });

    return NextResponse.json(
      { success: true, data: transaction },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}
