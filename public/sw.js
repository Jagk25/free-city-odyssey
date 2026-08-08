const CACHE = 'freecity-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Runtime caching: Vite emits hashed bundles, so cache whatever succeeds on first load.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(
      (hit) =>
        hit ||
        fetch(event.request)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
            return res;
          })
          .catch(() => caches.match('./index.html')),
    ),
  );
});
