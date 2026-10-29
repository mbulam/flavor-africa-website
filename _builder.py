import os,html
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'site2')
CSS=r'''
/* Layout: Billboard-style news front — white page, hairline rules, thick purple section bars, yellow only on tags. */
:root{
  --paper:#FFFFFF;
  --ink:#15102A;
  --mute:#5E5873;
  --line:#E4E0EE;
  --tint:#F3F0F9;
  --purple:#2A0174;
  --yellow:#F5CC11;
  --head:"Barlow Condensed","Arial Narrow",Arial,sans-serif;
  --body:"Poppins","Segoe UI",Helvetica,Arial,sans-serif;
  --mono:"DM Mono",ui-monospace,Menlo,monospace;
  color-scheme:light;
}
html{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--body);font-weight:400;font-size:15px;line-height:1.6;-webkit-font-smoothing:antialiased}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:30;background:var(--paper)}
img{max-width:100%}[hidden]{display:none!important}
a{color:inherit;text-decoration:none}
a:focus-visible,button:focus-visible{outline:2px solid var(--purple);outline-offset:3px}
.wrap{max-width:1180px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
h1,h2,h3{font-family:var(--head);font-weight:600;margin:0;line-height:1.08;text-wrap:balance;letter-spacing:0}

/* header */
header{position:sticky;top:env(safe-area-inset-top,0px);z-index:20;background:var(--paper);border-bottom:1px solid var(--line)}
.bar{display:grid;grid-template-columns:44px 1fr 44px;align-items:center;padding-block:12px}
.logo{justify-self:center;font-family:var(--body);font-weight:700;font-size:24px;letter-spacing:-.03em;color:var(--purple)}
.icon{width:40px;height:40px;display:grid;place-items:center;background:none;border:0;cursor:pointer;color:var(--ink);padding:0}
.icon svg{width:22px;height:22px}
.sub{border-top:1px solid var(--line);overflow-x:auto;scrollbar-width:none}
.sub::-webkit-scrollbar{display:none}
.sub .wrap{display:flex;gap:26px;justify-content:center;padding-block:10px;min-width:max-content}
.sub a{font-family:var(--mono);font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);white-space:nowrap}
.sub a:hover,.sub a[aria-current="page"]{color:var(--purple)}
.sub a[aria-current="page"]{box-shadow:inset 0 -2px 0 var(--yellow)}

/* drawer menu */
.drawer{position:fixed;inset:0;z-index:40;background:var(--paper);overflow-y:auto;padding-top:env(safe-area-inset-top,0px)}
.drawer .bar{border-bottom:1px solid var(--line)}
.acc{border-bottom:1px solid var(--line)}
.acc>button,.acc>a{display:flex;width:100%;justify-content:space-between;align-items:center;background:none;border:0;padding:18px 0;font-family:var(--head);font-weight:600;font-size:22px;letter-spacing:.02em;text-transform:uppercase;color:var(--ink);cursor:pointer;text-align:left}
.acc>button span{font-family:var(--body);font-weight:300;font-size:26px;color:var(--purple);line-height:1}
.acc ul{list-style:none;margin:0;padding:0 0 16px}
.acc li a{display:block;padding:7px 0;color:var(--mute);font-size:15px}
.acc li a:hover{color:var(--purple)}

/* tags + meta */
.tag{display:inline-block;background:var(--yellow);color:var(--purple);font-family:var(--mono);font-weight:500;font-size:11px;letter-spacing:.12em;text-transform:uppercase;padding:4px 8px;line-height:1.3}
.meta{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute)}
.secbar{border-top:6px solid var(--purple);padding-top:12px;margin-bottom:22px;display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.secbar h2{font-size:28px;text-transform:uppercase;letter-spacing:.02em;font-weight:600}
.secbar a{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--purple)}

/* photo slot */
.ph{position:relative;background:var(--tint);aspect-ratio:3/2;max-width:100%;overflow:hidden;display:grid;place-items:center}
.ph::after{content:"flavor.";font-family:var(--body);font-weight:700;font-size:clamp(28px,6vw,64px);letter-spacing:-.04em;color:rgba(42,1,116,.08)}
.ph.tall{aspect-ratio:4/5}
.ph .tag{position:absolute;left:50%;bottom:0;transform:translateX(-50%)}
.ph.left .tag{left:0;transform:none}

/* images */
.ph.img::after{display:none}
.ph.img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 22%}
.play{position:absolute;top:12px;left:12px;background:rgba(21,16,42,.78);color:#fff;font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;padding:6px 10px}
.feat{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:32px;align-items:center}
.feat .ph{aspect-ratio:4/5;max-height:560px}
.feat h3{font-size:clamp(30px,4.5vw,46px);text-transform:uppercase;margin:14px 0 10px}
.feat p{color:var(--mute);margin:0 0 10px;max-width:46ch}
.feat:hover h3{color:var(--purple)}
@media (max-width:640px){.feat{grid-template-columns:minmax(0,1fr);gap:18px}}
.art .lead{width:100%;max-width:100%;display:block}
.art figure{margin:30px 0}
.art figure img,.art video{width:100%;display:block;background:var(--tint)}
.art figcaption{font-family:var(--mono);font-size:11px;letter-spacing:.04em;color:var(--mute);margin-top:8px}
.art h2{font-size:28px;text-transform:uppercase;margin:34px 0 10px;border-top:1px solid var(--line);padding-top:18px}
.art .body h2 .k{display:block;font-family:var(--mono);font-size:11px;letter-spacing:.14em;color:var(--purple);font-weight:500;margin-bottom:6px}
.duo{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;margin:30px 0}
.duo img{width:100%;aspect-ratio:4/5;object-fit:cover;display:block}
.tracks{list-style:none;padding:0;margin:30px 0}
.tracks li{display:grid;grid-template-columns:34px 96px minmax(0,1fr);gap:16px;align-items:start;padding-block:18px;border-top:1px solid var(--line)}
.tracks li:last-child{border-bottom:1px solid var(--line)}
.tracks .n{font-family:var(--head);font-weight:600;font-size:26px;color:var(--purple);line-height:1}
.tracks img{width:96px;height:96px;object-fit:cover;display:block}
.tracks h3{font-size:22px;text-transform:uppercase}
.tracks .who{font-weight:500;margin:2px 0 4px}
.tracks p{margin:6px 0 0;color:var(--mute);font-size:14.5px;line-height:1.6}
@media (max-width:520px){.tracks li{grid-template-columns:28px 72px minmax(0,1fr);gap:12px}.tracks img{width:72px;height:72px}.duo{grid-template-columns:minmax(0,1fr)}}

.art h2 .hb{font-weight:600;color:var(--purple)}
.art h2{font-weight:500}
.art .stat{font-weight:500;color:var(--purple)}
.tracks.posters li{grid-template-columns:34px 120px minmax(0,1fr)}
.tracks.posters img{width:120px;height:auto;aspect-ratio:auto;box-shadow:6px 6px 0 var(--yellow)}
.nextwl{display:grid;grid-template-columns:160px minmax(0,1fr);gap:20px;align-items:start}
.nextwl img{width:160px;display:block}
.nextwl p{margin:8px 0 0;color:var(--mute)}
.facts2{margin:34px 0 0;border-top:6px solid var(--purple)}
.facts2 div{display:flex;justify-content:space-between;gap:12px;padding-block:12px;border-bottom:1px solid var(--line)}
.facts2 span:first-child{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--purple);align-self:center}
@media (max-width:520px){.tracks.posters li{grid-template-columns:28px 90px minmax(0,1fr)}.tracks.posters img{width:90px}.nextwl{grid-template-columns:110px minmax(0,1fr)}.nextwl img{width:110px}}
/* top story */
.top{padding-block:28px 8px;text-align:center}
.top .ph{aspect-ratio:16/9;max-height:520px;width:100%}
.top h1{font-size:clamp(34px,5.6vw,60px);text-transform:uppercase;letter-spacing:.005em;margin:18px auto 10px;max-width:22ch}
.top p.dek{max-width:60ch;margin:0 auto 10px;color:var(--mute)}

/* grids */
.main{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:48px;padding-block:44px}
.list .row{display:block;padding-block:16px;border-top:1px solid var(--line)}
.list .row:first-child{border-top:0;padding-top:0}
.list h3{font-family:var(--body);font-weight:500;font-size:17px;line-height:1.35;letter-spacing:-.005em}
.list .row:hover h3{color:var(--purple)}
.list .meta{margin-top:6px;display:block}
.trend{counter-reset:t}
.trend a{display:grid;grid-template-columns:30px minmax(0,1fr);gap:10px;padding-block:14px;border-top:1px solid var(--line)}
.trend a:first-child{border-top:0;padding-top:0}
.trend a::before{counter-increment:t;content:counter(t);font-family:var(--head);font-weight:600;font-size:30px;line-height:1;color:var(--purple)}
.trend h3{font-family:var(--body);font-weight:500;font-size:15px;line-height:1.4}
.trend a:hover h3{color:var(--purple)}
.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:28px}
.card{display:flex;flex-direction:column;gap:10px}
.card h3{font-size:24px;text-transform:uppercase;letter-spacing:.01em}
.card:hover h3{color:var(--purple)}
.card p{margin:0;color:var(--mute);font-size:14px}
.block{padding-block:12px 44px}

/* live band */
.band{background:var(--purple);color:#fff}
.band .wrap{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:40px;align-items:center;padding-block:48px}
.band h2{font-size:clamp(40px,7vw,76px);text-transform:uppercase;font-weight:500;letter-spacing:.01em}
.band h2 b{font-weight:600;color:var(--yellow)}
.band p{color:#D9D0F0;margin:12px 0 0;max-width:48ch}
.band .facts div{display:flex;justify-content:space-between;gap:12px;padding-block:12px;border-top:1px solid rgba(255,255,255,.2);font-size:14px}
.band .facts div:last-child{border-bottom:1px solid rgba(255,255,255,.2)}
.band .facts span:first-child{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--yellow);align-self:center}
.band .count{font-family:var(--head);font-weight:500;font-size:20px;margin-top:16px;letter-spacing:.04em;text-transform:uppercase}
.band .count b{font-weight:600;font-size:44px;color:var(--yellow);margin-right:8px;font-variant-numeric:tabular-nums}

/* page heads */
.phead{padding-block:36px 8px}
.phead h1{font-size:clamp(44px,8vw,84px);text-transform:uppercase;font-weight:500;letter-spacing:.01em;border-top:8px solid var(--purple);padding-top:16px}
.phead p{color:var(--mute);max-width:62ch;margin:10px 0 0}
.segs{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}
.segs span{border:1px solid var(--line);font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;padding:6px 10px;color:var(--purple)}
.empty{border:1px dashed var(--line);padding:28px;color:var(--mute);text-align:center;font-size:14px}

/* article */
.art{max-width:760px;margin:0 auto;padding-block:36px 56px}
.art h1{font-size:clamp(34px,6vw,58px);text-transform:uppercase;letter-spacing:.005em;margin:16px 0 12px}
.art .dek{font-size:18px;color:var(--mute);margin:0 0 14px}
.art .body{font-size:16.5px;line-height:1.75;max-width:66ch}
.art .body p{margin:0 0 18px}
.art .fig{margin:26px 0}
.art .fig .meta{margin-top:8px;display:block;text-transform:none;letter-spacing:.02em}

/* about */
.pill4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:28px}
.pill4 h3{font-size:24px;text-transform:uppercase;margin:8px 0 6px}
.pill4 p{margin:0;color:var(--mute);font-size:14px}
.svc{display:flex;flex-wrap:wrap;gap:10px}
.svc span{background:var(--tint);color:var(--purple);font-weight:500;padding:9px 14px;font-size:14px}
.contact{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:40px}
.cl{display:flex;justify-content:space-between;align-items:center;gap:12px;padding-block:14px;border-top:1px solid var(--line)}
.cl:last-child{border-bottom:1px solid var(--line)}
.cl .v{font-weight:500;font-size:16px;user-select:all;word-break:break-all}
.copy{flex:none;background:none;border:1px solid var(--line);font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;padding:7px 10px;cursor:pointer;color:var(--purple)}
.copy:hover{border-color:var(--purple)}

/* footer */
footer{border-top:6px solid var(--purple);margin-top:20px}
footer .wrap{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:24px;align-items:end;padding-block:36px}
footer .logo{justify-self:start;font-size:30px}
footer .line{font-family:var(--mono);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--mute);margin-top:8px}
footer .line b{font-weight:500;color:var(--purple)}
footer nav{display:flex;flex-wrap:wrap;gap:8px 20px;justify-content:flex-end}
footer nav a{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute)}
footer nav a:hover{color:var(--purple)}
footer small{grid-column:1/-1;color:var(--mute);font-size:12px;border-top:1px solid var(--line);padding-top:16px}

@media (max-width:900px){
  .main{grid-template-columns:minmax(0,1fr);gap:36px}
  .band .wrap,.contact{grid-template-columns:minmax(0,1fr);gap:28px}
  .pill4{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:640px){
  .cards{grid-template-columns:minmax(0,1fr)}
  .pill4{grid-template-columns:minmax(0,1fr)}
  .sub .wrap{justify-content:flex-start}
  footer .wrap{grid-template-columns:minmax(0,1fr)}
  footer nav{justify-content:flex-start}
}
'''
# ---------- content (only what Flavor Africa has covered / announced) ----------
SECTIONS=[
 ('music','Music',['The Drop','Flavor Playlist','Flavor Charts','Flavor Spotlight','The Verdict'],'New releases, the charts and the artists to watch, from Nairobi to the world.'),
 ('screen','Film & TV',['The Watchlist'],'What to watch this weekend across cinemas and streaming.'),
 ('fashion','Fashion',['Flavor Fashion'],'Style, written like an editorial spread.'),
 ('money','Business',['Money Moves','Flavor Figures'],'The real ownership moves behind entertainment, and the numbers that tell the story.'),
 ('sport','Sport',['Flavor Sports'],'Where sport meets music, fashion and business.'),
 ('culture','Culture',['Flavor Roots','Flavor Decoded','Flavor Rewind','In Their Words'],'Where the culture comes from, what it means, and the moments worth remembering.'),
 ('features','Features',['Flavor Feature','The Flavor Cover','The Flavor Edit'],'Long reads, the monthly cover story and the weekly round-up.'),
 ('live','Live',['Flavor Artist Live','Nairobi This Weekend','Fan Seat'],'Flavor Artist Live, our own shows, and the biggest events in Nairobi each weekend.'),
]
SEC={s[0]:s for s in SECTIONS}
# (slug, section, tag, headline, dek, date, href)
STORIES=[
 ('lagos-fashion-week','fashion','Flavor Fashion','Lagos Fashion Week 2026: everything to know before the runway lights up','28 October to 1 November. The Crafted season.','Oct 2026','lagos-fashion-week.html','img/lfw-cover.jpg'),
 ('mr-eazi','money','Money Moves','Mr Eazi: singer, investor, owner','Seven moves that built an empire beyond the music.','Oct 2026','mr-eazi.html','img/me-cover.jpg'),
 ('watchlist-23-oct','screen','The Watchlist','Must watch this weekend: Lupin, A Land Apart, Spinners and more','Six picks for 23\u201325 October across Netflix, Prime Video, Showmax and cinemas.','23 Oct 2026','watchlist.html','img/wl-lupin.jpg'),
 ('ayrosh','live','Flavor Artist Live','Know your November artist: Ayrosh','Mugithi, reimagined. Ayrosh headlines Flavor Artist Live on 28 November.','Oct 2026','ayrosh.html','img/ay-cover.jpg'),
 ('nairobi-new-sound','features','The Flavor Cover','Nairobi\u2019s New Sound','It isn\u2019t one genre. That\u2019s the whole point. Issue 01 of the Flavor Cover.','Oct 2026','nairobi-new-sound.html','img/nns-njerae.jpg'),
 ('tg-blk','music','Flavor Spotlight','tg.blk: the Mombasa bedroom producer opening doors for alternative music','From GarageBand in Mombasa to Apple Music and Spotify\u2019s radar in 2026.','Oct 2026','tg-blk.html','img/tg-2026.jpg'),
 ('made-in-lagos','culture','Flavor Rewind','Made in Lagos at six: the delayed album that rewrote Africa\u2019s chart records','Wizkid\u2019s fourth album arrived two weeks late, then broke records from Spotify to Billboard.','30 Oct 2026','made-in-lagos.html','img/mil-stage.jpg'),
 ('sunday-reset','music','Flavor Playlist','Sunday Reset: six songs for a slow Sunday','Flavor Playlist Vol. 01, from Sade to Black Coffee and Msaki.','25 Oct 2026','sunday-reset.html','img/sunday-reset-poster.jpg'),
 ('soul-makossa','culture','Flavor Roots','That chant on Thriller? It started in Cameroon','Flavor Roots Issue 01: how Manu Dibango\u2019s Soul Makossa travelled from Douala to the whole world.','Oct 2026','soul-makossa.html','img/sm-manu-stage.jpg'),
 ('true-colors','culture','Flavor Rewind','True Colors at 40: Cyndi Lauper\u2019s No. 1, four decades on','Flavor Rewind marks the anniversary of the song reaching No. 1.','25 Oct 2026',None,None),
 ('mugithi','culture','Flavor Decoded','Mugithi, decoded','A culture explainer, ahead of the Ayrosh show.','Oct 2026',None,None),
 ('lupita','culture','In Their Words','In Their Words: Lupita Nyong\u2019o','From her speech at Essence\u2019s Black Women in Hollywood event, February 2014.','Oct 2026',None,None),
 ('njerae','live','Flavor Artist Live','Njerae, Kenya\u2019s Lover Girl, at Flavor Artist Live','Looking back at the 17 October show.','Oct 2026',None,None),
]
def story_link(s): return s[6] or ('%s.html#%s'%(s[1],s[0]))

