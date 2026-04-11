'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Accordion from '@/components/ui/Accordion';
import Button from '@/components/ui/Button';
import SlideUp from '@/components/animations/SlideUp';

export default function GoodToKnowContent() {
  const t = useTranslations('faq');
  const tCommon = useTranslations('common');

  // Build FAQ items from translations
  const faqItems = Array.from({ length: 8 }, (_, i) => ({
    question: t(`items.${i}.question`),
    answer: t(`items.${i}.answer`),
  }));

  return (
    <div className="pt-24">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {/* Header */}
        <SlideUp>
          <div className="text-center">
            <h1 className="font-heading text-4xl font-bold sm:text-5xl">
              {t('title')}
            </h1>
            <p className="mt-3 text-lg text-text-secondary">{t('subtitle')}</p>
            <div className="mx-auto mt-6 h-px w-16 bg-accent" />
          </div>
        </SlideUp>

        {/* FAQ Accordion */}
        <SlideUp delay={0.2} className="mt-12">
          <Accordion items={faqItems} />
        </SlideUp>

        {/* Aftercare link */}
        <SlideUp delay={0.3} className="mt-12 text-center">
          <div className="rounded-sm border border-border bg-bg-secondary p-8">
            <h3 className="font-heading text-xl font-semibold">
              {t('aftercareCard.title')}
            </h3>
            <p className="mt-2 text-sm text-text-secondary">
              {t('aftercareCard.description')}
            </p>
            <div className="mt-4">
              <Link href="/aftercare">
                <Button variant="secondary" size="sm">
                  {t('aftercareCard.cta')}
                </Button>
              </Link>
            </div>
          </div>
        </SlideUp>

        {/* CTA */}
        <SlideUp delay={0.4} className="mt-12 text-center">
          <p className="text-text-secondary">
            {t('noAnswer')}
          </p>
          <div className="mt-4">
            <Link href="/booking">
              <Button>{tCommon('cta.bookingLong')}</Button>
            </Link>
          </div>
        </SlideUp>
      </div>
    </div>
  );
}
