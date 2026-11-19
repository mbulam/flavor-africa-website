// The Vice Run (added 19 Nov 2026): a 48-hour GTA bonus quiz. Shows on games.html (card in .fa-gta-slot) and runs on
// gta.html. Three missions of ten questions (changed 19 Nov 2026, late), a timer on each; right answers pay cash (faster
// pays more), wrong or too slow adds a wanted star. Five stars from a wrong answer and you're busted; five stars from
// running out of time and you're wasted. The wanted level clears between missions, cash carries over. Questions in each
// mission come in a new order every run. Unlimited runs until "end" in app/gta.json; the best run is kept on the phone.
(function () {
  var head = document.head;
  head.insertAdjacentHTML("beforeend", '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300..800&display=swap"><link rel="stylesheet" href="/app/gta.css">');
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function money(n) { return "$" + Math.round(n).toLocaleString("en-US"); }
  var X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var PHONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/></svg>';
  function stars(n, max) {
    var h = '<span class="gx-stars" role="img" aria-label="Wanted level ' + n + ' of ' + max + '">';
    for (var i = 1; i <= max; i++) h += '<span class="' + (i <= n ? "on" : "off") + '" style="display:inline-flex"><svg viewBox="0 0 24 24" fill="' + (i <= n ? "currentColor" : "none") + '" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/></svg></span>';
    return h + "</span>";
  }
  // criminal ranks by cash, for the result screen and the Games card
  var RANKS = [[0, "Small-timer"], [8000, "Street hustler"], [18000, "Shot caller"], [30000, "Boss"], [45000, "Kingpin of Leonida"]];
  function rank(cash) { var r = RANKS[0][1]; RANKS.forEach(function (x) { if (cash >= x[0]) r = x[1]; }); return r; }
  // loading-screen tips, GTA style (game tips only, so no tip ever gives an answer away)
  var TIPS = ["Faster answers pay more cash.", "Your wanted level clears after every mission. Your cash doesn't.", "Five stars and the cops get you. Run out of time on that fifth one and you're wasted.", "Every run shuffles the questions, so no two runs are the same.", "Your best run is the one that counts. Replay as often as you like."];
  function tip() { return TIPS[Math.floor(Math.random() * TIPS.length)]; }

  var G = null, best = load("fa-vicerun", null);
  function live() { var t = Date.now(); return G && t >= Date.parse(G.start) && t < Date.parse(G.end); }
  function ended() { return G && Date.now() >= Date.parse(G.end); }
  function credit() { return '<span class="gx-cred">Image: Rockstar Games</span>'; }
  function missions() { return G.missions || [{ name: "The Vice Run", qs: G.qs }]; }
  function total() { return missions().reduce(function (n, m) { return n + m.qs.length; }, 0); }

  function card() {
    var slot = document.querySelector(".fa-gta-slot");
    if (!slot) return;
    if (!live()) { slot.innerHTML = ""; return; }
    var line = best ? "Your best run: " + money(best.cash) + ", " + rank(best.cash) + ". Think you can beat it?" : "Three missions, " + total() + " GTA questions. Every wrong answer raises your wanted level. Five stars and you're busted.";
    slot.innerHTML = '<a class="gx-card" href="/gta.html"><span class="k">Bonus game · 48 hours only</span><h2 class="gx-sun">The Vice Run</h2><p>' + esc(line) + '</p>' + stars(0, G.bust) + '<span class="gx-btn">' + (best ? "Run it again" : "Start the run") + '</span><span class="gx-end">Ends ' + esc(G.endText) + '</span></a>';
  }

  var root, run, timer = 0, wait = 0;
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var pre = {};
  function preload(src) { if (!src || pre[src]) return; var im = new Image(); im.decoding = "async"; im.src = src; pre[src] = im; }
  function clear() { clearInterval(timer); clearTimeout(wait); }

  function intro() {
    clear();
    if (ended()) {
      root.innerHTML = '<div class="gx-top"><a class="gx-x" href="/games.html" aria-label="Back to Games">' + X + '</a></div><div class="gx-res"><h1 class="gx-sun">Run over</h1><p>The Vice Run has ended. Thanks for playing.' + (best ? " Your best run was " + money(best.cash) + "." : "") + '</p><div class="gx-acts"><a class="gx-btn" href="/games.html">Back to Games</a></div></div>';
      return;
    }
    var ms = missions();
    root.innerHTML = '<div class="gx-pic gx-big"><img src="/img/gta6-lead.jpg" alt="Jason and Lucia in GTA VI artwork" style="object-position:center 30%"><a class="gx-x gx-on" href="/games.html" aria-label="Back to Games">' + X + '</a>' + credit() + '</div>' +
      '<div class="gx-hero"><span class="gx-k">Bonus game · ends ' + esc(G.endText) + '</span><h1 class="gx-sun">The Vice Run</h1><p>GTA VI is finally out. How well do you actually know it?</p></div>' +
      '<ul class="gx-rules"><li><b>' + ms.length + ' missions,</b> ' + ms[0].qs.length + ' questions each, ' + G.secs + ' seconds a question</li><li><b>Right answers pay cash.</b> Faster pays more.</li><li><b>Wrong or too slow?</b> One more wanted star. Five and you\'re busted. Your wanted level clears after each mission.</li></ul>' +
      (best ? '<p class="gx-note">Your best so far: ' + money(best.cash) + ' · ' + esc(rank(best.cash)) + '</p>' : '') +
      '<div class="gx-acts"><button type="button" class="gx-btn gx-go">Start the run</button></div>';
    root.querySelector(".gx-go").addEventListener("click", start);
    ms[0].qs.forEach(function (q) { preload(q.img); });
  }

  function start() {
    run = { m: 0, i: 0, cash: 0, stars: 0, right: 0, asked: 0, ms: missions().map(function (m) {
      return { name: m.name, qs: shuffle(m.qs).map(function (q) { var o = q.o.map(function (t, k) { return { t: t, ok: k === q.a }; }); return { q: q.q, img: q.img, pos: q.pos, o: shuffle(o) }; }) };
    }) };
    run.ms.forEach(function (m) { m.qs.forEach(function (q) { preload(q.img); }); });
    brief();
  }

  // mission title card, GTA style
  function brief() {
    clear();
    var m = run.ms[run.m];
    root.innerHTML = '<div class="gx-top"><a class="gx-x" href="/games.html" aria-label="Quit the run">' + X + '</a><span class="gx-cash">' + money(run.cash) + '</span></div>' +
      '<div class="gx-brief"><span class="gx-k">Mission ' + (run.m + 1) + ' of ' + run.ms.length + '</span><h1 class="gx-sun">' + esc(m.name) + '</h1><p class="gx-tip"><b>Tip:</b> ' + esc(tip()) + '</p>' +
      '<div class="gx-acts"><button type="button" class="gx-btn gx-go">' + (run.m === 0 ? "Go" : "Next mission") + '</button></div></div>';
    root.querySelector(".gx-go").addEventListener("click", function () { run.i = 0; run.stars = 0; ask(); });
    window.scrollTo(0, 0);
  }

  function lights() {
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var el = document.createElement("div"); el.className = "gx-lights"; el.setAttribute("aria-hidden", "true");
    document.body.appendChild(el); setTimeout(function () { el.remove(); }, 1300);
  }
  function tick(el, from, to) {
    var t0 = Date.now();
    (function step() { var p = Math.min(1, (Date.now() - t0) / 600); el.textContent = money(from + (to - from) * p); if (p < 1) requestAnimationFrame(step); })();
  }

  function ask() {
    clear();
    var m = run.ms[run.m], q = m.qs[run.i], t0 = 0, done = false;
    var next = m.qs[run.i + 1] || (run.ms[run.m + 1] && run.ms[run.m + 1].qs[0]);
    if (next) preload(next.img);
    root.innerHTML = '<div class="gx-top"><a class="gx-x" href="/games.html" aria-label="Quit the run">' + X + '</a>' + stars(run.stars, G.bust) + '<span class="gx-cash">' + money(run.cash) + '</span></div>' +
      '<div class="gx-meta"><span>Mission ' + (run.m + 1) + ' · Question ' + (run.i + 1) + ' of ' + m.qs.length + '</span><span class="gx-sec">' + G.secs + 's</span></div><div class="gx-bar"><i></i></div>' +
      '<div class="gx-pic"><img src="' + esc(q.img) + '" alt="" style="object-position:' + esc(q.pos || "center") + '">' + credit() + '</div>' +
      '<div class="gx-text"><span class="gx-from">' + PHONE + 'New text</span><p class="gx-q">' + esc(q.q) + '</p></div><div class="gx-opts">' + q.o.map(function (o, k) { return '<button type="button" class="gx-opt" data-k="' + k + '" disabled>' + esc(o.t) + '</button>'; }).join("") + '</div><p class="gx-pop" aria-live="polite"></p>';
    var bar = root.querySelector(".gx-bar i"), sec = root.querySelector(".gx-sec"), pop = root.querySelector(".gx-pop"), btns = root.querySelectorAll(".gx-opt"), img = root.querySelector(".gx-pic img");
    // on small phones, scroll the site header away so all four answers fit on screen
    var lastBtn = btns[btns.length - 1];
    if (lastBtn && lastBtn.getBoundingClientRect().bottom > window.innerHeight) window.scrollTo(0, root.getBoundingClientRect().top + window.pageYOffset);
    function finish(k) {
      if (done) return; done = true; clearInterval(timer);
      var left = Math.max(0, G.secs - (Date.now() - t0) / 1000), ok = k >= 0 && q.o[k].ok, cashEl = root.querySelector(".gx-cash");
      run.asked++;
      btns.forEach(function (b, j) { b.disabled = true; if (q.o[j].ok) b.classList.add("ok"); else if (j === k) b.classList.add("no"); });
      if (ok) {
        var won = Math.round((1000 + 1000 * left / G.secs) / 10) * 10, was = run.cash; run.cash += won; run.right++;
        pop.className = "gx-pop ok"; pop.textContent = "+" + money(won) + (left > G.secs * 0.6 ? ". Fast hands pay." : ".");
        cashEl.classList.add("up"); tick(cashEl, was, run.cash);
      } else {
        run.stars++; pop.className = "gx-pop no"; pop.textContent = k < 0 ? "Too slow. One more star." : "Wrong. One more star.";
        root.querySelector(".gx-top .gx-stars").outerHTML = stars(run.stars, G.bust); lights();
      }
      wait = setTimeout(function () {
        if (run.stars >= G.bust) return result(k < 0 ? "wasted" : "busted");
        run.i++;
        if (run.i < m.qs.length) return ask();
        if (run.m + 1 < run.ms.length) return passed();
        result("passed");
      }, 1400);
    }
    btns.forEach(function (b) { b.addEventListener("click", function () { finish(+b.getAttribute("data-k")); }); });
    // the clock only starts once the picture is on screen (fixed 19 Nov 2026: it used to show a black box first)
    var go = function () {
      if (t0) return; t0 = Date.now(); img.classList.add("in");
      btns.forEach(function (b) { b.disabled = false; });
      timer = setInterval(function () {
        var el = (Date.now() - t0) / 1000, left = Math.max(0, G.secs - el);
        bar.style.transform = "scaleX(" + (left / G.secs) + ")"; sec.textContent = Math.ceil(left) + "s";
        if (left <= 0) finish(-1);
      }, 100);
    };
    if (img.complete && img.naturalWidth) go(); else { img.addEventListener("load", go); img.addEventListener("error", go); wait = setTimeout(go, 2500); }
  }

  // between missions
  function passed() {
    clear();
    var m = run.ms[run.m];
    root.innerHTML = '<div class="gx-top"><a class="gx-x" href="/games.html" aria-label="Quit the run">' + X + '</a><span class="gx-cash">' + money(run.cash) + '</span></div>' +
      '<div class="gx-brief"><span class="gx-k">Mission ' + (run.m + 1) + ' · ' + esc(m.name) + '</span><h1 class="gx-sun">Mission passed</h1><p class="gx-respect">Respect +</p>' +
      '<p>' + money(run.cash) + ' so far, ' + run.right + ' right. Your wanted level is cleared.</p>' +
      '<div class="gx-acts"><button type="button" class="gx-btn gx-go">On to mission ' + (run.m + 2) + '</button></div></div>';
    root.querySelector(".gx-go").addEventListener("click", function () { run.m++; brief(); });
    window.scrollTo(0, 0);
  }

  function result(how) {
    clear();
    var nb = !best || run.cash > best.cash;
    if (nb) { best = { cash: run.cash, stars: run.stars, right: run.right, busted: how !== "passed", mission: run.m + 1 }; save("fa-vicerun", best); }
    var gone = how !== "passed";
    var pic = gone ? '<img src="/img/gta6-bandanas.jpg" alt="" style="object-position:center 20%;filter:grayscale(1)">' : '<img src="/img/gta6-car.jpg" alt="" style="object-position:center 60%">';
    var title = how === "busted" ? '<h1 class="gx-busted">Busted</h1>' : how === "wasted" ? '<h1 class="gx-busted">Wasted</h1>' : '<h1 class="gx-sun">Run complete</h1>';
    var line = how === "busted" ? "Five stars in mission " + (run.m + 1) + ", question " + (run.i + 1) + ". The cops got there first." :
      how === "wasted" ? "The clock ran out on your fifth star, in mission " + (run.m + 1) + ", question " + (run.i + 1) + "." :
      "All " + run.ms.length + " missions done. " + run.right + " of " + run.asked + " right.";
    root.innerHTML = '<div class="gx-pic gx-big">' + pic + '<a class="gx-x gx-on" href="/games.html" aria-label="Back to Games">' + X + '</a>' + credit() + '</div><div class="gx-res">' + title +
      '<p class="big">' + money(run.cash) + '</p><p class="gx-rank">Rank: ' + esc(rank(run.cash)) + '</p><p>' + line + '</p>' + (gone ? stars(run.stars, G.bust) : "") +
      '<div class="gx-acts"><button type="button" class="gx-btn gx-share">Share my run</button><button type="button" class="gx-btn o gx-again">Run it again</button></div>' +
      '<p class="gx-note">' + (nb ? "New best. " : "Your best: " + money(best.cash) + ". ") + 'Unlimited runs until ' + esc(G.endText) + '.</p></div>';
    root.querySelector(".gx-again").addEventListener("click", start);
    root.querySelector(".gx-share").addEventListener("click", function () {
      var txt = (how === "passed" ? "I finished all three missions on The Vice Run with " : (how === "wasted" ? "Wasted" : "Busted") + " on The Vice Run with ") + money(run.cash) + " (" + rank(run.cash) + "). Beat it before " + G.endText + ".";
      var url = "https://flavorafricagroup.org/gta.html";
      if (navigator.share) navigator.share({ title: "The Vice Run", text: txt, url: url }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(txt + " " + url).then(function () { var b = root.querySelector(".gx-share"); b.textContent = "Copied"; });
    });
    window.scrollTo(0, 0);
  }

  fetch("/app/gta.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (d) {
    G = d; card();
    root = document.querySelector(".gx-root");
    if (root) intro();
  }).catch(function () {});
})();
