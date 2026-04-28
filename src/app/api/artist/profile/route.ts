import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRole } from '@/lib/auth';
import { sanitizeText } from '@/lib/validations';

// GET /api/artist/profile — Artist: get own profile
export async function GET(request: NextRequest) {
  try {
    const payload = await verifyRole(request, ['ARTIST']);
    const artistId = payload.artistId;

    if (!artistId) {
      return NextResponse.json(
        { success: false, error: 'No artist profile linked' },
        { status: 403 },
      );
    }

    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      select: {
        id: true,
        name: true,
        slug: true,
        bioRo: true,
        bioEn: true,
        specialtyRo: true,
        specialtyEn: true,
        profileImage: true,
        instagramUrl: true,
        tiktokUrl: true,
        specialties: true,
      },
    });

    if (!artist) {
      return NextResponse.json(
        { success: false, error: 'Artist not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: artist });
  } catch (error) {
    console.error('Artist profile fetch error:', error);
    const message =
      error instanceof Error && error.message === 'Insufficient permissions'
        ? 'Unauthorized'
        : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

// PATCH /api/artist/profile — Artist: update own profile
export async function PATCH(request: NextRequest) {
  try {
    const payload = await verifyRole(request, ['ARTIST']);
    const artistId = payload.artistId;

    if (!artistId) {
      return NextResponse.json(
        { success: false, error: 'No artist profile linked' },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Only allow updating these fields
    const updateData: Record<string, string | null> = {};
    const allowedFields = [
      'bioRo',
      'bioEn',
      'specialtyRo',
      'specialtyEn',
      'instagramUrl',
      'tiktokUrl',
      'profileImage',
    ];

    for (const field of allowedFields) {
      if (field in body) {
        const value = body[field];
        updateData[field] = typeof value === 'string' && value.trim()
          ? sanitizeText(value.trim())
          : null;
      }
    }

    // Validate URL fields
    for (const urlField of ['instagramUrl', 'tiktokUrl', 'profileImage']) {
      if (updateData[urlField] && !updateData[urlField]!.startsWith('http')) {
        return NextResponse.json(
          { success: false, error: `Invalid URL for ${urlField}` },
          { status: 400 },
        );
      }
    }

    const artist = await prisma.artist.update({
      where: { id: artistId },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        bioRo: true,
        bioEn: true,
        specialtyRo: true,
        specialtyEn: true,
        profileImage: true,
        instagramUrl: true,
        tiktokUrl: true,
        specialties: true,
      },
    });

    return NextResponse.json({ success: true, data: artist });
  } catch (error) {
    console.error('Artist profile update error:', error);
    const message =
      error instanceof Error && error.message === 'Insufficient permissions'
        ? 'Unauthorized'
        : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
