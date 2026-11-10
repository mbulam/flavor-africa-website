// Fan Seat (added 10 Nov 2026): fans send a question for the artist of the next Flavor Artist Live show.
//   POST /api/fanseat {name, q, id}   -> saves a question while Fan Seat is open (FAN_SEAT in _site.py)
//   GET  /api/fanseat?key=<ADMIN_KEY> -> every question plus the weekly fans' pick totals, for the team's inbox page
// Questions live in the Cloudflare D1 database bound to this Pages project as DB.
// ADMIN_KEY is a secret set on the Pages project; without it the inbox stays closed.
const H = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const out = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: H });

async function hash(text) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(d)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}
const clean = (s, max) => String(s || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

export async function onRequest({ request, env }) {
  const db = env.DB;
  if (!db) return out({ ok: false, error: "not-ready" }, 503);
  try {
    await db.prepare("CREATE TABLE IF NOT EXISTS questions (n INTEGER PRIMARY KEY AUTOINCREMENT, show TEXT NOT NULL, name TEXT, q TEXT NOT NULL, phone TEXT, ip TEXT, at TEXT NOT NULL)").run();
    const url = new URL(request.url);

    if (request.method === "GET") {
      const key = url.searchParams.get("key") || "";
      if (!env.ADMIN_KEY || key.length < 16 || key !== env.ADMIN_KEY) return out({ ok: false, error: "locked" }, 403);
      const qs = (await db.prepare("SELECT n, show, name, q, at FROM questions ORDER BY n DESC LIMIT 1000").all()).results || [];
      let votes = [];
      try { votes = (await db.prepare("SELECT week, song, COUNT(*) AS n FROM votes GROUP BY week, song ORDER BY week DESC, n DESC LIMIT 200").all()).results || []; } catch (e) {}
      return out({ ok: true, questions: qs, votes });
    }
    if (request.method !== "POST") return out({ ok: false, error: "method" }, 405);

    let fs = null;
    try { fs = (await (await env.ASSETS.fetch(new URL("/app/feed.json", request.url))).json()).fanseat; } catch (e) {}
    if (!fs || !fs.show) return out({ ok: false, error: "closed" }, 403);

    let body = {};
    try { body = await request.json(); } catch (e) {}
    const id = String(body.id || "");
    if (!/^[a-z0-9]{16,40}$/.test(id)) return out({ ok: false, error: "no-id" }, 400);
    const q = clean(body.q, 280), name = clean(body.name, 40);
    if (q.length < 5) return out({ ok: false, error: "too-short" }, 400);

    const phone = await hash(id);
    const day = new Date(Date.now() + 108e5).toISOString().slice(0, 10);
    const ip = await hash((request.headers.get("cf-connecting-ip") || "") + "|" + day);
    const mine = await db.prepare("SELECT COUNT(*) AS n FROM questions WHERE show = ? AND phone = ?").bind(fs.show, phone).first();
    if (mine && mine.n >= 3) return out({ ok: false, error: "limit" }, 429);
    const conn = await db.prepare("SELECT COUNT(*) AS n FROM questions WHERE ip = ?").bind(ip).first();
    if (conn && conn.n >= 40) return out({ ok: false, error: "busy" }, 429);

    await db.prepare("INSERT INTO questions (show, name, q, phone, ip, at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(fs.show, name, q, phone, ip, new Date().toISOString()).run();
    return out({ ok: true, left: 2 - (mine ? mine.n : 0) });
  } catch (e) {
    return out({ ok: false, error: "server" }, 500);
  }
}
