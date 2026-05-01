import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySuperAdmin } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/admin/users/[id] — Super Admin: activate/deactivate a user.
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await verifySuperAdmin(request);
    const { id } = await params;
    const userId = parseInt(id);

    if (Number.isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 },
      );
    }

    const body = await request.json();
    if (typeof body.isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isActive is required' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { artist: { select: { id: true } } },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 },
      );
    }

    if (user.role === 'SUPER_ADMIN' && (!body.isActive || user.id === Number(admin.sub))) {
      return NextResponse.json(
        { success: false, error: 'Super admin accounts cannot be deactivated here' },
        { status: 400 },
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { isActive: body.isActive },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          artist: { select: { id: true } },
        },
      });

      if (user.artist) {
        await tx.artist.update({
          where: { id: user.artist.id },
          data: { isActive: body.isActive },
        });
      }

      if (!body.isActive) {
        await tx.session.deleteMany({ where: { userId } });
      }

      return updatedUser;
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 },
    );
  }
}
