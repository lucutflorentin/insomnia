'use client';

import { useEffect } from 'react';
import Button from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <div className="text-center">
        <p className="font-heading text-8xl font-bold text-accent/30">500</p>
        <h1 className="mt-4 font-heading text-3xl font-bold sm:text-4xl">
          Ceva nu a mers bine
        </h1>
        <p className="mt-3 text-lg text-text-secondary">
          A aparut o eroare neasteptata. Te rugam sa incerci din nou.
        </p>
        <div className="mx-auto mt-6 h-px w-16 bg-accent/30" />
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset}>Incearca din nou</Button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/">
            <Button variant="secondary">Acasa</Button>
          </a>
        </div>
      </div>
    </div>
  );
}
