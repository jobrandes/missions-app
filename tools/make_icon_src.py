import sys
from playwright.sync_api import sync_playwright
def svg(mask):
    s = 0.78 if mask else 1.0   # maskable: keep art inside safe zone
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
<defs><filter id="r" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="1" seed="4" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.7 1.25" result="a"/><feComposite in="SourceGraphic" in2="a" operator="in"/></filter>
<path id="arc" d="M 100 256 A 156 156 0 0 1 412 256"/></defs>
<rect width="512" height="512" fill="#0e1d33"/>
<g transform="translate(256 256) scale({s}) rotate(-10) translate(-256 -256)">
<g filter="url(#r)" fill="none" stroke="#f2a900">
<circle cx="256" cy="256" r="218" stroke-width="22"/>
<circle cx="256" cy="256" r="184" stroke-width="6"/>
<g fill="#f2a900" stroke="none">
<text font-family="DejaVu Sans, Arial" font-weight="900" font-size="40" letter-spacing="3" text-anchor="middle"><textPath href="#arc" startOffset="50%">STAMP THE PAST</textPath></text>
<path d="M256 322 l9 -28 h30 l-24 18 9 28 -24 -17 -24 17 9 -28 -24 -18 h30z" transform="translate(0 80) scale(1) translate(0 0)" opacity="0"/>
<!-- landmark: pediment, columns, steps -->
<path d="M156 232 L256 168 L356 232 Z"/>
<rect x="164" y="242" width="184" height="14"/>
<rect x="172" y="262" width="22" height="78"/><rect x="214" y="262" width="22" height="78"/><rect x="276" y="262" width="22" height="78"/><rect x="318" y="262" width="22" height="78"/>
<rect x="156" y="346" width="200" height="14"/><rect x="144" y="366" width="224" height="14"/>
</g></g></g></svg>'''
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium') if False else p.chromium.launch()
    pg = b.new_page(viewport={'width':512,'height':512})
    for name,mask,size in (('icon-512',0,512),('icon-maskable-512',1,512),('icon-192',0,192),('apple-touch-icon',0,180)):
        pg.set_viewport_size({'width':size,'height':size})
        pg.set_content(f'<body style="margin:0"><div style="width:{size}px;height:{size}px">{svg(mask).replace("width=\"512\" height=\"512\"",f"width=\"{size}\" height=\"{size}\"",1)}</div></body>')
        pg.screenshot(path=f'src/assets/{name}.png')
    b.close()
