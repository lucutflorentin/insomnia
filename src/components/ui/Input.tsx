'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, required, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const describedByIds = [
      ariaDescribedBy,
      hint && inputId ? `${inputId}-hint` : undefined,
      error && inputId ? `${inputId}-error` : undefined,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 flex items-center gap-1 text-sm font-medium text-text-secondary"
          >
            <span>{label}</span>
            {required && (
              <span aria-hidden="true" className="text-error">
                *
              </span>
            )}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedByIds}
          required={required}
          className={cn(
            'w-full rounded-sm border border-border bg-bg-secondary px-4 py-3 text-text-primary placeholder:text-text-muted transition-colors duration-200',
            'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50',
            error && 'border-error focus:border-error focus:ring-error/50',
            className,
          )}
          {...props}
        />
        {hint && !error && (
          <p
            id={inputId ? `${inputId}-hint` : undefined}
            className="mt-1 text-xs text-text-muted"
          >
            {hint}
          </p>
        )}
        {error && (
          <p
            id={inputId ? `${inputId}-error` : undefined}
            role="alert"
            className="mt-1 text-sm text-error"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
