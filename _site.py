"""Flavor Africa site builder: story registry, listings, scheduling, nav and sitemap.

HOW TO ADD A STORY
1. Write the article as _articles/<name>.py (copy any existing one).
2. Add one line to STORIES below (newest anywhere; order doesn't matter).
3. Run:  python3 _site.py && python3 _articles/build.py
   _site.py creates the page if it's new, then rebuilds every section page, the
   homepage blocks, the News page and sitemap.xml. build.py fills in the article.

SCHEDULING: a story whose date is in the future is hidden from every listing until
that day (Nairobi time), so you can publish ahead and it appears on its own.
"""
import html, os, re, datetime

SITE = os.path.dirname(os.path.abspath(__file__))
URL = "https://flavorafricagroup.org/"
e = lambda s: html.escape(s, quote=True)

# slug, sections, tag, title, teaser, image, date (YYYY-MM-DD, Nairobi), image focus
STORIES = [
 ("tems-soul-train-2026", ["news", "music"], "The Wrap", "Tems is the only double nominee in the first Soul Train Awards reveal", "R&B/Soul Song of the Year and Spotify's RNB X International Artist.", "wr-tems-st.jpg", "2026-10-05", "center 40%"),
 ("sofiya-nzau-world-tour", ["news", "music"], "The Wrap", "Sofiya Nzau is taking Mwaki around the world", "A 2026/27 world tour, with Australia confirmed for February.", "wr-sofiya.jpg", "2026-10-06", "center 25%"),
 ("messi-argentina-farewell", ["sport"], "Flavor Sports", "Messi says goodbye to Argentina with a goal and a 3–0 win", "Game 208, goal 126, and a tearful farewell at the Monumental.", "sp-messi-arg.jpg", "2026-10-07", "center 30%"),
 ("germany-final-adidas-kit", ["sport", "fashion"], "Flavor Sports", "End of an era: Germany's last Adidas shirt", "72 years, four World Cups, one black-and-gold goodbye.", "sp-germany.jpg", "2026-10-07", "center 25%"),
 ("super-bowl-disney-plus", ["sport", "screen"], "Flavor Sports", "Super Bowl LXI is coming to Disney+", "ESPN's first Super Bowl, streaming on 14 February 2027.", "sp-superbowl.jpg", "2026-10-08", "center"),
 ("drake-janice-stfu-lawsuit", ["news", "music"], "The Wrap", "Drake sued over the chorus of “Janice STFU”", "A Beyoncé producer says the hook is his. Drake's team says they've never heard of him.", "wr-drake.jpg", "2026-10-17", "center 25%"),
 ("bien-alusa-continua", ["news", "music"], "The Wrap", "Bien's new album Alusa Continua lands on 20 November", "17 tracks, with 2 Chainz, Alikiba, Femi One and more.", "wr-bien.jpg", "2026-10-19", "center 20%"),
 ("bridget-blue-grammys", ["news", "music"], "The Wrap", "Bridget Blue's RNB is in the Grammy conversation", "Under consideration for Best Progressive R&B Album.", "wr-bridget.jpg", "2026-10-20", "center 25%"),
 ("lagos-fashion-week", ["fashion"], "Flavor Fashion", "Lagos Fashion Week 2026: everything to know before the runway lights up", "28 October to 1 November. The Crafted season.", "lfw-incubator.jpg", "2026-10-22", "center 25%"),
 ("soul-makossa", ["culture"], "Flavor Roots", "That chant on Thriller? It started in Cameroon", "Flavor Roots Issue 01: how Manu Dibango's Soul Makossa travelled from Douala to the world.", "sm-manu-stage.jpg", "2026-10-22", "center 25%"),
 ("nairobi-this-weekend-23-25-oct", ["live"], "Nairobi This Weekend", "Nairobi this weekend: 23–25 October", "Kikuyu Love Sessions, the Nairobi Marathon and the last days of the NBO Film Festival.", "nw-kls.jpg", "2026-10-22", "center"),
 ("watchlist", ["screen"], "The Watchlist", "Must watch this weekend: Lupin, A Land Apart, Spinners and more", "This weekend's picks across cinemas and streaming.", "wl-lupin.jpg", "2026-10-23", "center 0%"),
 ("uk-afrobeats-chart-18-24-oct", ["charts", "music"], "Flavor Charts", "Ayra Starr and Zayn take No. 1 on the UK Afrobeats chart", "“Heaven Baby” climbs to the top. Here's the top five.", "ch-heaven.jpg", "2026-10-23", "center 30%"),
 ("nairobi-new-sound", ["features"], "The Flavor Cover", "Nairobi's New Sound", "It isn't one genre. That's the whole point. Issue 01 of the Flavor Cover.", "nns-njerae.jpg", "2026-10-24", "center 25%"),
 ("messi-princess-of-asturias", ["sport"], "Flavor Sports", "One of one: Messi wins the Princess of Asturias Award on his own", "The first footballer to take Spain's top sports honour alone.", "sp-messi-wave.jpg", "2026-10-24", "center 30%"),
 ("tems-what-you-need-record", ["charts", "music", "news"], "Flavor Charts", "Tems makes Billboard history with “What You Need”", "30 weeks on the Hot 100, a record for a solo African song.", "ch-tems.jpg", "2026-10-24", "center 20%"),
 ("ayrosh", ["live", "music"], "Flavor Artist Live", "Know your November artist: Ayrosh", "Mugithi, reimagined. Ayrosh headlines Flavor Artist Live on 28 November.", "ay-cover.jpg", "2026-10-25", "center 30%"),
 ("sunday-reset", ["music"], "Flavor Playlist", "Sunday Reset: six songs for a slow Sunday", "Flavor Playlist Vol. 01, from Sade to Black Coffee and Msaki.", "sunday-reset-poster.jpg", "2026-10-25", "center"),
 ("true-colors-at-40", ["culture"], "Flavor Rewind", "True Colors at 40: Cyndi Lauper's No. 1, four decades on", "Forty years ago today, a quiet ballad went to No. 1.", "tc-beret.jpg", "2026-10-25", "center 20%"),
 ("lupita-in-their-words", ["culture"], "In Their Words", "In Their Words: Lupita Nyong'o on beauty", "“You can't eat beauty. It doesn't feed you.”", "itw-lupita.jpg", "2026-10-25", "center 30%"),
 ("mr-eazi", ["money"], "Money Moves", "Mr Eazi: singer, investor, owner", "Seven moves that turned an Afrobeats star into a business.", "me-cover.jpg", "2026-10-26", "center 25%"),
 ("savara", ["features", "music"], "Flavor Feature", "Savara: the rhythm before the spotlight", "After 17 years helping shape Sauti Sol's sound, Savara is making room for a sound of his own.", "savara-1.jpg", "2026-10-26", "center 25%"),
 ("tg-blk", ["music"], "Flavor Spotlight", "tg.blk: the Mombasa bedroom producer opening doors for alternative music", "The artist to watch from the coast.", "tg-2026.jpg", "2026-10-27", "center 25%"),
 ("made-in-lagos", ["culture"], "Flavor Rewind", "Made in Lagos at six", "How Wizkid's fourth album rewrote Africa's chart records.", "mil-stage.jpg", "2026-10-30", "center 25%"),
 ("mugithi-decoded", ["culture"], "Flavor Decoded", "Mugithi, decoded", "One voice, one guitar, and a whole room holding on. What mugithi is and where it came from.", "ay-live.jpg", "2026-11-02", "center 30%"),
 ("ballon-dor-2026", ["sport"], "Flavor Sports", "Kane ends England’s wait. Putellas makes it three.", "Harry Kane and Alexia Putellas lead a night of winners, records and new ground for the Ballon d’Or in London.", "bdor-kane-putellas.jpg", "2026-10-27", "center"),
]

