/**
 * Normalises a phone number into the international form expected by wa.me.
 *
 * Rules:
 *   - Strips every non-digit character (spaces, dashes, parentheses, "+").
 *   - Treats Romanian local prefixes ("0" + 9 digits) as +40.
 *   - Returns null when no plausible mobile number remains.
 */
export function normalizePhoneForWhatsApp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 7) return null;

  // Romania: 0XXXXXXXXX (10 digits starting with 0) -> 40XXXXXXXXX.
  if (digits.length === 10 && digits.startsWith('0')) {
    return `40${digits.slice(1)}`;
  }

  // Already includes a country code or is non-RO; we just trust the digits.
  return digits;
}

/**
 * Builds a deep-link to WhatsApp for the given phone + optional pre-filled
 * message. Returns null when the phone cannot be normalised.
 */
export function buildWhatsAppLink(
  phone: string | null | undefined,
  message?: string,
): string | null {
  const normalized = normalizePhoneForWhatsApp(phone);
  if (!normalized) return null;
  const base = `https://wa.me/${normalized}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
