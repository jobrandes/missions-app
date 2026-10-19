(function(){
  /* ---------- scene + badge drawing ---------- */
  var BMAPS={}; Object.keys(__DATA__.packs).forEach(function(k){ BMAPS[k]=__DATA__.packs[k].badgeMap||{}; });
  function mono(id,pid){
    pid=pid||cityId; var c=CITIES[pid];
    if(id==='master') return c.initials;
    var t='?'; c.stops.forEach(function(st){ if(st.id===id) t=st.short.replace(/[^A-Za-z]/g,'').slice(0,2).toUpperCase(); });
    return t;
  }
  function badge(id,on,pid){
    pid=pid||cityId; var c=CITIES[pid];
    var m=(id==='master')?(c.heroKey&&PHOTOS[c.heroKey]?[c.heroKey,'50% 60%']:null):(BMAPS[pid]||{})[id];
    if(m&&PHOTOS[m[0]]) return '<span class="bimg'+(on?' on':'')+'"><img src="'+PHOTOS[m[0]]+'" alt="" style="object-position:'+m[1]+'"></span>';
    return '<span class="bimg plain'+(on?' on':'')+'"><b>'+mono(id,pid)+'</b></span>';
  }
  var PHOTOS=__PHOTOS__;
  function hasPh(st,era){return !!(st[era].ph && PHOTOS[st[era].ph.k]);}
  function visual(st,era,label,extra){
    if(hasPh(st,era)) return '<div class="scene ph'+(extra||'')+'"><img src="'+PHOTOS[st[era].ph.k]+'" alt="'+label+'"></div>';
    return '<div class="scene pend'+(extra||'')+'"><span>Photo pending. A free-to-use photo has not been added here yet.</span></div>';
  }
  function compare(st){
    if(!(hasPh(st,'then')&&hasPh(st,'now'))) return '';
    return '<section class="cmp" aria-label="Then and now slider"><div class="box"><img src="'+PHOTOS[st.now.ph.k]+'" alt="'+st.now.label+', today"><img class="top" src="'+PHOTOS[st.then.ph.k]+'" alt="'+st.then.label+', '+st.then.yr+'"></div><div class="row"><span>Now</span><input type="range" min="0" max="100" value="0" aria-label="Fade from now to then" data-cmp="1"><span>Then</span></div><p class="hint">Swipe the photo or drag the slider to travel back to '+st.then.yr+'.</p></section>';
  }
  document.addEventListener('input',function(e){
    var t=e.target; if(!t||!t.getAttribute||!t.getAttribute('data-cmp')) return;
    var top=t.closest('.cmp').querySelector('.top'); if(top) top.style.opacity=(t.value/100);
  });
  (function(){var drag=null;
    function setv(box,x){var r=box.getBoundingClientRect();var v=Math.max(0,Math.min(100,(x-r.left)/r.width*100));var c=box.closest('.cmp');var inp=c.querySelector('input[data-cmp]');var top=c.querySelector('.top');if(inp)inp.value=v;if(top)top.style.opacity=v/100;}
    document.addEventListener('pointerdown',function(e){var b=e.target.closest&&e.target.closest('.cmp .box');if(!b)return;drag=b;try{b.setPointerCapture(e.pointerId);}catch(_){}setv(b,e.clientX);});
    document.addEventListener('pointermove',function(e){if(drag)setv(drag,e.clientX);});
    function end(){drag=null;}document.addEventListener('pointerup',end);document.addEventListener('pointercancel',end);
  })();
  function credit(st,era){
    var p=st[era].ph;
    if(hasPh(st,era)) return '<span class="credit">Photo: '+p.by+' · <a target="_blank" rel="noopener" href="'+p.lu+'">'+p.lic+'</a> · <a target="_blank" rel="noopener" href="'+p.page+'">Source</a>'+(p.note?' · '+p.note:'')+'</span>';
    return '<span class="credit">Photo pending.</span>';
  }
  function creditsList(){
    var seen={}, li='';
    STOPS.forEach(function(st){['then','now'].forEach(function(era){
      var p=st[era].ph; if(!p||seen[p.k]) return; seen[p.k]=1;
      li+='<li>'+st.name+', '+era+': '+p.by+' · <a target="_blank" rel="noopener" href="'+p.lu+'">'+p.lic+'</a> · <a target="_blank" rel="noopener" href="'+p.page+'">Source</a></li>';
    });});
    li+=city().heroLi||'';    return '<p class="mono">Photo credits</p><ul>'+li+'</ul><p class="why">Photos were resized. Badge pictures reuse these photos.</p>';
  }
  function creditTxt(st,era){
    var p=st[era].ph;
    return hasPh(st,era)?('Photo: '+p.by+' ('+p.lic+')'):'Photo pending';
  }

  /* ---------- content ---------- */
  var RIGHT = __DATA__.right;
  var RENO_STOPS = __DATA__.packs.reno.stops, VC_STOPS = __DATA__.packs.vc.stops;
  var RENO_RANKS = __DATA__.packs.reno.ranks, VC_RANKS = __DATA__.packs.vc.ranks;
  var CITIES = __DATA__.packs;
  var RANKS=RENO_RANKS;
  var KEY='then-now-reno-v1', KEY2='then-now-v2', KEY3='then-now-v3';
  var railRegion=null, ORDER=__DATA__.order, SOON=__DATA__.soon||[], atHome=true;
  function blank(){ return {done:[0,0,0,0],claims:[0,0,0,0,0,0,0,0]}; }
  var ALL={}; ORDER.forEach(function(k){ ALL[k]=blank(); });
  var cityId='reno';
  var S=ALL.reno, STOPS=RENO_STOPS;
  function city(){ return CITIES[cityId]; }
  var tab='trail';
  var cur=null;          /* {i, step, entry, wrong:[], picks:[], checked:false} */
  var confirmReset=false;
  var toastTimer=null;
  var pushed=false, ignorePop=false;

  function norm(o){
    if(o && Array.isArray(o.done) && o.done.length===4 && Array.isArray(o.claims) && o.claims.length===8){
      return {done:o.done.map(function(x){return x?1:0}),claims:o.claims.map(function(x){return x?1:0})};
    }
    return null;
  }
  function load(){
    try{
      var r3=localStorage.getItem(KEY3);
      if(r3){
        var o3=JSON.parse(r3), n;
        ORDER.forEach(function(k){ if(o3.p && (n=norm(o3.p[k]))) ALL[k]=n; });
        if(o3.city && CITIES[o3.city]) cityId=o3.city;
        atHome=!!o3.home;
      } else {
        var r2=localStorage.getItem(KEY2), r=localStorage.getItem(KEY);
        if(r2){
          var o2=JSON.parse(r2);
          ORDER.forEach(function(k){ if((n=norm(o2[k]))) ALL[k]=n; });
          if(o2.city && CITIES[o2.city]) cityId=o2.city;
          atHome=false;
        } else if(r){ var n1=norm(JSON.parse(r)); if(n1) ALL.reno=n1; atHome=false; }
      }
    }catch(e){}
    S=ALL[cityId]; STOPS=CITIES[cityId].stops; RANKS=CITIES[cityId].ranks;
  }
  function save(){ try{ localStorage.setItem(KEY3,JSON.stringify({city:cityId,home:atHome?1:0,p:ALL})); }catch(e){} }
  function sum(a){ return a.reduce(function(x,y){return x+y;},0); }
  function xp(){ return sum(S.done)*100 + sum(S.claims)*25; }
  function rank(x){
    var i=0; RANKS.forEach(function(r,k){ if(x>=r[0]) i=k; });
    var next=RANKS[i+1]||null;
    return {i:i,name:RANKS[i][1],from:RANKS[i][0],to:next?next[0]:RANKS[i][0],next:next};
  }
  var INKS=[{n:'Blue',c:'#1B58B8'},{n:'Red',c:'#C0392B'},{n:'Green',c:'#2E8B57'},{n:'Purple',c:'#7B4BB7'},{n:'Gold',c:'#D4A017'}], inkI=0;
  try{ var _k=parseInt(localStorage.getItem('then-now-ink'),10); if(_k>=0&&_k<INKS.length) inkI=_k; }catch(e){}
  function bestRank(){
    var best=0; ORDER.forEach(function(k){ var st=ALL[k]; var x=sum(st.done)*100+sum(st.claims)*25, i=0; [0,100,250,450,600].forEach(function(t,k){ if(x>=t) i=k; }); if(i>best) best=i; });
    return best;
  }
  function code(){ return 'TN3-'+ORDER.map(function(k){ return ALL[k].done.join('')+ALL[k].claims.join(''); }).join('-'); }
  function allDone(){ return sum(S.done)===4; }

  function toast(msg){
    var t=document.getElementById('toast');
    t.textContent=msg; t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer=setTimeout(function(){ t.classList.remove('show'); },2600);
  }

  /* ---------- header ---------- */
  function applyCity(){
    var c=city();
    var h1=document.getElementById('cityName'); h1.textContent=c.name; h1.className=c.name.length>12?'long xl':(c.name.length>8?'long':'');
    var hero=document.getElementById('hero'), img=document.getElementById('heroImg');
    if(c.heroKey && PHOTOS[c.heroKey]){ img.src=PHOTOS[c.heroKey]; img.alt=c.heroAlt; hero.classList.remove('nophoto'); }
    else { img.removeAttribute('src'); img.alt=''; hero.classList.add('nophoto'); }
    document.getElementById('heroCredit').innerHTML=c.heroCredit;
    var regsR=[]; ORDER.forEach(function(k){ var r=CITIES[k].region||'More places'; if(regsR.indexOf(r)<0) regsR.push(r); });
    var curR=railRegion||c.region||'More places';
    document.getElementById('cities').innerHTML='<div class="rail1"><button class="city home" data-a="home" aria-pressed="'+atHome+'">Home</button>'+regsR.map(function(r){ return '<button class="rtab" data-a="rregion" data-r="'+r+'" aria-pressed="'+(r===curR)+'">'+r+'</button>'; }).join('')+'</div><div class="rail2">'+ORDER.filter(function(k){ return (CITIES[k].region||'More places')===curR; }).map(function(k){
      return '<button class="city" data-a="city" data-c="'+k+'" aria-pressed="'+(!atHome&&k===cityId)+'">'+CITIES[k].name+'</button>';
    }).join('')+'</div>';
    var act=document.querySelector('#cities .rail2 .city[aria-pressed="true"]'); if(act){ try{ var bx=act.parentNode; bx.scrollLeft=Math.max(0,act.offsetLeft-16); }catch(_){} }
  }
  function setCity(id){
    if(!CITIES[id]||(id===cityId&&!atHome)) return;
    leave(); atHome=false; cityId=id; S=ALL[id]; STOPS=CITIES[id].stops; RANKS=CITIES[id].ranks;
    tab='trail'; confirmReset=false; save(); applyCity(); render(); window.scrollTo(0,0);
  }
  function goHome(){ leave(); atHome=true; confirmReset=false; save(); applyCity(); render(); window.scrollTo(0,0); }
  function updateHeader(){
    var x=xp(), r=rank(x);
    document.getElementById('rankName').textContent=r.name;
    document.getElementById('xpText').textContent=x+' XP'+(r.next?' · next at '+r.to:' · max rank');
    var frac=r.next?(x-r.from)/(r.to-r.from):1;
    document.getElementById('xpFill').style.width=Math.round(frac*100)+'%';
    var bar=document.getElementById('xpBar');
    bar.setAttribute('aria-valuenow',String(x));
    bar.setAttribute('aria-valuetext',x+' of 600 XP, rank '+r.name);
    document.getElementById('bulbs').innerHTML=STOPS.map(function(s,i){
      return '<div class="bulb'+(S.done[i]?' on':'')+'"><i></i><span>'+s.short+'</span></div>';
    }).join('');
    ['trail','cards','rewards'].forEach(function(t){
      document.getElementById('tab-'+t).setAttribute('aria-selected',String(t===tab));
    });
  }

  /* ---------- views ---------- */
  var HCL=[
    {t:'The first Reno Arch was built in 1926.',a:0,why:'Several sources agree on October 23, 1926. Well documented.'},
    {t:'The arch switched to LED lights in 2018.',a:1,why:'One source says 2009, another says 2018. Until a city record settles it, it is disputed.'}
  ], hi=0, hdone=false, hmsg='Pick one.', hcls='';
  function homeFof(){
    var c=HCL[hi];
    return '<div class="fof" aria-live="polite"><p class="mono">Fact or fiction</p><div class="fcard-h">'+(hdone?'You get the idea.':c.t)+'</div>'+(hdone?'':'<div class="fb-h">'+FLAB.map(function(l,k){ return '<button type="button" data-a="hpick" data-k="'+k+'">'+l+'</button>'; }).join('')+'</div>')+'<p class="res-h '+hcls+'">'+hmsg+'</p></div>';
  }
  function viewHome(){
    var got=0,total=0;
    ORDER.forEach(function(k){ total+=CITIES[k].stops.length; got+=sum(ALL[k].done); });
    var stamps=['arch_now','vc_pip_now','vc_cs_now','vc_sch_now'].filter(function(k){return PHOTOS[k];}).map(function(k){ return '<div class="hstamp"><img src="'+PHOTOS[k]+'" alt=""></div>'; }).join('');
    var h='<section class="home-hero"><div><p class="mono">Missions for real places</p><h1>Go there.<br>Prove it.<br>Stamp it.</h1><p class="sub">A mission game for real places. Find the spot, answer what is in front of you, sort fact from tall tale, and watch the past fade into the present.</p></div><div class="hstamps" aria-label="Four passport stamps, each a real photo of a landmark">'+stamps+'</div></section>';
    var vcount=0; ORDER.forEach(function(k){ CITIES[k].stops.forEach(function(st){ if(st.verified&&st.verified.on) vcount++; }); });
    var res=null; [cityId].concat(ORDER).forEach(function(k){ if(!res&&CITIES[k]){ var d=sum(ALL[k].done); if(d>0&&d<CITIES[k].stops.length) res=k; } });
    if(res){ var rc=CITIES[res], rd=sum(ALL[res].done), nx=0; for(var q=0;q<rc.stops.length;q++){ if(!ALL[res].done[q]){ nx=q; break; } }
      h+='<section class="resume"><p class="mono">Pick up where you left off</p><button class="rcard" data-a="city" data-c="'+res+'"><span><strong>'+rc.name+'</strong><span class="rsub">'+rd+' of '+rc.stops.length+' stamps · next up: '+rc.stops[nx].name+'</span></span><span class="go">Continue ›</span></button></section>'; }
    function townLi(k){
      var c=CITIES[k], st=ALL[k], n=sum(st.done), x=sum(st.done)*100+sum(st.claims)*25, rk=c.ranks[0][1];
      c.ranks.forEach(function(r){ if(x>=r[0]) rk=r[1]; });
      var key=c.heroKey||((BMAPS[k]||{})[c.stops[0].id]||[])[0], img=(key&&PHOTOS[key])?'<img src="'+PHOTOS[key]+'" alt="">':'';
      var label=n===c.stops.length?'Complete':(n>0?'Continue':'Start');
      return '<li><button class="town" data-a="city" data-c="'+k+'"><span class="tph">'+img+'</span><span class="tin"><h3>'+c.name+'</h3>'+(c.level?'<span class="lvl '+(c.level==='Classics'?'ic':'dc')+'">'+(c.level==='Classics'?'Classics · easy':'Hidden Gems · harder')+'</span>':'')+'<span class="sub">'+n+' of '+c.stops.length+' stamps · '+rk+'</span></span><span class="go">'+label+' ›</span></button></li>';
    }
    function soonLi(o){ var nm=(typeof o==='string')?o:o.name; return '<li><div class="town soon"><span class="tph"></span><span class="tin"><h3>'+nm+'</h3><span class="sub">Coming soon</span></span></div></li>'; }
    var regs=[]; ORDER.forEach(function(k){ var r=CITIES[k].region||'More places'; if(regs.indexOf(r)<0) regs.push(r); });
    SOON.forEach(function(o){ var r=(typeof o==='string')?'More places':(o.region||'More places'); if(regs.indexOf(r)<0) regs.push(r); });
    h+='<section><h2 class="hh">Pick a mission</h2>'+regs.map(function(r){
      var items=ORDER.filter(function(k){ return (CITIES[k].region||'More places')===r; }).map(townLi).join('')+SOON.filter(function(o){ return ((typeof o==='string')?'More places':(o.region||'More places'))===r; }).map(soonLi).join('');
      var rk=ORDER.filter(function(k){ return (CITIES[k].region||'More places')===r; }), rg=0, rt=0; rk.forEach(function(k){ rg+=sum(ALL[k].done); rt+=CITIES[k].stops.length; });
      var open=(CITIES[cityId]&&(CITIES[cityId].region||'More places')===r)||(regs[0]===r&&!(CITIES[cityId]&&(ALL[cityId]&&sum(ALL[cityId].done)>0)));
      return '<details class="reg"'+(open?' open':'')+'><summary class="region"><span>'+r+'</span><span class="rcount">'+(rt?rg+' of '+rt+' stamps':'soon')+'</span></summary><ul class="towns">'+items+'</ul></details>';
    }).join('')+'<p class="passport-line"><strong>'+got+' of '+total+'</strong> stamps collected across '+ORDER.length+' missions.</p></section>';
    h+='<section class="passport" id="passport"><p class="mono">Your passport</p><h2 class="hh2">Every stamp you have earned.</h2>'+ORDER.map(function(k){
      var c=CITIES[k], d=sum(ALL[k].done);
      return '<div class="pprow'+(d===c.stops.length?' full':'')+'"><div class="ppname"><strong>'+c.name+'</strong><span class="mono">'+d+' of '+c.stops.length+(d===c.stops.length?' · complete':'')+(bossBest()[k]!==undefined?' · challenge '+bossBest()[k]+'/4':'')+'</span></div><div class="ppstamps">'+c.stops.map(function(st,i){ return '<span class="bbox sm" title="'+st.badge+'">'+badge(st.id,ALL[k].done[i],k)+'</span>'; }).join('')+'</div></div>';
    }).join('')+'<p class="passport-line"><strong>'+got+' of '+total+'</strong> stamps. Blank circles are waiting for you.</p></section>';
    h+='<section class="navy"><p class="mono">How it works</p><h2>Four steps. One stamp.</h2><div class="hsteps"><div class="hstep"><b>1</b><h3>Find the spot</h3><p>A clue sends you to a real landmark. Bring your own two feet.</p></div><div class="hstep"><b>2</b><h3>Prove it</h3><p>Answer a question you can only get by standing there.</p></div><div class="hstep"><b>3</b><h3>Fact or fiction</h3><p>Is the famous story solid, disputed, or a tall tale? Historians argue. Now so can you.</p></div><div class="hstep"><b>4</b><h3>Get stamped</h3><p>Every stop adds a stamp to your passport and a Then/Now photo you can fade through.</p></div></div></section>';
    if(PHOTOS.arch_now&&PHOTOS.sign1973) h+='<section class="hsec"><p class="mono">Then and now</p><h2 class="hh2">Swipe back through time.</h2><p>Swipe the photo or drag the slider. Every stop unlocks a real old photo next to a current one. This one is the Reno Arch, 1973 to 2021.</p><div class="cmp" style="margin-top:12px"><div class="box"><img src="'+PHOTOS.arch_now+'" alt="The Reno Arch in 2021"><img class="top" src="'+PHOTOS.sign1973+'" alt="The Reno sign in 1973"></div><div class="row"><span>Now</span><input type="range" min="0" max="100" value="0" aria-label="Fade from now to 1973" data-cmp="1"><span>1973</span></div></div></section>';
    h+='<section class="hsec"><p class="mono">The part nobody else does</p><h2 class="hh2">Is that actually true?</h2><p>Every story comes with claims to sort: well documented, disputed, or not true. Every answer shows its sources, so the game rewards checking, not guessing.</p><div id="homefof" style="margin-top:12px">'+homeFof()+'</div></section>';
    h+='<section class="grown"><p class="mono">For parents (the grown-up section)</p><h2 class="hh2">A game that makes your teen read a plaque. Voluntarily.</h2><ul><li>No accounts and no sign-up</li><li>No location tracking</li><li>No photo uploads</li><li>No ads</li><li>Every story shows its sources</li><li>Every photo shows its credit</li>'+(vcount?'<li>'+vcount+' of '+total+' stops verified on site by the makers</li>':'')+'</ul></section>';
    h+='<p class="home-foot"><strong>Made by a mom and her teenage son.</strong><br>The West and the East so far. More regions on the way.</p>';
    return h;
  }
  function homeAnswer(k){
    var c=HCL[hi];
    if(k===c.a){ hcls='good'; hmsg='Right. '+c.why;
      if(hi<HCL.length-1){ hi++; hmsg+=' Next one is below.'; } else { hdone=true; hmsg+=' That is the game. Pick a town and try it for real.'; }
    } else { hcls='bad'; hmsg='Not quite. Try again.'; }
    var el=document.getElementById('homefof'); if(el) el.innerHTML=homeFof();
  }

  function viewTrail(){
    var h='';
    if(allDone()){
      h+='<section class="done-banner pop" aria-label="Mission complete"><div class="bbox lg">'+badge('master',true)+'</div><div><h2>'+city().explorer+'</h2><p>'+city().afterDone+'</p></div></section>';
      if(((__DATA__.boss||{})[cityId]||[]).length){ var bb=bossBest()[cityId]; h+='<section class="card"><p class="mono">Final challenge</p><p>Four questions across every stop. No hints, no do-overs inside a run.'+(bb!==undefined?' Your best: <strong>'+bb+' of 4</strong>.':'')+'</p><button class="btn" data-a="boss">'+(bb!==undefined?'Play again':'Start the final challenge')+'</button></section>'; }
    } else {
      h+='<section class="card"><h3>Your mission</h3><p>'+city().mission+'</p></section>';
    }
    h+='<ul class="stops">'+STOPS.map(function(s,i){
      var d=S.done[i];
      return '<li><button class="stop" data-a="open" data-i="'+i+'"><span class="bbox">'+badge(s.id,d)+'</span><span><h3>'+s.name+'</h3><span class="sub">'+s.teaser+'</span><br><span class="status'+(d?' ok':'')+'">'+(d?'Badge earned':'Not found yet')+'</span>'+(s.verified&&s.verified.on?' <span class="vchip">Verified</span>':'')+'</span><span class="chev" aria-hidden="true">›</span></button></li>';
    }).join('')+'</ul>';
    h+='<details class="card"><summary>Safety, privacy and photo credits</summary><ul><li>Go with a parent or trusted adult, in daylight, and stay on public sidewalks.</li>'+city().safetyNote+'<li>This page has no accounts, uploads, camera use, or location tracking. Badges and XP are saved only in this browser.</li><li>Photos come from Wikimedia Commons under free licenses, with credit under each one. Where no free photo exists yet, the app says so instead of showing a stand-in.</li></ul>'+creditsList()+'</details>';
    return h;
  }

  function celebKeyGet(){ try{ return JSON.parse(localStorage.getItem('then-now-cel')||'{}')||{}; }catch(e){ return {}; } }
  function celebrate(){
    var kv=celebKeyGet(); if(kv[cityId]) return; kv[cityId]=1; try{ localStorage.setItem('then-now-cel',JSON.stringify(kv)); }catch(e){}
    var c=city(), x=xp(), r=rank(x), old=document.getElementById('celeb'); if(old) old.remove();
    var cf=''; for(var q=0;q<14;q++) cf+='<i style="--x:'+(q*7+3)+'%;--d:'+((q%5)*0.12)+'s;--c:'+(q%3)+'"></i>';
    var d=document.createElement('div'); d.id='celeb'; d.className='celeb'; d.setAttribute('role','dialog'); d.setAttribute('aria-modal','true'); d.setAttribute('aria-labelledby','celebT');
    d.innerHTML='<div class="celeb-card"><div class="confetti" aria-hidden="true">'+cf+'</div><div class="celeb-stamp"><div class="bbox lg">'+badge('master',true)+'</div></div><p class="mono">Mission complete</p><h2 id="celebT">'+c.explorer+'</h2><p>'+c.afterDone+'</p><p class="celeb-stats"><strong>'+r.name+'</strong> · '+x+' XP · 4 of 4 stamps</p><div class="celeb-btns"><button class="btn" data-a="passport">See my passport</button><button class="btn ghost" data-a="celebclose">Keep exploring</button></div></div>';
    document.body.appendChild(d);
    var f=d.querySelector('button'); if(f) f.focus();
  }
  function closeCeleb(){ var e=document.getElementById('celeb'); if(e) e.remove(); }
  document.addEventListener('keydown',function(e){
    if(e.key==='Tab'){ var dlg=document.getElementById('tour')||document.getElementById('celeb'); if(dlg&&dlg.offsetParent!==null||dlg&&getComputedStyle(dlg).display!=='none'){ var f=dlg.querySelectorAll('button'); if(f.length){ var first=f[0], last=f[f.length-1]; if(!dlg.contains(document.activeElement)){ first.focus(); e.preventDefault(); } else if(e.shiftKey&&document.activeElement===first){ last.focus(); e.preventDefault(); } else if(!e.shiftKey&&document.activeElement===last){ first.focus(); e.preventDefault(); } } } }
  });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'){ closeCeleb(); if(document.getElementById('tour')) endTour(); } });
  /* offline: the web version caches itself (sw.js). Say so when the connection changes. */
  try{ if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(function(){}); }catch(e){}
  window.addEventListener('offline',function(){ toast('You are offline. Everything still works except map links.'); });
  window.addEventListener('online',function(){ toast('Back online.'); });
  var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function vdate(d){ var m=/^(\d{4})-(\d{2})/.exec(d||''); return m?MON[+m[2]-1]+' '+m[1]:''; }
  function vnote(st){
    var v=st.verified;
    if(v&&v.on) return '<div class="vbadge ok"><b>Verified on site</b><span>by '+v.by+(vdate(v.on)?' · '+vdate(v.on):'')+'</span>'+(v.note?'<em>'+v.note+'</em>':'')+'</div>';
    return '<div class="vbadge"><b>Not verified on site yet</b><span>'+st.field.replace(/^Field notes pending:\s*/i,'')+'</span></div>';
  }
  /* ---------- first-run tour ---------- */
  var TOUR=[
    {k:'Step 1',h:'Go there.',p:'Every mission sends you to a real place. Read the clue, find the spot, and bring your own two feet.'},
    {k:'Step 2',h:'Prove it.',p:'Answer a question you can only get by standing there. Get it right and you earn the stamp and unlock the story.'},
    {k:'Step 3',h:'Stamp it.',p:'Swipe a real old photo into today, then sort the claims: solid, disputed, or not true. Everything stays on this phone.'}
  ], tourI=0;
  function maybeTour(){
    var seen=null; try{ seen=localStorage.getItem('then-now-tour'); }catch(e){}
    if(seen) return;
    var anyProgress=false; ORDER.forEach(function(k){ if(sum(ALL[k].done)>0) anyProgress=true; });
    if(anyProgress){ try{ localStorage.setItem('then-now-tour','1'); }catch(e){} return; }
    showTour();
  }
  function showTour(){
    var old=document.getElementById('tour'); if(old) old.remove();
    var t=TOUR[tourI], last=tourI===TOUR.length-1;
    var d=document.createElement('div'); d.id='tour'; d.className='celeb'; d.setAttribute('role','dialog'); d.setAttribute('aria-modal','true'); d.setAttribute('aria-labelledby','tourT');
    d.innerHTML='<div class="celeb-card tour-card"><p class="mono">'+t.k+' of 3</p><h2 id="tourT">'+t.h+'</h2><p>'+t.p+'</p><div class="tour-dots" aria-hidden="true">'+TOUR.map(function(_,i){ return '<i'+(i===tourI?' class="on"':'')+'></i>'; }).join('')+'</div><div class="celeb-btns"><button class="btn" data-a="tournext">'+(last?'Let us go':'Next')+'</button>'+(last?'':'<button class="btn ghost" data-a="tourskip">Skip</button>')+'</div></div>';
    document.body.appendChild(d); var f=d.querySelector('button'); if(f) f.focus();
  }
  function endTour(){ var e=document.getElementById('tour'); if(e) e.remove(); try{ localStorage.setItem('then-now-tour','1'); }catch(x){} }
  /* ---------- final challenge (boss round) ---------- */
  var boss=null;
  function bossBest(){ try{ return JSON.parse(localStorage.getItem('then-now-boss')||'{}')||{}; }catch(e){ return {}; } }
  function bossSave(pid,n){ var b=bossBest(); if(b[pid]===undefined||n>b[pid]){ b[pid]=n; try{ localStorage.setItem('then-now-boss',JSON.stringify(b)); }catch(e){} } }
  function viewBoss(){
    var Q=(__DATA__.boss||{})[boss.pid]||[], n=Q.length;
    var h='<div class="stophead"><button class="link" data-a="bossexit">‹ Trail</button><span class="mono">Final challenge</span></div>';
    if(boss.i>=n){
      var perfect=boss.score===n, best=bossBest()[boss.pid];
      h+='<section class="card boss-res'+(perfect?' perfect':'')+'"><p class="mono">'+(perfect?'Perfect score':'Challenge complete')+'</p><h2>'+boss.score+' of '+n+'</h2><p>'+(perfect?'Not one slip. You really read the plaques.':(boss.score>=n-1?'So close. One more try for a perfect run?':'Good effort. The stories are still on the Cards tab if you want to read them again.'))+'</p>'+(best!==undefined?'<p class="mono">Best: '+best+' of '+n+'</p>':'')+'<div class="celeb-btns"><button class="btn" data-a="bossagain">Try again</button><button class="btn ghost" data-a="bossexit">Back to the trail</button></div></section>';
      return h;
    }
    var q=Q[boss.i];
    h+='<h2 id="stopTitle" tabindex="-1">Question '+(boss.i+1)+' of '+n+'</h2><fieldset class="opts"><legend>'+q.q+'</legend>'+q.o.map(function(o,k){
      var cls=''; if(boss.pick!==null){ if(k===q.a) cls=' right'; else if(k===boss.pick) cls=' wrong'; }
      return '<button class="opt'+cls+'" data-a="bpick" data-k="'+k+'"'+(boss.pick!==null?' disabled':'')+'><span>'+o+'</span>'+(boss.pick!==null&&k===q.a?'<em>Correct</em>':(boss.pick===k?'<em>Not this one</em>':''))+'</button>';
    }).join('')+'</fieldset>';
    if(boss.pick!==null) h+='<p class="why" aria-live="polite">'+q.why+'</p><button class="btn" data-a="bnext">'+(boss.i+1>=n?'See my score':'Next question')+'</button>';
    return h;
  }
  function stepper(){
    var names=['Find it','Check in','Unlock','Source check'];
    var d=S.done[cur.i];
    return '<div class="steps" role="group" aria-label="Stop steps">'+names.map(function(n,k){
      var locked=(k>=2&&!d);
      var ok=(k<cur.step)||(d&&k>=2&&k!==cur.step&&k<=2);
      var cls='step'+(k===cur.step?' cur':'')+(ok&&k!==cur.step?' ok':'');
      return '<button class="'+cls+'" data-a="step" data-n="'+k+'"'+(locked?' disabled':'')+(k===cur.step?' aria-current="step"':'')+'><span>'+n+'</span></button>';
    }).join('')+'</div>';
  }

  var streak=0;
  var FLAB=['Well documented','Disputed or unproven','Not true'];
  var FSUB=['Solid sources back it up','Historians disagree or cannot prove it','It is a myth or a mistake'];
  function nextPanel(){
    var n=STOPS.length, j=-1, k, t;
    for(k=1;k<n;k++){ t=(cur.i+k)%n; if(!S.done[t]){ j=t; break; } }
    var h='<section class="card nextstop"><p class="mono">What next</p>';
    if(j>=0){
      h+='<p>Stop done. Now go to <strong>'+STOPS[j].name+'</strong>, then check in there.</p><button class="btn" data-a="nextstop" data-i="'+j+'">Next stop: '+STOPS[j].name+'</button><button class="btn ghost" data-a="exit">Back to the trail</button>';
    } else {
      h+='<p>That is every stop in '+city().name+'. Nicely done.</p>';
      if(((__DATA__.boss||{})[cityId]||[]).length) h+='<button class="btn" data-a="bossgo">Take the final challenge</button>';
      h+='<button class="btn ghost" data-a="tab" data-t="rewards">See my passport</button><button class="btn ghost" data-a="exit">Back to the trail</button>';
    }
    return h+'</section>';
  }
  function factGame(st){
    var n=st.claims.length, next=-1, doneN=0;
    st.claims.forEach(function(c,ci){ if(S.claims[cur.i*2+ci]) doneN++; else if(next<0) next=ci; });
    var h='<section class="card fof"><p class="mono">Fact or Fiction</p>';
    h+='<div class="fdots" aria-label="'+doneN+' of '+n+' claims done">';
    for(var q=0;q<n;q++) h+='<i class="'+(q<doneN?'on':'')+'"></i>';
    h+='</div>';
    if(streak>1) h+='<p class="streak">Streak: '+streak+' in a row</p>';
    if(next<0){
      h+='<p><strong>All claims sorted.</strong> Here is what the sources say.</p>';
      st.claims.forEach(function(c){ h+='<div class="fdone"><p><strong>'+c.t+'</strong></p><p class="feedback good">'+FLAB[c.a]+'. <span class="why">'+c.why+'</span></p></div>'; });
      return nextPanel()+h+'</section>';
    }
    var c=st.claims[next];
    h+='<p class="why">Open book: the answers are in the story and sources you just read. Is this claim solid, disputed, or not true? Tap a label'+(('ontouchstart' in window)?', or swipe the card right for solid and left for not true':'')+'.</p>';
    h+='<div class="fcard'+(cur.fbad?' shake':'')+'" data-claim="'+next+'" tabindex="0"><p class="ftxt">'+c.t+'</p></div>';
    if(cur.fbad) h+='<p class="feedback bad" aria-live="polite">Not quite. Check the story and the sources, then try again.</p>';
    h+='<div class="fbtns" role="group" aria-label="Choose a label">'+FLAB.map(function(r,k){
      return '<button class="fbtn" data-a="fpick" data-c="'+next+'" data-k="'+k+'"><b>'+r+'</b><span>'+FSUB[k]+'</span></button>';
    }).join('')+'</div></section>';
    return h;
  }
  function factAnswer(ci,k){
    var st=STOPS[cur.i], c=st.claims[ci], gi=cur.i*2+ci;
    if(S.claims[gi]) return;
    if(k===c.a){
      S.claims[gi]=1; streak++; cur.fbad=false; save(); render();
      toast('Right. +25 XP'+(streak>1?' ('+streak+' in a row)':''));
    } else {
      streak=0; cur.fbad=true; render(); toast('Not quite. Try again.');
    }
  }
  (function(){ var x0=null,y0=null;
    document.addEventListener('touchstart',function(e){ var t=e.target.closest&&e.target.closest('.fcard'); if(!t){x0=null;return;} x0=e.touches[0].clientX; y0=e.touches[0].clientY; },{passive:true});
    document.addEventListener('touchend',function(e){ if(x0===null) return; var t=e.target.closest&&e.target.closest('.fcard'); var dx=e.changedTouches[0].clientX-x0, dy=e.changedTouches[0].clientY-y0; x0=null;
      if(!t||Math.abs(dx)<70||Math.abs(dx)<Math.abs(dy)*1.5) return; factAnswer(+t.getAttribute('data-claim'), dx>0?0:2); },{passive:true});
  })();
  function viewStop(){
    var st=STOPS[cur.i], d=S.done[cur.i];
    var h='<div class="stophead"><button class="link" data-a="exit">‹ '+(tab==='cards'?'Cards':'Trail')+'</button><span class="mono">'+st.tag+'</span></div>';
    h+='<h2 id="stopTitle" tabindex="-1">'+st.name+'</h2>'+stepper();

    if(cur.step===0){
      h+='<div class="banner">'+visual(st,'now',st.name+' today')+'<span class="tagline">'+(hasPh(st,'now')?'Photo':'Illustration')+'</span></div><p class="credit">'+credit(st,'now')+'</p>';
      h+='<section class="card"><p class="mono">Find it</p><p>'+st.clue+'</p><div class="safety"><span class="mono">Safety</span><span>'+st.safety+'</span></div>'+vnote(st)
        +'<a class="btn ghost" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&amp;query='+encodeURIComponent(st.map)+'">Open in Maps</a>'
        +'<button class="btn" data-a="step" data-n="1">I am here. Show me the question</button></section>';
    }
    if(cur.step===1){
      h+='<section class="card"><p class="mono">Check in</p>';
      h+='<fieldset class="opts"><legend>'+st.q.prompt+'</legend>'+st.q.options.map(function(o,k){
        var cls='opt'; var mark='';
        if(d && k===st.q.answer){cls+=' right'; mark='<em>Correct</em>';}
        else if(cur.wrong.indexOf(k)>-1){cls+=' wrong'; mark='<em>Not this one</em>';}
        return '<button type="button" class="'+cls+'" data-a="pick" data-k="'+k+'"'+(d?' disabled':'')+'><span>'+o+'</span>'+mark+'</button>';
      }).join('')+'</fieldset>';
      if(d){
        h+='<div class="earned pop"><div class="bbox lg">'+badge(st.id,true)+'</div><div><strong>Badge earned</strong><span>'+st.badge+'</span></div></div><button class="btn" data-a="step" data-n="2">Unlock the story</button>';
      } else {
        h+='<p class="feedback'+(cur.wrong.length?' bad':'')+'" aria-live="polite">'+(cur.wrong.length?'Not yet. '+st.q.hint:'Get it right to earn the '+st.badge+' badge and 100 XP.')+'</p>';
      }
      h+='</section>';
    }
    if(cur.step===2 && d){
      h+=compare(st);
      h+='<div class="pair"><div class="then">'+visual(st,'then',st.then.label+', '+st.then.yr)+'<div class="cap"><strong>Then, '+st.then.yr+': '+st.then.label+'</strong><br>'+st.then.line+'</div>'+credit(st,'then')+'<a target="_blank" rel="noopener" href="'+st.then.link.u+'">'+st.then.link.t+'</a></div>'
        +'<div class="now">'+visual(st,'now',st.now.label)+'<span class="mono">'+(st.now.head||'Now')+'</span><b class="yr">'+st.now.yr+'</b><div class="cap"><strong>'+st.now.label+'</strong><br>'+st.now.line+'</div>'+credit(st,'now')+'</div></div>';
      h+='<section class="card story">'+st.story.map(function(p){return '<p>'+p+'</p>';}).join('')+'</section>';
      if(st.disputed) h+='<aside class="argue" aria-label="Historians argue about this"><div class="argue-h"><span class="argue-ic" aria-hidden="true">?</span><span><b>Historians argue about this</b><em>Not everything here is settled.</em></span></div><p>'+st.disputed+'</p><p class="argue-go">Think you can tell solid from shaky? The Source check is next.</p></aside>';
      h+='<div class="fact"><span class="mono">Did you know</span><span>'+st.fact+'</span></div>';
      h+='<details class="card"><summary>Sources</summary><ul class="srcs">'+st.sources.map(function(s){return '<li><a target="_blank" rel="noopener" href="'+s.u+'">'+s.t+'</a></li>';}).join('')+'</ul></details>';
      h+='<button class="btn" data-a="step" data-n="3">Next: sort fact from fiction (up to 50 XP)</button>';
    }
    if(cur.step===3 && d){ h+=factGame(st); }
    return h;
  }

  function viewCards(){
    var h='<p>Each stop you unlock adds a Time Card to your collection. Tap one to reopen its story.</p><div class="grid">';
    STOPS.forEach(function(s,i){
      if(S.done[i]){
        h+='<button class="tcard" data-a="open" data-i="'+i+'" data-s="2"><span class="mono">'+s.name+'</span>'
          +'<span class="mini">'+visual(s,'then','Then: '+s.card.la,' then-s').replace(/<div/g,'<span').replace(/<\/div>/g,'</span>')+visual(s,'now','Now: '+s.card.lb).replace(/<div/g,'<span').replace(/<\/div>/g,'</span>')+'</span><span class="credit-txt">Then: '+creditTxt(s,'then')+'. Now: '+creditTxt(s,'now')+'.</span>'
          +'<span class="years">'+s.card.a+' <i>→</i> '+s.card.b+'</span><span><strong>Then:</strong> '+s.card.la+'</span><span><strong>Now:</strong> '+s.card.lb+'</span></button>';
      } else {
        h+='<div class="tcard locked"><span class="mono">Locked</span><span class="years">? <i>→</i> ?</span><span>Find '+s.name+' to collect this card.</span></div>';
      }
    });
    return h+'</div>';
  }

  function viewRewards(){
    var x=xp(), r=rank(x);
    var h='<section class="card"><h3>Passport: '+city().name+'</h3><p class="why" style="margin:0 0 10px">Each stop you finish stamps a page.</p><div class="cases" style="--ink:'+INKS[Math.min(inkI,bestRank())].c+'">'+STOPS.map(function(s,i){
      return '<div class="case'+(S.done[i]?' got':'')+'"><div class="bbox lg">'+badge(s.id,S.done[i])+'</div><span class="nm">'+s.badge+'</span><span class="mono">'+(S.done[i]?'Stamped':'Blank page')+'</span></div>';
    }).join('')+'</div></section>';
    h+='<section class="card"><h3>'+city().explorer+'</h3><div class="master"><div class="bbox lg">'+badge('master',allDone())+'</div><p>'+(allDone()?'Earned. You found every stop in '+city().name+'.':'Earn all four badges to unlock it.')+'</p></div></section>';
    var br=bestRank();
    h+='<section class="card"><h3>Stamp ink</h3><p class="why" style="margin:0 0 8px">XP unlocks new inks for your stamps. Higher ranks in any town unlock more.</p><div class="inks" role="group" aria-label="Stamp ink">'+INKS.map(function(k,i){
      var open=i<=br;
      return '<button class="ink" data-a="ink" data-i="'+i+'" aria-pressed="'+(i===Math.min(inkI,br))+'"'+(open?'':' disabled')+' style="color:'+k.c+'"><i></i><span style="color:var(--ink)">'+(open?k.n:RANKS[i][0]+' XP')+'</span></button>';
    }).join('')+'</div></section>';
    h+='<section class="card"><h3>Rank</h3><ul class="ladder">'+RANKS.map(function(rk,i){
      return '<li class="'+(i<=r.i?'got':'')+'"><span>'+rk[1]+'</span><span class="mono">'+(i<=r.i?'Earned':rk[0]+' XP')+'</span></li>';
    }).join('')+'</ul></section>';
    h+='<section class="card"><h3>Save progress</h3><p>There are no accounts. To move your badges to another phone, copy this code there and paste it below.</p><div class="code"><input id="codeOut" readonly value="'+code()+'" aria-label="Progress code"><button class="btn small" data-a="copy">Copy</button></div>'
      +'<div class="code"><input id="codeIn" placeholder="Paste a code" aria-label="Paste a progress code" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="btn small ghost" data-a="restore">Restore</button></div><p id="codeMsg" class="why" aria-live="polite"></p></section>';
    h+='<section class="card"><h3>Start over</h3>'+(confirmReset?'<p>Erase every badge and all XP for '+city().name+' on this phone?</p><div class="row"><button class="btn" data-a="resetyes">Yes, erase</button><button class="btn ghost" data-a="resetno">Cancel</button></div>':'<button class="btn ghost" data-a="resetask">Reset progress</button>')+'</section>';
    return h;
  }

  function render(focusTitle){
    updateHeader();
    document.body.classList.toggle('ishome',atHome);
    var m=document.getElementById('main');
    m.setAttribute('aria-labelledby','tab-'+tab);
    if(boss&&(atHome||boss.pid!==cityId)) boss=null;
    if(boss) m.innerHTML=viewBoss();
    else if(atHome&&!cur) m.innerHTML=viewHome();
    else if(cur) m.innerHTML=viewStop();
    else if(tab==='trail') m.innerHTML=viewTrail();
    else if(tab==='cards') m.innerHTML=viewCards();
    else m.innerHTML=viewRewards();
    var bar=document.getElementById('bar');
    bar.hidden=!cur;
    document.body.classList.toggle('hasbar',!!cur);
    if(cur){
      var atRoot=cur.step<=cur.entry;
      document.getElementById('barBack').textContent='‹ Back';
      document.getElementById('barBack').setAttribute('aria-label',atRoot?('Back to '+(tab==='cards'?'Cards':'Trail')):'Back to previous step');
      document.getElementById('barExit').textContent=(tab==='cards'?'All cards':'All stops');
    }
    if(focusTitle){
      var t=document.getElementById('stopTitle');
      if(t) t.focus({preventScroll:true});
    }
  }

  /* ---------- navigation ---------- */
  function leave(){
    cur=null;
    if(pushed){
      pushed=false; ignorePop=true;
      try{ history.back(); }catch(e){ ignorePop=false; }
    }
  }
  function exitStop(){ leave(); render(); window.scrollTo(0,0); }
  function openStop(i,step){
    var entry=(step!==undefined?step:(S.done[i]?2:0));
    cur={i:i,step:entry,entry:entry,wrong:[],picks:[],checked:false};
    if(!pushed){ try{ history.pushState({stop:1},'','#stop'); pushed=true; }catch(e){} }
    render(true); window.scrollTo(0,0);
  }
  function setStep(n){
    if(n>=2 && !S.done[cur.i]) return;
    cur.step=n; cur.checked=false; render(true); window.scrollTo(0,0);
  }
  function goBack(){
    if(!cur) return;
    if(cur.step>cur.entry) setStep(cur.step-1); else exitStop();
  }
  window.addEventListener('popstate',function(){
    if(ignorePop){ ignorePop=false; return; }
    if(cur){ pushed=false; cur=null; render(); window.scrollTo(0,0); }
  });

  document.addEventListener('click',function(e){
    var b=e.target.closest('[data-a]'); if(!b) return;
    var a=b.getAttribute('data-a');
    if(a==='home'){ goHome(); return; }
    if(a==='nextstop'){ openStop(+b.getAttribute('data-i'),0); return; }
    if(a==='bossgo'){ leave(); boss={pid:cityId,i:0,score:0,pick:null}; render(); window.scrollTo(0,0); return; }
    if(a==='boss'||a==='bossagain'){ boss={pid:cityId,i:0,score:0,pick:null}; render(); window.scrollTo(0,0); return; }
    if(a==='bossexit'){ boss=null; render(); window.scrollTo(0,0); return; }
    if(a==='bpick'){ if(boss&&boss.pick===null){ var qq=__DATA__.boss[boss.pid][boss.i], kk=+b.getAttribute('data-k'); boss.pick=kk; if(kk===qq.a) boss.score++; render(); } return; }
    if(a==='bnext'){ if(boss){ boss.i++; boss.pick=null; if(boss.i>=__DATA__.boss[boss.pid].length) bossSave(boss.pid,boss.score); render(); window.scrollTo(0,0); } return; }
    if(a==='tournext'){ if(tourI>=TOUR.length-1){ endTour(); } else { tourI++; showTour(); } return; }
    if(a==='tourskip'){ endTour(); return; }
    if(a==='celebclose'){ closeCeleb(); return; }
    if(a==='passport'){ closeCeleb(); goHome(); setTimeout(function(){ var p=document.getElementById('passport'); if(p&&p.scrollIntoView) p.scrollIntoView({behavior:'smooth',block:'start'}); },60); return; }
    if(a==='rregion'){ railRegion=b.getAttribute('data-r'); applyCity(); return; }
    if(a==='city'){ railRegion=null; setCity(b.getAttribute('data-c')); return; }
    if(a==='tab'){ boss=null; leave(); tab=b.getAttribute('data-t'); confirmReset=false; render(); window.scrollTo(0,0); return; }
    if(a==='open'){ var s=b.getAttribute('data-s'); openStop(+b.getAttribute('data-i'), s?+s:undefined); return; }
    if(a==='exit'){ exitStop(); return; }
    if(a==='goback'){ goBack(); return; }
    if(a==='step'){ setStep(+b.getAttribute('data-n')); return; }
    if(a==='pick'){
      var k=+b.getAttribute('data-k'), st=STOPS[cur.i];
      if(k===st.q.answer){
        if(!S.done[cur.i]){ S.done[cur.i]=1; save(); toast('Badge earned: '+st.badge+'. +100 XP'); if(allDone()) setTimeout(celebrate,450); }
        cur.wrong=[]; render();
      } else {
        if(cur.wrong.indexOf(k)<0) cur.wrong.push(k);
        render();
      }
      return;
    }
    if(a==='ink'){ var ii=+b.getAttribute('data-i'); if(ii<=bestRank()){ inkI=ii; try{ localStorage.setItem('then-now-ink',String(ii)); }catch(e){} render(); } return; }
    if(a==='hpick'){ homeAnswer(+b.getAttribute('data-k')); return; }
    if(a==='fpick'){ factAnswer(+b.getAttribute('data-c'),+b.getAttribute('data-k')); return; }
    if(a==='cpick'){
      cur.picks[+b.getAttribute('data-c')]=+b.getAttribute('data-k'); cur.checked=false; render(); return;
    }
    if(a==='check'){
      var st2=STOPS[cur.i], gained=0, ok=0;
      st2.claims.forEach(function(c,ci){
        var gi=cur.i*2+ci;
        if(S.claims[gi]){ ok++; return; }
        if(cur.picks[ci]===c.a){ S.claims[gi]=1; gained+=25; ok++; }
      });
      cur.checked=true; save(); render();
      if(gained) toast('+'+gained+' XP');
      else if(ok<st2.claims.length) toast('Not yet. Try again.');
      return;
    }
    if(a==='copy'){
      var inp=document.getElementById('codeOut');
      var done=function(){ toast('Code copied'); };
      var fb=function(){ inp.focus(); inp.select(); toast('Code selected. Copy it manually.'); };
      try{ navigator.clipboard.writeText(code()).then(done,fb); }catch(err){ fb(); }
      return;
    }
    if(a==='restore'){
      var v=(document.getElementById('codeIn').value||'').trim().toUpperCase();
      var m1=/^TN1-([01]{4})([01]{8})$/.exec(v), m2=/^TN2-([01]{4})([01]{8})-([01]{4})([01]{8})$/.exec(v), m3=/^TN3-([01]{12}(?:-[01]{12})*)$/.exec(v), msg=document.getElementById('codeMsg');
      if(!m1 && !m2 && !m3){ msg.textContent='That code does not look right. It starts with TN3- (older TN1- and TN2- codes work too).'; return; }
      var arr=function(x){return x.split('').map(Number);};
      if(m1){ ALL.reno={done:arr(m1[1]),claims:arr(m1[2])}; }
      else if(m2){ ALL.reno={done:arr(m2[1]),claims:arr(m2[2])}; ALL.vc={done:arr(m2[3]),claims:arr(m2[4])}; }
      else {
        var segs=m3[1].split('-');
        if(segs.length>ORDER.length){ msg.textContent='That code has more towns than this version of the app. Update the app and try again.'; return; }
        segs.forEach(function(g,i){ ALL[ORDER[i]]={done:arr(g.slice(0,4)),claims:arr(g.slice(4))}; });
      }
      S=ALL[cityId]; save(); render(); toast('Progress restored'); return;
    }
    if(a==='resetask'){ confirmReset=true; render(); return; }
    if(a==='resetno'){ confirmReset=false; render(); return; }
    if(a==='resetyes'){ ALL[cityId]=blank(); S=ALL[cityId]; save(); confirmReset=false; render(); toast('Progress erased'); return; }
  });

  load(); applyCity(); render(); maybeTour();
})();
