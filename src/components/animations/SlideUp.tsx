'use client';

import { motion } from 'framer-motion';

interface SlideUpProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  offset?: number;
  className?: string;
}

export default function SlideUp({
  children,
  delay = 0,
  duration = 0.6,
  offset = 30,
  className,
}: SlideUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: offset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
