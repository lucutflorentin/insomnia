import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import * as Sentry from '@sentry/nextjs';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const GUEST_ERASURE_CONFIRM_LIMIT = { max: 20, windowSec: 60 * 60 };

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`gdpr-guest-erasure-confirm:${ip}`, GUEST_ERASURE_CONFIRM_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    );
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
    }

    const token =
      body && typeof body === 'object' && !Array.isArray(body) && typeof (body as Record<string, unknown>).token === 'string'
        ? (body as Record<string, string>).token.trim()
        : '';

    if (!token || token.length < 32) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 400 });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const record = await prisma.guestDataErasureToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.usedAt) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired link' },
        { status: 400 },
      );
    }

    if (record.expiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, error: 'Link expired' },
        { status: 400 },
      );
    }

    const emailNorm = record.emailNorm;

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE bookings
        SET
          client_name = ${'Anonimizat (GDPR)'},
          client_email = CONCAT('erased-', id, '@invalid.local'),
          client_phone = '',
          description = NULL,
          reference_images = NULL,
          client_notes = NULL,
          admin_notes = NULL
        WHERE client_id IS NULL AND LOWER(TRIM(client_email)) = ${emailNorm}
      `;

      await tx.guestDataErasureToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Guest booking data has been anonymized.',
    });
  } catch (error) {
    Sentry.captureException(error, { tags: { route: 'gdpr/guest-erasure/confirm' } });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
