import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuthRequest } from '@/lib/auth';

// POST /api/push/subscribe — Subscribe to push notifications
export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuthRequest(request);
    const userId = Number(payload.sub);

    const body = await request.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { success: false, error: 'Invalid subscription data' },
        { status: 400 },
      );
    }

    // Upsert: if the endpoint already exists, update it
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      create: {
        userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}

// DELETE /api/push/subscribe — Unsubscribe from push notifications
export async function DELETE(request: NextRequest) {
  try {
    await verifyAuthRequest(request);

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: 'Endpoint required' },
        { status: 400 },
      );
    }

    await prisma.pushSubscription.deleteMany({
      where: { endpoint },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }
}
