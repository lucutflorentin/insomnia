import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeBookingRequestBody,
  parseDisplayReferenceImages,
} from '../src/lib/booking';

const fullWizardPayload = {
  artist: 'florentin',
  name: 'Client Test',
  phone: '+40700000000',
  email: 'client@example.com',
  bodyArea: 'forearm',
  size: 'medium',
  style: 'blackwork',
  description: 'Descriere suficient de lunga pentru validare.',
  date: '2026-04-27',
  time: '13:00',
  gdpr: true,
  source: '',
  language: 'en',
};

test('normalizes the full booking wizard payload to the API contract', () => {
  const result = normalizeBookingRequestBody(fullWizardPayload);

  assert.equal(result.success, true);
  if (!result.success) return;

  assert.equal(result.isQuickForm, false);
  assert.equal(result.data.artistSlug, 'florentin');
  assert.equal(result.data.clientName, 'Client Test');
  assert.equal(result.data.source, 'other');
  assert.equal(result.data.language, 'en');
  assert.equal(result.data.consultationDate, '2026-04-27');
});

test('rejects a full booking wizard payload without an artist slug', () => {
  const result = normalizeBookingRequestBody({
    ...fullWizardPayload,
    artist: '',
  });

  assert.equal(result.success, false);
  if (result.success) return;

  assert.ok(result.error.flatten().fieldErrors.artistSlug);
});

test('normalizes quick booking payloads without requiring date or placement fields', () => {
  const result = normalizeBookingRequestBody({
    artistSlug: 'madalina',
    clientName: 'Client Rapid',
    clientPhone: '+40711111111',
    clientEmail: 'rapid@example.com',
    gdprConsent: true,
    description: 'O idee scurta pentru consultatie.',
  });

  assert.equal(result.success, true);
  if (!result.success) return;

  assert.equal(result.isQuickForm, true);
  assert.equal(result.data.source, 'quick_form');
  assert.equal(result.data.sizeCategory, 'medium');
  assert.equal(result.data.consultationDate, undefined);
});

test('uses full wizard validation when artistSlug is sent with a complete schedule', () => {
  const result = normalizeBookingRequestBody({
    artistSlug: 'madalina',
    name: 'Client Test',
    phone: '+40700000000',
    email: 'client@example.com',
    bodyArea: 'forearm',
    size: 'medium',
    style: 'blackwork',
    description: 'Descriere suficient de lunga pentru validare.',
    date: '2026-04-27',
    time: '13:00',
    gdpr: true,
    language: 'en',
  });

  assert.equal(result.success, true);
  if (!result.success) return;

  assert.equal(result.isQuickForm, false);
  assert.equal(result.data.artistSlug, 'madalina');
  assert.equal(result.data.consultationDate, '2026-04-27');
  assert.equal(result.data.consultationTime, '13:00');
});

test('quick_form source still uses quick path even if date and time keys are present', () => {
  const result = normalizeBookingRequestBody({
    artistSlug: 'madalina',
    clientName: 'Client Rapid',
    clientPhone: '+40711111111',
    clientEmail: 'rapid@example.com',
    gdprConsent: true,
    source: 'quick_form',
    date: '2026-04-27',
    time: '13:00',
  });

  assert.equal(result.success, true);
  if (!result.success) return;

  assert.equal(result.isQuickForm, true);
  assert.equal(result.data.consultationDate, undefined);
});

test('accepts API-gated booking reference URLs for admin and artist display', () => {
  const result = parseDisplayReferenceImages([
    'https://example.com/reference.webp',
    '/api/bookings/42/references/0',
    '/api/bookings/not-a-number/references/0',
    '/api/other/42/references/0',
  ]);

  assert.deepEqual(result, [
    'https://example.com/reference.webp',
    '/api/bookings/42/references/0',
  ]);
});
