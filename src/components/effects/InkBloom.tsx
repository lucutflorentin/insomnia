'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Drop {
  cx: number;
  cy: number;
  r: number;
  delay: number;
  opacity: number;
}

const DROPS: Drop[] = [
  { cx: 50, cy: 50, r: 18, delay: 0, opacity: 0.18 },
  { cx: 30, cy: 32, r: 8, delay: 0.18, opacity: 0.14 },
  { cx: 72, cy: 38, r: 11, delay: 0.32, opacity: 0.16 },
  { cx: 20, cy: 70, r: 9, delay: 0.45, opacity: 0.12 },
  { cx: 78, cy: 72, r: 13, delay: 0.55, opacity: 0.15 },
  { cx: 50, cy: 18, r: 6, delay: 0.7, opacity: 0.1 },
  { cx: 50, cy: 82, r: 7, delay: 0.85, opacity: 0.1 },
];

/**
 * Background ink bloom — soft silver droplets ripple outward from centre on
 * mount. Stays decorative; pointer-events disabled so it never blocks clicks.
 * Disabled when the user prefers reduced motion.
 */
export default function InkBloom({ className = '' }: { className?: string }) {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    setReduce(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  if (reduce) return null;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    >
      <defs>
        <radialGradient id="inkGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(176,176,176,0.25)" />
          <stop offset="100%" stopColor="rgba(176,176,176,0)" />
        </radialGradient>
      </defs>
      {DROPS.map((d, i) => (
        <motion.circle
          key={i}
          cx={d.cx}
          cy={d.cy}
          fill="url(#inkGradient)"
          initial={{ r: 0, opacity: 0 }}
          animate={{ r: d.r, opacity: d.opacity }}
          transition={{
            r: { duration: 1.6, delay: d.delay, ease: [0.25, 0.46, 0.45, 0.94] },
            opacity: { duration: 0.8, delay: d.delay },
          }}
        />
      ))}
    </svg>
  );
}
