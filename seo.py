"""Build crawlable web pages (one per town, one per stop, plus /places/) into site/.
Called by build.py. Everything comes from src/packs, so there is nothing to write by hand.
The game itself stays at /play (noindex)."""
import json,os,re,html
BASE='https://stampthepast.com'
E=lambda s:html.escape(str(s),quote=True)

def trunc(s,n):
    s=re.sub(r'\s+',' ',s).strip()
    if len(s)<=n: return s
    return s[:n-1].rsplit(' ',1)[0].rstrip(' ,;:.')+'…'

CSS='''
:root{--bg:#F3EFE6;--surface:#fff;--surface-2:#E8E2D4;--ink:#13202C;--muted:#55616B;--line:#CFC8B8;--accent:#1B58B8;--accent-ink:#fff;--gold:#E9A91A;--good:#1E7A4C;--bad:#B3322B;--warn:#9A5A08;--navy:#0F1F33;--navy-ink:#F3EFE6}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0E1722;--surface:#16232F;--surface-2:#1D2D3B;--ink:#EEF1F4;--muted:#A5B1BC;--line:#2C3E4D;--accent:#7FB0F5;--accent-ink:#0E1722;--gold:#F2B83A;--good:#5FC38C;--bad:#F08077;--warn:#E4A24A;--navy:#08111B;--navy-ink:#EEF1F4;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#0E1722;--surface:#16232F;--surface-2:#1D2D3B;--ink:#EEF1F4;--muted:#A5B1BC;--line:#2C3E4D;--accent:#7FB0F5;--accent-ink:#0E1722;--gold:#F2B83A;--good:#5FC38C;--bad:#F08077;--warn:#E4A24A;--navy:#08111B;--navy-ink:#EEF1F4;color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:400 17px/1.6 'Public Sans',system-ui,-apple-system,'Segoe UI',sans-serif;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));-webkit-text-size-adjust:100%}
.wrap{max-width:860px;margin:0 auto;padding-block:8px 48px}
h1,h2,h3{font-family:'Big Shoulders Display','Arial Narrow',Impact,sans-serif;text-transform:uppercase;line-height:1;margin:0;text-wrap:balance}
h1{font-size:clamp(38px,9vw,64px);letter-spacing:.005em}
h2{font-size:clamp(26px,5.5vw,34px);letter-spacing:.01em;margin-top:34px}
h3{font-size:22px;letter-spacing:.02em}
p{margin:12px 0 0}a{color:var(--accent)}
.mono{font:500 12px 'IBM Plex Mono',ui-monospace,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-block:16px;flex-wrap:wrap}
.mark{font:800 22px 'Big Shoulders Display','Arial Narrow',Impact,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--ink);text-decoration:none}
.crumbs{font:500 12px 'IBM Plex Mono',ui-monospace,Menlo,monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-top:4px}
.crumbs a{color:var(--muted)}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 24px;border-radius:12px;background:var(--accent);color:var(--accent-ink);font:700 18px 'Big Shoulders Display','Arial Narrow',Impact,sans-serif;letter-spacing:.05em;text-transform:uppercase;text-decoration:none}
.btn:hover{filter:brightness(1.08)}
.top .btn{min-height:40px;padding:0 18px;font-size:16px}
.cmp{max-width:620px;border:1px solid var(--line);border-radius:14px;background:var(--surface);padding:12px;margin-top:18px}
.box{position:relative;aspect-ratio:4/3;border-radius:8px;overflow:hidden;background:var(--surface-2)}
.box img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.box .t{opacity:0}
.row{display:flex;align-items:center;gap:10px;margin-top:10px}
.row span{font:600 12px 'IBM Plex Mono',ui-monospace,Menlo,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.row input{flex:1;min-width:0;height:36px;accent-color:var(--accent)}
.caps{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
.cap{font-size:14px;line-height:1.45;color:var(--muted);min-width:0}
.cap b{display:block;color:var(--ink);font-size:15px}
.cap small{display:block;margin-top:4px;font:500 11px/1.4 'IBM Plex Mono',ui-monospace,Menlo,monospace;overflow-wrap:anywhere}
.story p{font-size:18px}
.dyk{border-left:4px solid var(--gold);background:var(--surface-2);border-radius:0 10px 10px 0;padding:12px 16px;margin-top:20px}
.box2{border:1px solid var(--line);border-radius:12px;background:var(--surface);padding:14px 16px;margin-top:14px}
ul.fc{list-style:none;padding:0;margin:12px 0 0;display:grid;gap:10px}
ul.fc li{border:1px solid var(--line);border-radius:12px;background:var(--surface);padding:12px 14px}
.tag{display:inline-block;font:600 11px 'IBM Plex Mono',ui-monospace,Menlo,monospace;letter-spacing:.1em;text-transform:uppercase;border-radius:99px;padding:2px 10px;margin-right:8px;color:#fff}
.t0{background:var(--good)}.t1{background:var(--warn)}.t2{background:var(--bad)}
ul.src{padding-left:20px;margin:10px 0 0}ul.src li{margin-top:6px;overflow-wrap:anywhere}
.cta{margin-top:34px;background:var(--navy);color:var(--navy-ink);border-radius:16px;padding:24px 20px}
.cta h2{margin-top:0}.cta p{opacity:.92}.cta .btn{margin-top:16px}
.stops{list-style:none;padding:0;margin:14px 0 0;display:grid;grid-template-columns:1fr 1fr;gap:12px}
.stops a{display:block;border:1px solid var(--line);border-radius:12px;background:var(--surface);overflow:hidden;text-decoration:none;color:var(--ink);height:100%}
.stops img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;background:var(--surface-2)}
.stops span{display:block;padding:10px 12px}.stops b{display:block;font-size:16px}.stops small{color:var(--muted);font-size:13px}
ul.towns{list-style:none;padding:0;margin:12px 0 0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px 16px}
.note{font-size:14px;color:var(--muted);margin-top:22px}
footer{border-top:1px solid var(--line);margin-top:40px;padding-top:18px;font:400 12px/1.7 'IBM Plex Mono',ui-monospace,Menlo,monospace;color:var(--muted)}
@media (max-width:640px){.caps,.stops{grid-template-columns:1fr}ul.towns{grid-template-columns:1fr 1fr}}
@media (max-width:380px){ul.towns{grid-template-columns:1fr}}
'''
FONTS='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800&family=IBM+Plex+Mono:wght@400;500;600&family=Public+Sans:wght@400;500;600&display=swap" rel="stylesheet">'
COUNTER='<script>try{if(/^(www\\.)?stampthepast\\.com$|\\.netlify\\.app$/.test(location.hostname)){var g=document.createElement("script");g.async=true;g.src="//gc.zgo.at/count.js";g.setAttribute("data-goatcounter","https://stampthepast.goatcounter.com/count");document.head.appendChild(g);}}catch(e){}</script>'

