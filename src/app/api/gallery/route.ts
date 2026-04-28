import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminRequest, getCurrentUser } from '@/lib/auth';
import { galleryItemSchema } from '@/lib/validations';
import { checkRateLimit, getClientIp, PUBLIC_READ_LIMIT } from '@/lib/rate-limit';

// GET /api/gallery — List gallery items (admin sees all, public sees visible only)
export async function GET(request: NextRequest) {
  try {
    // Rate limit public reads
    const ip = getClientIp(request);
    const rl = checkRateLimit(`gallery-read:${ip}`, PUBLIC_READ_LIMIT);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
      );
    }

    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get('artistId');
    const artistSlug = searchParams.get('artist');
    const style = searchParams.get('style');
    const featured = searchParams.get('featured');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '30')));

    // Check if request is from admin
    const user = await getCurrentUser(request);
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    const isArtist = user?.role === 'ARTIST' && typeof user.artistId === 'number';

    const where: Record<string, unknown> = {};

    let requestedArtistId: number | undefined;
    if (artistId) {
      requestedArtistId = parseInt(artistId);
    } else if (artistSlug) {
      const artist = await prisma.artist.findUnique({
        where: { slug: artistSlug },
        select: { id: true },
      });
      requestedArtistId = artist?.id ?? -1;
    }

    if (isSuperAdmin) {
      if (requestedArtistId !== undefined) where.artistId = requestedArtistId;
    } else if (isArtist) {
      if (requestedArtistId === undefined || requestedArtistId === user.artistId) {
        where.artistId = user.artistId;
      } else {
        where.artistId = requestedArtistId;
        where.isVisible = true;
      }
    } else {
      if (requestedArtistId !== undefined) where.artistId = requestedArtistId;
      where.isVisible = true;
    }

    if (style) where.style = style;
    if (featured === 'true') where.isFeatured = true;

    const [items, total] = await Promise.all([
      prisma.galleryItem.findMany({
        where,
        include: {
          artist: { select: { id: true, name: true, slug: true } },
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.galleryItem.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Gallery fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// POST /api/gallery — Admin: create gallery item
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminRequest(request);

    const body = await request.json();
    const normalized = {
      ...body,
      artistId: body.artistId ?? admin.artistId,
      imagePath: body.imagePath ?? body.imageUrl,
      thumbnailPath: body.thumbnailPath ?? body.thumbnailUrl,
    };
    const parsed = galleryItemSchema.safeParse(normalized);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    if (!parsed.data.artistId) {
      return NextResponse.json(
        { success: false, error: 'artistId is required' },
        { status: 400 },
      );
    }

    if (admin.role === 'ARTIST' && admin.artistId !== parsed.data.artistId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 },
      );
    }

    const item = await prisma.galleryItem.create({
      data: parsed.data,
      include: {
        artist: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}
