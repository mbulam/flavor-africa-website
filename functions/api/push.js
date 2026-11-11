// Alerts for the home-screen app (added 11 Nov 2026).
//   GET  /api/push                      -> the public key a phone needs to switch alerts on
//   GET  /api/push?latest=1             -> the newest alert's words (the phone asks for this when an alert arrives)
//   GET  /api/push?key=<ADMIN_KEY>      -> how many phones have alerts on, and the last alerts sent (for the inbox page)
//   POST /api/push {endpoint, id}       -> a phone switches alerts on;  {endpoint, off: true} switches them off
//   POST /api/push {key, title, body, url}  -> the team sends an alert from the inbox page ({key, more: true} carries on a long send)
// Alerts also go out on their own, at most once each: when the Flavor 10 has a new No. 1 and when a new Flavor Cover
// goes up. That check ("tick") runs whenever someone opens the app, so there is nothing to schedule.
// Phones are only "poked" (no words travel with the poke); the phone then fetches the words from ?latest=1.
// The signing key is made here on first use and kept in the D1 database (binding DB), never in the code.
const H = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const out = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: H });
const HOSTS = /(^|\.)(push\.apple\.com|fcm\.googleapis\.com|notify\.windows\.com|push\.services\.mozilla\.com)$/;
const BATCH = 40; // Cloudflare's free plan allows 50 outside calls per request
const SITE = "https://flavorafricagroup.org";

const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const clean = (s, max) => String(s || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const nairobi = () => new Date(Date.now() + 108e5).toISOString();

async function setup(db) {
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS subs (endpoint TEXT PRIMARY KEY, phone TEXT, at TEXT NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS outbox (n INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, body TEXT NOT NULL, url TEXT NOT NULL, at TEXT NOT NULL, cursor TEXT NOT NULL DEFAULT '', done INTEGER NOT NULL DEFAULT 0, sent INTEGER NOT NULL DEFAULT 0)"),
    db.prepare("INSERT OR IGNORE INTO kv (k, v) VALUES ('lock', '0')"),
  ]);
}
const get = async (db, k) => { const r = await db.prepare("SELECT v FROM kv WHERE k = ?").bind(k).first(); return r ? r.v : null; };
const put = (db, k, v) => db.prepare("INSERT INTO kv (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").bind(k, String(v)).run();

async function keys(db) {
  let v = await get(db, "vapid");
  if (!v) {
    const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
    const made = JSON.stringify({ pub: b64u(await crypto.subtle.exportKey("raw", pair.publicKey)), jwk: await crypto.subtle.exportKey("jwk", pair.privateKey) });
    await db.prepare("INSERT OR IGNORE INTO kv (k, v) VALUES ('vapid', ?)").bind(made).run();
    v = await get(db, "vapid");
  }
  return JSON.parse(v);
}

async function sign(aud, k) {
  const enc = (o) => b64u(new TextEncoder().encode(JSON.stringify(o)));
  const head = enc({ typ: "JWT", alg: "ES256" }) + "." + enc({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: SITE });
  const key = await crypto.subtle.importKey("jwk", k.jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(head));
  return head + "." + b64u(sig);
}

function allowed(endpoint, env) {
  try {
    const u = new URL(endpoint);
    if (env.PUSH_TEST_HOST && u.host === env.PUSH_TEST_HOST) return true; // local testing only
    return u.protocol === "https:" && HOSTS.test(u.hostname);
  } catch (e) { return false; }
}

// send the oldest unfinished alert to the next batch of phones; returns true if there is more to do
async function drain(db, env) {
  const msg = await db.prepare("SELECT n, cursor FROM outbox WHERE done = 0 ORDER BY n LIMIT 1").first();
  if (!msg) return false;
  const rows = (await db.prepare("SELECT endpoint FROM subs WHERE endpoint > ? ORDER BY endpoint LIMIT ?").bind(msg.cursor, BATCH).all()).results || [];
  if (!rows.length) { await db.prepare("UPDATE outbox SET done = 1 WHERE n = ?").bind(msg.n).run(); return !!(await db.prepare("SELECT n FROM outbox WHERE done = 0 LIMIT 1").first()); }
  const k = await keys(db), tokens = {};
  let ok = 0; const gone = [];
  await Promise.all(rows.map(async (r) => {
    try {
      if (!allowed(r.endpoint, env)) { gone.push(r.endpoint); return; }
      const aud = new URL(r.endpoint).origin;
      tokens[aud] = tokens[aud] || sign(aud, k);
      const res = await fetch(r.endpoint, { method: "POST", headers: { Authorization: "vapid t=" + (await tokens[aud]) + ", k=" + k.pub, TTL: "86400", Urgency: "normal", "Content-Length": "0" } });
      if (res.status === 404 || res.status === 410) gone.push(r.endpoint); else if (res.ok) ok++;
    } catch (e) {}
  }));
  const more = rows.length === BATCH;
  const work = [db.prepare("UPDATE outbox SET cursor = ?, sent = sent + ?, done = ? WHERE n = ?").bind(rows[rows.length - 1].endpoint, ok, more ? 0 : 1, msg.n)];
  gone.forEach((e) => work.push(db.prepare("DELETE FROM subs WHERE endpoint = ?").bind(e)));
  await db.batch(work);
  return more || !!(await db.prepare("SELECT n FROM outbox WHERE done = 0 LIMIT 1").first());
}

