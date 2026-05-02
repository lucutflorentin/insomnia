const STUDIO_ADDRESS = 'Str. D10, Nr. 11 Bis, Ap. 2, Mamaia Nord, Constanta';
const DEFAULT_GOOGLE_MAPS_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(STUDIO_ADDRESS)}&output=embed`;

export const SITE_CONFIG = {
  name: 'Insomnia Tattoo',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://insomniatattoo.ro',
  email: process.env.NEXT_PUBLIC_STUDIO_EMAIL || 'contact@insomniatattoo.ro',
  phone: process.env.NEXT_PUBLIC_STUDIO_PHONE || '',
  address: STUDIO_ADDRESS,
  googleMapsUrl:
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL ||
    DEFAULT_GOOGLE_MAPS_EMBED_URL,
};

export const STUDIO_HOURS = {
  ro: {
    main: 'Luni - Duminica: 12:00 - 20:00',
    note: 'Se lucreaza strict in functie de programari in intervalul afisat.',
  },
  en: {
    main: 'Monday - Sunday: 12:00 - 20:00',
    note: 'Work is done strictly by appointment within the displayed interval.',
  },
} as const;

export const SOCIAL_LINKS = {
  instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || 'https://instagram.com/insomniatattoo',
  instagramMadalina: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM_MADALINA || 'https://instagram.com/madalina.insomnia',
  instagramFlorentin: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM_FLORENTIN || 'https://instagram.com/florentin.insomnia',
  tiktok: process.env.NEXT_PUBLIC_SOCIAL_TIKTOK || 'https://tiktok.com/@insomniatattoo',
  facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK || 'https://facebook.com/insomniatattoo',
};

export const NAV_ITEMS = [
  { key: 'artists', href: '/' as const, scrollTo: 'artists' },
  { key: 'inkSpace', href: '/ink-space' as const },
  { key: 'goodToKnow', href: '/good-to-know' as const },
] as const;

export const NAV_CTA = {
  key: 'booking',
  href: '/booking' as const,
} as const;

export const BOOKING_CONFIG = {
  maxReferenceImages: 3,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
  consultationDurationMinutes: 60,
  advanceDays: 30,
} as const;

export const GALLERY_UPLOAD_CONFIG = {
  maxFileSize: 15 * 1024 * 1024, // 15MB, friendlier for modern phone photos
  allowedFileTypes: BOOKING_CONFIG.allowedFileTypes,
} as const;

export const BODY_AREAS = [
  'arm',
  'forearm',
  'shoulder',
  'back',
  'chest',
  'ribs',
  'leg',
  'calf',
  'thigh',
  'hand',
  'neck',
  'other',
] as const;

export const SIZE_CATEGORIES = ['small', 'medium', 'large', 'sleeve'] as const;

export const TATTOO_STYLES = [
  'realism',
  'graphic',
  'linework',
  'geometric',
  'minimalist',
  'blackwork',
  'color',
  'blackgrey',
  'other',
] as const;

export const BOOKING_STATUSES = [
  'new',
  'contacted',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
] as const;

export const BOOKING_SOURCES = [
  'instagram',
  'tiktok',
  'google',
  'referral',
  'walk_in',
  'other',
] as const;

// Artists are now 100% DB-driven — no hardcoded data.
// Use /api/artists or prisma.artist.findMany() for artist data.