SECTIONS = {  # slug: (heading on page, empty message)
 "news": ("Latest news", "The day's news will appear here."),
 "music": ("Latest in Music", ""), "charts": ("This week in Flavor Charts", ""),
 "screen": ("Latest in Film & TV", ""), "fashion": ("Latest in Fashion", ""),
 "money": ("Latest in Business", ""), "sport": ("Latest in Sports", ""),
 "culture": ("Latest in Culture", ""), "features": ("Latest Features", ""), "live": ("Latest in Live", ""),
}
# The Wrap edition for each news story (filters News page chips: Local / Continental / Global)
EDITION = {
 "tems-soul-train-2026": "Continental", "sofiya-nzau-world-tour": "Local", "drake-janice-stfu-lawsuit": "Global",
 "bien-alusa-continua": "Local", "bridget-blue-grammys": "Local", "tems-what-you-need-record": "Continental",
}
HERO_AND_SIDES = {"ayrosh", "nairobi-new-sound", "mr-eazi", "soul-makossa"}
# Selected stories that should also appear in the homepage's main Latest grid.
HOME_LATEST = {"ballon-dor-2026"}


def nice(d):
    return datetime.date.fromisoformat(d).strftime("%-d %b %Y")


def newest(items):
    return sorted(items, key=lambda s: s[6], reverse=True)


