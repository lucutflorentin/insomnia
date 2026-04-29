import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRole } from '@/lib/auth';
import { sanitizeText } from '@/lib/validations';

const TEXT_FIELDS = ['bioRo', 'bioEn', 'specialtyRo', 'specialtyEn'] as const;
const URL_FIELDS = ['instagramUrl', 'tiktokUrl'] as const;

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isRootRelativeUrl(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//');
}

// GET /api/artist/profile — Artist: get own profile
export async function GET(request: NextRequest) {
  try {
    const authPayload = await verifyRole(request, ['ARTIST']);
    const artistId = authPayload.artistId;

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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 },
      );
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: 'Invalid profile data' },
        { status: 400 },
      );
    }

    const profilePayload = body as Record<string, unknown>;

    // Only allow updating these fields
    const updateData: Record<string, string | null> = {};

    for (const field of TEXT_FIELDS) {
      if (field in profilePayload) {
        const value = profilePayload[field];
        if (value !== null && typeof value !== 'string') {
          return NextResponse.json(
            { success: false, error: `Invalid value for ${field}` },
            { status: 400 },
          );
        }
        updateData[field] = typeof value === 'string' && value.trim()
          ? sanitizeText(value.trim())
          : null;
      }
    }

    for (const field of URL_FIELDS) {
      if (field in profilePayload) {
        const value = profilePayload[field];
        if (value !== null && typeof value !== 'string') {
          return NextResponse.json(
            { success: false, error: `Invalid value for ${field}` },
            { status: 400 },
          );
        }
        const normalized = typeof value === 'string' ? value.trim() : '';
        if (!normalized) {
          updateData[field] = null;
        } else if (isHttpUrl(normalized)) {
          updateData[field] = normalized;
        } else {
          return NextResponse.json(
            { success: false, error: `Invalid URL for ${field}` },
            { status: 400 },
          );
        }
      }
    }

    if ('profileImage' in profilePayload) {
      const value = profilePayload.profileImage;
      if (value !== null && typeof value !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Invalid value for profileImage' },
          { status: 400 },
        );
      }
      const normalized = typeof value === 'string' ? value.trim() : '';
      if (!normalized) {
        updateData.profileImage = null;
      } else if (isHttpUrl(normalized) || isRootRelativeUrl(normalized)) {
        updateData.profileImage = normalized;
      } else {
        return NextResponse.json(
          { success: false, error: 'Invalid URL for profileImage' },
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
