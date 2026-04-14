'use client';

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
  Star,
  UserCircle,
  LogOut,
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
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-bg-tertiary">
      <div className="border-b border-border p-6">
        <h1 className="font-heading text-xl text-accent">Insomnia Tattoo</h1>
        <p className="mt-1 text-xs text-text-muted">
          {user?.name || 'Artist Panel'}
        </p>
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
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>{t('logout')}</span>
        </button>
      </div>
    </aside>
  );
}
