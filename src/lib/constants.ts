export const SITE_CONFIG = {
  name: 'Insomnia Tattoo',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://insomniatattoo.ro',
  email: 'contact@insomniatattoo.ro',
  phone: '' as string, // TODO: Adauga numarul de telefon al studioului (ex: '+40 7XX XXX XXX')
  address: 'Mamaia Nord, Constanta, Romania',
  googleMapsUrl: process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL || '',
} as const;

// TODO: Inlocuieste cu URL-urile reale ale studioului inainte de deploy
export const SOCIAL_LINKS = {
  instagram: 'https://instagram.com/insomniatattoo', // TODO: URL real
  instagramMadalina: 'https://instagram.com/madalina.insomnia', // TODO: URL real
  instagramFlorentin: 'https://instagram.com/florentin.insomnia', // TODO: URL real
  tiktok: 'https://tiktok.com/@insomniatattoo', // TODO: URL real
  facebook: 'https://facebook.com/insomniatattoo', // TODO: URL real
} as const;

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
