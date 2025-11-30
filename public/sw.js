const CACHE_NAME = '2go-v2';
const urlsToCache = [
  '/',
  '/inicio',
  '/login',
  '/armador',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Intercepción de requests (estrategia Network First para GET únicamente)
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Solo manejamos y cacheamos peticiones GET. Esto evita errores con HEAD/POST, etc.
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clonar la respuesta
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // Si falla la red, intentar cache
        return caches.match(request);
      })
  );
});
