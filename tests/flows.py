#!/usr/bin/env python3
"""Behaviour checks: home screen, navigation, save-code formats, old-save migration."""
import sys,os,json
from playwright.sync_api import sync_playwright
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))+'/'
src=open(R+'index.html').read()
open('/tmp/_flow.html','w').write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'+src+'</body></html>')
U='file:///tmp/_flow.html'
bad=[];errs=[]
def need(c,m):
    if not c: bad.append(m)
with sync_playwright() as p:
    b=p.chromium.launch()
    def new(seed=None):
        ctx=b.new_context(viewport={'width':390,'height':844},reduced_motion='reduce'); pg=ctx.new_page(); pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto(U)
        if seed:
            for k,v in seed.items(): pg.evaluate('([k,v])=>localStorage.setItem(k,v)',[k,json.dumps(v)])
            pg.reload()
        return pg
    # first launch -> home
    pg=new()
    need('go there' in pg.inner_text('#main').lower(),'first launch should show Home')
    need(not pg.locator('.hero').is_visible(),'hero should be hidden on Home')
    need(pg.locator('.town').count()==3,'Home should list 2 towns + 1 coming soon')
    pg.click('.town >> nth=0'); need(pg.locator('.hero').is_visible() and pg.inner_text('#cityName').lower()=='reno','Start Reno from Home')
    pg.click('.city.home'); need('pick a mission' in pg.inner_text('#main').lower(),'Home chip returns Home')
    pg.reload(); need('pick a mission' in pg.inner_text('#main').lower(),'Home persists across reload')
    pg.click('.town >> nth=1'); pg.reload(); need(pg.inner_text('#cityName').lower()=='virginia city' and pg.locator('.hero').is_visible(),'last town persists across reload')
    # hardware back from a stop returns to the trail, not out of the app
    pg.click('.stop >> nth=0'); pg.go_back(); pg.wait_for_timeout(200); need(pg.locator('.stops').count()==1,'browser Back from a stop returns to the trail')
    # progress shows on Home
    pg.click('.city.home'); need('0 of 4 stamps' in pg.inner_text('#main').lower(),'Home shows progress')
    # old v2 save migrates
    pg=new({'then-now-v2':{'city':'vc','reno':{'done':[1,1,0,0],'claims':[1,0,0,0,0,0,0,0]},'vc':{'done':[1,0,0,0],'claims':[0,0,0,0,0,0,0,0]}}})
    need(pg.inner_text('#cityName').lower()=='virginia city','v2 save keeps last town and skips Home')
    pg.click('#tab-rewards'); code=pg.input_value('#codeOut')
    need(code.startswith('TN3-') and code.count('-')==2,f'v2 migrates to a TN3 code, got {code}')
    pg.click('.city >> text=Reno'); pg.click('#tab-rewards'); need(pg.input_value('#codeOut')==code,'code is the same from either town')
    # v1 save migrates
    pg=new({'then-now-reno-v1':{'done':[1,1,0,0],'claims':[1,0,0,0,0,0,0,0]}})
    need(pg.inner_text('#cityName').lower()=='reno' and '225 XP' in pg.inner_text('#xpText'),'v1 save migrates (225 XP)')
    # restore each code format
    for good,exp in (('TN1-110010000000','225 XP'),('TN2-110010000000-000000000000','225 XP'),('TN3-110010000000-100000000000','225 XP')):
        pg=new(); pg.click('.town >> nth=0'); pg.click('#tab-rewards'); pg.fill('#codeIn',good); pg.click('text=Restore')
        need(exp in pg.inner_text('#xpText'),f'restore {good[:3]} gives {exp}, got {pg.inner_text("#xpText")}')
    pg=new(); pg.click('.town >> nth=0'); pg.click('#tab-rewards'); pg.fill('#codeIn','TN3-1100'); pg.click('text=Restore')
    need('does not look right' in pg.inner_text('#codeMsg').lower(),'bad code is rejected')
    pg.fill('#codeIn','TN3-'+'-'.join(['000000000000']*5)); pg.click('text=Restore'); need('more towns' in pg.inner_text('#codeMsg').lower(),'code with too many towns is rejected with a clear message')
    b.close()
bad+= [f'page error: {e}' for e in errs]
print('FLOWS: '+('OK' if not bad else 'FAILED'))
for x in bad: print(' -',x)
sys.exit(1 if bad else 0)
