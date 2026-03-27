const CACHE_NAME = 'math-app-v2';
const ASSETS = [
  'index.html',
  'manifest.webmanifest',
  'pwa-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
    })
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  
  // Do NOT cache CDN or external MyScript requests - let them pass through normally
  if (url.hostname.includes('unpkg.com') || url.hostname.includes('myscript.com')) {
    return; // default browser behavior
  }

  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
