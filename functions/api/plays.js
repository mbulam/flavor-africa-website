// Game plays counter (added 20 Nov 2026): how many people play each Flavor game.
//   POST /api/plays {id, game, ev, score, app}  -> a phone says it started ("start") or finished ("done") a game today
//   GET  /api/plays  (header x-admin-key: <ADMIN_KEY>) -> totals for the team's inbox page (app/inbox.html#<ADMIN_KEY>)
// One row per phone, per game, per Nairobi day, so refreshing or replaying never counts the same person twice in a day.
// "runs" counts finished games (The Vice Run can be replayed). The phone code is the same random code the fans' pick and
// the Ballot use (no name, no account); it is stored hashed. Phones that said "No thanks" to cookies aren't counted.
// Lives in the D1 database bound as DB (the same one as the Flavor 10 fans' pick), table "plays".
const H = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const out = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: H });
const GAMES = ["trivia", "connections", "mini", "vicerun", "heist"];

async function hash(text) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(d)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function isAdmin(key, env) {
  const want = env.ADMIN_KEY || "";
  key = String(key || "");
  if (want.length < 16 || key.length !== want.length) return false;
  let d = 0;
  for (let i = 0; i < want.length; i++) d |= want.charCodeAt(i) ^ key.charCodeAt(i);
  return d === 0;
}
const nairobi = (ms = 0) => new Date(Date.now() + 108e5 + ms).toISOString().slice(0, 10);

export async function onRequest({ request, env }) {
  const db = env.DB;
  if (!db) return out({ ok: false, error: "not-ready" }, 503);
  try {
    await db.prepare("CREATE TABLE IF NOT EXISTS plays (phone TEXT NOT NULL, game TEXT NOT NULL, day TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0, runs INTEGER NOT NULL DEFAULT 0, score REAL, app INTEGER NOT NULL DEFAULT 0, first TEXT NOT NULL, PRIMARY KEY (phone, game, day))").run();

    if (request.method === "GET") {
      if (!isAdmin(request.headers.get("x-admin-key"), env)) return out({ ok: false, error: "locked" }, 403);
      const today = nairobi(), week = nairobi(-6 * 864e5), from = nairobi(-13 * 864e5);
      const games = (await db.prepare(
        "SELECT game, COUNT(DISTINCT phone) AS people, COUNT(DISTINCT CASE WHEN done = 1 THEN phone END) AS finished, SUM(runs) AS runs," +
        " COUNT(DISTINCT CASE WHEN day = ?1 THEN phone END) AS today, COUNT(DISTINCT CASE WHEN day = ?1 AND done = 1 THEN phone END) AS today_done," +
        " COUNT(DISTINCT CASE WHEN day >= ?2 THEN phone END) AS week, ROUND(AVG(CASE WHEN done = 1 THEN score END), 2) AS avg," +
        " COUNT(DISTINCT CASE WHEN app = 1 THEN phone END) AS in_app FROM plays GROUP BY game").bind(today, week).all()).results || [];
      const days = (await db.prepare("SELECT day, game, COUNT(DISTINCT phone) AS n FROM plays WHERE day >= ? GROUP BY day, game ORDER BY day DESC").bind(from).all()).results || [];
      const all = await db.prepare("SELECT COUNT(DISTINCT phone) AS people, COUNT(DISTINCT CASE WHEN day = ? THEN phone END) AS today FROM plays").bind(today).first();
      let ballots = null;
      try { ballots = (await db.prepare("SELECT COUNT(*) AS n FROM ballots").first()).n; } catch (e) {}
      const since = await db.prepare("SELECT MIN(day) AS d FROM plays").first();
      return out({ ok: true, today, since: since && since.d, all: all || { people: 0, today: 0 }, games, days, ballots });
    }
    if (request.method !== "POST") return out({ ok: false, error: "method" }, 405);

    let b = {};
    try { b = await request.json(); } catch (e) {}
    const id = String(b.id || ""), game = String(b.game || ""), ev = String(b.ev || "");
    if (!/^[a-z0-9]{16,40}$/.test(id) || !GAMES.includes(game) || (ev !== "start" && ev !== "done")) return out({ ok: false, error: "bad" }, 400);
    let score = Number(b.score);
    score = ev === "done" && isFinite(score) && score >= 0 && score < 1e7 ? score : null;
    const phone = await hash(id), day = nairobi(), app = b.app ? 1 : 0, at = new Date().toISOString();
    if (ev === "start") {
      await db.prepare("INSERT INTO plays (phone, game, day, app, first) VALUES (?, ?, ?, ?, ?) ON CONFLICT (phone, game, day) DO NOTHING")
        .bind(phone, game, day, app, at).run();
    } else {
      await db.prepare("INSERT INTO plays (phone, game, day, done, runs, score, app, first) VALUES (?, ?, ?, 1, 1, ?, ?, ?)" +
        " ON CONFLICT (phone, game, day) DO UPDATE SET done = 1, runs = MIN(runs + 1, 50), score = MAX(COALESCE(score, 0), COALESCE(excluded.score, 0))")
        .bind(phone, game, day, score, app, at).run();
    }
    return out({ ok: true });
  } catch (e) {
    return out({ ok: false, error: "server" }, 500);
  }
}
