'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, BellOff } from 'lucide-react';

export default function PushToggle() {
  const t = useTranslations('common.push');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const checkSupport = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;

      setIsSupported(true);

      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      } catch {
        // Can't check subscription
      }
    };

    checkSupport();
  }, []);

  const subscribe = async () => {
    setIsLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setIsLoading(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const vapidKey = urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      );
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey.buffer as ArrayBuffer,
      });

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(sub.getKey('p256dh')!),
            auth: arrayBufferToBase64(sub.getKey('auth')!),
          },
        }),
      });

      if (res.ok) {
        setIsSubscribed(true);
      }
    } catch {
      // Subscription failed
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
    } catch {
      // Unsubscribe failed
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) return null;

  return (
    <button
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={isLoading}
      className={`flex items-center gap-2 rounded-sm px-4 py-2 text-sm transition-colors ${
        isSubscribed
          ? 'bg-accent/10 text-accent hover:bg-accent/20'
          : 'border border-border text-text-muted hover:border-accent/30 hover:text-text-primary'
      } disabled:opacity-50`}
    >
      {isSubscribed ? (
        <Bell className="h-4 w-4" />
      ) : (
        <BellOff className="h-4 w-4" />
      )}
      {isLoading
        ? t('loading')
        : isSubscribed
          ? t('enabled')
          : t('enable')}
    </button>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