PAGES_NAV=[('index.html','Home')]+[(s[0]+'.html',s[1]) for s in SECTIONS]+[('about.html','About')]
FONTS='<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600&family=DM+Mono:wght@400;500&family=Poppins:wght@300;400;500;700&display=swap">'
MENU_SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 6h18M3 12h18M3 18h18"/></svg>'
X_SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 5l14 14M19 5L5 19"/></svg>'
e=html.escape

def header(cur):
    sub=''.join('<a href="%s"%s>%s</a>'%(f,' aria-current="page"' if f==cur else '',n) for f,n in PAGES_NAV[1:])
    acc=''
    for slug,name,segs,_ in SECTIONS:
        items=''.join('<li><a href="%s.html">%s</a></li>'%(slug,e(x)) for x in segs)
        acc+='<div class="acc"><button type="button" aria-expanded="false"><b style="font-weight:600">%s</b><span>+</span></button><ul hidden><li><a href="%s.html">All %s</a></li>%s</ul></div>'%(e(name),slug,e(name),items)
    acc+='<div class="acc"><a href="about.html">About</a></div>'
    return ('<header><div class="wrap bar"><button class="icon" type="button" id="open" aria-label="Open menu">%s</button>'
            '<a class="logo" href="index.html">flavor.africa</a><span></span></div>'
            '<nav class="sub" aria-label="Sections"><div class="wrap">%s</div></nav></header>'
            '<div class="drawer" id="drawer" hidden><div class="wrap bar"><button class="icon" type="button" id="close" aria-label="Close menu">%s</button>'
            '<a class="logo" href="index.html">flavor.africa</a><span></span></div><div class="wrap">%s</div></div>')%(MENU_SVG,sub,X_SVG,acc)

