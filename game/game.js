
(()=>{'use strict';
const $=id=>document.getElementById(id), canvas=$('game'),cx=canvas.getContext('2d');
const WIDTH=2600,HEIGHT=1900, VIEWW=960,VIEWH=600, TAU=Math.PI*2, keys=new Set();
// ADVENTURE MODE: escalating but fairer pug waves and Tolly’s banana barrage. No server or shared scores required.
const petImages=Object.fromEntries(Array.from(document.querySelectorAll('#heroes .hero'),el=>[el.dataset.hero,el.querySelector('.portrait img')]));
const roster={rosie:{name:'Rosie',emoji:'🐕‍🦺',color:'#222a36',hp:130,speed:220,range:225,rate:.56,damage:17,weapon:'dragon'},millie:{name:'Millie',emoji:'🐕',color:'#31323d',hp:145,speed:205,range:250,rate:.52,damage:16,weapon:'ball'},winnifred:{name:'Winnifred',emoji:'🐈',color:'#e4d4bc',hp:110,speed:235,range:110,rate:.38,damage:21,weapon:'sausage'},ellie:{name:'Ellie',emoji:'🐶',color:'#121823',hp:150,speed:250,range:175,rate:.86,damage:9,weapon:'kong',auraRadius:135,healPulse:2.7,selfRegen:1.4}};
let selected=['rosie','winnifred'],players=[],foes=[],shots=[],drops=[],fx=[],hazards=[],boss=null,phase='idle',paused=false,score=0,kills=0,level=1,xp=0,goal=35,spawnClock=0,surgeClock=33,elapsed=0,clues=0,fridgeVisible=false,fridge={x:2180,y:1440},cam={x:0,y:0},lastTime=0,raf=0,messageClock=0,attackClock=0,heldTouch={},audioCtx=null,audioEnabled=true,musicTimer=null,musicStep=0,musicMode='idle',musicBar=0,musicNextBarAt=0,sloganClock=8,bossPhase=1,coneWarned=false;
let cutsceneNext=null,sceneName=null,reviveSeconds=1.85,hudClock=0;
let best=0;try{best=Number(localStorage.getItem('rosie-survivors-best'))||0}catch{};
const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const clueSpots=[{x:730,y:660},{x:1240,y:1060},{x:1690,y:1420}];
const scenery=(()=>{let seed=9145;const r=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};return Array.from({length:450},()=>({x:r()*WIDTH,y:r()*HEIGHT,t:r(),s:10+r()*24}))})();
const SCENE_ART={"clue1":"assets/scene-clue1.webp","clue2":"assets/scene-clue2.webp","clue3":"assets/scene-clue3.webp","intro":"assets/scene-intro.webp","phase2":"assets/scene-phase2.webp","victory":"assets/scene-victory.webp","defeat":"assets/scene-defeat.webp"};
// Never generate alternate faces for the pets: scene portraits reuse the actual
// character-select images (and Tolly's existing portrait) for a consistent cast.
const SCENE_LINES={
 clue1:[['rosie','I recognise that smell. Banana.'],['winnifred','Your investigative methods lack sophistication.']],
 clue2:[['millie','BALL?'],['ellie','I think they want to play!']],
 clue3:[['winnifred','A decree from Tolly. The fridge must be nearby.'],['rosie','I knew the bananas were being guarded!']],
 intro:[['tolly','No Rosie, you’re on a diet — no more banana.'],['rosie','But I searched VERY politely.']],
 phase2:[['tolly',"ARG. DON'T MAKE ME GET THE CONE OF SHAME OUT!!!"],['ellie','No cone! Zoomies, everyone!']]
};
const CLUE_SCENES=[
 {kind:'clue1',title:'CLUE 1 · THE MYSTERIOUS PAWPRINTS',dialogue:'Golden pawprints lead deeper into the sakura gardens. Something delicious is very close.'},
 {kind:'clue2',title:'CLUE 2 · THE GREAT SAUSAGE INCIDENT',dialogue:'An empty sausage wrapper! But who left these tiny, suspicious footprints?'},
 {kind:'clue3',title:'CLUE 3 · THE FRIDGE PROPHECY',dialogue:'Tolly’s warning has been discovered. A strange red light flickers beside the fridge shrine.'}
];
function renderSceneLines(kind){
 const host=$('scene-dialogues');host.replaceChildren();
 const lines=SCENE_LINES[kind];host.hidden=!lines;
 if(!lines)return;
 for(const [id,words] of lines){
   const row=document.createElement('div');row.className='scene-line';
   const avatar=document.createElement('div');avatar.className='scene-face';
   const image=document.createElement('img');
   // Canonical portraits always come from the already-mounted selection UI.
   image.src=id==='tolly'?$('boss-card').querySelector('img').src:petImages[id].src;
   image.alt=(id==='tolly'?'Tolly':roster[id].name)+' character illustration';
   avatar.append(image);
   const info=document.createElement('div');info.className='scene-speech';
   const who=document.createElement('strong');who.textContent=id==='tolly'?'TOLLY':roster[id].name.toUpperCase();
   const speech=document.createElement('span');speech.textContent='“'+words+'”';
   info.append(who,speech);row.append(avatar,info);host.append(row);
 }
}

const slogans={explore:['SUCHT TOLLY!','PUG HORDE INCOMING!','FOR BANANA AND CHEESE!','FOLLOW THE PAWPRINTS!'],boss:['NO BANANA SHALL PASS!','FRIDGE GUARDIAN APPROACHES!','DODGE THE SNACK DEFENCES!','SAVE THE TASTY TREATS!'],danger:['THIS LOOKS RUFF!','RETREAT, REGROUP, RESNACK!','TOO MANY PUGS!'],clues:['A SNACK SCENT APPEARS!','PAWPRINT TRAIL FOUND!','TOLLY IS NEAR…'],victory:['TREATS LIBERATED!','BANANA AND CHEESE TAX ACQUIRED!','SNACK JUSTICE PREVAILS!']};
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function ensureAudio(){
  if(audioCtx) return audioCtx;
  const C=window.AudioContext||window.webkitAudioContext; if(!C) return null;
  audioCtx=new C();
  startMusicLoop();
  return audioCtx;
}
function playTone(freq,dur=.12,type='square',vol=.03,when=0){
  if(!audioEnabled) return; const ctx=ensureAudio(); if(!ctx) return;
  const osc=ctx.createOscillator(), gain=ctx.createGain();
  osc.type=type; osc.frequency.setValueAtTime(freq,ctx.currentTime+when);
  gain.gain.setValueAtTime(0.0001,ctx.currentTime+when);
  gain.gain.exponentialRampToValueAtTime(vol,ctx.currentTime+when+0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+when+dur);
  osc.connect(gain).connect(ctx.destination); osc.start(ctx.currentTime+when); osc.stop(ctx.currentTime+when+dur+0.02);
}
function playSfx(kind){
  if(!audioEnabled) return; ensureAudio();
  if(kind==='heal'){playTone(880,.08,'triangle',.05);playTone(1174,.14,'triangle',.04,.04)}
  else if(kind==='hit'){playTone(170,.08,'sawtooth',.045);playTone(132,.1,'square',.035,.03)}
  else if(kind==='dash'){playTone(520,.04,'square',.025);playTone(310,.07,'triangle',.02,.03)}
  else if(kind==='clue'){playTone(659,.08,'triangle',.05);playTone(880,.12,'triangle',.04,.05);playTone(988,.15,'triangle',.03,.10)}
  else if(kind==='boss'){playTone(220,.15,'sawtooth',.05);playTone(174,.22,'square',.045,.05)}
  else if(kind==='phase'){playTone(440,.07,'square',.055);playTone(392,.07,'square',.05,.08);playTone(220,.22,'sawtooth',.055,.14)}
  else if(kind==='special'){playTone(196,.05,'sawtooth',.05);playTone(247,.07,'square',.045,.05);playTone(294,.18,'triangle',.04,.10)}
  else if(kind==='victory'){playTone(523,.09,'triangle',.05);playTone(659,.09,'triangle',.045,.08);playTone(784,.16,'triangle',.04,.16);playTone(1047,.24,'triangle',.04,.26)}
  else if(kind==='defeat'){playTone(330,.08,'square',.04);playTone(262,.13,'sawtooth',.045,.09);playTone(196,.22,'triangle',.05,.18)}
  else if(kind==='wave'){playTone(262,.07,'square',.025);playTone(196,.09,'square',.025,.06)}
}
// An original 3/4 garden waltz, written for this game: not a transcription of any film score.
// Notes are MIDI numbers. Each line is one bar of 3 beats; [beat, pitch, length].
// This is deliberately data-driven so the theme can be rearranged for the cutscenes and boss.
const gardenMelody=[
 [[0,71,.72],[.75,74,.58],[1.5,76,.63],[2.25,74,.70]],
 [[0,69,.58],[.75,71,.58],[1.5,74,.68],[2.25,78,.69]],
 [[0,79,.90],[1,76,.65],[1.75,74,.43],[2.25,71,.65]],
 [[0,76,.90],[1,74,.58],[1.75,72,.45],[2.25,71,.68]],
 [[0,74,.58],[.75,71,.52],[1.5,67,.78],[2.25,69,.65]],
 [[0,72,.95],[1,76,.65],[1.75,72,.47],[2.25,69,.68]],
 [[0,66,.48],[.5,69,.55],[1.25,74,.76],[2.25,72,.70]],
 [[0,71,.96],[1,69,.58],[1.75,67,.48],[2.25,67,.70]]
];
const bossMelody=[
 [[0,71,.47],[.5,74,.45],[1,76,.65],[1.75,74,.4],[2.25,71,.59]],
 [[0,69,.52],[.75,66,.55],[1.5,62,.45],[2,66,.74]],
 [[0,67,.76],[1,71,.48],[1.5,74,.60],[2.25,72,.48]],
 [[0,69,.5],[.5,72,.49],[1,74,.55],[1.75,76,.5],[2.25,74,.65]],
 [[0,76,.65],[.75,74,.45],[1.25,71,.45],[2,67,.67]],
 [[0,72,.61],[.75,69,.5],[1.5,67,.5],[2.25,64,.57]],
 [[0,66,.62],[.75,69,.55],[1.5,74,.49],[2.25,72,.62]],
 [[0,71,.45],[.5,69,.45],[1,67,.5],[1.75,66,.4],[2.25,64,.67]]
];
const gardenChords=[
 {root:43,notes:[55,59,62]}, // G
 {root:50,notes:[54,57,62]}, // D
 {root:40,notes:[52,55,59]}, // Em
 {root:48,notes:[55,60,64]}, // C
 {root:47,notes:[55,59,62]}, // G/B
 {root:45,notes:[57,60,64]}, // Am
 {root:50,notes:[57,62,66]}, // D
 {root:43,notes:[55,59,62]}  // G
];
const bossChords=[
 {root:40,notes:[52,55,59]}, // Em
 {root:47,notes:[54,59,62]}, // Bm
 {root:48,notes:[55,60,64]}, // C
 {root:50,notes:[57,62,66]}, // D
 {root:40,notes:[52,55,59]},
 {root:45,notes:[57,60,64]},
 {root:47,notes:[54,59,62]},
 {root:40,notes:[52,55,59]}
];
const noteHz=midi=>440*Math.pow(2,(midi-69)/12);
// Tiny WebAudio instruments: a woodwind-like lead, plucked strings, bell and warm bass.
// All synthesis is done locally; there are no third-party audio files or APIs.
function musicVoice(pitch,at,length,kind='flute',loudness=.024){
 const ctx=audioCtx;if(!ctx||!audioEnabled)return;
 const freq=noteHz(pitch),dur=Math.max(.07,length),on=Math.max(at,ctx.currentTime+.003);
 const end=on+dur,release=kind==='bell'?.17:kind==='bass'?.13:.085;
 const env=ctx.createGain();
 const attack=kind==='flute'?.055:kind==='bass'?.018:.008;
 env.gain.setValueAtTime(.0001,on);
 env.gain.linearRampToValueAtTime(loudness,on+attack);
 env.gain.setValueAtTime(loudness,Math.max(on+attack,end-release));
 env.gain.exponentialRampToValueAtTime(.0001,end);
 env.connect(ctx.destination);
 const osc=ctx.createOscillator();
 osc.type=kind==='pluck'?'triangle':kind==='bass'?'sine':kind==='bell'?'sine':'triangle';
 osc.frequency.setValueAtTime(freq,on);
 osc.connect(env);osc.start(on);osc.stop(end+.02);
 // A faint upper partial gives the lead/bell an airy, music-box quality.
 if(kind==='flute'||kind==='bell'){
   const upper=ctx.createOscillator(), upperEnv=ctx.createGain();
   upper.type='sine';upper.frequency.setValueAtTime(freq*(kind==='bell'?2:1),on);
   upperEnv.gain.setValueAtTime(.0001,on);
   upperEnv.gain.linearRampToValueAtTime(loudness*(kind==='bell'?.29:.12),on+.018);
   upperEnv.gain.exponentialRampToValueAtTime(.0001,end);
   upper.connect(upperEnv).connect(ctx.destination);upper.start(on);upper.stop(end+.02);
 }
}
function currentMusic(){
 if(phase==='boss')return'boss';
 if(phase==='cutscene')return'story';
 return phase==='explore'?'garden':'idle';
}
function scheduleMusicBar(mode,index,startAt){
 const isBoss=mode==='boss',beat=60/(isBoss?153:mode==='story'?116:138);
 const chord=(isBoss?bossChords:gardenChords)[index];
 const melody=(isBoss?bossMelody:gardenMelody)[index];
 const gentle=mode==='story';
 musicVoice(chord.root,startAt,beat*(gentle?1.15:.79),'bass',isBoss?.033:gentle?.013:.023);
 for(const beatIndex of [1,2]){
   // Gentle oom-pah-pah accompaniment, the main source of the waltz feel.
   for(const pitch of chord.notes){
     musicVoice(pitch,startAt+beat*beatIndex,beat*(gentle?.56:.38),
       'pluck',isBoss?.014:gentle?.007:.012);
   }
 }
 for(const [pos,pitch,len] of melody){
   musicVoice(pitch,startAt+beat*pos,beat*len,gentle?'bell':'flute',isBoss?.033:gentle?.018:.029);
 }
 // Little high-register sparkle at the end of phrases, like a village music box.
 if(index===3||index===7){
   musicVoice(isBoss?83:86,startAt+beat*2.45,beat*.46,'bell',gentle?.008:.012);
 }
 return beat*3;
}
function tickMusic(){
 if(!audioEnabled||paused||phase==='ended'||phase==='idle'||!audioCtx||audioCtx.state!=='running')return;
 const mode=currentMusic(),now=audioCtx.currentTime;
 if(mode!==musicMode){
   musicMode=mode;musicBar=0;musicNextBarAt=now+.06;
 }
 // Avoid a burst of catch-up notes on tab resume or after switching tabs.
 if(musicNextBarAt<now-.18)musicNextBarAt=now+.05;
 while(musicNextBarAt<now+.17){
   const length=scheduleMusicBar(mode,musicBar,musicNextBarAt);
   musicNextBarAt+=length;musicBar=(musicBar+1)%8;
 }
}
function startMusicLoop(){if(musicTimer)return;tickMusic();musicTimer=setInterval(tickMusic,45)}
function shout(pool,dur=2.4){ say(pick(pool),dur) }

const heroLines={rosie:'🐉 Rosie heard the word banana and immediately accepted the mission.',millie:'🎾 Millie believes the answer to every question is BALL.',winnifred:'👑 Winnifred graciously grants the party permission to proceed.',ellie:'💚 Ellie is ready to lick everyone back to full health. And then zoomie.'};
function updatePlayerTabs(){
 document.querySelectorAll('[data-slot]').forEach(b=>{
  const slot=Number(b.dataset.slot),active=slot===Number($('assign').value);
  b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));
  b.disabled=slot===1&&!$('coop').checked;
 });
}
function setSelection(){document.querySelectorAll('.hero').forEach(el=>{let id=el.dataset.hero;el.classList.toggle('selected-p1',selected[0]===id);el.classList.toggle('selected-p2',$('coop').checked&&selected[1]===id);const tag=el.querySelector('.tags');tag.replaceChildren();if(selected[0]===id){const b=document.createElement('span');b.className='tag';b.textContent='P1';tag.append(b)}if($('coop').checked&&selected[1]===id){const b=document.createElement('span');b.className='tag p2';b.textContent='P2';tag.append(b)}});$('selection-status').textContent='P1: '+roster[selected[0]].name+' (WASD)'+($('coop').checked?'   •   P2: '+roster[selected[1]].name+' (arrows)':'  •  SOLO MODE'); updatePlayerTabs();}
document.querySelectorAll('.hero').forEach(el=>el.addEventListener('click',()=>{selected[Number($('assign').value)]=el.dataset.hero;$('hero-banter').textContent=heroLines[el.dataset.hero];setSelection()}));
document.querySelectorAll('[data-slot]').forEach(b=>b.addEventListener('click',()=>{if(b.disabled)return;$('assign').value=b.dataset.slot;updatePlayerTabs()}));
$('coop').addEventListener('change',()=>{if(!$('coop').checked)$('assign').value='0';setSelection()});setSelection();
function showScene(kind,title,dialogue){
 sceneName=kind;cutsceneNext=kind;phase='cutscene';keys.clear();
 $('pause').disabled=true;
 $('overlay').classList.add('cinematic');$('overlay').classList.remove('hidden');
 $('overlay-kicker').textContent=kind.startsWith('clue')?'STORY DISCOVERY · '+kind.slice(-1)+' / 3':kind==='intro'?'THE FRIDGE HAS BEEN FOUND':'PHASE TWO · CONE OF SHAME';
 $('overlay').querySelector('h3').textContent=title;
 $('overlay').querySelector('p').textContent=dialogue;
 $('overlay-art').src=SCENE_ART[kind];$('overlay-art').classList.add('show');
 renderSceneLines(kind);
 $('share-result').classList.remove('show');
 $('overlay-start').textContent='▶ '+(kind.startsWith('clue')?'CONTINUE THE SEARCH':kind==='intro'?'FACE TOLLY':'CONTINUE THE BATTLE');
 syncHud();
}
function continueScene(){
 if(phase!=='cutscene')return;
 const kind=cutsceneNext;
 cutsceneNext=null;keys.clear();
 $('overlay').classList.remove('cinematic','show');$('overlay').classList.add('hidden');
 $('pause').disabled=false;$('pause').textContent='Ⅱ PAUSE';
 $('scene-dialogues').hidden=true;
 if(kind.startsWith('clue')){
   phase='explore';
   // Prevent an instant hit when returning from the storybook pause.
   players.filter(p=>p.alive).forEach(p=>p.inv=Math.max(p.inv,1.15));
   say(kind==='clue3'?'🧭 Three clues found! Follow the golden pointer to the fridge!':'📜 Mystery deepens! The golden pointer leads to the next clue.',3.5);
   syncHud();lastTime=performance.now();return;
 }
 phase='boss';
 if(kind==='intro'){
   const hp=players.length===2?940:745;
   boss={x:fridge.x+45,y:fridge.y-80,hp,maxHp:hp,size:49,speed:76,attack:1.75};
   hazards=[];foes=foes.slice(-5);bossPhase=1;coneWarned=false;
   $('bossbar').classList.add('show');$('boss-card').classList.add('show');
   say('⚔ TOLLY: No Rosie, you’re on a diet — no more banana!',5);playSfx('boss');score+=200;
 }else{
   say("⚠ CONE OF SHAME PROTOCOL ACTIVATED!",4);playSfx('phase');
   players.filter(p=>p.alive).forEach(p=>p.inv=Math.max(p.inv,1.3));
 }
 syncHud();lastTime=performance.now();
}
function say(t,duration=3){$('game-message').textContent=t;messageClock=duration}
function player(id,num){let c=roster[id];return {...c,id,num,x:320+num*50,y:400+num*55,maxHp:c.hp,cool:rnd(0,.2),inv:0,dash:0,dashCooldown:0,healClock:1.7,healFlash:0,alive:true,reviveProgress:0}}
function start(){
 cancelAnimationFrame(raf);
 players=[player(selected[0],0)];if($('coop').checked)players.push(player(selected[1],1));
 foes=[];shots=[];drops=[];fx=[];hazards=[];phase='explore';paused=false;boss=null;cutsceneNext=null;sceneName=null;musicStep=0;musicMode='idle';musicBar=0;musicNextBarAt=0;
 elapsed=0;score=0;kills=0;level=1;xp=0;goal=35;clues=0;fridgeVisible=false;
 spawnClock=.55;surgeClock=33;attackClock=0;hudClock=0;keys.clear();ensureAudio();
 $('share-result').classList.remove('show');$('share-status').textContent='';$('overlay').classList.remove('cinematic');$('overlay').classList.add('hidden');$('pause').disabled=false;$('pause').textContent='Ⅱ PAUSE';
 $('bossbar').classList.remove('show');$('boss-card').classList.remove('show');$('overlay-art').classList.remove('show');$('scene-dialogues').hidden=true;$('overlay-kicker').textContent='ARCADE MODE';
 say('Okay '+players.map(p=>p.name).join(' & ')+'… '+(players.length===1?'SUCH TOLLY!':'SUCHT TOLLY!')+' ADVENTURE MODE!',5);
 syncHud();lastTime=performance.now();raf=requestAnimationFrame(loop);
 $('game-section').scrollIntoView({behavior:'smooth',block:'start'});
}
function scoreText(win){const squad=players.map(p=>p.name).join(' & ');const duration=Math.floor(elapsed/60)+':'+String(Math.floor(elapsed%60)).padStart(2,'0');return '🐾 LEVEL 32 — ROSIE SURVIVORS\n'+squad+' '+(win?'LIBERATED THE FRIDGE!':'WERE DEFEATED BY TOLLY!')+'\nScore: '+score+' | Pugs bonked: '+kills+' | Time: '+duration+'\nCan you beat our run? 🎮';}
function resetEnd(win){phase='ended';paused=true;$('pause').disabled=true;let title=win?'🎉 TREATS LIBERATED!':'💀 THE PUGS PREVAIL';let detail=win?'Okay, you deserve the banana and cheese tax.':'Mwahahaha! You are a chonk and are of no match to the mighty Tolly!';if(score>best){best=score;try{localStorage.setItem('rosie-survivors-best',String(best))}catch{}detail+=' NEW PERSONAL BEST!'}$('overlay-kicker').textContent=win?'CUTSCENE · REWARD SCREEN':'GAME OVER · FRIDGE SEALED';$('overlay').classList.add('cinematic');$('overlay').querySelector('h3').textContent=title;$('boss-card').classList.remove('show');$('overlay-art').src=win?SCENE_ART.victory:SCENE_ART.defeat;$('overlay-art').classList.add('show');$('overlay').querySelector('p').textContent=detail+' Score: '+score+' · Pugs defeated: '+kills+'.';$('overlay-start').textContent='↻ PLAY AGAIN';$('share-result').classList.add('show');$('share-status').textContent='';$('overlay').classList.remove('hidden'); if(win){playSfx('victory'); say(pick(slogans.victory),3)} else {playSfx('defeat')} syncHud()}
function spawnPug(){
 const live=players.filter(p=>p.alive);if(!live.length)return;
 const focus=live[Math.floor(Math.random()*live.length)];
 const angle=rnd(0,TAU),radius=rnd(390,560);
 const eliteChance=Math.min(.35,.06+elapsed*.0022)+(phase==='boss'?.07:0);
 const roll=Math.random(),kind=roll<eliteChance?(Math.random()<.56?'zoomie':'bruiser'):'normal';
 const tier=Math.floor(elapsed/27);
 const size=kind==='bruiser'?32:kind==='zoomie'?17:rnd(20,26);
 const hp=Math.round(kind==='bruiser'?(70+tier*12):kind==='zoomie'?(23+tier*4):(35+tier*8));
 const speed=(kind==='zoomie'?rnd(142,167):kind==='bruiser'?rnd(50,68):rnd(78,105))+Math.min(35,elapsed*.18);
 const damage=kind==='bruiser'?22+tier:kind==='zoomie'?12+Math.floor(tier*.6):13+Math.floor(tier*.6);
 foes.push({x:clamp(focus.x+Math.cos(angle)*radius,25,WIDTH-25),
 y:clamp(focus.y+Math.sin(angle)*radius,25,HEIGHT-25),hp,maxHp:hp,speed,
 attack:rnd(.2,.7),size,kind,damage});
}
function emit(text,x,y,col='#ffe1aa'){fx.push({text,x,y,col,t:1.1})}
function nearest(origin,arr,r=Infinity){let item=null,bd=r;for(const o of arr){if(o.hp<=0||o.alive===false)continue;const d=dist(origin,o);if(d<bd){bd=d;item=o}}return item}
function fire(p){const target=nearest(p,[...foes,...(boss?[boss]:[])],p.range);if(!target)return;if(p.weapon==='sausage'){for(const e of [...foes,...(boss?[boss]:[])])if(e.hp>0&&dist(p,e)<p.range){damage(e,p.damage+level*2,p);emit('⚔',e.x,e.y,'#fff0a7')}return}const angle=Math.atan2(target.y-p.y,target.x-p.x);shots.push({x:p.x,y:p.y,vx:Math.cos(angle)*410,vy:Math.sin(angle)*410,damage:p.damage+level*2,ttl:1.1,owner:p.num,kind:p.weapon,pierce:p.weapon==='dragon'?1:0})}
function damage(enemy,amount,p){
 if(phase==='ended'||enemy.hp<=0)return;
 enemy.hp-=amount;
 if(enemy===boss&&enemy.hp>0&&!coneWarned&&enemy.hp<=enemy.maxHp*.5){
   coneWarned=true;bossPhase=2;showScene('phase2','THE CONE OF SHAME!',"ARG. DON'T MAKE ME GET THE CONE OF SHAME OUT!!!");return;
 }
 if(enemy.hp<=0){
  if(enemy===boss){score+=900;emit('FRIDGE OPEN!',enemy.x,enemy.y-50);resetEnd(true);return}
  kills++;score+=enemy.kind==='bruiser'?32:enemy.kind==='zoomie'?18:12;xp+=enemy.kind==='bruiser'?11:7;
  emit('+'+(enemy.kind==='bruiser'?32:enemy.kind==='zoomie'?18:12),enemy.x,enemy.y); playSfx('hit');
  if(Math.random()<.17&&drops.length<35)drops.push({x:enemy.x,y:enemy.y,kind:'xp',r:13});
  if(Math.random()<.052&&drops.length<35)drops.push({x:enemy.x,y:enemy.y,kind:'heal',r:15});
  if(xp>=goal){xp-=goal;level++;goal=Math.round(goal*1.42);
    players.forEach(q=>{q.damage+=2;q.maxHp+=3;q.hp=Math.min(q.maxHp,q.hp+8);q.rate=Math.max(.25,q.rate*.96)});
    say('✨ LEVEL '+level+'! Tiny upgrade. The pugs are still coming.',3); playSfx('heal');
  }
 }
}
function movePlayers(dt){
 players.forEach(p=>{
  if(!p.alive)return;
  let k=p.num===0?['a','d','w','s']:['arrowleft','arrowright','arrowup','arrowdown'];
  let dx=Number(keys.has(k[1]))-Number(keys.has(k[0])),dy=Number(keys.has(k[3]))-Number(keys.has(k[2]));
  let l=Math.hypot(dx,dy)||1;
  p.x=clamp(p.x+dx/l*p.speed*dt*(p.dash>0?2.3:1),24,WIDTH-24);
  p.y=clamp(p.y+dy/l*p.speed*dt*(p.dash>0?2.3:1),24,HEIGHT-24);
  p.inv=Math.max(0,p.inv-dt);p.dash=Math.max(0,p.dash-dt);
  p.dashCooldown=Math.max(0,p.dashCooldown-dt);
  p.cool-=dt;if(p.cool<=0){fire(p);p.cool=p.rate}
  for(let i=drops.length-1;i>=0;i--){let d=drops[i];if(dist(p,d)<29){
    if(d.kind==='xp'){xp+=12;score+=5;emit('+XP',p.x,p.y,'#a9f4d1')}
    else{p.hp=Math.min(p.maxHp,p.hp+21);emit('+21 HP',p.x,p.y,'#a9ffc9');playSfx('heal')}
    drops.splice(i,1);
  }}
 });
}
// Ellie support class: a visibly pulsing aura that heals Ellie AND allied players in range.
// Each Ellie has her own independent pulse clock. The circle stops if Ellie is knocked out.
function updateRevives(dt){
 if(players.length<2)return;
 for(const down of players.filter(p=>!p.alive)){
  const helper=players.find(p=>p.alive && dist(p,down)<55);
  if(!helper){down.reviveProgress=Math.max(0,(down.reviveProgress||0)-dt*.7);continue}
  down.reviveProgress=Math.min(reviveSeconds,(down.reviveProgress||0)+dt);
  if(down.reviveProgress<reviveSeconds)continue;
  down.alive=true;down.hp=Math.ceil(down.maxHp*.42);down.inv=2.25;
  down.reviveProgress=0;down.healClock=1.2;
  for(const enemy of foes){if(dist(enemy,down)<100){enemy.x=clamp(enemy.x+(enemy.x-down.x)*.55,24,WIDTH-24);enemy.y=clamp(enemy.y+(enemy.y-down.y)*.55,24,HEIGHT-24)}}
  score+=150;emit('💚 REVIVED!',down.x,down.y-36,'#a7ffe2');
  say('💚 '+helper.name+' revived '+down.name+'! Back to the snacks!',3.2);playSfx('heal');
 }
}
function updateEllieAuras(dt){
 for(const ellie of players){
  if(ellie.id!=='ellie'||!ellie.alive) continue;
  ellie.hp=Math.min(ellie.maxHp,ellie.hp+ellie.selfRegen*dt); // self-sustain between pulses
  ellie.healFlash=Math.max(0,ellie.healFlash-dt);
  ellie.healClock-=dt;
  if(ellie.healClock>0) continue;
  ellie.healClock+=ellie.healPulse;
  ellie.healFlash=.68;
  let didHeal=false;
  for(const ally of players){
   if(!ally.alive||dist(ellie,ally)>ellie.auraRadius) continue;
   const amount=Math.min(ally.maxHp-ally.hp,ally===ellie?13:10);
   if(amount<=0) continue;
   ally.hp=Math.min(ally.maxHp,ally.hp+amount);
   emit('💚 +'+Math.ceil(amount)+' HP',ally.x,ally.y-26,'#9ef7ce');
   didHeal=true;
  }
  if(didHeal) playSfx('heal');
 }
}
function update(dt){
 if(phase==='ended'||phase==='cutscene')return;
 elapsed+=dt;messageClock-=dt;
 if(messageClock<=0){$('game-message').textContent=phase==='explore'?'⚔ ADVENTURE MODE · Dodge the stampedes. Find the clues!':'⚠ BOSS RUSH · Dodge Tolly’s banana barrage!';messageClock=999}
 sloganClock-=dt;
 if(sloganClock<=0){ if(players.some(p=>p.alive&&p.hp/p.maxHp<.33)) shout(slogans.danger,2.2); else shout(phase==='boss'?slogans.boss:slogans.explore,2.2); sloganClock=phase==='boss'?6.5:8.5; }
 movePlayers(dt);
 updateRevives(dt);
 updateEllieAuras(dt);
 spawnClock-=dt;
 if(spawnClock<=0&&foes.length<90){
   const n=phase==='boss'?2:elapsed>70?2:elapsed>25?2:1;
   for(let j=0;j<n&&foes.length<90;j++)spawnPug();
   spawnClock=Math.max(.36,1.02-elapsed*.0042)*(phase==='boss'?.95:1);
 }
 surgeClock-=dt;
 if(surgeClock<=0&&foes.length<82){
    let n=phase==='boss'?7:5;
    for(let j=0;j<n&&foes.length<90;j++)spawnPug();
    say('🐾 PUG STAMPEDE! '+n+' more pugs have joined the hunt!',3.5); playSfx('wave');
    surgeClock=Math.max(23,34-elapsed*.022);
 }
 for(let i=shots.length-1;i>=0;i--){
   let s=shots[i];s.x+=s.vx*dt;s.y+=s.vy*dt;s.ttl-=dt;
   if(s.ttl<=0){shots.splice(i,1);continue}
   for(const target of [...foes,...(boss?[boss]:[])]){
     if(target.hp>0&&dist(s,target)<(target.size||41)+9){
       damage(target,s.damage,players[s.owner]);
       if(s.kind==='kong'){target.slow=Math.max(target.slow||0,2.0);emit('❄ SLOW',target.x,target.y-30,'#a9ecff')} if(s.kind==='ball'){s.damage*=.7;s.pierce=1}
       if(s.pierce>0){s.pierce--;s.x+=s.vx*.05;s.y+=s.vy*.05}
       else {shots.splice(i,1);break}
     }
   }
 }
 if(phase==='ended'||phase==='cutscene')return; // stop all combat during illustrated scenes
 foes=foes.filter(e=>e.hp>0);
 for(const e of foes){
    const p=nearest(e,players,Infinity);if(!p)continue;
    const a=Math.atan2(p.y-e.y,p.x-e.x),d=dist(e,p);
    e.slow=Math.max(0,(e.slow||0)-dt);const pace=e.slow>0?.62:1; if(d>e.size+15){e.x+=Math.cos(a)*e.speed*pace*dt;e.y+=Math.sin(a)*e.speed*pace*dt}
    e.attack=Math.max(0,e.attack-dt);
    if(d<e.size+24&&e.attack<=0&&p.inv<=0){
       p.hp=Math.max(0,p.hp-e.damage);p.inv=.56;e.attack=.85;
       emit('-'+e.damage,p.x,p.y-20,'#ffa4ae');
       if(p.hp<=0){p.alive=false;p.reviveProgress=0;say('💚 '+p.name+' is down! Stand over them for 1.85 seconds to revive!',4)}
    }
 }
 if(players.every(p=>!p.alive)){resetEnd(false);return}
 if(phase==='explore'){
   let i=clues;
   if(i<3){const s=clueSpots[i];if(players.some(p=>p.alive&&dist(p,s)<55)){
      clues++;score+=100;
      const scene=CLUE_SCENES[clues-1];
      playSfx('clue');showScene(scene.kind,scene.title,scene.dialogue);
      return; // Freeze the full combat simulation until the player chooses Continue.
   }}
   if(clues>=3){
      fridgeVisible=true;
      if(players.some(p=>p.alive&&dist(p,fridge)<100)){
        showScene('intro','TOLLY · GUARDIAN OF THE FRIDGE',
          'No Rosie, you’re on a diet — no more banana. The fridge is sealed… until you defeat Tolly!');
        return;
      }
   }
 }
 if(phase==='boss'&&boss&&boss.hp>0){
   boss.attack-=dt;
   const p=nearest(boss,players);
   if(p){
     const a=Math.atan2(p.y-boss.y,p.x-boss.x),d=dist(p,boss);
     if(d>145){boss.x+=Math.cos(a)*boss.speed*dt;boss.y+=Math.sin(a)*boss.speed*dt}
     // The illustrated cone cutscene triggers precisely when HP crosses 50% (in damage()).
     if(boss.attack<=0){
       boss.attack=boss.hp<boss.maxHp*.5?1.48:1.88;
       const frenzy=boss.hp<boss.maxHp*.5;
       // Tolly sends warning-colored banana projectiles out from the fridge shrine.
       const count=frenzy?8:6,base=Math.atan2(p.y-boss.y,p.x-boss.x);
       for(let j=0;j<count;j++){
         const dir=base+(j-(count-1)/2)*(.20);
         const speed=frenzy?198:176;
         hazards.push({x:boss.x+Math.cos(dir)*30,y:boss.y+Math.sin(dir)*30,
            vx:Math.cos(dir)*speed,vy:Math.sin(dir)*speed,ttl:3.3,damage:frenzy?18:15});
       }
       for(const q of players){
         if(q.alive&&dist(q,boss)<110&&q.inv<=0){
           q.hp=Math.max(0,q.hp-(frenzy?21:17));q.inv=.56;
           emit('BANANA BLAST',q.x,q.y-18,'#ffe8a0');
           if(q.hp===0)q.alive=false; else playSfx('special');
         }
       }
       for(let j=0;j<(frenzy?3:2);j++)spawnPug();
       playSfx('special');
       if(frenzy&&Math.random()<.55)emit('🍌 NO MORE BANANA!',boss.x,boss.y-86,'#ffe6ae');
     }
   }
   $('bossfill').style.width=100*clamp(boss.hp/boss.maxHp,0,1)+'%';
 }
 for(let i=hazards.length-1;i>=0;i--){
    const h=hazards[i];h.x+=h.vx*dt;h.y+=h.vy*dt;h.ttl-=dt;
    if(h.ttl<=0){hazards.splice(i,1);continue}
    let struck=false;
    for(const p of players){
      if(p.alive&&p.inv<=0&&dist(h,p)<30){
        p.hp=Math.max(0,p.hp-h.damage);p.inv=.55;
        emit('-'+h.damage,p.x,p.y-23,'#ffe8ac');
        if(p.hp===0)p.alive=false;
        struck=true;break;
      }
    }
    if(struck)hazards.splice(i,1);
 }
 if(players.every(p=>!p.alive)){resetEnd(false);return}
 for(const f of fx){f.y-=25*dt;f.t-=dt}fx=fx.filter(f=>f.t>0);
 hudClock-=dt;if(hudClock<=0){syncHud();hudClock=.13;}
}

