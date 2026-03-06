
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

// Block list for malicious domains - DO NOT add cuiz.in here
const BLOCKED_DOMAINS = [
  'onclickpsh.com', 
  'mrtnsvr.com', 
  'TCPusher',
  'richinfo.co',
  'onclckmn.com',
  'wpadmngr.com',
  'goodgaming138',
  'mahjong222',
  'push.js',
  'vo2pn0.js',
  'sdk/push',
  'Va3pn0.js',
  'push.m.js',
  'adspector.io',
  'pageadsodar'
];

// Block problematic scripts
self.addEventListener('fetch', event => {
  const url = event.request.url;
  
  try {
    // Block sodar requests
    if (url.includes('pageadsodar') || url.includes('sodar2')) {
      event.respondWith(new Response('// blocked', {
        status: 200,
        headers: new Headers({'Content-Type': 'application/javascript'})
      }));
      return;
    }
    
    // Block Topics API attestation errors
    if (url.includes('adspector.io') || url.includes('attestation')) {
      event.respondWith(new Response('// blocked', {
        status: 200,
        headers: new Headers({'Content-Type': 'application/javascript'})
      }));
      return;
    }
    
    // Block AAB requests
    if (url.includes('AAB') || url.includes('aab.min.js')) {
      event.respondWith(new Response('// blocked', {
        status: 200,
        headers: new Headers({'Content-Type': 'application/javascript'})
      }));
      return;
    }
    
    // Block TCPusher service worker registration
    if (url.includes('TCPusher')) {
      event.respondWith(new Response('// blocked', {
        status: 200,
        headers: new Headers({'Content-Type': 'application/javascript'})
      }));
      return;
    }
    
    // Block other malicious domains
    for (const domain of BLOCKED_DOMAINS) {
      if (url.toLowerCase().includes(domain.toLowerCase())) {
        event.respondWith(new Response('// blocked', {
          status: 200,
          headers: new Headers({'Content-Type': 'application/javascript'})
        }));
        return;
      }
    }
  } catch (e) {
    console.error('Error in service worker fetch handler:', e);
  }
});

// Load optional sw.js
if (!self.swLoaded) {
  self.swLoaded = true;
  try {
    importScripts('/sw.js');
  } catch(e) {
    console.log('Optional SW script not found');
  }
}

// Handle messages
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Suppress errors from blocked scripts
self.addEventListener('error', event => {
  if (event.message && (
      event.message.includes('TCPusher') || 
      event.message.includes('Attestation')
  )) {
    event.preventDefault();
  }
});
