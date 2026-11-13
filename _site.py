"""Flavor Africa site builder: story registry, listings, scheduling, nav and sitemap.

HOW TO ADD A STORY
1. Write the article as _articles/<name>.py (copy any existing one).
2. Add one line to STORIES below (newest anywhere; order doesn't matter).
3. Run:  python3 _site.py && python3 _articles/build.py
   _site.py creates the page if it's new, then rebuilds every section page, the
   homepage blocks, the News page and sitemap.xml. build.py fills in the article.

SCHEDULING: a story whose date is in the future is hidden from every listing until
that day (Nairobi time), so you can publish ahead and it appears on its own. Until
then its page also carries a noindex tag and stays out of sitemap.xml, so search
engines don't pick it up early. The daily GitHub Action (06:10 Nairobi) reruns this
script, which adds the story to the sitemap and lifts the noindex on its date.
"""
import html, os, re, datetime

SITE = os.path.dirname(os.path.abspath(__file__))
URL = "https://flavorafricagroup.org/"
e = lambda s: html.escape(s, quote=True)

# slug, sections, tag, title, teaser, image, date (YYYY-MM-DD, or YYYY-MM-DDTHH:MM to go live at a set time; Nairobi), image focus
STORIES = [
 ("tems-children-of-blood-and-bone-soundtrack", ["news", "music", "screen"], "The Wrap", "Tems is curating the Children of Blood and Bone soundtrack", "Burna Boy, Ayra Starr and nine more are on it. Her own single lands 20 November.", "wr-tems-cobab.jpg", "2026-11-13T20:00", "center 30%"),
 ("ghana-must-go-decoded", ["culture", "fashion"], "Flavor Decoded", "Ghana Must Go, decoded", "How a cheap checked tote got its name in 1983, and ended up on Denim Tears' new adidas.", "gmg-lead.jpg", "2026-11-10T11:00", "center 25%"),
 ("ronaldo-retires-portugal", ["sport"], "Flavor Sports", "How Ronaldo's Portugal story ended", "The bust-up, the 146-goal record and what comes next.", "sp-ronaldo-retires.jpg", "2026-11-05T17:00", "center 20%"),
 ("makaveli-at-30", ["culture", "music"], "Flavor Rewind", "Makaveli at 30: the album 2Pac finished in a week", "Thirty years on, his last finished album still sounds like a man in a hurry.", "mak-coat.jpg", "2026-11-06T10:30", "center 15%"),
 ("tegla-loroupe-new-york-1994", ["sport", "culture"], "Flavor Rewind", "The day Tegla Loroupe took New York", "32 years ago today, a 21-year-old from West Pokot became the first African woman to win a major marathon.", "teg-ny.jpg", "2026-11-06T11:00", "center 20%"),
 ("awar-odhiang-model-of-the-year", ["fashion", "features"], "Flavor Fashion", "Awar Odhiang: from Pugnido to Model of the Year", "The model who closed Chanel is the British Fashion Council’s Model of the Year 2026. This is how she got there.", "ao-cover.jpg", "2026-11-05T18:00", "center 20%"),
 ("neema-ngelime", ["screen", "features"], "Flavor Spotlight", "Neema Ngelime: eight awards for a film still in development", "The Tanzanian director to watch, and the documentary winning before it is finished.", "nn-portrait.jpg", "2026-11-03", "center 25%"),
 ("kit-culture", ["sport", "fashion"], "Flavor Sports", "Kit Culture: how the football shirt became the outfit", "From London queues to Soweto's rooftops, the jersey left the stadium.", "sp-kit-cover.jpg", "2026-11-01T09:00", "center 30%"),
 ("is-halloween-a-nairobi-thing", ["culture"], "Flavor Decoded", "Is Halloween a Nairobi thing now?", "Ten years ago it was a hard sell. Tonight the city is in costume. How a borrowed holiday found a home in Nairobi.", "hn-party.jpg", "2026-10-31T18:00", "center 45%"),
 ("thandiwe-muriu", ["features", "culture"], "Flavor Feature", "Thandiwe Muriu: the art of hiding in plain sight", "The Nairobi photographer dresses women in the same fabric as the wall behind them, and they're still all you can see.", "tm-cover.jpg", "2026-10-31T09:00", "center 15%"),
 ("marley-locks-mau-mau", ["culture"], "Flavor Roots", "Did Bob Marley's locks come from Kenya?", "Flavor Roots Issue 02: from Kingston to the Mau Mau forests, the real story behind the locks.", "fr2-marley.jpg", "2026-10-29", "center 30%"),
 ("the-verdict-bensoul-flight-420", ["music"], "The Verdict", "Bensoul's Flight 420: a grown-up record that takes its time", "Thirteen tracks, three colours and a deep guest list. Our call on Bensoul's new album.", "verdict-bensoul.jpg", "2026-11-04", "center 40%"),
 ("the-verdict-lupin-part-4", ["screen"], "The Verdict", "Lupin Part 4: bigger, flashier, still worth it", "Critics love it, fans are split. Our call on Omar Sy's return.", "verdict-lupin.jpg", "2026-10-28", "center 25%"),
 ("tems-soul-train-2026", ["news", "music"], "The Wrap", "Tems is the only double nominee in the first Soul Train Awards reveal", "R&B/Soul Song of the Year and Spotify's RNB X International Artist.", "wr-tems-st.jpg", "2026-10-05", "center 40%"),
 ("sofiya-nzau-world-tour", ["news", "music"], "The Wrap", "Sofiya Nzau is taking Mwaki around the world", "A 2026/27 world tour, with Australia confirmed for February.", "wr-sofiya.jpg", "2026-10-06", "center 25%"),
 ("messi-argentina-farewell", ["sport"], "Flavor Sports", "Messi says goodbye to Argentina with a goal and a 3–0 win", "Game 208, goal 126, and a tearful farewell at the Monumental.", "sp-messi-arg.jpg", "2026-10-07", "center 0%"),
 ("germany-final-adidas-kit", ["sport", "fashion"], "Flavor Sports", "End of an era: Germany's last Adidas shirt", "72 years, four World Cups, one black-and-gold goodbye.", "sp-germany.jpg", "2026-10-07", "center 0%"),
 ("super-bowl-disney-plus", ["sport", "screen"], "Flavor Sports", "Super Bowl LXI is coming to Disney+", "ESPN's first Super Bowl, streaming on 14 February 2027.", "sp-superbowl.jpg", "2026-10-08", "center"),
 ("drake-janice-stfu-lawsuit", ["news", "music"], "The Wrap", "Drake sued over the chorus of “Janice STFU”", "A Beyoncé producer says the hook is his. Drake's team says they've never heard of him.", "wr-drake.jpg", "2026-10-17", "center 25%"),
 ("bien-alusa-continua", ["news", "music"], "The Wrap", "Bien's new album Alusa Continua lands on 20 November", "17 tracks, with 2 Chainz, Alikiba, Femi One and more.", "wr-bien.jpg", "2026-10-19", "center 20%"),
 ("bridget-blue-grammys", ["news", "music"], "The Wrap", "Bridget Blue's RNB is in the Grammy conversation", "Under consideration for Best Progressive R&B Album.", "wr-bridget.jpg", "2026-10-20", "center 25%"),
 ("lagos-fashion-week", ["fashion"], "Flavor Fashion", "Lagos Fashion Week 2026: everything to know before the runway lights up", "28 October to 1 November. The Crafted season.", "lfw-incubator.jpg", "2026-10-22", "center 25%"),
 ("lagos-fashion-week-business", ["fashion"], "Flavor Fashion", "Lagos Fashion Week makes space for fashion’s business side", "From fashion-business sessions to a retail presentation, Wednesday’s programme put the work around the clothes in view.", "lfw-business-opening.jpg", "2026-10-29", "center 38%"),
 ("soul-makossa", ["culture"], "Flavor Roots", "That chant on Thriller? It started in Cameroon", "Flavor Roots Issue 01: how Manu Dibango's Soul Makossa travelled from Douala to the world.", "sm-manu-stage.jpg", "2026-10-22", "center 25%"),
 ("nairobi-this-weekend-6-8-nov", ["live"], "Nairobi This Weekend", "Nairobi this weekend: 6–8 November", "KITFest's theatre market, The Moth, Kibera's youth chess tournament and Camp Mulla at Masshouse.", "nw3-moth-thumb.jpg", "2026-11-05T13:00", "center 30%"),
 ("nairobi-this-weekend-30-oct-1-nov", ["live"], "Nairobi This Weekend", "Nairobi this weekend: 30 October – 1 November", "The Floodies final, a Halloween double at Village Market, a new Madd Madd World book and Rock Riot.", "nw2-floodlit.jpg", "2026-10-29", "center 30%"),
 ("nairobi-this-weekend-23-25-oct", ["live"], "Nairobi This Weekend", "Nairobi this weekend: 23–25 October", "Kikuyu Love Sessions, the Nairobi Marathon and the last days of the NBO Film Festival.", "nw-kls.jpg", "2026-10-22", "center"),
 ("the-drop-30-oct-2026", ["music"], "The Drop", "The Drop: Bensoul's Flight 420, Toxic Lyrikali, Dominic Fike and more", "Nine new releases from 29–30 October, led by Kenya.", "drop1-hero.jpg", "2026-10-30", "center 40%"),
 ("watchlist-30-oct-1-nov", ["screen"], "The Watchlist", "Must watch this weekend: Call Me Queen, How to Ruin Diwali and more", "A Nairobi story in cinemas, a Diwali disaster and two Netflix thrillers.", "wl2-deadendjob.jpg", "2026-10-30", "center 40%"),
 ("watchlist", ["screen"], "The Watchlist", "Must watch this weekend: Lupin, A Land Apart, Spinners and more", "This weekend's picks across cinemas and streaming.", "wl-lupin.jpg", "2026-10-23", "center 0%"),
 ("uk-afrobeats-chart-18-24-oct", ["charts", "music"], "Flavor Charts", "Ayra Starr and Zayn take No. 1 on the UK Afrobeats chart", "“Heaven Baby” climbs to the top. Here's the top five.", "ch-heaven.jpg", "2026-10-23", "center 30%"),
 ("nairobi-new-sound", ["features"], "The Flavor Cover", "Nairobi's New Sound", "It isn't one genre. That's the whole point. Issue 01 of the Flavor Cover.", "nns-njerae.jpg", "2026-10-24", "center 25%"),
 ("messi-princess-of-asturias", ["sport"], "Flavor Sports", "One of one: Messi wins the Princess of Asturias Award on his own", "The first footballer to take Spain's top sports honour alone.", "sp-messi-wave.jpg", "2026-10-24", "center 30%"),
 ("tems-what-you-need-record", ["charts", "music", "news"], "Flavor Charts", "Tems makes Billboard history with “What You Need”", "30 weeks on the Hot 100, a record for a solo African song.", "ch-tems.jpg", "2026-10-24", "center 10%"),
 # Ayrosh show on hold (10 Nov 2026): hidden from every listing until it is confirmed. To bring it back, remove the "#" below
 # and put the Ayrosh hero, ticker line, purple band and About-page line back (see git history for 10 Nov 2026).
 # ("ayrosh", ["live", "music"], "Flavor Artist Live", "Know your next artist: Ayrosh", "Mugithi, reimagined. Ayrosh headlines Flavor Artist Live. Date to be announced.", "ay-cover.jpg", "2026-10-25", "center 30%"),
 ("sunday-reset", ["music"], "Flavor Playlist", "Sunday Reset: six songs for a slow Sunday", "Flavor Playlist Vol. 01, from Sade to Black Coffee and Msaki.", "sunday-reset-poster.jpg", "2026-10-25", "center"),
 ("true-colors-at-40", ["culture"], "Flavor Rewind", "True Colors at 40: Cyndi Lauper's No. 1, four decades on", "Forty years ago today, a quiet ballad went to No. 1.", "tc-beret.jpg", "2026-10-25", "center 20%"),
 ("lupita-in-their-words", ["culture"], "In Their Words", "In Their Words: Lupita Nyong'o on beauty", "“You can't eat beauty. It doesn't feed you.”", "itw-lupita.jpg", "2026-10-25", "center 30%"),
 ("mr-eazi", ["money"], "Money Moves", "Mr Eazi: singer, investor, owner", "Seven moves that turned an Afrobeats star into a business.", "me-cover.jpg", "2026-10-26", "center 20%"),
 ("savara", ["features", "music"], "Flavor Feature", "Savara: the rhythm before the spotlight", "After 17 years helping shape Sauti Sol's sound, Savara is making room for a sound of his own.", "savara-1.jpg", "2026-10-26", "center 0%"),
 ("tg-blk", ["music"], "Flavor Spotlight", "tg.blk: the Mombasa bedroom producer opening doors for alternative music", "The artist to watch from the coast.", "tg-2026.jpg", "2026-10-27", "center 25%"),
 ("made-in-lagos", ["culture"], "Flavor Rewind", "Made in Lagos at six", "How Wizkid's fourth album rewrote Africa's chart records.", "mil-stage.jpg", "2026-10-30", "center 25%"),
 ("mugithi-decoded", ["culture"], "Flavor Decoded", "Mugithi, decoded", "One voice, one guitar, and a whole room holding on. What mugithi is and where it came from.", "ay-live.jpg", "2026-11-02", "center 30%"),
 ("ballon-dor-2026", ["sport"], "Flavor Sports", "Kane ends England’s wait. Putellas makes it three.", "Harry Kane and Alexia Putellas lead a night of winners, records and new ground for the Ballon d’Or in London.", "bdor-kane-putellas.jpg", "2026-10-27", "center"),
 ("jay-z-super-bowl-lxi", ["news", "music"], "The Wrap", "From NFL partner to Super Bowl headliner: Jay-Z takes the Super Bowl stage", "Jay-Z will headline the Apple Music Super Bowl LXI Halftime Show in the 30th-anniversary year of Reasonable Doubt.", "jay-z-super-bowl-lxi-thumb.jpg", "2026-10-27", "center 40%"),
 ("tyla-that-girl-scholarship", ["news", "music"], "The Wrap", "Tyla opens music scholarships to South African students", "Four of 10 US$5,000 awards are reserved for South African students. Applications may close early.", "tyla-instagram.jpg", "2026-10-27", "center 0%"),
 ("patrick-stewart-dies-at-86", ["news", "screen"], "The Wrap", "Sir Patrick Stewart dies at 86", "The Star Trek and X-Men actor died at his home in Los Angeles on 28 October.", "wr-patrick-stewart.jpg", "2026-10-29", "center 20%"),
 ("fame-week-africa", ["news", "music"], "The Wrap", "From brief to beat: FAME Week pairs African music makers with storytellers", "A songwriting camp links music creators with screen and content briefs, while raising questions about credit, licensing and fair pay.", "fame-week-africa-logo.jpg", "2026-10-28", "center"),
 ("idris-elba-kenya-creative-economy", ["news", "money"], "The Wrap", "Kenya signs a creative economy deal with Idris Elba", "Funding, AI training and global market access for young Kenyan creatives.", "wr-idris-elba.jpg", "2026-11-06T17:10", "70% 25%"),
 ("joshua-baraka-visa-ambassador", ["news", "music"], "The Wrap", "Joshua Baraka becomes Visa's first Ugandan brand ambassador", "The deal starts with his B'rakaland EA show in Kampala on 28 November.", "wr-joshua-baraka.jpg", "2026-11-06T17:20", "40% 25%"),
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
 "jay-z-super-bowl-lxi": "Global",
 "tyla-that-girl-scholarship": "Continental",
 "fame-week-africa": "Continental",
 "patrick-stewart-dies-at-86": "Global",
 "idris-elba-kenya-creative-economy": "Local", "joshua-baraka-visa-ambassador": "Continental",
 "tems-children-of-blood-and-bone-soundtrack": "Continental",
}
# Fan Seat in the app (added 10 Nov 2026): set this when a Flavor Artist Live artist is confirmed and the app's Live tab
# starts taking fans' questions for them; set it back to None to close it. "show" is a short code for that show.
# Example: FAN_SEAT = {"show": "2026-11-artist", "artist": "Artist Name", "line": "Flavor Artist Live · 29 Nov"}
# Optional: "blurb" (the line under the heading) and "done" (shown after a fan's third question), for interviews etc.
FAN_SEAT = {"show": "2026-11-anwar-saa-zone", "artist": "Anwar",
            "line": "We're sitting down with Anwar Hassanali of Saa Zone",
            "blurb": "What should we ask him? The best questions go into the interview.",
            "done": "We'll take the best ones into the interview."}
