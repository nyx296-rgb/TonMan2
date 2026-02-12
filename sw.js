
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  // Basic pass-through, required for PWA detection
  e.respondWith(fetch(e.request));
});
