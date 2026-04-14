import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySuperAdmin } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

const CONTENT_PREFIX = 'content_';

// GET /api/admin/content — Fetch all content settings
export async function GET(request: NextRequest) {
  try {
    await verifySuperAdmin(request);

    const settings = await prisma.setting.findMany({
      where: {
        settingKey: { startsWith: CONTENT_PREFIX },
      },
    });

    const content: Record<string, string> = {};
    for (const s of settings) {
      content[s.settingKey.replace(CONTENT_PREFIX, '')] = s.settingValue || '';
    }

    return NextResponse.json({ success: true, data: content });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}

// PUT /api/admin/content — Update content settings (bulk upsert)
export async function PUT(request: NextRequest) {
  try {
    const admin = await verifySuperAdmin(request);

    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid data' },
        { status: 400 },
      );
    }

    const entries = Object.entries(body) as [string, string][];
    const ops = entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { settingKey: `${CONTENT_PREFIX}${key}` },
        update: { settingValue: String(value) },
        create: { settingKey: `${CONTENT_PREFIX}${key}`, settingValue: String(value) },
      }),
    );

    await prisma.$transaction(ops);

    logAuditEvent({
      userId: Number(admin.sub),
      action: 'content.update',
      targetType: 'settings',
      details: { keys: entries.map(([k]) => k) },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}
