// رفيق التثبيت v7.2.0 — Service Worker (Network-First 3s Timeout + Cache-Fallback)
const APP_SW_VERSION = '7.2.0';
const CACHE_NAME = 'rafiq-altathbit-v7.5.0';
const FONT_CACHE = 'rafiq-altathbit-fonts-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css?v=7.5.0',
  './data.js?v=7.5.0',
  './engine.js?v=7.5.0',
  './storage.js?v=7.5.0',
  './app.js?v=7.5.0',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(
          CORE_ASSETS.map((url) =>
            cache.add(url).catch((err) => console.warn('SW precache skip:', url, err))
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        const oldCaches = keys.filter((k) => k !== CACHE_NAME && k !== FONT_CACHE);
        return Promise.all(oldCaches.map((k) => caches.delete(k)))
          .then(() => oldCaches.length > 0);
      })
      .then((hadPreviousCache) =>
        self.clients.claim().then(() => {
          // لا نبث إشعار التحديث عند أول تثبيت إطلاقاً — فقط عند ترقية كاش سابق
          if (!hadPreviousCache) return;
          return self.clients.matchAll({ type: 'window' }).then((clients) => {
            clients.forEach((client) => {
              try { client.postMessage({ type: 'SW_UPDATED', version: APP_SW_VERSION }); } catch (e) {}
            });
          });
        })
      )
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

function fetchWithTimeout(req, ms = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    fetch(req)
      .then((res) => { clearTimeout(timer); resolve(res); })
      .catch((err) => { clearTimeout(timer); reject(err); });
  });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isGoogleFonts =
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com';

  if (isGoogleFonts) {
    event.respondWith(
      caches.open(FONT_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          const networkPromise = fetch(req)
            .then((res) => {
              if (res && (res.status === 200 || res.type === 'opaque')) {
                cache.put(req, res.clone()).catch(() => {});
              }
              return res;
            })
            .catch(() => cached || new Response('', { status: 503 }));
          return cached || networkPromise;
        })
      )
    );
    return;
  }

  if (!isSameOrigin) return;

  // Network-First بمهلة ٣ ثوانٍ ثم fallback للكاش عند بطء الشبكة أو انقطاعها
  event.respondWith(
    fetchWithTimeout(req, 3000)
      .then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, resClone).catch(() => {});
          });
        }
        return networkRes;
      })
      .catch(() =>
        caches.match(req).then((cachedRes) => {
          if (cachedRes) return cachedRes;
          if (req.mode === 'navigate') return caches.match('./index.html');
          return new Response('', { status: 503, statusText: 'Offline' });
        })
      )
  );
});
