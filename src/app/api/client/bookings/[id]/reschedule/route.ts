import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyAuthRequest } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { logSafe } from '@/lib/log';
import { createNotification } from '@/lib/notifications';
import { sendPushToUser } from '@/lib/push';
import { logAuditEvent } from '@/lib/audit';
import { sendBookingStatusUpdateEmail } from '@/lib/email';
import { getTimeSlots } from '@/lib/utils';

const RESCHEDULE_PER_HOUR = { max: 5, windowSec: 60 * 60 };
const MIN_NOTICE_HOURS = 48;

const rescheduleSchema = z.object({
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  newTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Invalid time format')
    .refine((v) => {
      const [h, m] = v.split(':').map(Number);
      return h >= 0 && h <= 23 && m >= 0 && m <= 59;
    }, 'Invalid time of day'),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

// POST /api/client/bookings/[id]/reschedule — Client: move own booking to a new slot
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const payload = await verifyAuthRequest(request);
    const userId = Number(payload.sub);

    const rl = checkRateLimit(`reschedule:user:${userId}`, RESCHEDULE_PER_HOUR);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many reschedule attempts. Try again later.' },
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

    const body = await request.json();
    const parsed = rescheduleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { newDate, newTime } = parsed.data;

    // Atomic: re-validate ownership + status + slot freshness in a serialized
    // transaction so two simultaneous reschedules can't both grab the same slot.
    const updated = await prisma.$transaction(
      async (tx) => {
        const booking = await tx.booking.findFirst({
          where: {
            id: bookingId,
            clientId: userId,
            status: { in: ['new', 'contacted', 'confirmed'] },
          },
          include: {
            artist: {
              select: {
                id: true,
                userId: true,
                name: true,
                user: { select: { email: true } },
              },
            },
          },
        });

        if (!booking) {
          throw new Error('NOT_FOUND');
        }

        // 48h notice on the OLD date if it was set (skip for quick-form requests)
        if (booking.consultationDate) {
          const hoursToOld =
            (booking.consultationDate.getTime() - Date.now()) / (1000 * 60 * 60);
          if (hoursToOld < MIN_NOTICE_HOURS) {
            throw new Error('TOO_LATE');
          }
        }

        // 48h notice on the NEW date
        const newDateTime = new Date(`${newDate}T${newTime}:00.000Z`);
        const hoursToNew = (newDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursToNew < MIN_NOTICE_HOURS) {
          throw new Error('NEW_TOO_SOON');
        }

        // Slot must be in the artist's published availability
        const dayOfWeek = new Date(`${newDate}T00:00:00.000Z`).getUTCDay();
        const [override, template] = await Promise.all([
          tx.availability.findFirst({
            where: {
              artistId: booking.artistId,
              date: new Date(`${newDate}T00:00:00.000Z`),
            },
          }),
          tx.availabilityTemplate.findFirst({
            where: {
              artistId: booking.artistId,
              dayOfWeek,
              isActive: true,
            },
          }),
        ]);

        const window = override || template;
        if (!window || (override && !override.isAvailable)) {
          throw new Error('SLOT_UNAVAILABLE');
        }

        const slotDuration = window.slotDurationMinutes || 60;
        const buffer = (window as { bufferMinutes?: number }).bufferMinutes || 0;
        const validSlots = getTimeSlots(window.startTime, window.endTime, slotDuration);
        if (!validSlots.includes(newTime)) {
          throw new Error('SLOT_UNAVAILABLE');
        }

        // Conflict check — excluding the booking being rescheduled
        const candidateStart = timeToMinutes(newTime);
        const candidateEnd = candidateStart + slotDuration;
        const sameDayBookings = await tx.booking.findMany({
          where: {
            artistId: booking.artistId,
            consultationDate: new Date(`${newDate}T00:00:00.000Z`),
            consultationTime: { not: null },
            status: { notIn: ['cancelled', 'no_show', 'rejected'] },
            id: { not: bookingId },
          },
          select: { consultationTime: true },
        });
        for (const b of sameDayBookings) {
          if (!b.consultationTime) continue;
          const occStart = timeToMinutes(b.consultationTime);
          const occEnd = occStart + slotDuration + buffer;
          if (candidateStart < occEnd && candidateEnd > occStart) {
            throw new Error('SLOT_TAKEN');
          }
        }

        const oldSnapshot = {
          date: booking.consultationDate?.toISOString().slice(0, 10) ?? null,
          time: booking.consultationTime ?? null,
        };

        const result = await tx.booking.update({
          where: { id: bookingId },
          data: {
            consultationDate: new Date(`${newDate}T00:00:00.000Z`),
            consultationTime: newTime,
            isQuickRequest: false,
            adminNotes:
              (booking.adminNotes ? `${booking.adminNotes}\n` : '') +
              `--- Reprogramat de client la ${new Date().toISOString()}: ${
                oldSnapshot.date ?? '—'
              } ${oldSnapshot.time ?? ''} → ${newDate} ${newTime} ---`,
          },
          include: {
            artist: {
              select: {
                id: true,
                userId: true,
                name: true,
                slug: true,
                user: { select: { email: true } },
              },
            },
          },
        });

        return { booking: result, oldSnapshot };
      },
      { isolationLevel: 'Serializable' },
    );

    const { booking } = updated;

    // Audit log + notify the artist (best effort; don't block the response)
    logAuditEvent({
      userId,
      action: 'booking.reschedule',
      targetType: 'booking',
      targetId: booking.id,
      details: {
        from: updated.oldSnapshot,
        to: { date: newDate, time: newTime },
      },
    }).catch((err) => logSafe('audit.reschedule', err));

    if (booking.artist.userId) {
      createNotification({
        userId: booking.artist.userId,
        type: 'booking_status',
        title: `Reprogramare: ${booking.clientName}`,
        message: `Booking ${booking.referenceCode} mutat la ${newDate} ${newTime}.`,
        link: '/artist/bookings',
      }).catch((err) => logSafe('notify.reschedule', err));
      sendPushToUser(booking.artist.userId, {
        title: 'Reprogramare booking',
        body: `${booking.clientName} a mutat ${booking.referenceCode} la ${newDate} ${newTime}.`,
        url: '/artist/bookings',
        tag: `booking-reschedule-${booking.id}`,
      }).catch((err) => logSafe('push.reschedule', err));
    }

    sendBookingStatusUpdateEmail({
      clientName: booking.clientName,
      clientEmail: booking.artist.user?.email || '',
      artistName: booking.artist.name,
      referenceCode: booking.referenceCode,
      newStatus: 'confirmed',
      consultationDate: newDate,
      consultationTime: newTime,
      adminNotes: `Clientul ${booking.clientName} a reprogramat sedinta. Te rugam confirma noua data.`,
      language: (booking.language as 'ro' | 'en') || 'ro',
    }).catch((err) => logSafe('email.reschedule', err));

    return NextResponse.json({
      success: true,
      data: {
        id: booking.id,
        referenceCode: booking.referenceCode,
        consultationDate: booking.consultationDate?.toISOString().slice(0, 10),
        consultationTime: booking.consultationTime,
      },
      message: 'Booking rescheduled successfully.',
    });
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case 'NOT_FOUND':
          return NextResponse.json(
            { success: false, error: 'Booking not found or not eligible to reschedule.' },
            { status: 404 },
          );
        case 'TOO_LATE':
          return NextResponse.json(
            {
              success: false,
              error: `Bookings can only be rescheduled at least ${MIN_NOTICE_HOURS} hours before the current date. Please contact the artist directly.`,
            },
            { status: 400 },
          );
        case 'NEW_TOO_SOON':
          return NextResponse.json(
            {
              success: false,
              error: `New appointment must be at least ${MIN_NOTICE_HOURS} hours from now.`,
            },
            { status: 400 },
          );
        case 'SLOT_UNAVAILABLE':
          return NextResponse.json(
            { success: false, error: 'Selected slot is not available for this artist.' },
            { status: 400 },
          );
        case 'SLOT_TAKEN':
          return NextResponse.json(
            { success: false, error: 'This time slot is no longer available. Please pick another.' },
            { status: 409 },
          );
      }
    }
    logSafe('booking.reschedule', error);
    return NextResponse.json(
      { success: false, error: 'Unauthorized or internal error' },
      { status: 401 },
    );
  }
}
