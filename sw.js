/* Cache limité à MF Tools, dans le périmètre de cette application. */
var VERSION = '3.0.0';
var CACHE = 'mf-tools-v3-' + VERSION;
var ASSETS = ['./', 'index.html', 'style.css?v=' + VERSION, 'data.js?v=' + VERSION, 'app.js?v=' + VERSION, 'icon.svg', 'icon.png', 'manifest.json'];
self.addEventListener('install', function(event) {
  event.waitUntil(caches.open(CACHE).then(function(cache) { return cache.addAll(ASSETS); }));
});
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('activate', function(event) {
  event.waitUntil(caches.keys().then(function(keys) {
    return Promise.all(keys.filter(function(key) {
      return (key === 'mf-tools-v1' || key.indexOf('mf-tools-v2-') === 0 || key.indexOf('mf-tools-v3-') === 0) && key !== CACHE;
    }).map(function(key) { return caches.delete(key); }));
  }).then(function() { return self.clients.claim(); }));
});
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin || url.href.indexOf(self.registration.scope) !== 0) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(function() {
      return caches.open(CACHE).then(function(cache) { return cache.match('index.html'); });
    }));
    return;
  }
  event.respondWith(caches.open(CACHE).then(function(cache) {
    return cache.match(event.request).then(function(hit) { return hit || fetch(event.request); });
  }));
});
