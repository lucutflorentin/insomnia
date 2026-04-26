import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import BookingWizard from '@/components/features/booking/BookingWizard';
import Breadcrumbs from '@/components/layout/Breadcrumbs';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata.booking' });
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common.nav' });
  return (
    <div className="pt-24">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <Breadcrumbs
          items={[
            { label: t('home'), href: '/' },
            { label: t('booking') },
          ]}
        />
      </div>
      <BookingWizard />
    </div>
  );
}
