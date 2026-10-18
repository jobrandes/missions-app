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