function currentObjective(){
 if(phase!=='explore')return null;
 if(clues<3)return {...clueSpots[clues],name:'SCROLL '+(clues+1)+' / 3',hint:['Follow the first golden scent trail','Find the suspicious sausage clue','Track the last pawprint scroll'][clues]};
 return {...fridge,name:'FRIDGE SHRINE',hint:'The fridge is waiting — find Tolly!'};
}
function updateObjective(){
 const target=currentObjective();
 const label=$('objective-label'),detail=$('objective-detail'),progress=$('objective-progress');
 if(!target){label.textContent=phase==='boss'?'⚔ TOLLY · FRIDGE GUARDIAN':phase==='ended'?'🏆 QUEST COMPLETE':'🐾 READY FOR THE HUNT';detail.textContent=phase==='boss'?'Dodge the banana barrage and survive the Cone of Shame!':phase==='ended'?'Share your score with the party':'Choose a hero and begin your mission';progress.style.width=phase==='ended'?'100%':'0%';return;}
 const living=players.filter(p=>p.alive);const origin=living[0]||players[0]||{x:320,y:400};
 const steps=Math.round(Math.hypot(target.x-origin.x,target.y-origin.y)/8);
 label.textContent='🧭 '+target.name;
 detail.textContent=target.hint+' · ~'+steps+' steps away';
 progress.style.width=(clues/3*78+(clues>=3?17:0))+'%';
}
function drawObjectiveMarker(){
 const target=currentObjective();if(!target)return;
 const sx=target.x-cam.x,sy=target.y-cam.y;
 const dx=sx-VIEWW/2,dy=sy-VIEWH/2;
 const angle=Math.atan2(dy,dx), inside=sx>62&&sx<VIEWW-62&&sy>94&&sy<VIEWH-60;
 if(inside){
   cx.save();cx.beginPath();cx.arc(sx,sy,46+Math.sin(elapsed*3)*4,0,TAU);
   cx.strokeStyle='#ffe18b';cx.lineWidth=5;cx.setLineDash([6,8]);cx.stroke();cx.setLineDash([]);cx.restore();
   txt('NEXT',sx,sy-54,16,'center','#fff1b1');return;
 }
 const ratio=Math.min((VIEWW/2-65)/Math.max(1,Math.abs(dx)),(VIEWH/2-94)/Math.max(1,Math.abs(dy)));
 const x=VIEWW/2+dx*ratio,y=VIEWH/2+dy*ratio;
 cx.save();cx.translate(x,y);cx.rotate(angle);
 circle(0,0,28,'#382c39ee');cx.fillStyle='#ffe190';cx.beginPath();cx.moveTo(22,0);cx.lineTo(-12,-15);cx.lineTo(-12,15);cx.closePath();cx.fill();cx.restore();
 txt(clues<3?'📜':'❄',x,y+37,19,'center','#ffe9b4');
}
function syncHud(){updateObjective();let h='';for(const p of players){h+='<p><strong>P'+(p.num+1)+' '+p.name+'</strong> · '+Math.ceil(p.hp)+' / '+p.maxHp+' HP'+(p.id==='ellie'?' · 💚 Lick Aura':'')+'</p><div class="meter"><span style="width:'+100*clamp(p.hp/p.maxHp,0,1)+'%"></span></div>'}$('playerhud').innerHTML=h||'Choose your heroes!';$('missions').innerHTML='<div class="missionline '+(clues>=1?'done':'')+'">'+(clues>=1?'✓':'○')+' Find the first scroll</div><div class="missionline '+(clues>=2?'done':'')+'">'+(clues>=2?'✓':'○')+' Discover the sausage clue</div><div class="missionline '+(clues>=3?'done':'')+'">'+(clues>=3?'✓':'○')+' Reveal the fridge shrine</div><div class="missionline '+(phase==='boss'||phase==='ended'?'done':'')+'">'+(phase==='boss'||phase==='ended'?'✓':'○')+' Find Tolly</div><div class="missionline '+(phase==='ended'&&boss&&boss.hp<=0?'done':'')+'">'+(phase==='ended'&&boss&&boss.hp<=0?'✓':'○')+' Free the tasty treats</div>';$('scoreline').textContent='Score: '+score+' · Level: '+level;$('timerline').textContent='Time: '+Math.floor(elapsed/60)+':'+String(Math.floor(elapsed%60)).padStart(2,'0')+' · Pugs defeated: '+kills;$('bestline').textContent='Personal best: '+(best||'—')}
function rect(x,y,w,h,col){cx.fillStyle=col;cx.fillRect(x,y,w,h)}function circle(x,y,r,col){cx.fillStyle=col;cx.beginPath();cx.arc(x,y,r,0,TAU);cx.fill()}function line(x1,y1,x2,y2,col,width=2){cx.strokeStyle=col;cx.lineWidth=width;cx.beginPath();cx.moveTo(x1,y1);cx.lineTo(x2,y2);cx.stroke()}
function world(){rect(0,0,VIEWW,VIEWH,'#69816d');cx.save();cx.translate(-cam.x,-cam.y);
// tiled moss and Japanese garden paths
for(let x=0;x<WIDTH;x+=150)for(let y=0;y<HEIGHT;y+=150){rect(x,y,149,149,(Math.floor(x/150)+Math.floor(y/150))%2?'#78917a':'#718b72');circle(x+35,y+58,20,'#7d987c')}
// mountain/stream ribbon
cx.strokeStyle='#8dc2b2';cx.lineWidth=100;cx.beginPath();cx.moveTo(100,-100);cx.bezierCurveTo(480,600,100,1000,520,1920);cx.stroke();cx.strokeStyle='#c1e2d2';cx.lineWidth=6;cx.stroke();
// main winding stone path towards fridge
cx.strokeStyle='#b6ab90';cx.lineWidth=95;cx.lineCap='round';cx.beginPath();cx.moveTo(300,400);cx.bezierCurveTo(600,350,620,760,1050,900);cx.bezierCurveTo(1430,1050,1440,1500,2180,1440);cx.stroke();cx.strokeStyle='#ddd1a8';cx.lineWidth=6;cx.setLineDash([8,20]);cx.stroke();cx.setLineDash([]);
// water bridge
rect(360,900,230,55,'#8e4d4e');for(let i=0;i<6;i++)rect(373+i*39,900,12,55,'#d28b71');line(365,885,585,885,'#7d4247',10);
for(const ob of scenery){if(ob.t<.40){circle(ob.x,ob.y,ob.s,'#315c4c');circle(ob.x+9,ob.y-9,ob.s*.78,ob.t<.20?'#e9a4b5':'#e3c0be');circle(ob.x-12,ob.y-5,ob.s*.63,'#f7c1c6')}else if(ob.t<.68){circle(ob.x,ob.y,ob.s*.4,'#e8d99e');circle(ob.x+10,ob.y+6,ob.s*.23,'#edd5a5')}else{circle(ob.x,ob.y,ob.s*.35,'#527d5b');circle(ob.x-9,ob.y,ob.s*.35,'#4d7559')}}
// stone lanterns
for(const [x,y] of [[480,390],[870,920],[1440,1250],[2070,1340]]){rect(x-6,y,13,35,'#77737a');rect(x-16,y-10,33,15,'#444750');rect(x-9,y-23,20,18,'#f1d58f');circle(x,y-17,6,'#fff3bb')}
// Torii gate next to fridge
rect(2060,1260,15,120,'#a44948');rect(2260,1260,15,120,'#a44948');rect(2035,1248,264,20,'#7f3439');rect(2062,1278,213,9,'#d17b63');
// shrine and fridge
rect(fridge.x-55,fridge.y-35,120,95,'#a37772');rect(fridge.x-48,fridge.y-95,100,114,'#eee3ca');rect(fridge.x-48,fridge.y-95,100,18,'#8ec0bf');rect(fridge.x+29,fridge.y-55,8,26,'#678a8d');rect(fridge.x-30,fridge.y-41,47,9,'#b7d1c8');
if(phase==='explore'&&clues<3){const s=clueSpots[clues];const glow=1+0.16*Math.sin(elapsed*4);circle(s.x,s.y,35*glow,'#ffdf7d49');circle(s.x,s.y,20,'#fff0b8');txt('📜',s.x,s.y+12,28,'center')}
if(clues>=3){txt('❄️',fridge.x,fridge.y-103,36,'center');circle(fridge.x,fridge.y-140,12,'#f7e6a8')}
// items
for(const d of drops){txt(d.kind==='xp'?'✨':'🍫',d.x,d.y+8,22,'center')}
// pug horde
for(const e of foes){
 circle(e.x,e.y+12,e.size*.75,'#364b45aa');
 circle(e.x,e.y,e.size,e.kind==='bruiser'?'#a99990':e.kind==='zoomie'?'#f0d394':'#ddbf9b');
 circle(e.x-e.size*.68,e.y-e.size*.45,9,'#715e59');circle(e.x+e.size*.68,e.y-e.size*.45,9,'#715e59');
 circle(e.x,e.y+5,10,'#674d4a');circle(e.x-8,e.y-6,3,'#1d242b');circle(e.x+8,e.y-6,3,'#1d242b');
 if(e.slow>0){cx.beginPath();cx.arc(e.x,e.y,e.size+6,0,TAU);cx.strokeStyle='#a7edff';cx.lineWidth=4;cx.stroke()} if(e.kind==='bruiser')txt('💢',e.x,e.y-e.size-18,23,'center');
 if(e.kind==='zoomie')txt('⚡',e.x,e.y-e.size-17,19,'center');
 rect(e.x-e.size,e.y-e.size-11,e.size*2*clamp(e.hp/e.maxHp,0,1),3,'#d76c78');
}
// birthday boss
if(boss&&boss.hp>0){circle(boss.x,boss.y+20,52,'#402f3a99');circle(boss.x,boss.y,46,'#e4b9bd');txt('👑',boss.x,boss.y-36,43,'center');txt('🧑',boss.x,boss.y+21,52,'center');txt('TOLLY · NO MORE BANANA',boss.x,boss.y-63,15,'center','#fff5ca')}
// A readable AoE circle, not just a hidden buff. Allies must be inside the ring to heal.
for(const p of players){
 if(!p.alive||p.id!=='ellie')continue;
 cx.save();
 const breathing=(Math.sin(elapsed*2.7)+1)/2;
 cx.globalAlpha=(p.healFlash>0?.30:.11)+breathing*.04;
 circle(p.x,p.y,p.auraRadius,'#85f4bb');
 cx.globalAlpha=p.healFlash>0?.95:.57;
 cx.beginPath();cx.arc(p.x,p.y,p.auraRadius,0,TAU);
 cx.strokeStyle='#a4ffd4';cx.lineWidth=p.healFlash>0?6:3;
 cx.setLineDash([12,9]);cx.stroke();cx.setLineDash([]);
 if(p.healFlash>0){
  cx.globalAlpha=p.healFlash/.68*.8;
  cx.beginPath();cx.arc(p.x,p.y,p.auraRadius*(1-p.healFlash/.68),0,TAU);
  cx.lineWidth=4;cx.strokeStyle='#d6fff0';cx.stroke();
 }
 cx.restore();
}
for(const p of players){
 if(!p.alive){circle(p.x,p.y,23,'#4c5968');txt('💤',p.x,p.y+11,26,'center');txt('REVIVE P'+(p.num+1),p.x,p.y-32,16,'center','#fff4cd');cx.beginPath();cx.arc(p.x,p.y,30,-Math.PI/2,-Math.PI/2+TAU*(p.reviveProgress||0)/reviveSeconds);cx.strokeStyle='#9cffcb';cx.lineWidth=5;cx.stroke();continue}
 if(p.inv>0&&Math.floor(elapsed*16)%2)continue;
 circle(p.x,p.y+20,23,'#1b293a88');
 const avatar=petImages[p.id];
 if(avatar&&avatar.complete&&avatar.naturalWidth){
  // A readable, recognisable illustrated portrait for each actual furry friend.
  cx.save();cx.beginPath();cx.arc(p.x,p.y,24,0,TAU);cx.clip();
  const scale=48/Math.min(avatar.naturalWidth,avatar.naturalHeight);
  const w=avatar.naturalWidth*scale,h=avatar.naturalHeight*scale;
  cx.drawImage(avatar,p.x-w/2,p.y-h/2,w,h);cx.restore();
  cx.beginPath();cx.arc(p.x,p.y,24,0,TAU);
  cx.strokeStyle=p.num===0?'#adf8db':'#ffc0c4';cx.lineWidth=3;cx.stroke();
 }else{circle(p.x,p.y,24,p.color);txt(p.emoji,p.x,p.y+16,37,'center')}
 txt('P'+(p.num+1),p.x,p.y-38,17,'center',p.num===0?'#a6ffe1':'#ffc7c3');
}
for(const s of shots){txt(s.kind==='dragon'?'🐉':s.kind==='kong'?'🧊':'🔴',s.x,s.y+9,24,'center')}
for(const h of hazards){circle(h.x,h.y,17,'#ffbd6144');txt('🍌',h.x,h.y+9,25,'center')}
for(const f of fx)txt(f.text,f.x,f.y,17,'center',f.col);
cx.restore();}
function txt(t,x,y,size=20,align='left',color='#fff6de'){cx.textAlign=align;cx.font='bold '+size+'px system-ui, sans-serif';cx.fillStyle=color;cx.shadowColor='#28323b';cx.shadowBlur=3;cx.fillText(t,x,y);cx.shadowBlur=0}
function drawOffscreenArrows(){
 if(phase==='idle'||players.length<2)return;
 for(const p of players){
  const sx=p.x-cam.x,sy=p.y-cam.y;
  if(sx>=26&&sx<=VIEWW-26&&sy>=53&&sy<=VIEWH-26)continue;
  const dx=sx-VIEWW/2,dy=sy-VIEWH/2;
  const ratio=Math.min((VIEWW/2-52)/Math.max(1,Math.abs(dx)),(VIEWH/2-68)/Math.max(1,Math.abs(dy)));
  const x=VIEWW/2+dx*ratio,y=VIEWH/2+dy*ratio;
  const angle=Math.atan2(dy,dx);
  const color=p.num===0?'#a6ffe1':'#ffc7c3';
  cx.save();cx.translate(x,y);cx.rotate(angle);
  circle(0,0,29,'#17243de9');
  cx.fillStyle=color;cx.beginPath();cx.moveTo(20,0);cx.lineTo(-13,-13);cx.lineTo(-13,13);cx.closePath();cx.fill();
  cx.restore();
  txt((p.alive?'P':'✚ P')+(p.num+1),x,y+35,15,'center',color);
 }
}
function render(){let live=players.filter(p=>p.alive);let center=live.length?{x:live.reduce((a,p)=>a+p.x,0)/live.length,y:live.reduce((a,p)=>a+p.y,0)/live.length}:{x:400,y:400};cam.x=clamp(center.x-VIEWW/2,0,WIDTH-VIEWW);cam.y=clamp(center.y-VIEWH/2,0,HEIGHT-VIEWH);world();drawObjectiveMarker();drawOffscreenArrows();rect(0,0,VIEWW,42,'#1a273ac9');txt('🌸 SAKURA GARDEN · '+(phase==='boss'?'FRIDGE DEFENCE':'SEARCH FOR TOLLY'),15,28,18);txt('🐾 '+kills+'  ✨ LV '+level+'  🧾 '+clues+'/3  ⚔ ADVENTURE',VIEWW-17,28,17,'right');let dx=fridge.x-center.x,dy=fridge.y-center.y;if(clues>=3&&phase==='explore')txt('🧭 FRIDGE '+Math.round(Math.hypot(dx,dy))+'m',VIEWW/2,28,17,'center','#ffe6a4')}
function loop(now){let dt=Math.min(.045,(now-lastTime)/1000||.016);lastTime=now;if(!paused&&phase!=='ended'&&phase!=='cutscene')update(dt);render();if(phase!=='ended')raf=requestAnimationFrame(loop)}
function togglePause(){if(phase==='idle'||phase==='ended'||phase==='cutscene')return;paused=!paused;$('pause').textContent=paused?'▶ RESUME':'Ⅱ PAUSE';if(!paused){lastTime=performance.now();raf=requestAnimationFrame(loop)}else cancelAnimationFrame(raf);$('game-message').textContent=paused?'PAUSED':'QUEST RESUMED'}
$('share-result').addEventListener('click',async()=>{
 if(phase!=='ended')return;
 const text=scoreText(Boolean(boss&&boss.hp<=0));
 try{await navigator.clipboard.writeText(text);$('share-status').textContent='Copied! Paste it into our WhatsApp group.';}
 catch{$('share-status').textContent='Copy blocked by this browser. Take a screenshot of your score instead.';}
});
$('start').addEventListener('click',start);$('overlay-start').addEventListener('click',()=>{if(phase==='cutscene')continueScene();else start()});$('restart').addEventListener('click',start);$('pause').addEventListener('click',togglePause);$('mute').addEventListener('click',()=>{audioEnabled=!audioEnabled; if(audioCtx){audioEnabled?audioCtx.resume():audioCtx.suspend()} $('mute').textContent=audioEnabled?'🔊 MUSIC + SFX':'🔇 SOUND OFF'; if(audioEnabled) ensureAudio();});
window.addEventListener('keydown',e=>{let k=e.key.toLowerCase();if(['arrowup','arrowleft','arrowright','arrowdown',' '].includes(k))e.preventDefault();if(['shift','enter'].includes(k)&&phase!=='idle'&&!paused){const id=k==='shift'?0:1;if(players[id]&&players[id].alive&&players[id].dashCooldown<=0){players[id].dash=.18;players[id].dashCooldown=players[id].id==='ellie'?2.2:3.4;players[id].inv=Math.max(players[id].inv,.18);playSfx('dash')}}if(k==='escape')togglePause();keys.add(k)});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());
for(const b of document.querySelectorAll('[data-k]')){const k=b.dataset.k;b.addEventListener('pointerdown',e=>{e.preventDefault();keys.add(k);b.setPointerCapture(e.pointerId)});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>keys.delete(k))}
// idle garden behind the opening card
players=[player('rosie',0),player('winnifred',1)];render();syncHud();
})();