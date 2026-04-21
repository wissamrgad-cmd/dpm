// DPM Service Worker v4.1 — updated cache version forces fresh load
const CACHE = 'dpm-v4.1';
const ASSETS = [
  '/dpm/',
  '/dpm/index.html',
  '/dpm/manifest.json',
  '/dpm/icon-192.png',
  '/dpm/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Never cache Microsoft auth, Graph API, or font calls
  if (e.request.url.includes('login.microsoftonline.com') ||
      e.request.url.includes('graph.microsoft.com') ||
      e.request.url.includes('msauth.net') ||
      e.request.url.includes('fonts.googleapis.com') ||
      e.request.url.includes('cdnjs.cloudflare.com') ||
      e.request.url.includes('unpkg.com') ||
      e.request.url.includes('jsdelivr.net')) {
    return;
  }

  // Network first for HTML — so updates are always picked up
  if (e.request.url.endsWith('.html') || e.request.url.endsWith('/dpm/') || e.request.url.endsWith('/dpm')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache first for other assets
  e.respondWith(
    caches.match(e.request)
      .then(r => r || fetch(e.request).then(res => {
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }))
      .catch(() => caches.match('/dpm/'))
  );
});
