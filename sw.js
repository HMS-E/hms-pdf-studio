/* Network-first application cache; external PDF libraries may need internet. */
const CACHE = 'hms-pdf-studio-v1-8';
const LOCAL = [
  './', './index.html', './style.css?v=18', './app.js?v=18',
  './enhancements.js?v=18', './language.js?v=18',
  './word-conversion.js?v=18', './icon.svg', './manifest.webmanifest'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(LOCAL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('hms-pdf-studio-') && key !== CACHE).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) {
      const clone = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, clone)).catch(console.warn);
    }
    return response;
  }).catch(() => caches.match(event.request)));
});
