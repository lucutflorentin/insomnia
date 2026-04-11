import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { getPageAlternates } from '@/lib/seo-utils';
import AboutContent from './AboutContent';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  let title = 'Despre Noi | Insomnia Tattoo';
  let description =
    'Descopera povestea studioului Insomnia Tattoo din Mamaia Nord, Constanta. Doi artisti, o viziune: tatuaje personalizate create cu pasiune.';

  try {
    const t = await getTranslations({ locale, namespace: 'metadata.about' });
    title = t('title');
    description = t('description');
  } catch {
    // Fallback to hardcoded values
  }

  return {
    title,
    description,
    alternates: getPageAlternates('/about', locale),
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <AboutContent locale={locale} />;
}
