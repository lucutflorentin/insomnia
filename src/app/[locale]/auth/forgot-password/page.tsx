'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.status === 429) {
        setError('Prea multe incercari. Te rugam sa astepti cateva minute.');
        return;
      }

      setSent(true);
    } catch {
      setError('Eroare de conexiune. Incearca din nou.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <h2 className="font-heading text-2xl font-bold">Verifica email-ul</h2>
        <p className="mt-3 text-text-secondary">
          Daca exista un cont asociat cu <strong className="text-text-primary">{email}</strong>, vei primi un link de resetare a parolei.
        </p>
        <p className="mt-2 text-sm text-text-muted">
          Verifica si folder-ul de spam. Link-ul expira in 1 ora.
        </p>
        <div className="mt-8">
          <Link href="/auth/login">
            <Button variant="secondary">Inapoi la autentificare</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-center font-heading text-2xl font-bold">
        Ai uitat parola?
      </h2>
      <p className="mt-2 text-center text-sm text-text-secondary">
        Introdu adresa de email si iti vom trimite un link de resetare.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="adresa@email.com"
          required
        />

        {error && (
          <p className="text-sm text-error">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Se trimite...' : 'Trimite link de resetare'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        Ti-ai amintit parola?{' '}
        <Link href="/auth/login" className="text-accent hover:underline">
          {t('login.title')}
        </Link>
      </p>
    </div>
  );
}
