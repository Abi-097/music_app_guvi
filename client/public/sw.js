// Minimal app-shell service worker: lets the app (and the Downloads page,
// which plays audio from IndexedDB) open while offline.
const CACHE = 'wavely-shell-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/index.html', '/favicon.svg'])));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/audio')) return;

  if (e.request.mode === 'navigate') {
    // Network first for pages, fall back to cached shell.
    e.respondWith(fetch(e.request).catch(() => caches.match('/index.html')));
    return;
  }
  // Cache first for hashed build assets.
  e.respondWith(
    caches.match(e.request).then(
      (hit) =>
        hit ||
        fetch(e.request).then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
          return res;
        })
    )
  );
});
