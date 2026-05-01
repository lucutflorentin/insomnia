import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies, extractRefreshToken, revokeRefreshSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await revokeRefreshSession(extractRefreshToken(request));
    await clearAuthCookies();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
