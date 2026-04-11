'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  key: string;
  href: string;
  icon: string;
  superAdminOnly?: boolean;
}

const navItems: NavItem[] = [
  { key: 'dashboard', href: '/admin', icon: '📊' },
  { key: 'bookings', href: '/admin/bookings', icon: '📅' },
  { key: 'availability', href: '/admin/availability', icon: '🕐' },
  { key: 'gallery', href: '/admin/gallery', icon: '🖼' },
  { key: 'artists', href: '/admin/artists', icon: '🎨', superAdminOnly: true },
  { key: 'reviews', href: '/admin/reviews', icon: '⭐', superAdminOnly: true },
  { key: 'loyalty', href: '/admin/loyalty', icon: '💎', superAdminOnly: true },
  { key: 'settings', href: '/admin/settings', icon: '⚙️', superAdminOnly: true },
];

export default function AdminSidebar() {
  const t = useTranslations('admin.nav');
  const pathname = usePathname();
  const { user } = useAuth();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-bg-tertiary">
      <div className="border-b border-border p-6">
        <h1 className="font-heading text-xl text-accent">Insomnia Tattoo</h1>
        <p className="mt-1 text-xs text-text-muted">Admin Panel</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {navItems
            .filter((item) => !item.superAdminOnly || isSuperAdmin)
            .map((item) => {
              const isActive =
                item.href === '/admin'
                  ? pathname.endsWith('/admin') || pathname.endsWith('/admin/')
                  : pathname.includes(item.href);

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
                    <span>{item.icon}</span>
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
          <span>🚪</span>
          <span>{t('logout')}</span>
        </button>
      </div>
    </aside>
  );
}
