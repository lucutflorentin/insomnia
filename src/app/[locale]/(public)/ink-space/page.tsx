import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { connection } from 'next/server';
import InkSpaceContent from '@/components/features/gallery/InkSpaceContent';
import type { ArtistSection } from '@/components/features/gallery/InkSpaceContent';
import { normalizeStyleKey } from '@/lib/gallery-style';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata.gallery' });
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function InkSpacePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await connection();
  const { locale } = await params;
  // Fetch artists and their gallery items from DB
  let sections: ArtistSection[] = [];

  try {
    const artists = await prisma.artist.findMany({
      where: { isActive: true },
      include: {
        gallery: {
          where: { isVisible: true },
          include: {
            _count: { select: { favorites: true } },
          },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        },
      },
      orderBy: { id: 'asc' },
    });

    sections = artists.map((artist) => {
      const styles = [
        ...new Set(
          artist.gallery
            .map((g) => normalizeStyleKey(g.style))
            .filter(Boolean),
        ),
      ];

      return {
        slug: artist.slug,
        name: artist.name,
        specialty: (locale === 'ro' ? artist.specialtyRo : artist.specialtyEn) || artist.specialtyRo || artist.specialtyEn || '',
        filters: ['all', ...styles],
        works: artist.gallery.map((g) => ({
          id: g.id,
          style: normalizeStyleKey(g.style),
          imagePath: g.imagePath,
          thumbnailPath: g.thumbnailPath || '',
          titleRo: g.titleRo,
          titleEn: g.titleEn,
          aspectRatio: 1,
          favoriteCount: g._count.favorites,
        })),
        profileImage: artist.profileImage,
      };
    });
  } catch {
    // Fallback to default placeholders if DB unavailable
  }

  return <InkSpaceContent sections={sections.length > 0 ? sections : undefined} />;
}
