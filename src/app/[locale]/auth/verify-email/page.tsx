'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import Button from '@/components/ui/Button';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-token'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await res.json();

        if (data.success) {
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMessage(data.error || 'Verificarea a esuat.');
        }
      } catch {
        setStatus('error');
        setErrorMessage('Eroare de conexiune.');
      }
    };

    verify();
  }, [token]);

  const handleResend = async () => {
    if (!resendEmail) return;
    setResendStatus('sending');

    try {
      await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      });
      setResendStatus('sent');
    } catch {
      setResendStatus('idle');
    }
  };

  if (status === 'loading') {
    return (
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
        <p className="mt-4 text-text-secondary">Se verifica email-ul...</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="font-heading text-2xl font-bold">Email verificat!</h2>
        <p className="mt-3 text-text-secondary">
          Contul tau a fost verificat cu succes. Te poti conecta acum.
        </p>
        <div className="mt-8">
          <Link href="/auth/login">
            <Button>Conecteaza-te</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'no-token') {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <h2 className="font-heading text-2xl font-bold">Verifica email-ul</h2>
        <p className="mt-3 text-text-secondary">
          Verifica inbox-ul pentru link-ul de verificare. Daca nu l-ai primit, solicita unul nou.
        </p>

        <div className="mx-auto mt-6 max-w-sm space-y-3">
          <input
            type="email"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            placeholder="adresa@email.com"
            className="w-full rounded-sm border border-border bg-bg-secondary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
          <Button
            className="w-full"
            variant="secondary"
            onClick={handleResend}
            disabled={resendStatus !== 'idle' || !resendEmail}
          >
            {resendStatus === 'sending'
              ? 'Se trimite...'
              : resendStatus === 'sent'
                ? 'Link trimis!'
                : 'Retrimite link de verificare'}
          </Button>
        </div>

        <div className="mt-6">
          <Link href="/auth/login" className="text-sm text-accent hover:underline">
            Inapoi la autentificare
          </Link>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
        <svg className="h-8 w-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h2 className="font-heading text-2xl font-bold">Verificare esuata</h2>
      <p className="mt-3 text-text-secondary">{errorMessage}</p>

      <div className="mx-auto mt-6 max-w-sm space-y-3">
        <input
          type="email"
          value={resendEmail}
          onChange={(e) => setResendEmail(e.target.value)}
          placeholder="adresa@email.com"
          className="w-full rounded-sm border border-border bg-bg-secondary px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
        <Button
          className="w-full"
          variant="secondary"
          onClick={handleResend}
          disabled={resendStatus !== 'idle' || !resendEmail}
        >
          {resendStatus === 'sending'
            ? 'Se trimite...'
            : resendStatus === 'sent'
              ? 'Link trimis!'
              : 'Solicita link nou'}
        </Button>
      </div>

      <div className="mt-6">
        <Link href="/auth/login" className="text-sm text-accent hover:underline">
          Inapoi la autentificare
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
