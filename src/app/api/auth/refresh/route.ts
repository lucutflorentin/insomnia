import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, signToken, signRefreshToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json(
        { success: false, error: 'No refresh token' },
        { status: 401 },
      );
    }

    const refreshMatch = cookieHeader.match(/insomnia_refresh=([^;]+)/);
    if (!refreshMatch) {
      return NextResponse.json(
        { success: false, error: 'No refresh token' },
        { status: 401 },
      );
    }

    const payload = await verifyRefreshToken(refreshMatch[1]);

    const tokenPayload = {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      ...(payload.artistId ? { artistId: payload.artistId } : {}),
    };

    const newAccessToken = await signToken(tokenPayload);
    // Rotate: issue a fresh refresh token on every refresh
    const newRefreshToken = await signRefreshToken(tokenPayload);

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
      maxAge: 7 * 24 * 60 * 60,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid refresh token' },
      { status: 401 },
    );
  }
}
