'use client';

import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import SlideUp from '@/components/animations/SlideUp';

interface CTABannerProps {
  onBookingClick: () => void;
}

export default function CTABanner({ onBookingClick }: CTABannerProps) {
  const t = useTranslations('home.cta');

  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-accent/10 to-accent/5" />
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <SlideUp>
          <h2 className="font-heading text-3xl font-bold sm:text-4xl lg:text-5xl">
            {t('title')}
          </h2>
          <p className="mt-4 text-lg text-text-secondary">{t('subtitle')}</p>
          <div className="mt-8">
            <Button size="lg" onClick={onBookingClick}>
              {t('button')}
            </Button>
          </div>
        </SlideUp>
      </div>
    </section>
  );
}
