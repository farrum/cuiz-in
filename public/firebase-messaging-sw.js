
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

// IMPORTANT: Block problematic scripts
self.addEventListener('fetch', event => {
  const url = event.request.url;
  
  // Block TCPusher and problematic scripts
  if (url.includes('onclickpsh.com') || 
      url.includes('TCPusher') || 
      url.includes('push.js') ||
      url.includes('mrtnsvr.com')) {
    
    console.log('Blocking problematic script request:', url);
    event.respondWith(new Response('// Script blocked by service worker', {
      status: 200,
      headers: new Headers({'Content-Type': 'application/javascript'})
    }));
    return;
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