HERO = {"nairobi-new-sound"}   # the big top story (hand-set in index.html)
# Editor's picks rotate every day from the long-form stories of the last PICK_DAYS days.
PICK_TAGS = {"The Flavor Cover", "Flavor Feature", "Money Moves", "Flavor Roots", "Flavor Rewind", "Flavor Decoded",
             "The Verdict", "Flavor Spotlight", "In Their Words", "Flavor Fashion", "Flavor Artist Live"}
PICK_DAYS = 30
PICKJS = ('<script>(function(){var g=document.querySelector(".sides[data-pool]");if(!g)return;'
          'var now=new Date(Date.now()+108e5),d=now.toISOString().slice(0,16),day=Math.floor(now.getTime()/864e5);'
          'var k=[].slice.call(g.children).filter(function(c){if(c.getAttribute("data-pub")>d){c.remove();return false}return true});'
          'var n=k.length;if(n<4)return;var st=(day*3)%n;'
          'for(var i=0;i<n;i++)g.appendChild(k[(st+i)%n])})();</script>')


def nice(d):
    return datetime.date.fromisoformat(d[:10]).strftime("%-d %b %Y")


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


SCHED = ('<script>(function(){var d=new Date(Date.now()+108e5).toISOString().slice(0,16);'
         'document.querySelectorAll("[data-pub]").forEach(function(x){if(x.getAttribute("data-pub")>d)x.remove()});'
         'var seen={};document.querySelectorAll("[data-limit]").forEach(function(g){var n=+g.getAttribute("data-limit");'
         '[].slice.call(g.children).forEach(function(c){if(seen[c.getAttribute("href")])c.remove()});'
         '[].slice.call(g.children).forEach(function(c,i){if(i>=n)c.remove();else if(!g.hasAttribute("data-pool"))seen[c.getAttribute("href")]=1})})})();</script>')


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


