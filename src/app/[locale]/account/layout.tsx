'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

interface User {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: string;
}

interface NavItem {
  key: string;
  href: '/account' | '/account/bookings' | '/account/loyalty' | '/account/reviews' | '/account/favorites' | '/account/settings';
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    key: 'dashboard',
    href: '/account' as const,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    key: 'bookings',
    href: '/account/bookings' as const,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    key: 'loyalty',
    href: '/account/loyalty' as const,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
  {
    key: 'reviews',
    href: '/account/reviews' as const,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
  },
  {
    key: 'favorites',
    href: '/account/favorites' as const,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
  },
  {
    key: 'settings',
    href: '/account/settings' as const,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('account.nav');
  const tCommon = useTranslations('common.nav');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const json = await res.json();
          if (json.success) setUser(json.data);
        } else {
          window.location.href = '/auth/login';
        }
      } catch {
        window.location.href = '/auth/login';
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg-primary">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-bg-tertiary lg:flex">
        {/* User header */}
        <div className="border-b border-border p-6">
          <Link href="/account" className="block">
            <h1 className="font-heading text-xl text-accent">Insomnia Tattoo</h1>
          </Link>
          {user && (
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold text-accent">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">{user.name}</p>
                <p className="truncate text-xs text-text-muted">{user.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === '/account'
                  ? pathname.endsWith('/account') || pathname.endsWith('/contul-meu')
                  : pathname.includes(item.href.replace('/account/', ''));

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                      isActive
                        ? 'bg-accent/10 text-accent'
                        : 'text-text-secondary hover:bg-white/5 hover:text-text-primary',
                    )}
                  >
                    {item.icon}
                    <span>{t(item.key)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="border-t border-border p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            <span>{tCommon('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile Header */}
        <header className="flex items-center justify-between border-b border-border bg-bg-tertiary px-4 py-3 lg:hidden">
          <Link href="/account">
            <span className="font-heading text-lg text-accent">Insomnia Tattoo</span>
          </Link>
          {user && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold text-accent">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8">{children}</main>

        {/* Mobile Bottom Nav */}
        <nav className="flex border-t border-border bg-bg-tertiary lg:hidden">
          {navItems.map((item) => {
            const isActive =
              item.href === '/account'
                ? pathname.endsWith('/account') || pathname.endsWith('/contul-meu')
                : pathname.includes(item.href.replace('/account/', ''));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors',
                  isActive ? 'text-accent' : 'text-text-muted',
                )}
              >
                {item.icon}
                <span>{t(item.key).split(' ')[0]}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
