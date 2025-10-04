// This file is the "Service Worker"
// It runs in the background and gives the app offline capabilities.

const CACHE_NAME = 'pattern-viewer-v3'; // <<< IMPORTANT: Version incremented!
// These are the files that will be saved for offline use, with updated paths.
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/patterns/neon-sky-full.json',
  '/assets/icons/yarn-ball-icon.png',
  '/assets/icons/MASTER_yarn-ball-icon.png'
];

// The 'install' event is fired when the service worker is first installed or updated.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching new files');
        return cache.addAll(urlsToCache);
      })
  );
});

// The 'fetch' event intercepts network requests.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // If we have a cached version, return it. Otherwise, fetch from network.
        return response || fetch(event.request);
      }
    )
  );
});

// The 'activate' event cleans up old caches.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

