import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import * as Sentry from '@sentry/nextjs';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { inspectRequestForAttack, recordSecurityEvent } from '@/lib/security-events';

const GUEST_ERASURE_CONFIRM_LIMIT = { max: 20, windowSec: 60 * 60 };

export async function POST(request: NextRequest) {
  await inspectRequestForAttack(request, 'api/gdpr/guest-erasure/confirm');
  const ip = getClientIp(request);
  const rl = await checkRateLimit(
    `gdpr-guest-erasure-confirm:${ip}`,
    GUEST_ERASURE_CONFIRM_LIMIT,
    { request, source: 'api/gdpr/guest-erasure/confirm' },
  );
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
      await recordSecurityEvent({
        eventType: 'gdpr_erasure_invalid_token',
        severity: 'warning',
        source: 'api/gdpr/guest-erasure/confirm',
        request,
      });
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
      const bookingsToAnonymize = await tx.booking.findMany({
        where: { clientId: null, clientEmail: emailNorm },
        select: { id: true },
      });

      for (const booking of bookingsToAnonymize) {
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            clientName: 'Anonimizat (GDPR)',
            clientEmail: `erased-${booking.id}@invalid.local`,
            clientPhone: '',
            description: null,
            referenceImages: Prisma.DbNull,
            clientNotes: null,
            adminNotes: null,
          },
        });
      }

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
