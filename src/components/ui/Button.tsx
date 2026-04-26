'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type MouseEvent,
} from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  /** Enable magnetic hover effect (subtle pull toward cursor). Default: true on primary. */
  magnetic?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-bg-primary hover:bg-accent-hover font-semibold',
  secondary: 'border border-accent text-accent hover:bg-accent hover:text-bg-primary',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary',
  danger: 'bg-error text-white hover:bg-red-700',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

const MAX_PULL_PX = 6;

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      magnetic,
      disabled,
      children,
      onMouseMove,
      onMouseLeave,
      style,
      ...props
    },
    ref,
  ) => {
    const internalRef = useRef<HTMLButtonElement>(null);
    const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [enabled, setEnabled] = useState(false);

    const magneticOn = magnetic ?? variant === 'primary';

    useEffect(() => {
      if (!magneticOn) return;
      const isTouch = window.matchMedia('(pointer: coarse)').matches;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setEnabled(!isTouch && !reduce);
    }, [magneticOn]);

    const handleMove = useCallback(
      (e: MouseEvent<HTMLButtonElement>) => {
        onMouseMove?.(e);
        if (!enabled) return;
        const el = internalRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);
        setOffset({
          x: Math.max(-1, Math.min(1, dx)) * MAX_PULL_PX,
          y: Math.max(-1, Math.min(1, dy)) * MAX_PULL_PX,
        });
      },
      [enabled, onMouseMove],
    );

    const handleLeave = useCallback(
      (e: MouseEvent<HTMLButtonElement>) => {
        onMouseLeave?.(e);
        if (!enabled) return;
        setOffset({ x: 0, y: 0 });
      },
      [enabled, onMouseLeave],
    );

    return (
      <button
        ref={(node) => {
          internalRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn(
          'inline-flex items-center justify-center rounded-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50',
          variantStyles[variant],
          sizeStyles[size],
          (disabled || isLoading) && 'cursor-not-allowed opacity-50',
          className,
        )}
        disabled={disabled || isLoading}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={
          enabled && (offset.x !== 0 || offset.y !== 0)
            ? { transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`, ...style }
            : style
        }
        {...props}
      >
        {isLoading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
