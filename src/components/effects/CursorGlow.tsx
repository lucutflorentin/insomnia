'use client';

import { useEffect, useRef, useState } from 'react';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

let nextRipple = 0;

/**
 * Cursor glow + click ripple. Soft silver light follows the pointer; on click,
 * a single ink-drop ripple expands and fades. Skipped on touch devices and
 * when the user prefers reduced motion.
 */
export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const glow = glowRef.current;
    let rafId = 0;

    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!glow) return;
        glow.style.setProperty('--glow-x', `${e.clientX}px`);
        glow.style.setProperty('--glow-y', `${e.clientY}px`);
        glow.style.opacity = '1';
      });
    };

    const onLeave = () => {
      if (glow) glow.style.opacity = '0';
    };

    const onClick = (e: MouseEvent) => {
      if (reduce) return;
      const id = ++nextRipple;
      setRipples((prev) => [...prev, { id, x: e.clientX, y: e.clientY }]);
      // Auto-cleanup the ripple after the CSS animation finishes
      window.setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 700);
    };

    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('click', onClick);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('click', onClick);
    };
  }, []);

  return (
    <>
      <div
        ref={glowRef}
        className="pointer-events-none fixed inset-0 z-30 opacity-0 transition-opacity duration-300"
        style={{
          background:
            'radial-gradient(640px circle at var(--glow-x, -999px) var(--glow-y, -999px), rgba(176, 176, 176, 0.07), transparent 42%)',
        }}
        aria-hidden="true"
      />
      <div className="pointer-events-none fixed inset-0 z-30" aria-hidden="true">
        {ripples.map((r) => (
          <span
            key={r.id}
            className="cursor-ripple"
            style={{ left: r.x, top: r.y }}
          />
        ))}
      </div>
    </>
  );
}
