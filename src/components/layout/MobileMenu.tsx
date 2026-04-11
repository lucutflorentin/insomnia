'use client';

import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import { NAV_ITEMS, NAV_CTA } from '@/lib/constants';
import Button from '@/components/ui/Button';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: { name: string; role: string } | null;
}

export default function MobileMenu({ isOpen, onClose, user }: MobileMenuProps) {
  const t = useTranslations('common');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed right-0 top-0 z-50 flex h-full w-[300px] flex-col border-l border-border bg-bg-primary lg:hidden"
          >
            <div className="flex items-center justify-between p-6">
              <span className="font-accent text-lg text-accent">Insomnia</span>
              <button
                onClick={onClose}
                className="p-2 text-text-secondary hover:text-text-primary"
                aria-label="Close menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col gap-1 px-4">
              {NAV_ITEMS.map((item, index) => (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="block rounded-sm px-4 py-3 text-base text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
                  >
                    {t(`nav.${item.key}`)}
                  </Link>
                </motion.div>
              ))}

              {/* Aftercare in mobile menu */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
              >
                <Link
                  href="/aftercare"
                  onClick={onClose}
                  className="block rounded-sm px-4 py-3 text-base text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
                >
                  {t('nav.aftercare')}
                </Link>
              </motion.div>
              {/* Auth link */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="my-2 border-t border-border" />
                {user ? (
                  <Link
                    href={user.role === 'CLIENT' ? '/account' : '/admin'}
                    onClick={onClose}
                    className="block rounded-sm px-4 py-3 text-base text-accent transition-colors hover:bg-bg-secondary"
                  >
                    {t('nav.account')}
                  </Link>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={onClose}
                    className="block rounded-sm px-4 py-3 text-base text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
                  >
                    {t('nav.login')}
                  </Link>
                )}
              </motion.div>
            </nav>

            <div className="mt-auto p-6">
              <Link href={NAV_CTA.href} onClick={onClose} className="block">
                <Button className="w-full">{t(`nav.${NAV_CTA.key}`)}</Button>
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
