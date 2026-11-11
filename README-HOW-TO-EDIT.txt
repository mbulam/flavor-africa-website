FLAVOR AFRICA WEBSITE - HOW IT WORKS
(Give this file to any AI or developer before asking for changes.)

WHAT THIS IS
A plain static website: HTML pages + one stylesheet + an img folder.
No database, no login. Open index.html in a browser to preview it.
HOSTING (moved from Netlify on 29 Oct 2026)
The live site (flavorafricagroup.org and www.flavorafricagroup.org) is hosted on
Cloudflare Pages, free plan, project "flavor-africa-website". Cloudflare publishes
automatically from the main branch of this GitHub repo: any push to main goes live
within a minute or two. No build step; the repo folder is served as-is.
Test copy: https://flavor-africa-website.pages.dev
The domain is registered at Afriregister and uses Cloudflare's nameservers.
Netlify is no longer used.

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
SET TIME (added 30 Oct 2026): the date can also carry a time, e.g. "2026-10-31T09:00"
(Nairobi). The story then appears in listings at exactly that time instead of midnight.
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
appears twice. The top hero story stays out of Latest. Editor's picks do NOT hide a story from Latest
(changed 31 Oct 2026), so a new story always shows in Latest even if it's also a pick.
For tall/portrait posters, make a separate square "-thumb.jpg" crop for the cards
so the homepage thumbnail shows the subject, not the poster's text.

AUTOMATIC UPDATES (added 29 Oct 2026)
- The Flavor 10 · Kenya updates itself every morning at about 06:10 Nairobi time.
  GitHub Actions (.github/workflows/flavor10-daily.yml) runs _charts/flavor10/fetch.py
  (collects Apple Music, Shazam, YouTube and Kenyan airplay charts; Spotify has no public Kenya chart), then
  daily.py (ranks them; fast climbers on daily sources get up to 10 bonus points, added 4 Nov 2026) and _site.py (rebuilds the homepage), and pushes. Cloudflare Pages publishes.
  What worked on the last run is written to _charts/flavor10/status.txt.
  If a source can't be reached, its last good copy is reused for a few days, then dropped.
  It runs once a day only. To force an extra run: "Run workflow" on GitHub (Actions tab).
- Climb arrows are green, drop arrows are red (style.css: --climb / --fall).
- Editor's picks on the homepage rotate every day from the long-form stories of the last
  30 days (PICK_TAGS in _site.py). The big hero story is still set by hand in index.html.

GOOGLE ANALYTICS + COOKIE NOTICE (added 30 Oct 2026)
- Google Analytics 4, Measurement ID G-DXW50Q0F0K (property "flavorafricagroup.org",
  account "Flavor Africa"). See the numbers at analytics.google.com.
- _site.py adds the tracking code and the cookie notice to EVERY page each time it
  runs (GA_ID / GA_HEAD / GA_BODY / add_analytics). Don't paste the Google tag into
  pages by hand; if the ID ever changes, change GA_ID in _site.py and run it.
- Cookie notice: "Okay" / "No thanks", remembered in the visitor's browser.
  Kenyan and other non-EU visitors are counted unless they click "No thanks";
  visitors in the EU/UK/Switzerland are only counted after they click "Okay".
  Its look is the <style> at the start of GA_BODY in _site.py.

APP MODE (added 10 Nov 2026)
People can add the site to their phone's home screen; opened from that icon it behaves
like an app. Nothing here changes the normal website.
- manifest.webmanifest + icons/ : the app's name, icon and colours.
- sw.js : keeps copies so stories already read open offline. Bump VERSION in it if you
  ever need phones to drop their old copies.
- _site.py (PWA_HEAD / PWA_BODY / add_pwa) adds to every page: the manifest link, the
  "add to home screen" banner, and, in app mode only, the bottom tabs
  (Home / Flavor 10 / Live / Saved / Menu) and the purple splash.
- app/app.js + app/app.css load only in app mode: Flavor Daily (story cards shown on the
  first open of the day, and from the "f." button top-left), Saved (bookmark on every
  story, Saved tab, readable offline) and For You (pick segments on the home tab).
- app/feed.json is rebuilt by _site.py from STORIES every run; don't edit it by hand.

APP: FANS' PICK, FAN SEAT AND SPEED (added 10 Nov 2026)
- functions/api/vote.js and functions/api/fanseat.js are small Cloudflare Pages Functions (they run on
  Cloudflare, not in the browser). They need a D1 database bound to the Pages project as DB, and a secret
  called ADMIN_KEY (16+ characters), for BOTH Production and Preview. Until the database is bound they
  answer "not-ready" and the app simply hides the fans' pick, so nothing breaks.
- Fans' pick: in the app, the Flavor 10 has a "Which one's your No. 1?" panel. One pick per phone per day,
  counted Monday to Sunday (Nairobi). Percentages show once 10 fans have picked. It never changes the chart.
- Fan Seat: set FAN_SEAT in _site.py when a Flavor Artist Live artist is confirmed and run _site.py; the app
  then shows an "Ask <artist>" form under the purple band (3 questions per phone). Set it to None to close.
- Reading them: flavorafricagroup.org/app/inbox.html#<ADMIN_KEY> lists every question and the weekly picks.
- Speed: sw.js opens pages from the phone when it fetched them in the last 10 minutes, and app.js fetches
  the pages behind the tabs and the stories on screen ahead of the tap.

APP: ALERTS, NOW-PLAYING BAR, PULL TO REFRESH (added 11 Nov 2026)
- Alerts: functions/api/push.js. In the app, Home shows a "Know first" card; turning it on registers the phone.
  Alerts go out on their own for a new Flavor 10 No. 1 and a new Flavor Cover (checked whenever someone opens the
  app), and the team can send one from the inbox page (app/inbox.html#<ADMIN_KEY>). Phones are only poked; sw.js
  then fetches the words from /api/push?latest=1. The signing key is created on first use and kept in the D1
  database (table kv). On iPhone, alerts only work once the app is on the home screen (iOS 16.4+).
- Now-playing bar (app/app.js): when a Flavor 10 preview plays, a bar sits above the tabs and follows the reader to
  other pages. iPhones don't let sound restart by itself on a new page, so there it waits for one tap on play.
- Pull to refresh (app/app.js): pulling down at the top of a page fetches a fresh copy.
- Fan Seat is app/fanseat.js and shows on the website too: a slim strip at the top of Home, the full form on Live.
- The "add to home screen" banner (_site.py) tells people inside Instagram, the Google app etc. to open the page
  in Safari or Chrome first, because those mini browsers can't add to the home screen.