# Google Analytics (GA4) + cookie notice, added 30 Oct 2026. _site.py puts these on every
# page each time it runs (so new stories get them too). Measurement ID comes from
# Google Analytics > Admin > Data streams > Flavor Africa Website.
GA_ID = "G-DXW50Q0F0K"
GA_HEAD = ('<!--ga--><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}'
           'gtag("consent","default",{analytics_storage:"denied",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied",'
           'region:["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IS","IE","IT","LV","LI","LT","LU","MT","NL","NO","PL","PT","RO","SK","SI","ES","SE","GB","CH"]});'
           'gtag("consent","default",{analytics_storage:"granted",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied"});'
           'try{var c=localStorage.getItem("fa-cookies");if(c)gtag("consent","update",{analytics_storage:c==="yes"?"granted":"denied"})}catch(e){}'
           'gtag("js",new Date());gtag("config","%s");</script>'
           '<script async src="https://www.googletagmanager.com/gtag/js?id=%s"></script><!--/ga-->' % (GA_ID, GA_ID))
GA_BODY = ('<!--cookies--><style>.cookie-note{position:fixed;left:16px;right:16px;bottom:16px;z-index:999;max-width:560px;margin:0 auto;background:#15102A;color:#fff;border-top:4px solid #2A0174;padding:14px 16px;display:flex;flex-wrap:wrap;align-items:center;gap:12px 16px;box-shadow:0 8px 28px rgba(21,16,42,.25);font-family:var(--body)} .cookie-note[hidden]{display:none} .cookie-note p{margin:0;flex:1 1 260px;font-size:13px;line-height:1.5} .cookie-btns{display:flex;gap:8px} .cookie-btns button{font-family:var(--mono);font-size:12px;letter-spacing:.06em;text-transform:uppercase;padding:9px 14px;border:1px solid rgba(255,255,255,.4);background:transparent;color:#fff;cursor:pointer} .cookie-btns button.ok{background:#fff;color:#2A0174;border-color:#fff} .cookie-btns button:focus-visible{outline:2px solid #F5CC11;outline-offset:2px}</style><div class="cookie-note" id="cookie-note" role="region" aria-label="Cookie notice" hidden>'
           '<p>We use cookies to count visits and see which stories people read. Nothing is sold or used for ads.</p>'
           '<div class="cookie-btns"><button type="button" data-c="no">No thanks</button><button type="button" data-c="yes" class="ok">Okay</button></div></div>'
           '<script>(function(){var n=document.getElementById("cookie-note");if(!n)return;var s=null;try{s=localStorage.getItem("fa-cookies")}catch(e){}'
           'if(!s)n.hidden=false;n.addEventListener("click",function(ev){var v=ev.target.getAttribute("data-c");if(!v)return;'
           'try{localStorage.setItem("fa-cookies",v)}catch(e){}if(window.gtag)gtag("consent","update",{analytics_storage:v==="yes"?"granted":"denied"});n.hidden=true})})();</script><!--/cookies-->')


