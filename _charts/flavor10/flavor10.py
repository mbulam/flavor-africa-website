"""The Flavor 10 · Kenya — chart builder.

Each edition is saved as data/YYYY-MM-DD.json. When a new edition is built, it is
compared with the most recent earlier edition to draw the movement markers:
  ▲n climbed n places · ▼n dropped n places · – no change · NEW first time in the 10
  RE re-entry (was in an earlier edition, not the last one)

Run:  python3 flavor10.py 2026-10-27      (reads data/2026-10-27.json, writes PNG)
"""
import json, glob, os, random, sys, datetime
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
P, Y, INK, CR = "#2A0174", "#F5CC11", "#15102A", "#F6F1E6"


def load(date):
    return json.load(open(f"{HERE}/data/{date}.json"))


def previous(date):
    older = sorted(f for f in glob.glob(f"{HERE}/data/*.json") if os.path.basename(f)[:-5] < date)
    return [json.load(open(f)) for f in older]


def key(s):
    return (s["title"].lower(), s["artist"].lower())


def movement(songs, history):
    last = {key(s): i for i, s in enumerate(history[-1]["songs"], 1)} if history else {}
    ever = {key(s) for h in history for s in h["songs"]}
    out = []
    for i, s in enumerate(songs, 1):
        k = key(s)
        if k in last:
            d = last[k] - i
            out.append(("up", f"▲{d}") if d > 0 else ("down", f"▼{-d}") if d < 0 else ("same", "–"))
        elif k in ever:
            out.append(("re", "RE"))
        else:
            out.append(("new", "NEW"))
    return out


def wave(w, h, seed, step=6, bw=3):
    random.seed(seed)
    bars = []
    for i in range(int(w / step)):
        v = min(h, h * .25 + h * .75 * abs(random.gauss(.55, .28)))
        bars.append(f'<rect x="{i*step}" y="{(h-v)/2:.1f}" width="{bw}" height="{v:.1f}" rx="{bw/2}"/>')
    return f'<svg width="{w}" height="{h}" style="flex:none;display:block">{"".join(bars)}</svg>'


def dots(c):
    return "".join(f'<span class="d{" on" if k in c else ""}">{k}</span>' for k in "SYRM")


