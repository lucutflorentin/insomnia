'use client';

import { useEffect, useRef } from 'react';

export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only on desktop (no touch)
    if (typeof window === 'undefined') return;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    const glow = glowRef.current;
    if (!glow) return;

    let rafId: number;

    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        glow.style.setProperty('--glow-x', `${e.clientX}px`);
        glow.style.setProperty('--glow-y', `${e.clientY}px`);
        glow.style.opacity = '1';
      });
    };

    const handleMouseLeave = () => {
      glow.style.opacity = '0';
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed inset-0 z-30 opacity-0 transition-opacity duration-300"
      style={{
        background:
          'radial-gradient(600px circle at var(--glow-x, -999px) var(--glow-y, -999px), rgba(176, 176, 176, 0.06), transparent 40%)',
      }}
      aria-hidden="true"
    />
  );
}
