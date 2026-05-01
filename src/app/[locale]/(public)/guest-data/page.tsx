import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getPageAlternates } from '@/lib/seo-utils';
import GuestDataClient from './GuestDataClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata.guestData' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: getPageAlternates('/guest-data', locale),
  };
}

export default async function GuestDataPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const sp = await searchParams;
  const raw = sp.token;
  const initialToken =
    typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : undefined;

  return (
    <div className="min-h-screen bg-bg-primary pt-24">
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center px-4 text-text-muted">
            …
          </div>
        }
      >
        <GuestDataClient initialToken={initialToken} />
      </Suspense>
    </div>
  );
}
