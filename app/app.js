// flavor.africa app: features that only exist when the site is opened from the home-screen icon (added 10 Nov 2026).
// Look v3 (16 Nov 2026): the whole app rebuilt on one design system (app/fx.css). Tabs: Today, Discover, Flavor FM,
// Games, Live. Your circle (top right) opens Me. Every screen uses the same header, title, photo card, row and buttons.
//   Today      - Today's picks, Flavor Daily, what you follow, the latest.
//   Discover   - search, topic filters, every section to follow.
//   Flavor FM  - featured track, our playlist, the Flavor 10 (with Fans' pick) and The Mix.
//   Games      - games.html: Flavor Trivia (with the daily reminder) and Flavor Connections; each game has its own page.
//   Live       - our next event, Fan Seat, Nairobi This Weekend.
//   Me         - streak, saved stories, alerts, trivia reminder, dark mode.
//   Stories    - open on the full photo with the headline set on it.
// Everything is stored on the phone (localStorage). Story data comes from /app/feed.json, built by _site.py.
(function () {
  var R = document.documentElement;
  if (!R.classList.contains("app")) return;

  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function nbo() { return new Date(Date.now() + 108e5).toISOString(); }      // Nairobi time, as text
  function nice(p) { var d = p.slice(0, 10).split("-"); return +d[2] + " " + MONTHS[+d[1] - 1] + " " + d[0]; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function el(tag, cls, html) { var x = document.createElement(tag); if (cls) x.className = cls; if (html != null) x.innerHTML = html; return x; }
  var ICON = {
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    mark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5h12v17l-6-4.2-6 4.2z"/></svg>',
    go: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    me: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c1.2-3.4 3.8-5 7-5s5.8 1.6 7 5"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></svg>'
  };
  // ---- the shared pieces (app/fx.css) ----
  var SMALL = /^(and|the|of|a|an|is|in|to|for|on|at|with|by|from|as|its|it|his|her|their|our|your|be|was|are|how|why|what|who|after|into|than|but|or|not|still|again|this|that|just|over|up|out)$/i;
  // a headline in the post style: names and big words bold, the little words light
  function capHtml(t) {
    return String(t).split(/(\s+)/).map(function (w) { return /^\s+$/.test(w) || !w ? w : (SMALL.test(w.replace(/[^a-z]/gi, "")) ? "<span>" + esc(w) + "</span>" : "<b>" + esc(w) + "</b>"); }).join("");
  }
  function ttl(h, p) { return '<div class="fx-ttl"><h1 class="fx-cap">' + h + "</h1>" + (p ? "<p>" + p + "</p>" : "") + "</div>"; }
  function sec(h, btn) { return '<div class="fx-sec"><h2 class="fx-cap">' + h + "</h2>" + (btn || "") + "</div>"; }
  function th(img, pos) { return '<span class="fx-th" style="background-image:url(\'/' + esc(img) + '\');background-position:' + esc(pos || "center") + '"></span>'; }
  function storyRow(s, k) {
    return '<a class="fx-row" href="/' + s.s + '.html">' + th(s.i, s.o) + '<span class="fx-tx"><i>' + esc(k || (s.t + " · " + shortDate(s.p))) + "</i><b>" + esc(s.h) + '</b></span><span class="fx-ix">' + ICON.go + "</span></a>";
  }
  function shortDate(p) { return nice(p).replace(/ \d{4}$/, ""); }

  var toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = el("div", "fa-toast"); toastEl.setAttribute("role", "status"); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add("on");
    clearTimeout(toast.t); toast.t = setTimeout(function () { toastEl.classList.remove("on"); }, 2200);
  }

  var page = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "") || "index";

  // Clear the phone's saved pages and code (photos stay), fetch the app's own files straight from the server
  // (cache "reload" skips the phone's browser cache too, which on iPhone could hand back the old copy and leave
  // the app one update behind), then reload. Used by the update check and by pull to refresh (15 Nov 2026).
  function freshen() {
    var core = ["/", "/index.html", "/app/app.js", "/app/app.css", "/app/fanseat.js", "/app/feed.json", "/app/trivia.js", "/app/trivia.json", "/app/trivia.css", "/app/connections.js", "/app/connections.json", "/app/connections.css", "/app/mini.js", "/app/mini.json", "/app/mini.css", "/app/gta.js", "/app/gta.json", "/app/gta.css", "/app/fx.css", "/style.css", location.pathname];
    var wipe = window.caches ? caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k.indexOf("-images") < 0; }).map(function (k) { return caches.delete(k); }));
    }) : Promise.resolve();
    var go = function () { location.reload(); };
    wipe.catch(function () {}).then(function () {
      return Promise.all(core.map(function (u) { return fetch(u, { cache: "reload", credentials: "same-origin" }).catch(function () {}); }));
    }).then(go, go);
    setTimeout(go, 6000); // never leave the reader waiting on a slow network
  }

  // Updates without reinstalling (14 Nov 2026): each time the app opens or comes back to the front, ask the
  // server for the site's fingerprint. If it changed since last time, clear the saved pages and code (photos stay)
  // and reload once, so the phone shows the new version straight away.
  (function () {
    var K = "fa-ver", busy = false, last = 0;
    function check() {
      if (busy || Date.now() - last < 30000) return;
      busy = true; last = Date.now();
      fetch("/app/version.txt?t=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.ok ? r.text() : ""; }).then(function (v) {
        v = (v || "").trim(); busy = false;
        if (!/^[0-9a-f]{6,}$/.test(v)) return;
        var had = store.get(K, "");
        store.set(K, v);
        if (!had || had === v) return;
        freshen();
      }).catch(function () { busy = false; });
    }
    check();
    document.addEventListener("visibilitychange", function () { if (!document.hidden) check(); });
    window.addEventListener("pageshow", function (e) { if (e.persisted) check(); });
  })();

  // Speed: fetch the pages behind the tabs and the stories on screen ahead of the tap, so they open at once.
  (function () {
    var c = navigator.connection || {}, seen = {}, left = 14;
    if (c.saveData || !("serviceWorker" in navigator)) return;
    function warm(a) {
      var u; try { u = new URL(a.href); } catch (e) { return; }
      if (u.origin !== location.origin || u.pathname.indexOf("/api/") === 0 || /\.(jpg|png|mp4|pdf)$/i.test(u.pathname)) return;
      var k = u.pathname.replace(/\.html$/, "");
      if (seen[k] || k === location.pathname.replace(/\.html$/, "") || left <= 0) return;
      seen[k] = 1; left--;
      fetch(u.pathname).catch(function () {});
    }
    function start() {
      [].forEach.call(document.querySelectorAll(".fa-tabs a"), warm);
      if (!("IntersectionObserver" in window)) return;
      var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { io.unobserve(x.target); warm(x.target); } }); }, { rootMargin: "200px" });
      [].forEach.call(document.querySelectorAll("main a[href]"), function (a) { io.observe(a); });
      new MutationObserver(function (ms) { ms.forEach(function (m) { [].forEach.call(m.addedNodes, function (n) { if (n.querySelectorAll) [].forEach.call(n.querySelectorAll("a[href]"), function (a) { io.observe(a); }); }); }); })
        .observe(document.body, { childList: true, subtree: true });
    }
    document.addEventListener("pointerdown", function (e) { var a = e.target.closest && e.target.closest("a[href]"); if (a) { left++; warm(a); } }, { passive: true });
    if (document.readyState === "complete") setTimeout(start, 800); else window.addEventListener("load", function () { setTimeout(start, 800); });
  })();

  fetch("/app/feed.json").then(function (r) { return r.json(); }).then(function (feed) {
    var now = nbo().slice(0, 16);
    var live = feed.stories.filter(function (s) { return s.p <= now; });
    var bySlug = {}; live.forEach(function (s) { bySlug[s.s] = s; });
    saved(bySlug);
    shell(feed, live, bySlug);
    if (page === "index") vote(feed);
    daily(feed, live);
  }).catch(function () { R.classList.remove("fa-s-live"); });

  // ---------- Header: back (inner pages) and your circle (opens Me) ----------
  var barEl = document.querySelector("header .bar"), hero = null;
  (function () {
    var hr = document.querySelector("header .hdr-r");
    if (hr) { var me = el("button", "fx-me", "<span>" + ICON.me + "</span>"); me.type = "button"; me.setAttribute("aria-label", "You: saved stories and settings"); me.setAttribute("data-me", ""); hr.appendChild(me); }
  })();
  function goBack() { if (history.length > 1 && document.referrer.indexOf(location.origin) === 0) history.back(); else location.href = "/"; }
  function backBtn() { var b = el("button", "fa-back", ICON.back); b.type = "button"; b.setAttribute("aria-label", "Back"); b.addEventListener("click", goBack); return b; }

  // ---------- Stories: the photo on top, headline set on it (like the posts) ----------
  (function () {
    var art = document.querySelector("article .art"), lead = art && art.querySelector("figure img.lead, figure img");
    var h1 = art && art.querySelector("h1");
    if (!art || !lead || !h1) return;
    var dek = art.querySelector(".dek"), meta = art.querySelector(".meta"), tag = art.querySelector(".tag"), fig = lead.closest("figure");
    hero = el("div", "fx-hero");
    hero.style.backgroundImage = "url('" + (lead.currentSrc || lead.src) + "')";
    if (lead.style.objectPosition) hero.style.backgroundPosition = lead.style.objectPosition;
    hero.innerHTML = '<div class="in fx"><span class="k">' + esc(meta ? meta.textContent : tag ? tag.textContent : "") + '</span><h1 class="fx-cap">' + capHtml(h1.textContent) + "</h1>" + (dek ? "<p>" + esc(dek.textContent) + "</p>" : "") + "</div>";
    var hbar = el("div", "fx-hbar", "<span></span><span></span>");
    hbar.firstChild.appendChild(backBtn());
    hero.appendChild(hbar);
    art.insertBefore(hero, art.firstChild);
    [tag, h1, dek, meta].forEach(function (x) { if (x) x.style.display = "none"; });
    if (fig) {   // keep the photo credit, under the photo
      var cap = fig.querySelector("figcaption");
      if (cap) { var c = el("p", "fx-credit"); c.textContent = [].map.call(cap.childNodes, function (n) { return n.textContent.trim(); }).filter(Boolean).join(" · "); hero.parentNode.insertBefore(c, hero.nextSibling); }
      fig.style.display = "none";
    }
    R.classList.add("fx-story");
    if (navigator.share) {
      var sh = el("button", "fa-share-h", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 12v8h14v-8"/></svg>');
      sh.type = "button"; sh.setAttribute("aria-label", "Share this story");
      sh.addEventListener("click", function () { navigator.share({ title: h1.textContent, url: "https://flavorafricagroup.org" + location.pathname.replace(/\.html$/, "") }).catch(function () {}); });
      hbar.lastChild.appendChild(sh);
    }
  })();
  if (barEl && ["index", "live", "games"].indexOf(page) < 0 && !hero) { barEl.insertBefore(backBtn(), barEl.firstChild); R.classList.add("fa-inner"); }

  // ---------- Saved ----------
  function saved(bySlug) {
    var list = store.get("fa-saved", []);
    function keep(l) { list = l; store.set("fa-saved", l); }
    if (bySlug[page] && document.querySelector("article")) {
      var b = el("button", "fa-save", ICON.mark);
      b.type = "button";
      var set = function () {
        var on = list.indexOf(page) > -1;
        b.setAttribute("aria-pressed", on ? "true" : "false");
        b.setAttribute("aria-label", on ? "Remove from Saved" : "Save this story");
      };
      set();
      b.addEventListener("click", function () {
        if (list.indexOf(page) > -1) { keep(list.filter(function (x) { return x !== page; })); toast("Removed from Saved"); }
        else {
          keep([page].concat(list));
          toast("Saved. You can read it offline too.");
          fetch(location.pathname).catch(function () {});
          [].forEach.call(document.querySelectorAll("article img"), function (im) { if (im.currentSrc || im.src) fetch(im.currentSrc || im.src).catch(function () {}); });
        }
        set();
      });
      var hb = hero && hero.querySelector(".fx-hbar span:last-child");
      if (hb) hb.insertBefore(b, hb.firstChild); else document.body.appendChild(b);
    }
  }

  // a random code kept on this phone, so one phone gets one pick a day (no name, no account)
  function phoneId() {
    var id = store.get("fa-id", "");
    if (!/^[a-z0-9]{24}$/.test(id)) {
      var a = new Uint8Array(24), abc = "abcdefghijklmnopqrstuvwxyz0123456789"; id = "";
      (window.crypto || window.msCrypto).getRandomValues(a);
      for (var k = 0; k < 24; k++) id += abc[a[k] % 36];
      store.set("fa-id", id);
    }
    return id;
  }
  function api(path, body) {
    var o = body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : {};
    return fetch(path, o).then(function (r) { return r.json().then(function (d) { d.status = r.status; return d; }); });
  }

  // ---------- Fans' pick (vote on the Flavor 10) ----------
  function vote(feed) {
    var sec = document.getElementById("flavor-10");
    if (!sec || !feed.f10 || !feed.f10.songs) return;
    var songs = feed.f10.songs.map(function (s) { return { key: s.t + " — " + s.a, t: s.t, a: s.a }; });
    var MIN = 10, st = null, busy = false;                     // results show once MIN fans have picked
    var box = el("div", "fa-vote"); box.hidden = true;
    var slot = document.getElementById("fx-f10-vote"), sub = sec.querySelector(".f10-sub");   // v3: inside the Flavor 10 tab
    if (slot) slot.appendChild(box); else if (sub && sub.nextSibling) sec.insertBefore(box, sub.nextSibling); else sec.appendChild(box);
    var sheet = el("section", "fa-sheet"); sheet.hidden = true; sheet.setAttribute("aria-label", "Pick your number one");
    document.body.appendChild(sheet);

    function title(k) { for (var i = 0; i < songs.length; i++) if (songs[i].key === k) return songs[i].t; return ""; }
    function leader() { var best = null; songs.forEach(function (s) { var n = st.tally[s.key] || 0; if (n && (!best || n > best.n)) best = { t: s.t, n: n }; }); return best; }
    function panel() {
      var html = '<span class="k">Fans\' pick · today</span>';
      if (st.mine && title(st.mine)) {
        html += "<b>You picked " + esc(title(st.mine)) + "</b>";
        var l = st.total >= MIN ? leader() : null;
        html += "<p>" + (l ? "Out in front: " + esc(l.t) + ", with " + Math.round(l.n / st.total * 100) + "% of picks." : "Picks are still coming in. The fans' No. 1 shows here once enough of you have chosen.") + "</p>";
        html += '<button type="button" data-pick>' + (st.total >= MIN ? "See the picks" : "Change my pick") + "</button>";
      } else {
        html += "<b>Which one's your No. 1?</b><p>Today's 10 is ours. The No. 1 is yours. One pick a day.</p><button type=\"button\" data-pick>Pick yours</button>";
      }
      box.innerHTML = html; box.hidden = false;
    }
    function list() {
      var show = st.total >= MIN && st.mine;
      var html = '<div class="fa-sheet-hd"><h2>Your No. 1</h2><button type="button" data-x aria-label="Close">' + ICON.close + '</button></div><p class="fa-sheet-sub">' +
        (show ? "Today's picks so far. Tap another song to change yours." : "Tap the one you'd put at the top. Tomorrow's a new 10.") + '</p><ul class="fa-pick">';
      songs.forEach(function (s) {
        var n = st.tally[s.key] || 0, pc = st.total ? Math.round(n / st.total * 100) : 0;
        html += '<li><button type="button" data-song="' + esc(s.key) + '" aria-pressed="' + (st.mine === s.key) + '"><span><b>' + esc(s.t) + "</b><i>" + esc(s.a) + "</i></span>" +
          (show ? '<em>' + pc + '%</em><u style="width:' + pc + '%"></u>' : "") + "</button></li>";
      });
      sheet.innerHTML = html + "</ul>";
    }
    function close() { sheet.hidden = true; }
    box.addEventListener("click", function (e) { if (e.target.closest("[data-pick]")) { list(); sheet.hidden = false; sheet.scrollTop = 0; } });
    sheet.addEventListener("click", function (e) {
      if (e.target.closest("[data-x]")) return close();
      var b = e.target.closest("[data-song]"); if (!b || busy) return;
      busy = true;
      api("/api/vote", { song: b.getAttribute("data-song"), id: phoneId() }).then(function (d) {
        busy = false;
        if (!d.ok) return toast(d.error === "busy" ? "Lots of picks from this connection today. Try again tomorrow." : "That didn't go through. Try again.");
        st = d; panel(); list(); toast("Your pick is in.");
      }).catch(function () { busy = false; toast("You're offline. Try again when you're back."); });
    });
    [].forEach.call(document.querySelectorAll(".fa-tabs a, .fa-tabs button"), function (a) { a.addEventListener("click", close); });

    api("/api/vote?id=" + phoneId()).then(function (d) { if (d.ok) { st = d; panel(); } }).catch(function () {});
  }

  // ---------- Alerts and the trivia reminder (switched on from Me, Games and Live) ----------
  // Both use the phone's one alert subscription. Alerts = a new No. 1 or Flavor Cover (and anything the team sends);
  // the trivia reminder = a nudge at about 7 pm on days with a new Flavor Trivia (16 Nov 2026).
  var push = {
    ok: ("serviceWorker" in navigator) && ("PushManager" in window) && ("Notification" in window),
    u8: function (s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); var raw = atob(s + "===".slice((s.length + 3) % 4)), a = new Uint8Array(raw.length); for (var i = 0; i < raw.length; i++) a[i] = raw.charCodeAt(i); return a; },
    get: function () { return navigator.serviceWorker.ready.then(function (r) { return r.pushManager.getSubscription(); }); },
    sub: function () {   // the phone's subscription, asking permission first if needed
      return Notification.requestPermission().then(function (p) {
        if (p !== "granted") throw new Error("denied");
        return push.get();
      }).then(function (s) {
        if (s) return s;
        return Promise.all([navigator.serviceWorker.ready, api("/api/push")]).then(function (r) {
          if (!r[1].ok) throw new Error("key");
          return r[0].pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: push.u8(r[1].key) });
        });
      });
    },
    on: function () {
      return push.sub().then(function (sub) { return api("/api/push", { endpoint: sub.endpoint, id: phoneId() }).then(function (d) { if (!d.ok) throw new Error("save"); store.set("fa-alerts", true); return sub; }); });
    },
    off: function (sub) {
      store.set("fa-alerts", false);
      return api("/api/push", { endpoint: sub.endpoint, off: true }).catch(function () {}).then(function () { if (!store.get("fa-remind", false)) return sub.unsubscribe().catch(function () {}); });
    }
  };
  // Game reminders (16 Nov 2026): one for Flavor Trivia, one for Flavor Connections. Each has its own hour (7 pm unless
  // you pick another) and only goes out if you haven't played that game yet that day. The phone tells the server your
  // streak, so the nudge can say it ("Your 4-day streak ends at midnight"). app/trivia.js and app/connections.js use this.
  var GAME = { trivia: { name: "Flavor Trivia", streak: "fa-tv-streak" }, connections: { name: "Flavor Connections", streak: "fa-cx-streak" }, mini: { name: "Flavor Mini", streak: "fa-mn-streak" } };
  var HOURS = [7, 8, 12, 13, 17, 18, 19, 20, 21, 22];
  function hourLabel(h) { return (h % 12 || 12) + (h < 12 ? " am" : " pm"); }
  if (store.get("fa-remind", false) === true && !store.get("fa-rem-trivia", 0)) { store.set("fa-rem-trivia", 19); store.set("fa-remind", false); }
  var R2 = window.faRemind = {
    ok: push.ok,
    games: GAME,
    label: hourLabel,
    is: function (g) { return +store.get("fa-rem-" + (g || "trivia"), 0) || 0; },
    any: function () { return R2.is("trivia") || R2.is("connections") || R2.is("mini"); },
    streak: function (g) { var s = store.get(GAME[g].streak, { last: "", n: 0 }) || {}; return { n: s.n || 0, last: s.last || "" }; },
    on: function (g, hour) {
      return push.sub().then(function (sub) { return api("/api/push", { endpoint: sub.endpoint, id: phoneId(), game: g, remind: true, hour: hour, streak: R2.streak(g) }); })
        .then(function (d) { if (!d.ok) throw new Error("save"); store.set("fa-rem-" + g, d.hour || hour); return d.hour || hour; });
    },
    off: function (g) {
      store.set("fa-rem-" + g, 0);
      return push.get().then(function (sub) {
        if (!sub) return 0;
        return api("/api/push", { endpoint: sub.endpoint, game: g, remind: false }).catch(function () {}).then(function () { if (!store.get("fa-alerts", false) && !R2.any()) return sub.unsubscribe().catch(function () {}); }).then(function () { return 0; });
      }).catch(function () { return 0; });
    },
    // the game tells us it was played ("done") or started ("started"), so tonight's nudge is skipped or worded right
    played: function (g, state) {
      if (!R2.is(g)) return;
      var s = R2.streak(g);
      push.get().then(function (sub) { if (sub) api("/api/push", { endpoint: sub.endpoint, game: g, played: { day: nbo().slice(0, 10), streak: s.n, state: state || "done" } }).catch(function () {}); }).catch(function () {});
    },
    // the time picker: resolves with the hour that's set (0 = off)
    pick: function (g) {
      return new Promise(function (done) {
        var cur = R2.is(g), want = cur || 19;
        var bg = el("div", "fx-pick-bg fx"), box = el("div", "fx-pick");
        bg.setAttribute("role", "dialog"); bg.setAttribute("aria-label", "Reminder for " + GAME[g].name);
        function draw() {
          box.innerHTML = '<div class="fx-shd"><span class="k">' + esc(GAME[g].name) + '</span><button type="button" data-x aria-label="Close">' + ICON.close + "</button></div>" +
            '<h2 class="fx-cap"><span>Guard</span> <b>your streak</b></h2><p class="fx-note">We\'ll nudge you once a day, only if you haven\'t played yet. Pick a time.</p>' +
            '<div class="fx-hours">' + HOURS.map(function (h) { return '<button type="button" data-h="' + h + '" aria-pressed="' + (h === want) + '">' + hourLabel(h) + "</button>"; }).join("") + "</div>" +
            '<div class="fx-pick-go"><button type="button" class="fx-btn d" data-set>' + (cur ? "Change to " : "Remind me at ") + hourLabel(want) + "</button>" + (cur ? '<button type="button" class="fx-btn l" data-off>Turn off</button>' : "") + "</div>";
        }
        function end(v) { bg.classList.remove("on"); setTimeout(function () { bg.remove(); }, 200); done(v); }
        draw(); bg.appendChild(box); document.body.appendChild(bg);
        requestAnimationFrame(function () { bg.classList.add("on"); });
        bg.addEventListener("click", function (e) {
          var a;
          if (e.target === bg || e.target.closest("[data-x]")) return end(cur);
          if ((a = e.target.closest("[data-h]"))) { want = +a.getAttribute("data-h"); return draw(); }
          if ((a = e.target.closest("[data-off]"))) { a.disabled = true; return R2.off(g).then(function () { toast(GAME[g].name + " reminder is off."); end(0); }); }
          if ((a = e.target.closest("[data-set]"))) {
            a.disabled = true; a.textContent = "Setting it up…";
            R2.on(g, want).then(function (h) { toast("Done. " + GAME[g].name + " at " + hourLabel(h) + ", only if you haven't played."); end(h); })
              .catch(function (err) { toast(err && err.message === "denied" ? "Allow notifications for flavor.africa in your phone's settings, then try again." : "Couldn't set the reminder. Try again."); end(cur); });
          }
        });
      });
    }
  };
  try { document.dispatchEvent(new Event("fa-remind-ready")); } catch (e) {}
  function alertsToggle(sub) {
    if (sub) return push.off(sub).then(function () { toast("Alerts are off."); return null; });
    return push.on().then(function (s) { toast("Alerts are on."); return s; }).catch(function (err) { toast(err && err.message === "denied" ? "Allow notifications for flavor.africa in your phone's settings, then try again." : "Couldn't turn alerts on. Try again."); return null; });
  }

  // ---------- Flavor FM (v3): featured track, our playlist, the Flavor 10, The Mix ----------
  // Previews come from Apple Music and play through the page's chart player, so the now-playing bar follows them.
  function fmScreen(f10, feed) {
    var au = f10.querySelector("audio"), box = el("div", "fa-fm fx fx-screen"), fm = feed.fm, chart = feed.f10 ? feed.f10.songs || [] : [], mix = feed.mix, ft = feed.feat;
    var tracks = [], info = {};
    function key(t, a) { return (t + "|" + a).toLowerCase(); }
    function row(t, a, k, n1) {
      var kk = key(t, a), i = tracks.length; tracks.push({ t: t, a: a, k: kk });
      return '<li><button type="button" class="fx-row" data-tr="' + i + '"><span class="fx-th' + (n1 ? " n1" : "") + '" data-art="' + esc(kk) + '">' + (n1 ? "1" : "") + '</span><span class="fx-tx"><i>' + esc(k) + "</i><b>" + esc(t) + "</b><em>" + esc(a) + '</em></span><span class="fx-ix">' + ICON.play + "</span></button></li>";
    }
    function outs(o, label) {
      var l = [["spotify", "Spotify"], ["apple", "Apple Music"], ["youtube", "YouTube"]].filter(function (x) { return o[x[0]]; });
      return l.length ? '<div class="fa-fm-out"><span>' + label + "</span>" + l.map(function (x) { return '<a href="' + esc(o[x[0]]) + '" target="_blank" rel="noopener">' + x[1] + "</a>"; }).join("") + "</div>" : "";
    }
    function two(n) { return (n < 10 ? "0" : "") + n; }
    var html = ttl("<b>Flavor</b> <span>FM</span>", fm ? "Our picks this week, and a new Flavor 10 every day." : "A new Flavor 10 every day.");
    // Featured track: the paid artist spot (FLAVOR_FM_FEATURED in _site.py). Hidden when no one has booked it.
    if (ft && ft.t && ft.a) {
      var fi = tracks.length; tracks.push({ t: ft.t, a: ft.a, k: key(ft.t, ft.a) });
      html += '<div class="fx-card fx-feat" style="height:300px" data-art-bg="' + esc(key(ft.t, ft.a)) + '"><div class="in"><span class="k">Featured track' + (ft.dates ? " · " + esc(ft.dates) : "") + '</span><h2 class="fx-cap">' + capHtml(ft.t) + "</h2><p>" + esc(ft.a) + (ft.why ? ". " + esc(ft.why) : "") + '</p><div class="fx-btns"><button type="button" class="fx-btn" data-tr="' + fi + '">' + ICON.play + "Play</button></div></div></div>" + outs(ft, "Listen on");
    }
    var tabs = [];
    if (fm && fm.songs && fm.songs.length) tabs.push(["pl", fm.title || "Our playlist"]);
    if (chart.length) tabs.push(["ch", "Flavor 10 · " + (feed.f10.name || "Kenya")]);
    if (mix && /^[\w-]{11}$/.test(mix.youtube || "")) tabs.push(["mx", "The Mix"]);
    html += '<div class="fx-tx-tabs" role="tablist">' + tabs.map(function (t, i) { return '<button type="button" role="tab" data-panel="' + t[0] + '" aria-selected="' + (i === 0) + '">' + esc(t[1]) + "</button>"; }).join("") + "</div>";
    if (fm && fm.songs && fm.songs.length) {
      html += '<div class="fx-panel" data-p="pl"><p class="fx-plh">' + esc(fm.blurb || "") + " " + fm.songs.length + " songs" + (fm.dates ? ", " + esc(fm.dates.replace(/\s*-\s*/, "–")) : "") + '.</p><ol class="fx-rows">';
      fm.songs.forEach(function (x, i) { html += row(x[0], x[1], two(i + 1)); });
      html += "</ol>" + outs(fm, "Play it in full on") + "</div>";
    }
    if (chart.length) {
      var lab = feed.f10.label ? feed.f10.label.replace(/\s+\d{4}$/, "").toLowerCase().replace(/(^|\s)\S/g, function (c) { return c.toUpperCase(); }) : "";
      html += '<div class="fx-panel" data-p="ch" hidden><p class="fx-plh">' + esc((feed.f10.theme ? feed.f10.theme + ". " : "") + (feed.f10.line || "What Kenya\'s playing.")) + ' A new 10 every morning' + (lab ? ", this one from " + esc(lab) : "") + '.</p><div id="fx-f10-vote"></div><ol class="fx-rows">';
      chart.forEach(function (x, i) { html += row(x.t, x.a, "No. " + (i + 1), i === 0); });
      html += "</ol></div>";
    }
    if (mix && /^[\w-]{11}$/.test(mix.youtube || "")) {
      html += '<div class="fx-panel fx-mix" data-p="mx" hidden><button type="button" class="fa-mix-v" data-mix aria-label="Play the mix"><img alt="" loading="lazy" onerror="this.remove()" src="https://i.ytimg.com/vi/' + mix.youtube + '/hqdefault.jpg"><span class="pl">' + ICON.play + "</span></button>" +
        '<h3>' + esc(mix.title || "The Flavor Mix") + "</h3>" + (mix.dj ? "<p>" + esc(mix.dj) + "</p>" : "") +
        '<a class="fx-btn l" href="https://www.youtube.com/watch?v=' + mix.youtube + '" target="_blank" rel="noopener">Open in YouTube</a></div>';
    }
    box.innerHTML = html;
    var oldFm = f10.querySelector(".fa-fm"); if (oldFm) oldFm.remove();
    f10.insertBefore(box, f10.firstChild);

    box.querySelector(".fx-tx-tabs").addEventListener("click", function (e) {
      var b = e.target.closest("[data-panel]"); if (!b) return;
      [].forEach.call(box.querySelectorAll("[data-panel]"), function (x) { x.setAttribute("aria-selected", x === b); });
      [].forEach.call(box.querySelectorAll(".fx-panel"), function (p) { p.hidden = p.getAttribute("data-p") !== b.getAttribute("data-panel"); });
    });
    var mv = box.querySelector("[data-mix]");
    if (mv) mv.addEventListener("click", function () {
      if (au) au.pause();
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + mix.youtube + "?autoplay=1&playsinline=1&rel=0&modestbranding=1";
      f.title = mix.title || "The Flavor Mix"; f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen"; f.allowFullscreen = true;
      var w = document.createElement("div"); w.className = "fa-mix-v on"; w.appendChild(f);
      mv.parentNode.replaceChild(w, mv);
    });

    // find each song's preview and cover on Apple Music, three at a time
    var queue = tracks.filter(function (t, i) { return tracks.findIndex(function (u) { return u.k === t.k; }) === i; }), busy = 0, n = 0;
    function look(t) {
      busy++;
      var cb = "faFm" + (n++) + Date.now(), s = document.createElement("script"), done = false;
      var want = t.t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      var end = function (r) {
        if (done) return; done = true; busy--; try { delete window[cb]; } catch (e) {} s.remove();
        if (r) {
          info[t.k] = { src: r.previewUrl, art: (r.artworkUrl100 || "").replace("100x100", "600x600"), url: r.trackViewUrl };
          var q = t.k.replace(/"/g, '\\"');
          [].forEach.call(box.querySelectorAll('[data-art="' + q + '"]'), function (a) { if (info[t.k].art && !a.classList.contains("n1")) a.style.backgroundImage = "url('" + info[t.k].art + "')"; });
          [].forEach.call(box.querySelectorAll('[data-art-bg="' + q + '"]'), function (a) { if (info[t.k].art) a.style.backgroundImage = "url('" + info[t.k].art + "')"; });
        } else info[t.k] = {};
        next();
      };
      window[cb] = function (d) {
        var hit = d && d.results && d.results.filter(function (x) { var m = (x.trackName || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); return x.previewUrl && (m.indexOf(want) === 0 || want.indexOf(m) === 0); })[0];
        end(hit);
      };
      s.onerror = function () { end(null); };
      s.src = "https://itunes.apple.com/search?country=ke&entity=song&limit=8&term=" + encodeURIComponent(t.t + " " + t.a.split(/ ft\. | feat\. |, | & /)[0]) + "&callback=" + cb;
      document.body.appendChild(s); setTimeout(function () { end(null); }, 8000);
    }
    function next() { while (busy < 3 && queue.length) look(queue.shift()); }
    next();

    var current = null;
    function mark() {
      [].forEach.call(box.querySelectorAll(".fx-row[data-tr]"), function (b) {
        var on = current !== null && +b.getAttribute("data-tr") === current && au && !au.paused;
        b.classList.toggle("on", on); b.querySelector(".fx-ix").innerHTML = on ? ICON.pause : ICON.play;
        b.setAttribute("aria-label", (on ? "Pause " : "Play ") + tracks[+b.getAttribute("data-tr")].t);
      });
    }
    if (au) ["play", "pause", "ended"].forEach(function (ev) { au.addEventListener(ev, mark); });
    var strip = el("div", "fa-full");
    function full(b, t, x) {
      var q = t.t + " " + t.a.split(/ ft\. | feat\. /)[0], e = encodeURIComponent(q);
      strip.innerHTML = "<span>Full song on</span>" + [
        ["Apple Music", (x && x.url) || "https://music.apple.com/ke/search?term=" + e],
        ["Spotify", "https://open.spotify.com/search/" + e],
        ["YouTube", "https://www.youtube.com/results?search_query=" + e]
      ].map(function (o) { return '<a href="' + esc(o[1]) + '" target="_blank" rel="noopener">' + o[0] + "</a>"; }).join("");
      var li = b.closest("li"); if (li) li.appendChild(strip);
    }
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-tr]"); if (!b) return;
      var i = +b.getAttribute("data-tr"), t = tracks[i], x = info[t.k];
      if (current === i && au && !au.paused) return au.pause();
      if (current === i && au && au.src) { au.play().catch(function () {}); return; }
      full(b, t, x);
      if (!x) return toast("Getting the preview ready. Tap again in a second.");
      if (!x.src || !au) return toast("No preview for this one. Use the links to play it in full.");
      current = i;
      var ti = document.getElementById("f10-title"), ar = document.getElementById("f10-artist"), im = f10.querySelector(".f10-art img");
      if (ti) ti.textContent = t.t; if (ar) ar.textContent = t.a;
      if (im && x.art) { im.src = x.art; im.hidden = false; }
      au.src = x.src; au.currentTime = 0;
      au.play().catch(function () { toast("Couldn't play that one. Try again."); });
    });
    // "Play this" on Today lands here and starts the No. 1
    window.faPlayNo1 = function () {
      var tb = box.querySelector('[data-panel="ch"]'); if (tb) tb.click();
      var b = box.querySelector('.fx-panel[data-p="ch"] [data-tr]'); if (!b) return;
      var tries = 0; (function go() { var t = tracks[+b.getAttribute("data-tr")]; if (info[t.k] || tries++ > 20) b.click(); else setTimeout(go, 250); })();
    };
  }

  // ---------- The app's screens (v3) ----------
  var ABOUT = {
    "The Wrap": "The day's entertainment news", "The Drop": "New music, every Friday", "Money Moves": "The business side of entertainment",
    "Flavor Roots": "Global hits traced back to Africa", "Flavor Decoded": "Culture you've seen, explained", "The Verdict": "Our call on the big releases",
    "Flavor Reads": "African authors, every Sunday", "Flavor Fashion": "Style, told like a magazine", "Flavor Sports": "Where sport meets culture",
    "Flavor Rewind": "Iconic moments, on their anniversary", "Flavor Spotlight": "The ones to watch", "Flavor Feature": "The people behind the work",
    "Flavor Charts": "The week on the charts", "Flavor Figures": "The week in numbers", "In Their Words": "Quotes worth keeping",
    "The Flavor Cover": "Our monthly cover story", "The Watchlist": "What to watch this weekend", "Nairobi This Weekend": "Where to be, Friday to Sunday",
    "Flavor Playlist": "A playlist for the week", "Flavor Artist Live": "Our own live shows", "Fan Seat": "Your questions for the artist"
  };
  var TOPICS = [["", "All"], ["music", "Music"], ["screen", "Film & TV"], ["fashion", "Fashion"], ["money", "Business"], ["sport", "Sports"], ["culture", "Culture"], ["live", "Live"]];

  function shell(feed, live, bySlug) {
    var tabs = document.querySelector(".fa-tabs"), main = document.querySelector("main");
    if (!tabs || !main) return;
    var home = page === "index", sheets = {};
    function follows() { return store.get("fa-follow", []) || []; }
    function chart() { return home && location.hash === "#flavor-10"; }
    function setTab(t) { [].forEach.call(tabs.querySelectorAll("[data-t]"), function (x) { if (x.getAttribute("data-t") === t) x.setAttribute("aria-current", "page"); else x.removeAttribute("aria-current"); }); }
    function closeSheets() { for (var k in sheets) sheets[k].hidden = true; }
    function curTab() { return home ? (chart() ? "f10" : "home") : page === "live" ? "live" : (page === "games" || page === "trivia" || page === "connections" || page === "mini") ? "games" : ""; }
    function show() {
      closeSheets();
      if (home) { R.classList.toggle("fa-s-chart", chart()); R.classList.toggle("fa-s-today", !chart()); window.scrollTo(0, 0); }
      setTab(curTab());
    }
    function go(hash) { history.replaceState(null, "", location.pathname + location.search + hash); show(); }
    function sheet(name, label) {
      var s = el("section", "fa-sheet fa-scr fx"); s.hidden = true; s.setAttribute("aria-label", label);
      document.body.appendChild(s); sheets[name] = s; return s;
    }
    function open(name, draw) { closeSheets(); draw(); sheets[name].hidden = false; sheets[name].scrollTop = 0; setTab(name === "disc" ? "disc" : curTab()); }
    var shd = function (left) { return '<div class="fx-shd">' + left + '<button type="button" data-x aria-label="Close">' + ICON.close + "</button></div>"; };

    // Flavor FM lives on the home page under #flavor-10
    var f10 = home && document.getElementById("flavor-10");
    if (f10) fmScreen(f10, feed);

    // ---- Today ----
    function today() {
      var box = document.getElementById("fa-today");
      if (!box) { box = el("div", "fx fx-screen"); box.id = "fa-today"; main.insertBefore(box, main.firstChild); }
      var pk = feed.picks || {}, fol = follows(), html = "";
      html += ttl("<span>Today's</span> <b>picks</b>", "Three things. About a minute.") + '<div class="fx-rows">';
      if (feed.f10) html += '<a class="fx-row" href="#flavor-10" data-f10><span class="fx-th n1">1</span><span class="fx-tx"><i>Play this</i><b>' + esc(feed.f10.t) + "</b><em>" + esc(feed.f10.a) + ' · No. 1 on today\'s Flavor 10' + (feed.f10.name ? " · " + esc(feed.f10.name) : "") + '</em></span><span class="fx-ix y">' + ICON.play + "</span></a>";
      var kn = pk.know && bySlug[pk.know];
      if (kn) html += '<a class="fx-row" href="/' + kn.s + '.html">' + th(kn.i, kn.o) + '<span class="fx-tx"><i>Know this name</i><b>' + esc(pk.know_name || kn.h) + "</b><em>" + esc(pk.know_line || kn.d) + '</em></span><span class="fx-ix">' + ICON.go + "</span></a>";
      var sh = pk.show;
      if (sh) html += '<a class="fx-row" href="' + esc(sh.href || "/live.html") + '">' + th(sh.i, sh.o) + '<span class="fx-tx"><i>Show up</i><b>' + esc(sh.t) + "</b><em>" + esc(sh.d) + '</em></span><span class="fx-ix">' + ICON.go + "</span></a>";
      html += "</div>";
      // Flavor Daily: swipe through today's stories
      var d0 = live[0];
      if (d0) html += '<button type="button" class="fx-card" data-daily style="height:300px;background-image:url(\'/' + esc(d0.i) + '\');background-position:' + esc(d0.o) + '"><span class="in"><span class="k">Flavor Daily · ' + Math.min(live.length, 5) + ' stories</span><h2 class="fx-cap"><span>Today in</span> <b>two minutes</b></h2><p>Swipe through the day, one story at a time.</p><span class="fx-btns"><span class="fx-btn">' + ICON.play + "Start</span></span></span></button>";
      var mine = fol.length ? live.filter(function (s) { return fol.indexOf(s.t) > -1; }).slice(0, 3) : [];
      if (mine.length) html += sec("<b>For</b> <span>you</span>", '<button type="button" data-tab-disc>Edit</button>') + '<div class="fx-rows">' + mine.map(function (s) { return storyRow(s); }).join("") + "</div>";
      var rest = live.filter(function (s) { return mine.indexOf(s) < 0; }).slice(0, 4);
      html += sec("<b>The</b> <span>latest</span>", '<button type="button" data-view="*">See all</button>') + '<div class="fx-rows">' + rest.map(function (s) { return storyRow(s); }).join("") + "</div>";
      box.innerHTML = html;
    }
    if (home) {
      today();
      main.addEventListener("click", function (e) {
        var v;
        if (e.target.closest("[data-f10]")) { e.preventDefault(); go("#flavor-10"); if (window.faPlayNo1) window.faPlayNo1(); }
        else if (e.target.closest("[data-daily]")) { if (window.faDaily) window.faDaily(); }
        else if (e.target.closest("[data-tab-disc]")) { disc.view = null; open("disc", drawDisc); }
        else if ((v = e.target.closest("[data-view]"))) { disc.view = v.getAttribute("data-view"); open("disc", drawDisc); }
      });
      window.addEventListener("hashchange", show);
      window.addEventListener("load", function () { if (chart()) setTimeout(function () { window.scrollTo(0, 0); }, 0); });
    }

    // ---- Discover: search, topics, sections ----
    var discEl = sheet("disc", "Discover"), counts = {}, newest = {}, disc = { view: null, q: "", topic: "" };
    live.forEach(function (s) { counts[s.t] = (counts[s.t] || 0) + 1; if (!newest[s.t]) newest[s.t] = s; });
    var tags = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b); });
    function results() {
      var q = disc.q.trim().toLowerCase(), t = disc.topic, fol = follows(), html = "";
      if (q || t) {
        var hits = live.filter(function (s) { return (!t || (s.c || []).indexOf(t) > -1) && (!q || (s.h + " " + s.d + " " + s.t).toLowerCase().indexOf(q) > -1); });
        html = sec("<b>" + hits.length + "</b> <span>" + (hits.length === 1 ? "story" : "stories") + "</span>") + (hits.length ? '<div class="fx-rows">' + hits.map(function (s) { return storyRow(s); }).join("") + "</div>" : '<p class="fx-note">Nothing yet. Try another word.</p>');
      } else {
        html = sec("<b>Sections</b> <span>to follow</span>", '<button type="button" data-view="*">All stories</button>') + '<div class="fx-rows">';
        tags.forEach(function (tg) {
          var on = fol.indexOf(tg) > -1, n = newest[tg];
          html += '<div class="fx-row" data-sec="' + esc(tg) + '">' + th(n.i, n.o) + '<span class="fx-tx"><i>' + counts[tg] + (counts[tg] === 1 ? " story" : " stories") + "</i><b>" + esc(tg) + "</b><em>" + esc(ABOUT[tg] || "") + '</em></span><button type="button" class="fx-pill" data-fol="' + esc(tg) + '" aria-pressed="' + on + '">' + (on ? "Following" : "Follow") + "</button></div>";
        });
        html += "</div>";
      }
      var r = discEl.querySelector(".fx-res"); if (r) r.innerHTML = html;
    }
    function drawDisc() {
      if (disc.view) {
        var all = disc.view === "*";
        discEl.innerHTML = '<div class="fx-shd"><button type="button" class="bk" data-back>' + ICON.back + 'Discover</button><button type="button" data-x aria-label="Close">' + ICON.close + "</button></div>" +
          ttl(all ? "<b>Every</b> <span>story</span>" : capHtml(disc.view), all ? "Newest first." : esc(ABOUT[disc.view] || "")) +
          '<div class="fx-rows">' + live.filter(function (s) { return all || s.t === disc.view; }).map(function (s) { return storyRow(s); }).join("") + "</div>";
        return;
      }
      discEl.innerHTML = shd('<span class="wm">flavor.africa</span>') + ttl("<b>Discover</b>") +
        '<label class="fx-search">' + ICON.search + '<input type="search" placeholder="Search stories, artists, places" value="' + esc(disc.q) + '" enterkeyhint="search" aria-label="Search"></label>' +
        '<div class="fx-tx-tabs" role="tablist">' + TOPICS.map(function (t) { return '<button type="button" role="tab" data-topic="' + t[0] + '" aria-selected="' + (disc.topic === t[0]) + '">' + esc(t[1]) + "</button>"; }).join("") + "</div>" +
        '<div class="fx-res"></div>';
      discEl.querySelector("input").addEventListener("input", function (e) { disc.q = e.target.value; results(); });
      results();
    }
    discEl.addEventListener("click", function (e) {
      var a;
      if (e.target.closest("[data-x]")) return show();
      if ((a = e.target.closest("[data-fol]"))) {
        var t = a.getAttribute("data-fol"), fol = follows(), i = fol.indexOf(t);
        if (i > -1) fol.splice(i, 1); else fol.push(t);
        store.set("fa-follow", fol); results(); if (home) today(); return;
      }
      if ((a = e.target.closest("[data-topic]"))) { disc.topic = a.getAttribute("data-topic"); [].forEach.call(discEl.querySelectorAll("[data-topic]"), function (x) { x.setAttribute("aria-selected", x === a); }); results(); return; }
      if ((a = e.target.closest("[data-view]"))) { disc.view = a.getAttribute("data-view"); drawDisc(); discEl.scrollTop = 0; return; }
      if ((a = e.target.closest("[data-sec]"))) { disc.view = a.getAttribute("data-sec"); drawDisc(); discEl.scrollTop = 0; return; }
      if (e.target.closest("[data-back]")) { disc.view = null; drawDisc(); }
    });
    window.faView = function (tag) { disc.view = tag; open("disc", drawDisc); };

    // ---- Me ----
    var me = sheet("me", "You");
    function trivia() {   // the numbers kept on this phone by Flavor Trivia
      var s = store.get("fa-tv-streak", { last: "", n: 0 }), t = nbo().slice(0, 10), y = new Date(Date.now() + 108e5 - 864e5).toISOString().slice(0, 10), played = 0, pts = 0;
      try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (/^fa-tv-\d{4}-\d\d-\d\d$/.test(k)) { played++; var r = JSON.parse(localStorage.getItem(k)); pts += (r && r.pts) || 0; } } } catch (e) {}
      return { streak: s.last === t || s.last === y ? s.n : 0, played: played, pts: pts };
    }
    function sw(id, label, sub, on) { return '<div class="fx-row"><span class="fx-tx"><b>' + label + "</b><em>" + sub + '</em></span><button type="button" class="fx-switch" role="switch" aria-checked="' + on + '" aria-label="' + label + '" data-sw="' + id + '"></button></div>'; }
    function drawMe(sub) {
      var list = store.get("fa-saved", []).map(function (s) { return bySlug[s]; }).filter(Boolean), tv = trivia(), fol = follows();
      var html = shd('<span class="wm">flavor.africa</span>') + ttl("<span>Your</span> <b>flavor</b>", fol.length ? "Following " + fol.length + (fol.length === 1 ? " section" : " sections") + "." : "Follow sections in Discover and they come first on Today.") +
        '<div class="fx-stats"><div><b>' + tv.streak + '</b><span>Day streak</span></div><div><b>' + tv.pts + '</b><span>Trivia points</span></div><div><b>' + list.length + "</b><span>Saved</span></div></div>";
      html += sec("<b>Saved</b>");
      html += list.length ? '<div class="fx-rows">' + list.map(function (s) { return '<div class="fx-row"><a href="/' + s.s + '.html" style="display:contents;color:inherit;text-decoration:none">' + th(s.i, s.o) + '<span class="fx-tx"><i>' + esc(s.t) + "</i><b>" + esc(s.h) + '</b></span></a><button type="button" class="fx-ix" data-rm="' + s.s + '" aria-label="Remove ' + esc(s.h) + '">' + ICON.close + "</button></div>"; }).join("") + "</div>"
        : '<p class="fx-note">Nothing saved yet. Tap the bookmark on any story and it lands here, ready to read without signal.</p>';
      html += sec("<b>Settings</b>") + '<div class="fx-rows">';
      if (push.ok && Notification.permission !== "denied") {
        html += sw("alerts", "Alerts", "A new No. 1 or a new Flavor Cover. Nothing else.", !!sub);
        ["trivia", "connections", "mini"].forEach(function (g) {
          var h = window.faRemind.is(g);
          html += '<div class="fx-row"><span class="fx-tx" data-pick="' + g + '"><b>' + (g === "trivia" ? "Trivia" : g === "mini" ? "Mini crossword" : "Connections") + " reminder</b><em>" + (h ? "Every day at " + window.faRemind.label(h) + ", only if you haven't played. Tap to change." : "A nudge to guard your streak, at a time you pick.") +
            '</em></span><button type="button" class="fx-switch" role="switch" aria-checked="' + !!h + '" aria-label="' + g + ' reminder" data-sw="rem-' + g + '"></button></div>';
        });
      }
      html += sw("dark", "Dark mode", "Black, easier at night", R.getAttribute("data-theme") === "dark" || (!R.getAttribute("data-theme") && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches));
      html += "</div>";
      me.innerHTML = html; me._sub = sub || null;
    }
    function openMe() { open("me", function () { drawMe(me._sub); if (push.ok) push.get().then(function (s) { if (!me.hidden) drawMe(s); }).catch(function () {}); }); }
    me.addEventListener("click", function (e) {
      var a;
      if (e.target.closest("[data-x]")) return show();
      if ((a = e.target.closest("[data-rm]"))) { store.set("fa-saved", store.get("fa-saved", []).filter(function (x) { return x !== a.getAttribute("data-rm"); })); drawMe(me._sub); toast("Removed from Saved"); return; }
      if ((a = e.target.closest("[data-pick]"))) { var pg = a.getAttribute("data-pick"); if (window.faRemind.is(pg)) return window.faRemind.pick(pg).then(function () { drawMe(me._sub); }); return; }
      if ((a = e.target.closest("[data-sw]"))) {
        var w = a.getAttribute("data-sw");
        if (w === "dark") { var th2 = document.getElementById("theme"); if (th2) th2.click(); return drawMe(me._sub); }
        a.disabled = true;
        if (w.indexOf("rem-") === 0) { var g = w.slice(4); a.disabled = false; return (window.faRemind.is(g) ? window.faRemind.off(g).then(function () { toast("Reminder is off."); }) : window.faRemind.pick(g)).then(function () { drawMe(me._sub); }); }
        alertsToggle(me._sub).then(function (s) { drawMe(s); });
      }
    });
    document.addEventListener("click", function (e) { if (e.target.closest("[data-me]")) openMe(); });

    // ---- Live (live.html): our next event, Fan Seat, Nairobi This Weekend ----
    if (page === "live") liveScreen(feed, live, main, sheet, open, show, shd);

    tabs.addEventListener("click", function (e) {
      var t = e.target.closest("[data-t]"); if (!t) return;
      var k = t.getAttribute("data-t");
      if (k === "disc") { e.preventDefault(); disc.view = null; return open("disc", drawDisc); }
      if (home && k === "home") { e.preventDefault(); go(""); }
      else if (home && k === "f10") { e.preventDefault(); go("#flavor-10"); }
      else closeSheets();
    });
    show();
  }

  function liveScreen(feed, live, main, sheet, open, show, shd) {
    R.classList.add("fa-s-live");
    var band = main.querySelector(".band"), sh = (feed.picks && feed.picks.show) || {};
    var name = band && band.querySelector("h2") ? band.querySelector("h2").textContent.trim() : sh.t || "";
    var line = band && band.querySelector("p") ? band.querySelector("p").textContent.trim() : sh.d || "";
    var facts = band ? [].map.call(band.querySelectorAll(".facts>div"), function (d) { var s = d.querySelectorAll("span"); return [s[0] ? s[0].textContent : "", s[1] ? s[1].textContent : ""]; }).filter(function (f) { return f[0] && f[0] !== "First to know"; }) : [];
    var box = el("div", "fx fx-screen"); box.id = "fa-live";
    var html = ttl("<b>Live</b>", "Our own shows and the best of Nairobi each weekend.");
    if (name) {
      html += '<div class="fx-card" style="height:430px;background-image:url(\'/' + esc(sh.i || "img/ay-live.jpg") + '\');background-position:' + esc(sh.o || "center 40%") + '"><div class="in"><span class="k">Next from Flavor Africa</span><h2 class="fx-cap">' + capHtml(name) + "</h2><p>" + esc(line) + '</p><div class="fx-btns">' +
        (push.ok ? '<button type="button" class="fx-btn" data-alerts>Get alerts</button>' : "") + (navigator.share ? '<button type="button" class="fx-btn o" data-share>Share</button>' : "") + "</div></div></div>";
      if (facts.length) html += '<div class="fx-stats">' + facts.map(function (f) { return '<div><span>' + esc(f[0]) + '</span><b style="font-size:14px;font-weight:600;margin-top:3px">' + esc(f[1]) + "</b></div>"; }).join("") + "</div>";
    }
    var fs = feed.fanseat;
    if (fs && fs.artist) html += sec("<b>Fan</b> <span>seat</span>") + '<button type="button" class="fx-row" data-fs><span class="fx-th">' + esc(fs.artist.charAt(0)) + '</span><span class="fx-tx"><i>Ask a question</i><b>Ask ' + esc(fs.artist) + "</b><em>" + esc(fs.line || "") + '</em></span><span class="fx-ix">' + ICON.go + "</span></button>";
    var ntw = live.filter(function (s) { return s.t === "Nairobi This Weekend"; });
    if (ntw.length) html += sec("<b>Nairobi</b> <span>this weekend</span>", '<button type="button" data-past="Nairobi This Weekend">All weekends</button>') + '<div class="fx-rows">' + storyRow(ntw[0], shortDate(ntw[0].p)) + "</div>";
    var fal = live.filter(function (s) { return s.t === "Flavor Artist Live"; });
    if (fal.length) html += sec("<b>Flavor</b> <span>artist live</span>") + '<div class="fx-rows">' + fal.slice(0, 3).map(function (s) { return storyRow(s); }).join("") + "</div>";
    box.innerHTML = html;
    main.insertBefore(box, main.firstChild);
    // Fan Seat opens as its own screen with the question form (the form comes from app/fanseat.js)
    var fsEl = sheet("fs", "Fan Seat");
    box.addEventListener("click", function (e) {
      var a;
      if (e.target.closest("[data-fs]")) {
        open("fs", function () {
          fsEl.innerHTML = shd('<span class="wm">flavor.africa</span>');
          var f = document.getElementById("fan-seat"); if (f) fsEl.appendChild(f); else fsEl.insertAdjacentHTML("beforeend", '<p class="fx-note">Fan Seat is loading. Try again in a moment.</p>');
        });
      } else if ((a = e.target.closest("[data-past]"))) { if (window.faView) window.faView(a.getAttribute("data-past")); }
      else if (e.target.closest("[data-share]")) { navigator.share({ title: name, url: "https://flavorafricagroup.org/live" }).catch(function () {}); }
      else if ((a = e.target.closest("[data-alerts]"))) {
        a.disabled = true;
        push.get().then(function (s) { return s && store.get("fa-alerts", false) ? (toast("Alerts are already on. We'll tell you when tickets are out."), s) : alertsToggle(null); }).catch(function () {}).then(function () { a.disabled = false; });
      }
    });
    fsEl.addEventListener("click", function (e) { if (e.target.closest("[data-x]")) show(); });
    if (location.hash === "#fan-seat") setTimeout(function () { var b = box.querySelector("[data-fs]"); if (b) b.click(); }, 400);
  }

  // ---------- Now playing bar (keeps the song with you between pages) ----------
  (function () {
    var KEY = "fa-now", st = null, own = null, secAu = document.querySelector("#flavor-10 audio"), bar = null;
    try { st = JSON.parse(sessionStorage.getItem(KEY) || "null"); } catch (e) {}
    function keep() { try { st ? sessionStorage.setItem(KEY, JSON.stringify(st)) : sessionStorage.removeItem(KEY); } catch (e) {} }
    function cur() { return secAu && secAu.currentSrc && st && secAu.currentSrc === st.src ? secAu : own; }
    function draw() {
      if (!st) { if (bar) { bar.remove(); bar = null; } R.classList.remove("fa-playing"); return; }
      if (!bar) {
        bar = el("div", "fa-now"); bar.setAttribute("role", "region"); bar.setAttribute("aria-label", "Now playing");
        bar.innerHTML = '<img alt="" hidden><span class="ph">f<i>.</i></span><a href="/index.html#flavor-10"><b></b><span></span></a><button type="button" data-pp></button><button type="button" data-x aria-label="Close player">' + ICON.close + '</button><i class="pr"></i>';
        document.body.appendChild(bar);
        bar.addEventListener("click", function (e) {
          var a = cur();
          if (e.target.closest("[data-x]")) { if (a) a.pause(); st = null; keep(); draw(); return; }
          if (e.target.closest("[data-pp]") && a) { a.paused ? a.play().catch(function () {}) : a.pause(); }
        });
      }
      var a = cur(), playing = a && !a.paused, im = bar.querySelector("img");
      bar.querySelector("b").textContent = st.t; bar.querySelector("a span").textContent = st.a;
      if (st.art) { im.src = st.art; im.hidden = false; bar.querySelector(".ph").hidden = true; } else { im.hidden = true; bar.querySelector(".ph").hidden = false; }
      var pp = bar.querySelector("[data-pp]");
      pp.setAttribute("aria-label", playing ? "Pause" : "Play");
      pp.innerHTML = playing ? '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>' : '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg>';
      R.classList.add("fa-playing");
    }
    function wire(a) {
      a.addEventListener("play", function () { if (a === secAu && own) own.pause(); draw(); });
      a.addEventListener("pause", draw);
      a.addEventListener("ended", function () { if (cur() === a) { st = null; keep(); draw(); } });
      a.addEventListener("timeupdate", function () {
        if (cur() !== a || !st) return;
        st.time = a.currentTime; st.on = !a.paused;
        if (bar && a.duration) bar.querySelector(".pr").style.width = (a.currentTime / a.duration * 100) + "%";
      });
    }
    if (secAu) {
      wire(secAu);
      secAu.addEventListener("play", function () {
        var im = document.querySelector("#flavor-10 .f10-art img");
        st = { src: secAu.currentSrc, t: (document.getElementById("f10-title") || {}).textContent || "", a: (document.getElementById("f10-artist") || {}).textContent || "", art: im && !im.hidden ? im.src : "", time: secAu.currentTime, on: true };
        keep(); draw();
      });
    }
    window.addEventListener("pagehide", keep);
    if (st && st.src) {   // carried over from the last page: pick the song up where it was
      own = new Audio(); own.preload = "auto"; wire(own); own.src = st.src;
      var want = st.on;
      own.addEventListener("loadedmetadata", function () { try { own.currentTime = Math.min(st ? st.time || 0 : 0, Math.max(0, own.duration - 1)); } catch (e) {} if (want) own.play().catch(function () { draw(); }); }, { once: true });
      draw();
    }
  })();

  // ---------- Pull down to refresh ----------
  (function () {
    var y0 = null, dy = 0, dot = null, busy = false, MAX = 150;
    function open() { return [].some.call(document.querySelectorAll(".fa-daily,.fa-sheet,#drawer"), function (x) { return !x.hidden && x.offsetParent !== null; }); }
    function refresh() {
      busy = true; dot.classList.add("go");
      freshen(); // a pull always brings the newest version of everything, app code included (15 Nov 2026)
    }
    document.addEventListener("touchstart", function (e) { y0 = (window.scrollY <= 0 && !busy && e.touches.length === 1 && !open()) ? e.touches[0].clientY : null; dy = 0; }, { passive: true });
    document.addEventListener("touchmove", function (e) {
      if (y0 === null || busy) return;
      dy = e.touches[0].clientY - y0;
      if (dy <= 0 || window.scrollY > 0) { if (dot) dot.style.transform = "translate(-50%,-60px)"; return; }
      if (!dot) { dot = el("div", "fa-ptr", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v5h-5"/></svg>'); document.body.appendChild(dot); }
      var d = Math.min(dy, MAX);
      dot.style.transform = "translate(-50%," + (d * 0.6 - 50) + "px) rotate(" + d * 2 + "deg)";
      dot.classList.toggle("ready", dy >= MAX);
    }, { passive: true });
    document.addEventListener("touchend", function () {
      if (y0 === null || busy || !dot) return;
      if (dy >= MAX && window.scrollY <= 0) refresh(); else dot.style.transform = "translate(-50%,-60px)";
      y0 = null;
    }, { passive: true });
  })();

  // ---------- Flavor Daily ----------
  function daily(feed, live) {
    var cards = [];
    if (feed.f10) cards.push({ f10: feed.f10 });
    if (feed.fanseat && feed.fanseat.artist) cards.push({ fs: feed.fanseat });
    live.slice(0, 5).forEach(function (s) { cards.push(s); });
    if (!cards.length) return;
    var today = nbo().slice(0, 10);

    // the "f." button in the header that opens it again
    // v3: Flavor Daily opens from its card on Today (window.faDaily); no header button any more
    var btn = el("button", "fa-today" + (store.get("fa-daily", "") === today ? " seen" : ""), "<span>f<i>.</i></span>");

    var box = el("div", "fa-daily");
    box.hidden = true;
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Flavor Daily");
    document.body.appendChild(box);
    var i = 0, timer = null, start = 0, left = 0, DUR = 6500, ty = null;

    function draw() {
      var c = cards[i], html = "";
      var bars = cards.map(function (_, k) { return '<i class="' + (k < i ? "done" : "") + '"><b></b></i>'; }).join("");
      var dt = new Date(Date.now() + 108e5);
      var head = '<div class="fa-d-top"><div class="fa-d-bars">' + bars + '</div><div class="fa-d-head"><span><b>flavor.africa</b>Daily · ' + dt.getUTCDate() + " " + MONTHS[dt.getUTCMonth()] +
        '</span><button type="button" data-x aria-label="Close">' + ICON.close + "</button></div></div>";
      if (c.fs) {
        html = '<div class="fa-d-card f10"></div><div class="fa-d-tap"><button type="button" data-prev aria-label="Previous"></button><button type="button" data-next aria-label="Next"></button></div>' + head +
          '<div class="fa-d-body"><span class="tag">Fan Seat</span><h2>Ask ' + esc(c.fs.artist) + "</h2><p>" + esc(c.fs.line || "") + (c.fs.line ? ". " : "") + esc(c.fs.blurb || "Send us your question.") + '</p><a class="fa-d-go" href="/live.html#fan-seat">Ask your question</a></div>';
      } else if (c.f10) {
        html = '<div class="fa-d-card f10"></div><div class="fa-d-tap"><button type="button" data-prev aria-label="Previous"></button><button type="button" data-next aria-label="Next"></button></div>' + head +
          '<div class="fa-d-f10"><span class="k">The Flavor 10 · ' + esc(c.f10.name || "Kenya") + '</span><div class="art"><div class="n">1</div></div></div><div class="fa-d-body"><span class="tag">Number one today</span><h2>' + esc(c.f10.t) + "</h2><p>" + esc(c.f10.a) +
          '. ' + esc(c.f10.line || "What Kenya is playing most right now.") + '</p><a class="fa-d-go" href="/index.html#flavor-10">See today\'s 10</a></div>';
      } else {
        html = '<div class="fa-d-card pic"><div class="bg" style="background-image:url(\'/' + esc(c.i) + '\')"></div><img alt="" src="/' + esc(c.i) + '" style="object-position:' + esc(c.o) + '"></div><div class="fa-d-tap"><button type="button" data-prev aria-label="Previous"></button><button type="button" data-next aria-label="Next"></button></div>' + head +
          '<div class="fa-d-body"><span class="tag">' + esc(c.t) + "</span><h2>" + esc(c.h) + "</h2><p>" + esc(c.d) + '</p><a class="fa-d-go" href="/' + c.s + '.html">Read the story</a></div>';
      }
      box.innerHTML = html;
      var ph = box.querySelector(".fa-d-card.pic img");
      if (ph) { if (ph.complete && ph.naturalWidth) fit(ph); else ph.onload = function () { fit(ph); }; }
      if (c.f10) cover(c.f10, function (src) {
        var art = box.querySelector(".fa-d-f10 .art"); if (!art || !src) return;
        var im = new Image(); im.alt = "Cover art: " + c.f10.t + " by " + c.f10.a;
        im.onload = function () { art.insertBefore(im, art.firstChild); art.classList.add("has"); };
        im.src = src;
      });
      play(DUR);
    }
    // Photos (changed 11 Nov 2026): a photo only fills the whole screen when it has enough pixels to stay sharp.
    // Smaller or wide photos sit at the top at a size they can hold, over a soft blurred copy of themselves,
    // instead of being blown up until they look pixelated.
    function fit(im) {
      var card = im.parentNode, w = card.clientWidth, h = card.clientHeight, iw = im.naturalWidth, ih = im.naturalHeight;
      if (!w || !h || !iw || !ih) return;
      var sharp = 1 / Math.max(w / iw, h / ih); // photo pixels per screen point when it fills the screen
      if (sharp >= 1.8) { card.classList.add("full"); return; }
      // Framed: the photo and the words sit together as one block, centred on the page like a magazine layout.
      var top = box.querySelector(".fa-d-top"), body = box.querySelector(".fa-d-body");
      var t = top ? top.getBoundingClientRect().bottom - card.getBoundingClientRect().top + 16 : 80;
      var bh = body ? body.offsetHeight : 0, gap = 26;
      var dw = Math.min(w, Math.round(iw / 1.6)), dh = Math.round(dw * ih / iw);
      var room = h - t - bh - gap;
      if (dh > room) dh = Math.max(160, room);
      var spare = Math.max(0, room - dh), y = t + Math.round(spare / 2);
      im.style.width = dw + "px"; im.style.height = dh + "px"; im.style.top = y + "px";
      if (body) body.style.marginBottom = Math.round(spare / 2) + "px";
      card.classList.add("framed");
    }
    // the single's cover art, from Apple Music (the same place the chart's player gets it)
    var art1;
    function cover(f, cb) {
      if (art1 !== undefined) return cb(art1);
      var k = "faArt" + Date.now(), s = document.createElement("script"), done = false;
      var end = function (src) { if (done) return; done = true; art1 = src || ""; try { delete window[k]; } catch (e) {} s.remove(); cb(art1); };
      var want = f.t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      window[k] = function (d) {
        var r = d && d.results && d.results.filter(function (x) { var n = (x.trackName || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); return x.artworkUrl100 && (n.indexOf(want) === 0 || want.indexOf(n) === 0); })[0];
        end(r ? r.artworkUrl100.replace("100x100", "600x600") : "");
      };
      s.onerror = function () { end(""); };
      s.src = (f.id ? "https://itunes.apple.com/lookup?country=ke&id=" + encodeURIComponent(f.id) : "https://itunes.apple.com/search?country=ke&entity=song&limit=5&term=" + encodeURIComponent(f.t + " " + f.a.split(/ ft\. |, | & /)[0])) + "&callback=" + k;
      document.body.appendChild(s); setTimeout(function () { end(""); }, 6000);
    }
    function bar() { return box.querySelectorAll(".fa-d-bars i b")[i]; }
    function play(ms) {
      clearTimeout(timer); left = ms; start = Date.now();
      var b = bar(); if (!b) return;
      var done = (DUR - ms) / DUR * 100;
      b.style.transition = "none"; b.style.width = done + "%";
      void b.offsetWidth;
      b.style.transition = "width " + ms + "ms linear"; b.style.width = "100%";
      timer = setTimeout(next, ms);
    }
    function pause() {
      clearTimeout(timer); left = Math.max(300, left - (Date.now() - start));
      var b = bar(); if (b) { b.style.width = getComputedStyle(b).width; b.style.transition = "none"; }
    }
    function next() { if (i < cards.length - 1) { i++; draw(); } else close(); }
    function prev() { if (i > 0) i--; draw(); }
    // iPhone fades the top of the screen using the page underneath (white), which left a lilac haze; paint it purple while Daily is open
    function tint(on) { var r = document.documentElement; r.classList.toggle("fa-d-open", on); }
    function open() { i = 0; box.hidden = false; tint(true); document.body.style.overflow = "hidden"; store.set("fa-daily", today); btn.classList.add("seen"); draw(); }
    function close() { clearTimeout(timer); box.hidden = true; tint(false); document.body.style.overflow = ""; }

    var held = false;
    box.addEventListener("pointerdown", function (e) { if (e.target.closest("a,[data-x]")) return; held = false; pause(); box._hold = setTimeout(function () { held = true; }, 250); });
    box.addEventListener("pointerup", function (e) {
      clearTimeout(box._hold);
      if (e.target.closest("a,[data-x]")) return;
      if (held) { play(left); return; }
      // a tap anywhere counts (11 Nov 2026): left third goes back, the rest goes forward,
      // even on top of the chart art or the headline, which used to swallow the tap
      var r = box.getBoundingClientRect();
      if (e.clientX - r.left < r.width * 0.32) prev(); else next();
    });
    box.addEventListener("click", function (e) { if (e.target.closest("[data-x]")) close(); });
    box.addEventListener("touchstart", function (e) { ty = e.touches[0].clientY; }, { passive: true });
    box.addEventListener("touchend", function (e) { if (ty != null && e.changedTouches[0].clientY - ty > 90) close(); ty = null; });
    document.addEventListener("keydown", function (e) { if (box.hidden) return; if (e.key === "Escape") close(); if (e.key === "ArrowRight") next(); if (e.key === "ArrowLeft") prev(); });
    btn.addEventListener("click", open);
    window.faDaily = open;

    // first open of the day, on the home tab: show it on its own (after the splash)
    if (page === "index" && store.get("fa-daily", "") !== today) setTimeout(open, R.querySelector(".fa-splash") ? 1300 : 600);
  }
})();
