'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import FavoriteHeart from '@/components/ui/FavoriteHeart';
import SlideUp from '@/components/animations/SlideUp';
import StaggerChildren, { StaggerItem } from '@/components/animations/StaggerChildren';
import { cn } from '@/lib/utils';

// Fallback placeholder data
const defaultArtistSections = [
  {
    slug: 'madalina',
    name: 'Madalina',
    specialty: 'Realism & Portrete',
    filters: ['all', 'portraits', 'color', 'black_grey', 'nature'],
    works: Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      style: ['portraits', 'color', 'black_grey', 'nature'][i % 4],
      imagePath: '',
      thumbnailPath: '',
      aspectRatio: [1, 1.3, 0.85, 1.15, 1, 1.25, 0.9, 1.4, 1, 1.2, 0.95, 1.1][i],
    })),
  },
  {
    slug: 'florentin',
    name: 'Florentin',
    specialty: 'Graphic & Line Work',
    filters: ['all', 'graphic', 'linework', 'geometric', 'minimalist'],
    works: Array.from({ length: 12 }, (_, i) => ({
      id: i + 101,
      style: ['graphic', 'linework', 'geometric', 'minimalist'][i % 4],
      imagePath: '',
      thumbnailPath: '',
      aspectRatio: [1.1, 0.9, 1.2, 1, 1.35, 0.85, 1, 1.15, 0.95, 1.25, 1, 1.3][i],
    })),
  },
];

export interface ArtistSection {
  slug: string;
  name: string;
  specialty: string;
  filters: string[];
  works: Array<{
    id: number;
    style: string;
    imagePath: string;
    thumbnailPath: string;
    titleRo?: string | null;
    titleEn?: string | null;
    aspectRatio: number;
  }>;
}

function ArtistPortfolioSection({
  artist,
  favoriteIds,
}: {
  artist: ArtistSection;
  favoriteIds: Set<number>;
}) {
  const t = useTranslations('inkSpace');
  const tStyles = useTranslations('artists.styles');

  return (
    <section id={artist.slug} className="scroll-mt-24">
      {/* Artist header */}
      <SlideUp>
        <div className="flex items-center gap-4 mb-6">
          {/* Mini portrait placeholder */}
          <div className="h-16 w-16 shrink-0 rounded-full bg-bg-secondary border border-border flex items-center justify-center">
            <span className="font-heading text-2xl text-accent/50">{artist.name[0]}</span>
          </div>
          <div>
            <h2 className="font-heading text-2xl font-bold sm:text-3xl">
              {artist.name}
            </h2>
            <p className="text-accent">{artist.specialty}</p>
          </div>
        </div>
      </SlideUp>

      {/* Filters */}
      <SlideUp delay={0.1}>
        <div className="flex flex-wrap gap-2 mb-8">
          {artist.filters.map((filter) => (
            <button
              key={filter}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm transition-all duration-200',
                filter === 'all'
                  ? 'bg-accent text-bg-primary font-medium'
                  : 'border border-border text-text-secondary hover:border-accent/50 hover:text-text-primary',
              )}
            >
              {filter === 'all' ? 'Toate' : tStyles(filter)}
            </button>
          ))}
        </div>
      </SlideUp>

      {/* Masonry grid */}
      <StaggerChildren
        staggerDelay={0.05}
        className="columns-2 gap-3 sm:columns-3 lg:columns-4"
      >
        {artist.works.map((work) => (
          <StaggerItem key={work.id} className="mb-3 break-inside-avoid">
            <div className="group relative overflow-hidden rounded-sm bg-bg-secondary cursor-pointer">
              <div
                style={{ paddingBottom: `${(work.aspectRatio || 1) * 100}%` }}
                className="relative"
              >
                {work.imagePath ? (
                  <img
                    src={work.thumbnailPath || work.imagePath}
                    alt={work.titleRo || work.titleEn || `Tatuaj ${work.style} de ${artist.name} — Insomnia Tattoo`}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-bg-tertiary to-bg-secondary transition-transform duration-300 group-hover:scale-105">
                    <span className="text-xs text-text-muted capitalize">{work.style}</span>
                  </div>
                )}
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-bg-primary/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="p-3">
                  <Badge variant="accent" className="text-[10px]">
                    {tStyles(work.style)}
                  </Badge>
                </div>
                <div className="p-3">
                  <FavoriteHeart
                    galleryItemId={work.id}
                    isFavorited={favoriteIds.has(work.id)}
                  />
                </div>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerChildren>

      {/* CTA */}
      <SlideUp className="mt-8 text-center">
        <Link href={`/booking?artist=${artist.slug}` as '/booking'}>
          <Button>{t('bookWith', { name: artist.name })}</Button>
        </Link>
      </SlideUp>
    </section>
  );
}

interface InkSpaceContentProps {
  sections?: ArtistSection[];
}

export default function InkSpaceContent({ sections }: InkSpaceContentProps) {
  const t = useTranslations('inkSpace');
  const artistSections = sections && sections.length > 0 ? sections : defaultArtistSections;
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

  // Fetch user's favorites (silent fail if not logged in)
  useEffect(() => {
    fetch('/api/client/favorites')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success) {
          setFavoriteIds(new Set(data.data.map((f: { galleryItemId: number }) => f.galleryItemId)));
        }
      })
      .catch(() => {});
  }, []);

  // Handle anchor scroll on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, []);

  return (
    <div className="pt-24">
      {/* Page header */}
      <div className="mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 lg:px-8">
        <SlideUp>
          <h1 className="font-heading text-4xl font-bold sm:text-5xl">
            {t('title')}
          </h1>
          <p className="mt-3 text-lg text-text-secondary">{t('subtitle')}</p>
          <div className="mx-auto mt-6 h-px w-16 bg-accent" />
        </SlideUp>
      </div>

      {/* Artist sections */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {artistSections.map((artist, index) => (
          <div key={artist.slug}>
            <ArtistPortfolioSection artist={artist} favoriteIds={favoriteIds} />
            {index < artistSections.length - 1 && (
              <div className="my-16 flex items-center gap-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
                <div className="h-1.5 w-1.5 rotate-45 bg-accent/40" />
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom spacing */}
      <div className="h-24" />
    </div>
  );
}
