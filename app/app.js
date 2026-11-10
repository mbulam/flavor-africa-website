// flavor.africa app: features that only exist when the site is opened from the home-screen icon (added 10 Nov 2026).
//   Flavor Daily  - swipeable story cards of today's top stories, shown on the first open of the day.
//   Saved         - bookmark any story; the Saved tab lists them and they open offline.
//   For You       - pick the segments you're into and the home tab puts them first.
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

  fetch("/app/feed.json").then(function (r) { return r.json(); }).then(function (feed) {
    var now = nbo().slice(0, 16);
    var live = feed.stories.filter(function (s) { return s.p <= now; });
    var bySlug = {}; live.forEach(function (s) { bySlug[s.s] = s; });
    saved(bySlug);
    if (page === "index") forYou(live);
    daily(feed, live);
  }).catch(function () {});

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

  // ---------- Flavor Daily ----------
  function daily(feed, live) {
    var cards = [];
    if (feed.f10) cards.push({ f10: feed.f10 });
    live.slice(0, 5).forEach(function (s) { cards.push(s); });
    if (!cards.length) return;
    var today = nbo().slice(0, 10);

    // the "f." button in the header that opens it again
    var hdr = document.querySelector("header .bar");
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
          '<div class="fa-d-f10"><span class="k">The Flavor 10 · Kenya</span><div class="n">1</div></div><div class="fa-d-body"><span class="tag">Number one today</span><h2>' + esc(c.f10.t) + "</h2><p>" + esc(c.f10.a) +
          '. What Kenya is playing most right now.</p><a class="fa-d-go" href="/index.html#flavor-10">See the full chart »</a></div>';
      } else {
        html = '<div class="fa-d-card" style="background-image:url(\'/' + esc(c.i) + "');background-position:" + esc(c.o) + '"></div><div class="fa-d-tap"><button type="button" data-prev aria-label="Previous"></button><button type="button" data-next aria-label="Next"></button></div>' + head +
          '<div class="fa-d-body"><span class="tag">' + esc(c.t) + "</span><h2>" + esc(c.h) + "</h2><p>" + esc(c.d) + '</p><a class="fa-d-go" href="/' + c.s + '.html">Read the story »</a></div>';
      }
      box.innerHTML = html;
      play(DUR);
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
