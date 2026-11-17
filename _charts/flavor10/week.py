"""The Flavor 10 week (added 17 Nov 2026): a different 10 every day.

  Mon  Kenya            the real chart (daily.py), unchanged
  Tue  West Africa      Apple Music most played: Nigeria, Ghana, Cote d'Ivoire, Senegal
  Wed  South            Apple Music most played: South Africa, Zambia, Zimbabwe, Botswana
  Thu  East & Central   Apple Music most played: Tanzania, Uganda, Rwanda, DR Congo
  Fri  Fresh            every one of those charts plus Kenya, songs out in the last 7 days only
  Sat  Rewind           hand-picked, from picks.json
  Sun  Reset            hand-picked, from picks.json

FRESH-ONLY RULE (Tue-Thu): a song must be out no more than 30 days (widened to 45, then 60, only if
fewer than 10 songs qualify). Friday: 7 days (then 10, 14).
NO REPEATS: a song that was on any Tue-Sun list in the last 28 days can't come back.
At most 2 songs by the same lead artist per list (so one album drop can't fill the 10).
Ranking on chart days: a song gets 101 minus its position on each country chart it's on, summed.

Each day's list is written once, to days/YYYY-MM-DD.json, and never rewritten, so a list stays the
same all day and the no-repeat rule has a fixed history. Monday is the Kenya chart in data/ and is
not copied here. The country charts it read are kept in regions/YYYY-MM-DD.json.

Runs every morning in the same GitHub Actions job as the Kenya chart, before _site.py.
Run by hand:  python3 week.py              (today, Nairobi time)
              python3 week.py 2026-11-17
              python3 week.py 2026-11-17 --from regions/2026-11-17.json   (use saved charts, no fetching)
"""
import datetime, glob, json, os, re, sys, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from daily import display, is_music  # same title clean-up as the Kenya chart

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36"}
COUNTRY = {"ke": "Kenya", "ng": "Nigeria", "gh": "Ghana", "ci": "Côte d'Ivoire", "sn": "Senegal",
           "za": "South Africa", "zm": "Zambia", "zw": "Zimbabwe", "bw": "Botswana",
           "tz": "Tanzania", "ug": "Uganda", "rw": "Rwanda", "cd": "DR Congo"}
DAYS = {
    1: {"kind": "west", "name": "West Africa", "cc": ["ng", "gh", "ci", "sn"], "window": [30, 45, 60],
        "line": "The biggest new songs in Nigeria, Ghana, Côte d'Ivoire and Senegal, all out in the last month."},
    2: {"kind": "south", "name": "South", "cc": ["za", "zm", "zw", "bw"], "window": [30, 45, 60],
        "line": "The biggest new songs in South Africa, Zambia, Zimbabwe and Botswana, all out in the last month."},
    3: {"kind": "east", "name": "East & Central", "cc": ["tz", "ug", "rw", "cd"], "window": [30, 45, 60],
        "line": "The biggest new songs in Tanzania, Uganda, Rwanda and DR Congo, all out in the last month."},
    4: {"kind": "fresh", "name": "Fresh", "cc": ["ke", "ng", "gh", "ci", "sn", "za", "zm", "zw", "bw", "tz", "ug", "rw", "cd"],
        "window": [7, 10, 14], "line": "Out this week and already climbing charts across Africa."},
}
PICK_NAME = {"rewind": "Rewind", "reset": "Reset"}
NO_REPEAT_DAYS = 28
PER_ARTIST = 2
MAX_AGE = 3   # days an older copy of a country chart may stand in when Apple doesn't answer
# Global acts filter: any lead artist on Apple Music's US or France top 100 the same day is treated as a
# global (non-African) act and left out, plus the hand list below. Kept in regions/ like the rest.
GLOBAL_CC = ["us", "fr"]

# Not African releases, even when they chart here (checked by hand; add names as they turn up).
# Matched against the lead artist only, so an African song featuring one of them still counts.
GLOBAL_ARTISTS = {
    "future", "drake", "travis scott", "taylor swift", "the weeknd", "sza", "kendrick lamar", "chris brown",
    "ninho", "sdm", "sch", "jul", "tiakola", "gims", "damso", "werenoi", "rihanna", "beyonce", "beyoncé",
    "justin bieber", "ed sheeran", "bruno mars", "lady gaga", "billie eilish", "sabrina carpenter", "doja cat",
    "21 savage", "lil baby", "playboi carti", "kanye west", "ye", "j. cole", "post malone", "morgan wallen",
    "bad bunny", "offset", "quavo", "gunna", "lil durk", "young thug", "nicki minaj", "cardi b", "rosé", "olivia rodrigo", "ariana grande", "dua lipa", "coldplay", "metro boomin", "gunna",
    "yanlml", "leto", "jeune lion", "2 mètres", "l2b", "la fève", "la feve", "gazo", "hamza", "niska", "pnl", "zola", "tayc",
}


