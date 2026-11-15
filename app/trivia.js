// Flavor Trivia (added 16 Nov 2026): ten questions a day, 15 seconds each, one theme per day.
// It has its own page, trivia.html (website and app); in the app, a card on Today links to it.
// Questions live in /app/trivia.json, one set per Nairobi date. A day with no set hides the card on Today.
// Scores, streak and answers are kept on the phone (localStorage); nothing is sent anywhere.
(function () {
  var R = document.documentElement;
  // its own styles, so the page also works on the website (not just the app)
  if (!document.querySelector('link[href="/app/trivia.css"]')) { var css = document.createElement("link"); css.rel = "stylesheet"; css.href = "/app/trivia.css"; document.head.appendChild(css); }
  var PAGE = document.getElementById("fa-trivia-page");   // trivia.html: the game plays on the page itself
  var SECS = 15, DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function nbo(offsetDays) { return new Date(Date.now() + 108e5 + (offsetDays || 0) * 864e5); }
  function dkey(d) { return d.toISOString().slice(0, 10); }
  var today = dkey(nbo()), yday = dkey(nbo(-1));
  var dayName = DAYS[nbo().getUTCDay()];
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var niceDate = nbo().getUTCDate() + " " + MON[nbo().getUTCMonth()];
  var set = null, box = null, st = null, timer = null;

  function title(light) { return '<span class="l">' + esc(set.theme) + "</span> <b>" + esc(dayName) + "</b>"; }
  function result() { return store.get("fa-tv-" + today, null); }
  function streak() {
    var s = store.get("fa-tv-streak", { last: "", n: 0 });
    return s.last === today || s.last === yday ? s.n : 0;
  }

  // The card on Today
  window.faTriviaSlot = function () {
    var slot = document.querySelector(".fa-tv-slot");
    if (!slot || !set) return;
    var r = result();
    slot.innerHTML = '<a href="/trivia.html" class="fa-tvc" style="background-image:linear-gradient(180deg,rgba(0,0,0,0) 30%,rgba(0,0,0,.7) 100%),url(/' + esc(set.img) + ')">' +
      '<span class="k">Flavor Trivia</span><span class="t">' + title() + "</span>" +
      '<span class="s">' + (r ? "You scored " + r.score + "/10 today. See your score" : "Ten questions. Fifteen seconds each.") + "</span></a>";
  };

  fetch("/app/trivia.json").then(function (x) { return x.json(); }).then(function (d) {
    set = d && d.sets && d.sets[today];
    if (!(set && set.qs && set.qs.length)) set = null;
    if (set) window.faTriviaSlot();
    if (PAGE) open();
  }).catch(function () { if (PAGE) PAGE.innerHTML = '<p class="fa-tv-note">Couldn\'t load today\'s questions. Check your connection and try again.</p>'; });

  // The game, on trivia.html
  function open() {
    box = PAGE;
    if (!set) { box.innerHTML = '<div class="fa-tv-in"><h2 class="fa-tv-none">No trivia today.</h2><p class="fa-tv-note">A new ten lands every day. Check back tomorrow.</p></div>'; return; }
    box.addEventListener("click", click);
    var r = result();
    if (r) { st = r; drawResults(); } else drawIntro();
  }
  function top() { window.scrollTo(0, 0); }
  var X = "";

  function drawIntro() {
    var n = streak(); top();
    box.innerHTML = '<div class="fa-tv-top">' + X + "</div>" +
      '<div class="fa-tv-in"><div class="fa-tv-hero" style="background-image:linear-gradient(180deg,rgba(0,0,0,0) 35%,rgba(0,0,0,.65) 100%),url(/' + esc(set.img) + ')"><h2>' + title() + "</h2><p>Ten questions. Fifteen seconds each.</p></div>" +
      '<button type="button" class="fa-tv-go" data-a="start">Start</button>' +
      '<p class="fa-tv-note">Faster answers score more. Same ten for everyone today.</p>' +
      (n ? '<p class="fa-tv-note"><b>' + n + "-day streak.</b> Play today to keep it going.</p>" : "") + "</div>";
  }

  // the options are shown in a mixed-up order (the same order for everyone that day), so the right answer isn't always in one spot
  function order(i) {
    var o = [0, 1, 2, 3], seed = 0, x = today + ":" + i;
    for (var n = 0; n < x.length; n++) seed = (seed * 31 + x.charCodeAt(n)) >>> 0;
    for (var m = 3; m > 0; m--) { seed = (seed * 1103515245 + 12345) >>> 0; var r = seed % (m + 1), t = o[m]; o[m] = o[r]; o[r] = t; }
    return o;
  }
  function start() { st = { score: 0, pts: 0, ans: [], i: 0, done: false }; ask(); }

  function ask() {
    var q = set.qs[st.i], left = SECS;
    st.locked = false; top();
    box.innerHTML = '<div class="fa-tv-top">' + X + '<span class="fa-tv-where">' + esc(set.theme) + " " + esc(dayName) + " · Question " + (st.i + 1) + " of " + set.qs.length + '</span><span class="sp"></span></div>' +
      '<div class="fa-tv-q"><div class="fa-tv-ring" role="timer"><svg viewBox="0 0 112 112" aria-hidden="true"><circle cx="56" cy="56" r="50" class="bg"/><circle cx="56" cy="56" r="50" class="fg"/></svg><span><b>' + left + "</b><i>seconds</i></span></div>" +
      "<h2>" + esc(q.q) + '</h2><div class="fa-tv-opts">' +
      order(st.i).map(function (k) { return '<button type="button" data-o="' + k + '">' + esc(q.a[k]) + "</button>"; }).join("") +
      '</div><div class="fa-tv-after"></div></div>' +
      '<div class="fa-tv-foot"><span><b>' + st.score + "</b> right so far</span><span>Answer now for <b class=\"pts\">" + left * 10 + "</b> points</span></div>";
    var fg = box.querySelector(".fg"), num = box.querySelector(".fa-tv-ring b"), pts = box.querySelector(".pts"), ring = box.querySelector(".fa-tv-ring");
    var t0 = Date.now();
    clearInterval(timer);
    timer = setInterval(function () {
      var gone = (Date.now() - t0) / 1000; left = Math.max(0, SECS - gone);
      var s = Math.ceil(left);
      num.textContent = s; pts.textContent = s * 10;
      fg.style.strokeDashoffset = (314.16 * (1 - left / SECS)).toFixed(2);
      ring.classList.toggle("low", s <= 5);
      if (left <= 0) answer(-1, 0);
    }, 100);
    st.left = function () { return Math.ceil(Math.max(0, SECS - (Date.now() - t0) / 1000)); };
  }

  function answer(k, secsLeft) {
    if (st.locked) return; st.locked = true;
    clearInterval(timer); timer = null;
    var q = set.qs[st.i], right = k === q.c;
    if (right) { st.score++; st.pts += Math.max(10, secsLeft * 10); }
    st.ans.push(k);
    [].forEach.call(box.querySelectorAll(".fa-tv-opts button"), function (b) {
      var j = +b.getAttribute("data-o");
      b.disabled = true;
      if (j === q.c) b.classList.add("ok");
      else if (j === k) b.classList.add("no");
    });
    var head = right ? "Nailed it." : k < 0 ? "Time's up." : "Not this time.";
    box.querySelector(".fa-tv-after").innerHTML = '<div class="fa-tv-x2"><b>' + head + "</b><p>" + esc(q.x) + "</p></div>" +
      '<button type="button" class="fa-tv-go" data-a="next">' + (st.i < set.qs.length - 1 ? "Next question" : "See my score") + "</button>";
    box.querySelector(".fa-tv-foot").innerHTML = "<span><b>" + st.score + "</b> right so far</span><span><b>" + st.pts + "</b> points</span>";
  }

  function next() {
    if (st.i < set.qs.length - 1) { st.i++; ask(); return; }
    st.done = true;
    var s = store.get("fa-tv-streak", { last: "", n: 0 });
    if (s.last !== today) { s.n = s.last === yday ? s.n + 1 : 1; s.last = today; store.set("fa-tv-streak", s); }
    store.set("fa-tv-" + today, { score: st.score, pts: st.pts, ans: st.ans, done: true });
    drawResults();
  }

  function drawResults() {
    var r = result() || st, n = streak(), missed = [], all = []; top();
    set.qs.forEach(function (q, j) {
      var k = r.ans[j], ok = k === q.c;
      var li = '<li class="' + (ok ? "ok" : "no") + '"><span class="m" aria-label="' + (ok ? "Right" : "Wrong") + '">' + (ok ? "✓" : "✕") + "</span><span><i>" + esc(q.q) + "</i><b>" + esc(q.a[q.c]) + "</b>" +
        (ok ? "" : "<em>" + (k < 0 || k == null ? " (time ran out)" : " (you said " + esc(q.a[k]) + ")") + "</em>") +
        (q.s ? '<a href="/' + esc(q.s) + '.html">Read our story</a>' : "") + "</span></li>";
      all.push(li); if (!ok) missed.push(li);
    });
    box.innerHTML = '<div class="fa-tv-top">' + X + '<span class="fa-tv-where">Back tomorrow with a new ten</span><span class="sp"></span></div>' +
      '<div class="fa-tv-in"><div class="fa-tv-card" style="background-image:linear-gradient(180deg,rgba(0,0,0,.25) 0,rgba(0,0,0,.08) 30%,rgba(0,0,0,.72) 100%),url(/' + esc(set.img) + ')">' +
      '<span class="lg">flavor.africa</span><div><p class="th">' + title() + '</p><div class="sc"><p>' + r.score + '<span>/10</span></p><p class="pt"><b>' + r.pts + "</b>points</p></div>" +
      "<p class=\"ln\">" + niceDate + (n ? " · " + n + "-day streak" : "") + ". Can you beat it?</p></div></div>" +
      '<button type="button" class="fa-tv-go" data-a="share">Share my score</button>' +
      (missed.length ? '<h3>' + (missed.length === 1 ? "The one you missed" : "The " + missed.length + " you missed") + '</h3><ul class="fa-tv-list">' + missed.join("") + "</ul>" : '<h3>A perfect ten.</h3>') +
      '<button type="button" class="fa-tv-all" data-a="all">See all ten answers</button><ul class="fa-tv-list" hidden>' + all.join("") + "</ul>" + '<a class="fa-tv-all" href="/connections.html" style="text-decoration:none">Play today\'s Flavor Connections</a></div>';
  }

  function share() {
    var r = result() || st, n = streak();
    var text = "Flavor Trivia · " + set.theme + " " + dayName + " · " + r.score + "/10 · " + r.pts + " points" + (n ? " · " + n + "-day streak" : "") + ". Can you beat it?";
    var url = "https://flavorafricagroup.org/";
    if (navigator.share) { navigator.share({ text: text, url: url }).catch(function () {}); return; }
    try { navigator.clipboard.writeText(text + " " + url).then(function () { var b = box.querySelector('[data-a="share"]'); if (b) b.textContent = "Copied"; }); } catch (e) {}
  }

  function click(e) {
    var o = e.target.closest("[data-o]");
    if (o && st && !st.locked) return answer(+o.getAttribute("data-o"), st.left());
    var a = e.target.closest("[data-a]"); if (!a) return;
    var w = a.getAttribute("data-a");
    if (w === "start") start();
    else if (w === "next") next();
    else if (w === "share") share();
    else if (w === "all") { var l = box.querySelectorAll(".fa-tv-list"); var x = l[l.length - 1]; x.hidden = !x.hidden; a.textContent = x.hidden ? "See all ten answers" : "Hide the answers"; }
  }
})();
