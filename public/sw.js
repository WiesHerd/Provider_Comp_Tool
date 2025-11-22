// Basic service worker for PWA support
const CACHE_NAME = 'provider-comp-v1';
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
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

