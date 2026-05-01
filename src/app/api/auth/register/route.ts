import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { registerSchema, sanitizeText } from '@/lib/validations';
import {
  hashPassword,
  signToken,
  signRefreshToken,
  setAuthCookies,
  createRefreshSession,
} from '@/lib/auth';
import type { JWTPayload } from '@/lib/auth';
import { checkRateLimit, getClientIp, REGISTER_LIMIT } from '@/lib/rate-limit';
import { sendEmailVerification } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { allowed, retryAfterSec } = checkRateLimit(`register:${ip}`, REGISTER_LIMIT);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many registration attempts. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
      );
    }

    const body = await request.json();

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || 'Invalid data' },
        { status: 400 },
      );
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);

    const user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        passwordHash,
        name: sanitizeText(parsed.data.name),
        phone: parsed.data.phone || null,
        role: 'CLIENT',
      },
    });

    const payload: JWTPayload = {
      sub: user.id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      signToken(payload),
      signRefreshToken(payload),
    ]);

    await createRefreshSession(user.id, refreshToken, request);
    await setAuthCookies(accessToken, refreshToken);

    // Send email verification (non-blocking)
    try {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });

      const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://insomniatattoo.ro'}/auth/verify-email?token=${token}`;
      sendEmailVerification({
        email: user.email,
        name: user.name,
        verifyUrl,
      }).catch((err) => console.error('Failed to send verification email:', err));
    } catch (emailErr) {
      console.error('Email verification setup error:', emailErr);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
