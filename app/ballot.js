// The Flavor Ballot (added 16 Nov 2026). Fans call the Grammy winners in six categories ("Will win") and say who
// deserves it ("Should win"). Loaded on games.html (the photo card in .fa-bl-slot) and on ballot.html (the game).
// ballot.html screens, by address: #c1 ... #c6 = pick a category, #mine = your ballot, #fans = what fans say.
// Picks are kept on the phone and sent to /api/ballot (one ballot per phone, can be changed until the lock in
// app/ballot.json). After the show, fill "winners" in app/ballot.json and every ballot gets its score.
(function () {
  var head = document.head;
  if (!document.querySelector('link[href="/app/fx.css"]')) {
    head.insertAdjacentHTML("beforeend", '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300..700&display=swap"><link rel="stylesheet" href="/app/fx.css">');
  }
  head.insertAdjacentHTML("beforeend", '<link rel="stylesheet" href="/app/ballot.css">');

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function phoneId() {
    var id = load("fa-id", "");
    if (!/^[a-z0-9]{24}$/.test(id)) {
      var a = new Uint8Array(24), abc = "abcdefghijklmnopqrstuvwxyz0123456789"; id = "";
      (window.crypto || window.msCrypto).getRandomValues(a);
      for (var k = 0; k < 24; k++) id += abc[a[k] % 36];
      save("fa-id", id);
    }
    return id;
  }
  var ICON = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    go: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>'
  };
  var B = null, picks = load("fa-ballot", {}), fans = null, tab = "will", fansCat = 0, fansKind = "will", sendT = 0;

  function locked() { return B && Date.now() >= Date.parse(B.lock); }
  function count() { var n = 0; B.cats.forEach(function (c) { if (picks[c.id] && picks[c.id].will) n++; }); return n; }
  function nom(c, id) { for (var i = 0; i < c.noms.length; i++) if (c.noms[i].id === id) return c.noms[i]; return null; }
  function label(n) { return n ? esc(n.t) + (n.a ? " · " + esc(n.a) : "") : "Not picked yet"; }
  function score() {
    var w = B.winners || {}, got = 0, out = 0;
    B.cats.forEach(function (c) { if (w[c.id]) { out++; if (picks[c.id] && picks[c.id].will === w[c.id]) got++; } });
    return out ? { got: got, out: out } : null;
  }
  function initials(n) { return esc((n.a || n.t).replace(/[^A-Za-zÀ-ÿ ]/g, " ").split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join("").toUpperCase()); }
  function thumb(n) { return n.i ? '<span class="fx-th" style="background-image:url(/' + esc(n.i) + ')"></span>' : '<span class="fx-th fa-bl-ini">' + initials(n) + "</span>"; }

  function send() {
    clearTimeout(sendT);
    sendT = setTimeout(function () {
      if (locked()) return;
      fetch("/api/ballot", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: phoneId(), picks: picks }) })
        .then(function (r) { return r.json(); }).then(function (d) { if (d && d.ok) fans = d; }).catch(function () {});
    }, 600);
  }
  function getFans(then) {
    fetch("/api/ballot?id=" + phoneId(), { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (d) {
      if (d && d.ok) {
        fans = d;
        // a ballot saved from this phone earlier (e.g. before the app was reinstalled) comes back
        if (d.mine && !Object.keys(picks).length) { picks = d.mine; save("fa-ballot", picks); }
      }
      if (then) then();
    }).catch(function () { if (then) then(); });
  }

  // ---- The card on the Games page
  function card() {
    var slot = document.querySelector(".fa-bl-slot");
    if (!slot || !B) return;
    var n = count(), s = score(), k, line, b1, href;
    if (s) { k = "Grammys 2027 · results are in"; line = "You called " + s.got + " of " + s.out + " right. See how fans did against the Academy."; b1 = "See how you did"; href = "/ballot.html#mine"; }
    else if (locked()) { k = "Grammys 2027 · ballot closed"; line = "Picks are locked. Your score lands when the winners are named."; b1 = "See my ballot"; href = "/ballot.html#mine"; }
    else if (n === B.cats.length) { k = "Grammys 2027 · your ballot is in"; line = "All six picked. You can change them until " + esc(B.lockText) + "."; b1 = "See my ballot"; href = "/ballot.html#mine"; }
    else if (n) { k = "Grammys 2027 · " + n + " of " + B.cats.length + " picked"; line = "Finish your ballot before " + esc(B.lockText) + "."; b1 = "Keep going"; href = "/ballot.html#c" + (firstOpen() + 1); }
    else { k = "New · Grammys 2027"; line = "Call the winners in six categories. Score a point for every one the Academy gets right."; b1 = "Fill my ballot"; href = "/ballot.html#c1"; }
    slot.innerHTML = '<a class="fx-card fa-bl-card" href="' + href + '" style="background-image:url(/img/gr27-tems.jpg)"><span class="in"><span class="k">' + k + '</span><h2 class="fx-cap"><span>The Flavor</span> <b>Ballot</b></h2><p>' + line + '</p><span class="fx-btns"><span class="fx-btn">' + b1 + '</span><span class="fx-btn o" data-fans>What fans say</span></span></span></a>';
    var f = slot.querySelector("[data-fans]");
    f.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); location.href = "/ballot.html#fans"; });
  }
  function firstOpen() { for (var i = 0; i < B.cats.length; i++) if (!(picks[B.cats[i].id] && picks[B.cats[i].id].will)) return i; return 0; }

  // ---- ballot.html
  var root = document.querySelector(".fa-bl-root");
  function top(where, backHref, isClose) {
    return '<div class="fa-bl-top"><a class="fa-bl-x" href="' + backHref + '" aria-label="' + (isClose ? "Close" : "Back") + '">' + (isClose ? ICON.x : ICON.back) + '</a><span class="fa-bl-where">' + where + '</span><span class="fa-bl-sp"></span></div>';
  }
  function viewPick(i) {
    var c = B.cats[i], p = picks[c.id] || {}, cur = p[tab], lock = locked(), rows = "";
    c.noms.forEach(function (n) {
      var on = cur === n.id;
      rows += '<li><button type="button" class="fx-row' + (on ? " on" : "") + '" data-pick="' + esc(n.id) + '"' + (lock ? " disabled" : "") + ' aria-pressed="' + on + '">' + thumb(n) +
        '<span class="fx-tx"><b>' + esc(n.t) + "</b>" + (n.a ? "<em>" + esc(n.a) + "</em>" : "") + '</span><span class="fx-ix">' + (on ? ICON.check : "") + "</span></button></li>";
    });
    var last = i === B.cats.length - 1, next = last ? '<a class="fx-btn d fa-bl-wide" href="#mine">See my ballot</a>' : '<a class="fx-btn d fa-bl-wide" href="#c' + (i + 2) + '">Next: ' + esc(B.cats[i + 1].name) + "</a>";
    root.innerHTML = top("Category " + (i + 1) + " of " + B.cats.length, i ? "#c" + i : "/games.html", !i) +
      '<div class="fx-ttl"><span class="fa-bl-lab">' + esc(B.show) + '</span><h1 class="fx-cap"><span>' + esc(c.l) + "</span> <b>" + esc(c.b) + "</b></h1></div>" +
      '<div class="fx-tx-tabs" role="tablist"><button type="button" role="tab" data-tab="will" aria-selected="' + (tab === "will") + '">Will win</button><button type="button" role="tab" data-tab="should" aria-selected="' + (tab === "should") + '">Should win</button></div>' +
      '<p class="fx-note">' + (lock ? "Picks are locked." : tab === "will" ? "Who do you think the Academy will pick?" : "Forget the odds. Who deserves it?") + (c.note ? " " + esc(c.note) : "") + "</p>" +
      '<ul class="fx-rows">' + rows + "</ul>" +
      '<div class="fa-bl-foot"><div class="fa-bl-sum"><span>Will win: <b>' + (p.will ? esc(nom(c, p.will).t) : "Not picked yet") + "</b></span><span>Should: <b>" + (p.should ? esc(nom(c, p.should).t) : "Not picked yet") + "</b></span></div>" + next + "</div>";
    root.querySelectorAll("[data-tab]").forEach(function (b) { b.addEventListener("click", function () { tab = b.getAttribute("data-tab"); viewPick(i); }); });
    root.querySelectorAll("[data-pick]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (locked()) return;
        var pp = picks[c.id] || {}; pp[tab] = b.getAttribute("data-pick"); picks[c.id] = pp; save("fa-ballot", picks); send();
        viewPick(i);
      });
    });
  }
  function viewMine() {
    var s = score(), w = B.winners || {}, rows = "", n = count();
    B.cats.forEach(function (c, i) {
      var p = picks[c.id] || {}, will = nom(c, p.will), should = nom(c, p.should), res = "";
      if (w[c.id] && will) res = w[c.id] === p.will ? '<span class="fx-ix y" aria-label="Right">' + ICON.check + "</span>" : '<span class="fx-ix" aria-label="Wrong">' + ICON.x + "</span>";
      else res = will ? '<span class="fx-ix y">' + ICON.check + "</span>" : '<span class="fx-ix">' + ICON.go + "</span>";
      rows += '<li><a class="fx-row" href="#c' + (i + 1) + '"><span class="fx-tx"><i>' + esc(c.name) + "</i><b>" + label(will) + "</b><em>" +
        (w[c.id] ? "Winner: " + label(nom(c, w[c.id])) : "Should win: " + (should ? label(should) : "not picked yet")) + "</em></span>" + res + "</a></li>";
    });
    var lockDay = new Date(B.lock).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Nairobi" });
    root.innerHTML = top("The Flavor Ballot", "/games.html", true) +
      '<div class="fx-ttl"><h1 class="fx-cap"><span>Your</span> <b>Ballot</b></h1></div>' +
      '<div class="fx-stats"><div><b>' + n + "/" + B.cats.length + "</b><span>Picked</span></div><div><b>" + esc(lockDay) + "</b><span>" + (locked() ? "Ballot locked" : "Ballot locks") + "</span></div><div><b>" + (s ? s.got + "/" + s.out : "—") + "</b><span>Your score</span></div></div>" +
      '<ul class="fx-rows">' + rows + "</ul>" +
      '<div class="fa-bl-foot">' + (n ? '<button type="button" class="fx-btn d fa-bl-wide" data-share>Share my ballot</button>' : '<a class="fx-btn d fa-bl-wide" href="#c1">Fill my ballot</a>') +
      '<a class="fx-btn l fa-bl-wide" href="#fans">What fans say</a><p class="fx-note fa-bl-c">' +
      (locked() ? "Picks are locked. Scores land when the winners are named." : "You can change picks until " + esc(B.lockText) + ".") + "</p></div>";
    var sh = root.querySelector("[data-share]");
    if (sh) sh.addEventListener("click", function () {
      var t = "My Grammys ballot on flavor.africa\n";
      B.cats.forEach(function (c) { var x = nom(c, (picks[c.id] || {}).will); if (x) t += "\n" + c.name + ": " + x.t + (x.a ? " (" + x.a + ")" : ""); });
      t += "\n\nMake yours:";
      var url = "https://flavorafricagroup.org/ballot.html";
      if (navigator.share) navigator.share({ title: "The Flavor Ballot", text: t, url: url }).catch(function () {});
      else { try { navigator.clipboard.writeText(t + " " + url).then(function () { sh.textContent = "Copied. Paste it anywhere"; }); } catch (e) {} }
    });
  }
  function viewFans() {
    var c = B.cats[fansCat], tabs = "", rows = "", w = (B.winners || {})[c.id];
    B.cats.forEach(function (x, i) { tabs += '<button type="button" role="tab" data-cat="' + i + '" aria-selected="' + (i === fansCat) + '">' + esc(x.short) + "</button>"; });
    var t = fans && fans.tally ? fans.tally[c.id] : null, tot = t ? (fansKind === "will" ? t.nWill : t.nShould) : 0, votes = t ? t[fansKind] : {};
    var list = c.noms.map(function (n) { return { n: n, v: votes[n.id] || 0 }; }).sort(function (a, b) { return b.v - a.v; });
    list.forEach(function (o, i) {
      var pct = tot ? Math.round((o.v / tot) * 100) : 0, lead = tot && i === 0;
      rows += '<li class="fx-row fa-bl-fan">' + thumb(o.n) + '<span class="fx-tx">' + (w === o.n.id ? "<i>Won the Grammy</i>" : "") + "<b>" + esc(o.n.t) + "</b>" + (o.n.a ? "<em>" + esc(o.n.a) + "</em>" : "") +
        '<span class="fa-bl-bar"><span style="width:' + pct + '%"' + (lead ? ' class="y"' : "") + "></span></span></span><span class=\"fa-bl-pct\">" + (tot ? pct + "%" : "") + "</span></li>";
    });
    var sub = !fans ? "Fan totals aren't available right now. Try again in a bit." : fans.ballots ? fans.ballots + (fans.ballots === 1 ? " ballot" : " ballots") + " so far." : "No ballots yet. Yours could be the first.";
    root.innerHTML = top("The Flavor Ballot", count() ? "#mine" : "/games.html", !count()) +
      '<div class="fx-ttl"><h1 class="fx-cap"><span>What</span> <b>fans say</b></h1><p>' + sub + "</p></div>" +
      '<div class="fx-tx-tabs" role="tablist">' + tabs + "</div>" +
      '<div class="fa-bl-kinds"><button type="button" class="fx-pill" data-kind="will" aria-pressed="' + (fansKind === "will") + '">Will win</button><button type="button" class="fx-pill" data-kind="should" aria-pressed="' + (fansKind === "should") + '">Should win</button></div>' +
      '<ul class="fx-rows">' + rows + "</ul>" +
      '<div class="fa-bl-foot">' + (count() === B.cats.length ? "" : '<a class="fx-btn d fa-bl-wide" href="#c' + (firstOpen() + 1) + '">' + (count() ? "Finish my ballot" : "Fill my ballot") + "</a>") +
      '<p class="fx-note fa-bl-c">' + (w ? "The yellow bar is the fans' favourite. The Grammy winner is marked." : "On Grammys night this turns into fans vs the Academy.") + "</p></div>";
    root.querySelectorAll("[data-cat]").forEach(function (b) { b.addEventListener("click", function () { fansCat = +b.getAttribute("data-cat"); viewFans(); }); });
    root.querySelectorAll("[data-kind]").forEach(function (b) { b.addEventListener("click", function () { fansKind = b.getAttribute("data-kind"); viewFans(); }); });
    var on = root.querySelector('[data-cat="' + fansCat + '"]'); if (on && on.scrollIntoView) on.scrollIntoView({ block: "nearest", inline: "center" });
  }
  function route() {
    if (!root || !B) return;
    var h = location.hash, m = /^#c(\d)$/.exec(h);
    if (m && +m[1] >= 1 && +m[1] <= B.cats.length) { viewPick(+m[1] - 1); }
    else if (h === "#fans") { viewFans(); getFans(function () { if (location.hash === "#fans") viewFans(); }); }
    else if (h === "#mine" || count() || locked()) { viewMine(); }
    else { location.replace("#c1"); return; }
    window.scrollTo(0, 0);
  }

  fetch("/app/ballot.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (d) {
    B = d;
    card();
    if (root) { window.addEventListener("hashchange", route); route(); }
    getFans(function () { card(); if (root && !location.hash.match(/^#c\d$/) && location.hash !== "#fans") route(); });
  }).catch(function () {});
})();
