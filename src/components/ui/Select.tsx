'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({
    className,
    label,
    error,
    hint,
    options,
    placeholder,
    id,
    required,
    'aria-describedby': ariaDescribedBy,
    ...props
  }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const describedByIds = [
      ariaDescribedBy,
      hint && selectId ? `${selectId}-hint` : undefined,
      error && selectId ? `${selectId}-error` : undefined,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
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
        <select
          ref={ref}
          id={selectId}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedByIds}
          required={required}
          className={cn(
            'w-full rounded-sm border border-border bg-bg-secondary px-4 py-3 text-text-primary transition-colors duration-200 appearance-none',
            'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50',
            error && 'border-error focus:border-error focus:ring-error/50',
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" className="text-text-muted">
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {hint && !error && (
          <p
            id={selectId ? `${selectId}-hint` : undefined}
            className="mt-1 text-xs text-text-muted"
          >
            {hint}
          </p>
        )}
        {error && (
          <p
            id={selectId ? `${selectId}-error` : undefined}
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

Select.displayName = 'Select';

export default Select;
