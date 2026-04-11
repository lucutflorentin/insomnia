import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { Playfair_Display, Inter, Cormorant_Garamond } from 'next/font/google';
import { routing } from '@/i18n/routing';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/contexts/AuthContext';
import JsonLd, { getLocalBusinessSchema } from '@/components/seo/JsonLd';
import Analytics from '@/components/seo/Analytics';
import CookieConsent from '@/components/ui/CookieConsent';
import CursorGlow from '@/components/effects/CursorGlow';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import PublicOnlyComponents from '@/components/layout/PublicOnlyComponents';
import '@/app/globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-accent',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata.home' });

  return {
    title: {
      default: t('title'),
      template: '%s | Insomnia Tattoo',
    },
    description: t('description'),
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL || 'https://insomniatattoo.ro',
    ),
    alternates: {
      canonical: '/',
      languages: {
        'ro-RO': '/',
        'en-US': '/en',
      },
    },
    openGraph: {
      type: 'website',
      siteName: 'Insomnia Tattoo',
      title: t('title'),
      description: t('description'),
      locale: locale === 'ro' ? 'ro_RO' : 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${playfair.variable} ${inter.variable} ${cormorant.variable}`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0A0A0A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-bg-primary font-body text-text-primary antialiased">
        <JsonLd data={getLocalBusinessSchema()} />
        <Analytics />
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
          <ToastProvider>
            <PublicOnlyComponents>
              <CursorGlow />
            </PublicOnlyComponents>
            {children}
            <PublicOnlyComponents>
              <WhatsAppButton />
              <CookieConsent />
            </PublicOnlyComponents>
          </ToastProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
