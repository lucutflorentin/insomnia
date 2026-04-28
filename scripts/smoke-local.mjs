const baseUrl = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3010';
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 10000);

let failures = 0;

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function currentMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(path, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(new URL(path, baseUrl), {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function check(name, fn) {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`not ok - ${name}`);
    console.error(`  ${error instanceof Error ? error.message : String(error)}`);
  }
}

await check('home page loads', async () => {
  const response = await request('/');
  const html = await response.text();

  assert(response.status === 200, `expected 200, got ${response.status}`);
  assert(!html.includes('nav.booking'), 'raw nav.booking translation key leaked');
  assert(!html.includes('nav.bookingLong'), 'raw nav.bookingLong translation key leaked');
});

await check('booking page loads', async () => {
  const response = await request('/booking');

  assert(response.status === 200, `expected 200, got ${response.status}`);
});

await check('public artist profile is not protected by artist dashboard middleware', async () => {
  const response = await request('/ro/artists/florentin', { redirect: 'manual' });
  const location = response.headers.get('location') || '';

  assert(response.status === 200 || response.status === 307 || response.status === 308, `expected 200/307/308, got ${response.status}`);
  assert(!location.includes('/admin/login'), `unexpected admin login redirect: ${location}`);

  if (location) {
    const redirected = await request(location);
    assert(redirected.status === 200, `expected redirected artist page 200, got ${redirected.status}`);
  }
});

await check('private artist dashboard remains protected', async () => {
  const response = await request('/ro/artist/gallery', { redirect: 'manual' });
  const location = response.headers.get('location') || '';

  assert(response.status === 307 || response.status === 308, `expected redirect, got ${response.status}`);
  assert(location.includes('/admin/login'), `expected admin login redirect, got ${location}`);
});

await check('availability starts from the local current date', async () => {
  const today = localDateKey();
  const response = await request(`/api/artists/florentin/availability?month=${currentMonthKey()}`);
  const payload = await response.json();

  assert(response.status === 200, `expected 200, got ${response.status}`);
  assert(payload.success === true, 'availability response success=false');
  assert(Array.isArray(payload.data), 'availability data is not an array');
  assert(payload.data.length > 0, 'availability returned no days');
  assert(payload.data[0].date >= today, `first date ${payload.data[0].date} is before today ${today}`);
});

await check('full booking payload reaches artist lookup instead of schema failure', async () => {
  const today = localDateKey();
  const response = await request('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      artist: '__smoke_missing_artist__',
      name: 'Smoke Test',
      phone: '+40700000000',
      email: 'smoke@example.com',
      bodyArea: 'forearm',
      size: 'medium',
      style: 'blackwork',
      description: 'Smoke test payload that should pass schema validation.',
      date: today,
      time: '13:00',
      gdpr: true,
      source: '',
      language: 'ro',
    }),
  });
  const payload = await response.json();

  assert(response.status === 404, `expected 404 artist lookup, got ${response.status}`);
  assert(payload.error === 'Artist not found', `expected Artist not found, got ${payload.error}`);
});

if (failures > 0) {
  console.error(`Smoke failed: ${failures} check${failures === 1 ? '' : 's'} failed.`);
  process.exit(1);
}

console.log(`Smoke passed against ${baseUrl}`);
