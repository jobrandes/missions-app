#!/usr/bin/env python3
"""Build the app from src/ into a single self-contained index.html.
Usage: python3 build.py            (writes ./index.html)
Adding a town: drop src/packs/<id>.json and add its id to src/packs/index.json."""
import json,base64,os
R=os.path.dirname(os.path.abspath(__file__))+'/'
def rd(p,mode='r'): return open(R+p,mode).read() if mode=='r' else open(R+p,'rb').read()
keys=json.loads(rd('src/photos/manifest.json'))
photos={k:'data:image/jpeg;base64,'+base64.b64encode(rd(f'src/photos/{k}.jpg','rb')).decode() for k in keys}
order=json.loads(rd('src/packs/index.json'))['order']
packs={k:json.loads(rd(f'src/packs/{k}.json')) for k in order}
# every photo a pack references must exist
for k,p in packs.items():
    for st in p['stops']:
        for era in ('then','now'):
            ph=st[era].get('ph')
            assert not ph or ph['k'] in photos, f'{k}/{st["id"]}/{era}: missing photo {ph["k"]}'
    assert not p.get('heroKey') or p['heroKey'] in photos, f'{k}: missing hero'
idx=json.loads(rd('src/packs/index.json'))
data={'right':json.loads(rd('src/right.json')),'order':order,'soon':idx.get('soon',[]),'packs':packs}
js=rd('src/app.js').replace('__PHOTOS__',json.dumps(photos,ensure_ascii=False,separators=(',',':'))).replace('__DATA__',json.dumps(data,ensure_ascii=False,separators=(',',':')))
out=rd('src/head.html')+'<style>\n'+rd('src/styles.css')+'</style>'+rd('src/body.html')+'<script>\n'+js+'</script>'
open(R+'index.html','w').write(out)
print('built index.html',len(out)//1024,'KB;',len(photos),'photos;',len(packs),'towns')

# Standalone copy for static hosting (Netlify test site). Same content, wrapped in a full document.
os.makedirs(R+'site',exist_ok=True)
reset='<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>'
full=('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex"><link rel="manifest" href="manifest.webmanifest"><link rel="apple-touch-icon" href="apple-touch-icon.png"><meta name="theme-color" content="#0e1d33"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Then &amp; Now">'
  +rd('src/head.html')+reset+'<style>\n'+rd('src/styles.css')+'</style></head><body>'+rd('src/body.html')+'<script>\n'+js+'</script></body></html>')
open(R+'site/index.html','w').write(full)
open(R+'site/_headers','w').write('/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  X-Robots-Tag: noindex\n')

import shutil
for pg in ('privacy.html','support.html'):
    shutil.copy(R+'src/pages/'+pg,R+'site/'+pg)
print('copied pages')

# --- offline support for the static site ---
import hashlib
h=hashlib.sha1(full.encode()).hexdigest()[:10]
open(R+'site/sw.js','w').write(rd('src/sw.js').replace('__BUILD__',h))
open(R+'site/manifest.webmanifest','w').write(json.dumps({"name":"Then & Now","short_name":"Then & Now","start_url":"./","scope":"./","display":"standalone","background_color":"#0e1d33","theme_color":"#0e1d33","description":"Missions for real places.","icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png"},{"src":"icon-512.png","sizes":"512x512","type":"image/png"},{"src":"icon-maskable-512.png","sizes":"512x512","type":"image/png","purpose":"maskable"}]}))
for f in ('icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png'):
    shutil.copy(R+'src/assets/'+f,R+'site/'+f)
hd=open(R+'site/_headers').read()+'/sw.js\n  Cache-Control: no-cache\n/index.html\n  Cache-Control: no-cache\n'
open(R+'site/_headers','w').write(hd)
print('offline files written, build',h)
