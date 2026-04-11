'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Button from '@/components/ui/Button';

export default function NotFound() {
  const t = useTranslations('common.notFound');

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <div className="text-center">
        <p className="font-heading text-8xl font-bold text-accent/30">404</p>
        <h1 className="mt-4 font-heading text-3xl font-bold sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-3 text-lg text-text-secondary">
          {t('description')}
        </p>
        <div className="mx-auto mt-6 h-px w-16 bg-accent/30" />
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/">
            <Button>{t('backHome')}</Button>
          </Link>
          <Link href="/booking">
            <Button variant="secondary">{t('bookConsultation')}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
