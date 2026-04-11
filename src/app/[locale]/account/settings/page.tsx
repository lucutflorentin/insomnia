'use client';

import { useState, useEffect } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  googleId?: string | null;
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setUser(json.data);
            setName(json.data.name || '');
            setPhone(json.data.phone || '');
          }
        }
      } catch {
        // Handle silently
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSaving(true);

    try {
      const res = await fetch('/api/client/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      });

      if (res.ok) {
        setSuccessMessage('Profilul a fost actualizat cu succes.');
        const json = await res.json();
        if (json.success) setUser(json.data);
      } else {
        const json = await res.json();
        setError(json.error || 'Eroare la actualizarea profilului.');
      }
    } catch {
      setError('Eroare de conexiune. Incearca din nou.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 8) {
      setPasswordError('Parola trebuie sa aiba minim 8 caractere.');
      return;
    }

    setIsChangingPassword(true);

    try {
      const res = await fetch('/api/client/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.ok) {
        setPasswordSuccess('Parola a fost schimbata cu succes.');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        const data = await res.json();
        setPasswordError(data.error || 'Parola curenta este incorecta.');
      }
    } catch {
      setPasswordError('Eroare de conexiune. Incearca din nou.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl text-text-primary">Setari cont</h1>

      <div className="space-y-8">
        {/* Profile Section */}
        <div className="rounded-sm border border-border bg-bg-secondary p-6">
          <h2 className="mb-4 font-heading text-lg text-text-primary">Informatii profil</h2>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <Input
              label="Nume complet"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Telefon"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+40 7XX XXX XXX"
            />
            <div>
              <label className="mb-2 block text-sm font-medium text-text-secondary">Email</label>
              <p className="rounded-sm border border-border bg-bg-primary px-4 py-3 text-sm text-text-muted">
                {user?.email}
              </p>
              <p className="mt-1 text-xs text-text-muted">Emailul nu poate fi modificat.</p>
            </div>

            {error && (
              <div className="rounded-sm border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="rounded-sm border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
                {successMessage}
              </div>
            )}

            <Button type="submit" isLoading={isSaving}>
              Salveaza modificarile
            </Button>
          </form>
        </div>

        {/* Password Section */}
        <div className="rounded-sm border border-border bg-bg-secondary p-6">
          <h2 className="mb-4 font-heading text-lg text-text-primary">Schimba parola</h2>

          <form onSubmit={handleChangePassword} className="space-y-5">
            <Input
              label="Parola curenta"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <Input
              label="Parola noua"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minim 8 caractere"
              minLength={8}
              required
            />

            {passwordError && (
              <div className="rounded-sm border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="rounded-sm border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
                {passwordSuccess}
              </div>
            )}

            <Button type="submit" variant="secondary" isLoading={isChangingPassword}>
              Schimba parola
            </Button>
          </form>
        </div>

        {/* Google Account Section */}
        <div className="rounded-sm border border-border bg-bg-secondary p-6">
          <h2 className="mb-4 font-heading text-lg text-text-primary">Cont Google</h2>

          {user?.googleId ? (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <svg className="h-5 w-5 text-success" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-text-primary">Cont Google conectat</p>
                <p className="text-xs text-text-muted">Poti folosi Google pentru autentificare rapida.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-primary">
                <svg className="h-5 w-5 text-text-muted" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-text-primary">Cont Google neconectat</p>
                <p className="text-xs text-text-muted">
                  Conecteaza-ti contul Google pentru autentificare mai rapida.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