def card(s):
    slug, secs, tag, title, teaser, img, date, pos = s
    ed = (' data-ed="%s"' % EDITION[slug]) if slug in EDITION else ""
    return ('<a class="card" href="%s.html" data-pub="%s"%s><div class="ph img left"><img loading="lazy" src="img/%s" alt="" style="object-position:%s">'
            '<span class="tag">%s</span></div><h3>%s</h3><p>%s</p><span class="meta">%s</span></a>'
            % (slug, date, ed, img, pos, e(tag), e(title), e(teaser), nice(date)))


def hc(s):
    slug, secs, tag, title, teaser, img, date, pos = s
    return ('<a class="hc" href="%s.html" data-pub="%s"><div class="hc-img"><img src="img/%s" alt="" loading="lazy" style="object-position:%s"></div>'
            '<div class="hc-txt"><span class="tag">%s</span><h3>%s</h3><p>%s</p><span class="meta">%s</span></div></a>'
            % (slug, date, img, pos, e(tag), e(title), e(teaser), nice(date)))


def hs(s):
    slug, secs, tag, title, teaser, img, date, pos = s
    return ('<a class="hs" href="%s.html" data-pub="%s"><div class="hs-img"><img loading="lazy" src="img/%s" alt="" style="object-position:%s"></div>'
            '<div><span class="tag">%s</span><h3>%s</h3><span class="meta">%s</span></div></a>'
            % (slug, date, img, pos, e(tag), e(title), nice(date)))


SCHED = ('<script>(function(){var d=new Date(Date.now()+108e5).toISOString().slice(0,10);'
         'document.querySelectorAll("[data-pub]").forEach(function(x){if(x.getAttribute("data-pub")>d)x.remove()});'
         'document.querySelectorAll("[data-limit]").forEach(function(g){var n=+g.getAttribute("data-limit");'
         '[].slice.call(g.children).forEach(function(c,i){if(i>=n)c.remove()})})})();</script>')


def seg_id(label):
    return re.sub(r"[^a-z0-9]+", "-", html.unescape(label).lower()).strip("-")


