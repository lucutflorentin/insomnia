import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAftercareReminder, sendReviewRequest } from '@/lib/email';

// GET /api/cron/scheduled-emails — Vercel Cron: send aftercare (7d) and review request (30d) emails
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized invocations
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }

  const now = new Date();
  let aftercareSent = 0;
  let reviewRequestsSent = 0;

  try {
    // --- Aftercare emails: completed bookings 7 days ago, not yet sent ---
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const eightDaysAgo = new Date(now);
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

    const aftercareBookings = await prisma.booking.findMany({
      where: {
        status: 'completed',
        aftercareSentAt: null,
        updatedAt: {
          gte: eightDaysAgo,
          lte: sevenDaysAgo,
        },
      },
      include: {
        artist: { select: { name: true } },
      },
      take: 20, // Process in batches to avoid timeouts
    });

    for (const booking of aftercareBookings) {
      try {
        await sendAftercareReminder({
          clientName: booking.clientName,
          clientEmail: booking.clientEmail,
          artistName: booking.artist.name,
          language: (booking.language as 'ro' | 'en') || 'ro',
        });

        await prisma.booking.update({
          where: { id: booking.id },
          data: { aftercareSentAt: now },
        });

        aftercareSent++;
      } catch (err) {
        console.error(`Aftercare email failed for booking ${booking.id}:`, err);
      }
    }

    // --- Review request emails: completed bookings 30 days ago, not yet sent ---
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const thirtyOneDaysAgo = new Date(now);
    thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);

    const reviewBookings = await prisma.booking.findMany({
      where: {
        status: 'completed',
        reviewRequestSentAt: null,
        updatedAt: {
          gte: thirtyOneDaysAgo,
          lte: thirtyDaysAgo,
        },
      },
      include: {
        artist: { select: { name: true } },
      },
      take: 20,
    });

    for (const booking of reviewBookings) {
      try {
        await sendReviewRequest({
          clientName: booking.clientName,
          clientEmail: booking.clientEmail,
          artistName: booking.artist.name,
          language: (booking.language as 'ro' | 'en') || 'ro',
        });

        await prisma.booking.update({
          where: { id: booking.id },
          data: { reviewRequestSentAt: now },
        });

        reviewRequestsSent++;
      } catch (err) {
        console.error(`Review request email failed for booking ${booking.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        aftercareSent,
        reviewRequestsSent,
        timestamp: now.toISOString(),
      },
    });
  } catch (error) {
    console.error('Scheduled emails cron error:', error);
    return NextResponse.json(
      { success: false, error: 'Cron job failed' },
      { status: 500 },
    );
  }
}
