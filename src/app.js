(function(){
  /* ---------- scene + badge drawing ---------- */
  var BMAP={}; Object.keys(__DATA__.packs).forEach(function(k){ var b=__DATA__.packs[k].badgeMap||{}; Object.keys(b).forEach(function(i){ BMAP[i]=b[i]; }); });
  function mono(id){
    if(id==='master') return city().initials;
    var t='?'; STOPS.forEach(function(st){ if(st.id===id) t=st.short.replace(/[^A-Za-z]/g,'').slice(0,2).toUpperCase(); });
    return t;
  }
  function badge(id,on){
    var m=(id==='master')?(city().heroKey&&PHOTOS[city().heroKey]?[city().heroKey,'50% 60%']:null):BMAP[id];
    if(m&&PHOTOS[m[0]]) return '<span class="bimg'+(on?' on':'')+'"><img src="'+PHOTOS[m[0]]+'" alt="" style="object-position:'+m[1]+'"></span>';
    return '<span class="bimg plain'+(on?' on':'')+'"><b>'+mono(id)+'</b></span>';
  }
  var PHOTOS=__PHOTOS__;
  function hasPh(st,era){return !!(st[era].ph && PHOTOS[st[era].ph.k]);}
  function visual(st,era,label,extra){
    if(hasPh(st,era)) return '<div class="scene ph'+(extra||'')+'"><img src="'+PHOTOS[st[era].ph.k]+'" alt="'+label+'"></div>';
    return '<div class="scene pend'+(extra||'')+'"><span>Photo pending. A free-to-use photo has not been added here yet.</span></div>';
  }
  function compare(st){
    if(!(hasPh(st,'then')&&hasPh(st,'now'))) return '';
    return '<section class="cmp" aria-label="Then and now slider"><div class="box"><img src="'+PHOTOS[st.now.ph.k]+'" alt="'+st.now.label+', today"><img class="top" src="'+PHOTOS[st.then.ph.k]+'" alt="'+st.then.label+', '+st.then.yr+'"></div><div class="row"><span>Now</span><input type="range" min="0" max="100" value="0" aria-label="Fade from now to then" data-cmp="1"><span>Then</span></div><p class="hint">Drag to travel back to '+st.then.yr+'.</p></section>';
  }
  document.addEventListener('input',function(e){
    var t=e.target; if(!t||!t.getAttribute||!t.getAttribute('data-cmp')) return;
    var top=t.closest('.cmp').querySelector('.top'); if(top) top.style.opacity=(t.value/100);
  });
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
  var ORDER=__DATA__.order, SOON=__DATA__.soon||[], atHome=true;
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
    var h1=document.getElementById('cityName'); h1.textContent=c.name; h1.className=c.name.length>8?'long':'';
    var hero=document.getElementById('hero'), img=document.getElementById('heroImg');
    if(c.heroKey && PHOTOS[c.heroKey]){ img.src=PHOTOS[c.heroKey]; img.alt=c.heroAlt; hero.classList.remove('nophoto'); }
    else { img.removeAttribute('src'); img.alt=''; hero.classList.add('nophoto'); }
    document.getElementById('heroCredit').innerHTML=c.heroCredit;
    document.getElementById('cities').innerHTML='<button class="city home" data-a="home" aria-pressed="'+atHome+'">Home</button>'+ORDER.map(function(k){
      return '<button class="city" data-a="city" data-c="'+k+'" aria-pressed="'+(!atHome&&k===cityId)+'">'+CITIES[k].name+'</button>';
    }).join('')+SOON.map(function(n){ return '<button class="city" disabled aria-label="'+n+', coming soon">'+n+' · soon</button>'; }).join('');
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
    h+='<section><h2 class="hh">Pick a mission</h2><ul class="towns">'+ORDER.map(function(k){
      var c=CITIES[k], st=ALL[k], n=sum(st.done), x=sum(st.done)*100+sum(st.claims)*25, rk=c.ranks[0][1];
      c.ranks.forEach(function(r){ if(x>=r[0]) rk=r[1]; });
      var key=c.heroKey||(BMAP[c.stops[0].id]||[])[0], img=(key&&PHOTOS[key])?'<img src="'+PHOTOS[key]+'" alt="">':'';
      var label=n===c.stops.length?'Complete':(n>0?'Continue':'Start');
      return '<li><button class="town" data-a="city" data-c="'+k+'"><span class="tph">'+img+'</span><span class="tin"><h3>'+c.name+'</h3><span class="sub">'+n+' of '+c.stops.length+' stamps · '+rk+'</span></span><span class="go">'+label+' ›</span></button></li>';
    }).join('')+SOON.map(function(nm){ return '<li><div class="town soon"><span class="tph"></span><span class="tin"><h3>'+nm+'</h3><span class="sub">Coming soon</span></span></div></li>'; }).join('')+'</ul><p class="passport-line"><strong>'+got+' of '+total+'</strong> stamps collected across '+ORDER.length+' towns.</p></section>';
    h+='<section class="navy"><p class="mono">How it works</p><h2>Four steps. One stamp.</h2><div class="hsteps"><div class="hstep"><b>1</b><h3>Find the spot</h3><p>A clue sends you to a real landmark. Bring your own two feet.</p></div><div class="hstep"><b>2</b><h3>Prove it</h3><p>Answer a question you can only get by standing there.</p></div><div class="hstep"><b>3</b><h3>Fact or fiction</h3><p>Is the famous story solid, disputed, or a tall tale? Historians argue. Now so can you.</p></div><div class="hstep"><b>4</b><h3>Get stamped</h3><p>Every stop adds a stamp to your passport and a Then/Now photo you can fade through.</p></div></div></section>';
    if(PHOTOS.arch_now&&PHOTOS.sign1973) h+='<section class="hsec"><p class="mono">Then and now</p><h2 class="hh2">Drag back through time.</h2><p>Every stop unlocks a real old photo next to a current one. This one is the Reno Arch, 1973 to 2021.</p><div class="cmp" style="margin-top:12px"><div class="box"><img src="'+PHOTOS.arch_now+'" alt="The Reno Arch in 2021"><img class="top" src="'+PHOTOS.sign1973+'" alt="The Reno sign in 1973"></div><div class="row"><span>Now</span><input type="range" min="0" max="100" value="0" aria-label="Fade from now to 1973" data-cmp="1"><span>1973</span></div></div></section>';
    h+='<section class="hsec"><p class="mono">The part nobody else does</p><h2 class="hh2">Is that actually true?</h2><p>Every story comes with claims to sort: well documented, disputed, or not true. Every answer shows its sources, so the game rewards checking, not guessing.</p><div id="homefof" style="margin-top:12px">'+homeFof()+'</div></section>';
    h+='<section class="grown"><p class="mono">For parents (the grown-up section)</p><h2 class="hh2">A game that makes your teen read a plaque. Voluntarily.</h2><ul><li>No accounts and no sign-up</li><li>No location tracking</li><li>No photo uploads</li><li>No ads</li><li>Every story shows its sources</li><li>Every photo shows its credit</li></ul></section>';
    h+='<p class="home-foot"><strong>Made by a mom and her teenage son.</strong><br>Reno first. Virginia City and Tahoe City next.</p>';
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
    } else {
      h+='<section class="card"><h3>Your mission</h3><p>'+city().mission+'</p></section>';
    }
    h+='<ul class="stops">'+STOPS.map(function(s,i){
      var d=S.done[i];
      return '<li><button class="stop" data-a="open" data-i="'+i+'"><span class="bbox">'+badge(s.id,d)+'</span><span><h3>'+s.name+'</h3><span class="sub">'+s.teaser+'</span><br><span class="status'+(d?' ok':'')+'">'+(d?'Badge earned':'Not found yet')+'</span></span><span class="chev" aria-hidden="true">›</span></button></li>';
    }).join('')+'</ul>';
    h+='<details class="card"><summary>Safety, privacy and photo credits</summary><ul><li>Go with a parent or trusted adult, in daylight, and stay on public sidewalks.</li>'+city().safetyNote+'<li>This page has no accounts, uploads, camera use, or location tracking. Badges and XP are saved only in this browser.</li><li>Photos come from Wikimedia Commons under free licenses, with credit under each one. Where no free photo exists yet, the app says so instead of showing a stand-in.</li></ul>'+creditsList()+'</details>';
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
      return h+'<button class="btn" data-a="exit">Back to the trail</button></section>';
    }
    var c=st.claims[next];
    h+='<p class="why">Is this claim solid, disputed, or not true? Tap a label'+(('ontouchstart' in window)?', or swipe the card right for solid and left for not true':'')+'.</p>';
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
      h+='<section class="card"><p class="mono">Find it</p><p>'+st.clue+'</p><div class="safety"><span class="mono">Safety</span><span>'+st.safety+'</span></div><p class="why">'+st.field+'</p>'
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
      h+='<div class="fact"><span class="mono">Did you know</span><span>'+st.fact+'</span></div>';
      if(st.disputed) h+='<div class="note"><span class="mono">Sources disagree</span><span>'+st.disputed+'</span></div>';
      h+='<details class="card"><summary>Sources</summary><ul class="srcs">'+st.sources.map(function(s){return '<li><a target="_blank" rel="noopener" href="'+s.u+'">'+s.t+'</a></li>';}).join('')+'</ul></details>';
      h+='<button class="btn" data-a="step" data-n="3">Source check: earn up to 50 XP</button>';
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
    if(atHome&&!cur) m.innerHTML=viewHome();
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
    if(a==='city'){ setCity(b.getAttribute('data-c')); return; }
    if(a==='tab'){ leave(); tab=b.getAttribute('data-t'); confirmReset=false; render(); window.scrollTo(0,0); return; }
    if(a==='open'){ var s=b.getAttribute('data-s'); openStop(+b.getAttribute('data-i'), s?+s:undefined); return; }
    if(a==='exit'){ exitStop(); return; }
    if(a==='goback'){ goBack(); return; }
    if(a==='step'){ setStep(+b.getAttribute('data-n')); return; }
    if(a==='pick'){
      var k=+b.getAttribute('data-k'), st=STOPS[cur.i];
      if(k===st.q.answer){
        if(!S.done[cur.i]){ S.done[cur.i]=1; save(); toast('Badge earned: '+st.badge+'. +100 XP'); }
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

  load(); applyCity(); render();
})();
