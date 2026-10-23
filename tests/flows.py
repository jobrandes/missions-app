#!/usr/bin/env python3
"""Behaviour checks: home screen, navigation, save-code formats, old-save migration."""
import sys,os,json
from playwright.sync_api import sync_playwright
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))+'/'
src=open(R+'index.html').read()
open(R+'src/_flow.html','w').write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'+src+'</body></html>')
NT=len(json.load(open(R+'src/packs/index.json'))['order'])
U='file://'+R+'src/_flow.html'
bad=[];errs=[]
def need(c,m):
    if not c: bad.append(m)
with sync_playwright() as p:
    b=p.chromium.launch()
    def new(seed=None,tour=False):
        ctx=b.new_context(viewport={'width':390,'height':844},reduced_motion='reduce')
        if not tour: ctx.add_init_script("try{localStorage.setItem('then-now-tour','1')}catch(e){}")
        if seed:
            js="try{if(!sessionStorage.getItem('_seeded')){sessionStorage.setItem('_seeded','1');"+''.join("localStorage.setItem(%s,%s);"%(json.dumps(k),json.dumps(json.dumps(v))) for k,v in seed.items())+"}}catch(e){}"
            ctx.add_init_script(js)
        pg=ctx.new_page(); pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto(U)
        return pg
    # first-run tour shows once, can be finished, and does not return
    pg=new(tour=True); need(pg.locator('#tour').count()==1,'first-run tour shows on a fresh phone')
    pg.click('[data-a=tournext]'); pg.click('[data-a=tournext]'); pg.click('[data-a=tourback]'); need(pg.locator('#tourT').inner_text().lower().startswith('find it'),'tour Back returns a step')
    for _ in range(3): pg.click('[data-a=tournext]')
    need(pg.locator('#tour').count()==0,'tour closes after the last step'); pg.reload(); pg.wait_for_timeout(300); need(pg.locator('#tour').count()==0,'tour does not return after finishing')
    # first launch -> home
    pg=new()
    need('go there' in pg.inner_text('#main').lower(),'first launch should show Home')
    need(not pg.locator('.hero').is_visible(),'hero should be hidden on Home')
    need(pg.locator('#missions .town:not(.soon)').count()==NT and pg.locator('#missions .town.soon').count()==1,f'Home should list {NT} towns + 1 coming soon')
    pg.click('.town >> nth=0'); need(pg.locator('.hero').is_visible() and pg.inner_text('#cityName').lower()=='reno','Start Reno from Home')
    pg.click('.city.home'); need('pick a mission' in pg.inner_text('#main').lower(),'Home chip returns Home')
    pg.reload(); need('pick a mission' in pg.inner_text('#main').lower(),'Home persists across reload')
    pg.click('.town >> nth=1'); pg.reload(); need(pg.inner_text('#cityName').lower()=='virginia city' and pg.locator('.hero').is_visible(),'last town persists across reload')
    # hardware back from a stop returns to the trail, not out of the app
    pg.click('.stop >> nth=0'); pg.go_back(); pg.wait_for_timeout(200); need(pg.locator('.stops').count()==1,'browser Back from a stop returns to the trail')
    # progress shows on Home
    pg.click('.city.home'); need('0 of 4 stamps' in pg.inner_text('#main').lower(),'Home shows progress')
    # resume card appears for a town in progress
    pg=new({'then-now-v3':{'city':'reno','home':True,'p':{'reno':{'done':[1,0,0,0],'claims':[0,0,0,0,0,0,0,0]}}}})
    need(pg.locator('.resume .rcard').count()==1 and '1 of 4' in pg.inner_text('.resume'),'Home shows a resume card for a town in progress')
    pg.click('.rcard'); need(pg.inner_text('#cityName').lower()=='reno','resume card opens that town')
    # finishing the 4th stamp shows the celebration once; passport lists stamps
    pg=new({'then-now-v3':{'city':'reno','home':0,'p':{'reno':{'done':[1,1,1,0],'claims':[0,0,0,0,0,0,0,0]}}}})
    pg.click('.stop >> nth=3'); pg.click('text=I am here')
    for k in range(4):
        pg.locator('.opt').nth(k).click()
        if pg.query_selector('.opt.right'): break
    pg.wait_for_selector('#celeb',timeout=3000); need('mission complete' in pg.inner_text('#celeb').lower(),'celebration shows on the 4th stamp')
    pg.click('text=See my passport'); pg.wait_for_timeout(300)
    need(pg.locator('#celeb').count()==0 and pg.locator('#passport .pprow.full').count()==1,'passport shows the completed mission and closes the celebration')
    pg.reload(); pg.click('.town >> nth=0'); pg.wait_for_timeout(700); need(pg.locator('#celeb').count()==0,'celebration does not repeat')
    # final challenge: only after all four stamps; scores and saves best
    pg=new({'then-now-v3':{'city':'reno','home':0,'p':{'reno':{'done':[1,1,1,0],'claims':[0,0,0,0,0,0,0,0]}}}})
    need(pg.locator('[data-a=boss]').count()==0,'final challenge is hidden until the mission is complete')
    pg=new({'then-now-v3':{'city':'reno','home':0,'p':{'reno':{'done':[1,1,1,1],'claims':[0,0,0,0,0,0,0,0]}}},'then-now-cel':{'reno':1}})
    pg.wait_for_timeout(400)
    pg.click('[data-a=boss]')
    for i in range(4):
        pg.locator('.opt').first.click(); pg.click('[data-a=bnext]')
    need('of 4' in pg.inner_text('.boss-res').lower() and pg.evaluate("localStorage.getItem('then-now-boss')")!=None,'final challenge ends with a score and saves it')
    pg.click('text=Back to the trail'); need(pg.locator('.stops').count()==1,'final challenge returns to the trail')
    # perfect final challenge earns a gold seal and points; feedback shows per answer
    boss_ans=[q['a'] for q in json.load(open(R+'src/boss.json'))['reno']]
    pg=new({'then-now-v3':{'city':'reno','home':0,'p':{'reno':{'done':[1,1,1,1],'claims':[0,0,0,0,0,0,0,0]}}},'then-now-cel':{'reno':1}})
    pg.click('[data-a=boss]')
    for i,a in enumerate(boss_ans):
        pg.locator('.opt').nth(a).click()
        need(pg.locator('.bfb.good').count()==1,'right answer shows a good line')
        pg.click('[data-a=bnext]')
    need(pg.locator('.boss-res .seal[aria-label="Gold Seal"]').count()==1,'perfect run earns a gold seal')
    need('+300 challenge points' in pg.inner_text('.boss-res').lower(),'perfect run earns 300 challenge points')
    pg.click('[data-a=bossexit]'); need(pg.locator('.sealwrap .seal').count()==1,'trail shows the earned seal')
    pg=new({'then-now-v3':{'city':'reno','home':0,'p':{'reno':{'done':[1,1,1,1],'claims':[0,0,0,0,0,0,0,0]}}},'then-now-cel':{'reno':1}})
    pg.click('[data-a=boss]')
    for i,a in enumerate(boss_ans):
        pg.locator('.opt').nth((a+1)%4).click()
        need(pg.locator('.bfb.bad').count()==1,'wrong answer shows a bad line')
        pg.click('[data-a=bnext]')
    need(pg.locator('.boss-res .seal').count()==0,'zero correct earns no seal')
    # report a problem: dialog opens, needs text, sends with where-context, and fails gracefully
    pg=new(); pg.click('[data-a=report]'); need(pg.locator('#report').count()==1,'report dialog opens from Home')
    pg.click('[data-a=repsend]'); need('sentence' in pg.inner_text('#repMsgOut').lower(),'empty report asks for text')
    pg.fill('#repMsg','The plaque says 1987'); pg.click('[data-a=repsend]'); pg.wait_for_timeout(300)
    need(pg.locator('#report').count()==1 and 'could not send' in pg.inner_text('#repMsgOut').lower(),'failed send stays open with a clear message')
    pg.evaluate("()=>{window.fetch=function(u,o){window.__sent=o.body;return Promise.resolve({ok:true})}}")
    pg.click('[data-a=repsend]'); pg.wait_for_timeout(200)
    need(pg.locator('#report').count()==0 and 'form-name=report' in pg.evaluate('window.__sent') and 'plaque+says' in pg.evaluate('window.__sent'),'successful send posts the report and closes')
    pg=new({'then-now-v3':{'city':'reno','home':0,'p':{'reno':{'done':[0,0,0,0],'claims':[0,0,0,0,0,0,0,0]}}}})
    pg.click('.stop >> nth=0'); pg.click('[data-a=report]'); need('reno / ' in pg.evaluate("document.getElementById('report').dataset.where").lower(),'report carries the stop context')
    pg.keyboard.press('Escape'); need(pg.locator('#report').count()==0,'Escape closes the report dialog')
    # finishing a stop points at the next one
    pg=new({'then-now-v3':{'city':'reno','home':0,'p':{'reno':{'done':[1,0,0,0],'claims':[1,1,0,0,0,0,0,0]}}}})
    pg.click('.stop >> nth=0'); pg.click('text=sort fact from fiction')
    need(pg.locator('.nextstop [data-a=nextstop]').count()==1,'finished stop offers a Next stop button')
    pg.click('[data-a=nextstop]'); need('i am here' in pg.inner_text('#main').lower(),'Next stop opens the next stop at Find it')
    pg=new({'then-now-v3':{'city':'reno','home':0,'p':{'reno':{'done':[1,1,1,1],'claims':[1,1,1,1,1,1,1,1]}}},'then-now-cel':{'reno':1}})
    pg.click('.stop >> nth=3'); pg.click('text=sort fact from fiction')
    need(pg.locator('[data-a=bossgo]').count()==1,'last stop offers the final challenge')
    pg.click('[data-a=bossgo]'); need(pg.locator('.opt').count()>=4,'final challenge opens from the last stop')
    # old v2 save migrates
    pg=new({'then-now-v2':{'city':'vc','reno':{'done':[1,1,0,0],'claims':[1,0,0,0,0,0,0,0]},'vc':{'done':[1,0,0,0],'claims':[0,0,0,0,0,0,0,0]}}})
    need(pg.inner_text('#cityName').lower()=='virginia city','v2 save keeps last town and skips Home')
    pg.click('#tab-rewards'); code=pg.input_value('#codeOut')
    need(code.startswith('TN3-') and code.count('-')==NT,f'v2 migrates to a TN3 code, got {code}')
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
    pg.fill('#codeIn','TN3-'+'-'.join(['000000000000']*(NT+1))); pg.click('text=Restore'); need('more towns' in pg.inner_text('#codeMsg').lower(),'code with too many towns is rejected with a clear message')
    # try it from home: preview unlocks the story but saves nothing
    pg=new(); pg.click('.town >> nth=0'); pg.click('.stoplist button >> nth=0') if pg.locator('.stoplist button').count() else pg.click('[data-a=open] >> nth=0')
    need(pg.locator('[data-a=demo]').count()==1,'unstamped stop offers Try it from home')
    pg.click('[data-a=demo]'); need(pg.locator('.demo-banner').count()==1,'demo shows a preview banner')
    for k in range(4):
        if pg.locator('.earned').count(): break
        pg.click('.opt >> nth=%d'%k)
    need('preview only' in pg.inner_text('#main').lower(),'demo answer says preview only')
    pg.click('[data-a=exit]'); pg.click('#tab-rewards')
    need('0 XP' in pg.inner_text('#xpText') or pg.inner_text('#xpText').strip().startswith('0'),f'demo leaves XP at zero, got {pg.inner_text("#xpText")}')
    b.close()
bad+= [f'page error: {e}' for e in errs]
print('FLOWS: '+('OK' if not bad else 'FAILED'))
for x in bad: print(' -',x)
sys.exit(1 if bad else 0)
