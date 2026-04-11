'use client';

import { useState, useCallback } from 'react';
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

  return (
    <>
      <Hero onBookingClick={handleOpenBooking} />
      <ArtistCards artists={artists} onArtistClick={handleArtistClick} />
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
