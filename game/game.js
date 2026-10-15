
(()=>{'use strict';
const $=id=>document.getElementById(id), canvas=$('game'),cx=canvas.getContext('2d');
const WIDTH=2600,HEIGHT=1900, VIEWW=960,VIEWH=600, TAU=Math.PI*2, keys=new Set();
// THE GREAT SNACK RIFT: original, friendly-looking blob enemies with readable combat tells.
// No server or shared scores required; all audio is original WebAudio synthesis.
const petImages=Object.fromEntries(Array.from(document.querySelectorAll('#heroes .hero'),el=>[el.dataset.hero,el.querySelector('.portrait img')]));
const roster={rosie:{name:'Rosie',emoji:'🐕‍🦺',color:'#222a36',hp:130,speed:220,range:225,rate:.56,damage:17,weapon:'dragon'},millie:{name:'Millie',emoji:'🐕',color:'#31323d',hp:135,speed:205,range:220,rate:.62,damage:14,weapon:'ball'},winnifred:{name:'Winnifred',emoji:'🐈',color:'#e4d4bc',hp:128,speed:240,range:153,rate:.41,damage:25,weapon:'sausage'},ellie:{name:'Ellie',emoji:'🐶',color:'#121823',hp:150,speed:250,range:175,rate:.86,damage:9,weapon:'kong',auraRadius:135,healPulse:2.7,selfRegen:1.4}};
let selected=['rosie','winnifred'],players=[],foes=[],shots=[],drops=[],fx=[],hazards=[],boss=null,phase='idle',paused=false,score=0,kills=0,level=1,xp=0,goal=35,spawnClock=0,surgeClock=33,elapsed=0,clues=0,fridgeVisible=false,fridge={x:2180,y:1440},cam={x:0,y:0},lastTime=0,raf=0,messageClock=0,attackClock=0,heldTouch={},audioCtx=null,audioEnabled=true,musicTimer=null,musicStep=0,musicMode='idle',musicBar=0,musicNextBarAt=0,sloganClock=8,bossPhase=1,coneWarned=false;
let cutsceneNext=null,sceneName=null,reviveSeconds=1.85,hudClock=0;
let duoActive=false,duoDefeated=false,laserUnlocked=false,beams=[],coneCooldown=6.8,coneWindup=0,coneAngle=0,bossPulseCooldown=4,bossPulseWindup=0,bananaWindup=0;
let gate=null,gateCleared=[false,false,false],difficulty='challenge',questToastClock=0,comboCount=0,comboClock=0;
let daan=null,daanRespawn=0,deathPenalty=0,mythicAngle=0,mythicArcWindup=0,mythicArcCooldown=0;
const DIFFICULTIES={
 story:{label:'Story',multiplier:1,deathLoss:.20,hp:.77,damage:.70,spawn:1.65},
 challenge:{label:'Adventure',multiplier:1.5,deathLoss:.35,hp:1,damage:1,spawn:1},
 impossible:{label:'Impossible · Daan’s Dare',multiplier:3,deathLoss:.50,hp:1.38,damage:1.4,spawn:.72}
};
const mode=()=>DIFFICULTIES[difficulty]||DIFFICULTIES.challenge;
function awardScore(points){score+=Math.round(points*mode().multiplier)}
function bestKey(){return 'rosie-survivors-best:'+difficulty+':'+players.length+'p'}
function readBest(){try{return Number(localStorage.getItem(bestKey()))||0}catch{return 0}}
const GATE_WAVES={challenge:[[3,3,2],[3,3,3],[4,3,3]],story:[[2,2,2],[2,2,2],[2,2,3]],impossible:[[5,5,6],[5,6,6],[6,6,7]]};
const ENEMY_TYPES={
 bleepling:{hp:42,speed:117,damage:13,size:21,score:12,xp:7},
 boink:{hp:60,speed:114,damage:12,size:26,score:20,xp:9},
 bocht:{hp:37,speed:133,damage:9,size:23,score:22,xp:10},
 chunkling:{hp:112,speed:78,damage:19,size:36,score:36,xp:12}
};
let best=0;try{best=Number(localStorage.getItem('rosie-survivors-best'))||0}catch{};
const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const clueSpots=[{x:730,y:660},{x:1240,y:1060},{x:1690,y:1420}];
const scenery=(()=>{let seed=9145;const r=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};return Array.from({length:450},()=>({x:r()*WIDTH,y:r()*HEIGHT,t:r(),s:10+r()*24}))})();
const SCENE_ART={"clue1":"assets/scene-clue1.webp","clue2":"assets/scene-clue2.webp","clue3":"assets/scene-clue3.webp","intro":"assets/scene-intro.webp","phase2":"assets/scene-phase2.webp","victory":"assets/scene-victory.webp","defeat":"assets/scene-defeat.webp"};
// Never generate alternate faces for the pets: scene portraits reuse the actual
// character-select images (and Tolly's existing portrait) for a consistent cast.
const SCENE_LINES={
 clue1:[['rosie','I smell banana.'],['winnifred','You have said that about every tree.'],['rosie','And one day I will be right.']],
 clue2:[['millie','BALL?'],['ellie','Millie. That is a sausage wrapper.'],['millie','...BALL SHAPED SAUSAGE?'],['winnifred','We are being watched by two suspicious puddings.']],
 clue3:[['winnifred','A final note. From the fridge guardian herself.'],['rosie','Does it say BANANA?'],['winnifred','It says: NO MORE BANANA. In three different fonts.'],['ellie','Good news. I found the laser pointer. Bad news. It found us.'],['rosie','Then we invite the humans. They LOVE running into lasers.']],
 intro:[['tolly','NO ROSIE. YOU ARE ON A DIET.'],['rosie','...I have come to negotiate the banana tax.'],['tolly','You brought a sausage sword.'],['winnifred','A very persuasive sausage sword.']],
 phase2:[['tolly','I HAVE BEEN TOO LENIENT.'],['ellie','That sounds like a cone-related sentence.'],['tolly','CONE OF SHAME: DEPLOYED.'],['rosie','I suddenly regret all of my life choices.']],
 victory:[['tolly','Fine. You may have the banana and cheese tax.'],['rosie','Excellent. Now about the birthday...'],['winnifred','The REAL quest is an invitation. How unusually civilised.']],
 defeat:[['tolly','Mwahahaha! The fridge remains mine!'],['ellie','Okay, but can we still go to the party?'],['tolly','...Obviously. This is an invitation, not an exam.']]
};
const CLUE_SCENES=[
 {kind:'clue1',title:'CLUE 1 · THE MYSTERIOUS PAWPRINTS',dialogue:'* A trail of golden pawprints snakes through the garden. Something smells suspiciously delicious.'},
 {kind:'clue2',title:'CLUE 2 · THE GREAT SAUSAGE INCIDENT',dialogue:'* A sausage wrapper rustles. Somewhere nearby, two soft, round menaces prepare to boink.'},
 {kind:'clue3',title:'CLUE 3 · THE FRIDGE PROPHECY',dialogue:'* The note reads: NO MORE BANANA. A red laser flickers. The humans may be needed after all.'}
];
function renderSceneLines(kind){
 const host=$('scene-dialogues');host.replaceChildren();host.dataset.beat='0';
 const lines=[...(SCENE_LINES[kind]||[])];
 // Character-specific ending callbacks, always with the established portraits.
 if(kind==='victory'||kind==='defeat'){
  const lead=players[0],replies={rosie:'Can we discuss the banana situation on the way to the party?',
   millie:'WAIT. THERE WILL BE BALLS AT THIS PARTY, YES?',
   winnifred:'Attendance is obligatory for distinguished floofs.',
   ellie:'I am bringing zoomies. And emotional support.'};
  if(lead)lines.push([lead.id,replies[lead.id]]);
 }host.hidden=lines.length===0;
 lines.forEach(([id,words],index)=>{
  const row=document.createElement('div');row.className='scene-line';row.hidden=index!==0;
  const avatar=document.createElement('div');avatar.className='scene-face';
  const image=document.createElement('img');
  // Reuse the canonical art mounted in character select / the boss card.
  image.src=id==='tolly'?$('boss-card').querySelector('img').src:petImages[id].src;
  image.alt=(id==='tolly'?'Tolly':roster[id].name)+' character illustration';
  avatar.append(image);
  const info=document.createElement('div');info.className='scene-speech';
  const who=document.createElement('strong');who.textContent=id==='tolly'?'TOLLY':roster[id].name.toUpperCase();
  const speech=document.createElement('span');speech.textContent='* '+words;
  info.append(who,speech);row.append(avatar,info);host.append(row);
 });
 $('scene-counter').textContent=lines.length?'1 / '+lines.length:'';
}
function advanceSceneBeat(){
 const host=$('scene-dialogues'),rows=host.querySelectorAll('.scene-line'),index=Number(host.dataset.beat||0);
 if(index>=rows.length-1)return false;
 rows[index].hidden=true;rows[index+1].hidden=false;host.dataset.beat=String(index+1);
 $('scene-counter').textContent=(index+2)+' / '+rows.length;
 $('overlay-start').textContent=index+2===rows.length?$('overlay-start').dataset.continueLabel:'▶ NEXT LINE';
 return true;
}
const slogans={explore:['SUCHT TOLLY!','THE BLEEPLINGS ARE BLEPPING!','FOR BANANA AND CHEESE!','FOLLOW THE PAWPRINTS!'],boss:['NO BANANA SHALL PASS!','FRIDGE GUARDIAN APPROACHES!','DODGE THE SNACK DEFENCES!','SAVE THE TASTY TREATS!'],danger:['THIS LOOKS RUFF!','RETREAT, REGROUP, RESNACK!','TOO MANY BLEPS!'],clues:['A SNACK SCENT APPEARS!','PAWPRINT TRAIL FOUND!','TOLLY IS NEAR…'],victory:['TREATS LIBERATED!','BANANA AND CHEESE TAX ACQUIRED!','SNACK JUSTICE PREVAILS!']};
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
  else if(kind==='laser'){playTone(880,.08,'sawtooth',.045);playTone(1160,.17,'triangle',.04,.05)}
  else if(kind==='boink'){playTone(260,.09,'sine',.045);playTone(390,.12,'sine',.035,.08)}
  else if(kind==='cone'){playTone(200,.15,'sawtooth',.06);playTone(130,.26,'square',.055,.16)}
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
 hideQuestToast();
 $('ending-invite').hidden=true;sceneName=kind;cutsceneNext=kind;phase='cutscene';keys.clear();
 $('pause').disabled=true;
 $('overlay').classList.add('cinematic');$('overlay').classList.remove('hidden');$('overlay').dataset.scene=kind;
 $('overlay-kicker').textContent=kind.startsWith('clue')?'DISCOVERY · CLUE '+kind.slice(-1)+'/3':kind==='intro'?'THE FRIDGE HAS BEEN FOUND':'PHASE TWO · CONE OF SHAME';
 $('overlay').querySelector('h3').textContent=title;
 $('overlay').querySelector('p').textContent=dialogue;
 const sceneArt=$('overlay-art');sceneArt.src=SCENE_ART[kind];sceneArt.classList.add('show');sceneArt.style.maxWidth='';
 if(kind==='clue3'){
  // Avoid upscaling the chapter-three art beyond its source pixel width.
  const limitToNative=()=>{if(sceneName==='clue3'&&sceneArt.naturalWidth)sceneArt.style.maxWidth=Math.min(680,sceneArt.naturalWidth)+'px';};
  if(sceneArt.complete)limitToNative();else sceneArt.addEventListener('load',limitToNative,{once:true});
 }
 renderSceneLines(kind);$('mission-unlock').classList.remove('show');
 $('overlay-start').dataset.continueLabel='▶ '+(kind==='intro'?'FACE TOLLY':kind==='phase2'?'CONTINUE THE BATTLE':kind==='clue2'?'FACE BOINK & BOCHT':'CONTINUE EXPLORING');
 $('overlay-start').textContent=(SCENE_LINES[kind]||[]).length>1?'▶ NEXT LINE':$('overlay-start').dataset.continueLabel;
 $('scene-skip').hidden=false;
}
// Quest wards require three short, visible guardian waves at every scroll.
function spawnGuardianWave(){
 const counts=GATE_WAVES[difficulty][gate.index];
 const count=counts[gate.wave],origin=clueSpots[gate.index];
 for(let i=0;i<count;i++){
  const kind=(i===0&&gate.wave===2)?'chunkling':(i%3===0?'boink':i%3===1?'bleepling':'bocht');
  const c=ENEMY_TYPES[kind],a=TAU*(i+.3+gate.wave*.27)/count,radius=190+(i%2)*38;
  const hp=Math.round(c.hp*(difficulty==='story'?.84:difficulty==='impossible'?1.48:1.2)*(players.length===2?1.28:1));
  foes.push({x:clamp(origin.x+Math.cos(a)*radius,30,WIDTH-30),y:clamp(origin.y+Math.sin(a)*radius,30,HEIGHT-30),
   hp,maxHp:hp,speed:c.speed*(difficulty==='story'?.9:difficulty==='impossible'?1.19:1.04),
   damage:Math.round(c.damage*mode().damage),size:c.size,attack:.85,
   kind,guardian:true,age:0,telegraph:0,charge:-1,trailTimer:0,slow:0});
 }
 gate.remainingDelay=3.3;
 say('⚠ SCROLL '+(gate.index+1)+': DEFENCE WAVE '+(gate.wave+1)+' / 3! Defeat its guardians!',3.5);
 showQuestToast('SCROLL '+(gate.index+1)+' · WAVE '+(gate.wave+1)+'/3','Defeat '+count+' guardians to unlock the story chapter.',3.5);
 playSfx('wave');
}
function beginGuardian(index){gate={index,wave:0,remainingDelay:0};spawnGuardianWave();}
function updateGuardian(dt){
 if(!gate||phase!=='explore')return;
 gate.remainingDelay=Math.max(0,gate.remainingDelay-dt);
 if(foes.some(e=>e.guardian&&e.hp>0))return;
 if(gate.remainingDelay>0)return;
 if(gate.wave<2){gate.wave++;spawnGuardianWave();return;}
 const index=gate.index;gate=null;gateCleared[index]=true;
 players.filter(p=>p.alive).forEach(p=>p.hp=Math.min(p.maxHp,p.hp+12));
 say('✨ THE SCROLL IS UNSEALED! Return to reveal the next chapter!',4);
 showQuestToast('SCROLL UNSEALED!','Visit the glowing scroll to reveal its story.',3.5);
 playSfx('clue');
}
function spawnDuo(){
 duoActive=true;duoDefeated=false;
 const pos=players.find(p=>p.alive)||players[0];
 for(const [i,kind] of ['boink','bocht'].entries()){
  const conf=ENEMY_TYPES[kind],angle=(i===0?-.8:.8);
  foes.push({x:clamp(pos.x+Math.cos(angle)*220,45,WIDTH-45),y:clamp(pos.y+Math.sin(angle)*220,45,HEIGHT-45),hp:conf.hp*3,maxHp:conf.hp*3,speed:conf.speed,damage:conf.damage,size:conf.size+8,attack:1.4,kind,elite:true,age:0,telegraph:0,charge:-1,trailTimer:0,slow:0});
 }
 say('⚠ BOINK & BOCHT! Defeat the terrible twosome to reveal the last clue!',4);
 showQuestToast('BOINK & BOCHT APPROACH!','Defeat these two to reach the last scroll.',4.3);
 playSfx('boink');
}
function continueScene(){
 if(phase!=='cutscene')return;
 if(advanceSceneBeat())return;
 const kind=cutsceneNext;
 cutsceneNext=null;keys.clear();
 phase=kind==='intro'||kind==='phase2'?'boss':'explore';
 $('overlay').classList.remove('cinematic');$('overlay').classList.add('hidden');$('scene-skip').hidden=true;
 $('scene-dialogues').hidden=true;
 $('pause').disabled=false;$('pause').textContent='Ⅱ PAUSE';
 if(kind==='intro'){
   const hp=Math.round(845*(players.length===2?1.52:1)*mode().hp);
   boss={x:fridge.x+45,y:fridge.y-80,hp,maxHp:hp,size:49,speed:difficulty==='story'?96:difficulty==='impossible'?157:137,attack:1.1};
   hazards=[];foes=foes.slice(-5);bossPhase=1;coneWarned=false;coneCooldown=6.6;coneWindup=0;bossPulseCooldown=1.65;bossPulseWindup=0;bananaWindup=0;
   $('bossbar').classList.add('show');$('boss-card').classList.add('show');
   say('⚔ TOLLY: No Rosie, you’re on a diet — no more banana!',5);playSfx('boss');awardScore(200);
   showQuestToast('FINAL BOSS · TOLLY!','Move away from the yellow shockwave and dash to safety!',4.6);
 }else if(kind==='phase2'){
   say('⚠ CONE OF SHAME PROTOCOL ACTIVATED! Watch the warning arc!',4);playSfx('phase');
   players.filter(p=>p.alive).forEach(p=>p.inv=Math.max(p.inv,1.3));
   coneCooldown=2.5;bossPulseCooldown=1.4;
   showQuestToast('PHASE TWO · CONE OF SHAME!','Avoid the red warning arc. Dash sideways!',4.5);
 }else if(kind==='clue2'){
   players.filter(p=>p.alive).forEach(p=>p.inv=Math.max(p.inv,1.2));
   spawnDuo();
 }else if(kind==='clue3'){
   players.filter(p=>p.alive).forEach(p=>p.inv=Math.max(p.inv,1.2));
   laserUnlocked=true;players.forEach(p=>p.laserCooldown=1.1);
   say('🔴 LEGENDARY LASER POINTER FOUND! Automatic beams now help clear a path!',4);playSfx('laser');
   showQuestToast('QUEST COMPLETE · FIND THE FRIDGE','Follow the compass to Tolly, Guardian of the Fridge.',4.5);
 }else{
   players.filter(p=>p.alive).forEach(p=>p.inv=Math.max(p.inv,1.2));
   say('🧭 A new golden pawprint trail appears. SUCHT!',3);
   showQuestToast('NEXT QUEST · FOLLOW THE PAWPRINTS','Follow the compass to the next glowing scroll.',4.5);
 }
 lastTime=performance.now();syncHud();
}
function say(t,duration=3){$('game-message').textContent=t;messageClock=duration}
function hideQuestToast(){questToastClock=0;$('quest-toast').hidden=true;}
function showQuestToast(title,detail,seconds=3.6){
 $('quest-toast-title').textContent=title;$('quest-toast-detail').textContent=detail;
 questToastClock=seconds;$('quest-toast').hidden=false;
}
function openBriefing(){
 const duo=$('coop').checked;
 $('briefing-team').textContent=duo?'TWO-HERO CO-OP · '+roster[selected[0]].name+' + '+roster[selected[1]].name:'SOLO RUN · '+roster[selected[0]].name;
 $('briefing-p1-name').textContent='PLAYER 1 · '+roster[selected[0]].name.toUpperCase();
 $('briefing-p2-name').textContent='PLAYER 2 · '+roster[selected[1]].name.toUpperCase();
 $('briefing-p2-card').hidden=!duo;$('briefing-solo-hint').hidden=duo;
 $('briefing-p1-move').textContent=duo?'WASD only':'WASD OR arrow keys';
 $('briefing-p1-dash-extra').hidden=duo;
 $('briefing-mode').textContent=$('difficulty').value==='story'?'STORY MODE · Gentle 4/10':$('difficulty').value==='impossible'?'IMPOSSIBLE · 10/10 · Score ×3 · Third boss phase!':'ADVENTURE MODE · Target 7/10';
 $('control-briefing').hidden=false;$('briefing-go').focus();
}
function closeBriefing(){ $('control-briefing').hidden=true; }
function player(id,num){let c=roster[id];return {...c,id,num,x:320+num*50,y:400+num*55,maxHp:c.hp,cool:rnd(0,.2),inv:0,dash:0,dashCooldown:0,healClock:1.7,healFlash:0,alive:true,reviveProgress:0,laserCooldown:1.5}}
function start(){
 $('ending-invite').hidden=true;cancelAnimationFrame(raf);
 players=[player(selected[0],0)];if($('coop').checked)players.push(player(selected[1],1));
 foes=[];shots=[];drops=[];fx=[];hazards=[];beams=[];difficulty=$('difficulty').value;gate=null;gateCleared=[false,false,false];comboCount=0;comboClock=0;hideQuestToast();duoActive=false;duoDefeated=false;laserUnlocked=false;coneCooldown=6.8;coneWindup=0;bossPulseCooldown=4;bossPulseWindup=0;bananaWindup=0;phase='explore';paused=false;boss=null;cutsceneNext=null;sceneName=null;musicStep=0;musicMode='idle';musicBar=0;musicNextBarAt=0;
 elapsed=0;score=0;kills=0;level=1;xp=0;goal=35;clues=0;fridgeVisible=false;deathPenalty=0;daan=null;daanRespawn=0;mythicArcCooldown=0;mythicArcWindup=0;best=readBest();
 spawnClock=.55;surgeClock=33;attackClock=0;hudClock=0;keys.clear();ensureAudio();
 $('scene-skip').hidden=true;$('share-result').classList.remove('show');$('mission-unlock').classList.remove('show');$('scene-dialogues').hidden=true;$('share-status').textContent='';$('overlay').classList.remove('cinematic');$('overlay').classList.add('hidden');$('pause').disabled=false;$('pause').textContent='Ⅱ PAUSE';
 $('bossbar').classList.remove('show','mythic');$('boss-card').classList.remove('show');$('overlay-art').classList.remove('show');$('scene-dialogues').hidden=true;$('overlay-kicker').textContent='ARCADE MODE';
 say('Okay '+players.map(p=>p.name).join(' & ')+'… '+(players.length===1?'SUCH TOLLY!':'SUCHT TOLLY!')+' ADVENTURE MODE!',5);
 $('controls-reminder').textContent=players.length===1?'SOLO · WASD OR ARROWS to move · SHIFT OR ENTER to dash · automatic attacks':'CO-OP · P1 WASD + SHIFT · P2 ARROWS + ENTER · automatic attacks';
 closeBriefing();
 showQuestToast('QUEST 1 · FOLLOW THE PAWPRINTS','Find the glowing scroll and defeat its three guardian waves.',5);
 $('scoring-mode').textContent=mode().label+' · score ×'+mode().multiplier+' · full wipe −'+Math.round(mode().deathLoss*100)+'%';
 syncHud();lastTime=performance.now();raf=requestAnimationFrame(loop);
 $('game-section').scrollIntoView({behavior:'smooth',block:'start'});
}
function scoreText(win){const squad=players.map(p=>p.name).join(' & ');const duration=Math.floor(elapsed/60)+':'+String(Math.floor(elapsed%60)).padStart(2,'0');return '🐾 LEVEL 32 — ROSIE SURVIVORS\n'+squad+' '+(win?'LIBERATED THE FRIDGE!':'WERE DEFEATED BY TOLLY!')+'\nScore: '+score+' | Snacklings boinked: '+kills+' | Time: '+duration+'\nCan you beat our run? 🎮\nBirthday invitation: '+new URL(inviteHref,location.href).href;}
function resetEnd(win){hideQuestToast();$('ending-invite').hidden=false;phase='ended';paused=true;$('pause').disabled=true;let title=win?'🎉 TREATS LIBERATED!':'💀 THE FRIDGE PREVAILS';let detail=win?'Okay, you deserve the banana and cheese tax.':'Mwahahaha! You are a chonk and are of no match to the mighty Tolly!';if(score>best){best=score;try{localStorage.setItem('rosie-survivors-best',String(best))}catch{}detail+=' NEW PERSONAL BEST!'}$('overlay-kicker').textContent=win?'CUTSCENE · REWARD SCREEN':'GAME OVER · FRIDGE SEALED';$('overlay').classList.add('cinematic');$('overlay').querySelector('h3').textContent=title;$('boss-card').classList.remove('show');$('overlay').dataset.scene=win?'victory':'defeat';$('scene-skip').hidden=true;$('overlay-art').style.maxWidth='';$('overlay-art').src=win?SCENE_ART.victory:SCENE_ART.defeat;$('overlay-art').classList.add('show');renderSceneLines(win?'victory':'defeat');$('scene-dialogues').querySelectorAll('.scene-line').forEach(row=>row.hidden=false);$('mission-unlock').classList.add('show');$('overlay').querySelector('p').textContent=detail+' Score: '+score+' · Snacklings boinked: '+kills+'.';$('overlay-start').textContent='↻ PLAY AGAIN';$('scene-counter').textContent='';$('share-result').classList.add('show');$('share-status').textContent='';$('overlay').classList.remove('hidden'); if(win){playSfx('victory'); say(pick(slogans.victory),3)} else {playSfx('defeat')} syncHud()}
function spawnBleepling(){
 // Bound unrelated mobs so the required guardian fights remain challenging but fair.
 if(foes.length>=(gate?24:phase==='boss'?48:65))return;
 const live=players.filter(p=>p.alive);if(!live.length)return;
 const focus=live[Math.floor(Math.random()*live.length)];
 const angle=rnd(0,TAU),radius=rnd(390,550),tier=Math.floor(elapsed/35);
 const eliteChance=Math.min(.27,.07+elapsed*.0018)+(phase==='boss'?.05:0);
 const roll=Math.random();
 const kind=roll<eliteChance?(Math.random()<.54?'boink':'bocht'):(Math.random()<.16?'chunkling':'bleepling');
 const c=ENEMY_TYPES[kind],hp=Math.round(c.hp+tier*(kind==='chunkling'?11:6));
 foes.push({x:clamp(focus.x+Math.cos(angle)*radius,35,WIDTH-35),
  y:clamp(focus.y+Math.sin(angle)*radius,35,HEIGHT-35),hp,maxHp:hp,
  speed:(c.speed+Math.min(31,elapsed*.14))*(difficulty==='impossible'?1.12:1),attack:rnd(.3,.8),size:c.size,kind,damage:Math.ceil((c.damage+Math.floor(tier*.75))*mode().damage),age:0,telegraph:0,charge:-1,trailTimer:0,slow:0});
}
function emit(text,x,y,col='#ffe1aa'){fx.push({text,x,y,col,t:1.1})}
function nearest(origin,arr,r=Infinity){let item=null,bd=r;for(const o of arr){if(o.hp<=0||o.alive===false)continue;const d=dist(origin,o);if(d<bd){bd=d;item=o}}return item}
function fire(p){const target=nearest(p,[...foes,...(boss?[boss]:[])],p.range);if(!target)return;if(p.weapon==='sausage'){for(const e of [...foes,...(boss?[boss]:[])])if(e.hp>0&&dist(p,e)<p.range){damage(e,p.damage+level*2,p);emit('⚔',e.x,e.y,'#fff0a7')}return}const angle=Math.atan2(target.y-p.y,target.x-p.x);shots.push({x:p.x,y:p.y,vx:Math.cos(angle)*410,vy:Math.sin(angle)*410,damage:p.damage+level*2,ttl:1.1,owner:p.num,kind:p.weapon,pierce:p.weapon==='dragon'?1:0,hitTargets:new Set()})}
function damage(enemy,amount,p){
 if(phase==='ended'||phase==='cutscene'||enemy.hp<=0)return;
 enemy.hp-=amount;
 if(enemy===boss&&enemy.hp>0&&!coneWarned&&enemy.hp<=enemy.maxHp*.5){
   coneWarned=true;bossPhase=2;showScene('phase2','THE CONE OF SHAME!',"Tolly has reached for the ultimate weapon. Watch the red warning arc!",[['tolly',"ARG. DON'T MAKE ME GET THE CONE OF SHAME OUT!!!"]]);return;
 }
 if(enemy.hp<=0){
  if(enemy===boss){awardScore(900);emit('FRIDGE OPEN!',enemy.x,enemy.y-50);resetEnd(true);return}
  kills++;comboCount=comboClock>0?comboCount+1:1;comboClock=3.4;
  const baseScore=ENEMY_TYPES[enemy.kind]?.score||12;
  const multiplier=1+Math.min(1.5,Math.floor((comboCount-1)/3)*.25);
  awardScore(baseScore*multiplier);
  xp+=(ENEMY_TYPES[enemy.kind]?.xp||7);
  if(comboCount===5)emit('SNACK STREAK! ×'+multiplier.toFixed(2),enemy.x,enemy.y-35,'#fff2b2');
  emit('+'+(ENEMY_TYPES[enemy.kind]?.score||12),enemy.x,enemy.y); playSfx('hit');
  if(enemy.elite&&['boink','bocht'].includes(enemy.kind)&&!foes.some(f=>f!==enemy&&f.elite&&f.hp>0)){
   duoActive=false;duoDefeated=true;awardScore(250);
   say('🎉 BOINK & BOCHT HAVE BEEN BOINKED! The last clue is revealed!',5);
   players.filter(q=>q.alive).forEach(q=>q.hp=Math.min(q.maxHp,q.hp+20));playSfx('victory');
  }
  if(Math.random()<.17&&drops.length<35)drops.push({x:enemy.x,y:enemy.y,kind:'xp',r:13});
  if(Math.random()<.052&&drops.length<35)drops.push({x:enemy.x,y:enemy.y,kind:'heal',r:15});
  if(xp>=goal){xp-=goal;level++;goal=Math.round(goal*1.42);
    players.forEach(q=>{q.damage+=2;q.maxHp+=3;q.hp=Math.min(q.maxHp,q.hp+8);q.rate=Math.max(.25,q.rate*.96)});
    say('✨ LEVEL '+level+'! Tiny upgrade. The Bleeplings keep blepping.',3); playSfx('heal');
  }
 }
}
function movePlayers(dt){
 players.forEach(p=>{
  if(!p.alive)return;
  let k=p.num===0?['a','d','w','s']:['arrowleft','arrowright','arrowup','arrowdown'];
  // Solo lets Player 1 use either WASD or arrows; co-op keeps controls independent.
  const solo=p.num===0&&players.length===1;
  let dx=Number(keys.has(k[1])||(solo&&keys.has('arrowright')))-Number(keys.has(k[0])||(solo&&keys.has('arrowleft')));
  let dy=Number(keys.has(k[3])||(solo&&keys.has('arrowdown')))-Number(keys.has(k[2])||(solo&&keys.has('arrowup')));
  let l=Math.hypot(dx,dy)||1;
  p.slowTime=Math.max(0,(p.slowTime||0)-dt);const footing=p.slowTime>0?.63:1;
  p.x=clamp(p.x+dx/l*p.speed*footing*dt*(p.dash>0?2.3:1),24,WIDTH-24);
  p.y=clamp(p.y+dy/l*p.speed*footing*dt*(p.dash>0?2.3:1),24,HEIGHT-24);
  // Player and Tolly cannot occupy the same collision space.
  if(phase==='boss'&&boss&&boss.hp>0){
   const d=dist(p,boss),minimum=boss.size+44;
   if(d<minimum){
    const a=d>.001?Math.atan2(p.y-boss.y,p.x-boss.x):(p.num===0?0:Math.PI);
    p.x=clamp(boss.x+Math.cos(a)*minimum,24,WIDTH-24);
    p.y=clamp(boss.y+Math.sin(a)*minimum,24,HEIGHT-24);
   }
  }
  p.inv=Math.max(0,p.inv-dt);p.dash=Math.max(0,p.dash-dt);
  p.dashCooldown=Math.max(0,p.dashCooldown-dt);
  p.cool-=dt;if(p.cool<=0){fire(p);p.cool=p.rate}
  p.laserCooldown-=dt;if(laserUnlocked&&p.laserCooldown<=0){laserAttack(p);p.laserCooldown=5.3}
  for(let i=drops.length-1;i>=0;i--){let d=drops[i];if(dist(p,d)<29){
    if(d.kind==='xp'){xp+=12;awardScore(5);emit('+XP',p.x,p.y,'#a9f4d1')}
    else{p.hp=Math.min(p.maxHp,p.hp+21);emit('+21 HP',p.x,p.y,'#a9ffc9');playSfx('heal')}
    drops.splice(i,1);
  }}
 });
}
// Mission Two foreshadowing: the legendary laser pointer unlocks after clue three.
function laserAttack(p){
 if(!laserUnlocked||!p.alive||phase!=='explore'&&phase!=='boss')return;
 const pool=[...foes,...(boss&&boss.hp>0?[boss]:[])].filter(e=>e.hp>0&&dist(p,e)<310);
 if(!pool.length)return;
 const target=nearest(p,pool,310);if(!target)return;
 const angle=Math.atan2(target.y-p.y,target.x-p.x);
 const x2=p.x+Math.cos(angle)*335,y2=p.y+Math.sin(angle)*335;
 beams.push({x1:p.x,y1:p.y,x2,y2,t:.28});
 let hits=0;
 for(const e of pool){
  const projection=(e.x-p.x)*Math.cos(angle)+(e.y-p.y)*Math.sin(angle);
  const sideways=Math.abs((e.x-p.x)*Math.sin(angle)-(e.y-p.y)*Math.cos(angle));
  if(projection>0&&projection<335&&sideways<e.size+11){damage(e,32+level*2,p);hits++;}
  if(phase==='ended'||phase==='cutscene'||hits>=5)break;
 }
 emit('🔴 LASER!',p.x,p.y-43,'#ffe3a3');playSfx('laser');
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
  awardScore(150);emit('💚 REVIVED!',down.x,down.y-36,'#a7ffe2');
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
 if(questToastClock>0){questToastClock-=dt;if(questToastClock<=0)hideQuestToast();}
 if(comboClock>0){comboClock-=dt;if(comboClock<=0)comboCount=0;}
 if(messageClock<=0){$('game-message').textContent=phase==='explore'?'🫧 THE GREAT SNACK RIFT · Track the golden clues!':'⚠ BOSS RUSH · Dodge Tolly’s banana barrage!';messageClock=999}
 sloganClock-=dt;
 if(sloganClock<=0){ if(players.some(p=>p.alive&&p.hp/p.maxHp<.33)) shout(slogans.danger,2.2); else shout(phase==='boss'?slogans.boss:slogans.explore,2.2); sloganClock=phase==='boss'?6.5:8.5; }
 movePlayers(dt);
 if(phase==='ended'||phase==='cutscene')return;
 updateRevives(dt);
 updateEllieAuras(dt);
 spawnClock-=dt;
 if(spawnClock<=0&&foes.length<(gate?23:duoActive?20:phase==='boss'?48:62)){
   const n=gate?1:duoActive?1:phase==='boss'?(difficulty==='story'?1:difficulty==='impossible'?3:2):elapsed>75?3:elapsed>18?2:1;
   for(let j=0;j<n&&foes.length<65;j++)spawnBleepling();
   spawnClock=Math.max(.42,.93-elapsed*.0035)*mode().spawn*(gate?1.5:1)*(phase==='boss'?.9:1);
 }
 surgeClock-=dt;
 if(surgeClock<=0&&!duoActive&&!gate&&foes.length<60){
    let n=phase==='boss'?7:5;
    for(let j=0;j<n&&foes.length<65;j++)spawnBleepling();
    say('🫧 BLEEPLING STAMPEDE! '+n+' extra bleps!',3.5); playSfx('wave');
    surgeClock=Math.max(23,34-elapsed*.022);
 }
 for(let i=shots.length-1;i>=0;i--){
   let s=shots[i];s.x+=s.vx*dt;s.y+=s.vy*dt;s.ttl-=dt;
   if(s.ttl<=0){shots.splice(i,1);continue}
   for(const target of [...foes,...(boss?[boss]:[])]){
     if(target.hp>0&&!s.hitTargets.has(target)&&dist(s,target)<(target.size||41)+9){
       s.hitTargets.add(target);damage(target,s.damage,players[s.owner]);
       if(s.kind==='kong'){target.slow=Math.max(target.slow||0,2.0);emit('❄ SLOW',target.x,target.y-30,'#a9ecff')}
       if(s.kind==='ball'&&s.hitTargets.size===1){s.damage*=.65;s.x+=s.vx*.06;s.y+=s.vy*.06}
       else if(s.pierce>0){s.pierce--;s.x+=s.vx*.05;s.y+=s.vy*.05}
       else {shots.splice(i,1);break}
       if(phase==='cutscene'||phase==='ended')break;
     }
   }
 }
 if(phase==='ended'||phase==='cutscene')return; // stop all combat during illustrated scenes
 for(const beam of beams)beam.t-=dt;beams=beams.filter(b=>b.t>0);
 foes=foes.filter(e=>e.hp>0);
 for(const e of foes){
    const p=nearest(e,players,Infinity);if(!p)continue;
    e.age=(e.age||0)+dt;e.slow=Math.max(0,(e.slow||0)-dt);
    const baseAngle=Math.atan2(p.y-e.y,p.x-e.x),d=dist(e,p);
    const pace=e.slow>0?.62:1;
    let angle=baseAngle;
    if(e.kind==='bocht')angle+=Math.sin(e.age*4.9+(e.elite?1.2:0))*0.78;
    if(e.kind==='boink'){
      e.telegraph=Math.max(0,(e.telegraph||0)-dt);
      if(e.telegraph===0 && e.charge<=0 && e.age>1.2 && d<175 && e.attack<=0){
        e.telegraph=.72;e.charge=0;e.attack=3.2;
      }
      if(e.telegraph===0&&e.charge===0){e.charge=.32;playSfx('boink')}
    }
    const boost=e.kind==='boink'&&e.charge>0?2.8:1;
    if(d>e.size+15){e.x=clamp(e.x+Math.cos(angle)*e.speed*pace*boost*dt,24,WIDTH-24);e.y=clamp(e.y+Math.sin(angle)*e.speed*pace*boost*dt,24,HEIGHT-24)}
    if(e.kind==='boink'&&e.charge>0){e.charge-=dt;if(e.charge<=0)e.charge=-1;}
    if(e.kind==='bocht'){
      e.trailTimer=(e.trailTimer||0)-dt;
      if(e.trailTimer<=0&&d<320&&hazards.filter(h=>h.kind==='goop').length<55){hazards.push({kind:'goop',x:e.x,y:e.y,ttl:1.5,damage:0,size:22});e.trailTimer=.58}
    }
    e.attack=Math.max(0,e.attack-dt);
    if(d<e.size+24&&(e.attack<=0||(e.kind==='boink'&&e.charge>0))&&p.inv<=0){
       p.hp=Math.max(0,p.hp-(p.id==='winnifred'?Math.ceil(e.damage*.78):e.damage));p.inv=.6;e.attack=e.kind==='boink'?2.4:1.0; if(e.kind==='boink')e.charge=-1;
       if(e.kind==='boink'){
         const pushX=Math.cos(baseAngle)*65,pushY=Math.sin(baseAngle)*65;
         p.x=clamp(p.x+pushX,24,WIDTH-24);p.y=clamp(p.y+pushY,24,HEIGHT-24);
         emit('BOINK!',p.x,p.y-38,'#fff0ba');playSfx('boink');
       } else emit('-'+e.damage,p.x,p.y-20,'#ffa4ae');
       if(p.hp<=0){p.alive=false;p.reviveProgress=0;say('💚 '+p.name+' is down! Stand over them for 1.85 seconds to revive!',4)}
    }
 }
 if(players.every(p=>!p.alive)){resetEnd(false);return}
 updateGuardian(dt);
 if(phase==='explore'){
   const i=clues;
   if(i<3&&!duoActive&&(i!==2||duoDefeated)){
    const spot=clueSpots[i];
    if(players.some(p=>p.alive&&dist(p,spot)<68)){
     if(!gateCleared[i]){
      if(!gate)beginGuardian(i);
      return;
     }
     clues++;awardScore(100);playSfx('clue');gate=null;
     const scene=CLUE_SCENES[clues-1];
     showScene(scene.kind,scene.title,scene.dialogue);
     return;
    }
   }
   if(clues>=3){
      fridgeVisible=true;
      if(players.some(p=>p.alive&&dist(p,fridge)<100)){
        showScene('intro','TOLLY · GUARDIAN OF THE FRIDGE',
          'The fridge is sealed. Tolly has armed the snack defences and refuses to share!',[['tolly','No Rosie, you’re on a diet — no more banana.'],['rosie','But… the banana and cheese tax!']]);
        return;
      }
   }
 }
 if(phase==='boss'&&boss&&boss.hp>0){
   bossPulseCooldown-=dt;
    if(bossPulseWindup>0){
      bossPulseWindup-=dt;
      if(bossPulseWindup<=0){
        for(const q of players.filter(p=>p.alive&&dist(p,boss)<150)){
          const a=Math.atan2(q.y-boss.y,q.x-boss.x);
          q.x=clamp(q.x+Math.cos(a)*110,24,WIDTH-24);q.y=clamp(q.y+Math.sin(a)*110,24,HEIGHT-24);
          if(q.inv<=0){const amount=Math.round((q.id==='winnifred'?18:bossPhase>=2?29:23)*mode().damage);
            q.hp=Math.max(0,q.hp-amount);q.inv=.95;if(q.hp===0)q.alive=false;
            emit('FRIDGE REJECTION -'+amount,q.x,q.y-36,'#fff2ad');}
          else emit('SHOO!',q.x,q.y-34,'#fff2ad');
        }
        playSfx('cone');
      }
    }else if(bossPulseCooldown<=0&&players.some(p=>p.alive&&dist(p,boss)<175)){
      bossPulseWindup=1.05;bossPulseCooldown=bossPhase===2?2.65:3.35;
      say('⚠ TOLLY: NO CAMPING ON THE FRIDGE! MOVE OUT OF THE GOLD RING!',2.2);
    }
    boss.attack-=dt;
   const p=nearest(boss,players);
   if(p){
     if(coneWarned){
       if(coneWindup>0){
         coneWindup-=dt;
         if(coneWindup<=0){
           for(const q of players){
             if(!q.alive||q.inv>0||dist(q,boss)>275)continue;
             const direction=Math.atan2(q.y-boss.y,q.x-boss.x);
             const diff=Math.atan2(Math.sin(direction-coneAngle),Math.cos(direction-coneAngle));
             if(Math.abs(diff)<.65){q.hp=Math.max(0,q.hp-24);q.inv=.95;emit('CONE SWEEP -24',q.x,q.y-36,'#ffbeca');if(q.hp===0)q.alive=false;}
           }
           playSfx('cone');say('⚠ CONE SWEEP! Duck and dodge!',1.8);
         }
       }else{
         coneCooldown-=dt;
         if(coneCooldown<=0){coneAngle=Math.atan2(p.y-boss.y,p.x-boss.x);coneWindup=1.4;coneCooldown=8.1;say('🔺 CONE OF SHAME! Dodge sideways!',1.35);playSfx('phase')}
       }
     }
     const a=Math.atan2(p.y-boss.y,p.x-boss.x),d=dist(p,boss);
     if(d>108){boss.x+=Math.cos(a)*boss.speed*dt;boss.y+=Math.sin(a)*boss.speed*dt}
     // The illustrated cone cutscene triggers precisely when HP crosses 50% (in damage()).
     if(bananaWindup>0){
      bananaWindup-=dt;
      if(bananaWindup<=0){
       bananaWindup=0;
       boss.attack=boss.hp<boss.maxHp*.5?1.22:1.53;
       const frenzy=boss.hp<boss.maxHp*.5;
       // Tolly sends warning-colored banana projectiles out from the fridge shrine.
       const count=frenzy?10:7,base=Math.atan2(p.y-boss.y,p.x-boss.x);
       for(let j=0;j<count;j++){
         const dir=base+(j-(count-1)/2)*(.20);
         const speed=frenzy?198:176;
         hazards.push({x:boss.x+Math.cos(dir)*30,y:boss.y+Math.sin(dir)*30,
            vx:Math.cos(dir)*speed,vy:Math.sin(dir)*speed,ttl:3.3,damage:Math.ceil((frenzy?20:17)*mode().damage)});
       }
       for(const q of players){
         if(q.alive&&dist(q,boss)<110&&q.inv<=0){
           q.hp=Math.max(0,q.hp-Math.ceil((frenzy?25:19)*mode().damage));q.inv=.56;
           emit('BANANA BLAST',q.x,q.y-18,'#ffe8a0');
           if(q.hp===0)q.alive=false; else playSfx('special');
         }
       }
       for(let j=0;j<(frenzy?3:2);j++)spawnBleepling();
       playSfx('special');
       if(frenzy&&Math.random()<.55)emit('🍌 NO MORE BANANA!',boss.x,boss.y-86,'#ffe6ae');
      }
     }else if(boss.attack<=0){
      bananaWindup=.72;
      say('⚠ TOLLY IS CHARGING A BANANA BURST! STEP BACK!',1.25);
     }
   }
   $('bossfill').style.width=100*clamp(boss.hp/boss.maxHp,0,1)+'%';
 }
 for(let i=hazards.length-1;i>=0;i--){
    const h=hazards[i];if(h.kind!=='goop'){h.x+=h.vx*dt;h.y+=h.vy*dt;}h.ttl-=dt;
    if(h.ttl<=0){hazards.splice(i,1);continue}
    let struck=false;
    for(const p of players){
      if(p.alive&&p.inv<=0&&dist(h,p)<(h.size||30)){
        if(h.kind==='goop'){p.slowTime=Math.max(p.slowTime||0,1.3);struck=false;break;}
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
 if(duoActive){const d=foes.find(f=>f.elite&&f.hp>0);return d?{x:d.x,y:d.y,name:'BOINK & BOCHT',hint:'Defeat the terrible twosome to unlock the final scroll!'}:null;}
 if(gate){const remaining=foes.filter(e=>e.guardian&&e.hp>0).length;
  return {...clueSpots[gate.index],name:'SCROLL '+(gate.index+1)+' · WAVE '+(gate.wave+1)+'/3',
   hint:remaining?'Defeat '+remaining+' scroll guardian'+(remaining===1?'':'s')+'!':'Next wave incoming — stay alert!'};
 }
 if(clues<3)return {...clueSpots[clues],name:'CLUE '+(clues+1)+' / 3',hint:gateCleared[clues]?'The ward is broken! Return and read the scroll.':['Reach the first guarded scroll','Find the defended sausage clue','Face the final scroll guardians'][clues]};
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
 txt(duoActive?'🫧':clues<3?'📜':'❄',x,y+37,19,'center','#ffe9b4');
}
function syncHud(){updateObjective();let h='';for(const p of players){h+='<p><strong>P'+(p.num+1)+' '+p.name+'</strong> · '+Math.ceil(p.hp)+' / '+p.maxHp+' HP'+(p.id==='ellie'?' · 💚 Lick Aura':'')+'</p><div class="meter"><span style="width:'+100*clamp(p.hp/p.maxHp,0,1)+'%"></span></div>'}$('playerhud').innerHTML=h||'Choose your heroes!';const wardProgress=gate?'<div class="missionline">⚔ SCROLL '+(gate.index+1)+' · WAVE '+(gate.wave+1)+'/3 · '+foes.filter(e=>e.guardian&&e.hp>0).length+' guardians remain</div>':'';
 $('combo-status').textContent=comboCount>=3&&comboClock>0?'🔥 SNACK STREAK · '+comboCount+' hits · '+(1+Math.min(1.5,Math.floor((comboCount-1)/3)*.25)).toFixed(2)+'× score':'Snack combo · Defeat enemies quickly for bonus points';
 $('missions').innerHTML=wardProgress+'<div class="missionline '+(clues>=1?'done':'')+'">'+(clues>=1?'✓':'○')+' Find the first scroll</div><div class="missionline '+(clues>=2?'done':'')+'">'+(clues>=2?'✓':'○')+' Discover the sausage clue</div><div class="missionline '+(clues>=3?'done':'')+'">'+(clues>=3?'✓':'○')+' Reveal the fridge shrine</div><div class="missionline '+(phase==='boss'||phase==='ended'?'done':'')+'">'+(phase==='boss'||phase==='ended'?'✓':'○')+' Find Tolly</div><div class="missionline '+(phase==='ended'&&boss&&boss.hp<=0?'done':'')+'">'+(phase==='ended'&&boss&&boss.hp<=0?'✓':'○')+' Free the tasty treats & reveal Mission Two</div>';$('scoreline').textContent='Score: '+score+' · Level: '+level;$('timerline').textContent='Time: '+Math.floor(elapsed/60)+':'+String(Math.floor(elapsed%60)).padStart(2,'0')+' · Snacklings boinked: '+kills;$('bestline').textContent='Personal best: '+(best||'—')}
function rect(x,y,w,h,col){cx.fillStyle=col;cx.fillRect(x,y,w,h)}function circle(x,y,r,col){cx.fillStyle=col;cx.beginPath();cx.arc(x,y,r,0,TAU);cx.fill()}function line(x1,y1,x2,y2,col,width=2){cx.strokeStyle=col;cx.lineWidth=width;cx.beginPath();cx.moveTo(x1,y1);cx.lineTo(x2,y2);cx.stroke()}
// RuneScape-inspired overhead combat HP: green active health against dark-red lost HP.
function drawOverheadHp(x,y,hp,maxHp,width=67){
 if(!maxHp||maxHp<=0)return;
 const ratio=clamp(hp/maxHp,0,1),w=Math.round(width),h=9,left=Math.round(x-w/2),top=Math.round(y);
 const fill=ratio>.55?'#5de48d':ratio>.25?'#ffd26a':'#f86d72';
 cx.save();
 cx.shadowColor='#000b';cx.shadowBlur=4;
 rect(left-2,top-2,w+4,h+4,'#161e2b');
 cx.shadowBlur=0;
 rect(left,top,w,h,'#823747');
 if(ratio>0)rect(left+1,top+1,Math.max(1,Math.round((w-2)*ratio)),h-2,fill);
 cx.strokeStyle='#f4e9c4';cx.lineWidth=1;cx.strokeRect(left-.5,top-.5,w+1,h+1);
 cx.restore();
}
function hasOverheadEnemyHp(e){return e.elite||e.kind==='boink'||e.kind==='bocht'||e.kind==='chunkling'}
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
if(phase==='explore'&&clues<3&&!duoActive&&(clues!==2||duoDefeated)){const s=clueSpots[clues];const glow=1+0.16*Math.sin(elapsed*4);circle(s.x,s.y,35*glow,'#ffdf7d49');circle(s.x,s.y,20,'#fff0b8');txt('📜',s.x,s.y+12,28,'center')}
if(clues>=3){txt('❄️',fridge.x,fridge.y-103,36,'center');circle(fridge.x,fridge.y-140,12,'#f7e6a8')}
// items
for(const d of drops){txt(d.kind==='xp'?'✨':'🍫',d.x,d.y+8,22,'center')}
// The Bleepling Menace: original pastel silhouettes, easily distinguishable at game speed.
for(const e of foes){
 const bob=Math.sin(elapsed*(e.kind==='boink'?9:4)+(e.age||0)*3)*3;
 cx.save();cx.translate(e.x,e.y+bob);
 circle(0,e.size*.95,e.size*.84,'#2e465077');
 if(e.kind==='bocht'){
   cx.beginPath();cx.moveTo(-e.size*.5,-e.size*.2);cx.bezierCurveTo(-e.size*1.4,-e.size*1.2,e.size*.4,-e.size*1.8,e.size*.8,-e.size*.1);cx.bezierCurveTo(e.size*1.3,e.size*.8,-e.size*.8,e.size*1.4,-e.size*.5,-e.size*.2);cx.fillStyle='#81d6e5';cx.fill();
   circle(0,0,e.size*.64,'#9debf0');
 }else{
   const color=e.kind==='boink'?'#ffad79':e.kind==='chunkling'?'#c6a2ec':'#b7a0ed';
   circle(0,0,e.size,color);circle(-e.size*.28,-e.size*.3,e.size*.43,'#ffffff4c');
   if(e.kind==='boink'){circle(-e.size*.5,-e.size*.7,7,'#f7bf9e');circle(e.size*.5,-e.size*.7,7,'#f7bf9e')}
   if(e.kind==='chunkling'){circle(-e.size*.53,e.size*.72,7,'#9e83c0');circle(e.size*.53,e.size*.72,7,'#9e83c0')}
 }
 circle(-e.size*.28,-e.size*.13,5,'#232333');circle(e.size*.27,-e.size*.13,5,'#232333');
 circle(-e.size*.3,-e.size*.15,1.5,'white');circle(e.size*.25,-e.size*.15,1.5,'white');
 cx.beginPath();cx.arc(0,e.size*.2,e.size*.16,0,Math.PI);cx.strokeStyle='#70415d';cx.lineWidth=2;cx.stroke();
 if(e.kind==='bleepling')txt('♥',0,e.size*.45,12,'center','#fa89b6');
 if(e.kind==='boink'&&e.telegraph>0){cx.beginPath();cx.arc(0,0,e.size+12,0,TAU);cx.strokeStyle='#ffe197';cx.lineWidth=5;cx.setLineDash([6,6]);cx.stroke();cx.setLineDash([]);txt('BOINK!',0,-e.size-22,14,'center','#ffe6a7')}
 if(e.kind==='bocht'){cx.beginPath();cx.arc(0,0,e.size+5,0,TAU);cx.strokeStyle='#b4f3fa';cx.lineWidth=2;cx.stroke()}
 if(e.slow>0){cx.beginPath();cx.arc(0,0,e.size+8,0,TAU);cx.strokeStyle='#a7edff';cx.lineWidth=4;cx.stroke()}
 if(hasOverheadEnemyHp(e)){
  drawOverheadHp(0,-e.size-(e.elite?52:28),e.hp,e.maxHp,e.elite?78:65);
  if(e.elite)txt('⚠ '+e.kind.toUpperCase(),0,-e.size-29,15,'center','#fff2ac');
 }
 cx.restore();
}
// birthday boss
if(boss&&boss.hp>0){
 circle(boss.x,boss.y+23,57,'#402f3a99');circle(boss.x,boss.y,52,'#e4b9bd');
 const portrait=$('boss-card').querySelector('img');
 if(portrait.complete&&portrait.naturalWidth){
   const crop=Math.min(portrait.naturalWidth,portrait.naturalHeight);
   cx.save();cx.beginPath();cx.arc(boss.x,boss.y,46,0,TAU);cx.clip();
   cx.drawImage(portrait,(portrait.naturalWidth-crop)/2,(portrait.naturalHeight-crop)/2,crop,crop,boss.x-48,boss.y-48,96,96);cx.restore();
 }else txt('🧑',boss.x,boss.y+21,52,'center');
 cx.save();cx.strokeStyle=bossPhase===2?'#ff959c':'#f8dea4';cx.lineWidth=5;cx.beginPath();cx.arc(boss.x,boss.y,49,0,TAU);cx.stroke();cx.restore();
 txt('👑',boss.x,boss.y-41,34,'center');
 txt('TOLLY · NO MORE BANANA',boss.x,boss.y-71,15,'center','#fff5ca');
 drawOverheadHp(boss.x,boss.y-99,boss.hp,boss.maxHp,126);
 if(bananaWindup>0){
  cx.save();cx.strokeStyle='#ffa94f';cx.fillStyle='#ffb45122';cx.lineWidth=4;
  cx.beginPath();cx.arc(boss.x,boss.y,115,0,TAU);cx.fill();cx.stroke();cx.restore();
  txt('⚠ BANANA BURST!',boss.x,boss.y+135,19,'center','#fff1bd');
 }
 if(bossPulseWindup>0){
  cx.save();cx.setLineDash([14,9]);cx.lineWidth=6;cx.strokeStyle='#ffe9a0';cx.fillStyle='#ffc67344';
  cx.beginPath();cx.arc(boss.x,boss.y,150,0,TAU);cx.fill();cx.stroke();cx.restore();
  txt('⚠ MOVE AWAY!',boss.x,boss.y-164,21,'center','#fff8c8');
 }
}
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
 if(!p.alive){circle(p.x,p.y,23,'#4c5968');txt('💤',p.x,p.y+11,26,'center');txt('REVIVE P'+(p.num+1),p.x,p.y-32,16,'center','#fff4cd');drawOverheadHp(p.x,p.y-57,0,p.maxHp,65);cx.beginPath();cx.arc(p.x,p.y,30,-Math.PI/2,-Math.PI/2+TAU*(p.reviveProgress||0)/reviveSeconds);cx.strokeStyle='#9cffcb';cx.lineWidth=5;cx.stroke();continue}
 // The HP bar remains visible on invulnerability flashing frames.
 drawOverheadHp(p.x,p.y-56,p.hp,p.maxHp,66);
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
 txt('P'+(p.num+1),p.x,p.y-36,15,'center',p.num===0?'#a6ffe1':'#ffc7c3');
}
for(const s of shots){txt(s.kind==='dragon'?'🐉':s.kind==='kong'?'🧊':'🔴',s.x,s.y+9,24,'center')}
for(const h of hazards){if(h.kind==='goop'){circle(h.x,h.y,22,'#88e5e977');circle(h.x,h.y,13,'#b0f6ff99')}else{circle(h.x,h.y,17,'#ffbd6144');txt('🍌',h.x,h.y+9,25,'center')}}
if(boss&&boss.hp>0&&coneWindup>0){cx.save();cx.beginPath();cx.moveTo(boss.x,boss.y);cx.arc(boss.x,boss.y,275,coneAngle-.65,coneAngle+.65);cx.closePath();cx.fillStyle='#ff69735d';cx.fill();cx.strokeStyle='#ffeeb1';cx.lineWidth=5;cx.stroke();cx.restore()}
for(const beam of beams){cx.save();cx.globalAlpha=Math.max(.1,beam.t/.28);cx.strokeStyle='#ff586a';cx.lineWidth=13;cx.shadowColor='#ff7373';cx.shadowBlur=17;cx.beginPath();cx.moveTo(beam.x1,beam.y1);cx.lineTo(beam.x2,beam.y2);cx.stroke();cx.strokeStyle='#fff2b5';cx.lineWidth=4;cx.stroke();cx.restore()}
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
function render(){let live=players.filter(p=>p.alive);let center=live.length?{x:live.reduce((a,p)=>a+p.x,0)/live.length,y:live.reduce((a,p)=>a+p.y,0)/live.length}:{x:400,y:400};cam.x=clamp(center.x-VIEWW/2,0,WIDTH-VIEWW);cam.y=clamp(center.y-VIEWH/2,0,HEIGHT-VIEWH);world();drawObjectiveMarker();drawOffscreenArrows();rect(0,0,VIEWW,42,'#1a273ac9');txt('🌸 SAKURA GARDEN · '+(phase==='boss'?'FRIDGE DEFENCE':'THE GREAT SNACK RIFT'),15,28,18);txt('🐾 '+kills+'  ✨ LV '+level+'  🧾 '+clues+'/3  '+(difficulty==='story'?'🌼 STORY':difficulty==='impossible'?'💠 IMPOSSIBLE':'⚔ ADVENTURE'),VIEWW-17,28,17,'right');let dx=fridge.x-center.x,dy=fridge.y-center.y;if(clues>=3&&phase==='explore')txt('🧭 FRIDGE '+Math.round(Math.hypot(dx,dy))+'m',VIEWW/2,28,17,'center','#ffe6a4')}
function loop(now){let dt=Math.min(.045,(now-lastTime)/1000||.016);lastTime=now;if(!paused&&phase!=='ended'&&phase!=='cutscene')update(dt);render();if(phase!=='ended')raf=requestAnimationFrame(loop)}
function togglePause(){if(phase==='idle'||phase==='ended'||phase==='cutscene')return;paused=!paused;$('pause').textContent=paused?'▶ RESUME':'Ⅱ PAUSE';if(!paused){lastTime=performance.now();raf=requestAnimationFrame(loop)}else cancelAnimationFrame(raf);$('game-message').textContent=paused?'PAUSED':'QUEST RESUMED'}
const inviteHref=location.pathname.includes('/game/')?'invitation.html':'game/invitation.html';
document.querySelectorAll('[data-invitation-link]').forEach(link=>link.setAttribute('href',inviteHref));
$('scene-skip').addEventListener('click',()=>{
 if(phase!=='cutscene')return;
 $('scene-dialogues').dataset.beat=String($('scene-dialogues').querySelectorAll('.scene-line').length-1);
 continueScene();
});
$('share-result').addEventListener('click',async()=>{
 if(phase!=='ended')return;
 const text=scoreText(Boolean(boss&&boss.hp<=0));
 try{await navigator.clipboard.writeText(text);$('share-status').textContent='Copied! Paste it into our WhatsApp group.';}
 catch{$('share-status').textContent='Copy blocked by this browser. Take a screenshot of your score instead.';}
});
$('start').addEventListener('click',openBriefing);
$('briefing-back').addEventListener('click',()=>{closeBriefing();$('start').focus()});
$('briefing-go').addEventListener('click',start);
$('overlay-start').addEventListener('click',()=>{if(phase==='cutscene')continueScene();else if(phase==='idle')openBriefing();else start()});
$('restart').addEventListener('click',openBriefing);$('pause').addEventListener('click',togglePause);$('mute').addEventListener('click',()=>{audioEnabled=!audioEnabled; if(audioCtx){audioEnabled?audioCtx.resume():audioCtx.suspend()} $('mute').textContent=audioEnabled?'🔊 MUSIC + SFX':'🔇 SOUND OFF'; if(audioEnabled) ensureAudio();});
function tryDash(id){
 if(!['boss','explore'].includes(phase)||paused||!$('control-briefing').hidden)return;
 if(id===1&&players.length===1)id=0;
 const p=players[id];if(!p||!p.alive||p.dashCooldown>0)return;
 p.dash=.18;p.dashCooldown=p.id==='ellie'?2.2:3.4;p.inv=Math.max(p.inv,.18);playSfx('dash');
}
window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();
 if(!$('control-briefing').hidden){if(k==='escape'){closeBriefing();$('start').focus();e.preventDefault()}return;}
 if(['arrowup','arrowleft','arrowright','arrowdown',' '].includes(k))e.preventDefault();
 if(k==='shift'||k==='enter')tryDash(k==='shift'?0:1);
 if(k==='escape')togglePause();keys.add(k);
});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());
for(const b of document.querySelectorAll('[data-dash]'))b.addEventListener('pointerdown',e=>{e.preventDefault();tryDash(Number(b.dataset.dash));});
 for(const b of document.querySelectorAll('[data-k]')){const k=b.dataset.k;b.addEventListener('pointerdown',e=>{e.preventDefault();keys.add(k);b.setPointerCapture(e.pointerId)});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>keys.delete(k))}
// idle garden behind the opening card
players=[player('rosie',0),player('winnifred',1)];render();syncHud();
})();