import type { Locale } from '@/i18n/routing';

// User & Auth types
export type UserRole = 'SUPER_ADMIN' | 'ARTIST' | 'CLIENT';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  name: string;
  phone: string | null;
  googleId: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

// Artist types
export interface Artist {
  id: number;
  userId: number;
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
  isActive: boolean;
  user?: User;
  averageRating?: number;
  reviewCount?: number;
}

// Gallery types
export interface GalleryItem {
  id: number;
  artistId: number;
  imagePath: string;
  thumbnailPath: string | null;
  titleRo: string | null;
  titleEn: string | null;
  style: string | null;
  bodyArea: string | null;
  isFeatured: boolean;
  isVisible: boolean;
  sortOrder: number;
  artist?: Artist;
}

// Booking types
export interface Booking {
  id: number;
  referenceCode: string;
  artistId: number;
  clientId: number | null;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  bodyArea: string | null;
  sizeCategory: string;
  stylePreference: string | null;
  description: string | null;
  referenceImages: string[] | null;
  consultationDate: string | null;
  consultationTime: string | null;
  source: string;
  status: BookingStatus;
  adminNotes: string | null;
  gdprConsent: boolean;
  language: string;
  createdAt: string;
  updatedAt: string;
  artist?: Artist;
  client?: User;
}

export type BookingStatus =
  | 'new'
  | 'contacted'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

// Availability types
export interface AvailabilitySlot {
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  slotDurationMinutes: number;
}

export interface AvailabilityTemplate {
  id: number;
  artistId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface DayAvailability {
  date: string;
  isAvailable: boolean;
  slots: string[];
}

// Review types
export interface Review {
  id: number;
  userId: number | null;
  clientName: string;
  artistId: number | null;
  bookingId: number | null;
  rating: number;
  reviewTextRo: string | null;
  reviewTextEn: string | null;
  source: string;
  isApproved: boolean;
  isVisible: boolean;
  createdAt: string;
  artist?: Artist;
  user?: User;
}

// Loyalty types
export interface LoyaltyTransaction {
  id: number;
  userId: number;
  bookingId: number | null;
  type: 'earn' | 'redeem' | 'bonus' | 'adjust';
  points: number;
  valueRon: number;
  description: string | null;
  createdAt: string;
  createdBy: number | null;
}

export interface LoyaltyBalance {
  totalEarned: number;
  totalSpent: number;
  balance: number;
  valueRon: number;
  surpriseEligible: boolean;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Page props
export interface LocalePageProps {
  params: Promise<{ locale: Locale }>;
}

export interface ArtistPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}
