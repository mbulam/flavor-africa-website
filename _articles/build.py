"""Rebuilds the article body of each story page from the content files in this folder.
Run: python3 _articles/build.py  (from the site folder). Only the <div class="art"> block
and <title> of each page are replaced; header, footer and menu stay as they are."""
import importlib.util, glob, html, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
e = lambda s: html.escape(s, quote=False)


def render(m):
    out = ['<div class="art">', '<span class="tag">%s</span>' % e(m.TAG), '<h1>%s</h1>' % e(m.H1),
           '<p class="dek">%s</p>' % e(m.DEK), '<span class="meta">%s</span>' % e(m.META)]
    if getattr(m, "LEAD", None):
        src, cap = m.LEAD[:2]
        credit_label = m.LEAD[3] if len(m.LEAD) > 3 and m.LEAD[3] else "Photo"
        cr = '<span class="credit">%s: %s</span>' % (e(credit_label), e(m.LEAD[2])) if len(m.LEAD) > 2 and m.LEAD[2] else ""
        out.append('<figure><img class="lead" src="%s" alt="%s"><figcaption>%s%s</figcaption></figure>' % (src, e(cap), e(cap), cr))
    out.append('<div class="body">')
    for b in m.BODY:
        k = b[0]
        if k == "p":
            out.append("<p>%s</p>" % b[1])  # paragraphs may hold simple inline HTML (<em>, <a>)
        elif k == "h2":
            _, kicker, plain, bold = b
            ks = '<span class="k">%s</span>' % e(kicker) if kicker else ""
            out.append('<h2>%s%s<b class="hb">%s</b></h2>' % (ks, e(plain), e(bold)))
        elif k == "img":
            cr = '<span class="credit">Photo: %s</span>' % e(b[3]) if len(b) > 3 and b[3] else ""
            out.append('<figure><img src="%s" alt="%s" loading="lazy"><figcaption>%s%s</figcaption></figure>' % (b[1], e(b[2]), e(b[2]), cr))
        elif k == "duo":
            out.append('<div class="duo">%s</div>' % "".join('<img src="%s" alt="%s" loading="lazy">' % (s, e(a)) for s, a in b[1]))
        elif k == "quote":
            cite = '<cite>%s</cite>' % e(b[2]) if len(b) > 2 else ""
            out.append('<blockquote class="pull"><p>%s</p>%s</blockquote>' % (e(b[1]), cite))
        elif k == "facts":
            out.append('<div class="facts2">%s</div>' % "".join('<div><span>%s</span><span>%s</span></div>' % (e(a), e(v)) for a, v in b[1]))
        elif k == "list":  # numbered picks: (n, img or None, title, who, line, text)
            rows = []
            cls = "tracks posters" if b[1] == "posters" else "tracks"
            for it in b[2]:
                n, img, title, who, line, text = it
                im = '<img src="%s" alt="%s" loading="lazy">' % (img, e(title)) if img else '<span></span>'
                rows.append('<li><span class="n">%s</span>%s<div><h3>%s</h3>%s<span class="meta">%s</span>%s</div></li>'
                            % (n, im, e(title), ('<div class="who">%s</div>' % e(who)) if who else "", e(line), "".join("<p>%s</p>" % t for t in text)))
            out.append('<ol class="%s">%s</ol>' % (cls, "".join(rows)))
        elif k == "raw":
            out.append(b[1])
        else:
            raise ValueError(k)
    out.append("</div>")
    if getattr(m, "SOURCES", None):
        out.append('<details class="sources"><summary>Sources</summary><ul>%s</ul></details>'
                   % "".join('<li><a href="%s" target="_blank" rel="noopener">%s</a></li>' % (u, e(t)) for t, u in m.SOURCES))
    out.append("</div>")
    return "".join(out)


for path in sorted(glob.glob(os.path.join(HERE, "*.py"))):
    if os.path.basename(path) == "build.py":
        continue
    spec = importlib.util.spec_from_file_location("m", path)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    fp = os.path.join(SITE, m.FILE)
    s = open(fp, encoding="utf-8").read()
    s2, n = re.subn(r'<div class="art">.*?</div></article>', lambda _: render(m) + "</article>", s, count=1, flags=re.S)
    assert n == 1, m.FILE
    s2 = re.sub(r"<title>.*?</title>", "<title>%s | flavor.africa</title>" % e(m.TITLE), s2, count=1)
    open(fp, "w", encoding="utf-8").write(s2)
    words = len(re.sub(r"<[^>]+>", " ", render(m)).split())
    print("built", m.FILE, words, "words")