def segs_html(h):
    """Turn the segment labels under a section heading into clickable filter chips."""
    m = re.search(r'<div class="segs"[^>]*>(.*?)</div>', h, flags=re.S)
    if not m:
        return h
    labels = [x for x in re.findall(r'<(?:span|a)[^>]*>(.*?)</(?:span|a)>', m.group(1)) if x != "All"]
    chips = '<a href="#all" data-seg="" aria-pressed="true">All</a>' + "".join(
        '<a href="#%s" data-seg="%s" aria-pressed="false">%s</a>' % (seg_id(l), e(html.unescape(l)), l) for l in labels)
    return h[:m.start()] + '<div class="segs" role="group" aria-label="Filter by segment">%s</div>' % chips + h[m.end():]


FILTER = ('<script>(function(){var bar=document.querySelector(".segs");if(!bar)return;var chips=[].slice.call(bar.querySelectorAll("a[data-seg]"));'
          'var box=document.querySelector(".block .cards"),sec=document.querySelector(".block[style]");if(!sec)return;'
          'var msg=document.createElement("div");msg.className="empty";msg.hidden=true;(box||sec).insertAdjacentElement("afterend",msg);'
          'function go(id){var c=chips.filter(function(x){return x.getAttribute("href")==="#"+id})[0]||chips[0],seg=c.getAttribute("data-seg"),n=0;'
          'chips.forEach(function(x){x.setAttribute("aria-pressed",x===c?"true":"false")});'
          'if(box)[].slice.call(box.children).forEach(function(k){var t=k.querySelector(".tag"),ok=!seg||(t&&t.textContent.trim()===seg)||k.getAttribute("data-ed")===seg;k.hidden=!ok;if(ok)n++});'
          'if(box)box.hidden=!n;msg.hidden=!!n||(!box&&!seg);msg.textContent=seg?"Nothing in "+seg+" yet. Check back soon.":"";}'
          'chips.forEach(function(x){x.addEventListener("click",function(ev){ev.preventDefault();var id=x.getAttribute("href").slice(1);'
          'history.replaceState(null,"",id==="all"?location.pathname:"#"+id);go(id)})});'
          'window.addEventListener("hashchange",function(){go(location.hash.slice(1))});go(location.hash.slice(1))})();</script>')


def add_filter(h):
    h = re.sub(r'<script>\(function\(\)\{var bar=document\.querySelector\("\.segs"\).*?</script>', "", h, flags=re.S)
    return h.replace("</body>", FILTER + "</body>", 1)


def link_menu(h, pages):
    """Point menu sub-links (e.g. Music > Flavor Playlist) at the filtered section view."""
    def fix(m):
        page, label = m.group(1), m.group(2)
        if label.startswith("All ") or label not in pages.get(page, ()):
            return m.group(0)
        return '<li><a href="%s#%s">%s</a></li>' % (page, seg_id(label), label)
    return re.sub(r'<li><a href="([a-z]+\.html)(?:#[a-z0-9-]+)?">([^<]+)</a></li>', fix, h)


def rd(f):
    return open(os.path.join(SITE, f), encoding="utf-8").read()


def wr(f, s):
    open(os.path.join(SITE, f), "w", encoding="utf-8").write(s)


def add_sched(h):
    h = re.sub(r'<script>\(function\(\)\{var d=new Date\(Date\.now\(\)\+108e5\).*?</script>', "", h, flags=re.S)
    return h.replace("</body>", SCHED + "</body>", 1)


