'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Power, PowerOff, Search, Users, Shield, Palette } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface User {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  _count: {
    bookings: number;
    reviews: number;
    loyaltyTransactions: number;
  };
}

const roleColors: Record<string, string> = {
  CLIENT: 'bg-blue-500/20 text-blue-400',
  ARTIST: 'bg-purple-500/20 text-purple-400',
  SUPER_ADMIN: 'bg-red-500/20 text-red-400',
};

const roleIcons: Record<string, typeof Users> = {
  CLIENT: Users,
  ARTIST: Palette,
  SUPER_ADMIN: Shield,
};

export default function AdminUsersPage() {
  const t = useTranslations('admin.users');
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);

    try {
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
        setTotal(data.pagination?.total || 0);
      }
    } catch {}
    setIsLoading(false);
  }, [search, roleFilter]);

  const toggleUserStatus = async (user: User) => {
    setUpdatingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || t('updateError'), 'error');
        return;
      }
      setUsers((prev) =>
        prev.map((item) =>
          item.id === user.id ? { ...item, isActive: !user.isActive } : item,
        ),
      );
      showToast(user.isActive ? t('deactivated') : t('activated'), 'success');
    } catch {
      showToast(t('updateError'), 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timeout);
  }, [fetchUsers]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl text-text-primary">{t('title')}</h1>
          <p className="mt-1 text-sm text-text-muted">
            {t('total', { count: total })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-sm border border-border bg-bg-secondary py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex gap-1.5">
          {['', 'CLIENT', 'ARTIST', 'SUPER_ADMIN'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`rounded-sm px-3 py-2 text-xs font-medium transition-colors ${
                roleFilter === role
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {role || t('filter.all')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-secondary">
                <th className="px-4 py-3 text-left font-medium text-text-muted">{t('table.name')}</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">{t('table.email')}</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">{t('table.role')}</th>
                <th className="px-4 py-3 text-center font-medium text-text-muted">{t('table.bookings')}</th>
                <th className="px-4 py-3 text-center font-medium text-text-muted">{t('table.reviews')}</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">{t('table.lastLogin')}</th>
                <th className="px-4 py-3 text-left font-medium text-text-muted">{t('table.joined')}</th>
                <th className="px-4 py-3 text-right font-medium text-text-muted">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const RoleIcon = roleIcons[user.role] || Users;
                return (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-bg-secondary/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-primary">{user.name}</span>
                        {!user.isActive && (
                          <span className="rounded-full bg-red-500/20 px-1.5 py-0.5 text-[10px] text-red-400">
                            {t('inactive')}
                          </span>
                        )}
                      </div>
                      {user.phone && (
                        <p className="text-xs text-text-muted">{user.phone}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[user.role] || ''}`}>
                        <RoleIcon className="h-3 w-3" />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-text-secondary">{user._count.bookings}</td>
                    <td className="px-4 py-3 text-center text-text-secondary">{user._count.reviews}</td>
                    <td className="px-4 py-3 text-text-muted">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString('ro-RO')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {new Date(user.createdAt).toLocaleDateString('ro-RO')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {user.role !== 'SUPER_ADMIN' && (
                        <button
                          type="button"
                          onClick={() => toggleUserStatus(user)}
                          disabled={updatingId === user.id}
                          className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60 ${
                            user.isActive
                              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                              : 'bg-success/10 text-success hover:bg-success/20'
                          }`}
                        >
                          {updatingId === user.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : user.isActive ? (
                            <PowerOff className="h-3.5 w-3.5" />
                          ) : (
                            <Power className="h-3.5 w-3.5" />
                          )}
                          {user.isActive ? t('deactivate') : t('activate')}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
