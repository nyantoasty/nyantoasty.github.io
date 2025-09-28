// This file is the "Service Worker"
// It runs in the background and gives the app offline capabilities.

const CACHE_NAME = 'pattern-viewer-v1';
// These are the files that will be saved for offline use.
const urlsToCache = [
  '/',
  'index.html',
  'neon-sky-full.json'
];

// The 'install' event is fired when the service worker is first installed.
self.addEventListener('install', event => {
  // We wait until the caching is complete before finishing installation.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // addAll() fetches the files and adds them to the cache.
        return cache.addAll(urlsToCache);
      })
  );
});

// The 'fetch' event is fired for every network request the page makes.
self.addEventListener('fetch', event => {
  event.respondWith(
    // caches.match() looks for a cached response for the current request.
    caches.match(event.request)
      .then(response => {
        // If a cached response is found, return it.
        if (response) {
          return response;
        }
        // If nothing is in the cache, fetch it from the network as normal.
        return fetch(event.request);
      }
    )
  );
});
