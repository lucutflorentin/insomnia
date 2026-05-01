'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  Image,
  Palette,
  Star,
  Gem,
  Settings,
  Smartphone,
  Users,
  FileText,
  ScrollText,
  LogOut,
  Home,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  key: string;
  href: string;
  icon: LucideIcon;
  superAdminOnly?: boolean;
  primaryOnMobile?: boolean;
}

const navItems: NavItem[] = [
  { key: 'dashboard', href: '/admin', icon: LayoutDashboard, primaryOnMobile: true },
  { key: 'bookings', href: '/admin/bookings', icon: CalendarDays, primaryOnMobile: true },
  { key: 'gallery', href: '/admin/gallery', icon: Image, primaryOnMobile: true },
  { key: 'availability', href: '/admin/availability', icon: Clock, primaryOnMobile: true },
  { key: 'artists', href: '/admin/artists', icon: Palette, superAdminOnly: true },
  { key: 'reviews', href: '/admin/reviews', icon: Star, superAdminOnly: true },
  { key: 'loyalty', href: '/admin/loyalty', icon: Gem, superAdminOnly: true },
  { key: 'users', href: '/admin/users', icon: Users, superAdminOnly: true },
  { key: 'content', href: '/admin/content', icon: FileText, superAdminOnly: true },
  { key: 'auditLog', href: '/admin/audit-log', icon: ScrollText, superAdminOnly: true },
  { key: 'settings', href: '/admin/settings', icon: Settings, superAdminOnly: true },
  { key: 'pwa', href: '/admin/pwa-settings', icon: Smartphone, superAdminOnly: true },
];

function isItemActive(itemHref: string, pathname: string): boolean {
  // Strip locale prefix (/ro or /en) for matching
  const path = pathname.replace(/^\/(ro|en)(?=\/|$)/, '') || '/';
  if (itemHref === '/admin') {
    return path === '/admin' || path === '/admin/';
  }
  return path === itemHref || path.startsWith(`${itemHref}/`);
}

export default function AdminSidebar() {
  const t = useTranslations('admin.nav');
  const pathname = usePathname();
  const { user } = useAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Close mobile sheet on navigation
  useEffect(() => {
    setIsMoreOpen(false);
  }, [pathname]);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isMoreOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMoreOpen]);

  const visibleItems = navItems.filter((item) => !item.superAdminOnly || isSuperAdmin);
  const primaryMobileItems = visibleItems.filter((item) => item.primaryOnMobile);
  const overflowMobileItems = visibleItems.filter((item) => !item.primaryOnMobile);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-bg-tertiary px-4 md:hidden">
        <div className="min-w-0">
          <h1 className="truncate font-heading text-lg text-accent">Insomnia Tattoo</h1>
          <p className="truncate text-[11px] text-text-muted">{user?.name || 'Admin Panel'}</p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/"
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
            aria-label={t('site')}
            title={t('site')}
          >
            <Home className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label={t('menu')}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg-tertiary px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 md:hidden"
      >
        <ul
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${primaryMobileItems.length + (overflowMobileItems.length > 0 ? 1 : 0)}, minmax(0, 1fr))`,
          }}
        >
          {primaryMobileItems.map((item) => {
            const isActive = isItemActive(item.href, pathname);
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <Link
                  href={item.href as '/admin'}
                  className={cn(
                    'flex h-12 flex-col items-center justify-center gap-1 rounded-sm text-[10px] transition-colors',
                    isActive
                      ? 'bg-accent/10 text-accent'
                      : 'text-text-muted hover:bg-white/5 hover:text-text-primary',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="max-w-full truncate px-0.5">{t(item.key)}</span>
                </Link>
              </li>
            );
          })}
          {overflowMobileItems.length > 0 && (
            <li>
              <button
                type="button"
                onClick={() => setIsMoreOpen(true)}
                aria-label={t('more')}
                aria-expanded={isMoreOpen}
                className="flex h-12 w-full flex-col items-center justify-center gap-1 rounded-sm text-[10px] text-text-muted transition-colors hover:bg-white/5 hover:text-text-primary"
              >
                <Menu className="h-4 w-4 shrink-0" />
                <span className="max-w-full truncate px-0.5">{t('more')}</span>
              </button>
            </li>
          )}
        </ul>
      </nav>

      {/* Mobile overflow sheet */}
      {isMoreOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 md:hidden"
          onClick={() => setIsMoreOpen(false)}
          role="presentation"
        >
          <div
            className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-xl border-t border-border bg-bg-tertiary pb-[max(1rem,env(safe-area-inset-bottom))] pt-2"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-label={t('more')}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
            <div className="flex items-center justify-between px-4 pb-2">
              <p className="text-sm font-medium text-text-secondary">{t('more')}</p>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                aria-label={t('menu')}
                className="rounded-lg p-2 text-text-muted transition-colors hover:bg-white/5 hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="grid grid-cols-3 gap-2 px-3 pb-4">
              {overflowMobileItems.map((item) => {
                const isActive = isItemActive(item.href, pathname);
                const Icon = item.icon;
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href as '/admin'}
                      className={cn(
                        'flex flex-col items-center justify-center gap-1.5 rounded-lg px-2 py-3 text-center text-xs transition-colors',
                        isActive
                          ? 'bg-accent/10 text-accent'
                          : 'text-text-secondary hover:bg-white/5 hover:text-text-primary',
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="max-w-full truncate">{t(item.key)}</span>
                    </Link>
                  </li>
                );
              })}
              <li>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full flex-col items-center justify-center gap-1.5 rounded-lg px-2 py-3 text-center text-xs text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="max-w-full truncate">{t('logout')}</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-bg-tertiary md:flex">
        <div className="border-b border-border p-6">
          <h1 className="font-heading text-xl text-accent">Insomnia Tattoo</h1>
          <p className="mt-1 text-xs text-text-muted">Admin Panel</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {visibleItems.map((item) => {
              const isActive = isItemActive(item.href, pathname);
              const Icon = item.icon;

              return (
                <li key={item.key}>
                  <Link
                    href={item.href as '/admin'}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                      isActive
                        ? 'bg-accent/10 text-accent'
                        : 'text-text-secondary hover:bg-white/5 hover:text-text-primary',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{t(item.key)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-border p-4">
          <Link
            href="/"
            className="mb-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
          >
            <Home className="h-4 w-4 shrink-0" />
            <span>{t('site')}</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
