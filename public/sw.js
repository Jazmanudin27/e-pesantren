// NWF Mobile Service Worker for Fast PWA Standalone Installation & Push Notifications
const CACHE_NAME = 'nwf-mobile-v7';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    Promise.all([
      generatePaddedPwaIcon(192),
      generatePaddedPwaIcon(256),
      generatePaddedPwaIcon(512)
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

// Helper: Generate Clean White-Background PNG App Icon via OffscreenCanvas (No Green Background, Logo Proporsional)
async function generatePaddedPwaIcon(size = 192) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cacheKey = new Request(`${self.location.origin}/pwa-icon-${size}.png?v=6`);
    const cachedRes = await cache.match(cacheKey);
    if (cachedRes) return cachedRes;

    const logoRes = await fetch('/nwf.png', { cache: 'force-cache' });
    if (!logoRes.ok) return fetch('/nwf.png');
    const logoBlob = await logoRes.blob();
    const bitmap = await createImageBitmap(logoBlob);

    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // 1. Pure White Background (#ffffff) tanpa warna hijau
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // 2. Draw NWF Logo Centered at 72% Scale (Proporsional & Tidak Kepotong)
    const logoSize = Math.round(size * 0.72);
    const logoOffset = Math.round((size - logoSize) / 2);
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

  // JANGAN intercept endpoint API atau asset JS/CSS Vite agar chunk mismatch / wake-up network glitch tidak jadi 503 text/plain
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/node_modules/')
  ) {
    return;
  }

  if (url.pathname === '/pwa-icon-192.png' || url.pathname === '/pwa-icon-maskable-192.png') {
    event.respondWith(generatePaddedPwaIcon(192));
    return;
  }
  if (url.pathname === '/pwa-icon-256.png') {
    event.respondWith(generatePaddedPwaIcon(256));
    return;
  }
  if (url.pathname === '/pwa-icon-512.png' || url.pathname === '/pwa-icon-maskable-512.png') {
    event.respondWith(generatePaddedPwaIcon(512));
    return;
  }

  // Untuk navigasi halaman (index.html), utamakan network no-store; jika gagal (idle wake / offline), tampilkan fallback HTML bersih dengan tombol muat ulang
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(async () => {
        const cached = await caches.match('/');
        if (cached) return cached;
        return new Response(
          '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NWF Mobile</title></head><body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:sans-serif;background:#064e3b;color:#fff;text-align:center;padding:24px"><div><h2 style="margin:0 0 8px">Koneksi Sedang Terputus</h2><p style="opacity:.85;font-size:14px;margin:0 0 18px">Pastikan internet aktif lalu muat ulang aplikasi.</p><button onclick="location.reload()" style="padding:10px 20px;border:none;border-radius:10px;background:#10b981;color:#fff;font-weight:700;cursor:pointer">Muat Ulang</button></div></body></html>',
          { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      return Response.error();
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
