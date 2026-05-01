import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

export async function createNotification(params: {
  userId: number;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link || null,
      },
    });
  } catch (error) {
    console.error('Create notification failed:', error);
    Sentry.captureException(error, {
      tags: { lib: 'notifications', op: 'createNotification' },
      extra: {
        userId: params.userId,
        type: params.type,
      },
    });
  }
}