def add_analytics(h):
    """Put the GA tag in <head> and the cookie notice before </body>, replacing any older copy."""
    h = re.sub(r"<!--ga-->.*?<!--/ga-->", "", h, flags=re.S)
    h = re.sub(r"<!--cookies-->.*?<!--/cookies-->", "", h, flags=re.S)
    h = h.replace("</head>", GA_HEAD + "</head>", 1)
    return h.replace("</body>", GA_BODY + "</body>", 1)


# App mode (installable web app), added 10 Nov 2026. manifest.webmanifest + sw.js + icons/
# let people add the site to their home screen; it then opens full screen like an app.
# The banner below invites them once (Android: one-tap install; iPhone: Share > Add to Home
# Screen), waits until the cookie notice is answered, and stays away for 30 days if dismissed.
PWA_HEAD = ('<!--pwa--><link rel="manifest" href="/manifest.webmanifest">'
            '<meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes">'
            '<meta name="apple-mobile-web-app-title" content="Flavor Africa"><meta name="apple-mobile-web-app-status-bar-style" content="default">'
            # App feel: when opened from the home-screen icon, <html> gets class "app": no section strip, a bottom tab bar,
            # a purple splash on the first open of a session, no tap flash, and a quick fade-in. The normal website is unchanged.
            '<script>(function(){var r=document.documentElement;if((window.matchMedia&&matchMedia("(display-mode: standalone)").matches)||navigator.standalone===true){r.classList.add("app");document.write(\'<link rel="stylesheet" href="/app/app.css">\');'
            'try{if(!sessionStorage.getItem("fa-splash"))r.classList.add("splash")}catch(e){}}})();</script>'
            '<style>.fa-tabs{display:none}html.app{-webkit-tap-highlight-color:transparent}html.app .sub{display:none}html.app #open{visibility:hidden}html.app .bar{padding-block:8px}'
            'html.app body{padding-bottom:calc(66px + env(safe-area-inset-bottom,0px))}html.app header,html.app .fa-tabs{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}'
            'html.app .fa-tabs{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));position:fixed;left:0;right:0;bottom:0;z-index:35;background:var(--paper);border-top:1px solid var(--line);touch-action:manipulation;'
            'padding:4px max(4px,env(safe-area-inset-left,0px)) calc(4px + env(safe-area-inset-bottom,0px)) max(4px,env(safe-area-inset-right,0px))}'
            '.fa-tabs a,.fa-tabs button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-height:54px;padding:4px 0;background:none;border:0;cursor:pointer;'
            'font-family:var(--mono);font-size:10px;line-height:1;letter-spacing:.1em;text-transform:uppercase;color:var(--mute);text-decoration:none}'
            '.fa-tabs svg{width:22px;height:22px}.fa-tabs [aria-current="page"]{color:var(--accent)}.fa-tabs [aria-current="page"] svg{stroke-width:2.2}'
            'html.app .cookie-note{bottom:calc(76px + env(safe-area-inset-bottom,0px))}'
            '.fa-splash{position:fixed;inset:0;z-index:1000;background:#2A0174 url(/icons/app-512.png) center/132px no-repeat;pointer-events:none;transition:opacity .3s ease}.fa-splash.out{opacity:0}'
            '@keyframes fa-in{from{opacity:.35}}html.app main{animation:fa-in .2s ease-out}@media (prefers-reduced-motion:reduce){html.app main{animation:none}}</style><!--/pwa-->')
