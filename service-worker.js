// Always load the latest from the network; only fall back to a saved copy when
// fully offline. This guarantees you never get a stale/cached launcher while you
// have internet. The booking app (Google) is always live and never cached.
var CACHE = 'campenoki-shell-v4';

self.addEventListener('install', function () { self.skipWaiting(); });

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = e.request.url;
  if (url.indexOf('script.google') >= 0 || url.indexOf('googleusercontent') >= 0) return; // booking app: always live
  // Network-first: fetch fresh every time online; keep a copy only for offline fallback.
  e.respondWith(
    fetch(e.request).then(function (resp) {
      if (resp && resp.status === 200) {
        var copy = resp.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      }
      return resp;
    }).catch(function () { return caches.match(e.request); })
  );
});
