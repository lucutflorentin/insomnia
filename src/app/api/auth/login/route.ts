import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validations';
import {
  comparePassword,
  signToken,
  signRefreshToken,
  setAuthCookies,
  createRefreshSession,
} from '@/lib/auth';
import type { JWTPayload } from '@/lib/auth';
import { checkRateLimit, getClientIp, AUTH_LIMIT } from '@/lib/rate-limit';
import { inspectRequestForAttack, recordSecurityEvent } from '@/lib/security-events';

export async function POST(request: NextRequest) {
  try {
    await inspectRequestForAttack(request, 'api/auth/login');
    const ip = getClientIp(request);
    const { allowed, retryAfterSec } = await checkRateLimit(
      `login:${ip}`,
      AUTH_LIMIT,
      { request, source: 'api/auth/login' },
    );
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many login attempts. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
      );
    }

    const body = await request.json();

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 400 },
      );
    }

    // Query User table (unified auth)
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      include: { artist: true },
    });

    if (!user || !user.passwordHash || !user.isActive) {
      await recordSecurityEvent({
        eventType: 'auth_failed',
        severity: 'warning',
        source: 'api/auth/login',
        request,
        details: { reason: 'invalid_user_or_inactive' },
      });
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 },
      );
    }

    // Account lockout check
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      await recordSecurityEvent({
        eventType: 'auth_failed',
        severity: 'warning',
        source: 'api/auth/login',
        request,
        userId: user.id,
        details: { reason: 'account_locked', minutesLeft },
      });
      return NextResponse.json(
        { success: false, error: `Account locked. Try again in ${minutesLeft} minutes.` },
        { status: 423 },
      );
    }

    const validPassword = await comparePassword(
      parsed.data.password,
      user.passwordHash,
    );

    if (!validPassword) {
      const attempts = user.failedLoginAttempts + 1;
      const MAX_ATTEMPTS = 5;
      const LOCKOUT_MINUTES = 15;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          ...(attempts >= MAX_ATTEMPTS
            ? { lockedUntil: new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) }
            : {}),
        },
      });

      await recordSecurityEvent({
        eventType: attempts >= MAX_ATTEMPTS ? 'auth_lockout' : 'auth_failed',
        severity: attempts >= MAX_ATTEMPTS ? 'critical' : 'warning',
        source: 'api/auth/login',
        request,
        userId: user.id,
        details: { reason: 'invalid_password', attempts },
      });

      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 },
      );
    }

    const payload: JWTPayload = {
      sub: user.id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      ...(user.artist ? { artistId: user.artist.id } : {}),
    };

    const [accessToken, refreshToken] = await Promise.all([
      signToken(payload),
      signRefreshToken(payload),
    ]);

    await prisma.$transaction(async (tx) => {
      await tx.session.deleteMany({ where: { userId: user.id, expiresAt: { lt: new Date() } } });
      await tx.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date(), failedLoginAttempts: 0, lockedUntil: null },
      });
    });
    await createRefreshSession(user.id, refreshToken, request);
    await setAuthCookies(accessToken, refreshToken);

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        artist: user.artist
          ? { id: user.artist.id, slug: user.artist.slug }
          : null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
