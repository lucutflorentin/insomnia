import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuthRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAuthRequest(request);

    const user = await prisma.user.findUnique({
      where: { id: Number(payload.sub) },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatarUrl: true,
        googleId: true,
        createdAt: true,
        artist: {
          select: {
            id: true,
            slug: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        hasGoogleLinked: !!user.googleId,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Not authenticated' },
      { status: 401 },
    );
  }
}
