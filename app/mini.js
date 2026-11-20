// Flavor Mini (added 16 Nov 2026): a 5x5 crossword a day, on the same theme as that day's Flavor Trivia
// but never reusing a trivia question. It has its own page, mini.html (website and app); the Games page shows its card.
// Puzzles live in /app/mini.json, one per Nairobi date. A day with no puzzle hides the card.
// Progress, time, results and streak are kept on the phone (localStorage). Only a play count goes to /api/plays (20 Nov 2026).
(function () {
  // Counts plays for the team (20 Nov 2026): the same random phone code as the fans' pick, no name. Sent to /api/plays,
  // one row per phone per game per day. Phones that said "No thanks" to cookies aren't counted.
  function faPlay(game, ev, score) {
    try {
      if (localStorage.getItem("fa-cookies") === "no") return;
      var id = ""; try { id = JSON.parse(localStorage.getItem("fa-id") || '""'); } catch (e) {}
      if (!/^[a-z0-9]{24}$/.test(id)) {
        var a = new Uint8Array(24), abc = "abcdefghijklmnopqrstuvwxyz0123456789"; id = "";
        (window.crypto || window.msCrypto).getRandomValues(a);
        for (var k = 0; k < 24; k++) id += abc[a[k] % 36];
        localStorage.setItem("fa-id", JSON.stringify(id));
      }
      fetch("/api/plays", { method: "POST", keepalive: true, headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: id, game: game, ev: ev, score: score == null ? null : score, app: document.documentElement.classList.contains("app") ? 1 : 0 }) }).catch(function () {});
    } catch (e) {}
  }
  if (!document.querySelector('link[href="/app/mini.css"]')) { var css = document.createElement("link"); css.rel = "stylesheet"; css.href = "/app/mini.css"; document.head.appendChild(css); }
  var PAGE = document.getElementById("fa-mn-page");
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function nbo(off) { return new Date(Date.now() + 108e5 + (off || 0) * 864e5); }
  function dkey(d) { return d.toISOString().slice(0, 10); }
  var today = dkey(nbo()), yday = dkey(nbo(-1));
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var niceDate = nbo().getUTCDate() + " " + MON[nbo().getUTCMonth()], dayName = DAYS[nbo().getUTCDay()];
  var KEY = "fa-mn-" + today;
  var TITLE = '<span class="l">Flavor</span> <b>Mini</b>';
  var pz = null, st = null, box = null, cells = [], words = [], cur = { i: -1, dir: "a" }, tick = null, toastT = null, inp = null;

  function mmss(s) { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
  function streak() { var s = store.get("fa-mn-streak", { last: "", n: 0 }); return s.last === today || s.last === yday ? s.n : 0; }

  // Remind me: the app's reminder (see app.js), only if you haven't played that day
  var R = document.documentElement;
  var BELL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>';
  function remindBtn(cls) {
    if (!(R.classList.contains("app") && window.faRemind && window.faRemind.ok)) return "";
    var h = window.faRemind.is("mini");
    return '<button type="button" class="fx-btn ' + cls + '" data-mn-remind aria-pressed="' + !!h + '">' + BELL + (h ? "Reminder · " + window.faRemind.label(h) : "Remind me") + "</button>";
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-mn-remind]"); if (!a) return;
    e.preventDefault(); a.disabled = true;
    window.faRemind.pick("mini").then(function (h) { a.disabled = false; a.setAttribute("aria-pressed", !!h); a.innerHTML = BELL + (h ? "Reminder · " + window.faRemind.label(h) : "Remind me"); });
  });
  document.addEventListener("fa-remind-ready", function () { if (pz) window.faMnSlot(); var s = document.querySelector(".fa-mn-rem"); if (s) s.innerHTML = remindBtn("l"); });

  // The card on the Games page
  window.faMnSlot = function () {
    var slot = document.querySelector(".fa-mn-slot");
    if (!slot || !pz) return;
    var r = store.get(KEY, null), line, btn;
    if (r && r.done) { line = "Solved in " + mmss(r.t) + ". A new grid lands tomorrow."; btn = "See your grid"; }
    else if (r && r.f && r.f.join("").replace(/[#\s]/g, "")) { line = "You're part way in. The clock is paused."; btn = "Keep going"; }
    else { line = "Five across, five down. Same theme as today's trivia, all new clues."; btn = "Play now"; }
    var mini = "";
    for (var i = 0; i < 25; i++) { var ch = pz.g[Math.floor(i / 5)][i % 5]; mini += "<i" + (ch === "#" ? ' class="b"' : r && r.done ? ' class="y"' : "") + "></i>"; }
    slot.innerHTML = '<div class="fa-cxc fx"><a href="/mini.html" class="fa-cxc-in"><span class="tx"><span class="k">Today\'s crossword · ' + esc(pz.theme) + '</span><span class="t">' + TITLE + '</span><span class="s">' + line + '</span></span><span class="fa-mn-ic" aria-hidden="true">' + mini + '</span></a><div class="fx-btns"><a class="fx-btn d" href="/mini.html">' + btn + "</a>" + remindBtn("l") + "</div></div>";
  };

  fetch("/app/mini.json").then(function (x) { return x.json(); }).then(function (d) {
    pz = d && d.puzzles && d.puzzles[today];
    if (!(pz && pz.g && pz.g.length === 5)) pz = null;
    if (pz) window.faMnSlot();
    if (PAGE) open();
  }).catch(function () { if (PAGE) PAGE.innerHTML = '<p class="fa-mn-note">Couldn\'t load today\'s crossword. Check your connection and try again.</p>'; });

  // work out the numbers and the words from the grid
  function build() {
    var n = 0, g = pz.g;
    cells = []; words = [];
    for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) cells.push({ r: r, c: c, ch: g[r][c], n: 0, a: -1, d: -1 });
    function at(r, c) { return r < 0 || c < 0 || r > 4 || c > 4 ? null : cells[r * 5 + c]; }
    function open_(x) { return x && x.ch !== "#"; }
    cells.forEach(function (x) {
      if (x.ch === "#") return;
      x.sa = !open_(at(x.r, x.c - 1)) && open_(at(x.r, x.c + 1)); x.sd = !open_(at(x.r - 1, x.c)) && open_(at(x.r + 1, x.c));
      if (x.sa || x.sd) x.n = ++n;
    });
    // all the Across words first, then all the Down, so "next clue" runs 1A, 5A, 6A... then 1D, 2D...
    [["a", "sa", 0, 1], ["d", "sd", 1, 0]].forEach(function (k) {
      cells.forEach(function (x) {
        if (!x[k[1]]) return;
        var w = { dir: k[0], n: x.n, cells: [], clue: (k[0] === "a" ? pz.a : pz.d)[x.n] || "" };
        for (var rr = x.r, cc = x.c; open_(at(rr, cc)); rr += k[2], cc += k[3]) { var y = at(rr, cc); w.cells.push(y.r * 5 + y.c); y[k[0]] = words.length; }
        words.push(w);
      });
    });
  }

  function open() {
    box = PAGE;
    if (!pz) { box.innerHTML = '<div class="fa-cx-head"><h1>' + TITLE + '</h1></div><p class="fa-mn-note">No crossword today. A new one lands every day, so check back tomorrow.</p>'; return; }
    build();
    st = store.get(KEY, null);
    if (!st || !st.f || st.f.length !== 25) st = { f: pz.g.join("").split("").map(function (ch) { return ch === "#" ? "#" : ""; }), t: 0, done: false };
    box.addEventListener("click", click);
    draw();
  }
  function save() { store.set(KEY, st); }

  function draw() {
    var html = '<div class="fa-cx-head"><h1>' + TITLE + '</h1><p>' + esc(pz.theme) + " " + esc(dayName) + " · " + niceDate + '</p><div class="fa-mn-rem">' + (st.done ? "" : remindBtn("l")) + "</div></div>";
    if (st.done) {
      var n = streak();
      html += '<div class="fa-mn-end"><h2>Solved.</h2><p>' + mmss(st.t) + (n ? " · " + n + "-day streak" : "") + '</p></div><button type="button" class="fa-mn-go" data-a="share">Share my time</button>';
    } else html += '<div class="fa-mn-time" aria-live="off"><span>Time</span> <b>' + mmss(st.t) + "</b></div>";
    html += '<div class="fa-mn-grid" role="grid" aria-label="Crossword, five by five">' + cells.map(function (x, i) {
      if (x.ch === "#") return '<div class="fa-mn-c b" aria-hidden="true"></div>';
      return '<button type="button" class="fa-mn-c" data-i="' + i + '" aria-label="' + (x.n ? x.n + ", " : "") + "row " + (x.r + 1) + ", column " + (x.c + 1) + '">' + (x.n ? "<em>" + x.n + "</em>" : "") + "<span>" + esc(st.done ? x.ch : st.f[i]) + "</span></button>";
    }).join("") + "</div>";
    if (!st.done) html += '<div class="fa-mn-bar"><button type="button" data-a="prev" aria-label="Previous clue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><p class="fa-mn-cl"></p><button type="button" data-a="next" aria-label="Next clue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button></div><div class="fa-mn-toast" role="status" aria-live="polite"></div>';
    html += '<div class="fa-mn-lists">' + [["a", "Across"], ["d", "Down"]].map(function (k) {
      return "<div><h2>" + k[1] + "</h2><ol>" + words.map(function (w, wi) {
        if (w.dir !== k[0]) return "";
        return '<li><button type="button" data-w="' + wi + '"><b>' + w.n + "</b><span>" + esc(w.clue) + (st.done ? ' <i>' + w.cells.map(function (i) { return cells[i].ch; }).join("") + "</i>" : "") + "</span></button></li>";
      }).join("") + "</ol></div>";
    }).join("") + "</div>";
    if (st.done) html += '<a class="fa-mn-more" href="/games.html">Back to Games</a>';
    else html += '<input class="fa-mn-in" type="text" inputmode="text" autocapitalize="characters" autocomplete="off" autocorrect="off" spellcheck="false" aria-label="Type a letter" maxlength="1">';
    box.innerHTML = html;
    if (st.done) { stop(); return; }
    inp = box.querySelector(".fa-mn-in");
    inp.addEventListener("input", typed);
    inp.addEventListener("keydown", key);
    if (cur.i < 0) go(words[0].cells[0], "a", false);
    else paint();
    run();
  }

  // the clock only runs while the page is on screen
  function run() {
    stop();
    var last = Date.now();
    tick = setInterval(function () {
      if (document.hidden || st.done) { last = Date.now(); return; }
      var now = Date.now(); st.t += (now - last) / 1000; last = now;
      var b = box.querySelector(".fa-mn-time b"); if (b) b.textContent = mmss(st.t);
      save();
    }, 500);
  }
  function stop() { if (tick) clearInterval(tick); tick = null; }

  function go(i, dir, focus) {
    var x = cells[i]; if (!x || x.ch === "#") return;
    if (dir && x[dir] < 0) dir = dir === "a" ? "d" : "a";
    cur = { i: i, dir: dir || cur.dir };
    if (x[cur.dir] < 0) cur.dir = cur.dir === "a" ? "d" : "a";
    paint();
    if (focus !== false && inp) { try { inp.focus({ preventScroll: true }); } catch (e) { inp.focus(); } }
  }
  function word() { return words[cells[cur.i][cur.dir]]; }
  function paint() {
    var w = word();
    [].forEach.call(box.querySelectorAll(".fa-mn-c[data-i]"), function (b) {
      var i = +b.getAttribute("data-i");
      b.classList.toggle("w", w.cells.indexOf(i) > -1);
      b.classList.toggle("on", i === cur.i);
      b.classList.remove("x");
    });
    var cl = box.querySelector(".fa-mn-cl");
    if (cl) cl.innerHTML = "<b>" + w.n + (w.dir === "a" ? "A" : "D") + "</b> " + esc(w.clue);
    [].forEach.call(box.querySelectorAll(".fa-mn-lists [data-w]"), function (b) { b.classList.toggle("on", +b.getAttribute("data-w") === words.indexOf(w)); });
  }
  function setLetter(i, ch) {
    st.f[i] = ch;
    var b = box.querySelector('.fa-mn-c[data-i="' + i + '"] span'); if (b) b.textContent = ch;
  }
  // next empty square in the word, else the next square, else the next word
  function advance() {
    var w = word(), k = w.cells.indexOf(cur.i);
    for (var j = k + 1; j < w.cells.length; j++) if (!st.f[w.cells[j]]) return go(w.cells[j], w.dir);
    if (k < w.cells.length - 1) return go(w.cells[k + 1], w.dir);
    jump(1, true);
  }
  function jump(step, toEmpty) {
    var wi = words.indexOf(word());
    for (var s = 1; s <= words.length; s++) {
      var w = words[(wi + step * s + words.length * 4) % words.length];
      var e = w.cells.filter(function (i) { return !st.f[i]; })[0];
      if (!toEmpty || e !== undefined) return go(e !== undefined ? e : w.cells[0], w.dir);
    }
  }
  function typed(e) {
    var v = (inp.value || "").toUpperCase().replace(/[^A-Z]/g, ""); inp.value = "";
    if (!v) return;
    if (st.f.length && !played) { played = true; faPlay("mini", "start"); if (window.faRemind && window.faRemind.played) window.faRemind.played("mini", "started"); }
    setLetter(cur.i, v.slice(-1)); save();
    if (full()) return check();
    advance();
  }
  var played = false;
  function key(e) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (st.f[cur.i]) { setLetter(cur.i, ""); save(); return; }
      var w = word(), k = w.cells.indexOf(cur.i);
      if (k > 0) { go(w.cells[k - 1], w.dir); setLetter(cur.i, ""); save(); }
      return;
    }
    var mv = { ArrowLeft: [0, -1, "a"], ArrowRight: [0, 1, "a"], ArrowUp: [-1, 0, "d"], ArrowDown: [1, 0, "d"] }[e.key];
    if (mv) {
      e.preventDefault();
      if (cur.dir !== mv[2]) return go(cur.i, mv[2]);
      var x = cells[cur.i], r = x.r + mv[0], c = x.c + mv[1];
      while (r >= 0 && r < 5 && c >= 0 && c < 5) { if (pz.g[r][c] !== "#") return go(r * 5 + c, mv[2]); r += mv[0]; c += mv[1]; }
      return;
    }
    if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); jump(e.shiftKey ? -1 : 1, false); }
  }
  function full() { return cells.every(function (x, i) { return x.ch === "#" || st.f[i]; }); }
  function check() {
    var wrong = cells.filter(function (x, i) { return x.ch !== "#" && st.f[i] !== x.ch; });
    if (!wrong.length) return finish();
    toast("So close. Something in the grid isn't right yet.");
  }
  function toast(t) {
    var el = box.querySelector(".fa-mn-toast"); if (!el) return;
    el.textContent = t; el.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove("show"); }, 2400);
  }
  function finish() {
    st.done = true; st.t = Math.round(st.t); stop();
    var s = store.get("fa-mn-streak", { last: "", n: 0 });
    if (s.last !== today) { s.n = s.last === yday ? s.n + 1 : 1; s.last = today; store.set("fa-mn-streak", s); }
    save();
    if (inp) inp.blur();
    window.scrollTo(0, 0);
    draw();
    faPlay("mini", "done");
    if (window.faRemind && window.faRemind.played) window.faRemind.played("mini", "done");   // no nudge tonight
  }
  function share() {
    var text = "Flavor Mini · " + niceDate + "\nSolved in " + mmss(st.t) + (streak() > 1 ? " · " + streak() + "-day streak" : "");
    var url = "https://flavorafricagroup.org/mini.html";
    if (navigator.share) { navigator.share({ text: text, url: url }).catch(function () {}); return; }
    try { navigator.clipboard.writeText(text + "\n" + url).then(function () { var b = box.querySelector('[data-a="share"]'); if (b) b.textContent = "Copied"; }); } catch (e) {}
  }
  function click(e) {
    var a = e.target.closest("[data-a]");
    if (a) { var x = a.getAttribute("data-a"); if (x === "share") share(); else if (x === "next") jump(1, false); else if (x === "prev") jump(-1, false); return; }
    if (st.done) return;
    var c = e.target.closest("[data-i]");
    if (c) { var i = +c.getAttribute("data-i"); if (i === cur.i) go(i, cur.dir === "a" ? "d" : "a"); else go(i, cur.dir); return; }
    var w = e.target.closest("[data-w]");
    if (w) { var W = words[+w.getAttribute("data-w")]; var em = W.cells.filter(function (i) { return !st.f[i]; })[0]; go(em !== undefined ? em : W.cells[0], W.dir); box.querySelector(".fa-mn-grid").scrollIntoView({ block: "center", behavior: "smooth" }); }
  }
})();
