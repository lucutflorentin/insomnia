'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { NAV_ITEMS, NAV_CTA } from '@/lib/constants';
import LanguageSwitcher from './LanguageSwitcher';
import MobileMenu from './MobileMenu';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function Header() {
  const t = useTranslations('common');
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success) setUser(data.data);
      })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const isHomepage = pathname === '/';

  const handleNavClick = (item: (typeof NAV_ITEMS)[number], e: React.MouseEvent) => {
    // If nav item has scrollTo and we're on homepage, smooth scroll instead of navigate
    if ('scrollTo' in item && item.scrollTo && isHomepage) {
      e.preventDefault();
      const element = document.getElementById(item.scrollTo);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <>
      <header
        className={cn(
          'fixed left-0 right-0 top-0 z-40 transition-all duration-300',
          isScrolled || !isHomepage
            ? 'border-b border-border bg-bg-primary/95 backdrop-blur-md'
            : 'bg-transparent',
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2">
            <span className="font-accent text-2xl font-semibold text-accent transition-colors group-hover:text-accent-light">
              Insomnia
            </span>
            <span className="text-sm font-light tracking-widest text-text-secondary uppercase">
              Tattoo
            </span>
          </Link>

          {/* Desktop Navigation — 3 links only */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href !== '/' && pathname.startsWith(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={(e) => handleNavClick(item, e)}
                  className={cn(
                    'px-4 py-2 text-sm tracking-wide transition-colors duration-200',
                    isActive
                      ? 'text-accent'
                      : 'text-text-secondary hover:text-text-primary',
                  )}
                >
                  {t(`nav.${item.key}`)}
                </Link>
              );
            })}
          </nav>

          {/* Right side: Language + Auth + CTA */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            {user ? (
              <Link
                href={user.role === 'CLIENT' ? '/account' : '/admin'}
                className="hidden text-sm text-text-secondary transition-colors hover:text-accent sm:block"
              >
                {t('nav.account')}
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="hidden text-sm text-text-secondary transition-colors hover:text-accent sm:block"
              >
                {t('nav.login')}
              </Link>
            )}

            <Link href={NAV_CTA.href} className="hidden sm:block">
              <Button size="sm">{t(`nav.${NAV_CTA.key}`)}</Button>
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-text-secondary hover:text-text-primary lg:hidden"
              aria-label="Open menu"
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
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
      />
    </>
  );
}
