import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuthRequest } from '@/lib/auth';

// GET /api/client/loyalty — Authenticated: get own loyalty balance + transactions
export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAuthRequest(request);
    const userId = Number(payload.sub);

    const transactions = await prisma.loyaltyTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const totalEarned = transactions
      .filter((t) => t.points > 0)
      .reduce((sum, t) => sum + t.points, 0);

    const totalSpent = transactions
      .filter((t) => t.points < 0)
      .reduce((sum, t) => sum + t.points, 0);

    const balance = totalEarned + totalSpent;
    const valueRon = balance * 50;

    // Check surprise eligibility: count of 'earn' transactions
    // If divisible by 10 and no bonus granted for that milestone
    const earnCount = transactions.filter((t) => t.type === 'earn').length;
    const bonusCount = transactions.filter((t) => t.type === 'bonus').length;

    // Each 10th earn transaction qualifies for a bonus
    const expectedBonuses = Math.floor(earnCount / 10);
    const surpriseEligible = expectedBonuses > bonusCount;

    return NextResponse.json({
      success: true,
      data: {
        balance: {
          totalEarned,
          totalSpent: Math.abs(totalSpent),
          balance,
          valueRon,
        },
        surpriseEligible,
        transactions,
      },
    });
  } catch (error) {
    console.error('Client loyalty error:', error);
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}
