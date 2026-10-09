const CACHE = 'bt-ben-202610090148';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './avatar.jpg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
const CDN = 'bt-cdn-v1';   // fonts and icons: they never change at these pinned addresses
const CDN_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'unpkg.com'];
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== CDN).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;           // calls to your Google script are POSTs: never cached here
  if (CDN_HOSTS.includes(url.hostname)) {
    e.respondWith(caches.open(CDN).then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r.ok || r.type === 'opaque') c.put(e.request, r.clone()); return r; }))));
    return;
  }
  if (url.origin !== location.origin) return;
  if (e.request.mode === 'navigate') {
    // Open instantly from the phone; fetch the newest screens in the background for next time.
    const fresh = fetch(e.request).then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); } return r; });
    e.respondWith(caches.match('./index.html').then(hit => hit || fresh));
    e.waitUntil(fresh.catch(() => {}));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
});
