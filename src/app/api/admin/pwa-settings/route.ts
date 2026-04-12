import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRole } from '@/lib/auth';

const PWA_KEYS = [
  'pwa_name',
  'pwa_short_name',
  'pwa_description',
  'pwa_theme_color',
  'pwa_background_color',
  'pwa_display',
  'pwa_start_url',
  'pwa_icon_192',
  'pwa_icon_512',
];

// GET /api/admin/pwa-settings
export async function GET(request: NextRequest) {
  try {
    await verifyRole(request, ['SUPER_ADMIN']);

    const rows = await prisma.setting.findMany({
      where: { settingKey: { in: PWA_KEYS } },
    });

    const data: Record<string, string | null> = {};
    for (const row of rows) {
      data[row.settingKey] = row.settingValue;
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}

// PUT /api/admin/pwa-settings
export async function PUT(request: NextRequest) {
  try {
    await verifyRole(request, ['SUPER_ADMIN']);

    const body = await request.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid data' },
        { status: 400 },
      );
    }

    const entries = Object.entries(body) as [string, string][];

    const invalidKeys = entries
      .map(([key]) => key)
      .filter((key) => !PWA_KEYS.includes(key));

    if (invalidKeys.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid settings: ${invalidKeys.join(', ')}` },
        { status: 400 },
      );
    }

    for (const [key, value] of entries) {
      if (typeof value !== 'string' || value.length > 500) {
        return NextResponse.json(
          { success: false, error: `Invalid value for ${key}` },
          { status: 400 },
        );
      }
    }

    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.setting.upsert({
          where: { settingKey: key },
          create: { settingKey: key, settingValue: value },
          update: { settingValue: value },
        }),
      ),
    );

    return NextResponse.json({
      success: true,
      message: 'PWA settings updated successfully.',
    });
  } catch (error) {
    console.error('PWA settings update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update PWA settings' },
      { status: 500 },
    );
  }
}
