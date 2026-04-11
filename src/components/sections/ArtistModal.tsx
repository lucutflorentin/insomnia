'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface ArtistData {
  slug: string;
  name: string;
  specialtyRo: string | null;
  specialtyEn: string | null;
  bioRo: string | null;
  bioEn: string | null;
  specialties: string[];
  profileImage: string | null;
  instagramUrl: string | null;
  averageRating: number;
  reviewCount: number;
  featuredWorks: { id: number; src: string; titleRo: string | null; titleEn: string | null }[];
}

interface ArtistModalProps {
  isOpen: boolean;
  onClose: () => void;
  artist: ArtistData | null;
  onBooking: (artistSlug: string) => void;
}

function ParallaxPortrait({ image: _image, name }: { image: string; name: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Parallax transforms — subtle tilt effect
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-8, 8]);
  const translateZ = useTransform(mouseX, [-0.5, 0.5], [-5, 5]);

  // Background shift for depth
  const bgX = useTransform(mouseX, [-0.5, 0.5], [10, -10]);
  const bgY = useTransform(mouseY, [-0.5, 0.5], [10, -10]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    },
    [mouseX, mouseY],
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return (
    <div
      ref={containerRef}
      className="relative h-[400px] w-full overflow-hidden sm:h-[500px]"
      style={{ perspective: '1000px' }}
    >
      {/* Animated background gradient */}
      <motion.div
        style={{ x: bgX, y: bgY }}
        className="absolute inset-[-20px] bg-gradient-to-br from-bg-primary via-bg-tertiary to-bg-secondary"
      />

      {/* Smoke/particle effect layer */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute left-1/4 top-1/3 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 h-32 w-32 rounded-full bg-accent/5 blur-3xl" />
      </div>

      {/* Portrait with 3D tilt */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          z: translateZ,
        }}
        transition={{ type: 'spring', stiffness: 100, damping: 30 }}
        className="relative flex h-full items-end justify-center"
      >
        {/* Placeholder portrait — replace with actual PNG cutout */}
        <div className="relative h-[85%] w-[70%] max-w-[300px]">
          <div className="h-full w-full rounded-t-full bg-gradient-to-t from-border/30 via-bg-secondary to-bg-tertiary flex items-center justify-center">
            <span className="font-heading text-8xl text-border/50">{name[0]}</span>
          </div>
          {/* Bottom gradient fade */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-bg-primary to-transparent" />
        </div>
      </motion.div>

      {/* Decorative elements */}
      <div className="absolute bottom-4 left-4 h-px w-12 bg-accent/40" />
      <div className="absolute right-4 top-4 h-12 w-px bg-accent/40" />
    </div>
  );
}

export default function ArtistModal({
  isOpen,
  onClose,
  artist,
  onBooking,
}: ArtistModalProps) {
  const t = useTranslations('artistModal');
  const tStyles = useTranslations('artists.styles');
  const locale = typeof window !== 'undefined' ? document.documentElement.lang || 'ro' : 'ro';

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!artist) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 mx-auto flex h-full max-w-5xl flex-col overflow-y-auto"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-bg-primary/80 text-text-secondary backdrop-blur-sm transition-colors hover:text-text-primary"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Portrait with parallax */}
            <ParallaxPortrait image={artist.profileImage || ''} name={artist.name} />

            {/* Info section */}
            <div className="relative bg-bg-primary px-6 pb-12 pt-6 sm:px-12">
              {/* Name & specialty */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="font-heading text-3xl font-bold sm:text-4xl">
                  {artist.name}
                </h2>
                <p className="mt-1 text-lg text-accent">
                  {locale === 'ro' ? artist.specialtyRo : artist.specialtyEn}
                </p>
                {artist.reviewCount > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-text-secondary">
                    <span className="text-accent">{'★'.repeat(Math.round(artist.averageRating))}</span>
                    <span>{artist.averageRating}</span>
                    <span className="text-text-muted">({artist.reviewCount} {locale === 'ro' ? 'recenzii' : 'reviews'})</span>
                  </div>
                )}
              </motion.div>

              {/* Bio */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4 max-w-2xl text-text-secondary leading-relaxed"
              >
                {locale === 'ro' ? artist.bioRo : artist.bioEn}
              </motion.p>

              {/* Specialties badges */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-5"
              >
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-muted">
                  {t('specialties')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {artist.specialties.map((style) => (
                    <Badge key={style} variant="accent">
                      {tStyles(style)}
                    </Badge>
                  ))}
                </div>
              </motion.div>

              {/* Mini gallery — best works */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8"
              >
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-muted">
                  {t('bestWorks')}
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
                  {artist.featuredWorks.map((work) => (
                    <div
                      key={work.id}
                      className="group aspect-square overflow-hidden rounded-sm bg-bg-secondary"
                    >
                      {work.src ? (
                        <img
                          src={work.src}
                          alt={locale === 'ro' ? (work.titleRo || '') : (work.titleEn || '')}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-bg-tertiary to-bg-secondary transition-transform duration-300 group-hover:scale-105">
                          <span className="text-xs text-text-muted">{work.id}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8 flex flex-col gap-3 sm:flex-row"
              >
                <Button
                  size="lg"
                  onClick={() => {
                    onClose();
                    onBooking(artist.slug);
                  }}
                >
                  {t('bookWith', { name: artist.name })}
                </Button>
                <Link href={`/ink-space` as '/ink-space'} onClick={onClose}>
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                    {t('viewFullPortfolio')}
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
