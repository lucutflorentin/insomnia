import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  verifyGoogleToken,
  signToken,
  signRefreshToken,
  setAuthCookies,
  createRefreshSession,
} from '@/lib/auth';
import type { JWTPayload } from '@/lib/auth';
import { checkRateLimit, getClientIp, AUTH_LIMIT } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { allowed, retryAfterSec } = checkRateLimit(`google:${ip}`, AUTH_LIMIT);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many attempts. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
      );
    }

    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { success: false, error: 'Missing Google ID token' },
        { status: 400 },
      );
    }

    const googleData = await verifyGoogleToken(idToken);

    // Find existing user by googleId or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: googleData.googleId },
          { email: googleData.email },
        ],
      },
      include: { artist: true },
    });

    if (user) {
      // Link Google account if not already linked
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleData.googleId,
            avatarUrl: googleData.avatarUrl || user.avatarUrl,
            lastLoginAt: new Date(),
          },
          include: { artist: true },
        });
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
      }
    } else {
      // Create new CLIENT user from Google data
      user = await prisma.user.create({
        data: {
          email: googleData.email,
          name: googleData.name,
          googleId: googleData.googleId,
          avatarUrl: googleData.avatarUrl,
          role: 'CLIENT',
        },
        include: { artist: true },
      });
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Account deactivated' },
        { status: 403 },
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
    console.error('Google auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Google authentication failed' },
      { status: 500 },
    );
  }
}
