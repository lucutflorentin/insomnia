// Insomnia Tattoo Service Worker
// Handles: push notifications + offline caching

const CACHE_NAME = 'insomnia-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
];

// Install: cache core static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and API requests
  if (event.request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return;

  // For navigation requests, try network first with cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/') || new Response('Offline'))
    );
    return;
  }

  // For static assets (images, fonts, CSS, JS), use stale-while-revalidate
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|webp|svg|woff2?|ico)$/) ||
    url.pathname.startsWith('/_next/')
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }
});

// Push notification received
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || '',
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/icon-72x72.png',
      data: { ...(data.data || {}), url: data.url, bookingId: data.bookingId },
      tag: data.tag || 'insomnia-notification',
      renotify: true,
      vibrate: [200, 100, 200],
      actions: Array.isArray(data.actions) ? data.actions : undefined,
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Insomnia Tattoo', options)
    );
  } catch {
    // Malformed push data
  }
});

// Notification click: handle action buttons OR open URL / focus existing window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const url = data.url || '/';
  const bookingId = data.bookingId;

  // Action handlers — call API directly with same-origin cookies (credentials).
  if (event.action === 'confirm' && bookingId) {
    event.waitUntil(
      fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'confirmed' }),
      })
        .then((res) =>
          self.registration.showNotification(
            res.ok ? 'Programare confirmata ✓' : 'Confirmare esuata',
            {
              body: res.ok
                ? 'Booking-ul a fost confirmat. Clientul a fost notificat.'
                : 'Deschide aplicatia pentru a finaliza confirmarea.',
              icon: '/icons/icon-192x192.png',
              tag: `confirm-result-${bookingId}`,
            },
          ),
        )
        .catch(() =>
          self.registration.showNotification('Confirmare esuata', {
            body: 'Conexiune indisponibila. Deschide aplicatia pentru a confirma.',
            icon: '/icons/icon-192x192.png',
          }),
        ),
    );
    return;
  }

  // Default: open URL or focus existing tab
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
