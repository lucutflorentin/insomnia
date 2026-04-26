'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import Button from '@/components/ui/Button';
import InkBloom from '@/components/effects/InkBloom';

interface HeroProps {
  onBookingClick: () => void;
  dynamicTitle?: string;
  dynamicSubtitle?: string;
}

export default function Hero({ onBookingClick, dynamicTitle, dynamicSubtitle }: HeroProps) {
  const t = useTranslations('home.hero');

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-bg-primary/60 via-bg-primary/40 to-bg-primary" />
      <div className="absolute inset-0 bg-bg-tertiary">
        <div className="h-full w-full bg-gradient-to-br from-bg-primary via-bg-tertiary to-bg-secondary" />
      </div>
      {/* Decorative ink bloom — sits above gradient, below content */}
      <div className="absolute inset-0 z-[11]">
        <InkBloom />
      </div>

      {/* Content */}
      <div className="relative z-20 mx-auto max-w-4xl px-4 text-center">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '60px' }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mx-auto mb-8 h-px bg-accent"
        />

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="font-heading text-4xl font-bold leading-tight sm:text-5xl md:text-6xl lg:text-7xl"
        >
          {dynamicTitle || t('title')}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mx-auto mt-6 max-w-xl text-lg text-text-secondary sm:text-xl"
        >
          {dynamicSubtitle || t('subtitle')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button size="lg" onClick={onBookingClick}>
            {t('ctaBooking')}
          </Button>
          <Link href="/ink-space">
            <Button variant="secondary" size="lg">
              {t('ctaGallery')}
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '60px' }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mx-auto mt-12 h-px bg-accent"
        />
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="h-8 w-5 rounded-full border border-text-muted p-1">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="h-1.5 w-1.5 rounded-full bg-accent"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
