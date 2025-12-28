/**
 * Service Worker para Armados 2Go PWA
 * Estrategias: Network First para APIs, Cache First para assets
 */

const CACHE_VERSION = 'v3';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

// Assets críticos para funcionar offline
const STATIC_ASSETS = [
  '/',
  '/inicio',
  '/login',
  '/armador',
  '/offline',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activación y limpieza de caches antiguos
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Eliminar caches que no sean de la versión actual
              return name.startsWith('static-') && name !== STATIC_CACHE ||
                     name.startsWith('api-') && name !== API_CACHE ||
                     name.startsWith('images-') && name !== IMAGE_CACHE ||
                     name === '2go-v2'; // Cache antiguo
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Intercepción de requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Solo manejar GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Ignorar requests externos
  if (url.origin !== self.location.origin) {
    // Excepto Cloudinary para imágenes
    if (url.hostname.includes('cloudinary.com')) {
      event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    }
    return;
  }
  
  // ===== APIs: Network First =====
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }
  
  // ===== Imágenes: Cache First =====
  if (
    request.destination === 'image' ||
    url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)
  ) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }
  
  // ===== Assets estáticos: Cache First =====
  if (
    request.destination === 'font' ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    url.pathname.match(/\.(css|js|woff|woff2|ttf)$/i)
  ) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }
  
  // ===== Páginas HTML: Network First con fallback a offline =====
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }
  
  // Default: Network First
  event.respondWith(networkFirstStrategy(request, STATIC_CACHE));
});

/**
 * Network First Strategy
 * Intenta red primero, si falla usa cache
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);
    
    // Cachear respuestas exitosas
    if (response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    // Para APIs, retornar respuesta offline
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({ 
          error: 'Offline', 
          offline: true,
          message: 'No hay conexión a internet'
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    throw error;
  }
}

/**
 * Cache First Strategy
 * Usa cache si existe, si no va a la red
 */
async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Failed to fetch:', request.url);
    
    // Retornar placeholder para imágenes
    if (request.destination === 'image') {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#ddd" width="100" height="100"/></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    
    throw error;
  }
}

/**
 * Network First con fallback a página offline
 */
async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    
    if (response.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Page offline, trying cache:', request.url);
    
    // Intentar cache primero
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    // Fallback a página offline
    const offlinePage = await caches.match('/offline');
    if (offlinePage) {
      return offlinePage;
    }
    
    // Último recurso
    return new Response(
      '<html><body><h1>Sin conexión</h1><p>No hay conexión a internet.</p></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((keys) => 
        Promise.all(keys.map((key) => caches.delete(key)))
      )
    );
  }
});
