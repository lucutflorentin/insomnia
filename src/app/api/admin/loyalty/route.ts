import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySuperAdmin } from '@/lib/auth';

// GET /api/admin/loyalty — Super Admin: search clients and view loyalty
export async function GET(request: NextRequest) {
  try {
    await verifySuperAdmin(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const listAll = searchParams.get('all');

    // If "all" param is set, return all clients with loyalty balances (no search required)
    // Otherwise, require search with at least 2 characters
    if (!listAll && (!search || search.trim().length < 2)) {
      return NextResponse.json(
        { success: false, error: 'Search query must be at least 2 characters' },
        { status: 400 },
      );
    }

    const whereClause = listAll
      ? { role: 'CLIENT' as const }
      : {
          role: 'CLIENT' as const,
          OR: [
            { name: { contains: search! } },
            { email: { contains: search! } },
          ],
        };

    const clients = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
        loyaltyTransactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
      take: listAll ? 500 : 20,
    });

    const data = clients.map((client) => {
      const balance = client.loyaltyTransactions.reduce(
        (sum, t) => sum + t.points,
        0,
      );

      return {
        user: {
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          avatarUrl: client.avatarUrl,
          createdAt: client.createdAt,
        },
        loyalty: {
          balance,
          transactionCount: client.loyaltyTransactions.length,
        },
        transactions: client.loyaltyTransactions,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Admin loyalty search error:', error);
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}

// POST /api/admin/loyalty — Super Admin: manual loyalty action
export async function POST(request: NextRequest) {
  try {
    const admin = await verifySuperAdmin(request);

    const body = await request.json();
    const { userId, type, points, description } = body;

    // Validate required fields
    if (!userId || !type || points === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, type, points' },
        { status: 400 },
      );
    }

    // Validate type
    const validTypes = ['redeem', 'bonus', 'adjust'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 },
      );
    }

    // Validate points is a number
    if (typeof points !== 'number' || !Number.isInteger(points) || points === 0) {
      return NextResponse.json(
        { success: false, error: 'Points must be a non-zero integer' },
        { status: 400 },
      );
    }

    // Verify user exists and is CLIENT
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 },
      );
    }

    if (user.role !== 'CLIENT') {
      return NextResponse.json(
        { success: false, error: 'Loyalty transactions can only be created for CLIENT users' },
        { status: 400 },
      );
    }

    // For redeem: points must be negative and user must have enough balance
    if (type === 'redeem') {
      if (points > 0) {
        return NextResponse.json(
          { success: false, error: 'Redeem points must be negative' },
          { status: 400 },
        );
      }

      const balanceResult = await prisma.loyaltyTransaction.aggregate({
        where: { userId },
        _sum: { points: true },
      });

      const currentBalance = balanceResult._sum.points || 0;

      if (currentBalance < Math.abs(points)) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient balance. Current: ${currentBalance}, requested: ${Math.abs(points)}`,
          },
          { status: 400 },
        );
      }
    }

    const transaction = await prisma.loyaltyTransaction.create({
      data: {
        userId,
        type,
        points,
        description: description || null,
        createdBy: Number(admin.sub),
      },
    });

    return NextResponse.json(
      { success: true, data: transaction },
      { status: 201 },
    );
  } catch (error) {
    console.error('Admin loyalty action error:', error);
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}
