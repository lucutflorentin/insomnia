'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Star, User } from 'lucide-react';
import { GoogleReview } from '@/lib/google-reviews';
import SlideUp from '@/components/animations/SlideUp';

interface GoogleReviewsCarouselProps {
  reviews: GoogleReview[];
}

export default function GoogleReviewsCarousel({ reviews }: GoogleReviewsCarouselProps) {
  const t = useTranslations('home.whyUs');

  if (!reviews || reviews.length === 0) return null;

  return (
    <SlideUp delay={0.6}>
      <div className="mt-16">
        <h3 className="mb-8 text-center font-heading text-2xl font-semibold text-text-primary">
          {t('realReviewsTitle', { defaultMessage: 'Recenzii de la clienții noștri' })}
        </h3>
        
        <div className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-8 scrollbar-hide px-4 md:px-0">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="flex w-[320px] shrink-0 snap-center flex-col justify-between rounded-sm border border-border bg-bg-secondary p-6 transition-colors hover:border-accent/40"
            >
              <div className="mb-4 flex items-center gap-4">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/10 bg-bg-tertiary">
                  {review.profile_photo_url ? (
                    <Image
                      src={review.profile_photo_url}
                      alt={review.author_name}
                      fill
                      sizes="48px"
                      className="object-cover"
                      unoptimized // Because Google profile images are external and often have parameters
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-text-muted">
                      <User className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div>
                  <a
                    href={review.author_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-text-primary transition-colors hover:text-accent"
                  >
                    {review.author_name}
                  </a>
                  <p className="text-xs text-text-muted">{review.relative_time_description}</p>
                </div>
              </div>

              <div className="mb-3 flex text-accent">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4"
                    fill={i < review.rating ? 'currentColor' : 'none'}
                    stroke={i < review.rating ? 'currentColor' : 'var(--color-border)'}
                  />
                ))}
              </div>

              <p className="text-sm leading-relaxed text-text-secondary line-clamp-4">
                {review.text}
              </p>
            </div>
          ))}
        </div>
        
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
    </SlideUp>
  );
}
