// The Vice Run (added 19 Nov 2026): a 48-hour GTA bonus quiz. Shows on games.html (card in .fa-gta-slot) and runs on
// gta.html. Ten questions, a timer on each; right answers pay cash (faster pays more), wrong or too slow adds a wanted
// star, five stars and you're busted. Unlimited runs until "end" in app/gta.json; the best run is kept on the phone.
(function () {
  var head = document.head;
  head.insertAdjacentHTML("beforeend", '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300..800&display=swap"><link rel="stylesheet" href="/app/gta.css">');
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function money(n) { return "$" + Math.round(n).toLocaleString("en-US"); }
  var STAR = '<svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/></svg>';
  var X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  function stars(n, max) {
    var h = '<span class="gx-stars" role="img" aria-label="Wanted level ' + n + ' of ' + max + '">';
    for (var i = 1; i <= max; i++) h += '<span class="' + (i <= n ? "on" : "off") + '" style="display:inline-flex"><svg viewBox="0 0 24 24" fill="' + (i <= n ? "currentColor" : "none") + '" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/></svg></span>';
    return h + "</span>";
  }
  var G = null, best = load("fa-vicerun", null);
  function live() { var t = Date.now(); return G && t >= Date.parse(G.start) && t < Date.parse(G.end); }
  function ended() { return G && Date.now() >= Date.parse(G.end); }
  function credit() { return '<span class="gx-cred">Image: Rockstar Games</span>'; }

  function card() {
    var slot = document.querySelector(".fa-gta-slot");
    if (!slot) return;
    if (!live()) { slot.innerHTML = ""; return; }
    var line = best ? "Your best run: " + money(best.cash) + ". Think you can beat it?" : "Ten GTA questions. Every wrong answer raises your wanted level. Five stars and you're busted.";
    slot.innerHTML = '<a class="gx-card" href="/gta.html"><span class="k">Bonus game · 48 hours only</span><h2 class="gx-sun">The Vice Run</h2><p>' + line + '</p>' + stars(0, G.bust) + '<span class="gx-btn">' + (best ? "Run it again" : "Start the run") + '</span><span class="gx-end">Ends ' + esc(G.endText) + '</span></a>';
  }

  var root, run;
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function intro() {
    if (ended()) {
      root.innerHTML = '<div class="gx-top"><a class="gx-x" href="/games.html" aria-label="Back to Games">' + X + '</a></div><div class="gx-res"><h1 class="gx-sun">Run over</h1><p>The Vice Run has ended. Thanks for playing.' + (best ? " Your best run was " + money(best.cash) + "." : "") + '</p><div class="gx-acts"><a class="gx-btn" href="/games.html">Back to Games</a></div></div>';
      return;
    }
    root.innerHTML = '<div class="gx-pic gx-big"><img src="/img/gta6-lead.jpg" alt="Jason and Lucia in GTA VI artwork" style="object-position:center 30%"><a class="gx-x gx-on" href="/games.html" aria-label="Back to Games">' + X + '</a>' + credit() + '</div>' +
      '<div class="gx-hero"><span class="gx-k">Bonus game · ends ' + esc(G.endText) + '</span><h1 class="gx-sun">The Vice Run</h1><p>GTA VI is finally out. How well do you actually know it?</p></div>' +
      '<ul class="gx-rules"><li><b>10 questions,</b> ' + G.secs + ' seconds each</li><li><b>Right answers pay cash.</b> Faster pays more.</li><li><b>Wrong or too slow?</b> One more wanted star. Five and you\'re busted.</li></ul>' +
      (best ? '<p class="gx-note">Your best so far: ' + money(best.cash) + '</p>' : '') +
      '<div class="gx-acts"><button type="button" class="gx-btn gx-go">Start the run</button></div>';
    root.querySelector(".gx-go").addEventListener("click", start);
  }
  function start() {
    run = { i: 0, cash: 0, stars: 0, right: 0, qs: G.qs.map(function (q) { var o = q.o.map(function (t, k) { return { t: t, ok: k === q.a }; }); return { q: q.q, img: q.img, pos: q.pos, o: shuffle(o) }; }) };
    ask();
  }
  var timer = 0;
  function ask() {
    var q = run.qs[run.i], t0 = Date.now(), done = false;
    root.innerHTML = '<div class="gx-top"><a class="gx-x" href="/games.html" aria-label="Quit the run">' + X + '</a>' + stars(run.stars, G.bust) + '<span class="gx-cash">' + money(run.cash) + '</span></div>' +
      '<div class="gx-meta"><span>Question ' + (run.i + 1) + ' of ' + run.qs.length + '</span><span class="gx-sec">' + G.secs + 's</span></div><div class="gx-bar"><i></i></div>' +
      '<div class="gx-pic"><img src="' + esc(q.img) + '" alt="" style="object-position:' + esc(q.pos || "center") + '">' + credit() + '</div>' +
      '<p class="gx-q">' + esc(q.q) + '</p><div class="gx-opts">' + q.o.map(function (o, k) { return '<button type="button" class="gx-opt" data-k="' + k + '">' + esc(o.t) + '</button>'; }).join("") + '</div><p class="gx-pop" aria-live="polite"></p>';
    var bar = root.querySelector(".gx-bar i"), sec = root.querySelector(".gx-sec"), pop = root.querySelector(".gx-pop"), btns = root.querySelectorAll(".gx-opt");
    function finish(k) {
      if (done) return; done = true; clearInterval(timer);
      var left = Math.max(0, G.secs - (Date.now() - t0) / 1000), ok = k >= 0 && q.o[k].ok;
      btns.forEach(function (b, j) { b.disabled = true; if (q.o[j].ok) b.classList.add("ok"); else if (j === k) b.classList.add("no"); });
      if (ok) { var won = Math.round((1000 + 1000 * left / G.secs) / 10) * 10; run.cash += won; run.right++; pop.className = "gx-pop ok"; pop.textContent = "+" + money(won) + (left > G.secs * 0.6 ? ". Fast hands pay." : "."); }
      else { run.stars++; pop.className = "gx-pop no"; pop.textContent = k < 0 ? "Too slow. One more star." : "Wrong. One more star."; }
      root.querySelector(".gx-cash").textContent = money(run.cash);
      root.querySelector(".gx-top .gx-stars").outerHTML = stars(run.stars, G.bust);
      setTimeout(function () {
        if (run.stars >= G.bust) return result(true);
        run.i++; if (run.i >= run.qs.length) return result(false); ask();
      }, 1400);
    }
    btns.forEach(function (b) { b.addEventListener("click", function () { finish(+b.getAttribute("data-k")); }); });
    timer = setInterval(function () {
      var el = (Date.now() - t0) / 1000, left = Math.max(0, G.secs - el);
      bar.style.transform = "scaleX(" + (left / G.secs) + ")"; sec.textContent = Math.ceil(left) + "s";
      if (left <= 0) finish(-1);
    }, 100);
  }
  function result(busted) {
    var nb = !best || run.cash > best.cash;
    if (nb) { best = { cash: run.cash, stars: run.stars, right: run.right, busted: busted }; save("fa-vicerun", best); }
    var pic = busted ? '<img src="/img/gta6-bandanas.jpg" alt="" style="object-position:center 20%;filter:grayscale(1)">' : '<img src="/img/gta6-car.jpg" alt="" style="object-position:center 60%">';
    var title = busted ? '<h1 class="gx-busted">Busted</h1>' : '<h1 class="gx-sun">Mission passed</h1>';
    var line = busted ? "Five stars on question " + (run.i + 1) + ". The cops got there first." : run.right + " of " + run.qs.length + " right. Wanted level at the finish:";
    root.innerHTML = '<div class="gx-pic gx-big">' + pic + '<a class="gx-x gx-on" href="/games.html" aria-label="Back to Games">' + X + '</a>' + credit() + '</div><div class="gx-res">' + title +
      '<p class="big">' + money(run.cash) + '</p><p>' + line + '</p>' + stars(run.stars, G.bust) +
      '<div class="gx-acts"><button type="button" class="gx-btn gx-share">Share my run</button><button type="button" class="gx-btn o gx-again">Run it again</button></div>' +
      '<p class="gx-note">' + (nb ? "New best. " : "Your best: " + money(best.cash) + ". ") + 'Unlimited runs until ' + esc(G.endText) + '.</p></div>';
    root.querySelector(".gx-again").addEventListener("click", start);
    root.querySelector(".gx-share").addEventListener("click", function () {
      var txt = (busted ? "Busted on The Vice Run with " : "Mission passed on The Vice Run: ") + money(run.cash) + ", " + run.stars + " wanted star" + (run.stars === 1 ? "" : "s") + ". Beat it before " + G.endText + ".";
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
