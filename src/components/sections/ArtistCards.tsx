'use client';

import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import SlideUp from '@/components/animations/SlideUp';
import type { HomeArtist } from '@/components/sections/HomePageClient';

interface ArtistCardsProps {
  artists: HomeArtist[];
  onArtistClick: (slug: string) => void;
}

export default function ArtistCards({ artists, onArtistClick }: ArtistCardsProps) {
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
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => onArtistClick(artist.slug)}
                  className="group relative w-full overflow-hidden rounded-sm border border-border bg-bg-secondary text-left cursor-pointer"
                >
                  {/* Artist portrait or placeholder */}
                  <div className="aspect-[4/5] bg-gradient-to-b from-bg-tertiary to-bg-secondary transition-transform duration-500 group-hover:scale-105">
                    {artist.profileImage ? (
                      <img
                        src={artist.profileImage}
                        alt={artist.name}
                        className="h-full w-full object-cover"
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
                </motion.button>
              </SlideUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}
