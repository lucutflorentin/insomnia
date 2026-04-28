'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { CalendarPlus } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { matchesPathSection } from '@/lib/routes';

export default function QuickBookButton() {
  const t = useTranslations('common.cta');
  const pathname = usePathname();
  const normalizedPath = pathname.replace(/^\/(ro|en)(?=\/|$)/, '') || '/';

  if (
    matchesPathSection(normalizedPath, '/booking') ||
    matchesPathSection(normalizedPath, '/admin') ||
    matchesPathSection(normalizedPath, '/artist')
  ) {
    return null;
  }

  return (
    <Link
      href="/booking"
      aria-label={t('bookingLong')}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-accent px-5 py-3 font-medium text-bg-primary shadow-lg shadow-accent/20 transition-all hover:scale-105 hover:shadow-xl hover:shadow-accent/30 active:scale-95"
    >
      <CalendarPlus className="h-5 w-5" aria-hidden="true" />
      <span className="hidden sm:inline">{t('booking')}</span>
    </Link>
  );
}
