import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const CSP_REPORT_TO_GROUP = 'insomnia-csp';
const isProduction = process.env.NODE_ENV === 'production';

const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  ...(isProduction ? [] : ["'unsafe-eval'"]),
  'https://accounts.google.com',
  'https://www.googletagmanager.com',
  'https://connect.facebook.net',
];

const cspDirectives = [
  "default-src 'self'",
  `script-src ${scriptSrc.join(' ')}`,
  "style-src 'self' 'unsafe-inline' https://accounts.google.com https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://*.googleusercontent.com https://lh3.googleusercontent.com https://*.public.blob.vercel-storage.com",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://oauth2.googleapis.com https://accounts.google.com https://www.google-analytics.com https://region1.google-analytics.com https://*.ingest.sentry.io",
  "frame-src https://accounts.google.com https://www.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
];

if (isProduction) {
  cspDirectives.push('upgrade-insecure-requests');
}

/** Legacy CSP violation reporting (widely supported). */
const cspReportUri = process.env.CSP_REPORT_URI?.trim();
if (cspReportUri) {
  cspDirectives.push(`report-uri ${cspReportUri}`);
}

/** CSP Level 3: pairs with `Reporting-Endpoints` header (modern browsers). */
const cspReportToUrl = process.env.CSP_REPORT_TO?.trim();
let reportingEndpointsHeader: { key: string; value: string } | null = null;
if (cspReportToUrl) {
  try {
    const parsed = new URL(cspReportToUrl);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      cspDirectives.push(`report-to ${CSP_REPORT_TO_GROUP}`);
      reportingEndpointsHeader = {
        key: 'Reporting-Endpoints',
        value: `${CSP_REPORT_TO_GROUP}="${cspReportToUrl}"`,
      };
    }
  } catch {
    // ignore invalid URL
  }
}

const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  ...(reportingEndpointsHeader ? [reportingEndpointsHeader] : []),
  {
    key: 'Content-Security-Policy',
    value: cspDirectives.join('; '),
  },
];

const noIndexHeaders = [
  {
    key: 'X-Robots-Tag',
    value: 'noindex, nofollow, noarchive',
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'insomniatattoo.ro',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/:section(admin|artist|account|auth)/:path*',
        headers: noIndexHeaders,
      },
      {
        source: '/:locale(ro|en)/:section(admin|artist|account|auth)/:path*',
        headers: noIndexHeaders,
      },
    ];
  },
};

const sentryConfig = withSentryConfig(withNextIntl(nextConfig), {
  // Only upload source maps when SENTRY_AUTH_TOKEN is set
  silent: !process.env.SENTRY_AUTH_TOKEN,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});

export default sentryConfig;
