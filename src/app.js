(function(){
  var DATA=__DATA__;
  /* ---------- native progress backup (iPhone/Android app only) ---------- */
  (function(){
    var NB=null;
    try{ if(window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform()) NB=Capacitor.registerPlugin('StampStore'); }catch(e){}
    if(!NB) return;
    var MIR=/^(then-now|stp-)/;
    var si=Storage.prototype.setItem, ri=Storage.prototype.removeItem;
    Storage.prototype.setItem=function(k,v){ si.call(this,k,v); if(this===window.localStorage&&MIR.test(k)) try{ NB.setItem({key:k,value:String(v)}).catch(function(){}); }catch(e){} };
    Storage.prototype.removeItem=function(k){ ri.call(this,k); if(this===window.localStorage&&MIR.test(k)) try{ NB.removeItem({key:k}).catch(function(){}); }catch(e){} };
    NB.getAll().then(function(r){
      var d=(r&&r.values)||{}, restored=false, ls=window.localStorage;
      Object.keys(d).forEach(function(k){ if(ls.getItem(k)===null){ si.call(ls,k,d[k]); restored=true; } });
      for(var i=0;i<ls.length;i++){ var k=ls.key(i); if(MIR.test(k)&&d[k]===undefined) NB.setItem({key:k,value:ls.getItem(k)}).catch(function(){}); }
      if(restored&&!sessionStorage.getItem('stp-restored')){ sessionStorage.setItem('stp-restored','1'); location.reload(); }
    }).catch(function(){});
  })();
  /* ---------- scene + badge drawing ---------- */
  var BMAPS={}; Object.keys(DATA.packs).forEach(function(k){ BMAPS[k]=DATA.packs[k].badgeMap||{}; });
  function mono(id,pid){
    pid=pid||cityId; var c=CITIES[pid];
    if(id==='master') return c.initials;
    var t='?'; c.stops.forEach(function(st){ if(st.id===id) t=st.short.replace(/[^A-Za-z]/g,'').slice(0,2).toUpperCase(); });
    return t;
  }
  function badge(id,on,pid){
    pid=pid||cityId; var c=CITIES[pid];
    var m=(id==='master')?(c.heroKey&&PHOTOS[c.heroKey]?[c.heroKey,'50% 60%']:null):(BMAPS[pid]||{})[id];
    if(m&&PHOTOS[m[0]]) return '<span class="bimg'+(on?' on':'')+'"><img loading="lazy" src="'+PHOTOS[m[0]]+'" alt="" style="object-position:'+m[1]+'"></span>';
    return '<span class="bimg plain'+(on?' on':'')+'"><b>'+mono(id,pid)+'</b></span>';
  }
  var PHOTOS=__PHOTOS__;
  function preloadTown(k){ try{ var c=CITIES[k]; if(!c||c._pre) return; c._pre=1; var seen={}; c.stops.forEach(function(st){ ['then','now'].forEach(function(e){ var p=st[e].ph&&st[e].ph.k; if(p&&PHOTOS[p]&&!seen[p]){ seen[p]=1; var im=new Image(); im.src=PHOTOS[p]; } }); }); }catch(e){} }
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
    var q=e.target; if(q&&q.id==='townSearch'){ var v=q.value.trim().toLowerCase(), any=false;
      document.querySelectorAll('#missions details.reg').forEach(function(d){ var vis=0; d.querySelectorAll('li').forEach(function(li){ var m=!v||(li.textContent+' '+(li.getAttribute('data-q')||'')).toLowerCase().indexOf(v)>-1; li.hidden=!m; if(m) vis++; }); d.hidden=!!v&&!vis; if(v) d.open=vis>0; if(vis) any=true; });
      var nn=document.getElementById('townNone'); if(nn) nn.hidden=!v||any; return; }
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
  var RIGHT = DATA.right;
  var RENO_STOPS = DATA.packs.reno.stops, VC_STOPS = DATA.packs.vc.stops;
  var RENO_RANKS = DATA.packs.reno.ranks, VC_RANKS = DATA.packs.vc.ranks;
  var CITIES = DATA.packs;
  var RANKS=RENO_RANKS;
  var KEY='then-now-reno-v1', KEY2='then-now-v2', KEY3='then-now-v3';
  var railRegion=null, ORDER=DATA.order, SOON=DATA.soon||[], atHome=true, onPass=false;
  function blank(){ return {done:[0,0,0,0],claims:[0,0,0,0,0,0,0,0]}; }
  var ALL={}; ORDER.forEach(function(k){ ALL[k]=blank(); });
  var cityId='reno';
  var S=ALL.reno, STOPS=RENO_STOPS;
  function city(){ return CITIES[cityId]; }
  var tab='trail';
  var cur=null;          /* {i, step, entry, wrong:[], picks:[], checked:false} */
  var confirmReset=false;
  var toastTimer=null, nudged=false;
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
  var demoSnap=null, demoC=null;
  function endDemo(){ if(demoSnap&&demoC){ demoC.done=demoSnap.done.slice(); demoC.claims=demoSnap.claims.slice(); } demoSnap=null; demoC=null; }
  function save(){ if(demoSnap) return; try{ localStorage.setItem(KEY3,JSON.stringify({city:cityId,home:atHome?1:0,p:ALL})); }catch(e){} }
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

  var stampFx=false;
  function toast(msg){
    var t=document.getElementById('toast');
    t.textContent=msg; t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer=setTimeout(function(){ t.classList.remove('show'); },2600);
  }

  /* ---------- header ---------- */
  function applyCity(){
    var c=city(); preloadTown(cityId);
    var h1=document.getElementById('cityName'); h1.textContent=c.name; h1.className=c.name.length>9?'long xl':(c.name.length>7?'long':'');
    var hero=document.getElementById('hero'), img=document.getElementById('heroImg');
    if(c.heroKey && PHOTOS[c.heroKey]){ img.src=PHOTOS[c.heroKey]; img.alt=c.heroAlt; hero.classList.remove('nophoto'); }
    else { img.removeAttribute('src'); img.alt=''; hero.classList.add('nophoto'); }
    document.getElementById('heroCredit').innerHTML=c.heroCredit;
    var regsR=[]; ORDER.forEach(function(k){ var r=CITIES[k].region||'More places'; if(regsR.indexOf(r)<0) regsR.push(r); });
    var curR=railRegion||c.region||'More places';
    document.getElementById('cities').innerHTML='<div class="rail1">'+regsR.map(function(r){ return '<button class="rtab" data-a="rregion" data-r="'+r+'" aria-pressed="'+(r===curR)+'">'+r+'</button>'; }).join('')+'</div><div class="rail2">'+ORDER.filter(function(k){ return (CITIES[k].region||'More places')===curR; }).map(function(k){
      return '<button class="city" data-a="city" data-c="'+k+'" aria-pressed="'+(!atHome&&k===cityId)+'">'+CITIES[k].name+'</button>';
    }).join('')+'</div>';
    var act=document.querySelector('#cities .rail2 .city[aria-pressed="true"]'); if(act){ try{ var bx=act.parentNode; var ar=act.getBoundingClientRect(), br=bx.getBoundingClientRect(); if(ar.left<br.left+8||ar.right>br.right-8) bx.scrollLeft=Math.max(0,bx.scrollLeft+(ar.left-br.left)-16); }catch(_){} }
  }
  function setCity(id){
    if(!CITIES[id]||(id===cityId&&!atHome)) return;
    leave(); atHome=false; onPass=false; cityId=id; S=ALL[id]; STOPS=CITIES[id].stops; RANKS=CITIES[id].ranks;
    tab='trail'; confirmReset=false; save(); applyCity(); render(); window.scrollTo(0,0);
  }
  function openPass(){ leave(); atHome=true; onPass=true; confirmReset=false; save(); applyCity(); render(); window.scrollTo(0,0); }
  function goHome(){ if(typeof bnavSel!=='undefined'&&0){} leave(); atHome=true; onPass=false; confirmReset=false; save(); applyCity(); render(); window.scrollTo(0,0); }
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
  function homeTown(){
    var hk=CITIES[cityId]?cityId:ORDER[0];
    if(!atHome||sum(ALL[hk].done)===0){ ORDER.forEach(function(k){ if(sum(ALL[k].done)>0&&(sum(ALL[hk].done)===0)) hk=k; }); }
    return hk;
  }
  var heroFocus=null;
  function townKeys(k){ var out=[]; CITIES[k].stops.forEach(function(st){ var p=((BMAPS[k]||{})[st.id]||[])[0]; if(!(p&&PHOTOS[p])) p=(st.now.ph&&st.now.ph.k)||''; if(p&&PHOTOS[p]&&out.indexOf(p)<0) out.push(p); }); return out; }
  function stampsHtml(){
    var keys=[], cap='';
    if(heroFocus&&heroFocus.r){
      var towns=ORDER.filter(function(k){ return (CITIES[k].region||'More places')===heroFocus.r; }), lists=towns.map(townKeys), i=0;
      while(keys.length<4&&lists.some(function(l){ return l.length>i; })){ lists.forEach(function(l){ if(keys.length<4&&l[i]&&keys.indexOf(l[i])<0) keys.push(l[i]); }); i++; }
      cap=heroFocus.r;
    } else {
      var hk=(heroFocus&&CITIES[heroFocus.c])?heroFocus.c:homeTown(); keys=townKeys(hk); cap=CITIES[hk].name;
    }
    return keys.slice(0,4).map(function(k){ return '<div class="hstamp"><img src="'+PHOTOS[k]+'" alt=""></div>'; }).join('')+'<p class="hstamps-cap mono">'+cap+'</p>';
  }
  var heroPause=0;
  function setHeroFocus(f,auto){
    if(!auto) heroPause=Date.now()+12000;
    if(JSON.stringify(f)===JSON.stringify(heroFocus)) return;
    heroFocus=f; var el=document.querySelector('.hstamps'); if(!el) return;
    el.classList.add('swap'); setTimeout(function(){ el.innerHTML=stampsHtml(); el.classList.remove('swap'); },170);
  }
  (function(){
    var rm=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)'), seq=null, si=0;
    function build(){ var regs=[], by={}; ORDER.forEach(function(k){ var r=CITIES[k].region||'More places'; if(!by[r]){ by[r]=[]; regs.push(r); } by[r].push(k); }); var out=[], i=0; while(out.length<ORDER.length){ regs.forEach(function(r){ if(by[r][i]) out.push(by[r][i]); }); i++; } return out; }
    setInterval(function(){
      if(!atHome||onPass||document.hidden||(rm&&rm.matches)||Date.now()<heroPause||!document.querySelector('.hstamps')) return;
      if(!seq){ seq=build(); }
      var cur2=heroFocus&&heroFocus.c, at=seq.indexOf(cur2); si=(at<0?si:at)+1; if(si>=seq.length) si=0;
      setHeroFocus({c:seq[si]},true);
    },5000);
  })();
  document.addEventListener('click',function(e){
    var sm=e.target.closest&&e.target.closest('.home-regions summary.region, details.reg:not(.ppreg) > summary.region'); if(!sm) return;
    var r=sm.firstElementChild&&sm.firstElementChild.textContent; if(r) setHeroFocus({r:r});
  });
  document.addEventListener('mouseover',function(e){
    var t=e.target.closest&&e.target.closest('button.town[data-c], #cities button.city[data-c]'); if(t&&t.getAttribute('data-c')&&atHome) setHeroFocus({c:t.getAttribute('data-c')});
  });
  document.addEventListener('focusin',function(e){
    var t=e.target.closest&&e.target.closest('button.town[data-c]'); if(t&&t.getAttribute('data-c')) setHeroFocus({c:t.getAttribute('data-c')});
  });
  var GRANKS=[[0,'Newcomer'],[3,'Wanderer'],[10,'Trailblazer'],[25,'Pathfinder'],[50,'Explorer'],[100,'Historian'],[200,'Time Traveler']];
  function gRank(n){ var r=GRANKS[0][1],nx=null; GRANKS.forEach(function(g){ if(n>=g[0]) r=g[1]; }); for(var i=0;i<GRANKS.length;i++){ if(GRANKS[i][0]>n){ nx=GRANKS[i]; break; } } return {name:r,next:nx}; }
  function statusHtml(got,total,res,hk){
    var gr=gRank(got), tk=res||hk, tc=CITIES[tk], ni=0;
    for(var q=0;q<tc.stops.length;q++){ if(!ALL[tk].done[q]){ ni=q; break; } }
    var allDone=tc.stops.every(function(x,i){ return ALL[tk].done[i]; });
    var btn=allDone?'<button class="bigbtn" data-a="gomissions"><span class="bl">Town complete</span><span class="bs">Pick your next town</span></button>':'<button class="bigbtn" data-a="nextstop" data-c="'+tk+'" data-i="'+ni+'"><span class="bl">'+(got>0?'Next stop':'Start your first stop')+'</span><span class="bs">'+tc.stops[ni].name+' · '+tc.name+'</span></button>';
    var st=got>0?'<div class="stl"><div class="snum"><b>'+got+'</b><span>of '+total+' stamps</span></div><p class="sverd">'+gr.name+(gr.next?' <span class="snext">· '+(gr.next[0]-got)+' to '+gr.next[1]+'</span>':'')+'</p></div>':'';
    return '<section class="stat" aria-label="Your progress">'+st+btn+'</section>';
  }
  function ringsHtml(){
    var seen={}, list=[];
    function add(k){ if(CITIES[k]&&!seen[k]){ seen[k]=1; list.push(k); } }
    [cityId].concat(ORDER).forEach(function(k){ if(CITIES[k]){ var d=sum(ALL[k].done); if(d>0&&d<CITIES[k].stops.length) add(k); } });
    var started=list.length;
    tripGet().forEach(function(k){ var d=CITIES[k]?sum(ALL[k].done):0; if(CITIES[k]&&d<CITIES[k].stops.length) add(k); });
    ORDER.forEach(function(k){ if(list.length<10&&CITIES[k]&&CITIES[k].level==='Classics'&&!sum(ALL[k].done)) add(k); });
    list=list.slice(0,10);
    if(!list.length) return '';
    return '<section class="rings" aria-label="Towns to continue"><p class="mono">'+(started?'Jump back in':'Try one of these')+'</p><div class="rrow">'+list.map(function(k){
      var c=CITIES[k], n=sum(ALL[k].done), pc=Math.round(n/c.stops.length*100), key=c.heroKey||((BMAPS[k]||{})[c.stops[0].id]||[])[0], img=(key&&PHOTOS[key])?'<img src="'+PHOTOS[key]+'" alt="">':'';
      return '<button class="rbtn" data-a="city" data-c="'+k+'" aria-label="'+c.name+', '+n+' of '+c.stops.length+' stamps"><span class="rg" style="--p:'+pc+'"><span class="rph">'+img+'</span></span><span class="rn">'+c.name+'</span></button>';
    }).join('')+'</div></section>';
  }
  function viewHome(){
    var got=0,total=0;
    ORDER.forEach(function(k){ total+=CITIES[k].stops.length; got+=sum(ALL[k].done); });
    var hk=homeTown(), stamps=stampsHtml();
    var res0=null; [cityId].concat(ORDER).forEach(function(k){ if(!res0&&CITIES[k]){ var d0=sum(ALL[k].done); if(d0>0&&d0<CITIES[k].stops.length) res0=k; } });
    var h='<section class="home-hero'+(got>0?' ret':'')+'"><div><div class="wordmark" role="img" aria-label="Stamp the Past">Stamp the Past</div><h1>Go there.<br>Prove it.<br>Stamp it.</h1><p class="sub">A mission game for real places. Find the spot, answer what is in front of you, sort fact from tall tale, and watch the past fade into the present.</p><button class="btn heroGo" data-a="gomissions">'+(got>0?'Choose a mission':'Pick a mission')+'</button></div><div class="hstamps" aria-label="Four passport stamps, each a real photo of a landmark">'+stamps+'</div></section>';
    h=(got>0?statusHtml(got,total,res0,hk)+ringsHtml()+h:h+ringsHtml());
    var vcount=0; ORDER.forEach(function(k){ CITIES[k].stops.forEach(function(st){ if(st.verified&&st.verified.on) vcount++; }); });
    var res=null; [cityId].concat(ORDER).forEach(function(k){ if(!res&&CITIES[k]){ var d=sum(ALL[k].done); if(d>0&&d<CITIES[k].stops.length) res=k; } });
        var passTop=got>0?'<section class="passport" id="passport"><button class="rcard" data-a="mypass"><span><strong>Your passport</strong><span class="rsub">'+got+' of '+total+' stamps earned'+(totalPts()?' · '+totalPts()+' challenge points':'')+'</span></span><span class="go">Open ›</span></button></section>':'';
    h+=goalHtml();
    function townLi(k){
      var c=CITIES[k], st=ALL[k], n=sum(st.done), x=sum(st.done)*100+sum(st.claims)*25, rk=c.ranks[0][1];
      c.ranks.forEach(function(r){ if(x>=r[0]) rk=r[1]; });
      var key=c.heroKey||((BMAPS[k]||{})[c.stops[0].id]||[])[0], img=(key&&PHOTOS[key])?'<img src="'+PHOTOS[key]+'" alt="">':'';
      var label=n===c.stops.length?'Complete':(n>0?'Continue':'Start');
      return '<li data-q="'+stOf(k).toLowerCase()+'"><button class="town" data-a="city" data-c="'+k+'"><span class="tph">'+img+'</span><span class="tin"><h3>'+c.name+'</h3>'+(c.level?'<span class="lvl '+(c.level==='Classics'?'ic':'dc')+'">'+(c.level==='Classics'?'Classics · easy':'Hidden Gems · harder')+'</span>':'')+'<span class="sub">'+(TSTATE[k]?TSTATE[k]+' · ':'')+n+' of '+c.stops.length+' stamps · '+rk+'</span></span><span class="go">'+label+' ›</span></button><button class="tstar'+(tripGet().indexOf(k)>-1?' on':'')+'" data-a="trip" data-c="'+k+'" aria-pressed="'+(tripGet().indexOf(k)>-1?'true':'false')+'" aria-label="'+(tripGet().indexOf(k)>-1?'Remove '+c.name+' from my trip':'Add '+c.name+' to my trip')+'">'+(tripGet().indexOf(k)>-1?'★':'☆')+'</button></li>';
    }
    function soonLi(o){ var nm=(typeof o==='string')?o:o.name; return '<li><div class="town soon"><span class="tph"></span><span class="tin"><h3>'+nm+'</h3><span class="sub">Coming soon</span></span></div></li>'; }
    var regs=[]; ORDER.forEach(function(k){ var r=CITIES[k].region||'More places'; if(regs.indexOf(r)<0) regs.push(r); });
    SOON.forEach(function(o){ var r=(typeof o==='string')?'More places':(o.region||'More places'); if(regs.indexOf(r)<0) regs.push(r); });
    h+=browseOpen()+'<section id="missions"><h2 class="hh">Pick a mission</h2>'+chipsHtml()+'<label class="tsearch"><span class="sr">Search towns or states</span><input id="townSearch" type="search" placeholder="Search towns or states" autocomplete="off" autocapitalize="words" spellcheck="false" aria-controls="missions"></label><p class="tnone" id="townNone" hidden>No town matches. Try another spelling.</p>'+regs.map(function(r){
      var items=ORDER.filter(function(k){ return (CITIES[k].region||'More places')===r; }).map(townLi).join('')+SOON.filter(function(o){ return ((typeof o==='string')?'More places':(o.region||'More places'))===r; }).map(soonLi).join('');
      var rk=ORDER.filter(function(k){ return (CITIES[k].region||'More places')===r; }), rg=0, rt=0; rk.forEach(function(k){ rg+=sum(ALL[k].done); rt+=CITIES[k].stops.length; });
      var open=(CITIES[cityId]&&(CITIES[cityId].region||'More places')===r)||(regs[0]===r&&!(CITIES[cityId]&&(ALL[cityId]&&sum(ALL[cityId].done)>0)));
      return '<details class="reg"'+(open?' open':'')+'><summary class="region"><span class="rname"><i class="ring" style="--p:'+(rt?Math.round(rg/rt*100):0)+'" aria-hidden="true"></i>'+r+'</span><span class="rcount">'+(rt?rg+' of '+rt+' stamps':'soon')+'</span></summary><ul class="towns">'+items+'</ul></details>';
    }).join('')+'<p class="passport-line"><strong>'+got+' of '+total+'</strong> stamps collected across '+ORDER.length+' missions.</p></section>';
    h+='</div><div class="bpanel" id="bp-trails" role="tabpanel"'+(btab==='trails'?'':' hidden')+'>'+trailsHtml()+'</div><div class="bpanel" id="bp-trip" role="tabpanel"'+(btab==='trip'?'':' hidden')+'>'+tripHtml()+'</div></section>';
    if(got>0) h+='<details class="pitch"><summary><span class="mono">About</span><strong>How Stamp the Past works</strong></summary>';
    var hs=CITIES[hk].stops, HT=[['Find the spot','A clue sends you to a real landmark. Bring your own two feet.'],['Prove it','Answer a question you can only get by standing there.'],['Fact or fiction','Is the famous story solid, disputed, or a tall tale? Historians argue. Now so can you.'],['Get stamped','Every stop adds a stamp to your passport and a Then/Now photo you can fade through.']];
    h+='<section class="navy"><p class="mono">How it works</p><h2>Four steps. One stamp.</h2><p class="why" style="color:inherit;opacity:.85">Pictured: your current mission, '+CITIES[hk].name+'.</p><div class="hsteps">'+HT.map(function(t,i){ var st=hs[i]; return '<div class="hstep"><span class="bbox sm" aria-hidden="true">'+badge(st.id,true,hk)+'</span><b>'+(i+1)+'</b><h3>'+t[0]+'</h3><p>'+t[1]+'</p><p class="mono" style="opacity:.8">e.g. '+st.name+'</p></div>'; }).join('')+'</div></section>';
    if(PHOTOS.arch_now&&PHOTOS.sign1973) h+='<section class="hsec"><p class="mono">Then and now</p><h2 class="hh2">Swipe back through time.</h2><p>Swipe the photo or drag the slider. Every stop unlocks a real old photo next to a current one. This one is the Reno Arch, 1973 to 2021.</p><div class="cmp" style="margin-top:12px"><div class="box"><img src="'+PHOTOS.arch_now+'" alt="The Reno Arch in 2021"><img class="top" src="'+PHOTOS.sign1973+'" alt="The Reno sign in 1973"></div><div class="row"><span>Now</span><input type="range" min="0" max="100" value="0" aria-label="Fade from now to 1973" data-cmp="1"><span>1973</span></div></div></section>';
    h+='<section class="hsec"><p class="mono">The part nobody else does</p><h2 class="hh2">Is that actually true?</h2><p>Every story comes with claims to sort: well documented, disputed, or not true. Every answer shows its sources, so the game rewards checking, not guessing.</p><div id="homefof" style="margin-top:12px">'+homeFof()+'</div></section>';
    h+='<section class="grown"><p class="mono">For parents (the grown-up section)</p><h2 class="hh2">A game that makes your teen read a plaque. Voluntarily.</h2><ul><li>No accounts and no sign-up</li><li>No location tracking</li><li>No photo uploads</li><li>No ads</li><li>Every story shows its sources</li><li>Every photo shows its credit</li>'+(vcount?'<li>'+vcount+' of '+total+' stops verified on site by the makers</li>':'')+'</ul></section>';
    if(got>0) h+='</details>';
    h+='<p class="home-foot"><strong>Made by a mom and her teenage son.</strong><br>The West, the Midwest, the South, the East and the Southwest so far. More regions on the way.<br><button class="link" data-a="menu">Menu: backup, help, settings</button></p>';
    return h;
  }
  function viewPass(){
    var got=0,total=0,full=0,seals=0,b=bossBest();
    ORDER.forEach(function(k){ total+=CITIES[k].stops.length; var d=sum(ALL[k].done); got+=d; if(d===CITIES[k].stops.length) full++; if(sealTier(b[k])) seals++; });
    var regs=[]; ORDER.forEach(function(k){ var r=CITIES[k].region||'More places'; if(regs.indexOf(r)<0) regs.push(r); });
    var h='<section class="passhead"><p class="mono">Stamp the Past</p><h1 class="hh2">Your passport</h1><div class="pstats"><div><b>'+got+'</b><span>of '+total+' stamps</span></div><div><b>'+full+'</b><span>of '+ORDER.length+' towns done</span></div><div><b>'+seals+'</b><span>challenge seals</span></div><div><b>'+totalPts()+'</b><span>challenge points</span></div></div>'+(got>0?'<button class="btn small" data-a="share" data-k="" style="margin-top:12px">Share my passport</button>':'')+'</section>';
    h+='<section class="passport" id="passport">'+regs.map(function(r){ var rk=ORDER.filter(function(k){ return (CITIES[k].region||'More places')===r; }); if(!rk.length) return ''; var g=0,t=0; rk.forEach(function(k){ g+=sum(ALL[k].done); t+=CITIES[k].stops.length; }); return '<details class="reg ppreg"'+(g>0?' open':'')+'><summary class="region"><span>'+r+'</span><span class="rcount">'+g+' of '+t+' stamps</span></summary>'+rk.filter(function(k){ return sum(ALL[k].done)>0; }).map(function(k){
      var c=CITIES[k], d=sum(ALL[k].done);
      return '<div class="pprow'+(d===c.stops.length?' full':'')+'"><div class="ppname"><strong>'+c.name+'</strong><span class="mono">'+d+' of '+c.stops.length+(d===c.stops.length?' · complete':'')+(bossBest()[k]!==undefined?' · challenge '+bossBest()[k]+'/4':'')+'</span></div><div class="ppstamps">'+(sealTier(bossBest()[k])?'<span class="bbox sm sealbox" title="'+SEALS[sealTier(bossBest()[k])][3]+'">'+seal(sealTier(bossBest()[k]),38)+'</span>':'')+c.stops.map(function(st,i){ return '<span class="bbox sm" title="'+st.badge+'">'+badge(st.id,ALL[k].done[i],k)+'</span>'; }).join('')+'</div></div>';
    }).join('')+(function(){ var n=rk.filter(function(k){ return sum(ALL[k].done)===0; }).map(function(k){ return CITIES[k].name; }); return n.length?'<p class="pp-rest"><strong>'+n.length+' not started:</strong> '+n.join(', ')+'</p>':''; })()+'</details>'; }).join('')+'<p class="passport-line"><strong>'+got+' of '+total+'</strong> stamps. Blank circles are waiting for you.'+(totalPts()?' Challenge points: <strong>'+totalPts()+'</strong>.':'')+'</p>'+(grandOk()?'<div class="grand-line">'+seal('grand',56)+' <span><strong>Grand Historian.</strong> Gold seal in every town.</span></div>':'')+'</section>';
    h+='<section class="card" id="backup"><h3>Back up your passport</h3><p>Your stamps live on this phone only, which is great for privacy but means a lost phone loses them. Copy this code and keep it somewhere safe (a note, a message to yourself). On a new phone, paste it below. No account needed.</p><div class="code"><input id="codeOut" readonly value="'+code()+'" aria-label="Progress code"><button class="btn small" data-a="copy">Copy</button></div><div class="code"><input id="codeIn" placeholder="Paste a code" aria-label="Paste a progress code" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="btn small ghost" data-a="restore">Restore</button></div><p id="codeMsg" class="why" aria-live="polite"></p></section>';
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
      if(((DATA.boss||{})[cityId]||[]).length){ var bb=bossBest()[cityId]; h+='<section class="card"><p class="mono">Final challenge</p><p>Four questions across every stop. No hints, no do-overs inside a run.'+(bb!==undefined?' Your best: <strong>'+bb+' of 4</strong>.':'')+'</p>'+(sealTier(bb)?'<div class="sealwrap">'+seal(sealTier(bb),64)+'<strong>'+SEALS[sealTier(bb)][3]+'</strong></div>':'<p class="why">Score 2 of 4 or better to earn a seal.</p>')+'<button class="btn" data-a="boss">'+(bb!==undefined?'Play again':'Start the final challenge')+'</button></section>'; }
    } else {
      var nm=STOPS.map(function(s){ return s.name; }); var lst=nm.slice(0,-1).join(', ')+' and '+nm[nm.length-1];
      h+='<section class="card"><h3>Your mission</h3><p>'+(sum(S.done)===0?city().mission:'On your list: '+lst+'. Do them in any order.')+'</p>'+(sum(S.done)===0?'<p class="why" style="margin:8px 0 0">On your list: '+lst+'.</p>':'')+'</section>';
    }
    var ts=totalStamps(), seen=bkSeen();
    if(ts>=1&&(seen<0||ts>=seen+8)) h+='<section class="card nudge" aria-label="Back up reminder"><h3>Protect your stamps</h3><p>Your passport is saved on this phone only. Copy your backup code so a new phone or a cleared browser does not erase it.</p><div class="row2"><button class="btn small" data-a="backup">Back up now</button><button class="btn small ghost" data-a="bkdismiss">Not now</button></div></section>';
    h+='<ul class="stops">'+STOPS.map(function(s,i){
      var d=S.done[i];
      return '<li><button class="stop" data-a="open" data-i="'+i+'"><span class="bbox">'+badge(s.id,d)+'</span><span><h3>'+s.name+'</h3><span class="sub">'+s.teaser+'</span><br><span class="status'+(d?' ok':'')+'">'+(d?'Badge earned':'Not found yet')+'</span>'+(s.verified&&s.verified.on?' <span class="vchip">Verified</span>':'')+'</span><span class="chev" aria-hidden="true">›</span></button></li>';
    }).join('')+'</ul>';
    h+='<details class="card"><summary>Privacy and photo credits</summary><ul><li>This page has no accounts, uploads, camera use, or location tracking. Badges and XP are saved only in this browser.</li><li>Photos come from Wikimedia Commons under free licenses, with credit under each one. Where no free photo exists yet, the app says so instead of showing a stand-in.</li></ul>'+creditsList()+'</details>';
    return h;
  }

  var menuFrom=null;
  function themeGet(){ try{ var t=localStorage.getItem('stp-theme'); return (t==='light'||t==='dark')?t:'system'; }catch(e){ return 'system'; } }
  function themeApply(t){ var r=document.documentElement; if(t==='light'||t==='dark') r.setAttribute('data-theme',t); else r.removeAttribute('data-theme'); }
  themeApply(themeGet());
  function menuHtml(){
    var got=totalStamps(), th=themeGet();
    var ex=function(txt){ return '<li>'+txt+'</li>'; };
    var seg=['system','light','dark'].map(function(t){ return '<button class="seg'+(th===t?' on':'')+'" data-a="theme" data-t="'+t+'" aria-pressed="'+(th===t)+'">'+(t==='system'?'Match phone':t.charAt(0).toUpperCase()+t.slice(1))+'</button>'; }).join('');
    var item=function(a,label,sub,extra){ return '<button class="mitem" data-a="'+a+'"'+(extra||'')+'><span><strong>'+label+'</strong>'+(sub?'<span class="msub">'+sub+'</span>':'')+'</span><span class="go" aria-hidden="true">›</span></button>'; };
    return '<div class="menu-panel" role="document"><div class="menu-head"><h2 id="menuT">Menu</h2><button class="menu-x" data-a="menuclose" aria-label="Close menu">&times;</button></div>'
     +'<p class="mgroup">Your passport</p>'
     +item('backup','Back up your passport','Save a code so a lost phone does not lose your stamps')
     +(got>0?item('share','Share my passport','Make a picture of your stamps',' data-k=""'):'')
     +'<p class="mgroup">Help</p>'
     +item('replaytour','Replay the guide','The quick tour of how a stop works')
     +'<details class="mdet"><summary>How Stamp the Past works</summary><ol><li><strong>Find the spot.</strong> A clue sends you to a real landmark.</li><li><strong>Prove it.</strong> Answer a question you can only get by standing there.</li><li><strong>Fact or fiction.</strong> Sort the famous story into solid, disputed or not true.</li><li><strong>Get stamped.</strong> Every stop adds a stamp and a then and now photo.</li></ol></details>'
     +item('report','Report a problem or send feedback','Tell us what is wrong or confusing')
     +'<p class="mgroup">Privacy</p>'
     +'<details class="mdet"><summary>For parents and grown-ups</summary><ul><li>No accounts and no sign-up</li><li>No location tracking</li><li>No photo uploads</li><li>No ads</li><li>Every story shows its sources</li><li>Every photo shows its credit</li></ul></details>'
     +'<details class="mdet"><summary>Photo credits for '+city().name+'</summary>'+creditsList()+'</details>'
     +'<p class="mgroup">Settings</p>'
     +'<div class="mrow"><span id="thl">Appearance</span><div class="segs" role="group" aria-labelledby="thl">'+seg+'</div></div>'
     +'<p class="mgroup">Account</p>'
     +'<div class="macct"><strong>No account needed.</strong><span class="msub">Your stamps live on this phone. Use a backup code to move them to a new one. Optional sign-in may come later, so your stamps can follow you between devices.</span></div>'
     +'<p class="mfoot">Made by a mom and her teenage son.</p></div>';
  }
  function openMenu(){
    closeMenu(); menuFrom=document.activeElement;
    var d=document.createElement('div'); d.id='menu'; d.className='menu'; d.setAttribute('role','dialog'); d.setAttribute('aria-modal','true'); d.setAttribute('aria-labelledby','menuT');
    d.innerHTML='<div class="menu-scrim" data-a="menuclose"></div>'+menuHtml(); document.body.appendChild(d); document.body.classList.add('menuopen');
    var f=d.querySelector('.menu-x'); if(f) f.focus();
  }
  function closeMenu(){ var e=document.getElementById('menu'); if(e){ e.remove(); document.body.classList.remove('menuopen'); if(menuFrom&&menuFrom.focus&&document.body.contains(menuFrom)) try{ menuFrom.focus(); }catch(x){} } }
  function celebKeyGet(){ try{ return JSON.parse(localStorage.getItem('then-now-cel')||'{}')||{}; }catch(e){ return {}; } }
  function celebrate(){
    var kv=celebKeyGet(); if(kv[cityId]) return; kv[cityId]=1; try{ localStorage.setItem('then-now-cel',JSON.stringify(kv)); }catch(e){}
    var c=city(), x=xp(), r=rank(x), old=document.getElementById('celeb'); if(old) old.remove();
    var cf=''; for(var q=0;q<14;q++) cf+='<i style="--x:'+(q*7+3)+'%;--d:'+((q%5)*0.12)+'s;--c:'+(q%3)+'"></i>';
    var d=document.createElement('div'); d.id='celeb'; d.className='celeb'; d.setAttribute('role','dialog'); d.setAttribute('aria-modal','true'); d.setAttribute('aria-labelledby','celebT');
    d.innerHTML='<div class="celeb-card"><div class="confetti" aria-hidden="true">'+cf+'</div><div class="celeb-stamp"><div class="bbox lg">'+badge('master',true)+'</div></div><p class="mono">Mission complete</p><h2 id="celebT">'+c.explorer+'</h2><p>'+c.afterDone+'</p><p class="celeb-stats"><strong>'+r.name+'</strong> · '+x+' XP · 4 of 4 stamps</p><div class="celeb-btns"><button class="btn" data-a="share" data-k="'+cityId+'">Share my stamps</button><button class="btn ghost" data-a="passport">See my passport</button><button class="btn ghost" data-a="celebclose">Keep exploring</button></div></div>';
    document.body.appendChild(d);
    var f=d.querySelector('button'); if(f) f.focus();
  }
  function closeCeleb(){ var e=document.getElementById('celeb'); if(e) e.remove(); }
  document.addEventListener('keydown',function(e){
    if(e.key==='Tab'){ var dlg=document.getElementById('report')||document.getElementById('menu')||document.getElementById('tour')||document.getElementById('celeb'); if(dlg&&dlg.offsetParent!==null||dlg&&getComputedStyle(dlg).display!=='none'){ var f=dlg.querySelectorAll('button'); if(f.length){ var first=f[0], last=f[f.length-1]; if(!dlg.contains(document.activeElement)){ first.focus(); e.preventDefault(); } else if(e.shiftKey&&document.activeElement===first){ last.focus(); e.preventDefault(); } else if(!e.shiftKey&&document.activeElement===last){ first.focus(); e.preventDefault(); } } } }
  });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'){ closeReport(); closeCeleb(); closeMenu(); if(document.getElementById('tour')) endTour(); } });
  /* offline: the web version caches itself (sw.js). Say so when the connection changes. */
  try{ if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(function(){}); }catch(e){}
  window.addEventListener('offline',function(){ toast('You are offline. Everything still works except map links.'); });
  window.addEventListener('online',function(){ toast('Back online.'); });
  var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function vdate(d){ var m=/^(\d{4})-(\d{2})/.exec(d||''); return m?MON[+m[2]-1]+' '+m[1]:''; }
  function vnote(st){
    var v=st.verified;
    if(v&&v.on) return '<div class="vbadge ok"><b>Verified on site</b><span>by '+v.by+(vdate(v.on)?' · '+vdate(v.on):'')+'</span>'+(v.note?'<em>'+v.note+'</em>':'')+'</div>';
    var fn=st.field.replace(/^Field notes pending:\s*/i,''); return '<div class="vbadge"><b>Not verified on site yet</b>'+(/nobody has walked/i.test(fn)?'':'<span>'+fn+'</span>')+'</div>';
  }
  /* ---------- report a problem ---------- */
  function whereAmI(){
    if(cur) return city().name+' / '+STOPS[cur.i].name+' / step '+(cur.step+1);
    if(boss) return city().name+' / final challenge / question '+(boss.i+1);
    return atHome?(onPass?'Passport':'Home'):city().name+' / '+tab;
  }
  function showReport(){
    var old=document.getElementById('report'); if(old) old.remove();
    var d=document.createElement('div'); d.id='report'; d.className='celeb'; d.setAttribute('role','dialog'); d.setAttribute('aria-modal','true'); d.setAttribute('aria-labelledby','repT'); d.dataset.where=whereAmI();
    d.innerHTML='<div class="celeb-card tour-card rep-card"><h2 id="repT">Something wrong?</h2><p>Wrong answer, confusing screen, broken photo, or a plaque that says something else. Tell us in a sentence or two.</p><label class="mono" for="repMsg">What happened</label><textarea id="repMsg" maxlength="600" rows="4"></textarea><label class="mono" for="repWho">Your email (optional, only if you want a reply)</label><input id="repWho" type="email" maxlength="120" autocomplete="off"><p class="why">Please do not include personal details. We send along only where in the app you were: <em>'+d.dataset.where+'</em>.</p><p id="repMsgOut" class="feedback" aria-live="polite"></p><div class="celeb-btns"><button class="btn" data-a="repsend">Send</button><button class="btn ghost" data-a="repclose">Cancel</button></div></div>';
    document.body.appendChild(d); var f=document.getElementById('repMsg'); if(f) f.focus();
  }
  function closeReport(){ var e=document.getElementById('report'); if(e) e.remove(); }
  function sendReport(){
    var d=document.getElementById('report'); if(!d) return;
    var msg=document.getElementById('repMsg').value.trim(), out=document.getElementById('repMsgOut');
    if(!msg){ out.className='feedback bad'; out.textContent='Write a sentence first.'; return; }
    var body=new URLSearchParams({'form-name':'report','bot-field':'','where':d.dataset.where,'message':msg,'contact':document.getElementById('repWho').value.trim()}).toString();
    out.className='feedback'; out.textContent='Sending...';
    var web=/^https?:$/.test(location.protocol);
    fetch(web?'/':'https://stamp-the-past.netlify.app/',{method:'POST',mode:web?'same-origin':'no-cors',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:body}).then(function(r){
      if(web&&!r.ok) throw new Error('bad'); closeReport(); toast('Thanks. Sent.');
    }).catch(function(){ out.className='feedback bad'; out.textContent='Could not send from here. Try the test site, or check your connection.'; });
  }
  /* ---------- first-run tour ---------- */
  var TOUR=[
    {h:'Go there. Prove it.',p:'A history game played on real streets. Sixty seconds to learn the moves, then you are on your own. Bring shoes.',ill:'hello',nx:'Show me'},
    {h:'Find it. Prove it.',p:'Every town is four real landmarks. A clue sends you there. Stand in front of it, tap "I am here", and answer a question you can only get by standing there.',ill:'find'},
    {h:'Travel back',p:'Every stamp unlocks a real old photo. Drag the slider to fade between then and now.',ill:'cmp'},
    {h:'Fact or fiction',p:'Famous stories are often wrong. Sort each claim: documented, disputed, or not true. Every stamp lands in your passport, and you can replay this guide from Home.',ill:'fof',nx:'Pick a mission',done:1}
  ], tourI=0;
  var TILL={
    hello:'<div class="ti ti-hero"><span>A history game</span><b>Stamp<br>the Past</b></div>',
    town:'<div class="ti"><div class="ti-town on"><i></i><span><b>Reno</b><small>0 of 4 stamps</small></span><em>START ›</em></div><div class="ti-town"><i></i><span><b>Seattle</b><small>0 of 4 stamps</small></span><em>START ›</em></div></div>',
    find:'<div class="ti"><div class="ti-card"><span class="mono">Find it</span><p>Go to the corner of Commercial Row and Lake Street. Look for the old brick depot.</p><div class="ti-btn">I am here</div></div></div>',
    quiz:'<div class="ti"><div class="ti-card"><span class="mono">Check in</span><p><b>What is carved above the main door?</b></p><div class="ti-opt">A year</div><div class="ti-opt ok">A name</div></div></div>',
    cmp:'<div class="ti"><div class="ti-cmp"><span style="left:8px">THEN</span><span style="right:8px">NOW</span></div><div class="ti-sl"></div></div>',
    fof:'<div class="ti"><div class="ti-claim">The first depot burned down in 1905.</div><div class="ti-chips"><span>Well documented</span><span>Disputed</span><span>Not true</span></div></div>',
    pass:'<div class="ti"><div class="ti-stamps"><i class="f"></i><i class="f"></i><i></i><i></i><i></i><i></i></div></div>'
  };
  function maybeTour(){
    var seen=null; try{ seen=localStorage.getItem('then-now-tour'); }catch(e){}
    if(seen) return;
    var anyProgress=false; ORDER.forEach(function(k){ if(sum(ALL[k].done)>0) anyProgress=true; });
    if(anyProgress){ try{ localStorage.setItem('then-now-tour','1'); }catch(e){} return; }
    tourI=0; showTour();
  }
  function showTour(){
    var old=document.getElementById('tour'); if(old) old.remove();
    var t=TOUR[tourI], n=TOUR.length;
    var d=document.createElement('div'); d.id='tour'; d.className='celeb'; d.setAttribute('role','dialog'); d.setAttribute('aria-modal','true'); d.setAttribute('aria-labelledby','tourT');
    d.innerHTML='<div class="celeb-card tour-card"><p class="mono">'+(tourI===0?'Quick tour':'Step '+(tourI+1)+' of '+n)+'</p>'+TILL[t.ill]+'<h2 id="tourT">'+t.h+'</h2><p>'+t.p+'</p><div class="tour-dots" aria-hidden="true">'+TOUR.map(function(_,i){ return '<i'+(i===tourI?' class="on"':'')+'></i>'; }).join('')+'</div><div class="celeb-btns"><button class="btn" data-a="tournext">'+(t.nx||'Next')+'</button>'+(tourI>0?'<button class="btn ghost" data-a="tourback">Back</button>':'')+(t.done?'':'<button class="link tour-skip" data-a="tourskip">Skip the tour</button>')+'</div></div>';
    document.body.appendChild(d); var f=d.querySelector('button'); if(f) f.focus();
  }
  function replayTour(){ tourI=0; showTour(); }
  function endTour(){ var e=document.getElementById('tour'); if(e) e.remove(); try{ localStorage.setItem('then-now-tour','1'); }catch(x){} }
  /* ---------- final challenge (boss round) ---------- */
  var boss=null;
  function bossBest(){ try{ return JSON.parse(localStorage.getItem('then-now-boss')||'{}')||{}; }catch(e){ return {}; } }
  var SEALS={gold:['#f2cf72','#b8872a','#6e4b0c','Gold Seal','Master Historian'],silver:['#eceff3','#9aa3b0','#566070','Silver Seal','Sharp Eye'],bronze:['#e8b58a','#a8693a','#643415','Bronze Seal','Plaque Reader'],grand:['#f2cf72','#1d3557','#f2cf72','Grand Historian','Gold in every town']};
  function sealTier(n){ return n>=4?'gold':(n===3?'silver':(n===2?'bronze':null)); }
  function ptsOf(n){ return n===undefined||n===null?0:50*n+(n>=4?100:0); }
    var TSTATE={"reno":"NV","vc":"NV","tahoeicons":"CA/NV","tahoe":"CA/NV","boston":"MA","dc":"DC","ny":"NY","chicago":"IL","sf":"CA","philly":"PA","la":"CA","seattle":"WA","nola":"LA","detroit":"MI","minneapolis":"MN","atlanta":"GA","memphis":"TN","savannah":"GA","denver":"CO","santafe":"NM","phoenix":"AZ","albuquerque":"NM","tucson":"AZ","pittsburgh":"PA","baltimore":"MD","cleveland":"OH","stlouis":"MO","cincinnati":"OH","indianapolis":"IN","buffalo":"NY","richmond":"VA","charleston":"SC","houston":"TX","nashville":"TN","providence":"RI","saltlake":"UT","sandiego":"CA","portland":"OR","milwaukee":"WI","columbus":"OH","gettysburg":"PA","louisville":"KY","newport":"RI","knoxville":"TN","portlandme":"ME","newhaven":"CT","burlington":"VT","coloradosprings":"CO","lasvegas":"NV","flagstaff":"AZ","elpaso":"TX","sanantonio":"TX","dayton":"OH"}, TFULL={"NV":"Nevada","CA":"California","MA":"Massachusetts","DC":"District of Columbia Washington","NY":"New York","IL":"Illinois","PA":"Pennsylvania","WA":"Washington","LA":"Louisiana","MI":"Michigan","MN":"Minnesota","GA":"Georgia","TN":"Tennessee","CO":"Colorado","NM":"New Mexico","AZ":"Arizona","MD":"Maryland","OH":"Ohio","MO":"Missouri","IN":"Indiana","VA":"Virginia","SC":"South Carolina","TX":"Texas","RI":"Rhode Island","UT":"Utah","OR":"Oregon","WI":"Wisconsin","KY":"Kentucky","ME":"Maine","CT":"Connecticut","VT":"Vermont"};
    function stOf(k){ var a=TSTATE[k]||''; return a.split('/').map(function(x){return TFULL[x]||x;}).join(' ')+' '+a.replace('/',' '); }

  var DISP={DC:'Washington DC'};
  function logGet(){ try{ var a=JSON.parse(localStorage.getItem('stp-log')||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; } }
  function dstr(d){ function z(n){ return (n<10?'0':'')+n; } return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate()); }
  function logStamp(){ var a=logGet(); a.push(dstr(new Date())); if(a.length>500) a=a.slice(-500); try{ localStorage.setItem('stp-log',JSON.stringify(a)); }catch(e){} }
  function wkOf(ds){ var m=/^(\d{4})-(\d{2})-(\d{2})/.exec(ds); if(!m) return null; return Math.floor((Date.UTC(+m[1],+m[2]-1,+m[3])/86400000-4)/7); }
  function streakWeeks(){ var set={}; logGet().forEach(function(d){ var w=wkOf(d); if(w!==null) set[w]=1; }); var now=wkOf(dstr(new Date())), w=set[now]?now:now-1, n=0; while(set[w]){ n++; w--; } return n; }
  function monthStamps(){ var m=dstr(new Date()).slice(0,7); return logGet().filter(function(d){ return d.slice(0,7)===m; }).length; }
  function goalHtml(){
    var n=totalStamps(); if(n<1) return '';
    var best=null; ORDER.forEach(function(k){ var d=sum(ALL[k].done), t=CITIES[k].stops.length; if(d>0&&d<t){ var left=t-d; if(!best||left<best.left) best={k:k,left:left}; } });
    var sw=streakWeeks(), ms=monthStamps(), bits=[];
    if(sw>0) bits.push('<strong>'+sw+(sw===1?' week':' weeks')+' in a row</strong> with a new stamp');
    if(ms>0) bits.push('<strong>'+ms+'</strong> '+(ms===1?'stamp':'stamps')+' this month');
    var goal=best?'<button class="rcard" data-a="city" data-c="'+best.k+'"><span><strong>Next goal: finish '+CITIES[best.k].name+'</strong><span class="rsub">'+best.left+' more '+(best.left===1?'stamp':'stamps')+' to complete it</span></span><span class="go">Go ›</span></button>':'<p class="rsub">Pick a new town below to start your next goal.</p>';
    return '<section class="goal"><p class="mono">Your progress</p>'+(bits.length?'<p class="gbits">'+bits.join(' · ')+'</p>':'')+goal+'</section>';
  }
  function tripGet(){ try{ var a=JSON.parse(localStorage.getItem('stp-trip')||'[]'); return Array.isArray(a)?a.filter(function(k){ return CITIES[k]; }):[]; }catch(e){ return []; } }
  function tripSet(a){ try{ localStorage.setItem('stp-trip',JSON.stringify(a)); }catch(e){} }
  var btab='towns', btrail='stations', bnavSel='home';
  (function(){ var ly=0, ut=0; function u(){ ut=Date.now(); } window.addEventListener('touchmove',u,{passive:true}); window.addEventListener('wheel',u,{passive:true}); window.addEventListener('scroll',function(){ var y=window.pageYOffset||0, d=y-ly; if(Math.abs(d)<10) return; ly=y; if(Date.now()-ut>1200) return; document.body.classList.toggle('navhide',d>0&&y>160); },{passive:true}); })();
  function updateBnav(){ var nb=document.getElementById('bnav'); if(!nb) return; var cur2=onPass&&atHome?'pass':(atHome?bnavSel:''); nb.querySelectorAll('button').forEach(function(x){ var on=x.getAttribute('data-t')===cur2; x.classList.toggle('on',on); if(on) x.setAttribute('aria-current','page'); else x.removeAttribute('aria-current'); }); }
  function tripHtml(){
    var t=tripGet();
    if(!t.length) return '<div class="bempty"><h3>Plan a trip</h3><p>Tap the star on any town to save it here. You will see how many stamps are left in each place, like a checklist for the road.</p></div>';
    var left=0, rows=t.map(function(k){ var c=CITIES[k], d=sum(ALL[k].done), n=c.stops.length, r=n-d; left+=r; var pc=Math.round(d/n*100);
      return '<li class="trow'+(r?'':' done')+'"><button class="trowb" data-a="city" data-c="'+k+'"><span class="tcheck" aria-hidden="true">'+(r?'':'&#10003;')+'</span><span class="tn"><strong>'+c.name+'</strong><span class="sub">'+(TSTATE[k]?TSTATE[k]+' · ':'')+(r?r+' of '+n+' stamps to go':'All stamped')+'</span><span class="pbar" aria-hidden="true"><i style="width:'+pc+'%"></i></span></span><span class="go">Open ›</span></button><button class="tstar on" data-a="trip" data-c="'+k+'" aria-pressed="true" aria-label="Remove '+c.name+' from my trip">★</button></li>'; }).join('');
    return '<div class="trip" id="trip"><p class="tripsum"><strong>'+t.length+(t.length===1?' town':' towns')+'</strong> · '+left+' stamps to collect</p><ul class="tlist">'+rows+'</ul></div>';
  }
  var STATE_ORDER=null;
  function chipsHtml(){
    var seen={}, list=[]; ORDER.forEach(function(k){ (TSTATE[k]||'').split('/').forEach(function(a){ if(a&&!seen[a]){ seen[a]=1; list.push(a); } }); });
    list.sort(function(a,b){ return (DISP[a]||TFULL[a]||a).localeCompare(DISP[b]||TFULL[b]||b); });
    return '<div class="schips" role="group" aria-label="Browse by state">'+list.map(function(a){ var nm=DISP[a]||TFULL[a]||a, q=a==='DC'?'District of Columbia':nm; return '<button class="chip" data-a="schip" data-s="'+q+'">'+nm+'</button>'; }).join('')+'</div>';
  }
  var TRAILS=[
    {id:'stations',name:'Train stations',note:'Depots and terminals where the country arrived.',re:/station|depot|terminal/i},
    {id:'capitols',name:'Capitols and courthouses',note:'Where laws were made and arguments settled.',re:/capitol|statehouse|state house|courthouse|city hall/i},
    {id:'faith',name:'Churches and missions',note:'Cathedrals, missions and meeting houses.',re:/church|cathedral|temple|mission|basilica|meeting ?house/i},
    {id:'bridges',name:'Bridges and towers',note:'Big things people built to reach farther.',re:/bridge|tower|monument|needle|gate\b/i}
  ];
  function trailStops(re){ var out=[]; ORDER.forEach(function(k){ CITIES[k].stops.forEach(function(st,i){ if(re.test(st.name)) out.push({k:k,st:st,done:!!ALL[k].done[i]}); }); }); return out; }
  var TRICON={"stations": "<path d=\"M6 5h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm0 4h12M8 20l1.5-3m6.5 3-1.5-3M9 13h.01M15 13h.01\"/>", "capitols": "<path d=\"M4 20h16M6 20v-7m4 7v-7m4 7v-7m4 7v-7M3 13h18M5 13a7 7 0 0 1 14 0M12 3v3\"/>", "faith": "<path d=\"M12 2v5m-2-3h4M7 21V12l5-5 5 5v9M10 21v-4h4v4M4 21h16\"/>", "bridges": "<path d=\"M2 18h20M4 18v-5m16 5v-5M4 13c3-6 13-6 16 0M8 14v4m4-5v5m4-4v4\"/>"};
  var TRCOL={stations:'#B7791F',capitols:'#1B58B8',faith:'#2F855A',bridges:'#0F766E'};
  function browseOpen(){
    var n=tripGet().length, T=[['towns','Towns'],['trails','Trails'],['trip','My trip'+(n?' ('+n+')':'')]];
    return '<section class="browse" id="browse"><div class="btabs" role="tablist" aria-label="Browse">'+T.map(function(t){ return '<button class="btab" role="tab" id="bt-'+t[0]+'" data-a="btab" data-t="'+t[0]+'" aria-selected="'+(btab===t[0])+'" aria-controls="bp-'+t[0]+'">'+t[1]+'</button>'; }).join('')+'</div><div class="bpanel" id="bp-towns" role="tabpanel"'+(btab==='towns'?'':' hidden')+'>';
  }
  function setBtab(t){ btab=t; if(t==='towns'||t==='trails') bnavSel=t; ['towns','trails','trip'].forEach(function(x){ var p=document.getElementById('bp-'+x), b=document.getElementById('bt-'+x); if(p) p.hidden=(x!==t); if(b) b.setAttribute('aria-selected',x===t?'true':'false'); }); }
  function trailsHtml(){
    var cards='', lists='';
    TRAILS.forEach(function(tr){ var L=trailStops(tr.re); if(L.length<3) return; var d=L.filter(function(x){ return x.done; }).length, pc=Math.round(d/L.length*100), on=(btrail===tr.id);
      cards+='<button class="tcard'+(on?' on':'')+'" data-a="trail" data-t="'+tr.id+'" style="--tc:'+TRCOL[tr.id]+';--p:'+pc+'" aria-pressed="'+on+'"><span class="tic"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+TRICON[tr.id]+'</svg></span><strong>'+tr.name+'</strong><span class="tcount">'+d+' of '+L.length+' stamped</span><span class="pbar" aria-hidden="true"><i style="width:'+pc+'%"></i></span></button>';
      lists+='<div class="trl" data-trail="'+tr.id+'"'+(on?'':' hidden')+' style="--tc:'+TRCOL[tr.id]+'"><p class="why">'+tr.note+'</p><ul class="tlist">'+L.map(function(x){ return '<li class="trow'+(x.done?' done':'')+'"><button class="trowb" data-a="city" data-c="'+x.k+'"><span class="tcheck" aria-hidden="true">'+(x.done?'&#10003;':'')+'</span><span class="tn"><strong>'+x.st.name+'</strong><span class="sub">'+CITIES[x.k].name+(TSTATE[x.k]?', '+TSTATE[x.k]:'')+'</span></span><span class="go">Open ›</span></button></li>'; }).join('')+'</ul></div>'; });
    return '<p class="why">Collect a theme, not just a town. Pick a trail to see every stop on it.</p><div class="tcards" role="group" aria-label="Trails">'+cards+'</div>'+lists;
  }
  // share card
  function shareDraw(kind,k,cb,noimg){
    var W=1080,H=1350,c=document.createElement('canvas'); c.width=W; c.height=H; var g=c.getContext('2d');
    var keys=[], title, big, line;
    if(kind==='town'){ keys=townKeys(k).slice(0,4); title=CITIES[k].name; big=sum(ALL[k].done)+' of '+CITIES[k].stops.length+' stamps'; line=CITIES[k].explorer; }
    else { var tk=ORDER.filter(function(x){ return sum(ALL[x].done)>0; }).sort(function(a,b){ return sum(ALL[b].done)-sum(ALL[a].done); }); tk.slice(0,4).forEach(function(x){ var kk=townKeys(x)[0]; if(kk) keys.push(kk); }); var full=ORDER.filter(function(x){ return sum(ALL[x].done)===CITIES[x].stops.length; }).length; title='My passport'; big=totalStamps()+' stamps'; line=tk.length+(tk.length===1?' town':' towns')+(full?' · '+full+' complete':''); }
    g.fillStyle='#13202C'; g.fillRect(0,0,W,H); g.fillStyle='#F2B01E'; g.fillRect(0,0,W,14);
    g.fillStyle='#9AAAB8'; g.font='600 34px system-ui,sans-serif'; g.textAlign='center'; g.fillText('STAMP THE PAST',W/2,110);
    g.fillStyle='#FFFFFF'; g.font='800 96px system-ui,sans-serif'; var t=title; while(g.measureText(t).width>W-120&&g.font.indexOf('px')>0){ var sz=parseInt(g.font.split(' ')[1],10)-6; g.font='800 '+sz+'px system-ui,sans-serif'; } g.fillText(t,W/2,235);
    g.fillStyle='#F2B01E'; g.font='700 64px system-ui,sans-serif'; g.fillText(big,W/2,325); g.fillStyle='#C9D1D9'; g.font='500 38px system-ui,sans-serif'; g.fillText(line,W/2,385);
    var n=keys.length, loaded=0, imgs=[], cell=380, gap=36, startX=(W-(2*cell+gap))/2, startY=430;
    function finish(){
      imgs.forEach(function(im,i){ if(!im) return; var x=startX+(i%2)*(cell+gap), y=startY+Math.floor(i/2)*(cell+gap); if(i===imgs.length-1&&i%2===0) x=(W-cell)/2; g.save(); g.beginPath(); g.arc(x+cell/2,y+cell/2,cell/2,0,Math.PI*2); g.clip(); var r=Math.max(cell/im.width,cell/im.height), w=im.width*r, h=im.height*r; g.drawImage(im,x+(cell-w)/2,y+(cell-h)/2,w,h); g.restore(); g.lineWidth=10; g.strokeStyle='#F2B01E'; g.beginPath(); g.arc(x+cell/2,y+cell/2,cell/2,0,Math.PI*2); g.stroke(); });
      g.fillStyle='#9AAAB8'; g.font='500 34px system-ui,sans-serif'; g.fillText('Go there. Prove it. Stamp the past.',W/2,1270); g.fillStyle='#FFFFFF'; g.font='700 36px system-ui,sans-serif'; g.fillText('stamp-the-past.netlify.app',W/2,1318);
      try{ c.toBlob(function(b){ cb(b); },'image/png'); }catch(e){ if(!noimg) shareDraw(kind,k,cb,true); else cb(null); }
    }
    if(!n||noimg){ finish(); return; }
    keys.forEach(function(key,i){ var im=new Image(); im.onload=function(){ imgs[i]=im; if(++loaded===n) finish(); }; im.onerror=function(){ if(++loaded===n) finish(); }; im.src=PHOTOS[key]; });
  }
  function shareClose(){ var e=document.getElementById('sharem'); if(e){ if(e._u) try{ URL.revokeObjectURL(e._u); }catch(x){} e.remove(); } }
  function shareStamps(kind,k){
    toast('Making your card...');
    shareDraw(kind,k,function(b){
      if(!b){ toast('Could not make the card on this device.'); return; }
      var name='stamp-the-past-'+(kind==='town'?k:'passport')+'.png', f=null; try{ f=new File([b],name,{type:'image/png'}); }catch(e){}
      var txt=(kind==='town'?'I finished '+CITIES[k].name+' on Stamp the Past.':'My Stamp the Past passport.')+' Go there. Prove it. Stamp the past.';
      if(f&&navigator.canShare&&navigator.canShare({files:[f]})&&navigator.share){ navigator.share({files:[f],text:txt}).catch(function(){}); return; }
      shareClose(); var u=URL.createObjectURL(b), d=document.createElement('div'); d.id='sharem'; d._u=u; d.className='celeb'; d.setAttribute('role','dialog'); d.setAttribute('aria-modal','true'); d.setAttribute('aria-label','Your share card');
      d.innerHTML='<div class="celeb-card sharecard"><img src="'+u+'" alt="Your stamp card"><p class="why">Press and hold the picture to save or share it.</p><div class="celeb-btns"><a class="btn" href="'+u+'" download="'+name+'">Save the picture</a><button class="btn ghost" data-a="shareclose">Close</button></div></div>';
      document.body.appendChild(d);
    });
  }
  function totalStamps(){ var t=0; ORDER.forEach(function(k){ t+=sum(ALL[k].done); }); return t; }
  function bkSeen(){ try{ return parseInt(localStorage.getItem('stp-bk-seen')||'-1',10); }catch(e){ return -1; } }
  function totalPts(){ var b=bossBest(),t=0; ORDER.forEach(function(k){ t+=ptsOf(b[k]); }); return t; }
  function grandOk(){ var b=bossBest(); return ORDER.length>0&&ORDER.every(function(k){ return b[k]>=4; }); }
  function seal(t,sz){
    var c=SEALS[t]; if(!c) return '';
    var p='',i,a,x,y,pts='';
    for(i=0;i<14;i++){ a=i*Math.PI*2/14; p+='<circle cx="'+(50+39*Math.cos(a)).toFixed(1)+'" cy="'+(50+39*Math.sin(a)).toFixed(1)+'" r="8" fill="'+c[1]+'"/>'; }
    for(i=0;i<10;i++){ a=-Math.PI/2+i*Math.PI/5; var r=i%2?9:21; pts+=(50+r*Math.cos(a)).toFixed(1)+','+(50+r*Math.sin(a)).toFixed(1)+' '; }
    return '<svg class="seal" width="'+(sz||64)+'" height="'+(sz||64)+'" viewBox="0 0 100 100" role="img" aria-label="'+c[3]+'">'+p+'<circle cx="50" cy="50" r="38" fill="'+c[1]+'"/><circle cx="50" cy="50" r="31" fill="'+c[0]+'" stroke="'+c[2]+'" stroke-width="2"/><polygon points="'+pts+'" fill="'+c[2]+'"/></svg>';
  }
  var OKL=['Stamped.','Nailed it.','Clean.','Plaque reader.'], BADL=['Ouch. The plaque disagrees.','Nope. Historians winced.','Close, the way a bird is close to a plane.','Not this time. The answer is in green.'];
  function bossSave(pid,n){ var b=bossBest(); boss.prev=b[pid]; boss.gain=ptsOf(Math.max(n,b[pid]===undefined?0:b[pid]))-ptsOf(b[pid]); if(b[pid]===undefined||n>b[pid]){ b[pid]=n; try{ localStorage.setItem('then-now-boss',JSON.stringify(b)); }catch(e){} } }
  function viewBoss(){
    var Q=(DATA.boss||{})[boss.pid]||[], n=Q.length;
    var h='<div class="stophead"><button class="link" data-a="bossexit">‹ Trail</button><span class="mono">Final challenge</span></div>';
    if(boss.i>=n){
      var perfect=boss.score===n, best=bossBest()[boss.pid];
      var rt=sealTier(boss.score);
      h+='<section class="card boss-res'+(perfect?' perfect':'')+'"><p class="mono">'+(perfect?'Perfect score':'Challenge complete')+'</p>'+(rt?'<div class="sealwrap pop">'+seal(rt,96)+'<strong>'+SEALS[rt][3]+'</strong><span>'+SEALS[rt][4]+'</span></div>':'<p class="why">No seal yet. Re-read the stories and come back. It is 2 of 4 for Bronze.</p>')+'<h2>'+boss.score+' of '+n+'</h2><p>'+(perfect?'Not one slip. You really read the plaques.':(boss.score>=n-1?'So close. One more try for a perfect run?':'Good effort. The stories are still on the Cards tab if you want to read them again.'))+'</p>'+(best!==undefined?'<p class="mono">Best: '+best+' of '+n+'</p>':'')+'<p class="mono">'+(boss.gain>0?'+'+boss.gain+' challenge points':'No new points. Beat your best to earn more.')+'</p>'+(grandOk()?'<p class="grand-line">'+seal('grand',44)+' <strong>Grand Historian.</strong> Gold in every town.</p>':'')+'<div class="celeb-btns"><button class="btn" data-a="bossagain">Try again</button><button class="btn ghost" data-a="bossexit">Back to the trail</button></div></section>';
      return h;
    }
    var q=Q[boss.i];
    h+='<h2 id="stopTitle" tabindex="-1">Question '+(boss.i+1)+' of '+n+'</h2><fieldset class="opts"><legend>'+q.q+'</legend>'+q.o.map(function(o,k){
      var cls=''; if(boss.pick!==null){ if(k===q.a) cls=' right'+(k===boss.pick?' thunk':''); else if(k===boss.pick) cls=' wrong shk'; }
      return '<button class="opt'+cls+'" data-a="bpick" data-k="'+k+'"'+(boss.pick!==null?' disabled':'')+'><span>'+o+'</span>'+(boss.pick!==null&&k===q.a?'<em>Correct</em>':(boss.pick===k?'<em>Not this one</em>':''))+'</button>';
    }).join('')+'</fieldset>';
    if(boss.pick!==null){ var okb=boss.pick===q.a; h+='<p class="bfb '+(okb?'good':'bad')+'" aria-live="polite">'+(okb?OKL[boss.i%4]+((boss.streak||0)>1?' '+boss.streak+' in a row.':''):BADL[boss.i%4])+'</p>'; }
    if(boss.pick!==null) h+='<p class="why" aria-live="polite">'+q.why+'</p><button class="btn" data-a="bnext">'+(boss.i+1>=n?'See my score':'Next question')+'</button>';
    return h;
  }
  function stepper(){
    var names=['Find it','Check in','Unlock','Sources'];
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
      if(((DATA.boss||{})[cityId]||[]).length) h+='<button class="btn" data-a="bossgo">Take the final challenge</button>';
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
    var h='<div class="stophead"><button class="link" data-a="exit">‹ '+(tab==='cards'?'Time Cards':'Trail')+'</button><span class="mono">'+st.tag+'</span></div>';
    h+='<h2 id="stopTitle" tabindex="-1">'+st.name+'</h2>';
    if(cur.demo) h+='<p class="demo-banner" role="status"><strong>Preview mode.</strong> You are trying this from home. No stamp, no points, nothing saved. The real thing needs you on the spot.</p>';
    h+=stepper();

    if(cur.step===0){
      h+='<div class="banner">'+visual(st,'now',st.name+' today')+'<span class="tagline">'+(hasPh(st,'now')?'Photo':'Illustration')+'</span></div><p class="credit">'+credit(st,'now')+'</p>';
      h+='<section class="card"><p class="mono">Find it</p><p>'+st.clue+'</p><div class="safety"><span class="mono">Safety</span><span>'+st.safety+'</span></div>'+vnote(st)
        +'<a class="btn ghost" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&amp;query='+encodeURIComponent(st.map)+'">Open in Maps</a>'
        +'<button class="btn" data-a="step" data-n="1">I am here. Show me the question</button>'+(d?'':'<button class="btn ghost" data-a="demo">Not there? Try it from home (preview)</button>')+'</section>';
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
        h+='<div class="earned pop"><div class="bbox lg">'+badge(st.id,true)+'</div><div><strong>'+(cur.demo?'Preview only: no stamp saved':'Badge earned')+'</strong><span>'+st.badge+'</span></div></div><button class="btn" data-a="step" data-n="2">Unlock the story</button>';
      } else {
        h+='<p class="feedback'+(cur.wrong.length?' bad':'')+'" aria-live="polite">'+(cur.wrong.length?'Not yet. '+st.q.hint:'Get it right to earn the '+st.badge+' badge and 100 XP.')+'</p>';
      }
      h+='</section>';
    }
    if(cur.step===2 && d){
      h+='<div class="stopcols"><div class="sc-l">';
      h+=compare(st);
      if(hasPh(st,'then')&&hasPh(st,'now')){
        h+='<div class="caps"><div class="then"><div class="cap"><strong>Then, '+st.then.yr+'</strong><br>'+st.then.line+'</div>'+credit(st,'then')+'<a target="_blank" rel="noopener" href="'+st.then.link.u+'">'+st.then.link.t+'</a></div>'
          +'<div class="now"><div class="cap"><strong>'+(/^\d/.test(st.now.yr)?'Today, '+st.now.yr:'Today')+'</strong><br>'+st.now.line+'</div>'+credit(st,'now')+'</div></div>';
      } else {
        h+='<div class="pair"><div class="then">'+visual(st,'then',st.then.label+', '+st.then.yr)+'<div class="cap"><strong>Then, '+st.then.yr+': '+st.then.label+'</strong><br>'+st.then.line+'</div>'+credit(st,'then')+'<a target="_blank" rel="noopener" href="'+st.then.link.u+'">'+st.then.link.t+'</a></div>'
        +'<div class="now">'+visual(st,'now',st.now.label)+'<span class="mono">'+(st.now.head||'Now')+'</span><b class="yr">'+st.now.yr+'</b><div class="cap"><strong>'+st.now.label+'</strong><br>'+st.now.line+'</div>'+credit(st,'now')+'</div></div>';
      }
      h+='</div><div class="sc-r">';
      h+='<section class="card story">'+st.story.map(function(p){return '<p>'+p+'</p>';}).join('')+'</section>';
      if(st.disputed) h+='<aside class="argue" aria-label="Historians argue about this"><div class="argue-h"><span class="argue-ic" aria-hidden="true">?</span><span><b>Historians argue about this</b><em>Not everything here is settled.</em></span></div><p>'+st.disputed+'</p><p class="argue-go">Think you can tell solid from shaky? The Source check is next.</p></aside>';
      h+='<div class="fact"><span class="mono">Did you know</span><span>'+st.fact+'</span></div>';
      h+='<details class="card"><summary>Sources</summary><ul class="srcs">'+st.sources.map(function(s){return '<li><a target="_blank" rel="noopener" href="'+s.u+'">'+s.t+'</a></li>';}).join('')+'</ul></details>';
      h+='<button class="btn" data-a="step" data-n="3">Next: sort fact from fiction (up to 50 XP)</button>';
      h+='</div></div>';
    }
    if(cur.step===3 && d){ h+=factGame(st); }
    h+='<p class="repline"><button class="link" data-a="report">Something wrong here? Tell us</button></p>';
    return h;
  }

  function viewCards(){
    var h='<p>Each stop you unlock adds a Time Card to your collection. Tap one to reopen its story.</p><div class="grid">';
    var lockedN=[];
    STOPS.forEach(function(s,i){
      if(S.done[i]){
        h+='<button class="tcard" data-a="open" data-i="'+i+'" data-s="2"><span class="mono">'+s.name+'</span>'
          +'<span class="mini">'+visual(s,'then','Then: '+s.card.la,' then-s').replace(/<div/g,'<span').replace(/<\/div>/g,'</span>')+visual(s,'now','Now: '+s.card.lb).replace(/<div/g,'<span').replace(/<\/div>/g,'</span>')+'</span><span class="credit-txt">Then: '+creditTxt(s,'then')+'. Now: '+creditTxt(s,'now')+'.</span>'
          +'<span class="years">'+s.card.a+' <i>→</i> '+s.card.b+'</span><span><strong>Then:</strong> '+s.card.la+'</span><span><strong>Now:</strong> '+s.card.lb+'</span></button>';
      } else lockedN.push(s.name);
    });
    if(lockedN.length) h+='<div class="tcard locked"><span class="mono">'+lockedN.length+' locked</span><span class="years">? <i>→</i> ?</span><span>Find '+lockedN.join(', ').replace(/, ([^,]*)$/,' and $1')+' to collect '+(lockedN.length>1?'these cards':'this card')+'.</span></div>';
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
    h+='<section class="card"><h3>Back up your passport</h3><p>There are no accounts. To move your badges to another phone, copy this code there and paste it below.</p><div class="code"><input id="codeOut" readonly value="'+code()+'" aria-label="Progress code"><button class="btn small" data-a="copy">Copy</button></div>'
      +'<div class="code"><input id="codeIn" placeholder="Paste a code" aria-label="Paste a progress code" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="btn small ghost" data-a="restore">Restore</button></div><p id="codeMsg" class="why" aria-live="polite"></p></section>';
    h+='<section class="card"><h3>Start over</h3>'+(confirmReset?'<p>Erase every badge and all XP for '+city().name+' on this phone?</p><div class="row"><button class="btn" data-a="resetyes">Yes, erase</button><button class="btn ghost" data-a="resetno">Cancel</button></div>':'<button class="btn ghost" data-a="resetask">Reset progress</button>')+'</section>';
    return h;
  }

  function render(focusTitle){
    updateHeader();
    document.body.classList.toggle('ishome',atHome); document.body.classList.toggle('ispass',atHome&&onPass); document.body.classList.remove('navhide'); updateBnav();
    document.body.classList.toggle('instop',!!cur&&!boss);
    var m=document.getElementById('main');
    m.setAttribute('aria-labelledby','tab-'+tab);
    if(boss&&(atHome||boss.pid!==cityId)) boss=null;
    if(boss) m.innerHTML=viewBoss();
    else if(atHome&&!cur) m.innerHTML=onPass?viewPass():viewHome();
    else if(cur) m.innerHTML=viewStop();
    else if(tab==='trail') m.innerHTML=viewTrail();
    else if(tab==='cards') m.innerHTML=viewCards();
    else m.innerHTML=viewRewards();
    var bar=document.getElementById('bar');
    var showBar=false;
    if(cur) showBar=cur.step>cur.entry;
    bar.hidden=!showBar;
    document.body.classList.toggle('hasbar',showBar);
    if(cur){
      var atRoot=cur.step<=cur.entry;
      document.getElementById('barBack').textContent='‹ Previous step';
      document.getElementById('barBack').setAttribute('aria-label',atRoot?('Back to '+(tab==='cards'?'Time Cards':'Trail')):'Back to previous step');
      document.getElementById('barExit').textContent=(tab==='cards'?'All cards':'All stops');
    }
    if(cur&&cur.step===2&&!nudged&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      var rg=document.querySelector('#main input[data-cmp]');
      if(rg){ nudged=true; var t0=null, tp=document.querySelector('#main .cmp .top');
        var go=function(ts){ if(!t0) t0=ts; var k=(ts-t0)/1100; if(k>=1){ rg.value=0; if(tp) tp.style.opacity=0; return; } var v=Math.sin(k*Math.PI)*45; rg.value=v; if(tp) tp.style.opacity=v/100; requestAnimationFrame(go); };
        setTimeout(function(){ requestAnimationFrame(go); },500); }
    }
    if(focusTitle){
      var t=document.getElementById('stopTitle');
      if(t) t.focus({preventScroll:true});
    }
  }

  /* ---------- navigation ---------- */
  function leave(){
    endDemo(); cur=null;
    if(pushed){
      pushed=false; ignorePop=true;
      try{ history.back(); }catch(e){ ignorePop=false; }
    }
  }
  function exitStop(){ leave(); render(); window.scrollTo(0,0); }
  function openStop(i,step){
    endDemo();
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
    if(a==='menu'){ openMenu(); return; }
    if(a==='menuclose'){ closeMenu(); return; }
    if(a==='theme'){ var tv=b.getAttribute('data-t'); try{ if(tv==='system') localStorage.removeItem('stp-theme'); else localStorage.setItem('stp-theme',tv); }catch(x){} themeApply(tv); b.parentNode.querySelectorAll('.seg').forEach(function(x){ var on=x===b; x.classList.toggle('on',on); x.setAttribute('aria-pressed',on?'true':'false'); }); return; }
    if(document.getElementById('menu')&&['backup','share','replaytour','report'].indexOf(a)>-1) closeMenu();
    if(a==='home'){ goHome(); return; }
    if(a==='nextstop'){ openStop(+b.getAttribute('data-i'),0); return; }
    if(a==='bossgo'){ leave(); boss={pid:cityId,i:0,score:0,pick:null}; render(); window.scrollTo(0,0); return; }
    if(a==='boss'||a==='bossagain'){ boss={pid:cityId,i:0,score:0,pick:null}; render(); window.scrollTo(0,0); return; }
    if(a==='bossexit'){ boss=null; render(); window.scrollTo(0,0); return; }
    if(a==='bpick'){ if(boss&&boss.pick===null){ var qq=DATA.boss[boss.pid][boss.i], kk=+b.getAttribute('data-k'); boss.pick=kk; if(kk===qq.a){ boss.score++; boss.streak=(boss.streak||0)+1; } else boss.streak=0; render(); } return; }
    if(a==='bnext'){ if(boss){ boss.i++; boss.pick=null; if(boss.i>=DATA.boss[boss.pid].length) bossSave(boss.pid,boss.score); render(); window.scrollTo(0,0); } return; }
    if(a==='report'){ showReport(); return; }
    if(a==='repclose'){ closeReport(); return; }
    if(a==='repsend'){ sendReport(); return; }
    if(a==='tournext'){ if(tourI>=TOUR.length-1){ endTour(); if(!atHome||onPass) goHome(); var mm0=document.getElementById('missions'); if(mm0&&mm0.scrollIntoView) mm0.scrollIntoView({behavior:'smooth',block:'start'}); } else { tourI++; showTour(); } return; }
    if(a==='tourback'){ if(tourI>0){ tourI--; showTour(); } return; }
    if(a==='replaytour'){ replayTour(); return; }
    if(a==='tourskip'){ endTour(); return; }
    if(a==='celebclose'){ closeCeleb(); return; }
    if(a==='bnav'){ var bt=b.getAttribute('data-t');
      if(bt==='pass'){ openPass(); return; }
      if(bt==='home'){ bnavSel='home'; goHome(); return; }
      bnavSel=bt; if(!atHome||onPass) goHome(); setBtab(bt); updateBnav(); var bw=document.getElementById('browse'); if(bw&&bw.scrollIntoView) bw.scrollIntoView({behavior:'smooth',block:'start'}); return; }
    if(a==='btab'){ setBtab(b.getAttribute('data-t')); return; }
    if(a==='trail'){ btrail=b.getAttribute('data-t'); document.querySelectorAll('.tcard').forEach(function(c){ var on=c.getAttribute('data-t')===btrail; c.classList.toggle('on',on); c.setAttribute('aria-pressed',on?'true':'false'); }); document.querySelectorAll('.trl').forEach(function(x){ x.hidden=(x.getAttribute('data-trail')!==btrail); }); return; }
    if(a==='share'){ var sk=b.getAttribute('data-k'); if(sk&&CITIES[sk]) shareStamps('town',sk); else shareStamps('passport'); return; }
    if(a==='shareclose'){ shareClose(); return; }
    if(a==='trip'){ var tk=b.getAttribute('data-c'), ta=tripGet(), ti=ta.indexOf(tk); if(ti>-1) ta.splice(ti,1); else ta.push(tk); tripSet(ta); var sv=window.scrollY; render(); window.scrollTo(0,sv); toast(ti>-1?'Removed from your trip.':'Added to your trip.'); return; }
    if(a==='schip'){ var inp=document.getElementById('townSearch'); if(inp){ var sv2=b.getAttribute('data-s'); inp.value=(inp.value.trim().toLowerCase()===sv2.toLowerCase())?'':sv2; inp.dispatchEvent(new Event('input',{bubbles:true})); } return; }
    if(a==='gomissions'){ setBtab('towns'); var mm=document.getElementById('missions'); if(mm&&mm.scrollIntoView) mm.scrollIntoView({behavior:'smooth',block:'start'}); return; }
    if(a==='backup'){ closeCeleb(); try{ localStorage.setItem('stp-bk-seen',String(totalStamps())); }catch(e){} openPass(); setTimeout(function(){ var el=document.getElementById('backup'); if(el) el.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'}); },60); return; }
    if(a==='bkdismiss'){ try{ localStorage.setItem('stp-bk-seen',String(totalStamps())); }catch(e){} render(); return; }
    if(a==='passport'||a==='mypass'){ closeCeleb(); openPass(); return; }
    if(a==='rregion'){ railRegion=b.getAttribute('data-r'); if(atHome) setHeroFocus({r:railRegion}); applyCity(); return; }
    if(a==='nextstop'){ railRegion=null; setCity(b.getAttribute('data-c')); openStop(+b.getAttribute('data-i')); return; }
    if(a==='city'){ railRegion=null; setCity(b.getAttribute('data-c')); return; }
    if(a==='tab'){ boss=null; leave(); tab=b.getAttribute('data-t'); confirmReset=false; render(); window.scrollTo(0,0); return; }
    if(a==='open'){ var s=b.getAttribute('data-s'); openStop(+b.getAttribute('data-i'), s?+s:undefined); return; }
    if(a==='exit'){ exitStop(); return; }
    if(a==='goback'){ goBack(); return; }
    if(a==='demo'){ if(!S.done[cur.i]){ demoSnap={done:S.done.slice(),claims:S.claims.slice()}; demoC=S; cur.demo=1; cur.step=1; render(true); window.scrollTo(0,0);} return; }
    if(a==='step'){ setStep(+b.getAttribute('data-n')); return; }
    if(a==='pick'){
      var k=+b.getAttribute('data-k'), st=STOPS[cur.i];
      if(k===st.q.answer){
        if(cur.demo){ if(!S.done[cur.i]){ S.done[cur.i]=1; toast('Correct. Preview only, so no stamp is saved.'); } }
        else if(!S.done[cur.i]){ S.done[cur.i]=1; logStamp(); save(); stampFx=true; try{ if(navigator.vibrate) navigator.vibrate([18,40,28]); }catch(e){} if(allDone()) setTimeout(celebrate,1400); }
        cur.wrong=[]; render(); if(stampFx){ stampFx=false; var eb=document.querySelector('.earned .bbox'); if(eb){ eb.classList.add('thud'); try{ var er=eb.closest('.earned'); if(er&&er.scrollIntoView) er.scrollIntoView({behavior:'smooth',block:'center'}); }catch(e){} } }
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
