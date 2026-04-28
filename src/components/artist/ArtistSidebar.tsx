'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from '@/components/ui/NotificationBell';
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  Image,
  Star,
  UserCircle,
  LogOut,
  Home,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  key: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { key: 'dashboard', href: '/artist', icon: LayoutDashboard },
  { key: 'bookings', href: '/artist/bookings', icon: CalendarDays },
  { key: 'gallery', href: '/artist/gallery', icon: Image },
  { key: 'availability', href: '/artist/availability', icon: Clock },
  { key: 'reviews', href: '/artist/reviews', icon: Star },
  { key: 'profile', href: '/artist/profile', icon: UserCircle },
];

export default function ArtistSidebar() {
  const t = useTranslations('artist.nav');
  const pathname = usePathname();
  const { user } = useAuth();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  };

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-bg-tertiary px-4 md:hidden">
        <div>
          <h1 className="font-heading text-lg text-accent">Insomnia Tattoo</h1>
          <p className="text-[11px] text-text-muted">{user?.name || 'Artist Panel'}</p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/"
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
            title={t('site')}
          >
            <Home className="h-5 w-5" />
          </Link>
          <NotificationBell />
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg-tertiary px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 md:hidden">
        <ul className="grid grid-cols-6 gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === '/artist'
                ? pathname.endsWith('/artist') || pathname.endsWith('/artist/')
                : pathname.includes(item.href);

            const Icon = item.icon;

            return (
              <li key={item.key}>
                <Link
                  href={item.href as '/artist'}
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
        </ul>
      </nav>

      <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-bg-tertiary md:flex">
        <div className="border-b border-border p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-heading text-xl text-accent">Insomnia Tattoo</h1>
              <p className="mt-1 text-xs text-text-muted">
                {user?.name || 'Artist Panel'}
              </p>
            </div>
            <NotificationBell />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === '/artist'
                  ? pathname.endsWith('/artist') || pathname.endsWith('/artist/')
                  : pathname.includes(item.href);

              const Icon = item.icon;

              return (
                <li key={item.key}>
                  <Link
                    href={item.href as '/artist'}
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
