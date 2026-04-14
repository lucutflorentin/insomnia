'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';

interface FavoriteHeartProps {
  galleryItemId: number;
  isFavorited: boolean;
  onToggle?: (galleryItemId: number, isFavorited: boolean) => void;
}

export default function FavoriteHeart({ galleryItemId, isFavorited, onToggle }: FavoriteHeartProps) {
  const [favorited, setFavorited] = useState(isFavorited);
  const [isLoading, setIsLoading] = useState(false);

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
          onToggle?.(galleryItemId, false);
        }
      } else {
        const res = await fetch('/api/client/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ galleryItemId }),
        });
        if (res.ok) {
          setFavorited(true);
          onToggle?.(galleryItemId, true);
        } else if (res.status === 401) {
          // Not logged in — redirect to login
          window.location.href = '/auth/login';
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
      onClick={handleClick}
      disabled={isLoading}
      className="rounded-full bg-bg-primary/70 p-1.5 transition-all hover:bg-bg-primary disabled:opacity-50"
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        className={`h-4 w-4 transition-colors ${
          favorited
            ? 'fill-red-500 text-red-500'
            : 'text-text-muted hover:text-red-400'
        }`}
      />
    </button>
  );
}
