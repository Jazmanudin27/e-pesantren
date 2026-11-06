// NWF Mobile Service Worker for Fast PWA Standalone Installation & Push Notifications
const CACHE_NAME = 'nwf-mobile-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// Listener untuk menampilkan Native System Notification (Ala Shopee) di Bar Atas HP
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_WALI_NOTIFICATION') {
    const { title, body, tag, targetTab, notifId } = event.data.payload || {};
    const options = {
      body: body || 'Ada pembaruan aktivitas santri di Pondok Pesantren.',
      icon: '/nwf.png',
      badge: '/nwf.png',
      tag: tag || `nwf-notif-${notifId || Date.now()}`,
      renotify: true,
      vibrate: [200, 100, 200],
      data: {
        targetTab: targetTab || 'notifikasi',
        notifId: notifId || null,
        url: '/?source=pwa#wali'
      }
    };

    event.waitUntil(
      self.registration.showNotification(title || 'NWF Mobile - Info Santri', options)
    );
  }
});

// Listener saat Notifikasi di Bar Atas HP diketuk oleh Orang Tua
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetTab = event.notification.data?.targetTab || 'notifikasi';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({
            type: 'NAVIGATE_FROM_NOTIFICATION',
            targetTab
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(`/?source=pwa&tab=${encodeURIComponent(targetTab)}#wali`);
      }
    })
  );
});
