import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySuperAdmin } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/admin/artists/[id] — Super Admin: update artist profile
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await verifySuperAdmin(request);

    const { id } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.bioRo !== undefined) data.bioRo = body.bioRo;
    if (body.bioEn !== undefined) data.bioEn = body.bioEn;
    if (body.specialtyRo !== undefined) data.specialtyRo = body.specialtyRo;
    if (body.specialtyEn !== undefined) data.specialtyEn = body.specialtyEn;
    if (body.specialties !== undefined) data.specialties = body.specialties;
    if (body.profileImage !== undefined) data.profileImage = body.profileImage;
    if (body.instagramUrl !== undefined) data.instagramUrl = body.instagramUrl;
    if (body.tiktokUrl !== undefined) data.tiktokUrl = body.tiktokUrl;
    if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;
    if (typeof body.isActive === 'boolean') data.isActive = body.isActive;

    const artist = await prisma.artist.update({
      where: { id: parseInt(id) },
      data,
    });

    // If reactivating, also reactivate the user
    if (body.isActive === true && artist.userId) {
      await prisma.user.update({
        where: { id: artist.userId },
        data: { isActive: true },
      });
    }

    return NextResponse.json({ success: true, data: artist });
  } catch (error) {
    console.error('Update artist error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update artist' },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/artists/[id] — Super Admin: deactivate artist (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await verifySuperAdmin(request);

    const { id } = await params;

    const artist = await prisma.artist.findUnique({
      where: { id: parseInt(id) },
      select: { userId: true },
    });

    if (!artist) {
      return NextResponse.json(
        { success: false, error: 'Artist not found' },
        { status: 404 },
      );
    }

    // Soft delete: deactivate both artist and user
    await prisma.$transaction([
      prisma.artist.update({
        where: { id: parseInt(id) },
        data: { isActive: false },
      }),
      prisma.user.update({
        where: { id: artist.userId },
        data: { isActive: false },
      }),
    ]);

    return NextResponse.json({ success: true, message: 'Artist deactivated' });
  } catch (error) {
    console.error('Delete artist error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to deactivate artist' },
      { status: 500 },
    );
  }
}
