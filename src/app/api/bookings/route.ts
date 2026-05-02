import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import * as Sentry from '@sentry/nextjs';
import { prisma } from '@/lib/prisma';
import { generateReferenceCode, parseLocalDate } from '@/lib/utils';
import { normalizeBookingRequestBody, proxifyReferenceImages } from '@/lib/booking';
import { sanitizeText } from '@/lib/validations';
import { assertBookingSlotAvailable, BookingSlotError } from '@/lib/availability';
import {
  sendBookingAccountWelcomeEmail,
  sendBookingConfirmation,
  sendBookingNotification,
} from '@/lib/email';
import { createNotification } from '@/lib/notifications';
import { sendPushToUser } from '@/lib/push';
import { verifyAdminRequest, getCurrentUser } from '@/lib/auth';
import { checkRateLimit, getClientIp, BOOKING_LIMIT } from '@/lib/rate-limit';
import { inspectRequestForAttack } from '@/lib/security-events';

// POST /api/bookings — Public: create a new booking
export async function POST(request: NextRequest) {
  try {
    await inspectRequestForAttack(request, 'api/bookings:create');
    const ip = getClientIp(request);
    const { allowed, retryAfterSec } = await checkRateLimit(
      `booking:${ip}`,
      BOOKING_LIMIT,
      { request, source: 'api/bookings:create' },
    );
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many booking requests. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
      );
    }

    const body = await request.json();

    // Check if user is authenticated (for clientId linkage)
    const currentUser = await getCurrentUser(request);

    const parsedBooking = normalizeBookingRequestBody(body);
    if (!parsedBooking.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsedBooking.error.flatten() },
        { status: 400 },
      );
    }

    const {
      artistSlug,
      clientPhone,
      clientEmail,
      gdprConsent,
      bodyArea,
      sizeCategory,
      consultationDate,
      consultationTime,
      source,
      language,
    } = parsedBooking.data;
    let {
      clientName,
      description,
      stylePreference,
    } = parsedBooking.data;

    // Sanitize all free-text fields
    clientName = sanitizeText(clientName);
    if (description) description = sanitizeText(description);
    if (stylePreference) stylePreference = sanitizeText(stylePreference);

    // Validate reference images (array of URL strings, max 3)
    const referenceImages = Array.isArray(body.referenceImages)
      ? body.referenceImages.filter((u: unknown) => typeof u === 'string' && u.startsWith('http')).slice(0, 3)
      : null;

    // Lookup artist by slug (includes user for email)
    const artist = await prisma.artist.findUnique({
      where: { slug: artistSlug },
      include: { user: { select: { email: true, isActive: true } } },
    });

    if (!artist || !artist.isActive || !artist.user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Artist not found' },
        { status: 404 },
      );
    }

    const referenceCode = generateReferenceCode();

    // Use serialized transaction to prevent double-booking race conditions
    const booking = await prisma.$transaction(async (tx) => {
      let scheduledDate: Date | null = null;
      if (consultationDate && consultationTime) {
        scheduledDate = await assertBookingSlotAvailable(
          tx,
          artist.id,
          consultationDate,
          consultationTime,
        );
      }

      return tx.booking.create({
        data: {
          referenceCode,
          artistId: artist.id,
          clientId: currentUser ? Number(currentUser.sub) : null,
          clientName,
          clientPhone,
          clientEmail,
          bodyArea: bodyArea || null,
          sizeCategory,
          stylePreference: stylePreference || null,
          description: description || null,
          consultationDate: scheduledDate,
          consultationTime: consultationTime || null,
          source,
          status: 'new',
          gdprConsent,
          language,
          referenceImages: referenceImages && referenceImages.length > 0 ? referenceImages : undefined,
        },
      });
    }, { isolationLevel: 'Serializable' });

    // Send emails async (fire-and-forget)
    const emailData = {
      clientName,
      clientEmail,
      artistName: artist.name,
      artistEmail: artist.user.email,
      date: consultationDate || 'De stabilit',
      time: consultationTime || 'De stabilit',
      referenceCode,
      bodyArea,
      size: sizeCategory,
      style: stylePreference,
      description,
      source,
      clientPhone,
      language: language as 'ro' | 'en',
      referenceImages: referenceImages || undefined,
    };

    type DeliveryTask = { label: string; run: () => Promise<unknown> };
    const deliveryTasks: DeliveryTask[] = [
      {
        label: 'email_confirmation',
        run: () => sendBookingConfirmation(emailData),
      },
      {
        label: 'email_artist_notification',
        run: () => sendBookingNotification(emailData),
      },
    ];

    // In-app + push notification to artist
    if (artist.userId) {
      deliveryTasks.push(
        {
          label: 'in_app_notification',
          run: () =>
            createNotification({
              userId: artist.userId,
              type: 'booking_new',
              title: `Booking nou de la ${clientName}`,
              message: `Cerere noua de consultatie — ${bodyArea || 'nedefinit'}, ${sizeCategory}`,
              link: '/artist/bookings',
            }),
        },
        {
          label: 'web_push',
          run: () =>
            sendPushToUser(artist.userId!, {
              title: `Booking nou de la ${clientName}`,
              body: `Cerere noua de consultatie — ${bodyArea || 'nedefinit'}, ${sizeCategory}`,
              url: '/artist/bookings',
              tag: `booking-new-${booking.id}`,
            }),
        },
      );
    }

    // Optional account creation: if the guest opted in and this email is
    // not already a user, provision a CLIENT account with no password and
    // send a "set your password" link so they can finish activation.
    let accountCreated = false;
    const optInCreate = body && typeof body === 'object' && body.createAccount === true;
    if (!currentUser && optInCreate) {
      try {
        const normalizedEmail = clientEmail.toLowerCase().trim();
        const existing = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: { id: true },
        });
        if (!existing) {
          const newUser = await prisma.user.create({
            data: {
              email: normalizedEmail,
              name: clientName,
              phone: clientPhone || null,
              role: 'CLIENT',
              passwordHash: null,
            },
            select: { id: true, email: true, name: true },
          });

          await prisma.booking.update({
            where: { id: booking.id },
            data: { clientId: newUser.id },
          });

          const token = crypto.randomBytes(32).toString('hex');
          const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
          const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
          await prisma.passwordResetToken.create({
            data: { userId: newUser.id, token: tokenHash, expiresAt },
          });

          const setupUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://insomniatattoo.ro'}/auth/reset-password?token=${token}`;
          deliveryTasks.push({
            label: 'email_account_welcome',
            run: () =>
              sendBookingAccountWelcomeEmail({
                email: newUser.email,
                name: newUser.name,
                setupUrl,
                language: language as 'ro' | 'en',
              }),
          });
          accountCreated = true;
        }
      } catch (accountError) {
        // Account creation should never break the booking.
        Sentry.captureException(accountError, {
          tags: { route: 'bookings/create-account' },
          extra: { bookingId: booking.id },
        });
      }
    }

    const deliveryResults = await Promise.allSettled(
      deliveryTasks.map((t) => t.run()),
    );
    deliveryResults.forEach((result, i) => {
      if (result.status === 'rejected') {
        Sentry.captureException(result.reason, {
          tags: { route: 'bookings/delivery', task: deliveryTasks[i]?.label },
          extra: { bookingId: booking.id, task: deliveryTasks[i]?.label },
        });
        console.error(
          `Booking delivery task failed (${deliveryTasks[i]?.label}):`,
          result.reason,
        );
      }
    });

    return NextResponse.json(
      {
        success: true,
        referenceCode: booking.referenceCode,
        accountCreated,
        message: 'Booking created successfully',
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof BookingSlotError) {
      const message = error.code === 'DATE_OUT_OF_RANGE'
        ? 'Selected date is outside the booking window'
        : error.code === 'SLOT_TAKEN'
          ? 'This time slot is no longer available'
          : 'Selected time slot is not available';
      return NextResponse.json(
        { success: false, error: message },
        { status: error.code === 'DATE_OUT_OF_RANGE' ? 400 : 409 },
      );
    }
    Sentry.captureException(error, {
      tags: { route: 'bookings/POST' },
    });
    console.error('Booking creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// GET /api/bookings — Admin: list bookings with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdminRequest(request);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const status = searchParams.get('status');
    const artistId = searchParams.get('artistId');
    const sort = searchParams.get('sort') || 'desc';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (artistId) {
      const id = parseInt(artistId, 10);
      if (Number.isNaN(id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid artistId' },
          { status: 400 },
        );
      }
      where.artistId = id;
    }
    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        dateFilter.gte = parseLocalDate(startDate);
      }
      if (endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        dateFilter.lte = parseLocalDate(endDate);
      }
      if (Object.keys(dateFilter).length > 0) {
        where.consultationDate = dateFilter;
      }
    }

    // ARTIST role: scope to own bookings only
    if (admin.role === 'ARTIST' && admin.artistId) {
      where.artistId = admin.artistId;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: { artist: { select: { id: true, name: true, slug: true } } },
        orderBy: { createdAt: sort === 'asc' ? 'asc' : 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    // Replace raw blob URLs with API-gated proxy paths before returning
    // anything to the admin/artist client.
    const safeBookings = bookings.map((booking) => ({
      ...booking,
      referenceImages: proxifyReferenceImages(booking.id, booking.referenceImages),
    }));

    return NextResponse.json({
      success: true,
      data: safeBookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}