def nairobi_today():
    return (datetime.datetime.utcnow() + datetime.timedelta(hours=3)).date()


def lead(artist):
    return re.split(r",\s*|\s+&\s+|\s+ft\.?\s+|\s+feat\.?\s+|\s+x\s+", artist.strip(), flags=re.I)[0].strip().lower()


def key(title, artist):
    t = title.lower().replace("’", "'")
    t = re.sub(r"\s*[\(\[](feat|ft|with)\.?[^\)\]]*[\)\]]", "", t)
    t = re.sub(r"[^a-z0-9']+", " ", t).strip()
    return t + "|" + lead(artist)


# ---------------- country charts ----------------
def fetch_cc(cc):
    u = "https://rss.applemarketingtools.com/api/v2/%s/music/most-played/100/songs.json" % cc
    for n in range(4):
        try:
            d = json.loads(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=40).read())
            rows = [{"id": r.get("id", ""), "t": r["name"], "a": r["artistName"], "out": r.get("releaseDate") or ""}
                    for r in d["feed"]["results"]]
            if len(rows) >= 20:
                return rows
        except Exception as e:
            print("  %s try %d: %s" % (cc, n + 1, str(e)[:80]))
        time.sleep(12 * (n + 1))
    return None


def last_good(cc, date):
    for f in sorted(glob.glob(f"{HERE}/regions/*.json"), reverse=True):
        day = os.path.basename(f)[:-5]
        if day > date:
            continue
        got = json.load(open(f)).get(cc)
        if got and got.get("songs"):
            return got
    return None


def charts(date, ccs, saved=None):
    os.makedirs(f"{HERE}/regions", exist_ok=True)
    path = f"{HERE}/regions/{date}.json"
    have = json.load(open(saved or path)) if (saved or os.path.exists(path)) else {}
    out, report = {}, []
    for cc in ccs:
        if have.get(cc, {}).get("songs") and have[cc].get("fetched") == date:
            out[cc] = have[cc]; report.append(f"{cc} saved"); continue
        rows = None if saved else fetch_cc(cc)
        if rows:
            out[cc] = {"fetched": date, "songs": rows}; report.append(f"{cc} OK {len(rows)}")
            continue
        old = last_good(cc, date)
        if old and (datetime.date.fromisoformat(date) - datetime.date.fromisoformat(old["fetched"])).days <= MAX_AGE:
            out[cc] = old; report.append(f"{cc} KEPT copy from {old['fetched']}")
        else:
            report.append(f"{cc} DROPPED")
    keep = dict(have); keep.update(out)
    json.dump(keep, open(path, "w"), ensure_ascii=False, separators=(",", ":"))
    return out, report


def short(artist):
    """Long guest lists ("ft. A, B, C, D, E & F") are cut to the first two guests plus "& others"."""
    m = re.search(r"\s+ft\.\s+(.+)$", artist)
    if not m:
        return artist
    guests = re.split(r",\s*|\s+&\s+", m.group(1))
    if len(guests) <= 3:
        return artist
    return artist[:m.start()] + " ft. " + ", ".join(guests[:2]) + " & others"


# ---------------- the lists ----------------
def recent(date):
    """Song keys used on any Tue-Sun list in the NO_REPEAT_DAYS days before this date."""
    d0 = datetime.date.fromisoformat(date)
    used = set()
    for f in glob.glob(f"{HERE}/days/*.json"):
        day = os.path.basename(f)[:-5]
        if day >= date or (d0 - datetime.date.fromisoformat(day)).days > NO_REPEAT_DAYS:
            continue
        for s in json.load(open(f)).get("songs", []):
            used.add(key(s["title"], s["artist"]))
    return used


