// Service Worker v3 - Security hardened
// Blocks all known malicious ad domains, forces cache purge

const CACHE_NAME = 'cuizin-v3';
const STATIC_CACHE_NAME = 'cuizin-static-v3';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json'
];

// ALL known malicious domains
const MALICIOUS_DOMAINS = [
  'onclickpsh.com',
  'mrtnsvr.com',
  'richinfo.co',
  'onclckmn.com',
  'wpadmngr.com',
  'acscdn.com',
  'adexchangeclear.com',
  'a3klsam',
  'TCPusher',
  'goodgaming138',
  'mahjong222',
  'push.js',
  'vo2pn0.js',
  'Va3pn0.js',
  'push.m.js'
];

const CACHE_STRATEGIES = {
  cacheFirst: async (request, cacheName) => {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    } catch (error) {
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
      return cached || new Response('Offline', { status: 503 });
    }
  },
  staleWhileRevalidate: async (request, cacheName) => {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    const fetchPromise = fetch(request).then(response => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    }).catch(() => cached);
    return cached || fetchPromise;
  }
};

self.addEventListener('install', event => {
  console.log('Service Worker v3: Installing - security hardened');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// AGGRESSIVE cache purge on activate - delete ALL old caches
self.addEventListener('activate', event => {
  console.log('Service Worker v3: Activating - purging ALL old caches');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== STATIC_CACHE_NAME)
          .map(name => {
            console.log('SW v3: Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Block ALL malicious domains
  for (const domain of MALICIOUS_DOMAINS) {
    if (url.hostname.includes(domain) || url.href.toLowerCase().includes(domain.toLowerCase())) {
      console.log('SW v3: BLOCKED malicious:', url.href);
      event.respondWith(new Response('', { status: 204 }));
      return;
    }
  }
  
  if (event.request.method !== 'GET') return;
  
  const skipPatterns = ['googlesyndication', 'googletagmanager', 'google-analytics', 'doubleclick', 'adsbygoogle', 'supabase.co', 'gpteng.co'];
  if (skipPatterns.some(p => url.href.includes(p))) return;
  
  const dest = event.request.destination;
  if (dest === 'image' || dest === 'font' || dest === 'style') {
    event.respondWith(CACHE_STRATEGIES.cacheFirst(event.request, STATIC_CACHE_NAME));
  } else if (dest === 'script' && url.origin === self.location.origin) {
    event.respondWith(CACHE_STRATEGIES.staleWhileRevalidate(event.request, CACHE_NAME));
  } else if (dest === 'document' || event.request.mode === 'navigate') {
    event.respondWith(CACHE_STRATEGIES.networkFirst(event.request, CACHE_NAME));
  } else if (url.origin === self.location.origin) {
    event.respondWith(CACHE_STRATEGIES.staleWhileRevalidate(event.request, CACHE_NAME));
  }
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys().then(names => names.forEach(name => caches.delete(name)));
  }
});

console.log('CuizIN Service Worker v3 - malicious ad networks blocked');