def page(path,title,desc,body,og=None,ld=None,canon=None):
    url=BASE+'/'+path
    h=['<!doctype html><html lang="en"><head><meta charset="utf-8">',
       '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
       COUNTER,'<title>%s</title>'%E(title),'<meta name="description" content="%s">'%E(desc),
       '<link rel="canonical" href="%s">'%url,'<meta name="theme-color" content="#0f1f33">',
       '<link rel="icon" href="/icon-192.png">','<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
       '<meta property="og:type" content="article">','<meta property="og:site_name" content="Stamp the Past">',
       '<meta property="og:title" content="%s">'%E(title),'<meta property="og:description" content="%s">'%E(desc),
       '<meta property="og:url" content="%s">'%url]
    if og:
        h.append('<meta property="og:image" content="%s/photos/%s.jpg">'%(BASE,og)); h.append('<meta name="twitter:card" content="summary_large_image">')
    h.append(FONTS); h.append('<style>'+CSS+'</style>')
    if ld: h.append('<script type="application/ld+json">'+json.dumps(ld,ensure_ascii=False)+'</script>')
    h.append('</head><body><div class="wrap">')
    h.append('<div class="top"><a class="mark" href="/">Stamp the Past</a><a class="btn" href="/play">Play free</a></div>')
    h.append(body)
    h.append('<footer><p><a href="/places/">All places</a> · <a href="/privacy.html">Privacy</a> · <a href="/support.html">Support</a> · stampthepast@gmail.com</p><p>Made by a mom and her teenage son. Photos are public domain or freely licensed and credited above. Story text is written from the cited sources.</p></footer>')
    h.append('</div></body></html>')
    out=os.path.join(OUT,path)
    os.makedirs(os.path.dirname(out),exist_ok=True)
    open(out,'w').write(''.join(h))

