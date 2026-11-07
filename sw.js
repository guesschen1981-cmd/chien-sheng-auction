/* ============================================================
   建生工坊拍賣系統  –  sw.js (Service Worker 腳本)
   ============================================================ */
const CACHE_NAME = 'jiansheng-auction-v26';
const ASSETS = [
  './',
  './index.html',
  './style.css?v=6.4&t=20261107_unified',
  './app.js?v=6.4&t=20261107_unified',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('message', event => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // 對於 Firebase 與外部 CDN 走網絡優先
  if (event.request.url.includes('firebaseio.com') || event.request.url.includes('googleapis.com')) {
    return;
  }
  // 網絡優先 (Network First)，網路異常時才回退至快取，確保即時取得最新代碼
  event.respondWith(
    fetch(event.request)
      .then(res => {
        if (res && res.status === 200) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
