import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const DEFAULTS = {
  pwa_name: 'Insomnia Tattoo',
  pwa_short_name: 'Insomnia',
  pwa_description: 'Studio premium de tatuaje in Mamaia Nord, Constanta',
  pwa_theme_color: '#0A0A0A',
  pwa_background_color: '#0A0A0A',
  pwa_display: 'standalone' as const,
  pwa_start_url: '/',
  pwa_icon_192: '/icons/icon-192.png',
  pwa_icon_512: '/icons/icon-512.png',
};

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = { ...DEFAULTS };

  try {
    const rows = await prisma.setting.findMany({
      where: {
        settingKey: { startsWith: 'pwa_' },
      },
    });

    for (const row of rows) {
      if (row.settingValue) {
        settings[row.settingKey as keyof typeof DEFAULTS] = row.settingValue as never;
      }
    }
  } catch {
    // Use defaults if DB is unavailable
  }

  return {
    name: settings.pwa_name,
    short_name: settings.pwa_short_name,
    description: settings.pwa_description,
    start_url: settings.pwa_start_url,
    display: settings.pwa_display as 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser',
    background_color: settings.pwa_background_color,
    theme_color: settings.pwa_theme_color,
    orientation: 'portrait-primary',
    icons: [
      {
        src: settings.pwa_icon_192,
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: settings.pwa_icon_512,
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    categories: ['lifestyle', 'business'],
  };
}
