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
import QuickBookButton from '@/components/ui/QuickBookButton';
import PublicOnlyComponents from '@/components/layout/PublicOnlyComponents';
import PWAInstallBanner from '@/components/ui/PWAInstallBanner';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
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
  /** Only weights used in UI (normal + font-semibold); fewer files = faster FCP. */
  weight: ['400', '600'],
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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://insomniatattoo.ro';
  const canonical = locale === 'ro' ? '/' : '/en';

  return {
    title: {
      default: t('title'),
      template: '%s | Insomnia Tattoo',
    },
    description: t('description'),
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical,
      languages: {
        'ro-RO': '/',
        'en-US': '/en',
        'x-default': '/',
      },
    },
    openGraph: {
      type: 'website',
      siteName: 'Insomnia Tattoo',
      title: t('title'),
      description: t('description'),
      locale: locale === 'ro' ? 'ro_RO' : 'en_US',
      url: `${baseUrl}${canonical}`,
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
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0A0A0A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-bg-primary font-body text-text-primary antialiased">
        <JsonLd data={getLocalBusinessSchema()} />
        <Analytics />
        <ServiceWorkerRegistration />
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
          <ToastProvider>
            <PublicOnlyComponents>
              <CursorGlow />
            </PublicOnlyComponents>
            {children}
            <PublicOnlyComponents>
              <QuickBookButton />
              <CookieConsent />
              <PWAInstallBanner />
            </PublicOnlyComponents>
          </ToastProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
