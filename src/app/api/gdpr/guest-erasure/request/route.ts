import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import * as Sentry from '@sentry/nextjs';
import { prisma } from '@/lib/prisma';
import { sendGuestDataErasureEmail } from '@/lib/email';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { inspectRequestForAttack } from '@/lib/security-events';

const GUEST_ERASURE_REQUEST_LIMIT = { max: 5, windowSec: 60 * 60 };

function normalizeEmail(value: string): string {
  return value.toLowerCase().trim();
}

export async function POST(request: NextRequest) {
  await inspectRequestForAttack(request, 'api/gdpr/guest-erasure/request');
  const ip = getClientIp(request);
  const rl = await checkRateLimit(
    `gdpr-guest-erasure:${ip}`,
    GUEST_ERASURE_REQUEST_LIMIT,
    { request, source: 'api/gdpr/guest-erasure/request' },
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

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 });
    }

    const emailRaw = (body as Record<string, unknown>).email;
    const langRaw = (body as Record<string, unknown>).language;

    if (typeof emailRaw !== 'string' || !emailRaw.trim()) {
      return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 });
    }

    const emailNorm = normalizeEmail(emailRaw);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm) || emailNorm.length > 320) {
      return NextResponse.json({ success: false, error: 'Invalid email' }, { status: 400 });
    }

    const language = langRaw === 'en' ? 'en' : 'ro';

    const countRows = await prisma.$queryRaw<{ c: bigint }[]>`
      SELECT COUNT(*) AS c FROM bookings
      WHERE client_id IS NULL AND LOWER(TRIM(client_email)) = ${emailNorm}
    `;
    const matchCount = Number(countRows[0]?.c ?? 0);

    // Generic success — do not reveal whether the email exists in DB.
    if (matchCount === 0) {
      return NextResponse.json({
        success: true,
        message:
          language === 'ro'
            ? 'Daca exista date asociate, vei primi un email cu link de confirmare.'
            : 'If we have matching data, you will receive a confirmation email.',
      });
    }

    await prisma.guestDataErasureToken.updateMany({
      where: { emailNorm, usedAt: null },
      data: { usedAt: new Date() },
    });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.guestDataErasureToken.create({
      data: { emailNorm, tokenHash, expiresAt },
    });

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://insomniatattoo.ro';
    const localePath = language === 'en' ? '/en/guest-data' : '/guest-data';
    const confirmUrl = `${baseUrl}${localePath}?token=${rawToken}`;

    sendGuestDataErasureEmail({
      email: emailNorm,
      confirmUrl,
      language,
    }).catch((err) => {
      Sentry.captureException(err, {
        tags: { route: 'gdpr/guest-erasure/request' },
        extra: { emailNorm },
      });
    });

    return NextResponse.json({
      success: true,
      message:
        language === 'ro'
          ? 'Daca exista date asociate, vei primi un email cu link de confirmare.'
          : 'If we have matching data, you will receive a confirmation email.',
    });
  } catch (error) {
    Sentry.captureException(error, { tags: { route: 'gdpr/guest-erasure/request' } });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
