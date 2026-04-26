'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FavoriteHeartProps {
  galleryItemId: number;
  isFavorited: boolean;
  onToggle?: (galleryItemId: number, isFavorited: boolean) => void;
}

interface Particle {
  id: number;
  dx: number;
  dy: number;
}

let particleId = 0;

function createBurst(): Particle[] {
  return Array.from({ length: 6 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 18 + Math.random() * 14;
    return {
      id: ++particleId,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
    };
  });
}

export default function FavoriteHeart({ galleryItemId, isFavorited, onToggle }: FavoriteHeartProps) {
  const [favorited, setFavorited] = useState(isFavorited);
  const [isLoading, setIsLoading] = useState(false);
  const [burst, setBurst] = useState<Particle[]>([]);

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
          // Trigger particle burst (skip on reduced motion)
          const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
          if (!reduce) {
            const next = createBurst();
            setBurst(next);
            window.setTimeout(() => setBurst([]), 600);
          }
        } else if (res.status === 401) {
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
      className="relative rounded-full bg-bg-primary/70 p-1.5 transition-all hover:bg-bg-primary disabled:opacity-50"
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <motion.span
        key={favorited ? 'on' : 'off'}
        initial={false}
        animate={favorited ? { scale: [1, 1.45, 1] } : { scale: 1 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="inline-flex"
      >
        <Heart
          className={`h-4 w-4 transition-colors ${
            favorited ? 'fill-red-500 text-red-500' : 'text-text-muted hover:text-red-400'
          }`}
          aria-hidden="true"
        />
      </motion.span>

      {/* Particle burst on add — auto-cleared after 600ms */}
      <AnimatePresence>
        {burst.map((p) => (
          <motion.span
            key={p.id}
            className="pointer-events-none absolute left-1/2 top-1/2"
            initial={{ x: 0, y: 0, scale: 0.4, opacity: 1 }}
            animate={{ x: p.dx, y: p.dy, scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            aria-hidden="true"
          >
            <Heart className="h-2.5 w-2.5 fill-red-500 text-red-500" />
          </motion.span>
        ))}
      </AnimatePresence>
    </button>
  );
}