FOOTER=('<footer><div class="wrap"><div><a class="logo" href="index.html">flavor.africa</a>'
        '<div class="line">Global culture, <b>African flavor</b></div></div>'
        '<nav aria-label="Footer">'+''.join('<a href="%s">%s</a>'%(f,n) for f,n in PAGES_NAV[1:])+'</nav>'
        '<small>© 2026 Flavor Africa Group · Nairobi, Kenya</small></div></footer>')

JS=r'''<script>(function(){
var d=document.getElementById('drawer');
document.getElementById('open').onclick=function(){d.hidden=false;document.body.style.overflow='hidden'};
document.getElementById('close').onclick=function(){d.hidden=true;document.body.style.overflow=''};
document.querySelectorAll('.acc>button').forEach(function(b){b.onclick=function(){var u=b.nextElementSibling,o=u.hidden;u.hidden=!o;b.setAttribute('aria-expanded',o);b.lastChild.textContent=o?'−':'+'}});
var n=document.getElementById('days');
if(n){var t=new Date(Date.now()+3*36e5),today=Date.UTC(t.getUTCFullYear(),t.getUTCMonth(),t.getUTCDate()),days=Math.round((Date.UTC(2026,10,28)-today)/864e5),l=document.getElementById('dayslbl');
 if(days>1){n.textContent=days}else if(days===1){n.textContent=1;l.textContent='day to go'}else if(days===0){n.textContent='Tonight';l.textContent=''}else{n.parentNode.hidden=true}}
document.querySelectorAll('.copy').forEach(function(b){b.onclick=function(){var el=document.getElementById(b.dataset.copy);
 function ok(){b.textContent='Copied';setTimeout(function(){b.textContent='Copy'},1500)}
 function sel(){var r=document.createRange();r.selectNodeContents(el);var s=getSelection();s.removeAllRanges();s.addRange(r)}
 try{navigator.clipboard.writeText(el.textContent).then(ok,sel)}catch(x){sel()}}});
})();</script>'''

