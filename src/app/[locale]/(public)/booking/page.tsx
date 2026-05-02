import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import BookingWizard from '@/components/features/booking/BookingWizard';
import { getPageAlternates } from '@/lib/seo-utils';

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
    alternates: getPageAlternates('/booking', locale),
  };
}

export default function BookingPage() {
  return (
    <div className="pt-24">
      <BookingWizard />
    </div>
  );
}
