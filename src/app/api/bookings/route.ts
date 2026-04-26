import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateReferenceCode } from '@/lib/utils';
import { bookingSchema, quickBookingSchema, sanitizeText } from '@/lib/validations';
import { sendBookingConfirmation, sendBookingNotification } from '@/lib/email';
import { createNotification } from '@/lib/notifications';
import { sendPushToUser } from '@/lib/push';
import { verifyAdminRequest, getCurrentUser } from '@/lib/auth';
import { checkRateLimit, getClientIp, BOOKING_LIMIT } from '@/lib/rate-limit';
import { logSafe } from '@/lib/log';

// POST /api/bookings — Public: create a new booking
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { allowed, retryAfterSec } = checkRateLimit(`booking:${ip}`, BOOKING_LIMIT);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many booking requests. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
      );
    }

    const body = await request.json();

    // Check if user is authenticated (for clientId linkage)
    const currentUser = await getCurrentUser(request);

    // Detect which form sent this (BookingModal vs BookingWizard)
    const isQuickForm = 'artistSlug' in body || body.source === 'quick_form';

    let artistSlug: string;
    let clientName: string;
    let clientPhone: string;
    let clientEmail: string;
    let gdprConsent: boolean;
    let description: string | undefined;
    let bodyArea: string | undefined;
    let sizeCategory: string;
    let stylePreference: string | undefined;
    let consultationDate: string | undefined;
    let consultationTime: string | undefined;
    let source: string;
    let language: string;

    if (isQuickForm) {
      const parsed = quickBookingSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: parsed.error.flatten() },
          { status: 400 },
        );
      }
      artistSlug = parsed.data.artistSlug;
      clientName = parsed.data.clientName;
      clientPhone = parsed.data.clientPhone;
      clientEmail = parsed.data.clientEmail;
      gdprConsent = parsed.data.gdprConsent;
      description = parsed.data.description;
      source = parsed.data.source || 'quick_form';
      language = parsed.data.language;
      sizeCategory = 'medium';
    } else {
      const normalized = {
        artistId: 0,
        clientName: body.name,
        clientPhone: body.phone,
        clientEmail: body.email,
        bodyArea: body.bodyArea,
        sizeCategory: body.size,
        stylePreference: body.style,
        description: body.description,
        consultationDate: body.date,
        consultationTime: body.time,
        gdprConsent: body.gdpr,
        source: body.source,
        language: body.language || 'ro',
      };

      const parsed = bookingSchema.safeParse(normalized);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: 'Validation failed', details: parsed.error.flatten() },
          { status: 400 },
        );
      }

      artistSlug = body.artist;
      clientName = parsed.data.clientName;
      clientPhone = parsed.data.clientPhone;
      clientEmail = parsed.data.clientEmail;
      gdprConsent = parsed.data.gdprConsent;
      description = parsed.data.description;
      bodyArea = parsed.data.bodyArea;
      sizeCategory = parsed.data.sizeCategory;
      stylePreference = parsed.data.stylePreference;
      consultationDate = parsed.data.consultationDate;
      consultationTime = parsed.data.consultationTime;
      source = parsed.data.source || 'website';
      language = parsed.data.language;
    }

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
      include: { user: { select: { email: true } } },
    });

    if (!artist) {
      return NextResponse.json(
        { success: false, error: 'Artist not found' },
        { status: 404 },
      );
    }

    const referenceCode = generateReferenceCode();

    // Use serialized transaction to prevent double-booking race conditions
    const booking = await prisma.$transaction(async (tx) => {
      // Double-booking prevention: check if slot is already taken
      if (consultationDate && consultationTime) {
        const existingBooking = await tx.booking.findFirst({
          where: {
            artistId: artist.id,
            consultationDate: new Date(`${consultationDate}T00:00:00.000Z`),
            consultationTime,
            status: { notIn: ['cancelled', 'no_show', 'rejected'] },
          },
        });

        if (existingBooking) {
          throw new Error('SLOT_TAKEN');
        }
      }

      // Quick-form deduplication: same email + same artist + open status within 5 min
      // shields the artist's queue from accidental double-submits.
      if (isQuickForm) {
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
        const recent = await tx.booking.findFirst({
          where: {
            artistId: artist.id,
            clientEmail,
            isQuickRequest: true,
            status: { in: ['new', 'contacted'] },
            createdAt: { gte: fiveMinAgo },
          },
        });
        if (recent) {
          throw new Error('DUPLICATE_QUICK_REQUEST');
        }
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
          // Quick-form requests carry no scheduled slot — artist proposes one
          // during follow-up. Force UTC midnight on full bookings so the DB
          // DATE column is timezone-agnostic regardless of server TZ.
          consultationDate: consultationDate
            ? new Date(`${consultationDate}T00:00:00.000Z`)
            : null,
          consultationTime: consultationTime || null,
          isQuickRequest: isQuickForm,
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
    };

    sendBookingConfirmation(emailData).catch((err) => logSafe('email.bookingConfirmation', err));
    sendBookingNotification(emailData).catch((err) => logSafe('email.bookingNotification', err));

    // In-app + push notification to artist
    if (artist.userId) {
      createNotification({
        userId: artist.userId,
        type: 'booking_new',
        title: `Booking nou de la ${clientName}`,
        message: `Cerere noua de consultatie — ${bodyArea || 'nedefinit'}, ${sizeCategory}`,
        link: '/artist/bookings',
      });
      sendPushToUser(artist.userId, {
        title: `Booking nou de la ${clientName}`,
        body: `Cerere noua de consultatie — ${bodyArea || 'nedefinit'}, ${sizeCategory}`,
        url: '/artist/bookings',
        tag: `booking-new-${booking.id}`,
        bookingId: booking.id,
        actions: [
          { action: 'confirm', title: 'Confirma' },
          { action: 'view', title: 'Vezi' },
        ],
      });
    }

    return NextResponse.json(
      {
        success: true,
        referenceCode: booking.referenceCode,
        message: 'Booking created successfully',
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'SLOT_TAKEN') {
      return NextResponse.json(
        { success: false, error: 'This time slot is no longer available' },
        { status: 409 },
      );
    }
    if (error instanceof Error && error.message === 'DUPLICATE_QUICK_REQUEST') {
      return NextResponse.json(
        {
          success: false,
          error: 'You already submitted a request to this artist a moment ago. The artist will reach out shortly.',
        },
        { status: 409 },
      );
    }
    logSafe('booking.create', error);
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
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const status = searchParams.get('status');
    const artistId = searchParams.get('artistId');
    const sort = searchParams.get('sort') || 'desc';

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (artistId) where.artistId = parseInt(artistId);

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

    return NextResponse.json({
      success: true,
      data: bookings,
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
