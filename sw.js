// flavor.africa app mode (added 10 Nov 2026).
// Pages, the stylesheet and the app's files always come fresh from the internet first, so new stories
// show straight away. A copy is kept so pages already read still open with no signal.
// Photos are served from the saved copy and refreshed in the background.
// Bump VERSION if this file ever changes in a way that should clear old copies.
var VERSION = "fa-v2";
var PAGES = VERSION + "-pages";
var IMAGES = VERSION + "-images";
var MAX_IMAGES = 80;

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(PAGES).then(function (c) {
    return c.addAll(["/", "/style.css", "/favicon.svg", "/icons/app-192.png", "/app/app.css", "/app/app.js", "/app/feed.json"]);
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf(VERSION) !== 0; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function trim(name, max) {
  caches.open(name).then(function (c) {
    c.keys().then(function (keys) {
      if (keys.length > max) c.delete(keys[0]).then(function () { trim(name, max); });
    });
  });
}

var OFFLINE = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<title>Offline | flavor.africa</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#2A0174;color:#fff;font-family:Poppins,Arial,sans-serif;text-align:center;padding:24px;box-sizing:border-box}' +
  'h1{font-size:28px;margin:0 0 8px}p{margin:0 0 20px;opacity:.85;line-height:1.5}a{display:inline-block;background:#F5CC11;color:#2A0174;padding:12px 18px;text-decoration:none;font-weight:700;letter-spacing:.04em}</style></head>' +
  '<body><div><h1>flavor.africa</h1><p>You\'re offline right now.<br>Stories you\'ve already opened still work.</p><a href="/">Try again</a></div></body></html>';

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Google Analytics, fonts, chart players: leave alone

  var isPage = req.mode === "navigate" || /\.(html|css|js|json)$/.test(url.pathname);
  if (isPage) {
    e.respondWith(fetch(req).then(function (res) {
      if (res.ok) { var copy = res.clone(); caches.open(PAGES).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: req.mode === "navigate" }).then(function (hit) {
        return hit || (req.mode === "navigate" ? new Response(OFFLINE, { headers: { "Content-Type": "text/html; charset=utf-8" } }) : Response.error());
      });
    }));
    return;
  }

  if (/\.(jpe?g|png|webp|gif|svg)$/i.test(url.pathname)) {
    e.respondWith(caches.open(IMAGES).then(function (c) {
      return c.match(req).then(function (hit) {
        var net = fetch(req).then(function (res) {
          if (res.ok) { c.put(req, res.clone()); trim(IMAGES, MAX_IMAGES); }
          return res;
        }).catch(function () { return hit || Response.error(); });
        return hit || net;
      });
    }));
  }
});
