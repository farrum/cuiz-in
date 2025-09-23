// Minimal service worker that only blocks truly malicious domains
// This version allows all legitimate scripts and ad libraries to load normally

const MALICIOUS_DOMAINS = [
  'onclickpsh.com',
  'mrtnsvr.com'
];

// Only block very specific malicious domains
self.addEventListener('fetch', event => {
  const url = event.request.url;
  
  try {
    // Check if the request is to a known malicious domain
    for (const domain of MALICIOUS_DOMAINS) {
      if (url.toLowerCase().includes(domain.toLowerCase())) {
        console.log('SW: Blocking malicious domain:', url);
        event.respondWith(new Response('', {
          status: 204,
          headers: new Headers()
        }));
        return;
      }
    }
  } catch (e) {
    console.error('Error in SW fetch handler:', e);
  }
  
  // Let all other requests pass through normally (including all ad scripts)
});

// Handle service worker updates
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('Minimal service worker initialized - only blocking malicious domains');