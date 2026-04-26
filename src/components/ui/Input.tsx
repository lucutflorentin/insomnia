'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className={cn('w-full', error && 'animate-shake')}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error || undefined}
          aria-describedby={errorId}
          className={cn(
            'w-full rounded-sm border border-border bg-bg-secondary px-4 py-3 text-text-primary placeholder:text-text-muted transition-all duration-200',
            'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50',
            error && 'border-error shadow-[0_0_0_3px_rgba(217,79,79,0.15)] focus:border-error focus:ring-error/50',
            className,
          )}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" aria-live="polite" className="mt-1 text-sm text-error">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
