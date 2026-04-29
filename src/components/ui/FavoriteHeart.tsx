'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Heart } from 'lucide-react';

interface FavoriteHeartProps {
  galleryItemId: number;
  isFavorited: boolean;
  favoriteCount?: number;
  onToggle?: (galleryItemId: number, isFavorited: boolean) => void;
}

export default function FavoriteHeart({
  galleryItemId,
  isFavorited,
  favoriteCount = 0,
  onToggle,
}: FavoriteHeartProps) {
  const locale = useLocale();
  const [favorited, setFavorited] = useState(isFavorited);
  const [isLoading, setIsLoading] = useState(false);
  const [count, setCount] = useState(favoriteCount);

  useEffect(() => {
    setFavorited(isFavorited);
  }, [isFavorited]);

  useEffect(() => {
    setCount(favoriteCount);
  }, [favoriteCount]);

  const redirectToLogin = () => {
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const loginPath = locale === 'en' ? '/en/auth/login' : '/autentificare';
    window.location.href = `${loginPath}?redirect=${encodeURIComponent(currentPath)}`;
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);

    try {
      if (favorited) {
        const res = await fetch(`/api/client/favorites?galleryItemId=${galleryItemId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setFavorited(false);
          setCount((current) => Math.max(0, current - 1));
          onToggle?.(galleryItemId, false);
        } else if (res.status === 401 || res.status === 403) {
          redirectToLogin();
          return;
        }
      } else {
        const res = await fetch('/api/client/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ galleryItemId }),
        });
        if (res.ok) {
          setFavorited(true);
          setCount((current) => current + 1);
          onToggle?.(galleryItemId, true);
        } else if (res.status === 401 || res.status === 403) {
          redirectToLogin();
          return;
        }
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className="inline-flex items-center gap-1 rounded-full bg-bg-primary/75 px-2 py-1.5 text-xs font-medium text-text-secondary transition-all hover:bg-bg-primary hover:text-text-primary disabled:opacity-50"
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        className={`h-4 w-4 transition-colors ${
          favorited
            ? 'fill-red-500 text-red-500'
            : 'text-text-muted hover:text-red-400'
        }`}
      />
      <span>{count}</span>
    </button>
  );
}
