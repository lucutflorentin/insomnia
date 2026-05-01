'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';

const COOKIE_KEY = 'insomnia_cookie_consent';
const COOKIE_CONSENT_EVENT = 'insomnia-cookie-consent';

export default function CookieConsent() {
  const t = useTranslations('common.cookies');
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      // Small delay so it doesn't flash on page load
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_KEY, 'accepted');
    window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: 'accepted' }));
    setShow(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_KEY, 'declined');
    window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: 'declined' }));
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-bg-secondary/95 backdrop-blur-md"
        >
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-4 sm:flex-row sm:px-6">
            <p className="flex-1 text-sm text-text-secondary">
              {t('message')}
            </p>
            <div className="flex shrink-0 gap-3">
              <button
                onClick={handleDecline}
                className="rounded-sm border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:border-border-light hover:text-text-primary"
              >
                {t('decline')}
              </button>
              <button
                onClick={handleAccept}
                className="rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-hover"
              >
                {t('accept')}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
