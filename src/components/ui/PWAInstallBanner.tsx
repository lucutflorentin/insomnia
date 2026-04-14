'use client';

import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if dismissed recently
    const dismissedAt = localStorage.getItem('pwa_dismissed_at');
    if (dismissedAt) {
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - parseInt(dismissedAt) < sevenDays) return;
    }

    // Check visit count (show after 2 visits)
    const visits = parseInt(localStorage.getItem('pwa_visits') || '0') + 1;
    localStorage.setItem('pwa_visits', String(visits));

    // Don't show if already installed (standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone;
    if (isStandalone) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (visits >= 2) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa_dismissed_at', String(Date.now()));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-accent/20 bg-bg-secondary/95 px-4 py-3 backdrop-blur-md sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-sm sm:rounded-sm sm:border sm:shadow-lg">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
          <Download className="h-5 w-5 text-accent" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-text-primary">
            Instaleaza Insomnia Tattoo
          </p>
          <p className="text-xs text-text-muted">
            Acces rapid direct de pe ecranul principal
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleInstall}
            className="rounded-sm bg-accent px-3 py-1.5 text-xs font-medium text-bg-primary hover:bg-accent/80"
          >
            Instaleaza
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-sm p-1.5 text-text-muted hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