def page(fname,title,body):
    head='<title>%s</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n%s\n<link rel="stylesheet" href="style.css">\n'%(e(title),FONTS)
    doc=head+header(fname)+'<main>'+body+'</main>'+FOOTER+JS
    if fname!='index.html':
        doc=('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
             +head+'</head><body>'+header(fname)+'<main>'+body+'</main>'+FOOTER+JS+'</body></html>')
    open(os.path.join(OUT,fname),'w').write(doc)

def ph(tag=None,cls='',img=None,video=False):
    t='<span class="tag">%s</span>'%e(tag) if tag else ''
    if img:
        v='<span class="play" aria-hidden="true">\u25b6 Watch</span>' if video else ''
        return '<div class="ph img %s"><img src="%s" alt="">%s%s</div>'%(cls,img,v,t)
    return '<div class="ph %s">%s</div>'%(cls,t)
def card(s):
    return '<a class="card" id="%s" href="%s">%s<h3>%s</h3><p>%s</p><span class="meta">%s</span></a>'%(s[0],story_link(s),ph(s[2],'left',s[7],s[0]=='sunday-reset'),e(s[3]),e(s[4]),e(s[5]))
def band():
    return ('<section class="band"><div class="wrap"><div><span class="tag">Flavor Artist Live</span>'
            '<h2 style="margin-top:16px"><a href="ayrosh.html">Ayrosh <b>live</b></a></h2><p>The next Flavor Artist Live show. Saturday 28 November 2026.</p>'
            '<div class="count"><b id="days">–</b><span id="dayslbl">days to go</span></div></div>'
            '<div class="facts"><div><span>Date</span><span>Sat 28 Nov 2026</span></div><div><span>Venue</span><span>To be announced</span></div>'
            '<div><span>Tickets</span><span>Coming soon</span></div><div><span>Next from Flavor</span><span>Ngoma na Marafiki</span></div></div></div></section>')

os.makedirs(OUT,exist_ok=True)
open(os.path.join(OUT,'style.css'),'w').write(CSS)

# HOME
top=[x for x in STORIES if x[0]=='ayrosh'][0]
latest=''.join('<a class="row" href="%s"><span class="tag">%s</span><h3 style="margin-top:8px">%s</h3><span class="meta">%s · %s</span></a>'%(story_link(s),e(s[2]),e(s[3]),e(SEC[s[1]][1]),e(s[5])) for s in STORIES if s is not top)
trend=''.join('<a href="%s"><h3>%s</h3></a>'%(story_link(s),e(s[3])) for s in STORIES[:5])
watch=[x for x in STORIES if x[0]=='sunday-reset'][0]
cult=[s for s in STORIES if s[1]=='culture' and s[7]][:3]
home=('<div class="wrap top"><a href="ayrosh.html" style="display:block">%s</a><h1><a href="ayrosh.html">%s</a></h1><p class="dek">%s</p><span class="meta">%s</span></div>'%(
        ph('Top story','',top[7]),e(top[3]),e(top[4]),'Flavor Africa \u00b7 '+top[5])
      +'<div class="wrap main"><div><div class="secbar"><h2>Latest news</h2></div><div class="list">%s</div></div>'%latest
      +'<aside><div class="secbar"><h2>Trending</h2></div><div class="trend">%s</div></aside></div>'%trend
      +'<section class="wrap block"><div class="secbar"><h2>Flavor Playlist</h2><a href="music.html">More music \u00bb</a></div><a class="feat" href="sunday-reset.html">%s<div><span class="tag">Watch</span><h3>%s</h3><p>%s</p><span class="meta">%s</span></div></a></section>'%(ph(None,'',watch[7],True),e(watch[3]),e(watch[4]),e(watch[5]))
      +band()
      +'<section class="wrap block" style="padding-top:44px"><div class="secbar"><h2>Culture</h2><a href="culture.html">More culture »</a></div><div class="cards">%s</div></section>'%''.join(card(s) for s in cult)
      +'<section class="wrap block"><div class="secbar"><h2>More stories</h2></div><div class="cards">%s</div></section>'%''.join(card(s) for s in STORIES if s[0] in('mr-eazi','lagos-fashion-week','nairobi-new-sound')))
