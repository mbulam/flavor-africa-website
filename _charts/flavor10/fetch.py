"""The Flavor 10 · Kenya — automatic daily fetch.

Runs every morning on GitHub Actions (.github/workflows/flavor10-daily.yml), then
daily.py ranks the songs and _site.py rebuilds the homepage. Nobody has to touch it.

For each source it tries a few known public endpoints. Whatever it gets is saved to
raw/YYYY-MM-DD.json in the format daily.py reads. If a source can't be reached today,
its last good copy is carried forward for up to MAX_AGE days, then dropped, so a
dead source never freezes the chart.

A source report is written to status.txt after every run (what worked, what didn't).

Run by hand:  python3 fetch.py            (today, Nairobi time)
              python3 fetch.py 2026-10-30
"""
import csv, datetime, glob, io, json, os, re, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
MAX_AGE = {"P": 3, "S": 3, "F": 10, "Y": 10, "R": 10}   # days a carried-forward copy may be used
NAMES = {
    "P": "Apple Music Top 100: Kenya",
    "S": "Shazam Top 200: Kenya",
    "F": "Spotify Weekly: Kenya",
    "Y": "YouTube Top Songs: Kenya",
    "R": "Kenya Airplay",
}
TOP = 50


def get(url, data=None, headers=None):
    h = {"User-Agent": UA, "Accept": "*/*", "Accept-Language": "en"}
    h.update(headers or {})
    req = urllib.request.Request(url, data=data, headers=h)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "replace")


def clean(rows):
    out = []
    for t, a in rows:
        t, a = (t or "").strip(), (a or "").strip()
        if t and a and (t, a) not in out:
            out.append((t, a))
    return [list(x) for x in out[:TOP]]


PAIR_PATTERNS = [
    r'"heading"\s*:\s*\{\s*"title"\s*:\s*"((?:[^"\\]|\\.)+)"\s*,\s*"subtitle"\s*:\s*"((?:[^"\\]|\\.)+)"',
    r'"title"\s*:\s*"((?:[^"\\]|\\.)+)"\s*,\s*"subtitle"\s*:\s*"((?:[^"\\]|\\.)+)"',
    r'"name"\s*:\s*"((?:[^"\\]|\\.)+)"\s*,\s*"artistName"\s*:\s*"((?:[^"\\]|\\.)+)"',
    r'"songName"\s*:\s*"((?:[^"\\]|\\.)+)"[^{}]{0,400}?"artistName"\s*:\s*"((?:[^"\\]|\\.)+)"',
    r'"title"\s*:\s*"((?:[^"\\]|\\.)+)"[^{}]{0,300}?"creditName"\s*:\s*"((?:[^"\\]|\\.)+)"',
]


def pairs(text, code):
    """Pull (title, artist) pairs out of a page's embedded JSON (pages may escape their quotes)."""
    for t in (text, text.replace('\\"', '"')):
        for pat in PAIR_PATTERNS:
            got = re.findall(pat, t)
            if len(got) >= 20:
                dec = lambda x: json.loads('"%s"' % x) if "\\" in x else x
                return [(dec(a), dec(b)) for a, b in got]
    os.makedirs(f"{HERE}/debug", exist_ok=True)
    open(f"{HERE}/debug/{code}.txt", "w").write(text[:200000])
    raise RuntimeError("no song list found in page (saved to debug/%s.txt)" % code)


# ---------------- Apple Music (daily) ----------------
def apple():
    try:
        d = json.loads(get("https://rss.applemarketingtools.com/api/v2/ke/music/most-played/100/songs.json"))
        rows = [(x["name"], x["artistName"]) for x in d["feed"]["results"]]
        if len(rows) >= 20:
            return clean(rows), "rss.applemarketingtools.com"
    except Exception as e:
        print("  apple v2:", e)
    d = json.loads(get("https://itunes.apple.com/ke/rss/topsongs/limit=100/json"))
    rows = [(x["im:name"]["label"], x["im:artist"]["label"]) for x in d["feed"]["entry"]]
    return clean(rows), "itunes.apple.com rss"


# ---------------- Shazam (daily) ----------------
def shazam():
    try:
        txt = get("https://www.shazam.com/services/charts/csv/top-200/kenya")
        rows, hdr = [], None
        for r in csv.reader(io.StringIO(txt)):
            low = [c.strip().lower() for c in r]
            if hdr is None:
                if "artist" in low and "title" in low:
                    hdr = (low.index("title"), low.index("artist"))
                continue
            if len(r) > max(hdr):
                rows.append((r[hdr[0]], r[hdr[1]]))
        if len(rows) >= 20:
            return clean(rows), "shazam csv"
    except Exception as e:
        print("  shazam csv:", e)
    rows = pairs(get("https://www.shazam.com/charts/top-200/kenya"), "S")
    return clean(rows), "shazam.com chart page"


