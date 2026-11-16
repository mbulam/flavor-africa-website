// Flavor Connections (added 16 Nov 2026): one puzzle a day. Sixteen tiles, four hidden groups of four, four mistakes allowed.
// It has its own page, connections.html (website and app); in the app, a card on Today links to it.
// Puzzles live in /app/connections.json, one per Nairobi date. A day with no puzzle hides the card on Today.
// Progress, results and streak are kept on the phone (localStorage); nothing is sent anywhere.
(function () {
  if (!document.querySelector('link[href="/app/connections.css"]')) { var css = document.createElement("link"); css.rel = "stylesheet"; css.href = "/app/connections.css"; document.head.appendChild(css); }
  var PAGE = document.getElementById("fa-cx-page");
  var LIVES = 4, SQ = ["🟨", "🟩", "🟦", "🟪"];
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function nbo(off) { return new Date(Date.now() + 108e5 + (off || 0) * 864e5); }
  function dkey(d) { return d.toISOString().slice(0, 10); }
  var today = dkey(nbo()), yday = dkey(nbo(-1));
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var niceDate = nbo().getUTCDate() + " " + MON[nbo().getUTCMonth()];
  var KEY = "fa-cx-" + today;
  var pz = null, st = null, box = null, sel = [], toastT = null;
  var TITLE = '<span class="l">Flavor</span> <b>Connections</b>';
  // Remind me (16 Nov 2026): the app's reminder, set to the hour you pick, only if you haven't played (see app.js)
  var R = document.documentElement;
  var BELL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>';
  function remindBtn(cls) {
    if (!(R.classList.contains("app") && window.faRemind && window.faRemind.ok)) return "";
    var h = window.faRemind.is("connections");
    return '<button type="button" class="fx-btn ' + cls + '" data-cx-remind aria-pressed="' + !!h + '">' + BELL + (h ? "Reminder · " + window.faRemind.label(h) : "Remind me") + "</button>";
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-cx-remind]"); if (!a) return;
    e.preventDefault(); a.disabled = true;
    window.faRemind.pick("connections").then(function (h) { a.disabled = false; a.setAttribute("aria-pressed", !!h); a.innerHTML = BELL + (h ? "Reminder · " + window.faRemind.label(h) : "Remind me"); });
  });
  document.addEventListener("fa-remind-ready", function () { if (pz) window.faCxSlot(); var s = document.querySelector(".fa-cx-rem"); if (s) s.innerHTML = remindBtn("l"); });

  function streak() { var s = store.get("fa-cx-streak", { last: "", n: 0 }); return s.last === today || s.last === yday ? s.n : 0; }
  function group(w) { for (var g = 0; g < 4; g++) if (pz.groups[g].w.indexOf(w) > -1) return g; return -1; }
  // the starting order is mixed up the same way for everyone that day
  function seeded(arr, salt) {
    var a = arr.slice(), seed = 0, x = today + ":" + salt;
    for (var n = 0; n < x.length; n++) seed = (seed * 31 + x.charCodeAt(n)) >>> 0;
    for (var m = a.length - 1; m > 0; m--) { seed = (seed * 1103515245 + 12345) >>> 0; var r = seed % (m + 1), t = a[m]; a[m] = a[r]; a[r] = t; }
    return a;
  }
  function save() { store.set(KEY, st); }

  // The card on Today (app)
  window.faCxSlot = function () {
    var slot = document.querySelector(".fa-cx-slot");
    if (!slot || !pz) return;
    var r = store.get(KEY, null), line;
    if (r && r.done) line = r.won ? "Solved" + (r.miss ? " with " + r.miss + (r.miss === 1 ? " mistake" : " mistakes") : " without a mistake") + ". See your grid" : "Not today. See the answers";
    else if (r && (r.solved.length || r.miss)) line = r.solved.length + " of 4 groups found. Keep going";
    else line = "Find four groups of four.";
    var mini = ""; for (var i = 0; i < 16; i++) mini += "<i" + (r && r.done ? ' class="c' + Math.floor(i / 4) + '"' : "") + "></i>";
    slot.innerHTML = '<div class="fa-cxc fx"><a href="/connections.html" class="fa-cxc-in"><span class="tx"><span class="k">Today\'s puzzle</span><span class="t">' + TITLE + '</span><span class="s">' + line + '</span></span><span class="mini" aria-hidden="true">' + mini + '</span></a><div class="fx-btns"><a class="fx-btn d" href="/connections.html">' + (r && r.done ? "See your grid" : r && r.solved && r.solved.length ? "Keep going" : "Play now") + "</a>" + remindBtn("l") + "</div></div>";
  };

  fetch("/app/connections.json").then(function (x) { return x.json(); }).then(function (d) {
    pz = d && d.puzzles && d.puzzles[today];
    if (!(pz && pz.groups && pz.groups.length === 4)) pz = null;
    if (pz) window.faCxSlot();
    if (PAGE) open();
  }).catch(function () { if (PAGE) PAGE.innerHTML = '<p class="fa-cx-note">Couldn\'t load today\'s puzzle. Check your connection and try again.</p>'; });

  function open() {
    box = PAGE;
    if (!pz) { box.innerHTML = '<div class="fa-cx-head"><h1>' + TITLE + '</h1></div><p class="fa-cx-note">No puzzle today. A new one lands every day, so check back tomorrow.</p>'; return; }
    var all = []; pz.groups.forEach(function (g) { all = all.concat(g.w); });
    st = store.get(KEY, null);
    if (!st || !st.order) st = { order: seeded(all, "o"), solved: [], miss: 0, tries: [], done: false, won: false };
    box.addEventListener("click", click);
    draw();
  }

  function draw() {
    if (st.done) return drawEnd();
    var left = st.order.filter(function (w) { return st.solved.indexOf(group(w)) < 0; });
    sel = sel.filter(function (w) { return left.indexOf(w) > -1; });
    var dots = ""; for (var i = 0; i < LIVES; i++) dots += '<i class="' + (i < LIVES - st.miss ? "on" : "") + '"></i>';
    box.innerHTML = '<div class="fa-cx-head"><h1>' + TITLE + '</h1><p>Find four groups of four. Pick four tiles that share something, then submit.</p><div class="fa-cx-rem">' + remindBtn("l") + "</div></div>" +
      '<div class="fa-cx-board">' + st.solved.map(bar).join("") +
      '<div class="fa-cx-grid">' + left.map(function (w) {
        return '<button type="button" class="fa-cx-tile' + (sel.indexOf(w) > -1 ? " on" : "") + size(w) + '" data-w="' + esc(w) + '" aria-pressed="' + (sel.indexOf(w) > -1) + '"><span>' + esc(w) + "</span></button>";
      }).join("") + "</div></div>" +
      '<div class="fa-cx-lives" aria-label="' + (LIVES - st.miss) + ' mistakes left"><span>Mistakes left</span>' + dots + "</div>" +
      '<div class="fa-cx-ctrl"><button type="button" data-a="shuffle">Shuffle</button><button type="button" data-a="clear"' + (sel.length ? "" : " disabled") + '>Deselect</button><button type="button" class="go" data-a="submit"' + (sel.length === 4 ? "" : " disabled") + ">Submit</button></div>" +
      '<div class="fa-cx-toast" role="status" aria-live="polite"></div>' +
      (streak() ? '<p class="fa-cx-note"><b>' + streak() + "-day streak.</b> Solve today's to keep it going.</p>" : "");
  }

  // tile text size goes by its longest word, so words never break in the middle
  function size(w) { var L = Math.max.apply(null, w.split(" ").map(function (x) { return x.length; })); return L >= 11 ? " xl" : L >= 9 ? " long" : L >= 7 ? " m" : ""; }

  function bar(g) {
    var G = pz.groups[g];
    return '<div class="fa-cx-bar c' + g + '"><b>' + esc(G.t) + "</b><span>" + G.w.map(esc).join(", ") + "</span></div>";
  }

  function toast(t) {
    var el = box.querySelector(".fa-cx-toast"); if (!el) return;
    el.textContent = t; el.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove("show"); }, 1800);
  }

  function refreshSel() {
    [].forEach.call(box.querySelectorAll(".fa-cx-tile"), function (b) { var on = sel.indexOf(b.getAttribute("data-w")) > -1; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
    box.querySelector('[data-a="clear"]').disabled = !sel.length;
    box.querySelector('[data-a="submit"]').disabled = sel.length !== 4;
  }

  function submit() {
    if (sel.length !== 4) return;
    var key = sel.slice().sort().join("|");
    if (st.tries.some(function (t) { return t.slice().sort().join("|") === key; })) { toast("You've already tried that one."); return; }
    st.tries.push(sel.slice());
    if (st.tries.length === 1 && window.faRemind && window.faRemind.played) window.faRemind.played("connections", "started");
    var count = [0, 0, 0, 0]; sel.forEach(function (w) { count[group(w)]++; });
    var best = Math.max.apply(null, count), g = count.indexOf(best);
    if (best === 4) {
      st.solved.push(g); sel = [];
      if (st.solved.length === 4) finish(true); else { save(); draw(); }
      return;
    }
    st.miss++;
    if (st.miss >= LIVES) { save(); shake(function () { finish(false); }); return; }
    save();
    shake(function () { draw(); toast(best === 3 ? "One away." : "Not a group."); });
  }

  function shake(then) {
    var on = box.querySelectorAll(".fa-cx-tile.on");
    [].forEach.call(on, function (b) { b.classList.add("bad"); });
    setTimeout(then, 450);
  }

  function finish(won) {
    st.done = true; st.won = won;
    for (var g = 0; g < 4; g++) if (st.solved.indexOf(g) < 0) st.solved.push(g); // reveal the rest, in order
    if (won) {
      var s = store.get("fa-cx-streak", { last: "", n: 0 });
      if (s.last !== today) { s.n = s.last === yday ? s.n + 1 : 1; s.last = today; store.set("fa-cx-streak", s); }
    } else store.set("fa-cx-streak", { last: "", n: 0 });
    save(); sel = []; drawEnd();
    if (window.faRemind && window.faRemind.played) window.faRemind.played("connections", "done");   // no nudge tonight
  }

  function grid() { return st.tries.map(function (t) { return t.map(function (w) { return SQ[group(w)]; }).join(""); }).join("\n"); }

  function drawEnd() {
    var n = streak(), head = st.won ? (st.miss === 0 ? "Clean sweep." : st.miss === 3 ? "Close one." : "Got it.") : "Not this time.";
    var sub = st.won ? "Solved" + (st.miss ? " with " + st.miss + (st.miss === 1 ? " mistake" : " mistakes") : " without a mistake") + (n ? " · " + n + "-day streak" : "") : "The four groups are below.";
    window.scrollTo(0, 0);
    box.innerHTML = '<div class="fa-cx-head"><h1>' + TITLE + '</h1><p>' + niceDate + ". Back tomorrow with a new puzzle.</p></div>" +
      '<div class="fa-cx-end"><h2>' + head + "</h2><p>" + sub + '</p><div class="fa-cx-sq" aria-hidden="true">' + st.tries.map(function (t) { return "<div>" + t.map(function (w) { return '<i class="c' + group(w) + '"></i>'; }).join("") + "</div>"; }).join("") + "</div></div>" +
      '<button type="button" class="fa-cx-go" data-a="share">Share my grid</button>' +
      '<div class="fa-cx-ans">' + st.solved.map(function (g) {
        var G = pz.groups[g];
        return '<div class="fa-cx-a">' + bar(g) + "<p>" + esc(G.x || "") + (G.s ? ' <a href="/' + esc(G.s) + '.html">Read our story</a>' : "") + "</p></div>";
      }).join("") + "</div>" +
      '<a class="fa-cx-more" href="/trivia.html">Play today\'s Flavor Trivia</a>';
  }

  function share() {
    var text = "Flavor Connections · " + niceDate + "\n" + grid();
    var url = "https://flavorafricagroup.org/connections.html";
    if (navigator.share) { navigator.share({ text: text, url: url }).catch(function () {}); return; }
    try { navigator.clipboard.writeText(text + "\n" + url).then(function () { var b = box.querySelector('[data-a="share"]'); if (b) b.textContent = "Copied"; }); } catch (e) {}
  }

  function click(e) {
    var t = e.target.closest("[data-w]");
    if (t && !st.done) {
      var w = t.getAttribute("data-w"), i = sel.indexOf(w);
      if (i > -1) sel.splice(i, 1); else if (sel.length < 4) sel.push(w);
      refreshSel(); return;
    }
    var a = e.target.closest("[data-a]"); if (!a || a.disabled) return;
    var x = a.getAttribute("data-a");
    if (x === "shuffle") { st.order = seeded(st.order, "s" + Date.now()); save(); draw(); }
    else if (x === "clear") { sel = []; refreshSel(); }
    else if (x === "submit") submit();
    else if (x === "share") share();
  }
})();
