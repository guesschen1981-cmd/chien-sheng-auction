/* ============================================================
   建生工坊拍賣系統  –  sw.js (Service Worker 腳本)
   ============================================================ */
const CACHE_NAME = 'jiansheng-auction-v44';
const ASSETS = [
  './',
  './index.html',
  './style.css?v=8.2&t=20261119_audit_full_fix',
  './app.js?v=8.2&t=20261119_audit_full_fix',
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
  // 僅快取同源 GET 靜態資源請求，略過 POST (如 /__save_my_data__) 與第三方 CDN / API
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }
  if (
    event.request.url.includes('firebaseio.com') ||
    event.request.url.includes('firebasedatabase.app') ||
    event.request.url.includes('googleapis.com') ||
    event.request.url.includes('my_auction_data.json') ||
    event.request.url.includes('__server_info__')
  ) {
    return;
  }
  // 網路優先 (Network First)，確保即時載入最新 HTML/CSS/腳本，離線時才回退快取
  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
