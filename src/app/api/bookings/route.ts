import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateReferenceCode, parseLocalDate } from '@/lib/utils';
import { normalizeBookingRequestBody } from '@/lib/booking';
import { sanitizeText } from '@/lib/validations';
import { sendBookingConfirmation, sendBookingNotification } from '@/lib/email';
import { createNotification } from '@/lib/notifications';
import { sendPushToUser } from '@/lib/push';
import { verifyAdminRequest, getCurrentUser } from '@/lib/auth';
import { checkRateLimit, getClientIp, BOOKING_LIMIT } from '@/lib/rate-limit';

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
            consultationDate: parseLocalDate(consultationDate),
            consultationTime,
            status: { notIn: ['cancelled', 'no_show'] },
          },
        });

        if (existingBooking) {
          throw new Error('SLOT_TAKEN');
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
          consultationDate: consultationDate
            ? parseLocalDate(consultationDate)
            : new Date(),
          consultationTime: consultationTime || '00:00',
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

    sendBookingConfirmation(emailData).catch(console.error);
    sendBookingNotification(emailData).catch(console.error);

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