PWA_BODY = ('<!--install--><nav class="fa-tabs" aria-label="App"><a href="index.html" data-t="home"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9v11h14V9"/></svg>Home</a><a href="index.html#flavor-10" data-t="f10"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 20V11M10 20V4M15 20v-6M20 20V8"/></svg>Flavor 10</a><a href="live.html" data-t="live"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8a2 2 0 0 0 0 4 2 2 0 0 0 0 4v2h18v-2a2 2 0 0 0 0-4 2 2 0 0 0 0-4V6H3z"/><path d="M14 6v12" stroke-dasharray="2 2"/></svg>Live</a><button type="button" data-t="saved" aria-label="Saved stories"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5h12v17l-6-4.2-6 4.2z"/></svg>Saved</button><button type="button" data-t="menu" aria-label="Open menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>Menu</button></nav><script>(function(){var r=document.documentElement;if(!r.classList.contains("app"))return;var n=document.querySelector(".fa-tabs");if(!n)return;var p=location.pathname.split("/").pop()||"index.html",t=p==="index.html"?(location.hash==="#flavor-10"?"f10":"home"):p==="live.html"?"live":"";window.addEventListener("hashchange",function(){if(p!=="index.html")return;[].forEach.call(n.querySelectorAll("a"),function(a){a.removeAttribute("aria-current")});var k=n.querySelector("[data-t="+(location.hash==="#flavor-10"?"f10":"home")+"]");if(k)k.setAttribute("aria-current","page")});if(t){var a=n.querySelector("[data-t="+t+"]");if(a)a.setAttribute("aria-current","page")}n.querySelector("[data-t=menu]").addEventListener("click",function(){var o=document.getElementById("open");if(o)o.click()});var js=document.createElement("script");js.src="/app/app.js";document.body.appendChild(js);if(r.classList.contains("splash")){r.classList.remove("splash");try{sessionStorage.setItem("fa-splash","1")}catch(e){}var sp=document.createElement("div");sp.className="fa-splash";sp.setAttribute("aria-hidden","true");document.body.appendChild(sp);var gone=false,done=function(){if(gone)return;gone=true;sp.classList.add("out");setTimeout(function(){sp.remove()},350)};setTimeout(done,700);setTimeout(done,2500)}})();</script><style>.fa-install{position:fixed;left:16px;right:16px;bottom:16px;z-index:998;max-width:560px;margin:0 auto;background:#15102A;color:#fff;'
            'border-top:4px solid #F5CC11;padding:14px 16px;display:flex;flex-wrap:wrap;align-items:center;gap:12px 14px;box-shadow:0 8px 28px rgba(21,16,42,.25);font-family:var(--body);'
            'padding-bottom:calc(14px + env(safe-area-inset-bottom,0px))} .fa-install[hidden]{display:none} .fa-install img{width:44px;height:44px;flex:0 0 44px;border-radius:10px}'
            ' .fa-install p{margin:0;flex:1 1 220px;font-size:13px;line-height:1.5} .fa-install svg{vertical-align:-3px} .fa-install .btns{display:flex;gap:8px;margin-left:auto}'
            ' .fa-install button{font-family:var(--mono);font-size:12px;letter-spacing:.06em;text-transform:uppercase;padding:10px 14px;min-height:40px;border:1px solid rgba(255,255,255,.4);background:transparent;color:#fff;cursor:pointer}'
            ' .fa-install button.ok{background:#F5CC11;color:#2A0174;border-color:#F5CC11;font-weight:600} .fa-install button:focus-visible{outline:2px solid #F5CC11;outline-offset:2px}'
            ' .fa-install[data-mode=ios] .i-and,.fa-install[data-mode=and] .i-ios,.fa-install[data-mode=app] .i-and,.fa-install[data-mode=app] .i-ios,.fa-install:not([data-mode=app]) .i-app{display:none}</style>'
            '<div class="fa-install" id="fa-install" role="region" aria-label="Add flavor.africa to your home screen" hidden>'
            '<img src="/icons/app-192.png" alt="">'
            '<p class="i-and">Put <b>flavor.africa</b> on your home screen. It opens full screen, just like an app.</p>'
            '<p class="i-ios">Get <b>flavor.africa</b> on your home screen: tap the Share button '
            '<svg aria-label="Share" role="img" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5CC11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 11v9h14v-9"/></svg>'
            ' then <b>Add to Home Screen</b>.</p>'
            # inside another app's mini browser (Instagram, the Google app...) there is no Add to Home Screen, so say so
            '<p class="i-app">Want <b>flavor.africa</b> as an app? Open this page in <b>Safari</b> or <b>Chrome</b> first. Tap the menu (&#8226;&#8226;&#8226; or Share) and choose <b>Open in browser</b>.</p>'
            '<div class="btns"><button type="button" data-i="no">Not now</button><button type="button" data-i="add" class="ok i-and">Add it</button>'
            '<button type="button" data-i="ok" class="ok i-ios">Got it</button><button type="button" data-i="copy" class="ok i-app">Copy link</button></div></div>'
            '<script>(function(){if("serviceWorker" in navigator)window.addEventListener("load",function(){navigator.serviceWorker.register("/sw.js").catch(function(){})});if(/^\\/(index|live)?(\\.html)?$/.test(location.pathname)){var fj=document.createElement("script");fj.src="/app/fanseat.js";document.body.appendChild(fj)}'
            'var app=(window.matchMedia&&matchMedia("(display-mode: standalone)").matches)||navigator.standalone===true;if(app)return;'
            'var b=document.getElementById("fa-install");if(!b)return;var K="fa-install",t=0;try{t=+localStorage.getItem(K)||0}catch(e){}if(Date.now()-t<2592e6)return;'
            'var ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1),ev=null,shown=false;'
            'function show(m){if(shown)return;shown=true;b.setAttribute("data-mode",m);(function go(){var c=document.getElementById("cookie-note");if(c&&!c.hidden){setTimeout(go,1500);return}b.hidden=false})()}'
            'function later(m){setTimeout(function(){show(m)},6000)}'
            'window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();ev=e;if(!inapp)later("and")});'
            'var inapp=/GSA\\/|Instagram|FBAN|FBAV|FB_IAB|TikTok|musical_ly|Bytedance|Twitter|LinkedInApp|Snapchat|Line\\/|MicroMessenger|Pinterest/i.test(navigator.userAgent);'
            'if(inapp)later("app");else if(ios)later("ios");'
            'b.addEventListener("click",function(e){var a=e.target.closest("[data-i]");if(!a)return;if(a.getAttribute("data-i")==="copy"){try{navigator.clipboard.writeText("https://flavorafricagroup.org/").then(function(){a.textContent="Copied"})}catch(x){}return}if(a.getAttribute("data-i")==="add"&&ev){ev.prompt();ev=null}'
            'try{localStorage.setItem(K,String(Date.now()))}catch(x){}b.hidden=true});'
            'window.addEventListener("appinstalled",function(){b.hidden=true})})();</script><!--/install-->')


