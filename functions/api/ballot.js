// The Flavor Ballot (added 16 Nov 2026): fans call the Grammy winners (will win) and say who deserves it (should win).
//   GET  /api/ballot?id=<phone code>   -> fan totals for every category, how many ballots, and this phone's picks
//   POST /api/ballot {id, picks}       -> saves this phone's whole ballot (sending again replaces it) until the lock
// picks = { "<category id>": { "will": "<nominee id>", "should": "<nominee id>" }, ... }
// Categories, nominees and the lock time come from /app/ballot.json. Ballots live in the D1 database bound as DB
// (the same one the Flavor 10 fans' pick uses), table "ballots".
const H = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const out = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: H });

async function hash(text) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(d)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function ballot(request, env) {
  const r = await env.ASSETS.fetch(new URL("/app/ballot.json", request.url));
  return r.json();
}

function clean(b, picks) {
  const ok = {};
  if (!picks || typeof picks !== "object") return ok;
  for (const c of b.cats) {
    const p = picks[c.id];
    if (!p || typeof p !== "object") continue;
    const ids = c.noms.map((n) => n.id), one = {};
    if (ids.includes(p.will)) one.will = p.will;
    if (ids.includes(p.should)) one.should = p.should;
    if (one.will || one.should) ok[c.id] = one;
  }
  return ok;
}

async function state(db, b, phone) {
  const rows = (await db.prepare("SELECT picks FROM ballots").all()).results || [];
  const tally = {};
  b.cats.forEach((c) => { tally[c.id] = { will: {}, should: {}, nWill: 0, nShould: 0 }; });
  rows.forEach((r) => {
    let p = {};
    try { p = JSON.parse(r.picks); } catch (e) {}
    for (const cid in p) {
      const t = tally[cid];
      if (!t) continue;
      if (p[cid].will) { t.will[p[cid].will] = (t.will[p[cid].will] || 0) + 1; t.nWill++; }
      if (p[cid].should) { t.should[p[cid].should] = (t.should[p[cid].should] || 0) + 1; t.nShould++; }
    }
  });
  let mine = null;
  if (phone) {
    const m = await db.prepare("SELECT picks FROM ballots WHERE phone = ?").bind(phone).first();
    if (m) { try { mine = JSON.parse(m.picks); } catch (e) {} }
  }
  return { ok: true, ballots: rows.length, tally, mine, locked: Date.now() >= Date.parse(b.lock) };
}

export async function onRequest({ request, env }) {
  const db = env.DB;
  if (!db) return out({ ok: false, error: "not-ready" }, 503);
  try {
    await db.prepare("CREATE TABLE IF NOT EXISTS ballots (phone TEXT PRIMARY KEY, picks TEXT NOT NULL, ip TEXT, updated TEXT)").run();
    const b = await ballot(request, env);
    const url = new URL(request.url);

    if (request.method === "GET") {
      const id = url.searchParams.get("id") || "";
      return out(await state(db, b, /^[a-z0-9]{16,40}$/.test(id) ? await hash(id) : null));
    }
    if (request.method !== "POST") return out({ ok: false, error: "method" }, 405);
    if (Date.now() >= Date.parse(b.lock)) return out({ ok: false, error: "locked" }, 403);

    let body = {};
    try { body = await request.json(); } catch (e) {}
    const id = String(body.id || "");
    if (!/^[a-z0-9]{16,40}$/.test(id)) return out({ ok: false, error: "no-id" }, 400);
    const picks = clean(b, body.picks);
    if (!Object.keys(picks).length) return out({ ok: false, error: "empty" }, 400);

    const phone = await hash(id);
    const day = new Date(Date.now() + 108e5).toISOString().slice(0, 10);
    const ip = await hash((request.headers.get("cf-connecting-ip") || "") + "|" + day);
    // many phones share one mobile connection, so the cap per connection is generous
    const used = await db.prepare("SELECT COUNT(*) AS n FROM ballots WHERE ip = ? AND phone != ?").bind(ip, phone).first();
    if (used && used.n >= 60) return out({ ok: false, error: "busy" }, 429);

    await db.prepare("INSERT INTO ballots (phone, picks, ip, updated) VALUES (?, ?, ?, ?) ON CONFLICT(phone) DO UPDATE SET picks = excluded.picks, updated = excluded.updated")
      .bind(phone, JSON.stringify(picks), ip, new Date().toISOString()).run();
    return out(await state(db, b, phone));
  } catch (e) {
    return out({ ok: false, error: "server" }, 500);
  }
}
