// Service Worker with caching for static assets
// Provides offline support and improved repeat visit performance

const CACHE_NAME = 'cuizin-v1';
const STATIC_CACHE_NAME = 'cuizin-static-v1';

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
  'mrtnsvr.com'
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first, fallback to network (for static assets)
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
  
  // Network first, fallback to cache (for dynamic content)
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
  
  // Stale while revalidate (for semi-dynamic content)
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

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(cache => {
      console.log('Service Worker: Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== STATIC_CACHE_NAME)
          .map(name => {
            console.log('Service Worker: Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - handle requests with appropriate caching strategy
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Block malicious domains
  for (const domain of MALICIOUS_DOMAINS) {
    if (url.hostname.includes(domain)) {
      console.log('SW: Blocking malicious domain:', url.href);
      event.respondWith(new Response('', { status: 204 }));
      return;
    }
  }
  
  // Skip non-GET requests and cross-origin requests for ad networks
  if (event.request.method !== 'GET') return;
  
  // Skip caching for ad-related and analytics scripts
  const skipPatterns = [
    'googlesyndication',
    'googletagmanager',
    'google-analytics',
    'doubleclick',
    'adsbygoogle',
    'wpadmngr',
    'onclckmn',
    'richinfo',
    'supabase.co',
    'gpteng.co'
  ];
  
  if (skipPatterns.some(pattern => url.href.includes(pattern))) {
    return; // Let the browser handle these normally
  }
  
  // Determine caching strategy based on request type
  const destination = event.request.destination;
  
  // Static assets - cache first
  if (destination === 'image' || destination === 'font' || destination === 'style') {
    event.respondWith(CACHE_STRATEGIES.cacheFirst(event.request, STATIC_CACHE_NAME));
    return;
  }
  
  // JavaScript - stale while revalidate (for faster updates)
  if (destination === 'script' && url.origin === self.location.origin) {
    event.respondWith(CACHE_STRATEGIES.staleWhileRevalidate(event.request, CACHE_NAME));
    return;
  }
  
  // HTML pages - network first (for fresh content)
  if (destination === 'document' || event.request.mode === 'navigate') {
    event.respondWith(CACHE_STRATEGIES.networkFirst(event.request, CACHE_NAME));
    return;
  }
  
  // Same-origin requests - stale while revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(CACHE_STRATEGIES.staleWhileRevalidate(event.request, CACHE_NAME));
    return;
  }
  
  // Let all other requests pass through normally
});

// Handle service worker updates
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Allow cache clearing
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }
});

console.log('CuizIN Service Worker initialized with caching strategies');
