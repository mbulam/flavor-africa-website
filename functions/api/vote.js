// Fans' pick for the Flavor 10 (added 10 Nov 2026), used by the home-screen app.
//   GET  /api/vote?id=<phone code>   -> this week's tally, and what this phone picked today
//   POST /api/vote {song, id}        -> one pick per phone per day (picking again changes it)
// A week runs Monday to Sunday, Nairobi time. Votes live in the Cloudflare D1 database bound to
// this Pages project as DB. The fans' pick is shown on its own and never changes the Flavor 10 ranking.
import { tick } from "./push.js";
const H = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const out = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: H });

function nairobi() {
  const d = new Date(Date.now() + 108e5);
  const day = d.toISOString().slice(0, 10);
  const back = (d.getUTCDay() + 6) % 7;                       // days since Monday
  const week = new Date(d.getTime() - back * 864e5).toISOString().slice(0, 10);
  return { day, week };
}

async function chart(request, env) {
  try {
    const r = await env.ASSETS.fetch(new URL("/app/feed.json", request.url));
    const f = await r.json();
    return f.f10 && f.f10.songs ? f.f10.songs.map((s) => s.t + " — " + s.a) : [];
  } catch (e) { return []; }
}

async function hash(text) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(d)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function state(db, week, day, phone) {
  const rows = (await db.prepare("SELECT song, COUNT(*) AS n FROM votes WHERE week = ? GROUP BY song").bind(week).all()).results || [];
  const tally = {}; let total = 0;
  rows.forEach((r) => { tally[r.song] = r.n; total += r.n; });
  let mine = null;
  if (phone) { const m = await db.prepare("SELECT song FROM votes WHERE day = ? AND phone = ?").bind(day, phone).first(); mine = m ? m.song : null; }
  return { ok: true, week, day, total, tally, mine };
}

export async function onRequest({ request, env, waitUntil }) {
  const db = env.DB;
  if (!db) return out({ ok: false, error: "not-ready" }, 503);
  try {
    await db.prepare("CREATE TABLE IF NOT EXISTS votes (day TEXT NOT NULL, phone TEXT NOT NULL, week TEXT NOT NULL, song TEXT NOT NULL, ip TEXT, PRIMARY KEY (day, phone))").run();
    const { day, week } = nairobi();
    const url = new URL(request.url);

    if (request.method === "GET") {
      waitUntil(tick(request, env)); // every app open also checks whether an alert is due (see push.js)
      const id = url.searchParams.get("id") || "";
      return out(await state(db, week, day, /^[a-z0-9]{16,40}$/.test(id) ? await hash(id) : null));
    }
    if (request.method !== "POST") return out({ ok: false, error: "method" }, 405);

    let body = {};
    try { body = await request.json(); } catch (e) {}
    const song = String(body.song || "").trim();
    const id = String(body.id || "");
    if (!/^[a-z0-9]{16,40}$/.test(id)) return out({ ok: false, error: "no-id" }, 400);
    if (!(await chart(request, env)).includes(song)) return out({ ok: false, error: "unknown-song" }, 400);

    const phone = await hash(id);
    const ip = await hash((request.headers.get("cf-connecting-ip") || "") + "|" + day);
    // many phones share one mobile connection, so the cap per connection is generous
    const used = await db.prepare("SELECT COUNT(*) AS n FROM votes WHERE day = ? AND ip = ? AND phone != ?").bind(day, ip, phone).first();
    if (used && used.n >= 60) return out({ ok: false, error: "busy" }, 429);

    await db.prepare("INSERT INTO votes (day, phone, week, song, ip) VALUES (?, ?, ?, ?, ?) ON CONFLICT(day, phone) DO UPDATE SET song = excluded.song")
      .bind(day, phone, week, song, ip).run();
    return out(await state(db, week, day, phone));
  } catch (e) {
    return out({ ok: false, error: "server" }, 500);
  }
}
