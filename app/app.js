// flavor.africa app: features that only exist when the site is opened from the home-screen icon (added 10 Nov 2026).
//   Flavor Daily  - swipeable story cards of today's top stories, shown on the first open of the day.
//   Screens       - Today, Sections, Flavor 10, Live and Me (see "The app's screens" below).
//   Saved         - bookmark any story; the Me screen lists them and they open offline.
//   Follow        - follow sections on the Sections screen and Today puts them first.
//   Fans' pick    - pick your own No. 1 from the Flavor 10, once a day (saved by /api/vote).
//   (Fan Seat lives in app/fanseat.js, because the website shows it too.)
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
    mark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5h12v17l-6-4.2-6 4.2z"/></svg>'
  };

  var toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = el("div", "fa-toast"); toastEl.setAttribute("role", "status"); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add("on");
    clearTimeout(toast.t); toast.t = setTimeout(function () { toastEl.classList.remove("on"); }, 2200);
  }

  var page = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "") || "index";

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
        var wipe = window.caches ? caches.keys().then(function (ks) {
          return Promise.all(ks.filter(function (k) { return k.indexOf("-images") < 0; }).map(function (k) { return caches.delete(k); }));
        }) : Promise.resolve();
        wipe.catch(function () {}).then(function () { location.reload(); });
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
  }).catch(function () {});

  // ---------- Back and Share (the app has no browser buttons, so it brings its own) ----------
  (function () {
    var barEl = document.querySelector("header .bar");
    if (barEl && page !== "index") {
      var back = el("button", "fa-back", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>');
      back.type = "button"; back.setAttribute("aria-label", "Back");
      back.addEventListener("click", function () { if (history.length > 1 && document.referrer.indexOf(location.origin) === 0) history.back(); else location.href = "/"; });
      barEl.insertBefore(back, barEl.firstChild);
      R.classList.add("fa-inner");
    }
    if (document.querySelector("article") && navigator.share) {
      var sh = el("button", "fa-share", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 12v8h14v-8"/></svg>');
      sh.type = "button"; sh.setAttribute("aria-label", "Share this story");
      sh.addEventListener("click", function () {
        var h = document.querySelector("article h1");
        navigator.share({ title: h ? h.textContent : document.title, url: "https://flavorafricagroup.org" + location.pathname.replace(/\.html$/, "") }).catch(function () {});
      });
      document.body.appendChild(sh);
    }
  })();

  // ---------- Saved ----------
  function saved(bySlug) {
    var list = store.get("fa-saved", []);
    function keep(l) { list = l; store.set("fa-saved", l); }

    // the bookmark button on a story
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
          // ask for the page and its photos once more so the phone keeps a copy
          fetch(location.pathname).catch(function () {});
          [].forEach.call(document.querySelectorAll("article img"), function (im) { if (im.currentSrc || im.src) fetch(im.currentSrc || im.src).catch(function () {}); });
        }
        set();
      });
      document.body.appendChild(b);
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
    var sub = sec.querySelector(".f10-sub");
    if (sub && sub.nextSibling) sec.insertBefore(box, sub.nextSibling); else sec.appendChild(box);
    var sheet = el("section", "fa-sheet"); sheet.hidden = true; sheet.setAttribute("aria-label", "Pick your number one");
    document.body.appendChild(sheet);

    function title(k) { for (var i = 0; i < songs.length; i++) if (songs[i].key === k) return songs[i].t; return ""; }
    function leader() { var best = null; songs.forEach(function (s) { var n = st.tally[s.key] || 0; if (n && (!best || n > best.n)) best = { t: s.t, n: n }; }); return best; }
    function panel() {
      var html = '<span class="k">Fans\' pick · this week</span>';
      if (st.mine && title(st.mine)) {
        html += "<b>You picked " + esc(title(st.mine)) + "</b>";
        var l = st.total >= MIN ? leader() : null;
        html += "<p>" + (l ? "Out in front: " + esc(l.t) + ", with " + Math.round(l.n / st.total * 100) + "% of picks." : "Picks are still coming in. The fans' No. 1 shows here once enough of you have chosen.") + "</p>";
        html += '<button type="button" data-pick>' + (st.total >= MIN ? "See the picks" : "Change my pick") + "</button>";
      } else {
        html += "<b>Which one's your No. 1?</b><p>The chart counts streams and airplay. This one's just you. One pick a day.</p><button type=\"button\" data-pick>Pick yours</button>";
      }
      box.innerHTML = html; box.hidden = false;
    }
    function list() {
      var show = st.total >= MIN && st.mine;
      var html = '<div class="fa-sheet-hd"><h2>Your No. 1</h2><button type="button" data-x aria-label="Close">' + ICON.close + '</button></div><p class="fa-sheet-sub">' +
        (show ? "This week's picks so far. Tap another song to change yours." : "Tap the one you'd put at the top. You can pick again tomorrow.") + '</p><ul class="fa-pick">';
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

  // ---------- Alerts (switched on and off from the Me screen) ----------
  var push = {
    ok: ("serviceWorker" in navigator) && ("PushManager" in window) && ("Notification" in window),
    u8: function (s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); var raw = atob(s + "===".slice((s.length + 3) % 4)), a = new Uint8Array(raw.length); for (var i = 0; i < raw.length; i++) a[i] = raw.charCodeAt(i); return a; },
    get: function () { return navigator.serviceWorker.ready.then(function (r) { return r.pushManager.getSubscription(); }); },
    on: function () {
      return Notification.requestPermission().then(function (p) {
        if (p !== "granted") throw new Error("denied");
        return Promise.all([navigator.serviceWorker.ready, api("/api/push")]);
      }).then(function (r) {
        if (!r[1].ok) throw new Error("key");
        return r[0].pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: push.u8(r[1].key) });
      }).then(function (sub) { return api("/api/push", { endpoint: sub.endpoint, id: phoneId() }).then(function (d) { if (!d.ok) throw new Error("save"); return sub; }); });
    },
    off: function (sub) { api("/api/push", { endpoint: sub.endpoint, off: true }).catch(function () {}); return sub.unsubscribe().catch(function () {}); }
  };

  function fmScreen(f10, feed) {
    var au = f10.querySelector("audio"), box = el("div", "fa-fm"), fm = feed.fm, chart = feed.f10 ? feed.f10.songs || [] : [];
    var PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg>';
    var PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';
    var tracks = [], info = {};
    function key(t, a) { return (t + "|" + a).toLowerCase(); }
    function row(t, a, n, cls) {
      var k = key(t, a), i = tracks.length; tracks.push({ t: t, a: a, k: k });
      return '<li class="' + (cls || "") + '"><button type="button" data-tr="' + i + '"><span class="n">' + n + '</span><span class="fa-art" data-art="' + esc(k) + '"></span><span class="tx"><b>' + esc(t) + "</b><em>" + esc(a) + '</em></span><span class="pp" aria-hidden="true">' + PLAY + "</span></button></li>";
    }
    var html = '<div class="fa-fm-hd"><h2>Flavor FM</h2><p>' + (fm ? "Our picks this week, and what Kenya's playing." : "What Kenya's playing, updated every day.") + "</p></div>";
    var mix = feed.mix;
    if (mix && /^[\w-]{11}$/.test(mix.youtube || "")) {
      html += '<section class="fa-mix"><span class="k">The Mix</span><button type="button" class="fa-mix-v" data-mix aria-label="Play the mix"><img alt="" loading="lazy" onerror="this.remove()" src="https://i.ytimg.com/vi/' + mix.youtube + '/hqdefault.jpg"><span class="pl">' + PLAY + "</span></button>" +
        "<h3>" + esc(mix.title || "The Flavor Mix") + "</h3>" + (mix.dj ? "<p>" + esc(mix.dj) + "</p>" : "") +
        '<a class="yt" href="https://www.youtube.com/watch?v=' + mix.youtube + '" target="_blank" rel="noopener">Open in YouTube</a></section>';
    }
    if (fm && fm.songs && fm.songs.length) {
      html += '<section class="fa-fm-pl"><span class="k">This week' + (fm.dates ? " · " + esc(fm.dates) : "") + "</span><h3>" + esc(fm.title || "The Flavor FM playlist") + "</h3>" + (fm.blurb ? "<p>" + esc(fm.blurb) + "</p>" : "") + "<ol>";
      fm.songs.forEach(function (x, i) { html += row(x[0], x[1], i + 1); });
      html += "</ol>";
      var outs = [["spotify", "Spotify"], ["apple", "Apple Music"], ["youtube", "YouTube"]].filter(function (o) { return fm[o[0]]; });
      if (outs.length) html += '<div class="fa-fm-out"><span>Play it in full on</span>' + outs.map(function (o) { return '<a href="' + esc(fm[o[0]]) + '" target="_blank" rel="noopener">' + o[1] + "</a>"; }).join("") + "</div>";
      html += "</section>";
    }
    if (chart.length) {
      html += '<section class="fa-fm-ch"><div class="fa-fm-sh"><h3>What Kenya\'s playing</h3><span>The Flavor 10' + (feed.f10.label ? " · " + esc(feed.f10.label.replace(/\s+\d{4}$/, "").toLowerCase().replace(/(^|\s)\S/g, function (c) { return c.toUpperCase(); })) : "") + "</span></div><ol>";
      chart.forEach(function (x, i) { html += row(x.t, x.a, i + 1, i ? "" : "one"); });
      html += "</ol></section>";
    }
    box.innerHTML = html;
    f10.insertBefore(box, f10.firstChild);

    // the mix plays right here: tapping swaps the picture for YouTube's player (stops any song preview first)
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
          info[t.k] = { src: r.previewUrl, art: (r.artworkUrl100 || "").replace("100x100", "300x300"), url: r.trackViewUrl };
          [].forEach.call(box.querySelectorAll('[data-art="' + t.k.replace(/"/g, '\\"') + '"]'), function (a) { if (info[t.k].art) a.style.backgroundImage = "url('" + info[t.k].art + "')"; });
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

    // play through the chart's own player, so the now-playing bar picks it up
    var current = null;
    function mark() {
      [].forEach.call(box.querySelectorAll("[data-tr]"), function (b) {
        var on = current !== null && +b.getAttribute("data-tr") === current && au && !au.paused;
        b.classList.toggle("on", on); b.querySelector(".pp").innerHTML = on ? PAUSE : PLAY;
        b.setAttribute("aria-label", (on ? "Pause " : "Play ") + tracks[+b.getAttribute("data-tr")].t);
      });
    }
    if (au) ["play", "pause", "ended"].forEach(function (ev) { au.addEventListener(ev, mark); });
    // under the song you tapped: open the full song on Apple Music, Spotify or YouTube
    var strip = el("div", "fa-full");
    function full(b, t, x) {
      var q = t.t + " " + t.a.split(/ ft\. | feat\. /)[0], e = encodeURIComponent(q);
      strip.innerHTML = "<span>Full song on</span>" + [
        ["Apple Music", (x && x.url) || "https://music.apple.com/ke/search?term=" + e],
        ["Spotify", "https://open.spotify.com/search/" + e],
        ["YouTube", "https://www.youtube.com/results?search_query=" + e]
      ].map(function (o) { return '<a href="' + esc(o[1]) + '" target="_blank" rel="noopener">' + o[0] + "</a>"; }).join("");
      b.parentNode.appendChild(strip);
    }
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-tr]"); if (!b) return;
      var i = +b.getAttribute("data-tr"), t = tracks[i], x = info[t.k];
      if (current === i && au && !au.paused) return au.pause();
      if (current === i && au && au.src) { au.play().catch(function () {}); return; }
      full(b, t, x);
      if (!x) return toast("Getting the preview ready. Tap again in a second.");
      if (!x.src || !au) return;
      current = i;
      var ti = document.getElementById("f10-title"), ar = document.getElementById("f10-artist"), im = f10.querySelector(".f10-art img");
      if (ti) ti.textContent = t.t; if (ar) ar.textContent = t.a;
      if (im && x.art) { im.src = x.art; im.hidden = false; }
      au.src = x.src; au.currentTime = 0;
      au.play().catch(function () { toast("Couldn't play that one. Try again."); });
    });
  }

  // ---------- The app's screens (rebuilt 11 Nov 2026) ----------
  // Today (the feed), Sections (follow what you read), Flavor 10 (the chart on its own), Live (the Live page) and Me
  // (saved stories and settings). On the home page the website's own blocks are hidden in the app and these take over.
  var ABOUT = {
    "The Wrap": "The day's entertainment news", "The Drop": "New music, every Friday", "Money Moves": "The business side of entertainment",
    "Flavor Roots": "Global hits traced back to Africa", "Flavor Decoded": "Culture you've seen, explained", "The Verdict": "Our call on the big releases",
    "Flavor Reads": "African authors, every Sunday", "Flavor Fashion": "Style, told like a magazine", "Flavor Sports": "Where sport meets culture",
    "Flavor Rewind": "Iconic moments, on their anniversary", "Flavor Spotlight": "The ones to watch", "Flavor Feature": "The people behind the work",
    "Flavor Charts": "The week on the charts", "Flavor Figures": "The week in numbers", "In Their Words": "Quotes worth keeping",
    "The Flavor Cover": "Our monthly cover story", "The Watchlist": "What to watch this weekend", "Nairobi This Weekend": "Where to be, Friday to Sunday"
  };
  function rowHtml(s) {
    return '<a class="fa-rw" href="/' + s.s + '.html"><img src="/' + esc(s.i) + '" alt="" loading="lazy" style="object-position:' + esc(s.o) + '"><span><i>' + esc(s.t) + "</i><b>" + esc(s.h) + "</b><em>" + nice(s.p) + "</em></span></a>";
  }
  function shell(feed, live, bySlug) {
    var tabs = document.querySelector(".fa-tabs"), main = document.querySelector("main");
    if (!tabs || !main) return;
    var home = page === "index", sheets = {}, DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    function follows() { return store.get("fa-follow", []) || []; }
    function chart() { return home && location.hash === "#flavor-10"; }
    function setTab(t) { [].forEach.call(tabs.querySelectorAll("[data-t]"), function (x) { if (x.getAttribute("data-t") === t) x.setAttribute("aria-current", "page"); else x.removeAttribute("aria-current"); }); }
    function closeSheets() { for (var k in sheets) sheets[k].hidden = true; }
    function show() {
      closeSheets();
      if (home) { R.classList.toggle("fa-s-chart", chart()); R.classList.toggle("fa-s-today", !chart()); window.scrollTo(0, 0); }
      setTab(home ? (chart() ? "f10" : "home") : page === "live" ? "live" : "");
    }
    function go(hash) { history.replaceState(null, "", location.pathname + location.search + hash); show(); }
    function sheet(name, label) {
      var s = el("section", "fa-sheet fa-scr"); s.hidden = true; s.setAttribute("aria-label", label);
      document.body.appendChild(s); sheets[name] = s; return s;
    }
    function open(name, draw) { var was = !sheets[name].hidden; closeSheets(); if (was) return show(); draw(); sheets[name].hidden = false; sheets[name].scrollTop = 0; setTab(name); }

    // Flavor FM: the music screen. Our own playlist (FLAVOR_FM in _site.py) when there is one, then the Flavor 10.
    // Previews come from Apple Music and play through the page's chart player, so the now-playing bar follows them.
    var f10 = home && document.getElementById("flavor-10");
    if (f10 && !f10.querySelector(".fa-fm")) fmScreen(f10, feed);

    // the date under the wordmark
    var logo = document.querySelector("header .logo");
    if (logo && !logo.querySelector(".fa-date")) {
      var d = new Date(Date.now() + 108e5);
      logo.appendChild(el("span", "fa-date", DAYS[d.getUTCDay()] + " " + d.getUTCDate() + " " + LONG[d.getUTCMonth()]));
    }

    // Today
    function today() {
      var box = document.getElementById("fa-today");
      if (!box) { box = el("div", "wrap"); box.id = "fa-today"; main.insertBefore(box, main.firstChild); }
      // the cover is always the newest story, so Today never looks stale
      var hero = live[0], fol = follows(), html = "";
      if (hero) html += '<a class="fa-cv" href="/' + hero.s + '.html"><span class="cvp"><img src="/' + esc(hero.i) + '" alt="" style="object-position:' + esc(hero.o) + '"><i>' + esc(hero.t) + '</i></span><span class="cvt"><b>' + esc(hero.h) + "</b><em>" + esc(hero.d) + " · " + nice(hero.p).replace(/ \d{4}$/, "") + "</em></span></a>";
      if (feed.f10) html += '<a class="fa-n1" href="#flavor-10" data-f10><span class="sq">1</span><span><i>No. 1 in Kenya today</i><b>' + esc(feed.f10.t) + "</b><em>" + esc(feed.f10.a) + '</em></span><span class="pl"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg></span></a>';
      var rest = live.filter(function (s) { return !hero || s.s !== hero.s; });
      var mine = fol.length ? rest.filter(function (s) { return fol.indexOf(s.t) > -1; }).slice(0, 4) : [];
      if (mine.length) {
        html += '<div class="fa-hd"><h2>For you</h2><button type="button" data-secs>Edit</button></div>' + mine.map(rowHtml).join("");
        rest = rest.filter(function (s) { return mine.indexOf(s) < 0; });
      }
      html += '<div class="fa-hd"><h2>Latest</h2><button type="button" data-secs>All sections</button></div>' + rest.slice(0, 14).map(rowHtml).join("");
      box.innerHTML = html;
    }
    if (home) {
      today();
      main.addEventListener("click", function (e) {
        if (e.target.closest("[data-f10]")) { e.preventDefault(); go("#flavor-10"); }
        else if (e.target.closest("[data-secs]")) open("sections", drawSections);
      });
      window.addEventListener("hashchange", show);
      window.addEventListener("load", function () { if (chart()) setTimeout(function () { window.scrollTo(0, 0); }, 0); });
    }

    // Sections
    var sec = sheet("sections", "Sections"), counts = {}, viewing = null;
    live.forEach(function (s) { counts[s.t] = (counts[s.t] || 0) + 1; });
    var tags = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b); });
    function drawSections() {
      var fol = follows(), html;
      if (viewing) {
        html = '<div class="fa-scr-hd"><button type="button" class="bk" data-all>‹ Sections</button><h2>' + esc(viewing) + "</h2><p>" + esc(ABOUT[viewing] || "") + "</p></div>" +
          '<div class="fa-rows">' + live.filter(function (s) { return s.t === viewing; }).map(rowHtml).join("") + "</div>";
      } else {
        html = '<div class="fa-scr-hd"><span class="k">Sections</span><h2>Follow what you read</h2><p>What you follow comes first on Today.</p></div><ul class="fa-secs">';
        tags.forEach(function (t) {
          var on = fol.indexOf(t) > -1;
          html += '<li><button type="button" class="nm" data-sec="' + esc(t) + '"><b>' + esc(t) + "</b><span>" + esc(ABOUT[t] || (counts[t] + (counts[t] === 1 ? " story" : " stories"))) + '</span></button><button type="button" class="fl" data-fol="' + esc(t) + '" aria-pressed="' + on + '">' + (on ? "Following" : "Follow") + "</button></li>";
        });
        html += "</ul>";
      }
      sec.innerHTML = html;
    }
    sec.addEventListener("click", function (e) {
      var a;
      if ((a = e.target.closest("[data-fol]"))) {
        var t = a.getAttribute("data-fol"), fol = follows(), i = fol.indexOf(t);
        if (i > -1) fol.splice(i, 1); else fol.push(t);
        store.set("fa-follow", fol); drawSections(); if (home) today();
      } else if ((a = e.target.closest("[data-sec]"))) { viewing = a.getAttribute("data-sec"); drawSections(); sec.scrollTop = 0; }
      else if (e.target.closest("[data-all]")) { viewing = null; drawSections(); }
    });

    // Me
    var me = sheet("me", "Me");
    function sw(id, label, sub, on) { return '<div class="fa-set"><span><b>' + label + "</b><em>" + sub + '</em></span><button type="button" role="switch" aria-checked="' + on + '" aria-label="' + label + '" data-sw="' + id + '"><i></i></button></div>'; }
    function drawMe(sub) {
      var list = store.get("fa-saved", []).map(function (s) { return bySlug[s]; }).filter(Boolean);
      var html = '<div class="fa-scr-hd"><span class="k">Me</span><h2>Your flavor</h2></div><div class="fa-hd"><h2>Saved</h2></div>';
      html += list.length ? '<div class="fa-rows">' + list.map(function (s) { return '<div class="fa-svd">' + rowHtml(s) + '<button type="button" data-rm="' + s.s + '" aria-label="Remove ' + esc(s.h) + '">' + ICON.close + "</button></div>"; }).join("") + "</div>"
        : '<p class="fa-none">Nothing saved yet. Tap the bookmark on any story and it lands here, ready to read without signal.</p>';
      html += '<div class="fa-hd"><h2>Settings</h2></div>';
      if (push.ok && Notification.permission !== "denied") html += sw("alerts", "Alerts", "A new No. 1 or a new Flavor Cover. Nothing else.", !!sub);
      html += sw("dark", "Dark mode", "Easier on the eyes at night", R.getAttribute("data-theme") === "dark" || (!R.getAttribute("data-theme") && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches));
      html += '<button type="button" class="fa-lnk" data-menu>Browse the full site menu<span aria-hidden="true">»</span></button>';
      me.innerHTML = html; me._sub = sub || null;
    }
    function openMe() { open("me", function () { drawMe(me._sub); if (push.ok) push.get().then(function (s) { if (!me.hidden) drawMe(s); }).catch(function () {}); }); }
    me.addEventListener("click", function (e) {
      var a;
      if ((a = e.target.closest("[data-rm]"))) { store.set("fa-saved", store.get("fa-saved", []).filter(function (x) { return x !== a.getAttribute("data-rm"); })); drawMe(me._sub); toast("Removed from Saved"); }
      else if (e.target.closest("[data-menu]")) { var o = document.getElementById("open"); if (o) o.click(); }
      else if ((a = e.target.closest("[data-sw]"))) {
        if (a.getAttribute("data-sw") === "dark") { var th = document.getElementById("theme"); if (th) th.click(); return drawMe(me._sub); }
        a.disabled = true;
        if (me._sub) push.off(me._sub).then(function () { drawMe(null); toast("Alerts are off."); });
        else push.on().then(function (s) { drawMe(s); toast("Alerts are on."); }).catch(function (err) { drawMe(null); toast(err && err.message === "denied" ? "No problem. You can allow alerts in your phone's settings later." : "Couldn't turn alerts on. Try again."); });
      }
    });

    tabs.addEventListener("click", function (e) {
      var t = e.target.closest("[data-t]"); if (!t) return;
      var k = t.getAttribute("data-t");
      if (k === "sections") { viewing = null; return open("sections", drawSections); }
      if (k === "me") return openMe();
      if (home && k === "home") { e.preventDefault(); go(""); }
      else if (home && k === "f10") { e.preventDefault(); go("#flavor-10"); }
      else closeSheets();
    });
    show();
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
      var here = location.origin + (location.pathname.replace(/\.html$/, "").replace(/\/index$/, "/") || "/");
      var wipe = window.caches ? caches.keys().then(function (ns) { return Promise.all(ns.filter(function (n) { return /-pages$/.test(n); }).map(function (n) { return caches.open(n).then(function (c) { return Promise.all([c.delete(here), c.delete(location.origin + "/app/feed.json")]); }); })); }) : Promise.resolve();
      wipe.catch(function () {}).then(function () { location.reload(); });
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
    var hdr = document.querySelector("header .hdr-r");
    var btn = el("button", "fa-today" + (store.get("fa-daily", "") === today ? " seen" : ""), "<span>f<i>.</i></span>");
    btn.type = "button";
    btn.setAttribute("aria-label", "Open Flavor Daily");
    if (hdr) hdr.insertBefore(btn, hdr.firstChild);

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
          '<div class="fa-d-body"><span class="tag">Fan Seat</span><h2>Ask ' + esc(c.fs.artist) + "</h2><p>" + esc(c.fs.line || "") + (c.fs.line ? ". " : "") + esc(c.fs.blurb || "Send us your question.") + '</p><a class="fa-d-go" href="/live.html#fan-seat">Ask your question »</a></div>';
      } else if (c.f10) {
        html = '<div class="fa-d-card f10"></div><div class="fa-d-tap"><button type="button" data-prev aria-label="Previous"></button><button type="button" data-next aria-label="Next"></button></div>' + head +
          '<div class="fa-d-f10"><span class="k">The Flavor 10 · Kenya</span><div class="art"><div class="n">1</div></div></div><div class="fa-d-body"><span class="tag">Number one today</span><h2>' + esc(c.f10.t) + "</h2><p>" + esc(c.f10.a) +
          '. What Kenya is playing most right now.</p><a class="fa-d-go" href="/index.html#flavor-10">See the full chart »</a></div>';
      } else {
        html = '<div class="fa-d-card pic"><div class="bg" style="background-image:url(\'/' + esc(c.i) + '\')"></div><img alt="" src="/' + esc(c.i) + '" style="object-position:' + esc(c.o) + '"></div><div class="fa-d-tap"><button type="button" data-prev aria-label="Previous"></button><button type="button" data-next aria-label="Next"></button></div>' + head +
          '<div class="fa-d-body"><span class="tag">' + esc(c.t) + "</span><h2>" + esc(c.h) + "</h2><p>" + esc(c.d) + '</p><a class="fa-d-go" href="/' + c.s + '.html">Read the story »</a></div>';
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

    // first open of the day, on the home tab: show it on its own (after the splash)
    if (page === "index" && store.get("fa-daily", "") !== today) setTimeout(open, R.querySelector(".fa-splash") ? 1300 : 600);
  }
})();
