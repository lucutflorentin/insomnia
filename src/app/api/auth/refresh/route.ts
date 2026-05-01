import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  REFRESH_TOKEN_MAX_AGE_SEC,
  extractRefreshToken,
  hashRefreshTokenValue,
  verifyRefreshToken,
  signToken,
  signRefreshToken,
} from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = extractRefreshToken(request);
    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'No refresh token' },
        { status: 401 },
      );
    }

    const payload = await verifyRefreshToken(refreshToken);
    const refreshTokenHash = hashRefreshTokenValue(refreshToken);

    const session = await prisma.session.findUnique({
      where: { refreshToken: refreshTokenHash },
      include: {
        user: {
          include: {
            artist: true,
          },
        },
      },
    });

    if (
      !session ||
      session.expiresAt < new Date() ||
      !session.user.isActive ||
      session.user.id !== Number(payload.sub) ||
      (session.user.role === 'ARTIST' && (!session.user.artist || !session.user.artist.isActive))
    ) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
      }
      return NextResponse.json(
        { success: false, error: 'Invalid refresh token' },
        { status: 401 },
      );
    }

    const tokenPayload = {
      sub: session.user.id.toString(),
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      ...(session.user.artist ? { artistId: session.user.artist.id } : {}),
    };

    const newAccessToken = await signToken(tokenPayload);
    // Rotate: issue a fresh refresh token on every refresh
    const newRefreshToken = await signRefreshToken(tokenPayload);
    const userAgent = request.headers.get('user-agent')?.slice(0, 500) || null;

    await prisma.$transaction([
      prisma.session.delete({ where: { id: session.id } }),
      prisma.session.create({
        data: {
          userId: session.user.id,
          refreshToken: hashRefreshTokenValue(newRefreshToken),
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_SEC * 1000),
          userAgent,
        },
      }),
    ]);

    const cookieStore = await cookies();
    cookieStore.set('insomnia_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60,
    });
    cookieStore.set('insomnia_refresh', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: REFRESH_TOKEN_MAX_AGE_SEC,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid refresh token' },
      { status: 401 },
    );
  }
}
