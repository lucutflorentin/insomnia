'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/navigation';

const SHOW_AFTER_PX = 300;

// Routes where the sticky CTA would be redundant (the page itself is the booking).
const HIDDEN_ROUTES = ['/booking', '/auth/login', '/auth/register', '/admin', '/artist', '/account'];

export default function StickyMobileCTA() {
  const t = useTranslations('common.nav');
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [scrollingUp, setScrollingUp] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrollingUp(y < lastY);
        setVisible(y > SHOW_AFTER_PX);
        lastY = y;
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Strip locale and check against hidden routes
  const stripped = pathname.replace(/^\/(ro|en)/, '') || '/';
  if (HIDDEN_ROUTES.some((route) => stripped.startsWith(route))) return null;

  const shouldShow = visible && !scrollingUp;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="fixed bottom-5 right-5 z-40 sm:hidden"
        >
          <Link
            href="/booking"
            className="flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-bg-primary shadow-2xl ring-1 ring-accent/40 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label={t('booking')}
          >
            <Calendar className="h-4 w-4" aria-hidden="true" />
            {t('booking')}
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
