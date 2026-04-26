import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyRole } from '@/lib/auth';
import { generateReferenceCode } from '@/lib/utils';
import { sanitizeText } from '@/lib/validations';
import { logAuditEvent } from '@/lib/audit';
import { logSafe } from '@/lib/log';
import { createNotification } from '@/lib/notifications';
import { sendPushToUser } from '@/lib/push';

const forceSchema = z.object({
  artistId: z.number().int().positive(),
  clientName: z.string().min(2).max(200),
  clientPhone: z.string().min(6).max(50),
  clientEmail: z.string().email().max(320),
  consultationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  consultationTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .refine((v) => {
      const [h, m] = v.split(':').map(Number);
      return h >= 0 && h <= 23 && m >= 0 && m <= 59;
    }),
  bodyArea: z.string().max(100).optional(),
  sizeCategory: z.string().max(20).default('medium'),
  description: z.string().max(2000).optional(),
  adminNotes: z
    .string()
    .min(10, 'Force-booking requires a justification (min 10 chars).')
    .max(5000),
  language: z.enum(['ro', 'en']).default('ro'),
});

// POST /api/admin/bookings/force — SUPER_ADMIN: create a booking that
// overrides availability and conflict checks. Always audited.
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyRole(request, ['SUPER_ADMIN']);

    const body = await request.json();
    const parsed = forceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const data = parsed.data;

    const artist = await prisma.artist.findUnique({
      where: { id: data.artistId },
      include: { user: { select: { id: true, email: true } } },
    });
    if (!artist) {
      return NextResponse.json(
        { success: false, error: 'Artist not found' },
        { status: 404 },
      );
    }

    const referenceCode = generateReferenceCode();

    const booking = await prisma.booking.create({
      data: {
        referenceCode,
        artistId: artist.id,
        clientName: sanitizeText(data.clientName),
        clientPhone: data.clientPhone,
        clientEmail: data.clientEmail,
        bodyArea: data.bodyArea ? sanitizeText(data.bodyArea) : null,
        sizeCategory: data.sizeCategory,
        description: data.description ? sanitizeText(data.description) : null,
        consultationDate: new Date(`${data.consultationDate}T00:00:00.000Z`),
        consultationTime: data.consultationTime,
        isQuickRequest: false,
        source: 'admin_force',
        status: 'confirmed',
        adminNotes: `[FORCE BOOK] ${sanitizeText(data.adminNotes)}`,
        gdprConsent: true,
        language: data.language,
      },
      include: {
        artist: { select: { id: true, name: true, slug: true } },
      },
    });

    // Audit log is mandatory — surfacing intentional override for compliance
    logAuditEvent({
      userId: Number(admin.sub),
      action: 'booking.force_create',
      targetType: 'booking',
      targetId: booking.id,
      details: {
        artistId: artist.id,
        date: data.consultationDate,
        time: data.consultationTime,
        reason: data.adminNotes,
      },
    }).catch((err) => logSafe('audit.forceBooking', err));

    // Notify the artist so they see the slot before guessing it's free
    if (artist.user?.id) {
      createNotification({
        userId: artist.user.id,
        type: 'booking_new',
        title: 'Programare adaugata de admin',
        message: `Admin a adaugat ${data.clientName} pe ${data.consultationDate} la ${data.consultationTime}.`,
        link: '/artist/bookings',
      }).catch((err) => logSafe('notify.forceBooking', err));
      sendPushToUser(artist.user.id, {
        title: 'Programare adaugata de admin',
        body: `${data.clientName} — ${data.consultationDate} ${data.consultationTime}`,
        url: '/artist/bookings',
        tag: `booking-force-${booking.id}`,
        bookingId: booking.id,
      }).catch((err) => logSafe('push.forceBooking', err));
    }

    return NextResponse.json(
      { success: true, data: { id: booking.id, referenceCode: booking.referenceCode } },
      { status: 201 },
    );
  } catch (error) {
    logSafe('booking.force.create', error);
    return NextResponse.json(
      { success: false, error: 'Unauthorized or internal error' },
      { status: 401 },
    );
  }
}
