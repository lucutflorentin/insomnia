export const SITE_CONFIG = {
  name: 'Insomnia Tattoo',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://insomniatattoo.ro',
  email: process.env.NEXT_PUBLIC_STUDIO_EMAIL || 'contact@insomniatattoo.ro',
  phone: process.env.NEXT_PUBLIC_STUDIO_PHONE || '',
  address: 'Mamaia Nord, Constanta, Romania',
  googleMapsUrl: process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL || '',
};

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
