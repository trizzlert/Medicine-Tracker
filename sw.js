const CACHE_NAME = 'medicine-tracker-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch from cache
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// Handle background notifications
self.addEventListener('push', event => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url,
      medicineId: data.medicineId
    },
    actions: [
      {
        action: 'take',
        title: '✓ Mark as taken'
      },
      {
        action: 'snooze',
        title: '⏰ Snooze 10 min'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'take') {
    // Send message to client to mark as taken
    event.waitUntil(
      clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'MARK_TAKEN',
            medicineId: event.notification.data.medicineId
          });
        });
      })
    );
  } else if (event.action === 'snooze') {
    // Snooze for 10 minutes
    const snoozeTime = Date.now() + 10 * 60 * 1000;
    event.waitUntil(
      clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SNOOZE',
            medicineId: event.notification.data.medicineId,
            snoozeTime: snoozeTime
          });
        });
      })
    );
  } else {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});