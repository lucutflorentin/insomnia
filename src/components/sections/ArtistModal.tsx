'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatStyleLabel, normalizeStyleKey } from '@/lib/gallery-style';

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

export default function ArtistModal({
  isOpen,
  onClose,
  artist,
  onBooking,
}: ArtistModalProps) {
  const t = useTranslations('artistModal');
  const tStyles = useTranslations('artists.styles');
  const locale = typeof window !== 'undefined' ? document.documentElement.lang || 'ro' : 'ro';
  
  const getStyleLabel = (style: string) => {
    const key = normalizeStyleKey(style);
    if (!key) return formatStyleLabel(style);

    try {
      return tStyles(key);
    } catch {
      return formatStyleLabel(style);
    }
  };

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex h-full w-full max-w-4xl flex-col overflow-hidden bg-bg-primary shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-bg-secondary/80 text-text-secondary backdrop-blur-md transition-colors hover:bg-bg-tertiary hover:text-text-primary sm:right-6 sm:top-6"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto">
              {/* Header Section (Minimalist Profile) */}
              <div className="relative border-b border-border bg-gradient-to-b from-bg-secondary to-bg-primary px-6 pb-8 pt-12 sm:px-12 sm:pt-16">
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
                  {/* Avatar */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full border-4 border-bg-primary shadow-xl sm:h-40 sm:w-40"
                  >
                    {artist.profileImage ? (
                      <Image
                        src={artist.profileImage}
                        alt={`${artist.name} — Tattoo Artist`}
                        fill
                        sizes="(max-width: 640px) 128px, 160px"
                        className="object-cover object-top"
                        priority
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-bg-tertiary">
                        <span className="font-heading text-4xl text-text-muted">{artist.name[0]}</span>
                      </div>
                    )}
                  </motion.div>

                  {/* Info & Primary CTAs */}
                  <div className="flex flex-1 flex-col items-center sm:items-start">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-center sm:text-left"
                    >
                      <h2 className="font-heading text-3xl font-bold text-text-primary sm:text-4xl">
                        {artist.name}
                      </h2>
                      <p className="mt-1 text-lg font-medium text-accent">
                        {locale === 'ro' ? artist.specialtyRo : artist.specialtyEn}
                      </p>
                      
                      {artist.reviewCount > 0 && (
                        <div className="mt-3 flex items-center justify-center gap-1.5 text-sm text-text-secondary sm:justify-start">
                          <span className="text-accent">{'★'.repeat(Math.round(artist.averageRating))}</span>
                          <span className="font-medium text-text-primary">{artist.averageRating}</span>
                          <span className="text-text-muted">({artist.reviewCount} {locale === 'ro' ? 'recenzii' : 'reviews'})</span>
                        </div>
                      )}
                    </motion.div>

                    {/* CTAs - Moved up for immediate visibility on mobile */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mt-6 w-full max-w-md sm:max-w-none"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Button
                          size="lg"
                          onClick={() => {
                            onClose();
                            onBooking(artist.slug);
                          }}
                          className="w-full sm:w-auto sm:px-8"
                        >
                          {t('bookWith', { name: artist.name })}
                        </Button>
                        <Link href={`/ink-space` as '/ink-space'} onClick={onClose} className="w-full sm:w-auto">
                          <Button variant="secondary" size="lg" className="w-full sm:px-8">
                            {t('viewFullPortfolio')}
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Details Section */}
              <div className="px-6 py-8 sm:px-12 sm:py-10">
                {/* Bio */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mb-8"
                >
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-primary">
                    Despre Artist
                  </h3>
                  <p className="max-w-3xl leading-relaxed text-text-secondary">
                    {locale === 'ro' ? artist.bioRo : artist.bioEn}
                  </p>
                </motion.div>

                {/* Specialties badges */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="mb-10"
                >
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-primary">
                    {t('specialties')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {artist.specialties.map((style) => (
                      <Badge key={style} variant="outline" className="border-border/50 bg-bg-secondary text-text-secondary">
                        {getStyleLabel(style)}
                      </Badge>
                    ))}
                  </div>
                </motion.div>

                {/* Mini gallery — best works */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-text-primary">
                      {t('bestWorks')}
                    </h3>
                  </div>
                  
                  {artist.featuredWorks && artist.featuredWorks.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 sm:gap-4">
                      {artist.featuredWorks.map((work) => (
                        <div
                          key={work.id}
                          className="group relative aspect-square overflow-hidden rounded-md bg-bg-secondary shadow-sm"
                        >
                          {work.src ? (
                            <Image
                              src={work.src}
                              alt={locale === 'ro' ? (work.titleRo || '') : (work.titleEn || '')}
                              fill
                              sizes="(min-width: 640px) 25vw, 50vw"
                              className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-bg-tertiary to-bg-secondary">
                              <span className="text-xs text-text-muted">{work.id}</span>
                            </div>
                          )}
                          {/* Hover overlay for works */}
                          <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
                      <p className="text-sm text-text-muted">Nu există lucrări adăugate încă.</p>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
