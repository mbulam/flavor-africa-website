FLAVOR AFRICA WEBSITE - HOW IT WORKS
(Give this file to any AI or developer before asking for changes.)

WHAT THIS IS
A plain static website: HTML pages + one stylesheet + an img folder.
No database, no login. Open index.html in a browser to preview it.
To publish: upload the whole folder to Cloudflare Pages, Netlify or any web host.

FILES
index.html            Home page (top story, Latest News, Trending, Flavor Playlist,
                      Ayrosh Live band, Culture, More stories)
music.html, screen.html, fashion.html, money.html, sport.html,
culture.html, features.html, live.html   Section pages
about.html            About + contact (Samuel Wambua, CEO)
[story].html          One page per article, e.g. mr-eazi.html, ayrosh.html
style.css             All design: colours, fonts, spacing (shared by every page)
img/                  All photos and the Sunday Reset video
_builder.py           Optional: the Python script that originally generated
                      every page. You do NOT need it. If you edit the HTML files
                      directly, ignore this script (re-running it would overwrite
                      hand edits).

DESIGN RULES (keep these)
- Billboard-style: white page, thin grey rules, thick purple bars above sections.
- Colours: purple #2A0174, yellow #F5CC11 (yellow only for small tags), ink #15102A.
- Fonts: Barlow Condensed (headlines, uppercase, not too bold), Poppins (body),
  DM Mono (small labels/dates). Elegant, not overly colourful or heavy.
- Every fact must be checked against 2+ sources before publishing.

HOW TO ADD A NEW STORY
1. Copy an existing story page that fits (e.g. mr-eazi.html for a carousel-style
   story) and rename it, e.g. new-story.html.
2. Replace the tag, headline, intro line, date and each section's text.
3. Put the photos in img/ (sharp originals, ideally 1200px+ wide, .jpg) and
   update the <img src="img/..."> paths.
4. Add the story to index.html: add a new row at the TOP of the "Latest News"
   list (copy an existing <a class="row"> block). Optionally swap it into
   Trending or a card block.
5. Add a card for it on its section page (copy an <a class="card"> block).
6. Check it on a phone-width screen before publishing.

LONG-FORM ARTICLES (added 26 Oct 2026)
The ten story pages (mr-eazi, ayrosh, tg-blk, nairobi-new-sound, made-in-lagos,
soul-makossa, lagos-fashion-week, watchlist, sunday-reset) now carry full
articles. Their text lives in _articles/*.py, one file per story, with a
Sources list at the bottom of each. To change an article, edit its .py file
and run:  python3 _articles/build.py
That rewrites only the article body and <title> of each page; the header,
menu and footer are left alone. Every fact must still be checked against
2+ independent sources; anything single-sourced was left out.

SEO, SOCIALS AND CHARTS (added 26 Oct 2026)
- Every page's <head> carries a meta description, canonical URL, Open Graph /
  Twitter tags (the share preview on WhatsApp, Instagram DMs, X) and schema.org
  JSON-LD (NewsArticle on stories). When you copy a story page for a new
  story, update those lines too: title, description, canonical/og:url,
  og:image, datePublished.
- Add each new page to sitemap.xml. robots.txt points search engines to it.
- Socials (Instagram, TikTok, YouTube) sit in the header (desktop), the menu,
  and the footer (not on the cover photo).
- The scrolling ticker under the homepage hero is the <div class="ticker">
  block in index.html. Edit the <span> items in BOTH .tk-run copies.
- charts.html is the Charts section (Flavor Charts, every Tuesday).

ADDING STORIES THE EASY WAY (added 26 Oct 2026, replaces the manual steps above)
1. Write the article as _articles/<name>.py (copy any existing one; a caption can
   take a photo credit as a third item, e.g. ("img", "img/x.jpg", "Caption", "@handle / Instagram")).
2. Add one line for it to STORIES in _site.py: slug, sections, tag, title,
   teaser, image, date (YYYY-MM-DD, Nairobi time), image focus.
3. Run:  python3 _site.py && python3 _articles/build.py
That creates the page if it's new and rebuilds every section page, the News page,
the homepage Latest / The Wrap / Culture & Sport blocks and sitemap.xml.
SCHEDULING: stories dated in the future stay hidden from every listing until their
date (Nairobi time), so you can publish ahead. Until their date they're also kept out
of sitemap.xml and marked noindex, so Google can't find them early; the daily 06:10
GitHub Action releases them on the day. To preview one, open its link directly
(e.g. flavorafricagroup.org/made-in-lagos.html).
Sections: news (The Wrap), music, charts, screen, fashion, money, sport, culture,
features, live. A story can sit in more than one.

SEGMENT CHIPS (added 27 Oct 2026)
The segment names under each section heading (e.g. Music: The Drop, Flavor Playlist...) are
clickable filters, built by _site.py. A chip shows the cards whose tag matches its name; menu
sub-links open the same filtered view (e.g. music.html#flavor-playlist). News chips use the
EDITION list in _site.py (Local / Continental / Global) - add each new news story there.

HOMEPAGE LATEST (added 27 Oct 2026)
Every story added to STORIES in _site.py now appears in the homepage's Latest
grid automatically (newest first, 6 shown), whatever its section. The Wrap and
Culture & Sport blocks below skip anything Latest is already showing, so no story
appears twice. Stories in the top hero/Editor's picks stay out of Latest.
For tall/portrait posters, make a separate square "-thumb.jpg" crop for the cards
so the homepage thumbnail shows the subject, not the poster's text.

AUTOMATIC UPDATES (added 29 Oct 2026)
- The Flavor 10 · Kenya updates itself every morning at about 06:10 Nairobi time.
  GitHub Actions (.github/workflows/flavor10-daily.yml) runs _charts/flavor10/fetch.py
  (collects Apple Music, Shazam, YouTube and Kenyan airplay charts; Spotify has no public Kenya chart), then
  daily.py (ranks them) and _site.py (rebuilds the homepage), and pushes. Netlify publishes.
  What worked on the last run is written to _charts/flavor10/status.txt.
  If a source can't be reached, its last good copy is reused for a few days, then dropped.
  Force a run: change _charts/flavor10/RUN and push, or "Run workflow" on GitHub (Actions tab).
- Climb arrows are green, drop arrows are red (style.css: --climb / --fall).
- Editor's picks on the homepage rotate every day from the long-form stories of the last
  30 days (PICK_TAGS in _site.py). The big hero story is still set by hand in index.html.