def add_pwa(h):
    """Link the app manifest in <head> and add the home-screen banner before </body>, replacing any older copy."""
    h = re.sub(r"<!--pwa-->.*?<!--/pwa-->", "", h, flags=re.S)
    h = re.sub(r"<!--install-->.*?<!--/install-->", "", h, flags=re.S)
    h = h.replace("</head>", PWA_HEAD + "</head>", 1)
    return h.replace("</body>", PWA_BODY + "</body>", 1)


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
    url, im, iso = URL + f, URL + "img/" + img, (date + ":00+03:00") if "T" in date else (date + "T08:00:00+03:00")
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
    # Every story goes into Latest (newest first). The Wrap and Culture & Sport blocks
    # below hide whatever Latest is already showing (done in the browser, so it stays
    # right as scheduled stories go live).
    today = (datetime.datetime.utcnow() + datetime.timedelta(hours=3)).date()
    pool = [s for s in newest(STORIES) if s[2] in PICK_TAGS and s[0] not in HERO
            and (today - datetime.date.fromisoformat(s[6][:10])).days <= PICK_DAYS]
    sides = '<div class="sides" data-pool data-limit="3">%s</div>%s</section>' % ("".join(hs(s) for s in pool), PICKJS)
    h, n = re.subn(r'<div class="sides"[^>]*>.*?</section>', lambda m: sides, h, count=1, flags=re.S)
    assert n == 1
    latest = [s for s in newest(STORIES) if s[0] not in HERO]
    h, n = re.subn(r'<div class="hgrid"[^>]*>.*?</div></section>', lambda m: '<div class="hgrid" data-limit="6">%s</div></section>' % "".join(hc(s) for s in latest), h, count=1, flags=re.S)
    assert n == 1
    wrap = newest([s for s in STORIES if "news" in s[1]])
    cult = newest([s for s in STORIES if ("culture" in s[1] or "sport" in s[1])])
    blocks = ('<section class="wrap block" id="the-wrap"><div class="secbar"><h2>The Wrap</h2><a href="news.html">All news »</a></div>'
              '<div class="wrapgrid" data-limit="6">%s</div></section>'
              '<section class="wrap block"><div class="secbar"><h2>Culture &amp; Sport</h2><a href="culture.html">More culture »</a></div>'
              '<div class="hgrid" data-limit="3">%s</div></section>') % ("".join(hs(s) for s in wrap), "".join(hc(s) for s in cult))
    h, n = re.subn(r'(<section class="wrap block" id="the-wrap">.*?</section><section class="wrap block"><div class="secbar"><h2>Culture &amp; Sport</h2>.*?</section>'
                   r'|<section class="wrap block"><div class="secbar"><h2>Quick reads</h2>.*?</section>)', lambda m: blocks, h, count=1, flags=re.S)
    assert n == 1
    wr("index.html", add_sched(h))


