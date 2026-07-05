const VERSION = 'atlas-v1.0.0';
const CORE_CACHE = `${VERSION}-core`;
const CDN_CACHE = `${VERSION}-cdn`;

const CORE_ASSETS = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-152.png',
  './icons/icon-192.png',
  './icons/icon-384.png',
  './icons/icon-512.png'
];

// Best-effort precache of third-party assets (fonts / chart lib / icon lib).
// These are cross-origin, so failures here must never break install.
const CDN_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.4/chart.umd.min.js',
  'https://unpkg.com/lucide@latest',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Manrope:wght@500;600;700;800&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const coreCache = await caches.open(CORE_CACHE);
    await coreCache.addAll(CORE_ASSETS);
    const cdnCache = await caches.open(CDN_CACHE);
    await Promise.all(CDN_ASSETS.map(async (url) => {
      try {
        const res = await fetch(url, { mode: 'no-cors' });
        await cdnCache.put(url, res);
      } catch (e) { /* offline install or blocked - ignore, runtime SWR will retry */ }
    }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((k) => k !== CORE_CACHE && k !== CDN_CACHE)
      .map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

function isCoreAsset(url) {
  return CORE_ASSETS.some((a) => url.endsWith(a.replace('./', '/')) || url.endsWith(a));
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Navigations: network-first, fall back to cached shell, then offline page.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CORE_CACHE);
        cache.put('./index.html', fresh.clone());
        return fresh;
      } catch (e) {
        const cache = await caches.open(CORE_CACHE);
        return (await cache.match('./index.html')) || (await cache.match('./offline.html'));
      }
    })());
    return;
  }

  // Same-origin static assets: cache-first, update cache in background.
  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(CORE_CACHE);
      const cached = await cache.match(req);
      const networkFetch = fetch(req).then((res) => {
        if (res && res.status === 200) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      return cached || (await networkFetch) || Response.error();
    })());
    return;
  }

  // Cross-origin CDN assets (fonts, Chart.js, lucide): stale-while-revalidate.
  event.respondWith((async () => {
    const cache = await caches.open(CDN_CACHE);
    const cached = await cache.match(req);
    const networkFetch = fetch(req, { mode: 'no-cors' }).then((res) => {
      cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    return cached || (await networkFetch) || fetch(req).catch(() => Response.error());
  })());
});

// Allow the page to trigger an immediate activation after an update.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
