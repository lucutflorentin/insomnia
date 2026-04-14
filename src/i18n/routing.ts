import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ro', 'en'],
  defaultLocale: 'ro',
  localePrefix: 'as-needed',
  pathnames: {
    '/': '/',
    '/artists/[slug]': {
      ro: '/artisti/[slug]',
      en: '/artists/[slug]',
    },
    '/ink-space': {
      ro: '/spatiul-ink',
      en: '/ink-space',
    },
    '/booking': {
      ro: '/booking',
      en: '/booking',
    },
    '/aftercare': {
      ro: '/aftercare',
      en: '/aftercare',
    },
    '/good-to-know': {
      ro: '/bun-de-stiut',
      en: '/good-to-know',
    },
    '/privacy': {
      ro: '/confidentialitate',
      en: '/privacy',
    },
    '/terms': {
      ro: '/termeni',
      en: '/terms',
    },
    '/cookies': {
      ro: '/politica-cookies',
      en: '/cookies',
    },
    '/about': {
      ro: '/despre-noi',
      en: '/about',
    },
    '/contact': {
      ro: '/contact',
      en: '/contact',
    },
    '/auth/login': {
      ro: '/autentificare',
      en: '/auth/login',
    },
    '/auth/register': {
      ro: '/inregistrare',
      en: '/auth/register',
    },
    '/account': {
      ro: '/contul-meu',
      en: '/account',
    },
    '/account/bookings': {
      ro: '/contul-meu/programari',
      en: '/account/bookings',
    },
    '/account/loyalty': {
      ro: '/contul-meu/puncte',
      en: '/account/loyalty',
    },
    '/account/settings': {
      ro: '/contul-meu/setari',
      en: '/account/settings',
    },
    '/account/reviews': {
      ro: '/contul-meu/recenzii',
      en: '/account/reviews',
    },
    '/account/favorites': {
      ro: '/contul-meu/favorite',
      en: '/account/favorites',
    },
    '/auth/forgot-password': {
      ro: '/recuperare-parola',
      en: '/auth/forgot-password',
    },
    '/auth/reset-password': {
      ro: '/resetare-parola',
      en: '/auth/reset-password',
    },
    '/auth/verify-email': {
      ro: '/verificare-email',
      en: '/auth/verify-email',
    },
    '/admin': '/admin',
    '/admin/bookings': '/admin/bookings',
    '/admin/availability': '/admin/availability',
    '/admin/gallery': '/admin/gallery',
    '/admin/artists': '/admin/artists',
    '/admin/reviews': '/admin/reviews',
    '/admin/loyalty': '/admin/loyalty',
    '/admin/users': '/admin/users',
    '/admin/settings': '/admin/settings',
    '/admin/content': '/admin/content',
    '/admin/audit-log': '/admin/audit-log',
    '/artist': '/artist',
    '/artist/bookings': '/artist/bookings',
    '/artist/gallery': '/artist/gallery',
    '/artist/availability': '/artist/availability',
    '/artist/reviews': '/artist/reviews',
    '/artist/profile': '/artist/profile',
  },
});

export type Pathnames = keyof typeof routing.pathnames;
export type Locale = (typeof routing.locales)[number];
