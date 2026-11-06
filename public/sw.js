// NWF Mobile Service Worker for Fast PWA Standalone Installation & Push Notifications
const CACHE_NAME = 'nwf-mobile-v5';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    Promise.all([
      generatePaddedPwaIcon(192, false),
      generatePaddedPwaIcon(512, false),
      generatePaddedPwaIcon(512, true)
    ]).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Helper: Generate Luxury Padded PNG App Icon via OffscreenCanvas so Logo is 100% visible & never clipped
async function generatePaddedPwaIcon(size = 512, isMaskable = false) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cacheKey = new Request(`${self.location.origin}/pwa-icon-${isMaskable ? 'maskable-' : ''}${size}.png`);
    const cachedRes = await cache.match(cacheKey);
    if (cachedRes) return cachedRes;

    const logoRes = await fetch('/nwf.png', { cache: 'force-cache' });
    if (!logoRes.ok) return fetch('/nwf.png');
    const logoBlob = await logoRes.blob();
    const bitmap = await createImageBitmap(logoBlob);

    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext('2d');
    const center = size / 2;

    // 1. Luxury Emerald-Teal Background
    const bgGrad = ctx.createLinearGradient(0, 0, size, size);
    bgGrad.addColorStop(0, '#064e3b');
    bgGrad.addColorStop(0.5, '#0d766e');
    bgGrad.addColorStop(1, '#059669');

    if (isMaskable) {
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, size, size);
    } else {
      const radius = size * 0.22;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(0, 0, size, size, radius);
      } else {
        ctx.rect(0, 0, size, size);
      }
      ctx.fillStyle = bgGrad;
      ctx.fill();
    }

    // 2. Outer Gold-Mint Accent Ring inside Safe Zone
    const outerRingRadius = size * 0.37;
    ctx.beginPath();
    ctx.arc(center, center, outerRingRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(167, 243, 208, 0.8)';
    ctx.lineWidth = Math.max(2, size * 0.01);
    ctx.stroke();

    // 3. Crisp White Inner Circle Badge
    const whiteBadgeRadius = size * 0.345;
    ctx.beginPath();
    ctx.arc(center, center, whiteBadgeRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // 4. Draw NWF Logo Centered at 56% Scale (Never Clipped)
    const logoSize = size * 0.56;
    const logoOffset = (size - logoSize) / 2;
    ctx.drawImage(bitmap, logoOffset, logoOffset, logoSize, logoSize);

    const outBlob = await canvas.convertToBlob({ type: 'image/png' });
    const response = new Response(outBlob, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=604800'
      }
    });
    await cache.put(cacheKey, response.clone());
    return response;
  } catch (err) {
    return fetch('/nwf.png');
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // JANGAN intercept request cross-origin (seperti Midtrans snap.js, Google Fonts, CDN) agar tidak error Response undefined
  if (url.origin !== self.location.origin) return;

  // JANGAN intercept endpoint API
  if (url.pathname.startsWith('/api/')) return;

  if (url.pathname === '/pwa-icon-192.png') {
    event.respondWith(generatePaddedPwaIcon(192, false));
    return;
  }
  if (url.pathname === '/pwa-icon-512.png') {
    event.respondWith(generatePaddedPwaIcon(512, false));
    return;
  }
  if (url.pathname === '/pwa-icon-maskable-512.png') {
    event.respondWith(generatePaddedPwaIcon(512, true));
    return;
  }

  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      return new Response('Offline', { status: 503, statusText: 'Offline' });
    })
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
