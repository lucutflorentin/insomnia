import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { inspectRequestForAttack, recordSecurityEvent } from '@/lib/security-events';
import crypto from 'crypto';

const RESET_PASSWORD_LIMIT = { max: 5, windowSec: 15 * 60 };

export async function POST(request: NextRequest) {
  await inspectRequestForAttack(request, 'api/auth/reset-password');
  const ip = getClientIp(request);
  const rateLimitResult = await checkRateLimit(
    `reset-password:${ip}`,
    RESET_PASSWORD_LIMIT,
    { request, source: 'api/auth/reset-password' },
  );
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests.' },
      { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfterSec) } },
    );
  }

  try {
    const { token, password } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 400 },
      );
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 },
      );
    }

    if (password.length > 128) {
      return NextResponse.json(
        { success: false, error: 'Password too long' },
        { status: 400 },
      );
    }

    // Hash the incoming token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });

    if (!resetToken) {
      await recordSecurityEvent({
        eventType: 'password_reset_invalid_token',
        severity: 'warning',
        source: 'api/auth/reset-password',
        request,
      });
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset link' },
        { status: 400 },
      );
    }

    if (resetToken.usedAt) {
      return NextResponse.json(
        { success: false, error: 'This reset link has already been used' },
        { status: 400 },
      );
    }

    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'This reset link has expired. Please request a new one.' },
        { status: 400 },
      );
    }

    // Update password and mark token as used
    const passwordHash = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Invalidate all sessions for security
      prisma.session.deleteMany({
        where: { userId: resetToken.userId },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 },
    );
  }
}