def rank(date, cfg, got, used, glob_leads=frozenset()):
    d0 = datetime.date.fromisoformat(date)
    for win in cfg["window"]:
        tally = {}
        for cc in cfg["cc"]:
            if cc not in got:
                continue
            for pos, s in enumerate(got[cc]["songs"], 1):
                if not s["out"] or not is_music(s["t"], s["a"]):
                    continue
                age = (d0 - datetime.date.fromisoformat(s["out"][:10])).days
                if age < 0 or age > win:
                    continue
                if lead(s["a"]) in GLOBAL_ARTISTS or lead(s["a"]) in glob_leads:
                    continue
                k = key(s["t"], s["a"])
                if k in used:
                    continue
                e = tally.setdefault(k, {"pts": 0, "cc": [], "best": 999, "s": s})
                if cc in e["cc"]:
                    continue
                e["pts"] += 101 - pos
                e["cc"].append(cc)
                e["best"] = min(e["best"], pos)
                if s["id"] and not e["s"]["id"]:
                    e["s"] = s
        order = sorted(tally.values(), key=lambda e: (-e["pts"], -len(e["cc"]), e["best"]))
        songs, per = [], {}
        for e in order:
            la = lead(e["s"]["a"])
            if per.get(la, 0) >= PER_ARTIST:
                continue
            per[la] = per.get(la, 0) + 1
            t, a = display(e["s"]["t"], e["s"]["a"])
            a = short(a)
            songs.append({"title": t, "artist": a, "apple": e["s"]["id"], "out": e["s"]["out"][:10],
                          "points": e["pts"], "where": e["cc"]})
            if len(songs) == 10:
                break
        if len(songs) == 10:
            return songs, win
    return songs, win


def build(date, saved=None):
    os.makedirs(f"{HERE}/days", exist_ok=True)
    path = f"{HERE}/days/{date}.json"
    if os.path.exists(path):
        print(f"{date}: already built, left as it is")
        return
    wd = datetime.date.fromisoformat(date).weekday()
    label = datetime.date.fromisoformat(date).strftime("%-d %b %Y").upper()
    if wd == 0:
        print(f"{date}: Monday is the Kenya chart (data/), nothing to build here")
        return
    if wd in DAYS:
        cfg = DAYS[wd]
        got, report = charts(date, cfg["cc"] + GLOBAL_CC, saved)
        print("\n".join(report))
        glob_leads = {lead(x["a"]) for c in GLOBAL_CC if c in got for x in got.pop(c)["songs"]}
        if len(got) < max(1, len(cfg["cc"]) // 2):
            print(f"{date}: too few country charts came through, no list today")
            return
        songs, win = rank(date, cfg, got, recent(date), glob_leads)
        if len(songs) < 5:
            print(f"{date}: only {len(songs)} songs qualified, no list today")
            return
        ed = {"date": date, "label": label, "kind": cfg["kind"], "name": cfg["name"], "line": cfg["line"],
              "window": win, "sources": "Apple Music most played: " + ", ".join(COUNTRY[c] for c in cfg["cc"] if c in got),
              "songs": songs}
    else:
        picks = json.load(open(f"{HERE}/picks.json")).get(date)
        if not picks:
            print(f"{date}: no hand-picked list in picks.json")
            return
        used = recent(date)
        clash = [s[0] for s in picks["songs"] if key(s[0], s[1]) in used]
        if clash:
            print(f"{date}: WARNING, on a list in the last {NO_REPEAT_DAYS} days: {', '.join(clash)}")
        ed = {"date": date, "label": label, "kind": picks["kind"], "name": PICK_NAME.get(picks["kind"], picks["kind"].title()),
              "theme": picks.get("theme", ""), "line": picks.get("line", ""), "sources": "Picked by Flavor Africa. Credits checked against " + picks.get("sources", "2+ sources"),
              "songs": [dict({"title": s[0], "artist": s[1]}, **({"year": s[2]} if len(s) > 2 else {})) for s in picks["songs"]]}
    json.dump(ed, open(path, "w"), indent=1, ensure_ascii=False)
    print(f"{date}: {ed['name']} · {len(ed['songs'])} songs")
    for i, s in enumerate(ed["songs"], 1):
        print(f"  {i:2d}. {s['title']} — {s['artist']}  {s.get('out', s.get('year', ''))}")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    saved = sys.argv[sys.argv.index("--from") + 1] if "--from" in sys.argv else None
    if saved:
        args = [a for a in args if a != saved]
        saved = saved if os.path.isabs(saved) else os.path.join(HERE, saved) if not os.path.exists(saved) else saved
    build(args[0] if args else nairobi_today().isoformat(), saved)
