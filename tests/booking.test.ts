import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeBookingRequestBody } from '../src/lib/booking';

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
