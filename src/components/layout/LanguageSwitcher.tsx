'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = (newLocale: 'ro' | 'en') => {
    router.replace(pathname as '/', { locale: newLocale });
  };

  return (
    <div className="flex items-center rounded-sm border border-border text-sm">
      <button
        onClick={() => switchLocale('ro')}
        className={cn(
          'px-2.5 py-1.5 transition-colors',
          locale === 'ro'
            ? 'bg-accent/10 text-accent font-medium'
            : 'text-text-muted hover:text-text-secondary',
        )}
      >
        RO
      </button>
      <div className="h-5 w-px bg-border" />
      <button
        onClick={() => switchLocale('en')}
        className={cn(
          'px-2.5 py-1.5 transition-colors',
          locale === 'en'
            ? 'bg-accent/10 text-accent font-medium'
            : 'text-text-muted hover:text-text-secondary',
        )}
      >
        EN
      </button>
    </div>
  );
}
