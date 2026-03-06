// Service Worker with caching for static assets
// Provides offline support and improved repeat visit performance
// v2 - Security update: blocked malicious ad domains

const CACHE_NAME = 'cuizin-v2';
const STATIC_CACHE_NAME = 'cuizin-static-v2';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/og-image.png',
  '/og-image-cuizin.png',
  '/placeholder.svg',
  '/manifest.json'
];

// Malicious domains to block
const MALICIOUS_DOMAINS = [
  'onclickpsh.com',
  'mrtnsvr.com',
  'richinfo.co',
  'onclckmn.com',
  'wpadmngr.com',
  'TCPusher',
  'goodgaming138',
  'mahjong222'
];

// Cache strategies
const CACHE_STRATEGIES = {
  cacheFirst: async (request, cacheName) => {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;
    
    try {
      const response = await fetch(request);
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      console.error('Fetch failed:', error);
      return new Response('Offline', { status: 503 });
    }
  },
  
  networkFirst: async (request, cacheName) => {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await caches.match(request);
      if (cached) return cached;
      return new Response('Offline', { status: 503 });
    }
  },
  
  staleWhileRevalidate: async (request, cacheName) => {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    const fetchPromise = fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    }).catch(() => cached);
    
    return cached || fetchPromise;
  }
};

// Install event - cache static assets and force activate
self.addEventListener('install', event => {
  console.log('Service Worker v2: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate event - purge ALL old caches
self.addEventListener('activate', event => {
  console.log('Service Worker v2: Activating - purging old caches...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== STATIC_CACHE_NAME)
          .map(name => {
            console.log('Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Block malicious domains
  for (const domain of MALICIOUS_DOMAINS) {
    if (url.hostname.includes(domain) || url.href.toLowerCase().includes(domain.toLowerCase())) {
      console.log('SW: Blocking malicious domain:', url.href);
      event.respondWith(new Response('', { status: 204 }));
      return;
    }
  }
  
  if (event.request.method !== 'GET') return;
  
  const skipPatterns = [
    'googlesyndication',
    'googletagmanager',
    'google-analytics',
    'doubleclick',
    'adsbygoogle',
    'supabase.co',
    'gpteng.co'
  ];
  
  if (skipPatterns.some(pattern => url.href.includes(pattern))) {
    return;
  }
  
  const destination = event.request.destination;
  
  if (destination === 'image' || destination === 'font' || destination === 'style') {
    event.respondWith(CACHE_STRATEGIES.cacheFirst(event.request, STATIC_CACHE_NAME));
    return;
  }
  
  if (destination === 'script' && url.origin === self.location.origin) {
    event.respondWith(CACHE_STRATEGIES.staleWhileRevalidate(event.request, CACHE_NAME));
    return;
  }
  
  if (destination === 'document' || event.request.mode === 'navigate') {
    event.respondWith(CACHE_STRATEGIES.networkFirst(event.request, CACHE_NAME));
    return;
  }
  
  if (url.origin === self.location.origin) {
    event.respondWith(CACHE_STRATEGIES.staleWhileRevalidate(event.request, CACHE_NAME));
    return;
  }
});

// Handle messages
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }
});

console.log('CuizIN Service Worker v2 initialized - malicious scripts blocked');
