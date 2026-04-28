'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import SlideUp from '@/components/animations/SlideUp';
import StaggerChildren, { StaggerItem } from '@/components/animations/StaggerChildren';

interface Artist {
  id: number;
  name: string;
  slug: string;
  bioRo: string | null;
  bioEn: string | null;
  specialtyRo: string | null;
  specialtyEn: string | null;
  specialties: string[];
  profileImage: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
}

interface Review {
  id: number;
  rating: number;
  clientName: string;
  reviewText: string;
  createdAt: string;
}

interface GalleryItem {
  id: number;
  imagePath: string;
  thumbnailPath: string | null;
  title: string;
  style: string;
}

interface Props {
  artist: Artist;
  reviews: Review[];
  gallery: GalleryItem[];
  avgRating: number;
  reviewCount: number;
  locale: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < rating ? 'text-accent' : 'text-text-muted/30'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function ArtistProfileContent({
  artist,
  reviews,
  gallery,
  avgRating,
  reviewCount,
  locale,
}: Props) {
  const t = useTranslations('artists');
  const tCommon = useTranslations('common.cta');
  const tStyles = useTranslations('artists.styles');

  const specialty = (locale === 'ro' ? artist.specialtyRo : artist.specialtyEn) || artist.specialtyRo || '';
  const bio = (locale === 'ro' ? artist.bioRo : artist.bioEn) || artist.bioRo || '';

  return (
    <div className="pt-24 pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Artist Header */}
        <SlideUp>
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
            {/* Portrait */}
            <div className="relative h-64 w-64 shrink-0 overflow-hidden rounded-lg border border-border bg-bg-secondary md:h-80 md:w-80">
              {artist.profileImage ? (
                <Image
                  src={artist.profileImage}
                  alt={`${artist.name} — Tattoo Artist la Insomnia Tattoo`}
                  fill
                  sizes="(min-width: 768px) 320px, 256px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="font-heading text-6xl text-accent/30">{artist.name[0]}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="font-heading text-4xl font-bold sm:text-5xl">
                {artist.name}
              </h1>
              <p className="mt-2 text-lg text-accent">{specialty}</p>

              {/* Rating */}
              {reviewCount > 0 && (
                <div className="mt-3 flex items-center justify-center gap-2 md:justify-start">
                  <StarRating rating={Math.round(avgRating)} />
                  <span className="text-sm text-text-secondary">
                    {avgRating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? 'recenzie' : 'recenzii'})
                  </span>
                </div>
              )}

              {/* Bio */}
              {bio && (
                <p className="mt-4 max-w-2xl text-text-secondary leading-relaxed">
                  {bio}
                </p>
              )}

              {/* Specialties */}
              {artist.specialties.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
                  {artist.specialties.map((style) => (
                    <Badge key={style} variant="outline">
                      {tStyles(style)}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Social Links */}
              <div className="mt-6 flex items-center justify-center gap-4 md:justify-start">
                {artist.instagramUrl && (
                  <a
                    href={artist.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-text-secondary transition-colors hover:text-accent"
                    aria-label={`Instagram ${artist.name}`}
                  >
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  </a>
                )}
                {artist.tiktokUrl && (
                  <a
                    href={artist.tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-text-secondary transition-colors hover:text-accent"
                    aria-label={`TikTok ${artist.name}`}
                  >
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48V13a8.26 8.26 0 005.58 2.17V11.7a4.83 4.83 0 01-5.58-2.56V2h3.45v.44a4.83 4.83 0 002.13 4.25z" />
                    </svg>
                  </a>
                )}
              </div>

              {/* CTA */}
              <div className="mt-8">
                <Link href={`/booking?artist=${artist.slug}` as '/booking'}>
                  <Button size="lg">{tCommon('bookingLong')}</Button>
                </Link>
              </div>
            </div>
          </div>
        </SlideUp>

        {/* Divider */}
        <div className="my-16 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
          <div className="h-1.5 w-1.5 rotate-45 bg-accent/40" />
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
        </div>

        {/* Gallery */}
        {gallery.length > 0 && (
          <section>
            <SlideUp>
              <h2 className="font-heading text-2xl font-bold sm:text-3xl">
                {t('portfolio')}
              </h2>
              <div className="mx-auto mt-2 h-px w-12 bg-accent md:mx-0" />
            </SlideUp>

            <StaggerChildren
              staggerDelay={0.05}
              className="mt-8 columns-2 gap-3 sm:columns-3 lg:columns-4"
            >
              {gallery.map((work) => (
                <StaggerItem key={work.id} className="mb-3 break-inside-avoid">
                  <div className="group relative overflow-hidden rounded-sm bg-bg-secondary">
                    <Image
                      src={work.thumbnailPath || work.imagePath}
                      alt={work.title || `Tatuaj ${work.style} de ${artist.name} — Insomnia Tattoo`}
                      width={800}
                      height={1000}
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                      className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-end bg-gradient-to-t from-bg-primary/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <div className="p-3">
                        {work.title && <p className="text-xs text-text-primary">{work.title}</p>}
                        {work.style && (
                          <Badge variant="accent" className="mt-1 text-[10px]">
                            {tStyles(work.style)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerChildren>
          </section>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <section className="mt-16">
            <SlideUp>
              <h2 className="font-heading text-2xl font-bold sm:text-3xl">
                {t('reviews')} ({reviewCount})
              </h2>
              <div className="mx-auto mt-2 h-px w-12 bg-accent md:mx-0" />
            </SlideUp>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((review) => (
                <SlideUp key={review.id}>
                  <div className="rounded-lg border border-border bg-bg-secondary p-6">
                    <StarRating rating={review.rating} />
                    {review.reviewText && (
                      <p className="mt-3 text-sm text-text-secondary leading-relaxed">
                        &ldquo;{review.reviewText}&rdquo;
                      </p>
                    )}
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm font-medium text-text-primary">{review.clientName}</p>
                      <p className="text-xs text-text-muted">
                        {new Date(review.createdAt).toLocaleDateString(locale === 'ro' ? 'ro-RO' : 'en-US')}
                      </p>
                    </div>
                  </div>
                </SlideUp>
              ))}
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <SlideUp className="mt-16 text-center">
          <div className="rounded-lg border border-border bg-bg-secondary p-8">
            <h3 className="font-heading text-xl font-bold">
              {locale === 'ro'
                ? `Iti doresti un tatuaj cu ${artist.name}?`
                : `Want a tattoo with ${artist.name}?`}
            </h3>
            <p className="mt-2 text-text-secondary">
              {locale === 'ro'
                ? 'Programeaza o consultatie gratuita si discutam despre proiectul tau.'
                : 'Book a free consultation and let\'s discuss your project.'}
            </p>
            <div className="mt-6">
              <Link href={`/booking?artist=${artist.slug}` as '/booking'}>
                <Button size="lg">{tCommon('bookingLong')}</Button>
              </Link>
            </div>
          </div>
        </SlideUp>
      </div>
    </div>
  );
}
