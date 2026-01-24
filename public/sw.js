// Service Worker for Push Notifications
// K-Worship Web Push Notification Handler

self.addEventListener('push', function(event) {
  console.log('[SW] Push received:', event);
  
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch (e) {
    console.error('[SW] Error parsing push data:', e);
    data = { title: 'K-Worship', body: '새 알림이 있습니다' };
  }
  
  const options = {
    body: data.body || '새 알림이 있습니다',
    icon: '/kworship-icon.png',
    badge: '/kworship-icon.png',
    tag: data.notificationId || 'default',
    renotify: true,
    data: {
      url: data.url || '/',
      notificationId: data.notificationId
    },
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: '열기' },
      { action: 'close', title: '닫기' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'K-Worship', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', function(event) {
  console.log('[SW] Notification closed');
});

// Service Worker install
self.addEventListener('install', function(event) {
  console.log('[SW] Installing service worker...');
  self.skipWaiting();
});

// Service Worker activate
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating service worker...');
  event.waitUntil(clients.claim());
});
