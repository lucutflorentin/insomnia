'use client';

import { cn } from '@/lib/utils';

interface LoadingDripProps {
  className?: string;
  /** Visually hidden label for screen readers (default: "Loading"). */
  label?: string;
}

/**
 * Three ink droplets falling in sequence — Insomnia signature loader.
 * The keyframe `ink-drip` is registered in globals.css and respects
 * `prefers-reduced-motion`.
 */
export default function LoadingDrip({ className, label = 'Loading' }: LoadingDripProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('relative flex h-12 w-12 items-end justify-center gap-1', className)}
    >
      <span className="sr-only">{label}</span>
      {[0, 0.18, 0.36].map((delay, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="block h-2 w-2 rounded-full bg-accent animate-ink-drip"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  );
}
