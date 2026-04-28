import type { ZodError } from 'zod';
import { bookingSchema, quickBookingSchema } from './validations';

export interface NormalizedBookingRequest {
  artistSlug: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  gdprConsent: boolean;
  description?: string;
  bodyArea?: string;
  sizeCategory: string;
  stylePreference?: string;
  consultationDate?: string;
  consultationTime?: string;
  source: string;
  language: 'ro' | 'en';
}

export type BookingParseResult =
  | { success: true; data: NormalizedBookingRequest; isQuickForm: boolean }
  | { success: false; error: ZodError; isQuickForm: boolean };

export function normalizeBookingRequestBody(input: unknown): BookingParseResult {
  const body = input && typeof input === 'object'
    ? input as Record<string, unknown>
    : {};

  const isQuickForm = 'artistSlug' in body || body.source === 'quick_form';

  if (isQuickForm) {
    const parsed = quickBookingSchema.safeParse(body);
    if (!parsed.success) {
      return { success: false, error: parsed.error, isQuickForm };
    }

    return {
      success: true,
      isQuickForm,
      data: {
        artistSlug: parsed.data.artistSlug,
        clientName: parsed.data.clientName,
        clientPhone: parsed.data.clientPhone,
        clientEmail: parsed.data.clientEmail,
        gdprConsent: parsed.data.gdprConsent,
        description: parsed.data.description,
        source: parsed.data.source || 'quick_form',
        language: parsed.data.language,
        sizeCategory: 'medium',
      },
    };
  }

  const normalized = {
    artistSlug: body.artist,
    clientName: body.name,
    clientPhone: body.phone,
    clientEmail: body.email,
    bodyArea: body.bodyArea,
    sizeCategory: body.size,
    stylePreference: body.style,
    description: body.description,
    consultationDate: body.date,
    consultationTime: body.time,
    gdprConsent: body.gdpr,
    source: body.source || undefined,
    language: body.language || 'ro',
  };

  const parsed = bookingSchema.safeParse(normalized);
  if (!parsed.success) {
    return { success: false, error: parsed.error, isQuickForm };
  }

  return {
    success: true,
    isQuickForm,
    data: {
      artistSlug: parsed.data.artistSlug,
      clientName: parsed.data.clientName,
      clientPhone: parsed.data.clientPhone,
      clientEmail: parsed.data.clientEmail,
      gdprConsent: parsed.data.gdprConsent,
      description: parsed.data.description,
      bodyArea: parsed.data.bodyArea,
      sizeCategory: parsed.data.sizeCategory,
      stylePreference: parsed.data.stylePreference,
      consultationDate: parsed.data.consultationDate,
      consultationTime: parsed.data.consultationTime,
      source: parsed.data.source || 'other',
      language: parsed.data.language,
    },
  };
}
