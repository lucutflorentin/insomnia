import assert from 'node:assert/strict';
import test from 'node:test';
import { matchesPathSection, stripLocale } from '../src/lib/routes';

test('stripLocale removes supported locale prefixes only', () => {
  assert.equal(stripLocale('/ro/booking'), '/booking');
  assert.equal(stripLocale('/en/artist/gallery'), '/artist/gallery');
  assert.equal(stripLocale('/artists/florentin'), '/artists/florentin');
});

test('matchesPathSection protects exact private sections and their children', () => {
  assert.equal(matchesPathSection('/ro/artist', '/artist'), true);
  assert.equal(matchesPathSection('/ro/artist/gallery', '/artist'), true);
  assert.equal(matchesPathSection('/en/admin/settings', '/admin'), true);
});

test('matchesPathSection does not catch similarly named public routes', () => {
  assert.equal(matchesPathSection('/ro/artists/florentin', '/artist'), false);
  assert.equal(matchesPathSection('/en/artistica', '/artist'), false);
  assert.equal(matchesPathSection('/ro/administer', '/admin'), false);
  assert.equal(matchesPathSection('/ro/admin/settings-extra', '/admin/settings'), false);
});
