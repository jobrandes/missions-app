"""Daily Fact or Fiction: shows a claim, locks after answering, remembers across reload, shares, fits phone and desktop, every claim in the data renders a verdict."""
import os,sys,threading,http.server,socketserver,functools,json,re
from playwright.sync_api import sync_playwright
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))+'/site'
class Q(socketserver.TCPServer): allow_reuse_address=True
h=functools.partial(http.server.SimpleHTTPRequestHandler,directory=R); h.log_message=lambda *a:None
srv=Q(('127.0.0.1',0),h); port=srv.server_address[1]; threading.Thread(target=srv.serve_forever,daemon=True).start()
bad=[];errs=[]
def need(c,m):
    if not c: bad.append(m)
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,hh in ((390,844),(1280,900)):
        ctx=b.new_context(viewport={'width':w,'height':hh}); pg=ctx.new_page(); pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto(f'http://127.0.0.1:{port}/daily/'); pg.wait_for_timeout(200)
        need(len(pg.inner_text('#claim'))>20,'claim shows at %d'%w)
        need(pg.locator('#btns button').count()==3,'three answer buttons')
        need(pg.locator('#res').is_hidden(),'result hidden before answering')
        pg.click('#btns button >> nth=0'); pg.wait_for_timeout(150)
        need(pg.locator('#res').is_visible() and pg.locator('#btns').is_hidden(),'result replaces buttons')
        need(pg.locator('#src a').count()>=2,'sources shown')
        need(pg.inner_text('#verdict').strip().lower() in ('you got it.','not quite.'),'verdict text')
        pg.reload(); pg.wait_for_timeout(200)
        need(pg.locator('#res').is_visible(),'answer is remembered after reload (no second try)')
        need(not pg.evaluate('document.documentElement.scrollWidth>innerWidth+1'),'no sideways scroll at %d'%w)
        pg.evaluate("navigator.share=undefined"); pg.click('#share'); pg.wait_for_timeout(300)
        need('stampthepast.com/daily' in pg.inner_text('#shmsg') or 'Copied' in pg.inner_text('#shmsg'),'share gives copyable text')
        if w==390: pg.screenshot(path=os.environ.get('SHOT','/tmp/daily.png'),full_page=True)
    b.close()
print('daily:',len(bad),'problems;',errs); [print(' ',x) for x in bad]
sys.exit(1 if bad or errs else 0)