# ---------------- Spotify via kworb (weekly for Kenya) ----------------
def spotify():
    html = get("https://kworb.net/spotify/country/ke_weekly.html")
    rows = []
    for cell in re.findall(r'<td class="text mp"><div>(.*?)</div></td>', html, flags=re.S):
        txt = re.sub(r"<[^>]+>", "", cell).replace("&amp;", "&").replace("&#39;", "'").strip()
        if " - " in txt:
            a, t = txt.split(" - ", 1)
            rows.append((t, a))
    if len(rows) < 20:
        raise RuntimeError("kworb spotify: no rows")
    return clean(rows), "kworb.net (Spotify)"


# ---------------- YouTube (weekly) ----------------
def youtube():
    body = {"context": {"client": {"clientName": "WEB_MUSIC_ANALYTICS", "clientVersion": "2.0", "hl": "en", "gl": "KE"}},
            "browseId": "FEmusic_analytics_charts_home",
            "query": "perspective=CHART_DETAILS&chart_params_country_code=ke&chart_params_chart_type=TRACKS&chart_params_period_type=WEEKLY"}
    txt = get("https://charts.youtube.com/youtubei/v1/browse?alt=json", data=json.dumps(body).encode(),
              headers={"Content-Type": "application/json", "Origin": "https://charts.youtube.com", "Referer": "https://charts.youtube.com/"})
    d = json.loads(txt)
    views = []

    def walk(o):
        if isinstance(o, dict):
            if "trackViews" in o and isinstance(o["trackViews"], list):
                views.append(o["trackViews"])
            for v in o.values():
                walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)
    walk(d)
    if not views:
        raise RuntimeError("youtube: no trackViews")
    rows = [(v.get("name"), ", ".join(a.get("name", "") for a in v.get("artists", []))) for v in views[0]]
    return clean(rows), "charts.youtube.com"


# ---------------- Kenya Airplay via Soundcharts (weekly) ----------------
def airplay():
    rows = pairs(get("https://soundcharts.com/en/charts/airplay/kenya"), "R")
    return clean(rows), "soundcharts.com"


FETCH = {"P": apple, "S": shazam, "F": spotify, "Y": youtube, "R": airplay}
WEEKLY = {"F", "Y", "R"}


def last_good(code, before):
    for f in sorted(glob.glob(f"{HERE}/raw/*.json"), reverse=True):
        day = os.path.basename(f)[:-5]
        if day >= before:
            continue
        src = json.load(open(f)).get("sources", {}).get(code)
        if src and src.get("top"):
            got = src.get("fetched", day)
            return src, got
    return None, None


def main(date):
    today = datetime.date.fromisoformat(date)
    stamp = datetime.datetime.utcnow() + datetime.timedelta(hours=3)
    out, report = {}, []
    for code in ["P", "S", "F", "Y", "R"]:
        fn = FETCH.get(code)
        if fn:
            try:
                top, via = fn()
                label = ("week of " if code in WEEKLY else "") + today.strftime("%-d %b %Y")
                out[code] = {"name": NAMES[code], "date": label, "fetched": date, "top": top}
                report.append(f"{code} OK   {len(top):3d} songs  via {via}")
                continue
            except Exception as e:
                report.append(f"{code} FAIL {type(e).__name__}: {str(e)[:120]}")
        src, got = last_good(code, date)
        if src and (today - datetime.date.fromisoformat(got)).days <= MAX_AGE[code]:
            out[code] = src
            report.append(f"{code} KEPT copy from {got}")
        else:
            report.append(f"{code} DROPPED (no copy newer than {MAX_AGE[code]} days)")
    fresh = [c for c in out if out[c].get("fetched") == date]
    report.insert(0, f"Flavor 10 fetch for {date} · run {stamp:%d %b %Y %H:%M} EAT · fresh: {''.join(fresh) or 'none'}")
    status = "\n".join(report) + "\n"
    open(f"{HERE}/status.txt", "w").write(status)
    print(status)
    if len(fresh) < 2:
        print("Fewer than two sources refreshed today, so the chart is left as it was.")
        return False
    raw = {"read": f"{stamp:%-d %b %Y, %H:%M} EAT", "sources": out}
    json.dump(raw, open(f"{HERE}/raw/{date}.json", "w"), indent=1, ensure_ascii=False)
    return True


if __name__ == "__main__":
    d = sys.argv[1] if len(sys.argv) > 1 else (datetime.datetime.utcnow() + datetime.timedelta(hours=3)).date().isoformat()
    sys.exit(0 if main(d) else 3)
