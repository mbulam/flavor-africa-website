"""The Flavor 10 · Kenya — DAILY ranking (from 28 Oct 2026).

Each day, save the source charts as raw/YYYY-MM-DD.json:
  {"read": "28 Oct 2026, 13:30 EAT",
   "sources": {"P": {"name": "...", "date": "...", "top": [["Title", "Artist"], ...]}, ...}}
Sources and how often they refresh:
  P  Apple Music Top 100: Kenya  (daily)   via soundcharts.com/es/charts/apple-music/kenya
  S  Shazam Top 200: Kenya       (daily)   via shazam.com/charts/top-200/kenya
  Y  YouTube Top Songs: Kenya    (weekly)  via soundcharts.com/en/charts/youtube/kenya
  R  Kenya Airplay               (weekly)  via soundcharts.com/en/charts/airplay/kenya
  F  Spotify Daily: Kenya         (daily)   via kworb.net (added 29 Oct 2026, used when available)
From 29 Oct 2026 fetch.py collects these automatically every morning (GitHub Actions).
Weekly sources are carried forward unchanged until their next edition comes out.

Scoring: each source's top 25 counts. Position 1 = 25 points ... position 25 = 1 point.
All four sources weigh the same. A song's score is the sum across sources; ties are
broken by the number of sources it appears on, then by its best single position.
The top 10 is written to data/YYYY-MM-DD.json (same format the site and flavor10.py read).

Run:  python3 daily.py 2026-10-28
"""
import json, os, re, sys, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
TOPN = 25

# Same song, different spellings across platforms -> one canonical (title, artist)
ALIASES = {
    "shing shing": "shing",
    "kitemeo kitemeo": "kitemeo",
    "hongo ya karao - vol. 2": "hongo ya karao vol. 2",
}
CANON = {  # how the song is printed on the chart: (title, artist)
    "i'll be okay": ("I'll Be Okay", "Bien"),
    "shing": ("Shing", "Kapitani ft. Toxic Lyrikali"),
    "kitemeo": ("Kitemeo", "Kapitani"),
    "heaven baby": ("Heaven Baby", "Ayra Starr ft. Zayn"),
    "finale": ("Finale", "Bien ft. Alikiba"),
    "chai ya saa kumi": ("Chai ya Saa Kumi", "Ywaya Tajiri"),
    "hongo ya karao vol. 2": ("Hongo ya Karao Vol. 2", "Toxic Lyrikali ft. Mauru Gwash & Kapitani"),
    "rapudo": ("Rapudo", "Prince Indah"),
    "ayayaah": ("AYAYAAH", "ELEMENT EleéeH, Joshua Baraka & Bien"),
    "worship": ("WORSHIP", "Asake & DJ Snake"),
    "oh no": ("Oh No", "Rema"),
    "ukining'inia": ("Ukining'inia", "Collo Blue"),
}
APPLE_IDS = {  # Apple Music song IDs for the site's 30-second previews (carried from earlier editions)
    "i'll be okay": "6822410197", "kitemeo": "6793757785", "heaven baby": "6796539210",
    "shing": "6822137422", "chai ya saa kumi": "6796900642", "rapudo": "1850928384",
    "hongo ya karao vol. 2": "6804729978",
}


def norm(title):
    t = title.lower().strip()
    t = re.sub(r"\s*[\(\[](feat|ft|with)\.?[^\)\]]*[\)\]]", "", t)   # drop "(feat. X)"
    t = re.sub(r"\s*-\s*(remix|deluxe).*$", lambda m: m.group(0) if "remix" in m.group(0) else "", t)
    t = re.sub(r"\s*\((deluxe)\)", "", t)
    t = t.replace("’", "'").strip()
    return ALIASES.get(t, t)


def display(title, artist):
    """Tidy a platform title for print: "Ginger (feat. Burna Boy)" -> "Ginger", artist keeps the feature."""
    m = re.search(r"\s*[\(\[](?:feat|ft|with)\.?\s+([^\)\]]+)[\)\]]", title, flags=re.I)
    t = title
    if m:
        t = (title[:m.start()] + title[m.end():]).strip()
        guest = m.group(1).strip()
        if guest.split(",")[0].split("&")[0].strip().lower() not in artist.lower():
            artist = "%s ft. %s" % (artist, guest)
    return t.replace("’", "'"), artist


# Not songs (recitations, sermons, sound effects): left out of the ranking.
NOT_MUSIC = ("quran", "qur'an", "durood", "surah", "sermon", "white noise", "rain sounds")


def is_music(title, artist):
    t = (title + " " + artist).lower()
    return not any(w in t for w in NOT_MUSIC)


def rank(raw):
    tally = {}
    for code, src in raw["sources"].items():
        top = [x for x in src["top"] if is_music(*x)]
        for pos, (title, artist) in enumerate(top[:TOPN], 1):
            k = norm(title)
            e = tally.setdefault(k, {"points": 0, "charts": "", "best": 99, "seen": (title, artist)})
            if code in e["charts"]:
                continue  # one entry per source
            e["points"] += TOPN + 1 - pos
            e["charts"] += code
            e["best"] = min(e["best"], pos)
    order = sorted(tally.items(), key=lambda kv: (-kv[1]["points"], -len(kv[1]["charts"]), kv[1]["best"]))
    songs = []
    for k, e in order[:10]:
        title, artist = CANON.get(k) or display(*e["seen"])
        s = {"title": title, "artist": artist, "points": e["points"], "charts": e["charts"]}
        if k in APPLE_IDS:
            s["apple"] = APPLE_IDS[k]
        songs.append(s)
    return songs, order


def build(date):
    raw = json.load(open(f"{HERE}/raw/{date}.json"))
    songs, order = rank(raw)
    d = datetime.date.fromisoformat(date)
    ed = {"date": date, "label": d.strftime("%-d %b %Y").upper(),
          "sources": {c: "%s (%s)" % (s["name"], s["date"]) for c, s in raw["sources"].items()},
          "songs": songs}
    json.dump(ed, open(f"{HERE}/data/{date}.json", "w"), indent=1, ensure_ascii=False)
    for i, (k, e) in enumerate(order[:14], 1):
        print(f"{i:2d}  {e['points']:3d}  {e['charts']:4s}  {k}")


if __name__ == "__main__":
    build(sys.argv[1] if len(sys.argv) > 1 else (datetime.datetime.utcnow() + datetime.timedelta(hours=3)).date().isoformat())
