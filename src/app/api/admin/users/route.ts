import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySuperAdmin } from '@/lib/auth';

// GET /api/admin/users — Super Admin: list all users with stats
export async function GET(request: NextRequest) {
  try {
    await verifySuperAdmin(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'));

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    if (role && ['CLIENT', 'ARTIST', 'SUPER_ADMIN'].includes(role)) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          emailVerifiedAt: true,
          lastLoginAt: true,
          createdAt: true,
          _count: {
            select: {
              bookings: true,
              reviews: true,
              loyaltyTransactions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin users fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}
