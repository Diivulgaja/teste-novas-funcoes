const CACHE_NAME = 'doceeser-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Instalação — cache inicial
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Ativação
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// Intercepta fetch
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
