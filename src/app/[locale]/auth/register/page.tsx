'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (element: HTMLElement, config: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export default function RegisterPage() {
  const t = useTranslations('auth.register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const benefits = [
    t('benefits.tracking'),
    t('benefits.loyalty'),
    t('benefits.rebooking'),
  ];

  const handleGoogleCallback = useCallback(async (response: { credential: string }) => {
    setIsGoogleLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: response.credential }),
      });

      const data = await res.json();

      if (res.ok) {
        window.location.href = '/account';
      } else {
        setError(data.error || t('connectionError'));
      }
    } catch {
      setError(t('connectionError'));
    } finally {
      setIsGoogleLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCallback,
      });
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [handleGoogleCallback]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!gdprAccepted) {
      setError(t('gdprRequired'));
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, gdprAccepted }),
      });

      const data = await res.json();

      if (res.ok) {
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (loginRes.ok) {
          window.location.href = '/account';
        } else {
          window.location.href = '/auth/login';
        }
      } else {
        setError(data.error || t('error'));
      }
    } catch {
      setError(t('connectionError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleClick = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google) {
      setError(t('googleError'));
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCallback,
      auto_select: false,
    });

    const container = document.getElementById('google-btn-container-register');
    if (container) {
      container.innerHTML = '';
      window.google.accounts.id.renderButton(container, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        width: '100%',
      });
      const btn = container.querySelector('div[role="button"]') as HTMLElement;
      if (btn) btn.click();
    }
  };

  return (
    <div className="rounded-sm border border-border bg-bg-secondary p-8">
      <h2 className="mb-2 text-center font-heading text-2xl text-text-primary">
        {t('title')}
      </h2>
      <p className="mb-6 text-center text-sm text-text-muted">
        {t('subtitle')}
      </p>

      {/* Benefits */}
      <div className="mb-6 space-y-3 rounded-sm border border-border/50 bg-bg-primary/50 p-4">
        {benefits.map((benefit, i) => (
          <div key={i} className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-5 w-5 shrink-0 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-sm text-text-secondary">{benefit}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label={t('name')}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('namePlaceholder')}
          required
        />
        <Input
          label={t('email')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          required
        />
        <Input
          label={t('password')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('passwordPlaceholder')}
          minLength={8}
          required
        />

        {/* GDPR checkbox */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={gdprAccepted}
            onChange={(e) => setGdprAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 rounded-sm border-border bg-bg-primary accent-accent"
          />
          <span className="text-xs text-text-muted leading-relaxed">
            {t('gdpr')}
          </span>
        </label>

        {error && (
          <div className="rounded-sm border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" isLoading={isLoading}>
          {isLoading ? t('submitting') : t('submit')}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-text-muted">{t('or')}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={handleGoogleClick}
        disabled={isGoogleLoading}
        className="flex w-full items-center justify-center gap-3 rounded-sm border border-border bg-bg-primary px-6 py-3 text-sm text-text-primary transition-colors hover:border-accent/50 hover:bg-bg-tertiary disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        {isGoogleLoading ? t('googleLoading') : t('googleButton')}
      </button>

      <div id="google-btn-container-register" className="hidden" />

      <p className="mt-6 text-center text-sm text-text-muted">
        {t('hasAccount')}{' '}
        <Link
          href="/auth/login"
          className="text-accent transition-colors hover:text-accent-light"
        >
          {t('login')}
        </Link>
      </p>
    </div>
  );
}
