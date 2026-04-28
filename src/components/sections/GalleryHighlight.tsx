'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Button from '@/components/ui/Button';
import SlideUp from '@/components/animations/SlideUp';
import StaggerChildren, {
  StaggerItem,
} from '@/components/animations/StaggerChildren';
import { cn } from '@/lib/utils';

// Fallback placeholder items when no DB data available
const placeholderItems = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  style: i % 2 === 0 ? 'realism' : 'graphic',
  artist: i % 2 === 0 ? 'Madalina' : 'Florentin',
  imagePath: '',
  thumbnailPath: '',
  aspectRatio: [1, 1.2, 0.8, 1.4, 1, 1.3, 0.9, 1.1][i],
}));

const filters = ['all', 'realism', 'graphic'] as const;

interface GalleryHighlightProps {
  items?: Array<{
    id: number;
    style: string;
    artist: string;
    imagePath: string;
    thumbnailPath: string;
  }>;
}

export default function GalleryHighlight({ items }: GalleryHighlightProps) {
  const t = useTranslations('home.gallery');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const displayItems = items && items.length > 0
    ? items.map((item) => ({ ...item, aspectRatio: 1 }))
    : placeholderItems;

  const filteredItems =
    activeFilter === 'all'
      ? displayItems
      : displayItems.filter((item) => item.style === activeFilter);

  return (
    <section className="bg-bg-secondary py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <SlideUp>
          <div className="text-center">
            <h2 className="font-heading text-3xl font-bold sm:text-4xl">
              {t('title')}
            </h2>
            <p className="mt-3 text-text-secondary">{t('subtitle')}</p>
            <div className="mx-auto mt-6 h-px w-16 bg-accent" />
          </div>
        </SlideUp>

        {/* Filters */}
        <div className="mt-10 flex justify-center gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                'rounded-full px-5 py-2 text-sm transition-all duration-200',
                activeFilter === filter
                  ? 'bg-accent text-bg-primary font-medium'
                  : 'border border-border text-text-secondary hover:border-accent/50 hover:text-text-primary',
              )}
            >
              {t(`filters.${filter}`)}
            </button>
          ))}
        </div>

        {/* Grid */}
        <StaggerChildren
          staggerDelay={0.08}
          className="mt-12 columns-2 gap-4 md:columns-3 lg:columns-4"
        >
          {filteredItems.map((item) => (
            <StaggerItem key={item.id} className="mb-4 break-inside-avoid">
              <div className="group relative overflow-hidden rounded-sm bg-bg-tertiary">
                <div
                  style={{ paddingBottom: `${(item.aspectRatio || 1) * 100}%` }}
                  className="relative"
                >
                  {item.imagePath ? (
                    <Image
                      src={item.thumbnailPath || item.imagePath}
                      alt={`Tatuaj ${item.style} de ${item.artist} — Insomnia Tattoo`}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-bg-tertiary to-bg-secondary">
                      <span className="text-xs text-text-muted">{item.style}</span>
                    </div>
                  )}
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-bg-primary/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="p-4">
                    <p className="text-xs text-accent">{item.artist}</p>
                    <p className="text-xs text-text-secondary capitalize">
                      {item.style}
                    </p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>

        {/* CTA */}
        <SlideUp className="mt-12 text-center">
          <Link href="/ink-space">
            <Button variant="secondary">{t('viewAll')}</Button>
          </Link>
        </SlideUp>
      </div>
    </section>
  );
}
