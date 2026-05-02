import { unstable_cache } from 'next/cache';

export interface GoogleReview {
  author_name: string;
  author_url: string;
  language: string;
  profile_photo_url: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

export interface GooglePlaceData {
  name: string;
  rating: number;
  user_ratings_total: number;
  reviews: GoogleReview[];
}

/**
 * Fetches Google Place Details (Rating & Reviews) using the Google Places API.
 * Uses Next.js unstable_cache to cache the response for 24 hours,
 * minimizing API calls and ensuring fast page loads.
 */
export const getGoogleReviews = unstable_cache(
  async (locale: string = 'ro'): Promise<GooglePlaceData | null> => {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    const placeId = process.env.GOOGLE_PLACE_ID;

    if (!apiKey || !placeId) {
      console.warn('Google Places API keys are missing. Skipping review fetch.');
      return null;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,reviews,user_ratings_total&key=${apiKey}&language=${locale}`;
      
      const res = await fetch(url);
      
      if (!res.ok) {
        console.error('Failed to fetch from Google Places API:', res.statusText);
        return null;
      }
      
      const data = await res.json();
      
      if (data.status !== 'OK') {
        console.error('Google Places API returned error status:', data.status, data.error_message);
        return null;
      }
      
      return data.result as GooglePlaceData;
    } catch (error) {
      console.error('Exception fetching Google Reviews:', error);
      return null;
    }
  },
  ['google-reviews-data'],
  { revalidate: 86400 } // Cache for 24 hours
);
