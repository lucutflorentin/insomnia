import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative overflow-hidden rounded-sm bg-bg-secondary',
        // Shimmer track — Tailwind 4 picks up `--animate-shimmer` from globals.css.
        'before:absolute before:inset-0 before:-translate-x-full',
        'before:bg-[linear-gradient(90deg,transparent,rgba(176,176,176,0.08),transparent)]',
        'before:bg-[length:200%_100%] before:animate-shimmer',
        className,
      )}
    />
  );
}
