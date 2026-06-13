// Minimal service worker: required for the "Install app" prompt, and caches the
// app shell so it opens instantly. The booking app itself (Google) always loads
// live from the network.
var CACHE = 'campenoki-shell-v1';
var SHELL = ['.', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var url = e.request.url;
  // Let the live booking app (Google) always hit the network.
  if (url.indexOf('script.google') >= 0 || url.indexOf('googleusercontent') >= 0) return;
  // Shell files: serve from cache first, fall back to network.
  e.respondWith(caches.match(e.request).then(function (r) { return r || fetch(e.request); }));
});
