'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  /** Tween duration in ms (default 600). */
  duration?: number;
  /** Optional decimal places (default 0). */
  decimals?: number;
  /** Suffix shown after the number (e.g. " RON"). */
  suffix?: string;
  className?: string;
}

/**
 * Tween a number from its previous render to the new value with a soft
 * ease-out curve. Skips animation when the user prefers reduced motion.
 */
export default function AnimatedNumber({
  value,
  duration = 600,
  decimals = 0,
  suffix,
  className,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      fromRef.current = value;
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const from = fromRef.current;
    const delta = value - from;

    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + delta * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = value;
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  const formatted = display.toFixed(decimals);

  return (
    <span className={className}>
      {formatted}
      {suffix}
    </span>
  );
}
