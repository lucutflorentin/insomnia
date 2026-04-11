import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const VERIFY_LIMIT = { max: 10, windowSec: 60 };

// GET /api/auth/verify-email?token=xxx — Verify email address
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`verify-email:${ip}`, VERIFY_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests.' },
      { status: 429 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 400 },
      );
    }

    // Find valid token
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification link' },
        { status: 400 },
      );
    }

    if (verificationToken.usedAt) {
      return NextResponse.json(
        { success: false, error: 'This verification link has already been used' },
        { status: 400 },
      );
    }

    if (verificationToken.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'This verification link has expired. Please request a new one.' },
        { status: 400 },
      );
    }

    // Mark email as verified and token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerifiedAt: new Date() },
      }),
      prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully.',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 },
    );
  }
}

// POST /api/auth/verify-email — Resend verification email
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`resend-verify:${ip}`, { max: 3, windowSec: 15 * 60 });
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please wait.' },
      { status: 429 },
    );
  }

  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Always return success to prevent email enumeration
    if (user && !user.emailVerifiedAt && user.passwordHash) {
      // Invalidate existing tokens
      await prisma.emailVerificationToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      // Generate new token
      const crypto = await import('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });

      // Send email (non-blocking)
      const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://insomniatattoo.ro'}/auth/verify-email?token=${token}`;
      const { sendEmailVerification } = await import('@/lib/email');
      sendEmailVerification({
        email: user.email,
        name: user.name,
        verifyUrl,
      }).catch((err) => console.error('Failed to send verification email:', err));
    }

    return NextResponse.json({
      success: true,
      message: 'If your email needs verification, a link has been sent.',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 },
    );
  }
}
