import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import GoodToKnowContent from '@/components/features/faq/GoodToKnowContent';
import JsonLd, { getFaqSchema } from '@/components/seo/JsonLd';
import { getPageAlternates } from '@/lib/seo-utils';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata.faq' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: getPageAlternates('/good-to-know', locale),
  };
}

export default async function GoodToKnowPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'faq' });

  // Build FAQ items for JSON-LD
  const faqItems = [];
  for (let i = 0; i < 8; i++) {
    try {
      faqItems.push({
        question: t(`items.${i}.question`),
        answer: t(`items.${i}.answer`),
      });
    } catch {
      break;
    }
  }

  return (
    <>
      <JsonLd data={getFaqSchema(faqItems)} />
      <GoodToKnowContent />
    </>
  );
}
