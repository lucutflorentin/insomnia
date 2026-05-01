'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, required, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const describedByIds = [
      ariaDescribedBy,
      hint && textareaId ? `${textareaId}-hint` : undefined,
      error && textareaId ? `${textareaId}-error` : undefined,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
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
        <textarea
          ref={ref}
          id={textareaId}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedByIds}
          required={required}
          className={cn(
            'w-full rounded-sm border border-border bg-bg-secondary px-4 py-3 text-text-primary placeholder:text-text-muted transition-colors duration-200 resize-y min-h-[120px]',
            'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50',
            error && 'border-error focus:border-error focus:ring-error/50',
            className,
          )}
          {...props}
        />
        {hint && !error && (
          <p
            id={textareaId ? `${textareaId}-hint` : undefined}
            className="mt-1 text-xs text-text-muted"
          >
            {hint}
          </p>
        )}
        {error && (
          <p
            id={textareaId ? `${textareaId}-error` : undefined}
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

Textarea.displayName = 'Textarea';

export default Textarea;
