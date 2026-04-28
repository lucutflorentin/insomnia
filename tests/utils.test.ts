import assert from 'node:assert/strict';
import test from 'node:test';
import { formatLocalDateKey, parseLocalDate } from '../src/lib/utils';

test('parseLocalDate keeps YYYY-MM-DD values on the local calendar day', () => {
  const date = parseLocalDate('2026-04-27');

  assert.equal(date.getFullYear(), 2026);
  assert.equal(date.getMonth(), 3);
  assert.equal(date.getDate(), 27);
});

test('formatLocalDateKey round-trips local booking dates', () => {
  const date = parseLocalDate('2026-04-27');

  assert.equal(formatLocalDateKey(date), '2026-04-27');
});

test('formatLocalDateKey avoids UTC slicing for local date keys', () => {
  const localDate = new Date(2026, 3, 27, 23, 45);

  assert.equal(formatLocalDateKey(localDate), '2026-04-27');
});
