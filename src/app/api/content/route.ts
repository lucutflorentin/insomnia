import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CONTENT_PREFIX, isContentKey } from '@/lib/content';

// GET /api/content?keys=hero_title_ro,hero_subtitle_ro — Public: read content settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keysParam = searchParams.get('keys');

    if (!keysParam) {
      return NextResponse.json(
        { success: false, error: 'keys parameter required' },
        { status: 400 },
      );
    }

    const keys = keysParam.split(',').map((k) => k.trim()).filter(Boolean);
    if (keys.length === 0 || keys.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Invalid keys' },
        { status: 400 },
      );
    }

    const invalidKeys = keys.filter((key) => !isContentKey(key));
    if (invalidKeys.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid keys' },
        { status: 400 },
      );
    }

    const settings = await prisma.setting.findMany({
      where: {
        settingKey: { in: keys.map((k) => `${CONTENT_PREFIX}${k}`) },
      },
    });

    const content: Record<string, string> = {};
    for (const s of settings) {
      content[s.settingKey.replace(CONTENT_PREFIX, '')] = s.settingValue || '';
    }

    return NextResponse.json({
      success: true,
      data: content,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
