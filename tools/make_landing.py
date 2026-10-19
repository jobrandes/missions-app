#!/usr/bin/env python3
"""Fill landing/template.html with photos from src/photos and write landing/index.html."""
import base64,re,os
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))+'/'
t=open(R+'landing/template.html').read()
def uri(m):
    k=m.group(1)
    return 'data:image/jpeg;base64,'+base64.b64encode(open(R+f'src/photos/{k}.jpg','rb').read()).decode()
out=re.sub(r'\{\{([A-Za-z0-9_]+)\}\}',uri,t)
open(R+'landing/index.html','w').write(out)
print('landing/index.html',len(out)//1024,'KB')