def html(ed, moves):
    songs = ed["songs"]
    top = max(s["points"] for s in songs)
    d = datetime.date.fromisoformat(ed["date"])
    rows = []
    for i, (s, (mk, mt)) in enumerate(zip(songs, moves), 1):
        w = max(60, round((560 if i == 1 else 470) * s["points"] / top))
        lab = '<div class="lab">NO. 1 IN KENYA THIS WEEK</div>' if i == 1 else ""
        rows.append(f'''<div class="row{' one' if i == 1 else ''}"><div class="rk">{i:02d}<span class="mv {mk}">{mt}</span></div>
<div class="info">{lab}<div class="t">{s["title"]}</div><div class="a">{s["artist"]}</div></div>
<div class="bar">{wave(w, 56 if i == 1 else 40, i * 7 + 3)}</div></div>''')
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1080px;height:1350px;font-family:Poppins;color:{INK};overflow:hidden;background:{CR};position:relative}}
body:after{{content:"";position:absolute;inset:0;opacity:.05;pointer-events:none;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/></filter><rect width='160' height='160' filter='url(%23n)'/></svg>")}}
.tag{{position:absolute;left:60px;top:60px;height:44px;line-height:44px;padding:0 16px;background:{Y};color:{P};font-weight:700;font-size:22px;letter-spacing:.06em}}
.logo{{position:absolute;right:60px;top:56px;font-weight:800;font-size:30px;color:{P}}}
.hd{{position:absolute;left:60px;right:60px;top:150px}}
.k{{font-size:16px;letter-spacing:.32em;color:{P};font-weight:600;display:flex;align-items:center;gap:12px}}.k:before{{content:"";width:34px;height:6px;background:{Y}}}
.rule{{height:2px;background:{P};margin-top:22px}}
.list{{position:absolute;left:60px;right:60px;top:196px}}
.row{{display:grid;grid-template-columns:92px 330px 1fr;align-items:center;height:88px;border-bottom:1px solid rgba(21,16,42,.12)}}
.row.one{{height:150px;background:{Y};margin:0 -60px;padding:0 60px;border-bottom:0;grid-template-columns:92px 300px 1fr}}
.rk{{font-size:40px;font-weight:300;color:rgba(21,16,42,.4);letter-spacing:-.02em;line-height:1;display:flex;flex-direction:column;gap:6px}}
.one .rk{{color:{P};font-weight:700;font-size:56px}}
.mv{{font-size:16px;font-weight:700;letter-spacing:.06em;line-height:1;align-self:flex-start;padding:4px 6px 3px;border-radius:3px}}
.mv.up{{color:{P}}} .mv.down{{color:#9A2A2A}} .mv.same{{color:rgba(21,16,42,.45)}}
.mv.none{{display:none}} .mv.new{{background:{P};color:{Y}}} .mv.re{{border:1px solid {P};color:{P}}}
.one .mv.none{{display:none}} .mv.new{{background:{P};color:{Y}}}
.lab{{font-size:12px;letter-spacing:.24em;font-weight:600;color:{P};margin-bottom:6px}}
.t{{font-size:24px;font-weight:700;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}}
.one .t{{font-size:36px;color:{P};font-weight:800;letter-spacing:-.01em}}
.a{{font-size:15px;font-weight:300;opacity:.85;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}}
.one .a{{font-size:19px}}
.bar{{display:flex;align-items:center;gap:14px}}
.bar svg{{fill:rgba(42,1,116,.75)}} .one .bar svg{{fill:{P}}}
.dots{{display:flex;gap:4px}}
.d{{width:20px;height:20px;border-radius:50%;border:1px solid rgba(21,16,42,.25);font-size:10px;font-weight:600;display:grid;place-items:center;color:rgba(21,16,42,.35)}}
.d.on{{background:{P};color:#fff;border-color:{P}}} .one .d{{border-color:rgba(42,1,116,.35)}}
.ft{{position:absolute;left:60px;right:60px;bottom:48px;font-size:13px;line-height:1.55;font-weight:300;border-top:1px solid rgba(21,16,42,.3);padding-top:12px;display:flex;justify-content:space-between;gap:24px}}
.ft b{{font-weight:600}} .key{{white-space:nowrap;text-align:right}}
.key i{{font-style:normal;display:inline-grid;place-items:center;width:17px;height:17px;border-radius:50%;background:{P};color:#fff;font-size:9px;font-weight:700;margin:0 4px 0 10px}}
.key em{{font-style:normal;font-weight:700;color:{P};margin-left:10px}}
</style></head><body>
<div class="tag">FLAVOR CHARTS</div><div class="logo">flavor.africa</div>
<div class="hd"><div class="k">THE FLAVOR 10 · KENYA · {ed["label"]}</div><div class="rule"></div></div>
<div class="list">{"".join(rows)}</div>
<div class="ft"><div><b>Sources:</b> Apple Music · Spotify · Shazam · YouTube · Kenyan radio · Audiomack · Mdundo</div>
<div class="key"><em>▲</em> climbed <em>▼</em> dropped<br><em>–</em> no change <em>NEW</em> new entry</div></div>
</body></html>'''


def build(date):
    ed = load(date)
    hist = previous(date)
    moves = movement(ed["songs"], hist) if hist else [("none", "")] * len(ed["songs"])  # debut edition: no markers
    page = html(ed, moves)
    hp = f"{HERE}/out/flavor-10-kenya-{date}.html"
    os.makedirs(f"{HERE}/out", exist_ok=True)
    open(hp, "w").write(page)
    png = hp[:-5] + ".png"
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 1080, "height": 1350})
        pg.goto("file://" + hp)
        pg.wait_for_timeout(500)
        pg.screenshot(path=png)
        b.close()
    print(png)


if __name__ == "__main__":
    build(sys.argv[1])
