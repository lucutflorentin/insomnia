'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import * as Sentry from '@sentry/nextjs';
import Button from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common.error');

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <div className="text-center">
        <p className="font-heading text-8xl font-bold text-accent/30">500</p>
        <h1 className="mt-4 font-heading text-3xl font-bold sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-3 text-lg text-text-secondary">
          {t('description')}
        </p>
        <div className="mx-auto mt-6 h-px w-16 bg-accent/30" />
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset}>{t('retry')}</Button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/">
            <Button variant="secondary">{t('home')}</Button>
          </a>
        </div>
      </div>
    </div>
  );
}
