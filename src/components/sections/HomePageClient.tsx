'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import Hero from '@/components/sections/Hero';
import ArtistCards from '@/components/sections/ArtistCards';
import ArtistModal from '@/components/sections/ArtistModal';
import GalleryHighlight from '@/components/sections/GalleryHighlight';
import SocialProof from '@/components/sections/SocialProof';
import CTABanner from '@/components/sections/CTABanner';
import MapSection from '@/components/sections/MapSection';
import BookingModal from '@/components/sections/BookingModal';

interface FeaturedWork {
  id: number;
  src: string;
  titleRo: string | null;
  titleEn: string | null;
}

export interface HomeArtist {
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
  sortOrder: number;
  averageRating: number;
  reviewCount: number;
  featuredWorks: FeaturedWork[];
}

interface HomePageClientProps {
  artists: HomeArtist[];
}

export default function HomePageClient({ artists }: HomePageClientProps) {
  const locale = useLocale();
  const [dynamicContent, setDynamicContent] = useState<Record<string, string>>({});
  const [artistModalOpen, setArtistModalOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<HomeArtist | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingPreselectedArtist, setBookingPreselectedArtist] = useState<string | null>(null);

  const handleArtistClick = useCallback(
    (slug: string) => {
      const artist = artists.find((a) => a.slug === slug);
      if (artist) {
        setSelectedArtist(artist);
        setArtistModalOpen(true);
      }
    },
    [artists],
  );

  const handleBookingFromArtist = useCallback((artistSlug: string) => {
    setBookingPreselectedArtist(artistSlug);
    setBookingModalOpen(true);
  }, []);

  const handleOpenBooking = useCallback(() => {
    setBookingPreselectedArtist(null);
    setBookingModalOpen(true);
  }, []);

  useEffect(() => {
    const suffix = locale === 'en' ? 'en' : 'ro';
    fetch(`/api/content?keys=hero_title_${suffix},hero_subtitle_${suffix}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setDynamicContent(data.data);
      })
      .catch(() => {});
  }, [locale]);

  const heroTitle = dynamicContent[`hero_title_${locale === 'en' ? 'en' : 'ro'}`];
  const heroSubtitle = dynamicContent[`hero_subtitle_${locale === 'en' ? 'en' : 'ro'}`];

  return (
    <>
      <Hero
        onBookingClick={handleOpenBooking}
        dynamicTitle={heroTitle || undefined}
        dynamicSubtitle={heroSubtitle || undefined}
      />
      <ArtistCards
        artists={artists}
        onArtistClick={handleArtistClick}
        onQuickBook={handleBookingFromArtist}
      />
      <GalleryHighlight />
      <SocialProof />
      <CTABanner onBookingClick={handleOpenBooking} />
      <MapSection />

      <ArtistModal
        isOpen={artistModalOpen}
        onClose={() => setArtistModalOpen(false)}
        artist={selectedArtist}
        onBooking={handleBookingFromArtist}
      />

      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        preselectedArtist={bookingPreselectedArtist}
        artists={artists}
      />
    </>
  );
}
