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
    const isAdmin = user && (user.role === 'SUPER_ADMIN' || user.role === 'ARTIST');

    const where: Record<string, unknown> = {};

    // Public users only see visible items
    if (!isAdmin) {
      where.isVisible = true;
    }

    // Filter by artistId (integer) or artist slug
    if (artistId) {
      where.artistId = parseInt(artistId);
    } else if (artistSlug) {
      const artist = await prisma.artist.findUnique({ where: { slug: artistSlug } });
      if (artist) {
        where.artistId = artist.id;
      }
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
    await verifyAdminRequest(request);

    const body = await request.json();
    const parsed = galleryItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
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