page('index.html','flavor.africa',home)

# SECTION PAGES
for slug,name,segs,blurb in SECTIONS:
    st=[s for s in STORIES if s[1]==slug]
    body='<div class="wrap phead"><h1>%s</h1><p>%s</p><div class="segs">%s</div></div>'%(e(name),e(blurb),''.join('<span>%s</span>'%e(x) for x in segs))
    if slug=='live': body+='<div style="margin-top:28px">'+band()+'</div>'
    body+='<section class="wrap block" style="padding-top:36px"><div class="secbar"><h2>Latest in %s</h2></div>'%e(name)
    body+=('<div class="cards">%s</div>'%''.join(card(s) for s in st)) if st else '<div class="empty">New %s stories will appear here.</div>'%e(name.lower())
    body+='</section>'
    page(slug+'.html',name+' · flavor.africa',body)

# MADE IN LAGOS
def fig(src,cap): return '<figure><img src="%s" alt="%s" loading="lazy"><figcaption>%s</figcaption></figure>'%(src,e(cap),e(cap))
def sec(k,h,body): return '<h2><span class="k">%s</span>%s</h2><p>%s</p>'%(e(k),e(h),body)
mil=('<article class="wrap"><div class="art"><span class="tag">Flavor Rewind</span>'
 '<h1>Made in Lagos at six</h1>'
 '<p class="dek">Wizkid\u2019s fourth album arrived two weeks late, then went on to rewrite Africa\u2019s chart records.</p>'
 '<span class="meta">Flavor Africa \u00b7 30 Oct 2026 \u00b7 Six years ago today</span>'
 '<figure><img class="lead" src="img/mil-stage.jpg" alt="Wizkid performing on stage"></figure>'
 '<div class="body">'
 +sec('The delay','Held back for Nigeria','Made in Lagos was set for release on 15 October 2020. As the End SARS protests against police brutality spread across Nigeria, Wizkid pushed the release back and dedicated the album to the people of Nigeria.')
 +fig('img/mil-portrait.jpg','Wizkid')
 +sec('The drop','Fourteen tracks at 11:11pm','It went live at 11:11pm Lagos time on 29 October (1:11am in Nairobi), just ahead of its official 30 October date, with guests including Burna Boy, Skepta, Damian Marley, H.E.R., Ella Mai and Terri.')
 +fig('img/mil-cover.jpg','The Made in Lagos album cover')
 +sec('The first week','A first for Africa','It became the first African album to debut on Spotify\u2019s Global Album chart, landing inside the top ten, and passed 100 million streams across five platforms nine days after release.')
 +sec('July 2021','Essence makes history','Essence with Tems became the first Nigerian song on the Billboard Hot 100, debuting at No. 82. After a Justin Bieber remix arrived on the deluxe edition that August, it climbed to No. 9.')
 +'<div class="duo"><img src="img/mil-tems.jpg" alt="Wizkid and Tems on stage" loading="lazy"><img src="img/mil-crowd.jpg" alt="A concert crowd" loading="lazy"></div>'
 +sec('February 2022','A 27-year record falls','It became the longest-charting African album on Billboard\u2019s World Albums chart, passing the 66 weeks held by Ces\u00e1ria \u00c9vora\u2019s self-titled album. By 2025 it had logged more than 150 weeks there.')
 +fig('img/mil-now.jpg','Wizkid')
 +sec('Six years on','Still on repeat','It earned two nominations at the 64th Grammys, for Essence and the deluxe edition, and is certified Gold by the RIAA. Which track still runs your playlist?')
 +'</div></div></article>')
page('made-in-lagos.html','Made in Lagos at six',mil)

# SUNDAY RESET
TR=[('01','By Your Side','Sade','The slow start \u00b7 2000 \u00b7 from Lovers Rock','img/pl-byyourside.jpg','The lead single from Lovers Rock is the gentlest way into a Sunday: Ibadan-born Sade, promising to stay, over a groove that never hurries.'),
 ('02','Jailer','A\u1e63a','Windows open \u00b7 2007 \u00b7 from A\u1e63a','img/pl-jailer.jpg','The opening track of her debut, produced by Cobhams Asuquo. It sounds soft, but A\u1e63a wrote it with Nigeria\u2019s years of dictatorship in mind. Let go of whatever is holding you.'),
 ('03','People','Libianca','Check on yourself \u00b7 2022 \u00b7 single','img/pl-people.jpg','The Cameroonian singer wrote it from her own mental health journey, and it went all the way to No. 2 in the UK. Take it as your cue to check in on yourself, and on your people.'),
 ('04','I Choose You','Bridget Blue & Bien','Soft afternoon \u00b7 2024 \u00b7 single','img/pl-ichooseyou.jpg','Bridget Blue teamed up with Sauti Sol\u2019s Bien for a duet that keeps love simple. Two warm voices, one easy decision.'),
 ('05','Lucy','Bensoul','The pick-me-up \u00b7 2019','img/pl-lucy.jpg',''),
 ('06','Wish You Were Here','Black Coffee feat. Msaki','Golden hour \u00b7 2018','img/pl-wishyouwerehere.jpg','')]
tl=''.join('<li><span class="n">%s</span><img src="%s" alt="%s cover" loading="lazy"><div><h3>%s</h3><div class="who">%s</div><span class="meta">%s</span>%s</div></li>'%(n,img,e(t),e(t),e(a),e(m),('<p>%s</p>'%e(d)) if d else '') for n,t,a,m,img,d in TR)
sr=('<article class="wrap"><div class="art"><span class="tag">Flavor Playlist</span>'
 '<h1>Sunday Reset</h1>'
 '<p class="dek">Flavor Playlist Vol. 01: six songs, from the slow start to golden hour.</p>'
 '<span class="meta">Flavor Africa \u00b7 25 Oct 2026</span>'
 '<figure><video src="img/sunday-reset.mp4" poster="img/sunday-reset-poster.jpg" controls playsinline muted loop preload="metadata" style="max-width:520px;margin:0 auto"></video></figure>'
 '<ol class="tracks">'+tl+'</ol>'
 '<div class="body"><p>Save this for next Sunday. Which one is on repeat?</p></div>'
 '</div></article>')
