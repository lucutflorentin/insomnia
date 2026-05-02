import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifySuperAdmin, getAuthFailureHttpStatus } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/admin/artists/[id] — Super Admin: update artist profile
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await verifySuperAdmin(request);

    const { id } = await params;
    const body = await request.json();
    const artistId = parseInt(id);

    if (Number.isNaN(artistId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid artist ID' },
        { status: 400 },
      );
    }

    const existingArtist = await prisma.artist.findUnique({
      where: { id: artistId },
      include: { user: { select: { id: true, email: true } } },
    });

    if (!existingArtist) {
      return NextResponse.json(
        { success: false, error: 'Artist not found' },
        { status: 404 },
      );
    }

    if (body.email && body.email !== existingArtist.user.email) {
      const emailOwner = await prisma.user.findUnique({
        where: { email: body.email },
        select: { id: true },
      });
      if (emailOwner && emailOwner.id !== existingArtist.userId) {
        return NextResponse.json(
          { success: false, error: 'Email already in use' },
          { status: 409 },
        );
      }
    }

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

    const userData: Record<string, unknown> = {};
    if (body.name !== undefined) userData.name = body.name;
    if (body.email !== undefined) userData.email = body.email;
    if (typeof body.isActive === 'boolean') userData.isActive = body.isActive;
    if (typeof body.password === 'string' && body.password.length > 0) {
      if (body.password.length < 8 || body.password.length > 128) {
        return NextResponse.json(
          { success: false, error: 'Password must be between 8 and 128 characters' },
          { status: 400 },
        );
      }
      userData.passwordHash = await hashPassword(body.password);
    }

    const shouldRevokeSessions =
      body.email !== undefined ||
      userData.passwordHash !== undefined ||
      body.isActive === false;

    const artist = await prisma.$transaction(async (tx) => {
      const updatedArtist = await tx.artist.update({
        where: { id: artistId },
        data,
      });

      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: existingArtist.userId },
          data: userData,
        });
      }

      if (shouldRevokeSessions) {
        await tx.session.deleteMany({ where: { userId: existingArtist.userId } });
      }

      return updatedArtist;
    });

    return NextResponse.json({ success: true, data: artist });
  } catch (error) {
    console.error('Update artist error:', error);
    const authStatus = getAuthFailureHttpStatus(error);
    if (authStatus) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: authStatus },
      );
    }
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

    const artistId = parseInt(id);
    if (Number.isNaN(artistId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid artist ID' },
        { status: 400 },
      );
    }

    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
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
        where: { id: artistId },
        data: { isActive: false },
      }),
      prisma.user.update({
        where: { id: artist.userId },
        data: { isActive: false },
      }),
      prisma.session.deleteMany({
        where: { userId: artist.userId },
      }),
    ]);

    return NextResponse.json({ success: true, message: 'Artist deactivated' });
  } catch (error) {
    console.error('Delete artist error:', error);
    const authStatus = getAuthFailureHttpStatus(error);
    if (authStatus) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: authStatus },
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to deactivate artist' },
      { status: 500 },
    );
  }
}