def new_page(s):
    """Create <slug>.html from the Savara page shell, with fresh head metadata."""
    slug, secs, tag, title, teaser, img, date, pos = s
    f = slug + ".html"
    if os.path.exists(os.path.join(SITE, f)):
        return
    h = rd("savara.html")
    url, im, iso = URL + f, URL + "img/" + img, date + "T08:00:00+03:00"
    h = re.sub(r"<title>.*?</title>", "<title>%s | flavor.africa</title>" % e(title), h, count=1)
    h = re.sub(r'(<meta name="description" content=")[^"]*', lambda m: m.group(1) + e(teaser), h, count=1)
    for prop in ("og:description", "twitter:description"):
        h = re.sub(r'(<meta (?:property|name)="%s" content=")[^"]*' % prop, lambda m: m.group(1) + e(teaser), h, count=1)
    h = re.sub(r'(<meta property="og:title" content=")[^"]*', lambda m: m.group(1) + e(title), h, count=1)
    h = re.sub(r'(<meta name="twitter:title" content=")[^"]*', lambda m: m.group(1) + e(title) + " | flavor.africa", h, count=1)
    h = re.sub(r'(<link rel="canonical" href=")[^"]*', lambda m: m.group(1) + url, h, count=1)
    h = re.sub(r'(<meta property="og:url" content=")[^"]*', lambda m: m.group(1) + url, h, count=1)
    h = re.sub(r'(<meta (?:property|name)="(?:og|twitter):image" content=")[^"]*', lambda m: m.group(1) + im, h)
    h = re.sub(r'(<meta property="article:published_time" content=")[^"]*', lambda m: m.group(1) + iso, h, count=1)
    ld = ('{"@context":"https://schema.org","@type":"NewsArticle","headline":%s,"description":%s,"image":["%s"],"mainEntityOfPage":"%s",'
          '"author":{"@type":"Organization","name":"Flavor Africa","url":"%s"},"publisher":{"@type":"Organization","name":"Flavor Africa Group",'
          '"logo":{"@type":"ImageObject","url":"%sfavicon.png"}},"datePublished":"%s"}'
          % (json_str(title), json_str(teaser), im, url, URL, URL, iso))
    h = re.sub(r'<script type="application/ld\+json">.*?</script>', lambda m: '<script type="application/ld+json">%s</script>' % ld, h, count=1, flags=re.S)
    h = re.sub(r'<div class="art">.*?</div></article>', '<div class="art"></div></article>', h, count=1, flags=re.S)
    h = h.replace('aria-current="page"', "")
    wr(f, h)
    print("created", f)


def json_str(x):
    import json
    return json.dumps(x, ensure_ascii=False)


def ensure_news_page():
    if os.path.exists(os.path.join(SITE, "news.html")):
        return
    h = rd("culture.html")
    h = h.replace("<title>Culture | flavor.africa</title>", "<title>News | flavor.africa</title>")
    h = re.sub(r'<div class="wrap phead">.*?</div></div>',
               '<div class="wrap phead"><h1>News</h1><p>The Wrap: entertainment news that matters, from Nairobi to the continent to the world.</p>'
               '<div class="segs"><span>Local</span><span>Continental</span><span>Global</span></div></div>', h, count=1, flags=re.S)
    h = re.sub(r'(<link rel="canonical" href=")[^"]*', r"\g<1>" + URL + "news.html", h, count=1)
    h = re.sub(r'(<meta property="og:url" content=")[^"]*', r"\g<1>" + URL + "news.html", h, count=1)
    h = re.sub(r'(<meta property="og:title" content=")[^"]*', r"\g<1>News", h, count=1)
    h = re.sub(r'(<meta name="description" content=")[^"]*', r"\g<1>The Wrap: daily entertainment news from Nairobi, Africa and the world.", h, count=1)
    wr("news.html", h)
    print("created news.html")


NAV_SUB = '<a href="news.html">News</a>'
NAV_DRW = '<div class="acc"><a href="news.html">News · The Wrap</a></div>'


def fix_nav(f, h):
    if 'href="news.html">News</a><a href="music.html">' not in h:
        h = h.replace('<a href="music.html">Music</a>', NAV_SUB + '<a href="music.html">Music</a>')  # header + footer
        h = h.replace('<div class="acc"><a href="index.html">Home</a></div>', '<div class="acc"><a href="index.html">Home</a></div>' + NAV_DRW, 1)
    h = h.replace('<a href="news.html" aria-current="page">News</a>', NAV_SUB)
    if f == "news.html":
        h = h.replace('<a href="culture.html" aria-current="page">Culture</a>', '<a href="culture.html">Culture</a>')
        h = h.replace(NAV_SUB + '<a href="music.html">Music</a><a href="charts.html">',
                      '<a href="news.html" aria-current="page">News</a><a href="music.html">Music</a><a href="charts.html">', 1)
    return h