# ---- The Flavor 10 · Kenya (homepage chart, from _charts/flavor10/data/*.json) ----
def flavor10_html():
    import glob, json, random
    files = sorted(glob.glob(os.path.join(SITE, "_charts", "flavor10", "data", "*.json")))
    if not files:
        return ""
    ed = json.load(open(files[-1]))
    prev = json.load(open(files[-2]))["songs"] if len(files) > 1 else None
    ever = {(s["title"].lower(), s["artist"].lower()) for f in files[:-1] for s in json.load(open(f))["songs"]}
    last = {(s["title"].lower(), s["artist"].lower()): i for i, s in enumerate(prev or [], 1)}
    top = max(s["points"] for s in ed["songs"])
    rows = []
    for i, s in enumerate(ed["songs"], 1):
        k = (s["title"].lower(), s["artist"].lower())
        if prev is None: mv = ""
        elif k in last:
            d = last[k] - i
            mv = ('<span class="mv up">▲%d</span>' % d) if d > 0 else ('<span class="mv down">▼%d</span>' % -d) if d < 0 else '<span class="mv">–</span>'
        else:
            mv = '<span class="mv re">RE</span>' if k in ever else '<span class="mv new">FRESH</span>'
        W = 300 * s["points"] / top
        random.seed(i * 7 + 3)
        bars = "".join('<rect x="%d" y="%.1f" width="2.4" height="%.1f" rx="1.2"/>' % (x, (24 - v) / 2, v)
                       for x in range(0, int(W), 5) for v in [min(24, 6 + 18 * abs(random.gauss(.55, .28)))])
        lead = re.split(r" ft\. |, | & ", s["artist"])[0]
        q = "%s %s" % (s["title"], lead)
        rows.append('<li%s data-q="%s" data-id="%s" data-t="%s" data-a="%s"><span class="f10-rk">%02d%s</span>'
                    '<div class="f10-t"><b>%s</b><span>%s</span><svg class="f10-wave" viewBox="0 0 %.0f 24" preserveAspectRatio="none" style="width:%.0f%%" aria-hidden="true">%s</svg></div>'
                    '<button class="f10-btn" type="button" aria-label="Play %s"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="pl" d="M8 5.5v13l11-6.5z"/><path class="pa" d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z"/></svg></button></li>'
                    % (' class="one"' if i == 1 else "", e(q), e(s.get("apple", "")), e(s["title"]), e(s["artist"]), i, mv,
                       e(s["title"]), e(s["artist"]), W, 100 * s["points"] / top, bars, e(s["title"])))
    player = ('<aside class="f10-pl" aria-label="Flavor 10 player"><div class="f10-art"><img alt="" hidden><span class="f10-ph">flavor.<b>10</b></span></div>'
              '<div class="f10-now"><span class="tag">Now playing</span><b id="f10-title">%s</b><span id="f10-artist">%s</span></div>'
              '<div class="f10-ctl"><button class="f10-big" type="button" aria-label="Play preview"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="pl" d="M8 5.5v13l11-6.5z"/><path class="pa" d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z"/></svg></button>'
              '<div class="f10-prog"><i></i></div><span class="f10-time">0:30</span></div>'
              '<p class="f10-note">30-second previews. Listen in full:</p><div class="f10-links"><a id="f10-sp" target="_blank" rel="noopener">Spotify</a><a id="f10-am" target="_blank" rel="noopener">Apple Music</a><a id="f10-yt" target="_blank" rel="noopener">YouTube</a></div>'
              '<audio preload="none"></audio></aside>' % (e(ed["songs"][0]["title"]), e(ed["songs"][0]["artist"])))
    return ('<section class="wrap block" id="flavor-10"><div class="secbar"><h2>The Flavor 10 · Kenya</h2>'
            '<a href="charts.html">More charts »</a></div><p class="f10-sub">%s · What Kenya is playing today. Tap a song to listen.</p>'
            '<div class="f10-grid"><ol class="f10">%s</ol>%s</div>'
            '<p class="f10-src"><b>Sources:</b> %s. Updated daily.</p></section>%s'
            % (e(ed["label"].title().replace("Of", "of")), "".join(rows), player,
               " · ".join(SRC_LABEL[c] for c in "PFSYRAM" if c in ed.get("sources", {})), F10JS))


SRC_LABEL = {"P": "Apple Music", "F": "Spotify", "S": "Shazam", "Y": "YouTube", "R": "Kenyan radio", "A": "Audiomack", "M": "Mdundo"}


