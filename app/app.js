// flavor.africa app: features that only exist when the site is opened from the home-screen icon (added 10 Nov 2026).
//   Flavor Daily  - swipeable story cards of today's top stories, shown on the first open of the day.
//   Saved         - bookmark any story; the Saved tab lists them and they open offline.
//   For You       - pick the segments you're into and the home tab puts them first.
//   Fans' pick    - pick your own No. 1 from the Flavor 10, once a day (saved by /api/vote).
//   Fan Seat      - send a question for the next Flavor Artist Live artist (saved by /api/fanseat; on when FAN_SEAT is set in _site.py).
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
    if (page === "index") forYou(live);
    if (page === "index") vote(feed);
    fanSeat(feed);
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

    // the Saved tab
    var tab = document.querySelector(".fa-tabs [data-t=saved]");
    if (!tab) return;
    var sheet = el("section", "fa-sheet");
    sheet.hidden = true;
    sheet.setAttribute("aria-label", "Saved stories");
    document.body.appendChild(sheet);
    function render() {
      var items = list.map(function (s) { return bySlug[s]; }).filter(Boolean);
      var html = '<div class="fa-sheet-hd"><h2>Saved</h2><button type="button" data-x aria-label="Close">' + ICON.close + "</button></div>";
      if (!items.length) {
        html += '<div class="fa-empty">' + ICON.mark + "<p>Nothing saved yet. Tap the bookmark on any story and it lands here, ready to read even without signal.</p></div>";
      } else {
        html += '<p class="fa-sheet-sub">' + items.length + (items.length === 1 ? " story" : " stories") + ", kept on this phone.</p><ul class=\"fa-list\">";
        items.forEach(function (s) {
          html += '<li><a href="/' + s.s + '.html"><img src="/' + esc(s.i) + '" alt="" loading="lazy" style="object-position:' + esc(s.o) + '"><span><span class="tag">' + esc(s.t) +
            "</span><b>" + esc(s.h) + '</b><span class="meta">' + nice(s.p) + '</span></span></a><button type="button" data-rm="' + s.s + '" aria-label="Remove ' + esc(s.h) + '">' + ICON.close + "</button></li>";
        });
        html += "</ul>";
      }
      sheet.innerHTML = html;
    }
    function open() {
      render(); sheet.hidden = false; tab.setAttribute("aria-current", "page");
      [].forEach.call(document.querySelectorAll(".fa-tabs [aria-current]"), function (a) { if (a !== tab) a.setAttribute("data-was", "1"), a.removeAttribute("aria-current"); });
    }
    function close() {
      sheet.hidden = true; tab.removeAttribute("aria-current");
      [].forEach.call(document.querySelectorAll(".fa-tabs [data-was]"), function (a) { a.removeAttribute("data-was"); a.setAttribute("aria-current", "page"); });
    }
    tab.addEventListener("click", function () { sheet.hidden ? open() : close(); });
    sheet.addEventListener("click", function (e) {
      if (e.target.closest("[data-x]")) return close();
      var rm = e.target.closest("[data-rm]");
      if (rm) { keep(list.filter(function (x) { return x !== rm.getAttribute("data-rm"); })); render(); toast("Removed from Saved"); }
    });
    [].forEach.call(document.querySelectorAll(".fa-tabs a, .fa-tabs [data-t=menu]"), function (a) { a.addEventListener("click", function () { if (!sheet.hidden) close(); }); });
  }

  // ---------- For You ----------
  function forYou(live) {
    var main = document.querySelector("main");
    if (!main) return;
    var counts = {};
    live.forEach(function (s) { if (s.t !== "Flavor Artist Live") counts[s.t] = (counts[s.t] || 0) + 1; });
    var tags = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b); });
    var follow = store.get("fa-follow", null);
    var box = el("section", "wrap fa-foryou");
    box.setAttribute("aria-label", "For you");
    var lead = main.firstElementChild;
    if (lead && lead.nextSibling) main.insertBefore(box, lead.nextSibling); else main.appendChild(box);

    function picker(sel) {
      var html = '<div class="fa-fy-hd"><h2>Make it yours</h2></div><p class="fa-fy-sub">Pick what you\'re into and we\'ll put it first, every time you open the app.</p><div class="fa-chips">';
      tags.forEach(function (t) { html += '<button type="button" aria-pressed="' + (sel.indexOf(t) > -1) + '" data-tag="' + esc(t) + '">' + esc(t) + "</button>"; });
      html += '</div><button type="button" class="fa-fy-done">Done</button>';
      box.innerHTML = html;
      box.querySelector(".fa-chips").addEventListener("click", function (e) {
        var c = e.target.closest("[data-tag]"); if (!c) return;
        c.setAttribute("aria-pressed", c.getAttribute("aria-pressed") === "true" ? "false" : "true");
      });
      box.querySelector(".fa-fy-done").addEventListener("click", function () {
        var pick = [].map.call(box.querySelectorAll("[aria-pressed=true]"), function (c) { return c.getAttribute("data-tag"); });
        store.set("fa-follow", pick); follow = pick; rail();
        if (pick.length) toast("Done. Your picks come first now.");
      });
    }
    function rail() {
      if (!follow || !follow.length) return picker(follow || []);
      var mine = live.filter(function (s) { return follow.indexOf(s.t) > -1; }).slice(0, 10);
      var html = '<div class="fa-fy-hd"><h2>For you</h2><button type="button" data-edit>Edit picks</button></div><p class="fa-fy-sub">' + esc(follow.join(" · ")) + "</p>";
      if (!mine.length) html += '<p class="fa-fy-none">Nothing new in your picks yet. Add a few more and this fills up.</p>';
      else {
        html += '<div class="fa-rail">';
        mine.forEach(function (s) {
          html += '<a href="/' + s.s + '.html"><img src="/' + esc(s.i) + '" alt="" loading="lazy" style="object-position:' + esc(s.o) + '"><span class="tag">' + esc(s.t) + "</span><b>" + esc(s.h) + '</b><span class="meta">' + nice(s.p) + "</span></a>";
        });
        html += "</div>";
      }
      box.innerHTML = html;
      box.querySelector("[data-edit]").addEventListener("click", function () { picker(follow); });
    }
    rail();
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

  // ---------- Fan Seat (questions for the next Flavor Artist Live artist) ----------
  function fanSeat(feed) {
    var fs = feed.fanseat, band = document.querySelector("section.band");
    if (!fs || !fs.show || !fs.artist || !band) return;
    var sent = store.get("fa-fanseat", {}), mine = sent[fs.show] || 0;
    var box = el("section", "wrap fa-fanseat"); box.setAttribute("aria-label", "Fan Seat");
    band.parentNode.insertBefore(box, band.nextSibling);
    function form(note) {
      if (mine >= 3) { box.innerHTML = '<span class="tag">Fan Seat</span><h2>Your questions are in</h2><p>That\'s your three for ' + esc(fs.artist) + ". " + esc(fs.done || "We'll put the best ones to them at the show.") + "</p>"; return; }
      box.innerHTML = '<span class="tag">Fan Seat</span><h2>Ask ' + esc(fs.artist) + "</h2><p>" + esc(fs.line || "") + (fs.line ? ". " : "") + esc(fs.blurb || "What have you always wanted to know? The best questions get asked at the show.") + "</p>" +
        (note ? '<p class="ok">' + esc(note) + "</p>" : "") +
        '<form><label for="fa-fs-q">Your question</label><textarea id="fa-fs-q" maxlength="280" rows="3" required></textarea><span class="n" aria-hidden="true">0 / 280</span>' +
        '<label for="fa-fs-n">Your name (optional)</label><input id="fa-fs-n" maxlength="40" autocomplete="given-name"><button type="submit">Send it</button></form>';
      var f = box.querySelector("form"), q = f.querySelector("textarea"), n = f.querySelector(".n"), go = f.querySelector("button");
      q.addEventListener("input", function () { n.textContent = q.value.length + " / 280"; });
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        if (q.value.trim().length < 5) return toast("Add a little more to your question.");
        go.disabled = true;
        api("/api/fanseat", { q: q.value, name: f.querySelector("input").value, id: phoneId() }).then(function (d) {
          go.disabled = false;
          if (d.ok || d.error === "limit") { mine = d.ok ? mine + 1 : 3; sent[fs.show] = mine; store.set("fa-fanseat", sent); return form(d.ok ? "Sent. Got another one?" : ""); }
          toast(d.error === "closed" ? "Fan Seat has closed for this show." : "That didn't go through. Try again.");
        }).catch(function () { go.disabled = false; toast("You're offline. Try again when you're back."); });
      });
    }
    form("");
  }

  // ---------- Flavor Daily ----------
  function daily(feed, live) {
    var cards = [];
    if (feed.f10) cards.push({ f10: feed.f10 });
    live.slice(0, 5).forEach(function (s) { cards.push(s); });
    if (!cards.length) return;
    var today = nbo().slice(0, 10);

    // the "f." button in the header that opens it again
    var hdr = R.classList.contains("fa-inner") ? document.querySelector("header .hdr-r") : document.querySelector("header .bar");
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
      if (c.f10) {
        html = '<div class="fa-d-card f10"></div><div class="fa-d-tap"><button type="button" data-prev aria-label="Previous"></button><button type="button" data-next aria-label="Next"></button></div>' + head +
          '<div class="fa-d-f10"><span class="k">The Flavor 10 · Kenya</span><div class="art"><div class="n">1</div></div></div><div class="fa-d-body"><span class="tag">Number one today</span><h2>' + esc(c.f10.t) + "</h2><p>" + esc(c.f10.a) +
          '. What Kenya is playing most right now.</p><a class="fa-d-go" href="/index.html#flavor-10">See the full chart »</a></div>';
      } else {
        html = '<div class="fa-d-card" style="background-image:url(\'/' + esc(c.i) + "');background-position:" + esc(c.o) + '"></div><div class="fa-d-tap"><button type="button" data-prev aria-label="Previous"></button><button type="button" data-next aria-label="Next"></button></div>' + head +
          '<div class="fa-d-body"><span class="tag">' + esc(c.t) + "</span><h2>" + esc(c.h) + "</h2><p>" + esc(c.d) + '</p><a class="fa-d-go" href="/' + c.s + '.html">Read the story »</a></div>';
      }
      box.innerHTML = html;
      if (c.f10) cover(c.f10, function (src) {
        var art = box.querySelector(".fa-d-f10 .art"); if (!art || !src) return;
        var im = new Image(); im.alt = "Cover art: " + c.f10.t + " by " + c.f10.a;
        im.onload = function () { art.insertBefore(im, art.firstChild); art.classList.add("has"); };
        im.src = src;
      });
      play(DUR);
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
    function open() { i = 0; box.hidden = false; document.body.style.overflow = "hidden"; store.set("fa-daily", today); btn.classList.add("seen"); draw(); }
    function close() { clearTimeout(timer); box.hidden = true; document.body.style.overflow = ""; }

    var held = false;
    box.addEventListener("pointerdown", function (e) { if (e.target.closest("a,[data-x]")) return; held = false; pause(); box._hold = setTimeout(function () { held = true; }, 250); });
    box.addEventListener("pointerup", function (e) {
      clearTimeout(box._hold);
      if (e.target.closest("a,[data-x]")) return;
      if (held) { play(left); return; }
      if (e.target.closest("[data-prev]")) prev(); else if (e.target.closest("[data-next]")) next(); else play(left);
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