def section_html(slug):
    head, empty = SECTIONS[slug]
    items = newest([s for s in STORIES if slug in s[1]])
    inner = '<div class="cards">%s</div>' % "".join(card(s) for s in items) if items else '<div class="empty">%s</div>' % empty
    return '<section class="wrap block" style="padding-top:36px"><div class="secbar"><h2>%s</h2></div>%s</section>' % (head, inner)


def build_sections():
    for slug in SECTIONS:
        f = slug + ".html"
        h = rd(f)
        h, n = re.subn(r'<section class="wrap block" style="padding-top:36px">.*?</section>', lambda m: section_html(slug), h, count=1, flags=re.S)
        assert n == 1, f
        wr(f, add_filter(add_sched(segs_html(h))))


def build_home():
    h = rd("index.html")
    latest = [s for s in newest(STORIES) if s[0] not in HERO_AND_SIDES and (s[0] in HOME_LATEST or not set(s[1]) & {"news", "culture", "sport"})]
    h, n = re.subn(r'<div class="hgrid"[^>]*>.*?</div></section>', lambda m: '<div class="hgrid" data-limit="6">%s</div></section>' % "".join(hc(s) for s in latest), h, count=1, flags=re.S)
    assert n == 1
    wrap = newest([s for s in STORIES if "news" in s[1]])
    cult = newest([s for s in STORIES if ("culture" in s[1] or "sport" in s[1]) and s[0] not in HOME_LATEST])
    blocks = ('<section class="wrap block" id="the-wrap"><div class="secbar"><h2>The Wrap</h2><a href="news.html">All news »</a></div>'
              '<div class="wrapgrid" data-limit="6">%s</div></section>'
              '<section class="wrap block"><div class="secbar"><h2>Culture &amp; Sport</h2><a href="culture.html">More culture »</a></div>'
              '<div class="hgrid" data-limit="3">%s</div></section>') % ("".join(hs(s) for s in wrap), "".join(hc(s) for s in cult))
    h, n = re.subn(r'(<section class="wrap block" id="the-wrap">.*?</section><section class="wrap block"><div class="secbar"><h2>Culture &amp; Sport</h2>.*?</section>'
                   r'|<section class="wrap block"><div class="secbar"><h2>Quick reads</h2>.*?</section>)', lambda m: blocks, h, count=1, flags=re.S)
    assert n == 1
    wr("index.html", add_sched(h))


def build_sitemap():
    today = datetime.date.today().isoformat()
    pages = ["index.html", "news.html"] + [k + ".html" for k in SECTIONS if k != "news"] + ["about.html"] + [s[0] + ".html" for s in STORIES]
    seen, rows = set(), []
    for p in pages:
        if p in seen:
            continue
        seen.add(p)
        loc = URL if p == "index.html" else URL + p
        rows.append("<url><loc>%s</loc><lastmod>%s</lastmod></url>" % (loc, today))
    wr("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n%s\n</urlset>\n' % "\n".join(rows))


if __name__ == "__main__":
    for s in STORIES:
        new_page(s)
    ensure_news_page()
    pages = {}
    for k in SECTIONS:
        m = re.search(r'<div class="segs"[^>]*>(.*?)</div>', rd(k + ".html"), flags=re.S)
        if m:
            pages[k + ".html"] = [x for x in re.findall(r'<(?:span|a)[^>]*>(.*?)</(?:span|a)>', m.group(1)) if x != "All"]
    for f in sorted(os.listdir(SITE)):
        if f.endswith(".html"):
            wr(f, link_menu(fix_nav(f, rd(f)), pages))
    build_sections()
    build_home()
    build_sitemap()
    print("site rebuilt")
