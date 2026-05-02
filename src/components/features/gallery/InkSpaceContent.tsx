'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { Link } from '@/i18n/navigation';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import NextJsImage from '@/components/ui/NextJsImage';
import FavoriteHeart from '@/components/ui/FavoriteHeart';
import SlideUp from '@/components/animations/SlideUp';
import StaggerChildren, { StaggerItem } from '@/components/animations/StaggerChildren';
import { formatStyleLabel, normalizeStyleKey } from '@/lib/gallery-style';
import { cn } from '@/lib/utils';

// Fallback placeholder data
const defaultArtistSections = [
  {
    slug: 'madalina',
    name: 'Madalina',
    specialty: 'Realism & Portrete',
    filters: ['all', 'portraits', 'color', 'blackgrey', 'nature'],
    works: Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      style: ['portraits', 'color', 'black_grey', 'nature'][i % 4],
      imagePath: '',
      thumbnailPath: '',
      aspectRatio: [1, 1.3, 0.85, 1.15, 1, 1.25, 0.9, 1.4, 1, 1.2, 0.95, 1.1][i],
      favoriteCount: 0,
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
      favoriteCount: 0,
    })),
  },
];

export interface ArtistSection {
  slug: string;
  name: string;
  specialty: string;
  profileImage?: string | null;
  filters: string[];
  works: Array<{
    id: number;
    style: string;
    imagePath: string;
    thumbnailPath: string;
    titleRo?: string | null;
    titleEn?: string | null;
    aspectRatio: number;
    favoriteCount?: number;
  }>;
}