F10JS = r"""<script>(function(){var sec=document.getElementById("flavor-10");if(!sec)return;
var rows=[].slice.call(sec.querySelectorAll(".f10 li")),au=sec.querySelector("audio"),img=sec.querySelector(".f10-art img"),ph=sec.querySelector(".f10-ph"),
big=sec.querySelector(".f10-big"),bar=sec.querySelector(".f10-prog i"),tm=sec.querySelector(".f10-time"),cur=null,cache={},n=0;
function jsonp(u,cb){var k="f10cb"+(n++),s=document.createElement("script"),done=false;window[k]=function(d){done=true;delete window[k];s.remove();cb(d)};
s.onerror=function(){if(!done){delete window[k];cb(null)}};s.src=u+"&callback="+k;document.body.appendChild(s);setTimeout(function(){if(!done){done=true;cb(null)}},8000)}
function find(li,cb){var q=li.dataset.q,id=li.dataset.id;if(cache[q])return cb(cache[q]);
var want=norm(li.dataset.t);function norm(s){return (s||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim()}
function pick(d){var r=d&&d.results&&d.results.filter(function(x){var n=norm(x.trackName);return x.previewUrl&&(n.indexOf(want)===0||want.indexOf(n)===0||n.indexOf(want.split(" ")[0])===0)})[0];if(r)cache[q]=r;return r}
var search=function(){jsonp("https://itunes.apple.com/search?country=ke&entity=song&limit=5&term="+encodeURIComponent(q),function(d){cb(pick(d))})};
if(id)jsonp("https://itunes.apple.com/lookup?country=ke&id="+id,function(d){var r=pick(d);r?cb(r):search()});else search()}
function links(li,r){var q=encodeURIComponent(li.dataset.q);sec.querySelector("#f10-sp").href="https://open.spotify.com/search/"+q;
sec.querySelector("#f10-yt").href="https://www.youtube.com/results?search_query="+q;sec.querySelector("#f10-am").href=r&&r.trackViewUrl?r.trackViewUrl:"https://music.apple.com/ke/search?term="+q}
function show(li,r){sec.querySelector("#f10-title").textContent=li.dataset.t;sec.querySelector("#f10-artist").textContent=li.dataset.a;links(li,r);
if(r&&r.artworkUrl100){img.src=r.artworkUrl100.replace("100x100","600x600");img.hidden=false;ph.hidden=true}else{img.hidden=true;ph.hidden=false}}
function state(){rows.forEach(function(x){x.classList.toggle("on",x===cur&&!au.paused)});sec.classList.toggle("playing",!au.paused)}
function play(li){if(cur===li&&au.src){au.paused?au.play():au.pause();return}cur=li;au.pause();bar.style.width="0";rows.forEach(function(x){x.classList.toggle("sel",x===li)});
li.classList.add("load");find(li,function(r){li.classList.remove("load");show(li,r);if(cur!==li)return;
if(r){au.src=r.previewUrl;au.play().catch(function(){})}else{au.removeAttribute("src");sec.querySelector(".f10-note").textContent="No preview for this one. Listen in full:"}})}
rows.forEach(function(li){li.addEventListener("click",function(ev){if(ev.target.closest("a"))return;play(li)})});
big.addEventListener("click",function(){play(cur||rows[0])});
au.addEventListener("play",state);au.addEventListener("pause",state);au.addEventListener("ended",function(){var i=rows.indexOf(cur);state();if(i<rows.length-1)play(rows[i+1])});
au.addEventListener("timeupdate",function(){if(au.duration){bar.style.width=(100*au.currentTime/au.duration)+"%";tm.textContent="0:"+("0"+Math.max(0,Math.ceil(au.duration-au.currentTime))).slice(-2)}});
rows[0].classList.add("sel");cur=null;links(rows[0],null);find(rows[0],function(r){if(r&&!cur)show(rows[0],r)})})();</script>"""


def build_flavor10():
    h = rd("index.html")
    block = flavor10_html()
    h = re.sub(r'<section class="wrap block" id="flavor-10">.*?</section>', "", h, flags=re.S)
    # remove the chart's player script too, or every rebuild would add another copy
    h = re.sub(r'<script>\(function\(\)\{var sec=document\.getElementById\("flavor-10"\).*?</script>', "", h, flags=re.S)
    if block:
        h = h.replace('<section class="band">', block + '<section class="band">', 1)
    wr("index.html", h)


def nairobi_today():
    return (datetime.datetime.utcnow() + datetime.timedelta(hours=3)).date()


LIVE_ROBOTS = '<meta name="robots" content="index,follow,max-image-preview:large">'
SCHED_ROBOTS = '<meta name="robots" content="noindex,follow">'


def mark_scheduled():
    """Keep search engines off a scheduled story's page until its date (Nairobi time).
    While a story is in the future its robots tag says noindex; on the day it's switched back."""
    today = nairobi_today().isoformat()
    for s in STORIES:
        f = s[0] + ".html"
        if not os.path.exists(os.path.join(SITE, f)):
            continue
        h = rd(f)
        if s[6][:10] > today:
            new = h.replace(LIVE_ROBOTS, SCHED_ROBOTS) if LIVE_ROBOTS in h else (
                h if SCHED_ROBOTS in h else h.replace("<head>", "<head>" + SCHED_ROBOTS, 1))
        else:
            new = h.replace(SCHED_ROBOTS, LIVE_ROBOTS)
        if new != h:
            wr(f, new)


def build_sitemap():
    today = nairobi_today().isoformat()
    live = [s for s in STORIES if s[6][:10] <= today]  # scheduled stories join the sitemap on their date
    pages = ["index.html", "news.html"] + [k + ".html" for k in SECTIONS if k != "news"] + ["about.html"] + [s[0] + ".html" for s in live]
    seen, rows = set(), []
    for p in pages:
        if p in seen:
            continue
        seen.add(p)
        loc = URL if p == "index.html" else URL + p
        rows.append("<url><loc>%s</loc><lastmod>%s</lastmod></url>" % (loc, today))
    wr("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n%s\n</urlset>\n' % "\n".join(rows))


def build_app_feed():
    """app/feed.json: what the home-screen app reads for Flavor Daily, Saved and For You (added 10 Nov 2026).
    Every story is listed with its date; the app itself hides stories dated in the future."""
    import glob, json
    os.makedirs(os.path.join(SITE, "app"), exist_ok=True)
    f10 = None
    files = sorted(glob.glob(os.path.join(SITE, "_charts", "flavor10", "data", "*.json")))
    if files:
        ed = json.load(open(files[-1]))
        if ed.get("songs"):
            f10 = {"t": ed["songs"][0]["title"], "a": ed["songs"][0]["artist"], "label": ed.get("label", ""), "id": ed["songs"][0].get("apple", ""),
                   "songs": [{"t": x["title"], "a": x["artist"]} for x in ed["songs"]]}
    out = {"hero": sorted(HERO)[0] if HERO else "", "f10": f10, "fanseat": FAN_SEAT,
           "stories": [{"s": s[0], "c": s[1], "t": s[2], "h": s[3], "d": s[4], "i": "img/" + s[5], "p": s[6], "o": s[7]}
                       for s in newest(STORIES)]}
    with open(os.path.join(SITE, "app", "feed.json"), "w") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))


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
            wr(f, add_pwa(add_analytics(link_menu(fix_nav(f, rd(f)), pages))))
    build_sections()
    build_home()
    build_flavor10()
    build_sitemap()
    build_app_feed()
    mark_scheduled()
    print("site rebuilt")
