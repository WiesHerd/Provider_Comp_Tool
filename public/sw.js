// Basic service worker for PWA support
const CACHE_NAME = 'comp-lens-v3';
const urlsToCache = [
  '/',
  '/wrvu-modeler',
  '/fmv-calculator',
  '/call-pay-modeler',
  '/scenarios',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Skip service worker for development/localhost
  if (event.request.url.includes('localhost') || event.request.url.includes('127.0.0.1')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        // If fetch fails, return a basic response to prevent errors
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

