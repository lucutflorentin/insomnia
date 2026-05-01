import { SITE_CONFIG } from './constants';

const BASE_URL = SITE_CONFIG.url;

// Map of internal paths to their RO/EN equivalents for hreflang
const pathMap: Record<string, { ro: string; en: string }> = {
  '/': { ro: '/', en: '/en' },
  '/booking': { ro: '/booking', en: '/en/booking' },
  '/ink-space': { ro: '/spatiul-ink', en: '/en/ink-space' },
  '/good-to-know': { ro: '/bun-de-stiut', en: '/en/good-to-know' },
  '/aftercare': { ro: '/aftercare', en: '/en/aftercare' },
  '/privacy': { ro: '/confidentialitate', en: '/en/privacy' },
  '/guest-data': { ro: '/guest-data', en: '/en/guest-data' },
  '/terms': { ro: '/termeni', en: '/en/terms' },
  '/cookies': { ro: '/politica-cookies', en: '/en/cookies' },
  '/about': { ro: '/despre-noi', en: '/en/about' },
  '/contact': { ro: '/contact', en: '/en/contact' },
};

/**
 * Generate alternates metadata (canonical + hreflang) for a given page path.
 * @param internalPath - The internal route path (e.g., '/booking', '/ink-space')
 * @param locale - Current locale ('ro' or 'en')
 */
export function getPageAlternates(internalPath: string, locale: string) {
  const paths = pathMap[internalPath];

  if (!paths) {
    // Dynamic pages (artists, etc.) — build manually
    const canonical = locale === 'ro' ? internalPath : `/en${internalPath}`;
    return {
      canonical: `${BASE_URL}${canonical}`,
      languages: {
        'ro-RO': `${BASE_URL}${internalPath}`,
        'en-US': `${BASE_URL}/en${internalPath}`,
      },
    };
  }

  const canonical = locale === 'ro' ? paths.ro : paths.en;
  return {
    canonical: `${BASE_URL}${canonical}`,
    languages: {
      'ro-RO': `${BASE_URL}${paths.ro}`,
      'en-US': `${BASE_URL}${paths.en}`,
    },
  };
}