function ArtistPortfolioSection({
  artist,
  favoriteIds,
  favoriteCounts,
  onFavoriteToggle,
}: {
  artist: ArtistSection;
  favoriteIds: Set<number>;
  favoriteCounts: Map<number, number>;
  onFavoriteToggle: (galleryItemId: number, isFavorited: boolean) => void;
}) {
  const t = useTranslations('inkSpace');
  const tGallery = useTranslations('gallery');
  const tStyles = useTranslations('artists.styles');
  const [activeFilter, setActiveFilter] = useState('all');
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [profileLightboxOpen, setProfileLightboxOpen] = useState(false);
  const filteredWorks =
    activeFilter === 'all'
      ? artist.works
      : artist.works.filter((work) => normalizeStyleKey(work.style) === activeFilter);
  const lightboxWorks = filteredWorks.filter((work) => Boolean(work.imagePath));
  const lightboxSlides = lightboxWorks.map((work) => ({
    src: work.imagePath,
    alt: work.titleRo || work.titleEn || `Tatuaj ${work.style} de ${artist.name}`,
  }));
  const openLightbox = (workId: number) => {
    const index = lightboxWorks.findIndex((work) => work.id === workId);
    if (index >= 0) setLightboxIndex(index);
  };
  const getStyleLabel = (style: string) => {
    const key = normalizeStyleKey(style);
    if (!key) return formatStyleLabel(style);

    try {
      return tStyles(key);
    } catch {
      return formatStyleLabel(style);
    }
  };

  return (
    <section id={artist.slug} className="scroll-mt-24">
      {/* Artist header */}
      <SlideUp>
        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => artist.profileImage && setProfileLightboxOpen(true)}
            disabled={!artist.profileImage}
            className={cn(
              'relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-bg-secondary',
              artist.profileImage && 'cursor-zoom-in transition-colors hover:border-accent/60',
            )}
            aria-label={
              artist.profileImage
                ? `Deschide poza de profil ${artist.name} in marime completa`
                : `Poza de profil ${artist.name}`
            }
          >
            {artist.profileImage ? (
              <Image
                src={artist.profileImage}
                alt={artist.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <span className="font-heading text-2xl text-accent/50">{artist.name[0]}</span>
            )}
          </button>
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
          {artist.filters.map((filter) => {
            const filterKey = filter === 'all' ? 'all' : normalizeStyleKey(filter);

            return (
              <button
                key={filterKey || filter}
                onClick={() => setActiveFilter(filterKey || filter)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm transition-all duration-200',
                  activeFilter === (filterKey || filter)
                    ? 'bg-accent text-bg-primary font-medium'
                    : 'border border-border text-text-secondary hover:border-accent/50 hover:text-text-primary',
                )}
              >
                {filter === 'all' ? tGallery('filters.all') : getStyleLabel(filter)}
              </button>
            );
          })}
        </div>
      </SlideUp>

      {/* Masonry grid */}
      {filteredWorks.length > 0 ? (
        <StaggerChildren
          key={`${artist.slug}-${activeFilter}`}
          staggerDelay={0.05}
          className="columns-2 gap-3 sm:columns-3 lg:columns-4"
        >
          {filteredWorks.map((work) => (
            <StaggerItem key={work.id} className="mb-3 break-inside-avoid">
              <div
                className={cn(
                  'group relative overflow-hidden rounded-sm bg-bg-secondary',
                  work.imagePath && 'cursor-zoom-in',
                )}
              >
                <button
                  type="button"
                  onClick={() => openLightbox(work.id)}
                  className="block w-full text-left"
                  aria-label={`Open ${work.titleRo || work.titleEn || work.style} in full size`}
                >
                  <div
                    style={{ paddingBottom: `${(work.aspectRatio || 1) * 100}%` }}
                    className="relative"
                  >
                    {work.imagePath ? (
                      <Image
                        src={work.imagePath}
                        alt={work.titleRo || work.titleEn || `Tatuaj ${work.style} de ${artist.name} - Insomnia Tattoo`}
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-bg-tertiary to-bg-secondary transition-transform duration-300 group-hover:scale-105">
                        <span className="text-xs capitalize text-text-muted">{work.style}</span>
                      </div>
                    )}
                  </div>
                  {/* Hover overlay */}
                  <div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-bg-primary/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="p-3">
                      <Badge variant="accent" className="text-[10px]">
                        {work.style ? getStyleLabel(work.style) : artist.name}
                      </Badge>
                    </div>
                  </div>
                </button>

                <div className="pointer-events-auto absolute right-2 top-2 z-20">
                  <FavoriteHeart
                    galleryItemId={work.id}
                    isFavorited={favoriteIds.has(work.id)}
                    favoriteCount={favoriteCounts.get(work.id) ?? work.favoriteCount ?? 0}
                    onToggle={onFavoriteToggle}
                  />
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      ) : (
        <div className="rounded-sm border border-border bg-bg-secondary p-8 text-center text-sm text-text-muted">
          {tGallery('noResults')}
        </div>
      )}

      <Lightbox
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        index={lightboxIndex}
        slides={lightboxSlides}
        render={{ slide: NextJsImage }}
      />

      <Lightbox
        open={profileLightboxOpen}
        close={() => setProfileLightboxOpen(false)}
        slides={artist.profileImage ? [{ src: artist.profileImage, alt: artist.name }] : []}
        render={{ slide: NextJsImage }}
      />

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
  const [favoriteCounts, setFavoriteCounts] = useState<Map<number, number>>(() => {
    const initialCounts = new Map<number, number>();
    artistSections.forEach((artist) => {
      artist.works.forEach((work) => initialCounts.set(work.id, work.favoriteCount ?? 0));
    });
    return initialCounts;
  });

  useEffect(() => {
    const nextCounts = new Map<number, number>();
    artistSections.forEach((artist) => {
      artist.works.forEach((work) => nextCounts.set(work.id, work.favoriteCount ?? 0));
    });
    setFavoriteCounts(nextCounts);
  }, [artistSections]);

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

  const handleFavoriteToggle = (galleryItemId: number, isFavorited: boolean) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isFavorited) {
        next.add(galleryItemId);
      } else {
        next.delete(galleryItemId);
      }
      return next;
    });

    setFavoriteCounts((prev) => {
      const next = new Map(prev);
      const current = next.get(galleryItemId) ?? 0;
      next.set(galleryItemId, Math.max(0, current + (isFavorited ? 1 : -1)));
      return next;
    });
  };

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
            <ArtistPortfolioSection
              artist={artist}
              favoriteIds={favoriteIds}
              favoriteCounts={favoriteCounts}
              onFavoriteToggle={handleFavoriteToggle}
            />
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
