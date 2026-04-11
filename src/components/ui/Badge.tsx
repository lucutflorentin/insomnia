import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'accent' | 'success' | 'error' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-bg-secondary text-text-secondary',
  accent: 'bg-accent/10 text-accent border border-accent/20',
  success: 'bg-success/10 text-success',
  error: 'bg-error/10 text-error',
  outline: 'border border-border text-text-secondary',
};

export default function Badge({
  children,
  variant = 'default',
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
