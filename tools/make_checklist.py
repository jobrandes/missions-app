"""Writes docs/verification-checklist.md: every stop, its check-in question, the expected answer, and what to confirm on site."""
import json,os
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
idx=json.load(open(R+'/src/packs/index.json'))
out=['# On-site verification checklist','',
'Take this to each stop. Mark it verified only if you were standing there. Then tell Claude: the stop, the date, and anything that differs. A verified stop shows a "Verified on site" badge in the app.','',
'For each stop confirm: (1) the check-in answer is right and cannot be guessed from the clue alone, (2) the safety note is accurate, (3) the spot is reachable and public, (4) any markers or signs mentioned are still there, (5) take your own photo if you can (it can become the "now" photo, credited to you).','']
for k in idx['order']:
    p=json.load(open(f'{R}/src/packs/{k}.json'))
    out+=[f'## {p["name"]} ({p.get("region","")})','']
    for st in p['stops']:
        q=st['q']; ans=q['options'][q['answer']]; v=st.get('verified')
        out+=[f'### [{"x" if v else " "}] {st["name"]}',f'- Map search: {st["map"]}',f'- Question: {q["prompt"]}',f'- Options: {" / ".join(q["options"])}',f'- Expected answer: **{ans}**',f'- Source note: {q.get("verify","none")}',f'- Notes from the visit: ','']
open(R+'/docs/verification-checklist.md','w').write('\n'.join(out))
print('wrote checklist')
