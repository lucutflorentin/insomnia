import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import BookingWizard from '@/components/features/booking/BookingWizard';

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

export default function BookingPage() {
  return (
    <div className="pt-24">
      <BookingWizard />
    </div>
  );
}
