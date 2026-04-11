import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-sm border border-border bg-bg-secondary p-6',
        hover &&
          'transition-all duration-300 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5',
        className,
      )}
    >
      {children}
    </div>
  );
}