page('sunday-reset.html','Sunday Reset',sr)

# GENERIC ARTICLE
def article(fname,title,tag,h1,dek,meta,lead,leadcap,secs,outro=''):
    b=''
    for k,h,body,img,cap,stat in secs:
        b+='<h2><span class="k">%s</span>%s</h2><p>%s</p>'%(e(k),h,e(body))
        if img: b+='<figure><img src="%s" alt="%s" loading="lazy"><figcaption>%s%s</figcaption></figure>'%(img,e(cap),e(cap),(' \u00b7 <b class="stat">%s</b>'%e(stat)) if stat else '')
    page(fname,title,'<article class="wrap"><div class="art"><span class="tag">%s</span><h1>%s</h1><p class="dek">%s</p><span class="meta">%s</span>'
      '<figure><img class="lead" src="%s" alt="%s"><figcaption>%s</figcaption></figure><div class="body">%s%s</div></div></article>'%(e(tag),e(h1),e(dek),e(meta),lead,e(leadcap),e(leadcap),b,outro))
L=lambda a,b:'%s <b class="hb">%s</b>'%(e(a),e(b))
article('nairobi-new-sound.html','Nairobi\u2019s New Sound','The Flavor Cover','Nairobi\u2019s New Sound','It isn\u2019t one genre. That\u2019s the whole point.','The Flavor Cover \u00b7 Issue 01 \u00b7 October 2026','img/nns-njerae.jpg','Cover: Njerae, live with Flavor Africa',[
 ('Young city, restless ears',L('Who\u2019s holding','the aux'),'In June 2026, listeners aged 18 to 24 made up 53.7% of every Spotify stream in Nairobi, ahead of Lagos (44.4%) and Johannesburg (29.9%). Even between 2am and 5am, they account for 55% of what the city plays. Whatever Gen Z presses play on, Nairobi hears.','img/nns-matatu.jpg','Matatu culture','53.7% of Nairobi\u2019s streams'),
 ('Genge DNA, new clothes',L('Still running','the streets'),'Arbantone takes its name from \u201curban\u201d and its bones from genge, laid over old Jamaican riddims and delivered in Sheng. Gody Tennor and Tipsy Gee helped it take over, its songs are made for TikTok dance challenges, and in 2026 the club mixes are still full of it, with Toxic Lyrikali among the names on repeat.','img/nns-toxic.jpg','Toxic Lyrikali',''),
 ('The fastest riser',L('Kingston, by way of','Eastlands'),'Dancehall was the fastest-growing genre among Kenyan listeners aged 18 to 24 in Spotify\u2019s June 2026 data, up 95% on the year before. Bongo Flava followed at 75%. Gengetone, written off more than once, still grew 48%, and one of its biggest names, Mejja, opened a new chapter this year with his album \u201cMtoto wa Khadija\u201d.','img/nns-mejja.jpg','Mejja','+95% dancehall, year on year'),
 ('Slow it down',L('The Caribbean,','slowed down'),'Not everything is fast. Bien and Tanzania\u2019s Alikiba leaned into zouk on \u201cFinale\u201d, part of a Caribbean wave on East African airwaves. Kodong Klan, the seven-member collective that includes Bensoul and Okello Max, took it further with konpa, the Haitian sound, on \u201cYour Body\u201d.','img/nns-bien.jpg','Bien',''),
 ('The plot twist',L('Nobody saw','this coming'),'Here\u2019s the twist in the data: gospel grew 37% among young Kenyan listeners, roughly six times faster than drill at 6%. The same generation running the club mixes is quietly making room for the choir.','img/nns-gospel.jpg','Gospel on stage','+37% gospel, year on year'),
 ('One to watch',L('Four o\u2019clock tea,','all year'),'Ywaya Tajiri is one half of Watendawili and a member of the Kodong Klan collective. He released \u201cChai ya saa kumi\u201d in February. By June it was Nairobi\u2019s most-streamed song, and in October it\u2019s still on Kenya\u2019s charts.','img/nns-ywaya.jpg','Ywaya Tajiri','+6,151% growth among 18\u201324s, June'),
 ('On repeat right now',L('October\u2019s','main character'),'If October has a name, it\u2019s Kapitani. \u201cShing\u201d, his link-up with Toxic Lyrikali, went straight into Kenya\u2019s charts this month, sitting alongside his own \u201cKitemeo\u201d and \u201cSafe\u201d with Countree Hype. Several songs, one artist, all at once.','img/nns-kapitani.jpg','Kapitani',''),
 ('So what is the new sound?',L('The new sound is','all of it'),'The old guard isn\u2019t being pushed out. Sauti Sol was still the most-streamed Kenya-connected act in Nairobi in June, and still growing. This month Bien signed with Quality Control, the Atlanta label behind Migos and Lil Baby. Nairobi isn\u2019t picking a lane. It\u2019s playing all of them.','img/nns-bien2.jpg','Bien',''),
])
article('soul-makossa.html','Soul Makossa','Flavor Roots','That chant on Thriller? It started in Cameroon','Flavor Roots Issue 01 traces a chant the whole world knows back to Douala.','Flavor Roots \u00b7 Issue 01 \u00b7 Soul Makossa \u00b7 Cameroon, 1972','img/sm-manu-stage.jpg','Manu Dibango',[
 ('The hit \u00b7 1982',L('The','borrowed chant'),'Michael Jackson opened Thriller with \u201cWanna Be Startin\u2019 Somethin\u2019\u201d. Near the end comes the chant the whole world knows. It wasn\u2019t his.','img/sm-mj.jpg','Michael Jackson, Thriller era',''),
 ('The source \u00b7 1972',L('The','original'),'Cameroonian saxophonist Manu Dibango recorded \u201cSoul Makossa\u201d as the B-side to a song for the Africa Cup of Nations, which Cameroon hosted that year. Makossa is a dance music style from his home city, Douala.','img/sm-manu.jpg','Manu Dibango',''),
 ('The journey \u00b7 1973',L('From Douala to','New York'),'DJ David Mancuso found a copy in a small New York record shop and played it at The Loft. Radio picked it up, Atlantic Records released it, and it reached No. 35 on the Billboard Hot 100, with two Grammy nominations.','img/sm-disco.jpg','New York disco, 1970s',''),
 ('The credit',L('Who gets','paid?'),'Jackson admitted borrowing the hook and settled out of court. In 2007, Rihanna\u2019s \u201cDon\u2019t Stop the Music\u201d reused it through his version. Dibango sued in 2009, but the case was thrown out because he\u2019d already been granted a credit on her record.','img/sm-rihanna.jpg','Rihanna, \u201cDon\u2019t Stop the Music\u201d, 2007',''),
 ('The legacy',L('A chant that','won\u2019t stop'),'Manu Dibango died on 24 March 2020, aged 86. \u201cSoul Makossa\u201d lives on in tracks by Jennifer Lopez, Busta Rhymes and The Chemical Brothers. Now you know where it comes from.','img/sm-manu2.jpg','Manu Dibango',''),
])
article('ayrosh.html','Ayrosh at Flavor Artist Live','Flavor Artist Live','Know your November artist: Ayrosh','Mugithi, reimagined. Live at Flavor on Saturday 28 November.','Flavor Artist Live \u00b7 28 November 2026','img/ay-cover.jpg','Ayrosh',[
 ('The sound',L('Mugithi,','reimagined'),'Mugithi is the Kikuyu one-man-guitar-and-drums sound. Ayrosh blends it with neo soul, R&B, reggae, Afro-house and even EDM, and sings in Gikuyu, English and Kiswahili.','img/ay-sound.jpg','Ayrosh',''),
 ('Where it started',L('Making music','since 2016'),'His first single, \u201cWendo\u201d, landed in 2016. By 2018 he had nominations at the Sondeka Awards and the Caf\u00e9 Ngoma Awards, and in 2019 came his debut EP Murasta, an Afro-house project two years in the making.','img/ay-start.jpg','Ayrosh',''),
 ('The movement',L('He built','Folk Fusion'),'In 2018 he started Folk Fusion, a quarterly event celebrating African culture through folk music, fashion and food. Savara and Bensoul have headlined it, and it\u2019s also the label behind his own releases.','img/ay-folk.jpg','Ayrosh',''),
 ('The collabs',L('Good','company'),'He\u2019s on Mutoriah\u2019s \u201cMwanake Millennial\u201d and teamed up with Mutoriah and 10Tonnes on \u201cJangwani\u201d. Kayrop remixed his \u201cSuperstar\u201d, and this year he features on \u201cMy Lover\u201d with Mura, Hiribae and Ghedi.','img/ay-collabs.jpg','Ayrosh',''),
 ('The catalogue',L('Start','here'),'\u201cMaheni\u201d and \u201cKirinyaga\u201d for the classics. The Fire EP (2020) for four tracks of Kikuyu R&B. Then SUPERSTAR, his nine-track album from May 2024.','img/ay-catalogue.jpg','Ayrosh',''),
 ('28 November',L('See him','live'),'He\u2019s packed out tents like this one. Now it\u2019s Flavor\u2019s turn: Ayrosh headlines Flavor Artist Live on Saturday 28 November.','img/ay-live.jpg','Ayrosh',''),
],'<div class="facts2"><div><span>Date</span><span>Sat 28 Nov 2026</span></div><div><span>Venue</span><span>To be announced</span></div><div><span>Tickets</span><span>Coming soon</span></div></div>')
article('tg-blk.html','tg.blk','Flavor Spotlight','tg.blk','The Mombasa artist carving out her own lane and opening the doors for alternative music.','Flavor Spotlight \u00b7 October 2026','img/tg-2026.jpg','tg.blk',[
 ('Where it started',L('From','Mombasa'),'Born and raised on the coast, tg.blk, real name Thigi, grew up on the funk and soul her mother played on the radio. She calls herself \u201ca child of the internet\u201d.','img/tg-mombasa.jpg','tg.blk',''),
 ('The bedroom producer',L('Made on','GarageBand'),'She makes her own beats and blends rap, lo-fi, R&B and soul. Her breakout \u201cLove Being Used\u201d was recorded and mixed at home in Mombasa, and it reached US rapper Vince Staples.','img/tg-garageband.jpg','tg.blk',''),
 ('The year it clicked',L('Her','2026'),'January: Apple Music named her in its Africa Rising Class of 2026. July: Spotify picked her as its EQUAL Africa artist. Two of the biggest platforms in music, saying the same thing.','',''  ,''),
 ('Out now',L('Besides','you'),'Her new EP, out since 18 September, is six tracks about the early rush of love, when red flags still look green. It\u2019s the first part of a trilogy that follows one relationship all the way through.','img/tg-besides.jpg','tg.blk',''),
 ('Her lane',L('In her','words'),'\u201cI\u2019m carving out my own lane and opening the doors for alternative music.\u201d Start with \u201cLove Being Used\u201d, then besides you.','img/tg-lane.jpg','tg.blk',''),
])
article('mr-eazi.html','Mr Eazi','Money Moves','Mr Eazi: singer, investor, owner','Seven moves that built an empire beyond the music.','Money Moves · October 2026','img/me-cover.jpg','Mr Eazi',[
 ('Move 01',L('Start with','the hustle'),'Before the music, he moved to Ghana to study mechanical engineering at KNUST and ran a campus party promotion business on the side, booking artists for student events.','img/me-1.jpg','Mr Eazi',''),
 ('Move 02',L('Build your own','investment arm'),'He set up his own investment firm, Zagadat Capital. It backed payments company pawaPay, where he now sits on the board, along with startups like Eden Life and Ruka Hair.','img/me-2.jpg','Mr Eazi',''),
 ('Move 03',L('Go from ambassador','to owner'),'In 2017 he signed on as betPawa’s brand ambassador, then bought into its parent company. Through Choplife Gaming he runs operations in markets including Uganda, Tanzania and Rwanda, and in 2024 launched his own platform in Côte d’Ivoire.','img/me-3.jpg','Mr Eazi',''),
 ('Move 04',L('Invest in the','next generation'),'In 2018 his emPawa100 programme handpicked 100 emerging African artists and funded each one’s music video with $3,000. Joeboy was one of the artists it helped launch.','img/me-4.jpg','Mr Eazi',''),
 ('Move 05',L('Own the','stage'),'At Detty Rave 7, his year-end concert in Accra, he pledged $2 million to build new indoor and outdoor event venues in the city and called on Ghana’s tourism authority to back it.','img/me-5.jpg','Mr Eazi',''),
 ('Move 06',L('Put money','where it matters'),'In May, Zagadat disclosed a 17.31% stake in Intravenous Infusions, a listed Ghanaian maker of IV fluids and injectables. The firm called it a long-term bet on Ghana’s healthcare and drug manufacturing.','img/me-6.jpg','Mr Eazi',''),
 ('Move 07',L('The next move:','the stock exchange'),'He says he’s at the beginning of the process of listing a technology company on the Nigerian Exchange, pointing to Dangote, Abdul Samad Rabiu and his father-in-law Femi Otedola as the example.','','',''),
])
article('lagos-fashion-week.html','Lagos Fashion Week 2026','Flavor Fashion','Lagos Fashion Week 2026','Everything to know before the runway lights up. 28 October to 1 November, the Crafted season.','Flavor Fashion · 28 Oct – 1 Nov 2026','img/lfw-cover.jpg','Lagos Fashion Week',[
 ('This year’s theme',L('Heritage. Innovation.','Circular futures.'),'This year’s theme is CRAFTED. The season asks how African fashion can draw on its history while finding new ways to design and make clothes that last.','img/lfw-crafted.jpg','Lagos Fashion Week',''),
 ('Since 2011',L('Fifteen years','in the making'),'Founded by Omoyemi Akerele, Lagos Fashion Week has grown into one of the continent’s most important stages for African design.','img/lfw-since.jpg','Lagos Fashion Week',''),
 ('The incubator',L('Where the next','big names start'),'Its Fashion Focus Fund helped launch Orange Culture, Kenneth Ize, IAMISIGO, Emmy Kasbit and Ejiro Amos Tafiri.','img/lfw-incubator.jpg','Lagos Fashion Week',''),
 ('28 Oct – 1 Nov',L('Five days of','African design'),'We’ll be bringing you the standout looks all week. Which designer are you watching?','img/lfw-design.jpg','Lagos Fashion Week',''),
])
# WATCHLIST
WL=[('wl-lupin','Lupin, Part 4','Netflix \u00b7 from Friday 23 October','Omar Sy is back as Assane, breaking out of prison to clear his name after a copycat Lupin frames him.'),
 ('wl-landapart','A Land Apart','In cinemas, Nigeria \u00b7 from Friday 23 October','In a Nigeria built on farming, not oil, a mogul\u2019s secret daughter fights for his empire. RMD and Ramsey Nouah star.'),
 ('wl-spinners','Spinners, Season 2','Mzansi Magic & Africa Magic Showcase \u00b7 Sun 25 Oct','Two years on, Ethan and the crew are spinning stars in Johannesburg, until his old gang comes calling.'),
 ('wl-terminal','The Terminal List, Season 2','Prime Video \u00b7 all 8 episodes out now','Chris Pratt\u2019s James Reece is pulled into a global conspiracy, from the Indian Ocean and Africa to Europe.'),
 ('wl-nofury','No Fury','In cinemas, Nigeria \u00b7 from Friday 23 October','Jim Iyke and Nse Ikpe-Etim star in Akay Mason\u2019s thriller about a marriage that unravels after a hidden betrayal.'),
 ('wl-clayface','Clayface','In cinemas \u00b7 from Friday 23 October','DC goes full body horror: a disfigured actor\u2019s experimental treatment starts to reshape his mind.')]
