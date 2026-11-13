/* ============================================================
   建生工坊拍賣系統  –  sw.js (Service Worker 腳本)
   ============================================================ */
const CACHE_NAME = 'jiansheng-auction-v41';
const ASSETS = [
  './',
  './index.html',
  './style.css?v=7.9&t=20261113_qa_resizable',
  './app.js?v=7.9&t=20261113_qa_resizable',
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
  if (
    event.request.url.includes('firebaseio.com') ||
    event.request.url.includes('firebasedatabase.app') ||
    event.request.url.includes('googleapis.com') ||
    event.request.url.includes('my_auction_data.json')
  ) {
    return;
  }
  // 網路優先 (Network First)，確保即時載入最新 HTML/CSS/腳本，離線時才回退快取
  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
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
