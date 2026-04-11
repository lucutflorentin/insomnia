'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="ro">
      <body style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0A0A0A',
        color: '#F5F5F5',
        fontFamily: 'Inter, Arial, sans-serif',
        margin: 0,
      }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{
            fontSize: '6rem',
            fontWeight: 'bold',
            color: 'rgba(176, 176, 176, 0.3)',
            margin: 0,
            lineHeight: 1,
          }}>
            500
          </p>
          <h1 style={{ fontSize: '1.5rem', marginTop: '1rem' }}>
            Ceva nu a mers bine
          </h1>
          <p style={{ color: '#A0A0A0', marginTop: '0.5rem' }}>
            A aparut o eroare neasteptata. Te rugam sa incerci din nou.
          </p>
          <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              onClick={reset}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#B0B0B0',
                color: '#0A0A0A',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Incearca din nou
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'transparent',
                color: '#F5F5F5',
                border: '1px solid #2A2A2A',
                borderRadius: '0.25rem',
                textDecoration: 'none',
                fontSize: '0.875rem',
              }}
            >
              Acasa
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
