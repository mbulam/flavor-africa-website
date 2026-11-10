// Fan Seat (added 10 Nov 2026; on the website as well as the app from 11 Nov 2026).
// When FAN_SEAT is set in _site.py, Home and Live get an "Ask <name>" panel near the top, right under the first block.
// Questions are saved by /api/fanseat (3 per phone) and read on the private inbox page.
(function () {
  var main = document.querySelector("main"), top = main && main.firstElementChild;
  if (!top) return;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
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
  var CSS = ".fa-fanseat-w{padding-top:24px}.fa-fanseat{background:var(--tint);border-top:6px solid var(--accent);padding:22px 20px 24px}.fa-fanseat form{max-width:640px}.fa-fanseat h2{font-size:34px;text-transform:uppercase;margin:12px 0 8px}.fa-fanseat p{margin:0 0 14px;color:var(--mute);font-size:15px}" +
    ".fa-fanseat p.ok{color:var(--accent);font-weight:500}.fa-fanseat p.err{color:var(--fall);font-weight:500}" +
    ".fa-fanseat label{display:block;font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);margin:14px 0 6px}" +
    ".fa-fanseat textarea,.fa-fanseat input{display:block;width:100%;border:1px solid var(--line);background:var(--paper);color:var(--ink);font-family:var(--body);font-size:16px;padding:12px;border-radius:0;-webkit-user-select:text;user-select:text}" +
    ".fa-fanseat textarea:focus,.fa-fanseat input:focus{outline:2px solid var(--accent);outline-offset:0}.fa-fanseat .n{display:block;text-align:right;font-family:var(--mono);font-size:11px;color:var(--mute);margin-top:4px}" +
    ".fa-fanseat form button{margin-top:16px;min-height:48px;padding:0 22px;border:0;background:var(--purple);color:#fff;font-family:var(--mono);font-size:12px;letter-spacing:.12em;text-transform:uppercase;cursor:pointer}.fa-fanseat form button:disabled{opacity:.6}";

  fetch("/app/feed.json").then(function (r) { return r.json(); }).then(function (feed) {
    var fs = feed.fanseat;
    if (!fs || !fs.show || !fs.artist) return;
    var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    var sent = load("fa-fanseat", {}), mine = sent[fs.show] || 0;
    var wrap = document.createElement("section"); wrap.className = "wrap fa-fanseat-w"; wrap.id = "fan-seat"; wrap.setAttribute("aria-label", "Fan Seat");
    var box = document.createElement("div"); box.className = "fa-fanseat"; wrap.appendChild(box);
    main.insertBefore(wrap, top.nextSibling);
    function form(note, bad) {
      if (mine >= 3) { box.innerHTML = '<span class="tag">Fan Seat</span><h2>Your questions are in</h2><p>That\'s your three for ' + esc(fs.artist) + ". " + esc(fs.done || "We'll put the best ones to them at the show.") + "</p>"; return; }
      var keepQ = bad ? box.querySelector("textarea").value : "", keepN = box.querySelector("input") ? box.querySelector("input").value : "";
      box.innerHTML = '<span class="tag">Fan Seat</span><h2>Ask ' + esc(fs.artist) + "</h2><p>" + esc(fs.line || "") + (fs.line ? ". " : "") + esc(fs.blurb || "What have you always wanted to know? The best questions get asked at the show.") + "</p>" +
        (note ? '<p class="' + (bad ? "err" : "ok") + '" role="status">' + esc(note) + "</p>" : "") +
        '<form><label for="fa-fs-q">Your question</label><textarea id="fa-fs-q" maxlength="280" rows="3" required></textarea><span class="n" aria-hidden="true">0 / 280</span>' +
        '<label for="fa-fs-n">Your name (optional)</label><input id="fa-fs-n" maxlength="40" autocomplete="given-name"><button type="submit">Send it</button></form>';
      var f = box.querySelector("form"), q = f.querySelector("textarea"), n = f.querySelector(".n"), go = f.querySelector("button");
      q.value = keepQ; f.querySelector("input").value = keepN; n.textContent = q.value.length + " / 280";
      q.addEventListener("input", function () { n.textContent = q.value.length + " / 280"; });
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        if (q.value.trim().length < 5) return form("Add a little more to your question.", true);
        go.disabled = true;
        fetch("/api/fanseat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ q: q.value, name: f.querySelector("input").value, id: phoneId() }) })
          .then(function (r) { return r.json(); }).then(function (d) {
            if (d.ok || d.error === "limit") { mine = d.ok ? mine + 1 : 3; sent[fs.show] = mine; save("fa-fanseat", sent); return form(d.ok ? "Sent. Got another one?" : ""); }
            form(d.error === "closed" ? "Fan Seat has closed for this one." : "That didn't go through. Try again.", true);
          }).catch(function () { form("You seem to be offline. Try again when you're back.", true); });
      });
    }
    form("");
  }).catch(function () {});
})();
