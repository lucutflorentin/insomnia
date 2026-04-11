'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-error">Link invalid. Te rugam sa soliciti un nou link de resetare.</p>
        <div className="mt-6">
          <Link href="/auth/forgot-password">
            <Button variant="secondary">Solicita link nou</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Parola trebuie sa aiba minim 8 caractere.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Parolele nu coincid.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'A aparut o eroare.');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Eroare de conexiune. Incearca din nou.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="font-heading text-2xl font-bold">Parola a fost resetata!</h2>
        <p className="mt-3 text-text-secondary">
          Te poti conecta acum cu noua parola.
        </p>
        <div className="mt-8">
          <Link href="/auth/login">
            <Button>Conecteaza-te</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-center font-heading text-2xl font-bold">
        Seteaza parola noua
      </h2>
      <p className="mt-2 text-center text-sm text-text-secondary">
        Alege o parola noua pentru contul tau.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input
          label="Parola noua"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minim 8 caractere"
          required
          minLength={8}
        />

        <Input
          label="Confirma parola"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeta parola"
          required
          minLength={8}
        />

        {error && (
          <p className="text-sm text-error">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Se reseteaza...' : 'Reseteaza parola'}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
