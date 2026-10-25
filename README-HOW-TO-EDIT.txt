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
