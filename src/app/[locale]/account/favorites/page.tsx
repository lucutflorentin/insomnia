'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Heart, Trash2 } from 'lucide-react';
import Image from 'next/image';

interface FavoriteItem {
  id: number;
  galleryItemId: number;
  imagePath: string;
  thumbnailPath: string | null;
  titleRo: string | null;
  titleEn: string | null;
  style: string | null;
  bodyArea: string | null;
  artist: { id: number; name: string; slug: string };
}

export default function FavoritesPage() {
  const t = useTranslations('account.favorites');
  const locale = useLocale();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/client/favorites')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setFavorites(data.data || []);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleRemove = async (galleryItemId: number) => {
    setRemovingId(galleryItemId);
    try {
      const res = await fetch(`/api/client/favorites?galleryItemId=${galleryItemId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setFavorites((prev) => prev.filter((f) => f.galleryItemId !== galleryItemId));
      }
    } catch {
      // Silent fail
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl text-text-primary">{t('title')}</h1>

      {favorites.length === 0 ? (
        <div className="rounded-sm border border-border bg-bg-secondary p-12 text-center">
          <Heart className="mx-auto mb-4 h-12 w-12 text-text-muted" strokeWidth={1} />
          <p className="text-text-muted">{t('empty')}</p>
          <Link
            href="/ink-space"
            className="mt-4 inline-block text-sm text-accent hover:underline"
          >
            {t('browseGallery')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {favorites.map((item) => (
            <div
              key={item.galleryItemId}
              className="group relative overflow-hidden rounded-sm border border-border bg-bg-secondary"
            >
              <div className="relative aspect-square">
                <Image
                  src={item.thumbnailPath || item.imagePath}
                  alt={
                    (locale === 'en' ? item.titleEn : item.titleRo) ||
                    `${t('tattooBy')} ${item.artist.name}`
                  }
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <button
                  onClick={() => handleRemove(item.galleryItemId)}
                  disabled={removingId === item.galleryItemId}
                  className="absolute right-2 top-2 rounded-full bg-bg-primary/80 p-1.5 text-red-400 opacity-0 transition-opacity hover:bg-bg-primary group-hover:opacity-100 disabled:opacity-50"
                  title={t('remove')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="p-3">
                <p className="text-xs text-text-muted">{item.artist.name}</p>
                {(locale === 'en' ? item.titleEn : item.titleRo) && (
                  <p className="mt-0.5 text-sm text-text-primary">
                    {locale === 'en' ? item.titleEn : item.titleRo}
                  </p>
                )}
                {item.style && (
                  <span className="mt-1 inline-block rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                    {item.style}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
