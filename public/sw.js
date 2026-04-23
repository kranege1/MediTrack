const CACHE_NAME = 'medic-v4.82.25';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Only handle GET requests for caching
  if (event.request.method !== 'GET') return;

  // Skip caching for API calls (to avoid issues with dynamic data or auth headers)
  if (event.request.url.includes('api.x.ai')) return;

  // Network First Strategy
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Only cache successful standard responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        const resClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
