'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

const POPOVER_WIDTH = 360;
const VIEWPORT_MARGIN = 16;
const POPOVER_GAP = 8;

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const updatePopoverPosition = useCallback(() => {
    if (!buttonRef.current || typeof window === 'undefined') return;

    const rect = buttonRef.current.getBoundingClientRect();
    const width = Math.min(POPOVER_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
    const left = Math.min(
      Math.max(VIEWPORT_MARGIN, rect.right - width),
      window.innerWidth - width - VIEWPORT_MARGIN,
    );
    const top = Math.min(
      rect.bottom + POPOVER_GAP,
      Math.max(VIEWPORT_MARGIN, window.innerHeight - 240),
    );
    const maxHeight = Math.max(
      220,
      Math.min(420, window.innerHeight - top - VIEWPORT_MARGIN),
    );

    setPopoverStyle({
      left,
      top,
      width,
      maxHeight,
    });
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    updatePopoverPosition();
    window.addEventListener('resize', updatePopoverPosition);
    window.addEventListener('scroll', updatePopoverPosition, true);

    return () => {
      window.removeEventListener('resize', updatePopoverPosition);
      window.removeEventListener('scroll', updatePopoverPosition, true);
    };
  }, [isOpen, updatePopoverPosition]);

  // Fetch notifications
  useEffect(() => {
    if (!user) return;

    const controller = new AbortController();

    const fetchNotifications = () => {
      fetch('/api/notifications?limit=10', { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.success) {
            setNotifications(data.data || []);
            setUnreadCount(data.unreadCount || 0);
          }
        })
        .catch(() => {});
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every 60s
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [user]);

  const handleMarkAllRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'PUT' });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleClick = async (notification: Notification) => {
    if (!notification.isRead) {
      fetch(`/api/notifications/${notification.id}/read`, { method: 'PUT' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notificari"
        aria-expanded={isOpen}
        className="relative rounded-lg p-2 text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-bg-primary">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          data-notification-popover
          className="fixed z-[70] rounded-sm border border-border bg-bg-secondary shadow-2xl shadow-black/40"
          style={popoverStyle ?? undefined}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-medium text-text-primary">Notificari</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-accent hover:underline"
              >
                Marcheaza toate ca citite
              </button>
            )}
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: popoverStyle?.maxHeight }}>
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-text-muted">
                Nicio notificare
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    'w-full border-b border-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-bg-tertiary',
                    !n.isRead && 'bg-accent/5',
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                    )}
                    <div className={cn(!n.isRead ? '' : 'pl-4')}>
                      <p className="text-sm font-medium text-text-primary">{n.title}</p>
                      <p className="mt-0.5 text-xs text-text-muted line-clamp-2">{n.message}</p>
                      <p className="mt-1 text-[10px] text-text-muted">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Acum';
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}z`;
}
