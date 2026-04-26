import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contact@insomniatattoo.ro';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushAction {
  action: string;
  title: string;
  icon?: string;
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  /** Optional bookingId — used by SW action handlers (e.g. confirm) */
  bookingId?: number;
  /** Web Push action buttons (max 2 supported on most platforms) */
  actions?: PushAction[];
}

/**
 * Send a push notification to a specific user (all their subscriptions).
 * Fire-and-forget — never throws.
 */
export async function sendPushToUser(userId: number, payload: PushPayload): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/icon-72x72.png',
      url: payload.url || '/',
      bookingId: payload.bookingId,
      data: { url: payload.url || '/', bookingId: payload.bookingId },
      tag: payload.tag,
      actions: payload.actions,
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          pushPayload,
        ),
      ),
    );

    // Clean up expired/invalid subscriptions (410 Gone or 404)
    const expiredIds: number[] = [];
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        const statusCode = (result.reason as { statusCode?: number })?.statusCode;
        if (statusCode === 410 || statusCode === 404) {
          expiredIds.push(subscriptions[i].id);
        }
      }
    });

    if (expiredIds.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { id: { in: expiredIds } },
      });
    }
  } catch {
    // Fire-and-forget
  }
}

/**
 * Send a push notification to all users with a specific role.
 */
export async function sendPushToRole(role: 'SUPER_ADMIN' | 'ARTIST' | 'CLIENT', payload: PushPayload): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

  try {
    const users = await prisma.user.findMany({
      where: { role, isActive: true },
      select: { id: true },
    });

    await Promise.allSettled(
      users.map((u) => sendPushToUser(u.id, payload)),
    );
  } catch {
    // Fire-and-forget
  }
}