wl=''.join('<li><span class="n">%02d</span><img src="img/%s.jpg" alt="%s poster" loading="lazy"><div><h3>%s</h3><span class="meta">%s</span><p>%s</p></div></li>'%(i+1,f,e(t),e(t),e(m),e(d)) for i,(f,t,m,d) in enumerate(WL))
page('watchlist.html','The Watchlist','<article class="wrap"><div class="art"><span class="tag">The Watchlist</span><h1>Must watch this weekend</h1><p class="dek">Six picks for 23\u201325 October, across streaming and cinemas.</p><span class="meta">The Watchlist \u00b7 23\u201325 October 2026</span>'
 '<ol class="tracks posters">'+wl+'</ol>'
 '<h2><span class="k">Next Friday</span>How to Ruin Diwali</h2><div class="nextwl"><img src="img/wl-diwali.jpg" alt="How to Ruin Diwali poster" loading="lazy"><div><span class="meta">Netflix \u00b7 Friday 30 October</span><p>Meet the Parents: a South African comedy where two families, two cultures and one wedding collide.</p></div></div></div></article>')

# ABOUT
about=('<div class="wrap phead"><h1>About</h1><p>Flavor Africa is an entertainment media and live experiences brand based in Nairobi, covering music, film, fashion, sport and the business behind them, at home, across the continent and around the world.</p></div>'
 '<section class="wrap block" style="padding-top:36px"><div class="secbar"><h2>What we do</h2></div><div class="pill4">'
 '<div><span class="meta">01</span><h3>Media &amp; Editorial</h3><p>Daily news, features, charts and reviews.</p></div>'
 '<div><span class="meta">02</span><h3>Live &amp; Talent</h3><p>Flavor Artist Live and our own event series.</p></div>'
 '<div><span class="meta">03</span><h3>Brand Partnerships</h3><p>Campaigns made with brands that want a culture-first audience.</p></div>'
 '<div><span class="meta">04</span><h3>Community</h3><p>Fan Seat questions, live shows and a following that talks back.</p></div></div></section>'
 '<section class="wrap block"><div class="secbar"><h2>Book us for</h2></div><div class="svc"><span>Artist hosting</span><span>Interviews</span><span>Live performance booking</span></div></section>'
 '<section class="wrap block" id="contact"><div class="secbar"><h2>Contact</h2></div><div class="contact">'
 '<div><h3 style="font-size:32px;text-transform:uppercase">Samuel Wambua</h3><p class="meta" style="margin-top:6px">CEO, Flavor Africa Group</p></div>'
 '<div><div class="cl"><div><div class="meta">Phone</div><div class="v" id="ph">+254 716 695 240</div></div><button class="copy" type="button" data-copy="ph">Copy</button></div>'
 '<div class="cl"><div><div class="meta">Email</div><div class="v" id="em">samiflinch@gmail.com</div></div><button class="copy" type="button" data-copy="em">Copy</button></div>'
 '<div class="cl"><div><div class="meta">Based in</div><div class="v">Nairobi, Kenya</div></div></div></div></div></section>')
page('about.html','About · flavor.africa',about)
print(sorted(os.listdir(OUT)))
