import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import AftercareContent from '@/components/features/aftercare/AftercareContent';
import { getPageAlternates } from '@/lib/seo-utils';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata.aftercare' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: getPageAlternates('/aftercare', locale),
  };
}

export default function AftercarePage() {
  return <AftercareContent />;
}
