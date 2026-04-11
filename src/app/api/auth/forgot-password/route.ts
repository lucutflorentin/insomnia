import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import crypto from 'crypto';

const FORGOT_PASSWORD_LIMIT = { max: 5, windowSec: 15 * 60 };

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimitResult = checkRateLimit(`forgot-password:${ip}`, FORGOT_PASSWORD_LIMIT);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfterSec) } },
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

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (user && user.passwordHash) {
      // Invalidate any existing unused tokens
      await prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      // Generate token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });

      // Send email (don't await to avoid timing attacks)
      const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://insomniatattoo.ro'}/auth/reset-password?token=${token}`;
      sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        resetUrl,
      }).catch((err) => console.error('Failed to send reset email:', err));
    }

    // Always return success
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 },
    );
  }
}
