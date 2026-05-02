'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { Link } from '@/i18n/navigation';
import { ArrowRight, ImageIcon, Eye } from 'lucide-react';
import Button from '@/components/ui/Button';
import NextJsImage from '@/components/ui/NextJsImage';
import SlideUp from '@/components/animations/SlideUp';
import StaggerChildren, { StaggerItem } from '@/components/animations/StaggerChildren';
import { cn } from '@/lib/utils';

interface GalleryHighlightItem {
  id: number;
  style: string;
  titleRo: string | null;
  titleEn: string | null;
  artistName: string;
  artistSlug: string;
  imagePath: string;
  thumbnailPath: string;
}

interface GalleryHighlightProps {
  items?: GalleryHighlightItem[];
}

export default function GalleryHighlight({ items = [] }: GalleryHighlightProps) {
  const t = useTranslations('home.gallery');
  const locale = useLocale();
  const [activeArtist, setActiveArtist] = useState('all');
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const artistFilters = useMemo(() => {
    const uniqueArtists = new Map<string, string>();
    items.forEach((item) => uniqueArtists.set(item.artistSlug, item.artistName));
    return Array.from(uniqueArtists.entries()).map(([slug, name]) => ({ slug, name }));
  }, [items]);

  const filteredItems = useMemo(
    () =>
      (activeArtist === 'all'
        ? items
        : items.filter((item) => item.artistSlug === activeArtist)
      ).filter((item) => typeof item.imagePath === 'string' && item.imagePath.length > 0),
    [activeArtist, items],
  );

  const lightboxSlides = useMemo(
    () =>
      filteredItems.map((item) => ({
        src: item.imagePath,
        alt: `${item.titleRo || item.titleEn || item.style} — ${item.artistName}`,
      })),
    [filteredItems],
  );

  return (
    <section className="bg-bg-secondary py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SlideUp>
          <div className="flex flex-col gap-4 text-center sm:items-center">
            <h2 className="font-heading text-3xl font-bold sm:text-4xl">
              {t('title')}
            </h2>
            <p className="max-w-2xl text-text-secondary">{t('subtitle')}</p>
            <div className="h-px w-16 bg-accent" />
          </div>
        </SlideUp>

        {artistFilters.length > 0 && (
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setActiveArtist('all')}
              className={cn(
                'rounded-full px-5 py-2 text-sm transition-all duration-200',
                activeArtist === 'all'
                  ? 'bg-accent font-medium text-bg-primary'
                  : 'border border-border text-text-secondary hover:border-accent/50 hover:text-text-primary',
              )}
            >
              {t('filters.all')}
            </button>
            {artistFilters.map((artist) => (
              <button
                key={artist.slug}
                onClick={() => setActiveArtist(artist.slug)}
                className={cn(
                  'rounded-full px-5 py-2 text-sm transition-all duration-200',
                  activeArtist === artist.slug
                    ? 'bg-accent font-medium text-bg-primary'
                    : 'border border-border text-text-secondary hover:border-accent/50 hover:text-text-primary',
                )}
              >
                {artist.name}
              </button>
            ))}
          </div>
        )}

        {filteredItems.length > 0 ? (
          <StaggerChildren
            key={activeArtist}
            staggerDelay={0.06}
            className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
          >
            {filteredItems.map((item, index) => {
              const title =
                (locale === 'ro' ? item.titleRo : item.titleEn) ||
                item.titleRo ||
                item.titleEn ||
                item.style;

              return (
                <StaggerItem key={item.id}>
                  <div
                    className={cn(
                      'group relative block overflow-hidden rounded-sm border border-border bg-bg-tertiary transition-all duration-300 hover:border-accent/40',
                      index % 5 === 0 && 'sm:row-span-2',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setLightboxIndex(index)}
                      className={cn(
                        'block w-full cursor-zoom-in text-left',
                      )}
                      aria-label={
                        locale === 'ro'
                          ? `Deschide ${title} in marime completa`
                          : `Open ${title} in full size`
                      }
                    >
                      <div
                        className={cn(
                          'relative aspect-[4/5]',
                          index % 5 === 0 && 'sm:aspect-[4/6]',
                        )}
                      >
                        <Image
                          src={item.imagePath}
                          alt={`${title} - ${item.artistName}`}
                          fill
                          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/90 via-bg-primary/10 to-transparent opacity-90" />
                        <div className="absolute inset-x-0 bottom-0 p-3">
                          <div className="flex items-end justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-text-primary">
                                {item.artistName}
                              </p>
                              <p className="truncate text-xs capitalize text-text-secondary">
                                {title}
                              </p>
                            </div>
                            <span className="rounded-full bg-accent/15 px-2 py-1 text-[10px] uppercase text-accent">
                              {item.style}
                            </span>
                          </div>
                        </div>
                        <span
                          aria-hidden="true"
                          className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-bg-primary/70 px-2 py-1 text-[10px] uppercase tracking-wide text-text-secondary opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100"
                        >
                          <Eye className="h-3 w-3" />
                          {locale === 'ro' ? 'Mareste' : 'Zoom'}
                        </span>
                      </div>
                    </button>
                    <Link
                      href={`/ink-space#${item.artistSlug}` as '/ink-space'}
                      className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 border-t border-border/40 bg-bg-primary/70 px-3 py-1.5 text-[11px] uppercase tracking-wide text-text-secondary opacity-0 transition-opacity duration-200 hover:bg-bg-primary/90 hover:text-accent group-hover:opacity-100"
                    >
                      {locale === 'ro' ? 'Vezi tot portofoliul' : 'See full portfolio'}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerChildren>
        ) : (
          <div className="mt-12 rounded-sm border border-border bg-bg-tertiary p-10 text-center">
            <ImageIcon className="mx-auto mb-3 h-8 w-8 text-text-muted" />
            <p className="text-sm text-text-muted">{t('empty')}</p>
          </div>
        )}

        <SlideUp className="mt-12 text-center">
          <Link href="/ink-space">
            <Button variant="secondary">
              {t('viewAll')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </SlideUp>
      </div>

      <Lightbox
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        index={Math.max(0, lightboxIndex)}
        slides={lightboxSlides}
        render={{ slide: NextJsImage }}
      />
    </section>
  );
}
