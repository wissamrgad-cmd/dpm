// DPM Service Worker v4.0
const CACHE = 'dpm-v4.0';
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
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Never intercept Microsoft auth or Graph API calls
  if (e.request.url.includes('login.microsoftonline.com') ||
      e.request.url.includes('graph.microsoft.com') ||
      e.request.url.includes('msauth.net') ||
      e.request.url.includes('fonts.googleapis.com') ||
      e.request.url.includes('cdnjs.cloudflare.com')) {
    return;
  }
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
