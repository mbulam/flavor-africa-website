// flavor.africa app mode (added 10 Nov 2026).
// Speed first (changed 10 Nov 2026): a page the phone fetched in the last 10 minutes opens straight from the
// phone, and is refreshed quietly behind the scenes. Older copies wait up to 1.5 seconds for a fresh one,
// then fall back to the saved copy, so a slow network never leaves a blank screen and saved stories open offline.
// The stylesheet and app code are served from the phone and refreshed in the background. Photos likewise.
// Bump VERSION if this file ever changes in a way that should clear old copies.
var VERSION = "fa-v11";
var PAGES = VERSION + "-pages";
var IMAGES = VERSION + "-images";
var MAX_IMAGES = 80;

self.addEventListener("install", function (e) {
  var first = ["/", "/style.css", "/favicon.svg", "/icons/app-192.png", "/app/app.css", "/app/app.js", "/app/feed.json", "/live"];
  e.waitUntil(caches.open(PAGES).then(function (c) {
    return Promise.all(first.map(function (u) { return c.add(u).catch(function () {}); }));
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

// Cloudflare serves /story.html at /story, so both are filed under one name.
function keyOf(url) {
  var p = url.pathname.replace(/\.html$/, "").replace(/\/index$/, "/");
  return url.origin + (p || "/");
}
var FRESH = 10 * 60 * 1000, WAIT = 1500, flying = {};

// fetch a page or file, keep a time-stamped copy, and share the request if it is already under way
function pull(key) {
  if (flying[key]) return flying[key].then(function (r) { return r.clone(); });
  var p = fetch(key, { credentials: "same-origin" }).then(function (res) {
    if (!res.ok) return res;
    return res.blob().then(function (body) {
      var h = new Headers(res.headers); h.set("x-fa-at", String(Date.now()));
      var mk = function () { return new Response(body, { status: 200, headers: h }); };
      return caches.open(PAGES).then(function (c) { return c.put(key, mk()); }).then(mk, mk);
    });
  });
  flying[key] = p;
  var done = function () { delete flying[key]; };
  p.then(done, done);
  return p.then(function (r) { return r.clone(); });
}
function age(res) { return Date.now() - (+res.headers.get("x-fa-at") || 0); }
function offline() { return new Response(OFFLINE, { headers: { "Content-Type": "text/html; charset=utf-8" } }); }

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Google Analytics, fonts, chart players: leave alone
  if (url.pathname.indexOf("/api/") === 0) return;  // votes and Fan Seat always go straight to the server

  var nav = req.mode === "navigate";
  var isCode = /\.(css|js)$/.test(url.pathname);
  var isPage = nav || /\.(html|json)$/.test(url.pathname) || (req.headers.get("accept") || "").indexOf("text/html") > -1;

  if (isCode) { // from the phone at once, refreshed behind the scenes
    var ck = url.origin + url.pathname;
    e.respondWith(caches.match(ck).then(function (hit) {
      var net = pull(ck);
      if (hit) { e.waitUntil(net.catch(function () {})); return hit; }
      return net;
    }));
    return;
  }

  if (isPage) {
    var key = /\.json$/.test(url.pathname) ? url.origin + url.pathname : keyOf(url);
    e.respondWith(caches.match(key).then(function (hit) {
      if (hit && age(hit) < FRESH) {
        if (age(hit) > 60000) e.waitUntil(pull(key).catch(function () {}));
        return hit;
      }
      var net = pull(key).then(function (res) { return res.ok || !hit ? res : hit; });
      if (!hit) return net.then(function (res) { return res.ok ? res : fetch(req); }).catch(function () { return nav ? offline() : Response.error(); });
      e.waitUntil(net.catch(function () {}));
      return Promise.race([
        net.catch(function () { return hit; }),
        new Promise(function (ok) { setTimeout(function () { ok(hit); }, WAIT); })
      ]);
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
        if (hit) { e.waitUntil(net); return hit; }
        return net;
      });
    }));
  }
});

// Alerts (added 11 Nov 2026). The phone is only poked; the words come from /api/push?latest=1.
self.addEventListener("push", function (e) {
  e.waitUntil(fetch("/api/push?latest=1", { cache: "no-store" }).then(function (r) { return r.json(); }).catch(function () { return {}; }).then(function (d) {
    var a = (d && d.alert) || { n: 0, title: "flavor.africa", body: "Something new just went up.", url: "/" };
    return self.registration.showNotification(a.title, { body: a.body, icon: "/icons/app-192.png", badge: "/icons/app-192.png", tag: "fa-" + a.n, data: { url: a.url || "/" } });
  }));
});
self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var to = new URL((e.notification.data && e.notification.data.url) || "/", self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) if ("focus" in list[i]) { if ("navigate" in list[i]) list[i].navigate(to); return list[i].focus(); }
    return self.clients.openWindow(to);
  }));
});
