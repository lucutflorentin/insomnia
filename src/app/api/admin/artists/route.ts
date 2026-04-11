import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySuperAdmin, hashPassword } from '@/lib/auth';
import { slugify } from '@/lib/utils';

// GET /api/admin/artists — Super Admin: list all artists (including inactive)
export async function GET(request: NextRequest) {
  try {
    await verifySuperAdmin(request);

    const artists = await prisma.artist.findMany({
      include: {
        user: { select: { id: true, email: true, role: true, isActive: true, lastLoginAt: true } },
        _count: { select: { bookings: true, gallery: true, reviews: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ success: true, data: artists });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}

// POST /api/admin/artists — Super Admin: create new artist
export async function POST(request: NextRequest) {
  try {
    await verifySuperAdmin(request);

    const body = await request.json();
    const {
      name, email, password, bioRo, bioEn, specialtyRo, specialtyEn,
      specialties, profileImage, instagramUrl, tiktokUrl,
    } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 },
      );
    }

    // Check email uniqueness
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Email already in use' },
        { status: 409 },
      );
    }

    // Generate slug and password
    const slug = slugify(name);
    const existingSlug = await prisma.artist.findUnique({ where: { slug } });
    const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

    const generatedPassword = password || Math.random().toString(36).slice(2, 10);
    const passwordHash = await hashPassword(generatedPassword);

    // Create User + Artist + Availability Templates in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: 'ARTIST',
          name,
        },
      });

      const artist = await tx.artist.create({
        data: {
          userId: user.id,
          name,
          slug: finalSlug,
          bioRo: bioRo || null,
          bioEn: bioEn || null,
          specialtyRo: specialtyRo || null,
          specialtyEn: specialtyEn || null,
          specialties: specialties || [],
          profileImage: profileImage || null,
          instagramUrl: instagramUrl || null,
          tiktokUrl: tiktokUrl || null,
          sortOrder: 99, // will be at end, admin can reorder
        },
      });

      // Create default availability templates (Mon-Fri 10-18, Sat 10-16, Sun off)
      for (let day = 1; day <= 6; day++) {
        const isSaturday = day === 6;
        await tx.availabilityTemplate.create({
          data: {
            artistId: artist.id,
            dayOfWeek: day,
            startTime: '10:00',
            endTime: isSaturday ? '16:00' : '18:00',
            isActive: true,
          },
        });
      }
      await tx.availabilityTemplate.create({
        data: {
          artistId: artist.id,
          dayOfWeek: 0,
          startTime: '10:00',
          endTime: '18:00',
          isActive: false,
        },
      });

      return { user, artist };
    });

    return NextResponse.json({
      success: true,
      data: {
        artist: result.artist,
        credentials: {
          email,
          password: generatedPassword,
        },
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Create artist error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