def credit(ph):
    if not ph: return ''
    bits=['Photo: '+E(ph.get('by','Unknown author'))]
    lic=ph.get('lic','')
    if lic: bits.append('<a href="%s" target="_blank" rel="noopener">%s</a>'%(E(ph['lu']),E(lic)) if ph.get('lu') else E(lic))
    if ph.get('page'): bits.append('<a href="%s" target="_blank" rel="noopener">Source</a>'%E(ph['page']))
    if ph.get('note'): bits.append(E(ph['note']))
    return ' · '.join(bits)

def build(R,packs,order,tstate,tfull,common_ids=None):
    global OUT
    OUT=R+'site/'
    urls=[]
    n_stops=0
    for tid in order:
        p=packs[tid]; st=tstate.get(tid,''); stname=(tfull.get(st,'') if st and '/' not in st else '')
        tname=p['name']; place=tname+(', '+st if st and st!='DC' and '/' not in st and not re.search(r',\s*\S+$',tname) else '')
        stops=p['stops']
        # ---- town page ----
        cards=[]
        for s in stops:
            k=(s['now'].get('ph') or s['then'].get('ph') or {}).get('k')
            cards.append('<li><a href="/%s/%s/">%s<span><b>%s</b><small>%s</small></span></a></li>'%(tid,s['id'],
                '<img loading="lazy" width="640" height="480" alt="%s" src="/photos/%s.jpg">'%(E(s['name']+' today'),k) if k else '',E(s['name']),E(s['teaser'])))
        hero=next(((s['now'].get('ph') or s['then'].get('ph') or {}).get('k') for s in stops if (s['now'].get('ph') or s['then'].get('ph'))),None)
        body=('<div class="crumbs"><a href="/places/">Places</a> › %s</div><h1>%s: then and now</h1>'%(E(p.get('region','')),E(place))
              +'<p>%d real landmarks in %s, each with an old photo you can fade into today\'s view. %s</p>'%(len(stops),E(tname),E(trunc(p.get('mission',''),220)))
              +'<ul class="stops">'+''.join(cards)+'</ul>'
              +'<div class="cta"><h2>Walk it. Stamp it.</h2><p>Visit all %d stops in %s, answer what is in front of you, and earn the town\'s passport stamps. Free, no sign-up.</p><a class="btn" href="/play">Play %s</a></div>'%(len(stops),E(tname),E(tname))
              +'<p class="note">Written from sources; not yet walked on site unless a stop says otherwise.</p>')
        ld={"@context":"https://schema.org","@type":"CollectionPage","name":place+': then and now',"url":BASE+'/%s/'%tid}
        page(tid+'/index.html',f'{place}: historic landmarks then and now | Stamp the Past',
             f'{len(stops)} historic landmarks in {tname} with old photos vs today: '+', '.join(s['name'] for s in stops)+'.',body,hero,ld)
        urls.append('/%s/'%tid)
        # ---- stop pages ----
        for i,s in enumerate(stops):
            n_stops+=1
            th,nw=s['then'],s['now']; tph,nph=th.get('ph'),nw.get('ph')
            sl=''
            if tph and nph:
                sl=('<div class="cmp"><div class="box"><img alt="%s, %s" src="/photos/%s.jpg" width="640" height="480"><img class="t" id="t" alt="%s, %s" src="/photos/%s.jpg" width="640" height="480"></div>'
                    '<div class="row"><span>Now</span><input id="r" type="range" min="0" max="100" value="0" aria-label="Fade between now and then"><span>Then</span></div></div>'
                    %(E(s['name']),E(nw['yr']),nph['k'],E(s['name']),E(th['yr']),tph['k']))
                sl+='<script>(function(){var r=document.getElementById("r"),t=document.getElementById("t");r.addEventListener("input",function(){t.style.opacity=r.value/100})})()</script>'
            elif nph or tph:
                ph=nph or tph; sl='<div class="cmp"><div class="box"><img alt="%s" src="/photos/%s.jpg" width="640" height="480"></div></div>'%(E(s['name']),ph['k'])
            caps='<div class="caps"><div class="cap"><b>Then, %s</b>%s<small>%s</small></div><div class="cap"><b>Today, %s</b>%s<small>%s</small></div></div>'%(
                E(th['yr']),E(th['line']),credit(tph),E(nw['yr']),E(nw['line']),credit(nph))
            story=''.join('<p>%s</p>'%E(x) for x in s['story'])
            fcs=''
            if s.get('claims'):
                lab={0:'Solid',1:'Disputed',2:'Not true'}
                fcs='<h2>Fact or tall tale?</h2><ul class="fc">'+''.join('<li><span class="tag t%d">%s</span>%s<br><span style="color:var(--muted);font-size:15px">%s</span></li>'%(c['a'],lab[c['a']],E(c['t']),E(c['why'])) for c in s['claims'])+'</ul>'
            disp=('<div class="box2"><b>Historians argue about this.</b> %s</div>'%E(s['disputed'])) if s.get('disputed') else ''
            src='<h2>Sources</h2><ul class="src">'+''.join('<li><a href="%s" target="_blank" rel="noopener">%s</a></li>'%(E(x['u']),E(x['t'])) for x in s['sources'])+'</ul>'
            more=''
            if th.get('link'): more='<p class="note">More: <a href="%s" target="_blank" rel="noopener">%s</a></p>'%(E(th['link']['u']),E(th['link']['t']))
            others=''.join('<li><a href="/%s/%s/">%s</a></li>'%(tid,o['id'],E(o['name'])) for o in stops if o['id']!=s['id'])
            nxt=stops[(i+1)%len(stops)]
            body=('<div class="crumbs"><a href="/places/">Places</a> › <a href="/%s/">%s</a></div><h1>%s: then and now</h1>'%(tid,E(place),E(s['name']))
                  +'<p class="mono" style="margin-top:10px">%s vs %s · %s</p>'%(E(th['yr']),E(nw['yr']),E(place))
                  +sl+caps+'<h2>The story</h2><div class="story">'+story+'</div>'
                  +'<div class="dyk"><b>Did you know?</b> %s</div>'%E(s['fact'])+disp+fcs+src+more
                  +'<div class="cta"><h2>Stamp it in person</h2><p>Go there, answer the question that only someone standing at %s can answer, and add the stamp to your passport. Free, no sign-up.</p><a class="btn" href="/play">Play %s</a></div>'%(E(s['name']),E(tname))
                  +'<h2>More in %s</h2><ul class="src">%s</ul><p class="note">Next: <a href="/%s/%s/">%s</a>. Written from the cited sources, not yet walked on site unless noted.</p>'%(E(tname),others,tid,nxt['id'],E(nxt['name'])))
            ld=[{"@context":"https://schema.org","@type":"Article","headline":f"{s['name']}: then and now","description":trunc(s['story'][0],200),
                 "image":[BASE+'/photos/%s.jpg'%k for k in [(nph or {}).get('k'),(tph or {}).get('k')] if k],
                 "author":{"@type":"Organization","name":"Stamp the Past"},"mainEntityOfPage":BASE+'/%s/%s/'%(tid,s['id'])},
                {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
                 {"@type":"ListItem","position":1,"name":"Places","item":BASE+'/places/'},
                 {"@type":"ListItem","position":2,"name":place,"item":BASE+'/%s/'%tid},
                 {"@type":"ListItem","position":3,"name":s['name'],"item":BASE+'/%s/%s/'%(tid,s['id'])}]}]
            if s.get('geo'):
                ld.append({"@context":"https://schema.org","@type":"Place","name":s['name'],"geo":{"@type":"GeoCoordinates","latitude":s['geo'][0],"longitude":s['geo'][1]}})
            page(f'{tid}/{s["id"]}/index.html',next((c for c in (f"{s['name']}, {place}: then and now",f"{s['name']}, {tname}: then and now",f"{s['name']}: then and now") if len(c)<=58),f"{s['name']}, {tname}")+' | Stamp the Past',
                 trunc(f"{s['name']} in {place}, {th['yr']} versus today. "+s['story'][0],158),body,(nph or tph or {}).get('k'),ld)
            urls.append('/%s/%s/'%(tid,s['id']))
    # ---- index of all places ----
    regs={}
    for tid in order: regs.setdefault(packs[tid].get('region','Other'),[]).append(tid)
    b='<h1>All places</h1><p>%d towns, %d landmarks, each with an old photo and a modern one. Pick a town.</p>'%(len(order),n_stops)
    for r,ids in regs.items():
        b+='<h2>%s</h2><ul class="towns">'%E(r)+''.join('<li><a href="/%s/">%s</a></li>'%(t,E(packs[t]['name'])) for t in ids)+'</ul>'
    page('places/index.html','All places: historic landmarks then and now | Stamp the Past',f'{len(order)} US towns and {n_stops} historic landmarks with then-and-now photos, sourced stories and fact checks.',b)
    urls.append('/places/')
    return urls
