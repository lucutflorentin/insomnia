import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuthRequest, comparePassword, hashPassword } from '@/lib/auth';

// GET /api/client/profile — Authenticated: get own profile
export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAuthRequest(request);
    const userId = Number(payload.sub);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        phone: true,
        avatarUrl: true,
        googleId: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}

// PUT /api/client/profile — Authenticated: update own profile (or change password)
export async function PUT(request: NextRequest) {
  try {
    const payload = await verifyAuthRequest(request);
    const userId = Number(payload.sub);

    const body = await request.json();

    // --- Password change flow ---
    if (body.currentPassword && body.newPassword) {
      if (typeof body.newPassword !== 'string' || body.newPassword.length < 8) {
        return NextResponse.json(
          { success: false, error: 'New password must be at least 8 characters' },
          { status: 400 },
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
      });

      if (!user?.passwordHash) {
        return NextResponse.json(
          { success: false, error: 'Password change not available for Google-only accounts' },
          { status: 400 },
        );
      }

      const validCurrent = await comparePassword(body.currentPassword, user.passwordHash);
      if (!validCurrent) {
        return NextResponse.json(
          { success: false, error: 'Current password is incorrect' },
          { status: 401 },
        );
      }

      const newHash = await hashPassword(body.newPassword);
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      });

      return NextResponse.json({ success: true, message: 'Password updated' });
    }

    // --- Profile update flow ---
    const data: Record<string, unknown> = {};
    if (typeof body.name === 'string' && body.name.trim().length >= 2) {
      data.name = body.name.trim();
    }
    if (typeof body.phone === 'string') {
      data.phone = body.phone.trim() || null;
    }
    if (typeof body.avatarUrl === 'string') {
      data.avatarUrl = body.avatarUrl.trim() || null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 },
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        phone: true,
        avatarUrl: true,
        googleId: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}