const queue = (db, title, body, url) => db.prepare("INSERT INTO outbox (title, body, url, at) VALUES (?, ?, ?, ?)").bind(title, body, url, new Date().toISOString()).run();

// has the site got something new worth an alert? (new No. 1, new Flavor Cover). The first run only takes note.
async function news(db, request, env) {
  let f; try { f = await (await env.ASSETS.fetch(new URL("/app/feed.json", request.url))).json(); } catch (e) { return; }
  const now = nairobi().slice(0, 16);
  const top = f.f10 && f.f10.t ? f.f10.t + " — " + f.f10.a : "";
  const cover = (f.stories || []).filter((s) => s.t === "The Flavor Cover" && s.p <= now)[0];
  const [n1, cv] = [await get(db, "n1"), await get(db, "cover")];
  if (top && top !== n1) {
    await put(db, "n1", top);
    if (n1 !== null) await queue(db, "New No. 1 in Kenya", f.f10.t + " by " + f.f10.a + " tops the Flavor 10 today.", "/#flavor-10");
  }
  if (cover && cover.s !== cv) {
    await put(db, "cover", cover.s);
    if (cv !== null) await queue(db, "The new Flavor Cover is out", clean(cover.h + ". " + cover.d, 160), "/" + cover.s);
  }
}

// runs on app opens: carry on any unfinished send, otherwise look for news. One at a time.
export async function tick(request, env) {
  const db = env.DB; if (!db) return;
  try {
    await setup(db);
    const t = Date.now();
    const lock = await db.prepare("UPDATE kv SET v = ? WHERE k = 'lock' AND CAST(v AS INTEGER) < ?").bind(String(t), t - 30000).run();
    if (!lock.meta || !lock.meta.changes) return;
    if (!(await db.prepare("SELECT n FROM outbox WHERE done = 0 LIMIT 1").first())) await news(db, request, env);
    await drain(db, env);
    await put(db, "lock", "0");
  } catch (e) {}
}

export async function onRequest({ request, env }) {
  const db = env.DB;
  if (!db) return out({ ok: false, error: "not-ready" }, 503);
  try {
    await setup(db);
    const url = new URL(request.url);

    if (request.method === "GET") {
      if (url.searchParams.get("latest")) {
        const m = await db.prepare("SELECT n, title, body, url, at FROM outbox ORDER BY n DESC LIMIT 1").first();
        if (!m || Date.now() - Date.parse(m.at) > 3 * 864e5) return out({ ok: true, alert: null });
        return out({ ok: true, alert: { n: m.n, title: m.title, body: m.body, url: m.url } });
      }
      const key = url.searchParams.get("key");
      if (key !== null) {
        if (!env.ADMIN_KEY || key.length < 16 || key !== env.ADMIN_KEY) return out({ ok: false, error: "locked" }, 403);
        const c = await db.prepare("SELECT COUNT(*) AS n FROM subs").first();
        const sent = (await db.prepare("SELECT title, body, url, at, sent, done FROM outbox ORDER BY n DESC LIMIT 20").all()).results || [];
        return out({ ok: true, phones: c ? c.n : 0, sent });
      }
      return out({ ok: true, key: (await keys(db)).pub });
    }
    if (request.method !== "POST") return out({ ok: false, error: "method" }, 405);

    let b = {};
    try { b = await request.json(); } catch (e) {}

    if (b.key !== undefined) { // the team, from the inbox page
      if (!env.ADMIN_KEY || String(b.key).length < 16 || b.key !== env.ADMIN_KEY) return out({ ok: false, error: "locked" }, 403);
      if (!b.more) {
        const title = clean(b.title, 60), body = clean(b.body, 160);
        let to = clean(b.url, 200) || "/";
        if (to.indexOf(SITE) === 0) to = to.slice(SITE.length) || "/";
        if (title.length < 3 || body.length < 3) return out({ ok: false, error: "too-short" }, 400);
        if (to[0] !== "/" || to[1] === "/") return out({ ok: false, error: "bad-link" }, 400);
        await queue(db, title, body, to);
      }
      return out({ ok: true, more: await drain(db, env) });
    }

    const endpoint = String(b.endpoint || "");
    if (endpoint.length > 1000 || !allowed(endpoint, env)) return out({ ok: false, error: "bad-endpoint" }, 400);
    if (b.off) { await db.prepare("DELETE FROM subs WHERE endpoint = ?").bind(endpoint).run(); return out({ ok: true, on: false }); }
    const id = /^[a-z0-9]{16,40}$/.test(String(b.id || "")) ? String(b.id) : "";
    await db.prepare("INSERT INTO subs (endpoint, phone, at) VALUES (?, ?, ?) ON CONFLICT(endpoint) DO UPDATE SET at = excluded.at").bind(endpoint, id.slice(0, 8), new Date().toISOString()).run();
    return out({ ok: true, on: true });
  } catch (e) {
    return out({ ok: false, error: "server" }, 500);
  }
}
