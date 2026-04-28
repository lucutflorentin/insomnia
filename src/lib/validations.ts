import { z } from 'zod';
import {
  BODY_AREAS,
  SIZE_CATEGORIES,
  BOOKING_SOURCES,
  BOOKING_STATUSES,
} from './constants';

// Sanitize utility — strip HTML tags from user input
export function sanitizeText(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim();
}

// Booking form schema
export const bookingSchema = z.object({
  artistSlug: z.string().min(1).max(100),
  bodyArea: z.enum(BODY_AREAS),
  sizeCategory: z.enum(SIZE_CATEGORIES),
  stylePreference: z.string().max(100).optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  referenceImages: z.array(z.string().max(500)).max(3).optional(),
  consultationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  consultationTime: z.string().regex(/^\d{2}:\d{2}$/),
  clientName: z.string().min(2, 'Name must be at least 2 characters').max(200),
  clientPhone: z.string().min(6, 'Phone must be at least 6 characters').max(20),
  clientEmail: z.string().email('Invalid email address').max(320),
  gdprConsent: z.literal(true, {
    errorMap: () => ({ message: 'GDPR consent is required' }),
  }),
  source: z.enum(BOOKING_SOURCES).optional(),
  language: z.enum(['ro', 'en']).default('ro'),
});

export type BookingFormData = z.infer<typeof bookingSchema>;

// Quick booking schema (BookingModal — no date/time/bodyArea/size required)
export const quickBookingSchema = z.object({
  artistSlug: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  clientName: z.string().min(2, 'Name must be at least 2 characters').max(200),
  clientPhone: z.string().min(6, 'Phone must be at least 6 characters').max(20),
  clientEmail: z.string().email('Invalid email address').max(320),
  gdprConsent: z.literal(true, {
    errorMap: () => ({ message: 'GDPR consent is required' }),
  }),
  source: z.string().optional(),
  language: z.enum(['ro', 'en']).default('ro'),
});

export type QuickBookingFormData = z.infer<typeof quickBookingSchema>;

// Contact form schema
export const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(10).max(2000),
});

export type ContactFormData = z.infer<typeof contactSchema>;

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  email: z.string().email('Invalid email address').max(320),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  phone: z.string().max(20).optional(),
  gdprConsent: z.literal(true, {
    errorMap: () => ({ message: 'GDPR consent is required' }),
  }),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// Review schema
export const reviewSchema = z.object({
  bookingId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  reviewTextRo: z.string().min(10, 'Review must be at least 10 characters').max(2000).optional(),
  reviewTextEn: z.string().min(10, 'Review must be at least 10 characters').max(2000).optional(),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;

// Admin booking status update
export const bookingStatusSchema = z.object({
  status: z.enum(BOOKING_STATUSES),
  adminNotes: z.string().max(5000).optional(),
  clientNotes: z.string().max(2000).optional(),
});

// Gallery item schema
export const galleryItemSchema = z.object({
  artistId: z.number().int().positive(),
  imagePath: z.string().max(500),
  thumbnailPath: z.string().max(500).optional(),
  titleRo: z.string().max(300).optional(),
  titleEn: z.string().max(300).optional(),
  style: z.string().max(100).optional(),
  bodyArea: z.string().max(100).optional(),
  isFeatured: z.boolean().default(false),
  isVisible: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

// Availability schema
export const availabilitySchema = z.object({
  artistId: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  slotDurationMinutes: z.number().int().min(15).max(480).default(60),
  isAvailable: z.boolean().default(true),
});

// Availability template schema
export const availabilityTemplateSchema = z.object({
  artistId: z.number().int().positive(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isActive: z.boolean().default(true),
});
