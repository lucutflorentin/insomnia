'use client';

import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import SlideUp from '@/components/animations/SlideUp';
import type { HomeArtist } from '@/components/sections/HomePageClient';

interface ArtistCardsProps {
  artists: HomeArtist[];
  onArtistClick: (slug: string) => void;
  onQuickBook?: (slug: string) => void;
}

export default function ArtistCards({ artists, onArtistClick, onQuickBook }: ArtistCardsProps) {
  const t = useTranslations('home.artists');
  const locale = useLocale();

  return (
    <section id="artists" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SlideUp>
          <div className="text-center">
            <h2 className="font-heading text-3xl font-bold sm:text-4xl">
              {t('title')}
            </h2>
            <p className="mt-3 text-text-secondary">{t('subtitle')}</p>
            <div className="mx-auto mt-6 h-px w-16 bg-accent" />
          </div>
        </SlideUp>

        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {artists.map((artist, index) => {
            const specialty = locale === 'ro' ? artist.specialtyRo : artist.specialtyEn;
            const bio = locale === 'ro' ? artist.bioRo : artist.bioEn;

            return (
              <SlideUp key={artist.slug} delay={index * 0.2}>
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`${t('viewPortfolio')} — ${artist.name}`}
                  onClick={() => onArtistClick(artist.slug)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onArtistClick(artist.slug); } }}
                  className="group relative w-full overflow-hidden rounded-sm border border-border bg-bg-secondary text-left cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
                >
                  {/* Artist portrait or placeholder */}
                  <div className="relative aspect-[4/5] bg-gradient-to-b from-bg-tertiary to-bg-secondary overflow-hidden">
                    {artist.profileImage ? (
                      <Image
                        src={artist.profileImage}
                        alt={`${artist.name} — ${specialty || 'Tattoo Artist'}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        priority={index < 2}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="font-heading text-7xl text-border/40 transition-colors duration-300 group-hover:text-accent/20">
                          {artist.name[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/20 to-transparent" />

                  {/* Quick Book floating CTA — visible on mobile, fades in on desktop hover */}
                  {onQuickBook && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickBook(artist.slug);
                      }}
                      className="absolute right-4 top-4 z-10 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-bg-primary shadow-lg transition-all duration-300 hover:scale-105 hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/50 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                      aria-label={`${t('bookDirect')} — ${artist.name}`}
                    >
                      {t('bookDirect')}
                    </button>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                    <h3 className="font-heading text-2xl font-semibold sm:text-3xl">
                      {artist.name}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-accent">
                      {specialty}
                    </p>

                    {/* Rating */}
                    {artist.reviewCount > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 text-sm text-text-secondary">
                        <span className="text-accent">{'★'.repeat(Math.round(artist.averageRating))}</span>
                        <span>{artist.averageRating}</span>
                        <span className="text-text-muted">({artist.reviewCount})</span>
                      </div>
                    )}

                    <p className="mt-3 text-sm text-text-secondary line-clamp-2">
                      {bio}
                    </p>
                    <div className="mt-4">
                      <Button variant="secondary" size="sm" tabIndex={-1}>
                        {t('viewPortfolio')}
                      </Button>
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-accent transition-all duration-500 group-hover:w-full" />
                </div>
              </SlideUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}
