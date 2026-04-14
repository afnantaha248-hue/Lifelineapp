// ══════════════════════════════════════════
//  Lifeline PWA – Service Worker
//  يتيح العمل بدون إنترنت وتخزين الملفات
// ══════════════════════════════════════════

const CACHE_NAME = 'lifeline-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// ══ تثبيت: تخزين الملفات ══
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('✅ Lifeline: تم تخزين الملفات');
      return cache.addAll(ASSETS);
    }).catch(err => console.log('تخزين جزئي:', err))
  );
  self.skipWaiting();
});

// ══ تفعيل: حذف الكاش القديم ══
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ══ اعتراض الطلبات: عرض من الكاش أو الإنترنت ══
self.addEventListener('fetch', event => {
  // تجاهل طلبات غير GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // تخزين الملفات الجديدة
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(() => {
        // إذا لا يوجد إنترنت، أعد الصفحة الرئيسية
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// ══ الإشعارات Push (مستقبلاً) ══
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || '🩸 Lifeline', {
      body: data.body || 'يوجد طلب دم جديد في منطقتك',
      icon: './icon-192.png',
      badge: './icon-192.png',
      dir: 'rtl',
      lang: 'ar',
      vibrate: [200, 100, 200],
      data: { url: data.url || './' }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
