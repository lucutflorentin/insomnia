'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

function GuestDataInner({ initialToken }: { initialToken?: string | null }) {
  const t = useTranslations('guestData');
  const tGuest = useRef(t);
  tGuest.current = t;
  const locale = useLocale();
  const searchParams = useSearchParams();

  /** Token from URL: SPA hook + SSR prop + real URL (covers dev / i18n edge cases). */
  const [linkToken, setLinkToken] = useState<string | null>(null);

  const lastConfirmedToken = useRef<string | null>(null);

  const [email, setEmail] = useState('');
  const [phase, setPhase] = useState<'form' | 'requested' | 'confirmed' | 'error'>('form');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const fromSp = searchParams.get('token')?.trim() ?? '';
    const fromProp = typeof initialToken === 'string' ? initialToken.trim() : '';
    const fromWin =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('token')?.trim() ?? ''
        : '';
    const merged = fromSp || fromProp || fromWin || null;
    setLinkToken(merged);

    if (!merged || merged.length < 32) return;
    if (lastConfirmedToken.current === merged) return;
    lastConfirmedToken.current = merged;

    (async () => {
      setBusy(true);
      try {
        const res = await fetch('/api/gdpr/guest-erasure/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: merged }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setPhase('confirmed');
          setMessage(tGuest.current('confirmSuccess'));
        } else {
          setPhase('error');
          setMessage(
            data.error === 'Link expired'
              ? tGuest.current('confirmExpired')
              : tGuest.current('confirmError'),
          );
        }
      } catch {
        setPhase('error');
        setMessage(tGuest.current('confirmError'));
      } finally {
        setBusy(false);
      }
    })();
  }, [searchParams, initialToken]);

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    setPhase('form');
    try {
      const res = await fetch('/api/gdpr/guest-erasure/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          language: locale === 'en' ? 'en' : 'ro',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPhase('requested');
        setMessage(data.message || t('requestSuccess'));
      } else {
        setPhase('error');
        setMessage(data.error || t('requestError'));
      }
    } catch {
      setPhase('error');
      setMessage(t('requestError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 pb-16 pt-6">
      <h1 className="mb-4 font-heading text-3xl font-bold text-text-primary">
        {t('title')}
      </h1>
      <p className="mb-8 text-sm leading-relaxed text-text-secondary">{t('intro')}</p>

      {phase === 'confirmed' && (
        <div className="rounded-sm border border-success/30 bg-success/10 p-4 text-sm text-success">
          {message}
        </div>
      )}

      {phase === 'error' && message && (
        <div
          data-testid="gdpr-confirm-error"
          className="mb-6 rounded-sm border border-error/30 bg-error/10 p-4 text-sm text-error"
        >
          {message}
        </div>
      )}

      {phase === 'requested' && (
        <div className="rounded-sm border border-accent/30 bg-accent/5 p-4 text-sm text-text-secondary">
          {message}
        </div>
      )}

      {phase === 'form' && !linkToken && (
        <form onSubmit={submitRequest} className="space-y-4">
          <Input
            type="email"
            required
            autoComplete="email"
            label={t('emailLabel')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('emailPlaceholder')}
          />
          <Button type="submit" isLoading={busy} className="w-full sm:w-auto">
            {t('submit')}
          </Button>
          <p className="text-xs text-text-muted">{t('hint')}</p>
        </form>
      )}

      {linkToken && busy && (
        <p className="text-sm text-text-muted">{t('confirming')}</p>
      )}

      <p className="mt-10 text-sm">
        <Link href="/privacy" className="text-accent underline underline-offset-2 hover:opacity-90">
          {t('backPrivacy')}
        </Link>
      </p>
    </div>
  );
}

export default function GuestDataClient({ initialToken }: { initialToken?: string | null }) {
  return <GuestDataInner initialToken={initialToken} />;
}
