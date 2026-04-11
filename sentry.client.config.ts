import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: 0.1,

  // Session replay for error reproduction
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  // Only report errors in production
  environment: process.env.NODE_ENV,
});
