// Coach Alex Service Worker v4.0
const CACHE_NAME = 'coach-alex-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './src/app.js',
  './src/api.js',
  './src/storage.js',
  './src/health.js',
  './src/foods.js',
  './src/notifications.js',
  './src/science.js',
  './assets/icon-180.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
];

// Install: precache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing v4');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: cleanup old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating v4');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - API calls (anthropic.com): network only, no cache
// - Static assets: cache-first, fallback network
// - HTML: network-first (for updates), fallback cache
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Anthropic API (always network, never cache)
  if (url.hostname.includes('anthropic.com') || url.hostname.includes('api.anthropic')) {
    return;
  }

  // HTML: network-first
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request) || caches.match('./index.html'))
    );
    return;
  }

  // Other assets: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200) return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      });
    })
  );
});

// Handle push notifications (future)
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Reminder Coach Alex',
    icon: 'assets/icon-192.png',
    badge: 'assets/icon-192.png',
    tag: data.tag || 'coach-reminder',
    requireInteraction: false,
    actions: [
      { action: 'open', title: 'Apri' },
      { action: 'dismiss', title: 'Più tardi' },
    ],
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'Coach Alex', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('./');
    })
  );
});
