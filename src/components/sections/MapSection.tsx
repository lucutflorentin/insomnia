'use client';

import { useTranslations } from 'next-intl';
import SlideUp from '@/components/animations/SlideUp';
import { SITE_CONFIG } from '@/lib/constants';

export default function MapSection() {
  const t = useTranslations('home.location');

  return (
    <section className="bg-bg-secondary py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SlideUp>
          <div className="text-center">
            <h2 className="font-heading text-3xl font-bold sm:text-4xl">
              {t('title')}
            </h2>
            <div className="mx-auto mt-6 h-px w-16 bg-accent" />
          </div>
        </SlideUp>

        <div className="mt-16 grid gap-8 lg:grid-cols-5">
          {/* Map */}
          <SlideUp className="lg:col-span-3">
            <div className="aspect-video overflow-hidden rounded-sm border border-border bg-bg-tertiary">
              {SITE_CONFIG.googleMapsUrl ? (
                <iframe
                  src={SITE_CONFIG.googleMapsUrl}
                  className="h-full w-full"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Insomnia Tattoo Location"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-text-muted">
                  <div className="text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-border"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                      />
                    </svg>
                    <p className="mt-2 text-sm">Google Maps</p>
                  </div>
                </div>
              )}
            </div>
          </SlideUp>

          {/* Info */}
          <SlideUp delay={0.2} className="lg:col-span-2">
            <div className="flex h-full flex-col justify-center space-y-6">
              {/* Address */}
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-accent/10">
                    <svg
                      className="h-5 w-5 text-accent"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-text-primary">{t('address')}</p>
                </div>
              </div>

              {/* Schedule */}
              <div>
                <h3 className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-accent/10">
                    <svg
                      className="h-5 w-5 text-accent"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <span className="font-medium text-text-primary">
                    {t('schedule')}
                  </span>
                </h3>
                <div className="ml-[52px] space-y-1 text-sm text-text-secondary">
                  <p>{t('weekdays')}</p>
                  <p>{t('saturday')}</p>
                  <p>{t('sunday')}</p>
                </div>
              </div>
            </div>
          </SlideUp>
        </div>
      </div>
    </section>
  );
}
