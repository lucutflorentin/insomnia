import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { getPageAlternates } from '@/lib/seo-utils';
import { SITE_CONFIG, SOCIAL_LINKS } from '@/lib/constants';
import ContactContent from './ContactContent';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  let title = 'Contact | Insomnia Tattoo';
  let description =
    'Contacteaza studioul Insomnia Tattoo din Mamaia Nord, Constanta. Program, adresa, email si linkuri sociale.';

  try {
    const t = await getTranslations({ locale, namespace: 'metadata.contact' });
    title = t('title');
    description = t('description');
  } catch {
    // Fallback to hardcoded values
  }

  return {
    title,
    description,
    alternates: getPageAlternates('/contact', locale),
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <ContactContent
      locale={locale}
      siteConfig={{
        email: SITE_CONFIG.email,
        phone: SITE_CONFIG.phone,
        address: SITE_CONFIG.address,
        googleMapsUrl: SITE_CONFIG.googleMapsUrl,
      }}
      socialLinks={{
        instagram: SOCIAL_LINKS.instagram,
        tiktok: SOCIAL_LINKS.tiktok,
        facebook: SOCIAL_LINKS.facebook,
      }}
    />
  );
}
