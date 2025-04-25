
// Firebase messaging service worker
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: 'AIzaSyDyJPPlnIMOLS8P1TMOVI3-lfKZyx3lZiU',
  authDomain: 'quiz-app-notifications.firebaseapp.com',
  projectId: 'quiz-app-notifications',
  messagingSenderId: '408045722227',
  appId: '1:408045722227:web:3b8c7da9311f9f578c83b0'
});

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('Received background message: ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle push notifications
self.addEventListener('push', function(event) {
  console.log('Push received: ', event);
});

// Expanded block list for problematic domains
const BLOCKED_DOMAINS = [
  'onclickpsh.com', 
  'mrtnsvr.com', 
  'TCPusher',
  'push.js',
  'vo2pn0.js',
  'sdk/push',
  'Va3pn0.js',
  'push.m.js',
  'ServiceWorker',
  'notification',
  'register',
  'Topics',
  'cuiz.in',
  'adspector.io',
  'attestation',
  'facebook.com',
  'pageadsodar'
];

// IMPORTANT: Block problematic scripts including Topics API and Facebook
self.addEventListener('fetch', event => {
  const url = event.request.url;
  
  try {
    // Always intercept problematic requests
    if (url.includes('pageadsodar') || url.includes('sodar2')) {
      console.log('Intercepting sodar request:', url);
      event.respondWith(new Response('// Request intercepted by service worker', {
        status: 200,
        headers: new Headers({'Content-Type': 'application/javascript'})
      }));
      return;
    }
    
    // Handle Topics API attestation errors more aggressively
    if ((url.includes('cuiz.in') && (url.includes('topics') || url.includes('Topics'))) || 
        url.includes('adspector.io') || 
        url.includes('attestation') ||
        url.includes('facebook.com')) {
      console.log('Intercepting Topics API, attestation or Facebook request:', url);
      event.respondWith(new Response('// Request intercepted by service worker', {
        status: 200,
        headers: new Headers({'Content-Type': 'application/javascript'})
      }));
      return;
    }
    
    // Check for AAB requests, which are often part of problematic ad requests
    if (url.includes('AAB') || url.includes('aab.min.js')) {
      console.log('Intercepting AAB request:', url);
      event.respondWith(new Response('// AAB request intercepted', {
        status: 200,
        headers: new Headers({'Content-Type': 'application/javascript'})
      }));
      return;
    }
    
    // Specifically block TCPusher service worker registration
    if (url.includes('TCPusher') || url.includes('ServiceWorker')) {
      console.log('Blocking TCPusher service worker request:', url);
      event.respondWith(new Response('// TCPusher service worker registration blocked', {
        status: 200,
        headers: new Headers({'Content-Type': 'application/javascript'})
      }));
      return;
    }
    
    // Block other problematic domains
    for (const domain of BLOCKED_DOMAINS) {
      if (url.toLowerCase().includes(domain.toLowerCase())) {
        console.log('Blocking problematic script request:', url);
        event.respondWith(new Response('// Script blocked by service worker', {
          status: 200,
          headers: new Headers({'Content-Type': 'application/javascript'})
        }));
        return;
      }
    }
  } catch (e) {
    console.error('Error in service worker fetch handler:', e);
    // Provide a safe response instead of failing
    event.respondWith(new Response('// Error in service worker, request safely intercepted', {
      status: 200,
      headers: new Headers({'Content-Type': 'application/javascript'})
    }));
  }
  
  // Let all other requests pass through
});

// Create a flag to prevent loading sw.js twice
if (!self.swLoaded) {
  self.swLoaded = true;
  
  // Try to load optional sw.js - but suppress errors
  try {
    importScripts('/sw.js');
    console.log('Successfully loaded optional SW script');
  } catch(e) {
    console.log('Optional SW script not found or failed to load');
  }
}

// Add specific handler for Topics API errors
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Intercept any attempts to register additional service workers or Topics API requests
  if (event.data && (event.data.type === 'REGISTER_SW' || 
      event.data.type === 'TOPICS_API' ||
      (typeof event.data === 'string' && (
        event.data.includes('register') || 
        event.data.includes('Topics') ||
        event.data.includes('attestation'))))) {
    console.log('Intercepted attempt to register additional service worker or use Topics API');
    // Don't pass this message along
    return;
  }
});

// Prevent common error patterns
self.addEventListener('error', event => {
  if (event.message && (
      event.message.includes('TCPusher') || 
      event.message.includes('ServiceWorker') ||
      event.message.includes('register') ||
      event.message.includes('Attestation check for Topics') ||
      event.message.includes('facebook.com')
  )) {
    console.log('Intercepted error in service worker:', event.message);
    event.preventDefault();
  }
});
