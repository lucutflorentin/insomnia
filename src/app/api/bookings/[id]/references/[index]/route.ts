import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { prisma } from '@/lib/prisma';
import { verifyAdminRequest } from '@/lib/auth';
import { parseReferenceImages } from '@/lib/booking';

interface RouteParams {
  params: Promise<{ id: string; index: string }>;
}

/**
 * GET /api/bookings/[id]/references/[index]
 *
 * Streams a booking's reference image from Vercel Blob storage. Replaces the
 * raw public Blob URL so that:
 *   1. Only authenticated admins or the assigned artist can fetch the image.
 *   2. The browser/devtools never see the underlying Blob URL, so accidental
 *      sharing (forwarded email, copy-paste) cannot leak the image to the
 *      open internet.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await verifyAdminRequest(request);
    const { id, index } = await params;

    const bookingId = Number.parseInt(id, 10);
    const imageIndex = Number.parseInt(index, 10);
    if (
      !Number.isFinite(bookingId) ||
      !Number.isFinite(imageIndex) ||
      imageIndex < 0
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid request' },
        { status: 400 },
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { artistId: true, referenceImages: true },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 },
      );
    }

    // ARTIST role: can only access references on bookings assigned to them.
    if (admin.role === 'ARTIST' && admin.artistId !== booking.artistId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 },
      );
    }

    const urls = parseReferenceImages(booking.referenceImages);
    const url = urls[imageIndex];
    if (!url) {
      return NextResponse.json(
        { success: false, error: 'Reference image not found' },
        { status: 404 },
      );
    }

    const upstream = await fetch(url, { cache: 'no-store' });
    if (!upstream.ok || !upstream.body) {
      Sentry.captureMessage('Reference image fetch from blob failed', {
        level: 'warning',
        tags: { route: 'bookings/references' },
        extra: { bookingId, imageIndex, status: upstream.status },
      });
      return NextResponse.json(
        { success: false, error: 'Image is no longer available' },
        { status: 502 },
      );
    }

    const contentType = upstream.headers.get('content-type') || 'image/webp';
    const contentLength = upstream.headers.get('content-length') || undefined;

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        ...(contentLength ? { 'Content-Length': contentLength } : {}),
        // Prevent shared / public caches from holding the bytes; allow the
        // user agent to keep them while the page session is alive only.
        'Cache-Control': 'private, max-age=0, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
        // The proxy hides the upstream URL by design — make sure no referrer
        // policy ever leaks it.
        'Referrer-Policy': 'no-referrer',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const isAuthError =
      message.includes('cookie') ||
      message.includes('token') ||
      message.includes('permission') ||
      message.includes('Insufficient');
    if (!isAuthError) {
      Sentry.captureException(error, {
        tags: { route: 'bookings/references' },
      });
    }
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}
