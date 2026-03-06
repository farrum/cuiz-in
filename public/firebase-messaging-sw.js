// Firebase messaging service worker - v3 security hardened
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDyJPPlnIMOLS8P1TMOVI3-lfKZyx3lZiU',
  authDomain: 'quiz-app-notifications.firebaseapp.com',
  projectId: 'quiz-app-notifications',
  messagingSenderId: '408045722227',
  appId: '1:408045722227:web:3b8c7da9311f9f578c83b0'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('push', function(event) {
  console.log('Push received');
});

// ALL known malicious domains to block
const BLOCKED_DOMAINS = [
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
  'sdk/push',
  'Va3pn0.js',
  'push.m.js',
  'adspector.io',
  'pageadsodar'
];

self.addEventListener('fetch', event => {
  const url = event.request.url;
  try {
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
    console.error('SW fetch handler error:', e);
  }
});

// Load optional sw.js
if (!self.swLoaded) {
  self.swLoaded = true;
  try { importScripts('/sw.js'); } catch(e) {}
}

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('error', event => {
  if (event.message && (event.message.includes('TCPusher') || event.message.includes('Attestation'))) {
    event.preventDefault();
  }
});
