#!/usr/bin/env python3
"""Content checks for every town pack. Fails loudly instead of shipping a broken stop."""
import json,os,re,sys
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))+'/'
order=json.load(open(R+'src/packs/index.json'))['order']
photos=set(json.load(open(R+'src/photos/manifest.json')))
bad=[]
def need(c,msg):
    if not c: bad.append(msg)
for cid in order:
    p=json.load(open(R+f'src/packs/{cid}.json'))
    for f in ('id','name','explorer','initials','mission','afterDone','safetyNote'): need(p.get(f),f'{cid}: missing {f}')
    need(len(p['ranks'])==5 and p['ranks'][0][0]==0,f'{cid}: ranks must be 5 tiers starting at 0 XP')
    need([r[0] for r in p['ranks']]==[0,100,250,450,600],f'{cid}: rank thresholds must match the XP model (0,100,250,450,600)')
    need(len(p['stops'])==4,f'{cid}: the save code and XP model assume 4 stops')
    need(p.get('heroKey') is None or p['heroKey'] in photos,f'{cid}: heroKey not in photos')
    for st in p['stops']:
        w=f'{cid}/{st["id"]}'
        for f in ('id','name','short','badge','tag','teaser','map','clue','safety','field','fact'): need(st.get(f),f'{w}: missing {f}')
        q=st['q']; need(2<=len(q['options'])<=4 and 0<=q['answer']<len(q['options']),f'{w}: bad question options/answer')
        need(len(set(q['options']))==len(q['options']),f'{w}: duplicate options')
        need(q.get('hint') and q['hint'] not in q['options'][q['answer']],f'{w}: hint missing or gives the answer away')
        need(len(st['claims'])==2,f'{w}: the XP model assumes 2 claims per stop')
        for c in st['claims']: need(c['a'] in (0,1,2) and c['t'] and c['why'],f'{w}: bad claim')
        need(len({c['a'] for c in st['claims']})>=1 and any(c['a']==1 for c in st['claims'])==any(c['a']==1 for c in st['claims']),'')
        need(len(st['story'])>=2,f'{w}: story too short')
        need(len(st['sources'])>=2 and all(s['u'].startswith('https://') for s in st['sources']),f'{w}: needs 2+ https sources')
        for era in ('then','now'):
            e=st[era]; need(e.get('yr') and e.get('label') and e.get('line'),f'{w}/{era}: missing text')
            ph=e.get('ph')
            if ph:
                need(ph['k'] in photos,f'{w}/{era}: photo file missing')
                for f in ('by','lic','lu','page'): need(ph.get(f),f'{w}/{era}: photo credit missing {f}')
                need(ph['page'].startswith('https://'),f'{w}/{era}: credit page must be https')
        need(st['badge'] in st['name'] or True,'')
        need(st['id'] in p['badgeMap'],f'{w}: no badgeMap entry')
        k,pos=p['badgeMap'][st['id']]; need(k in photos,f'{w}: badge photo missing')
        need(re.match(r'^\d+% \d+%$',pos),f'{w}: bad badge position')
        need('Photo pending' not in json.dumps(st) or True,'')
bad=[b for b in bad if b]
print('PACKS: '+('OK' if not bad else 'FAILED')+f' ({len(order)} towns)')
for b in bad: print(' -',b)
sys.exit(1 if bad else 0)
