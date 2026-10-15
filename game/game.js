
(()=>{'use strict';
const $=id=>document.getElementById(id), canvas=$('game'),cx=canvas.getContext('2d');
const WIDTH=2600,HEIGHT=1900, VIEWW=960,VIEWH=600, TAU=Math.PI*2, keys=new Set();
// THE GREAT SNACK RIFT: original, friendly-looking blob enemies with readable combat tells.
// No server or shared scores required; all audio is original WebAudio synthesis.
const petImages=Object.fromEntries(Array.from(document.querySelectorAll('#heroes .hero'),el=>[el.dataset.hero,el.querySelector('.portrait img')]));
const roster={rosie:{name:'Rosie',emoji:'🐕‍🦺',color:'#222a36',hp:130,speed:220,range:225,rate:.56,damage:17,weapon:'dragon'},millie:{name:'Millie',emoji:'🐕',color:'#31323d',hp:135,speed:205,range:220,rate:.56,damage:18,weapon:'ball'},winnifred:{name:'Winnifred',emoji:'🐈',color:'#e4d4bc',hp:128,speed:240,range:96,rate:.34,damage:30,weapon:'sausage'},ellie:{name:'Ellie',emoji:'🐶',color:'#121823',hp:150,speed:250,range:175,rate:.92,damage:8,weapon:'kong',auraRadius:135,healPulse:2.7,selfRegen:1.4}};
let selected=['rosie','winnifred'],players=[],foes=[],shots=[],drops=[],fx=[],hazards=[],boss=null,phase='idle',paused=false,score=0,kills=0,level=1,xp=0,goal=35,spawnClock=0,surgeClock=33,elapsed=0,clues=0,fridgeVisible=false,fridge={x:2180,y:1440},cam={x:0,y:0},lastTime=0,raf=0,messageClock=0,attackClock=0,heldTouch={},joystickAxes=[{x:0,y:0},{x:0,y:0}],audioCtx=null,audioEnabled=true,musicTimer=null,musicStep=0,musicMode='idle',musicBar=0,musicNextBarAt=0,sloganClock=8,bossPhase=1,coneWarned=false;
let cutsceneNext=null,sceneName=null,reviveSeconds=1.85,hudClock=0,sceneOpenedAt=0,perkOffer=null,perkReturnPhase='explore',scenePresentationToken=0,perksAwarded=0;
let liteFx=typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches;
let duoActive=false,duoDefeated=false,laserUnlocked=false,beams=[],coneCooldown=6.8,coneWindup=0,coneAngle=0,bossPulseCooldown=4,bossPulseWindup=0,bananaWindup=0;
let gate=null,gateCleared=[false,false,false],difficulty='challenge',daanActive=false,daanPulse=0,daanActionTimer=0;
const GATE_WAVES={challenge:[[3,3,2],[3,3,3],[4,3,3]],story:[[2,2,2],[2,2,2],[2,2,3]],extreme:[[5,5,5],[6,5,6],[6,7,7]]};
const daanPortrait=new Image();daanPortrait.src='assets/daan.svg';
// Day 4 uses a distinct static art asset, never a chibi sprite. The graphic is a
// clearly labeled interim insignia pending approval of Daan's actual likeness.
const EXTREME={guardianHp:1.65,guardianSpeed:1.17,guardianDamage:1.28,ambientDamage:1.35,bossHp:1.65,bossSpeed:1.22};
// Threat knobs keep level one through five accessible across all four heroes.
const DIFFICULTY_BALANCE={
 story:{startingHealth:1.25,guardianHp:.67,guardianSpeed:.83,guardianDamage:.52,
  mobDamage:.55,ambientInterval:2.45,ambientCap:12,earlySpawnGrace:6},
 challenge:{startingHealth:1,guardianHp:1.2,guardianSpeed:1.04,guardianDamage:1,
  mobDamage:1,ambientInterval:1,ambientCap:62,earlySpawnGrace:0},
 extreme:{startingHealth:1,guardianHp:EXTREME.guardianHp,guardianSpeed:EXTREME.guardianSpeed,
  guardianDamage:EXTREME.guardianDamage,mobDamage:EXTREME.ambientDamage,
  ambientInterval:.78,ambientCap:62,earlySpawnGrace:0}
};
const difficultyBalance=()=>DIFFICULTY_BALANCE[difficulty];
const ENEMY_TYPES={
 bleepling:{hp:42,speed:117,damage:13,size:21,score:12,xp:7},
 boink:{hp:60,speed:114,damage:12,size:26,score:20,xp:9},
 bocht:{hp:37,speed:133,damage:9,size:23,score:22,xp:10},
 chunkling:{hp:112,speed:78,damage:19,size:36,score:36,xp:12}
};
let best=0;try{best=Number(localStorage.getItem('rosie-survivors-best'))||0}catch{};
const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const clueSpots=[{x:730,y:660},{x:1240,y:1060},{x:1690,y:1420}];
const scentTrail=[{x:440,y:500},{x:550,y:570},{x:660,y:620}];let scentStep=0;
// Final quest: three timed laser terminals, not another wave-defense encounter.
// A player can complete each terminal during its bright green safe window.
const laserNodes=[{x:1450,y:1210},{x:1555,y:1320},{x:1680,y:1435}];
let laserChallenge={index:0,timer:0,zapCooldown:0};
const laserSafe=()=>laserChallenge.timer%3.5>=1.55;
const scenery=(()=>{let seed=9145;const r=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};return Array.from({length:450},()=>({x:r()*WIDTH,y:r()*HEIGHT,t:r(),s:10+r()*24}))})();
const SCENE_ART={"clue1":"assets/scene-clue1.webp","clue2":"assets/scene-clue2.webp","clue3":"assets/scene-clue3.webp","intro":"assets/scene-intro.webp","phase2":"assets/scene-phase2.webp","phase3":"assets/scene-phase2.webp","victory":"assets/scene-victory.webp","defeat":"assets/scene-defeat.webp"};
// Decode art before revealing the overlay: avoid one-frame stale backgrounds.
const sceneArtCache=Object.fromEntries(Object.entries(SCENE_ART).map(([key,url])=>{
 const img=new Image();img.src=url;return [key,img];
}));
function presentSceneArt(kind,token){
 const art=$('overlay-art'),img=sceneArtCache[kind];
 const reveal=()=>{
  if(token!==scenePresentationToken||phase!=='cutscene'||sceneName!==kind)return;
  art.src=img?.src||SCENE_ART[kind];
  art.classList.remove('scene-art-pending');
  $('overlay').classList.remove('hidden');
 };
 if(img?.complete&&img.naturalWidth){reveal();return}
 if(img?.decode)img.decode().then(reveal).catch(reveal);
 else if(img){img.addEventListener('load',reveal,{once:true});img.addEventListener('error',reveal,{once:true})}
 else reveal();
}
// Never generate alternate faces for the pets: scene portraits reuse the actual
// character-select images (and Tolly's existing portrait) for a consistent cast.
const EXTRA_BANTER={
 laser:[['winnifred','Pew. Pew. Pew.'],['rosie','AAAH! I HAVE BEEN SHOT!'],['millie','AAAAAH! ROSIE HAS BEEN SHOT!'],['ellie','Guys. She clearly meant the laser.'],['rosie','...Oh.'],['millie','...Oh. WAIT. IT MOVED! AAAAH!'],['winnifred','A pawsitively catastrophic misunderstanding.']],
 daan:[['tolly','DAAN! I REQUIRE REINFORCEMENTS!'],['millie','BALL?'],['ellie','That is not a ball, Millie.'],['millie','IT MOVED! AAAAAAH!'],['rosie','I will protect us! ...After the banana.'],['ellie','Guys! That is a terrible idea. WAIT FOR ME!']],
 paws:[['winnifred','This is an aristo-cat-ic intermission.'],['ellie','Nobody go anywhere without me.']]
};
const SCENE_LINES={
 clue1:[['rosie','I smell banana.'],['winnifred','You have said that about every tree.'],['rosie','And one day I will be right.']],
 clue2:[['millie','BALL?'],['ellie','Millie. That is a sausage wrapper.'],['millie','...BALL SHAPED SAUSAGE?'],['winnifred','We are being watched by two suspicious puddings.']],
 clue3:[['winnifred','A final note. From the fridge guardian herself.'],['rosie','Does it say BANANA?'],['winnifred','It says: NO MORE BANANA. In three different fonts.'],...EXTRA_BANTER.laser],
 intro:[['tolly','NO ROSIE. YOU ARE ON A DIET.'],['rosie','...I have come to negotiate the banana tax.'],['tolly','You brought a sausage sword.'],['winnifred','A very persuasive sausage sword.']],
 phase2:[['tolly','I HAVE BEEN TOO LENIENT.'],['ellie','That sounds like a cone-related sentence.'],['tolly','CONE OF SHAME: DEPLOYED.'],['rosie','I suddenly regret all of my life choices.']],
 phase3:[['tolly','YOU HAVE TRIGGERED MY FINAL FORM.'],['winnifred','A third course? How unusual.'],['tolly','THERE SHALL BE NO BANANA.']],
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
 if(kind==='phase3'&&difficulty==='extreme')lines.push(...EXTRA_BANTER.daan);
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
  row.dataset.speaker=id;
  if(kind==='clue3'&&(words.includes('SHOT')||words.includes('...Oh')))row.dataset.reaction='dramatic-collapse';
  if(id==='millie'&&words.includes('AAAAH'))row.dataset.reaction='startled';
  if(id==='winnifred'&&words.includes('pawsitively'))row.dataset.reaction='aristocat';
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
 osc.type=kind==='brass'?'sawtooth':kind==='pluck'||kind==='strings'?'triangle':kind==='bass'||kind==='bell'?'sine':'triangle';
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
// Original battle arrangements: game-like urgency, no borrowed melodies.
// Each track has its own 4/4 motif, pulse, harmony and instrumentation.
const battleScores={
 duo:{bpm:120,root:[45,43,48,45,50,48,43,45],
  intervals:[[0,3,7],[0,4,7],[0,3,7],[0,3,7]],
  motif:[[0,69,.4],[.5,72,.35],[1.25,76,.5],[2.1,72,.38],[3,69,.65]]},
 boss1:{bpm:157,root:[40,48,50,47,40,43,45,47],
  intervals:[[0,3,7],[0,4,7],[0,3,7],[0,4,7]],
  motif:[[0,76,.32],[.5,79,.32],[1,83,.5],[2,79,.36],[2.75,74,.4],[3.25,76,.5]]},
 boss2:{bpm:166,root:[41,48,46,43,41,38,46,48],
  intervals:[[0,3,7],[0,3,6],[0,4,7],[0,3,7]],
  motif:[[0,77,.4],[.75,76,.24],[1,73,.47],[1.75,70,.4],[2.5,73,.35],[3,79,.7]]},
 boss3:{bpm:172,root:[38,46,41,45,38,43,46,38],
  intervals:[[0,3,7],[0,4,7],[0,3,7],[0,4,7]],
  motif:[[0,74,.75],[1,81,.75],[2,77,.43],[2.75,86,.4],[3.25,81,.65]]}
};
// Richer, original handheld-RPG-inspired boss sound. Lightweight WebAudio:
// pitched drums, string ostinato, brass fanfares and shimmer (no sampled songs).
function battleDrum(at,kind,loud=.035){
 const ctx=audioCtx;if(!audioEnabled||!ctx)return;
 const on=Math.max(at,ctx.currentTime+.003),osc=ctx.createOscillator(),env=ctx.createGain();
 const kick=kind==='kick',hihat=kind==='hat';
 osc.type=kick?'sine':hihat?'square':'triangle';
 const freq=kick?155:hihat?2200:210;
 osc.frequency.setValueAtTime(freq,on);
 osc.frequency.exponentialRampToValueAtTime(kick?54:hihat?850:95,on+(kick?.18:.09));
 env.gain.setValueAtTime(.0001,on);
 env.gain.linearRampToValueAtTime(loud,on+.004);
 env.gain.exponentialRampToValueAtTime(.0001,on+(kick?.21:hihat?.045:.11));
 if(hihat){const lp=ctx.createBiquadFilter();lp.type='highpass';lp.frequency.value=850;osc.connect(lp);lp.connect(env)}
 else osc.connect(env);
 env.connect(ctx.destination);osc.start(on);osc.stop(on+(kick?.24:.14));
}
function battleString(pitch,at,dur,volume=.008){
 const ctx=audioCtx;if(!audioEnabled||!ctx)return;
 const on=Math.max(at,ctx.currentTime+.003),end=on+dur;
 const env=ctx.createGain(),filter=ctx.createBiquadFilter();
 filter.type='lowpass';filter.frequency.setValueAtTime(1100,on);
 env.gain.setValueAtTime(.0001,on);env.gain.linearRampToValueAtTime(volume,on+.14);
 env.gain.setValueAtTime(volume,Math.max(on+.14,end-.21));
 env.gain.exponentialRampToValueAtTime(.0001,end);
 filter.connect(env).connect(ctx.destination);
 for(const detune of [-7,7]){
  const osc=ctx.createOscillator();osc.type='sawtooth';
  osc.frequency.setValueAtTime(noteHz(pitch),on);osc.detune.value=detune;
  osc.connect(filter);osc.start(on);osc.stop(end+.02);
 }
}
function currentMusic(){
 if(phase==='cutscene'||phase==='upgrade')return 'story';
 if(phase==='boss')return bossPhase>=3?'boss3':bossPhase===2?'boss2':'boss1';
 if(duoActive&&phase==='explore')return'duo';
 return phase==='explore'?'garden':'idle';
}
function scheduleMusicBar(mode,index,startAt){
 const battle=battleScores[mode],gentle=mode==='story',beat=60/(battle?battle.bpm:gentle?116:138);
 if(battle){
  const root=battle.root[index],notes=battle.intervals[index%4].map(v=>root+12+v);
  musicVoice(root,startAt,beat*.8,'bass',.036);
  musicVoice(root-12,startAt,beat*.48,'bass',.023);
  for(let j=0;j<4;j++){
   musicVoice(root+(j===3?7:0),startAt+beat*j,beat*.26,'pluck',.015);
   if(j%2===1)musicVoice(root+24,startAt+beat*j,beat*.08,'pluck',.009);
  }
  for(const [beatAt,pitch,duration] of battle.motif){
   const variation=index%4===2?-2:index%4===3?2:0;
   musicVoice(pitch+variation,startAt+beat*beatAt,beat*duration,mode==='boss3'?'brass':'pluck',mode==='boss3'?.026:.024);
  }
  // Drums create the tension/energy missing from the earlier gentle waltz.
  const intensity=mode==='boss3'?1.25:mode==='boss2'?1.05:mode==='boss1'?.90:.60;
  for(let j=0;j<4;j++){
   battleDrum(startAt+beat*j,j%2===0?'kick':'snare',.038*intensity);
   if(mode!=='duo'||j%2===0)battleDrum(startAt+beat*(j+.5),'hat',.005*intensity);
  }
  if(mode==='boss3'){
   // A legendary three-layer battle: heroic brass answers, strings sustain,
   // ascending 8th-note ostinato. All phrases original to this game.
   for(const pitch of notes)battleString(pitch,startAt,beat*3.85,.0065);
   for(let j=0;j<8;j++)musicVoice(root+24+[0,7,12,7,3,7,12,15][j],
     startAt+beat*j*.5,beat*.43,'pluck',.012);
   musicVoice(root+31,startAt+beat*1.5,beat*1.15,'brass',.022);
   if(index%2===1)musicVoice(root+36,startAt+beat*2.5,beat*1.1,'brass',.019);
  }else if(mode==='boss2'){
   for(const pitch of notes)battleString(pitch,startAt,beat*3.6,.004);
   if(index%2===1)musicVoice(root+31,startAt+beat*2.5,beat*1.1,'brass',.012);
  }else if(mode==='boss1'){
   for(let j=0;j<8;j++)musicVoice(root+24+[0,3,7,12][j%4],
     startAt+beat*.5*j,beat*.36,'pluck',.010);
   if(index%2===0)musicVoice(root+31,startAt+beat*2.5,beat*.8,'brass',.014);
  }else musicVoice(root+19,startAt+beat*2.5,beat*.35,'bell',.012);
  return beat*4;
 }
 const chord=gardenChords[index],melody=gardenMelody[index];
 musicVoice(chord.root,startAt,beat*(gentle?1.15:.79),'bass',gentle?.013:.023);
 for(const beatIndex of [1,2])for(const pitch of chord.notes){
  musicVoice(pitch,startAt+beat*beatIndex,beat*(gentle?.56:.38),'pluck',gentle?.007:.012);
 }
 for(const [pos,pitch,len] of melody){
  musicVoice(pitch,startAt+beat*pos,beat*len,gentle?'bell':'flute',gentle?.018:.029);
 }
 if(index===3||index===7)musicVoice(86,startAt+beat*2.45,beat*.46,'bell',gentle?.008:.012);
 return beat*3;
}
function tickMusic(){
 if(!audioEnabled||paused||phase==='ended'||phase==='idle'||!audioCtx||audioCtx.state!=='running')return;
 const mode=currentMusic(),now=audioCtx.currentTime;
 if(mode!==musicMode){
   musicMode=mode;musicBar=0;musicNextBarAt=now+.06;
    const labels={garden:'SAKURA GARDEN',duo:'BOINK & BOCHT · TROUBLE',boss1:'TOLLY · FIRST ENCOUNTER',
      boss2:'TOLLY · CONE OF SHAME',boss3:'LEGENDARY FRIDGE · FINAL DEFENCE',story:'STORYBOOK INTERLUDE'};
    const status=$('music-status');if(status)status.textContent='♫ '+(labels[mode]||'ARCADE');
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
 $('ending-invite').hidden=true;sceneName=kind;cutsceneNext=kind;phase='cutscene';keys.clear();
 sceneOpenedAt=performance.now();const presentationToken=++scenePresentationToken;joystickAxes.forEach(axis=>{axis.x=0;axis.y=0});
 $('pause').disabled=true;
 $('overlay').classList.add('cinematic');$('overlay').classList.add('hidden');$('overlay').dataset.scene=kind;
 $('overlay-kicker').textContent=kind.startsWith('clue')?'DISCOVERY · CLUE '+kind.slice(-1)+'/3':kind==='intro'?'THE FRIDGE HAS BEEN FOUND':kind==='phase3'?'FINAL PHASE · LEGENDARY DEFENCE':'PHASE TWO · CONE OF SHAME';
 $('overlay').querySelector('h3').textContent=title;
 $('overlay').querySelector('p').textContent=dialogue;
 const sceneArt=$('overlay-art');sceneArt.classList.add('show','scene-art-pending');sceneArt.style.maxWidth='';
 if(kind==='clue3'){
  // Avoid upscaling the chapter-three art beyond its source pixel width.
  const limitToNative=()=>{const image=sceneArtCache[kind];if(sceneName==='clue3'&&image?.naturalWidth)sceneArt.style.maxWidth=Math.min(680,image.naturalWidth)+'px';};
  if(sceneArtCache[kind]?.complete)limitToNative();else sceneArtCache[kind]?.addEventListener('load',limitToNative,{once:true});
 }
 renderSceneLines(kind);$('mission-unlock').classList.remove('show');
 $('overlay-start').dataset.continueLabel='▶ '+(kind==='intro'?'FACE TOLLY':kind==='phase2'||kind==='phase3'?'CONTINUE THE BATTLE':kind==='clue2'?'FACE BOINK & BOCHT':'CONTINUE EXPLORING');
 $('overlay-start').textContent=(SCENE_LINES[kind]||[]).length>1?'▶ NEXT LINE':$('overlay-start').dataset.continueLabel;
 $('scene-skip').hidden=false;
 $('scene-control-help').hidden=false;
 // New readers on a phone should see the first spoken line, not only the art.
 const visibleLine=$('scene-dialogues').querySelector('.scene-line:not([hidden])');
 if(visibleLine)$('overlay').querySelector('.overlay-inner').scrollTop=0;
 presentSceneArt(kind,presentationToken);
}
// Quest wards require three short, visible guardian waves at every scroll.
function spawnGuardianWave(){
 const counts=GATE_WAVES[difficulty][gate.index];
 const count=counts[gate.wave],origin=clueSpots[gate.index];
 for(let i=0;i<count;i++){
  const kind=(i===0&&gate.wave===2)?'chunkling':(i%3===0?'boink':i%3===1?'bleepling':'bocht');
  const c=ENEMY_TYPES[kind],a=TAU*(i+.3+gate.wave*.27)/count,radius=190+(i%2)*38;
  const tuning=difficultyBalance(),hp=Math.round(c.hp*tuning.guardianHp);
  foes.push({x:clamp(origin.x+Math.cos(a)*radius,30,WIDTH-30),y:clamp(origin.y+Math.sin(a)*radius,30,HEIGHT-30),
   hp,maxHp:hp,speed:c.speed*tuning.guardianSpeed,
   damage:Math.round(c.damage*tuning.guardianDamage),size:c.size,attack:.85,
   kind,guardian:true,age:0,telegraph:0,charge:-1,trailTimer:0,slow:0});
 }
 gate.remainingDelay=3.3;
 say(gate.index===1?'🌭 SAUSAGE AMBUSH · ROUND '+(gate.wave+1)+'/2! Boink and dodge!':'⚠ SCROLL GUARDIANS · WAVE '+(gate.wave+1)+'/3!',3.5);
 playSfx('wave');
}
function beginGuardian(index){gate={index,wave:0,remainingDelay:0};spawnGuardianWave();}
function updateGuardian(dt){
 if(!gate||phase!=='explore')return;
 gate.remainingDelay=Math.max(0,gate.remainingDelay-dt);
 if(foes.some(e=>e.guardian&&e.hp>0))return;
 if(gate.remainingDelay>0)return;
 if(gate.wave<(gate.index===1?1:2)){gate.wave++;spawnGuardianWave();return;}
 const index=gate.index;gate=null;gateCleared[index]=true;
 players.filter(p=>p.alive).forEach(p=>p.hp=Math.min(p.maxHp,p.hp+12));
 say('✨ THE SCROLL IS UNSEALED! Return to reveal the next chapter!',4);
 playSfx('clue');
}
function spawnDuo(){
 duoActive=true;duoDefeated=false;
 const pos=players.find(p=>p.alive)||players[0];
 for(const [i,kind] of ['boink','bocht'].entries()){
  const conf=ENEMY_TYPES[kind],scale=difficulty==='story'?.9:difficulty==='extreme'?3.2:2.4;
  const x=i===0?pos.x+210:pos.x-210,y=i===0?pos.y-180:pos.y+170;
  const hp=Math.round(conf.hp*3*scale);
  foes.push({x:clamp(x,45,WIDTH-45),y:clamp(y,45,HEIGHT-45),
   hp,maxHp:hp,speed:conf.speed*(difficulty==='story'?1:1.10),
   damage:Math.round(conf.damage*(difficulty==='story'?1:1.16)),
   size:conf.size+8,attack:1.2,kind,elite:true,age:0,
   telegraph:0,charge:-1,trailTimer:0,slow:0,volleyWarmup:0,volleyCooldown:i===0?3.2:4.8});
 }
 say('⚠ BOINK & BOCHT! Defeat the terrible twosome to reveal the last clue!',4);
 playSfx('boink');
}
function continueScene(){
 if(phase!=='cutscene')return;
 if(advanceSceneBeat())return;
 const kind=cutsceneNext;
 ++scenePresentationToken;cutsceneNext=null;keys.clear();
 $('scene-control-help').hidden=true;
 players.filter(p=>p.alive).forEach(p=>p.inv=Math.max(p.inv,1.7));
 phase=['intro','phase2','phase3'].includes(kind)?'boss':'explore';
 $('overlay').classList.remove('cinematic');$('overlay').classList.add('hidden');$('scene-skip').hidden=true;
 $('scene-dialogues').hidden=true;
 $('pause').disabled=false;$('pause').textContent='Ⅱ PAWS';
 if(kind==='intro'){
   const hp=(players.length===2?2040:1450)*(difficulty==='story'?.67:difficulty==='extreme'?EXTREME.bossHp:1);
   boss={x:fridge.x+45,y:fridge.y-80,hp,maxHp:hp,size:49,speed:difficulty==='story'?96:difficulty==='extreme'?137*EXTREME.bossSpeed:145,attack:1.1,hitFlash:0,rage:false};
   hazards=[];foes=foes.slice(-5);bossPhase=1;coneWarned=false;coneCooldown=6.6;coneWindup=0;bossPulseCooldown=1.65;bossPulseWindup=0;bananaWindup=0;daanActive=false;daanPulse=4;daanActionTimer=0;
   $('bossbar').classList.add('show');$('boss-card').classList.add('show');
   say('⚔ TOLLY: No Rosie, you’re on a diet — no more banana!',5);playSfx('boss');score+=200;
 }else if(kind==='phase2'){
   say('⚠ TOLLY UNLEASHES NEW ATTACKS! Watch the Cone of Shame!',4);playSfx('phase');
   players.filter(p=>p.alive).forEach(p=>p.inv=Math.max(p.inv,1.3));
   coneCooldown=2.5;bossPulseCooldown=1.4;
   /* The phase-two attack set is Tolly's alone. */
 }else if(kind==='phase3'){
   bossPhase=3;boss.rage=true;playSfx('phase');
   players.filter(p=>p.alive).forEach(p=>p.inv=Math.max(p.inv,1.6));
   coneCooldown=2;bossPulseCooldown=1.2;
   if(difficulty==='extreme'){daanActive=true;daanPulse=3;daanActionTimer=.7;say('⚠ DAAN ARRIVES! FINAL FRIDGE DEFENCE!',4)}
   else say('⚠ FINAL FRIDGE FRENZY!',4);
 }else if(kind==='clue2'){
   players.filter(p=>p.alive).forEach(p=>p.inv=Math.max(p.inv,1.2));
   spawnDuo();
 }else if(kind==='clue3'){
   players.filter(p=>p.alive).forEach(p=>p.inv=Math.max(p.inv,1.2));
   laserUnlocked=true;players.forEach(p=>p.laserCooldown=1.1);
   say('🔴 LEGENDARY LASER POINTER FOUND! Automatic beams now help clear a path!',4);playSfx('laser');
 }else{
   players.filter(p=>p.alive).forEach(p=>p.inv=Math.max(p.inv,1.2));
   say('🧭 A new golden pawprint trail appears. SUCHT!',3);
 }
 lastTime=performance.now();syncHud();
}
const ambientBanter=[
 'ROSIE: If this is a snack investigation, I demand a re-treat.',
 'MILLIE: BALL! ...AAAAH! A LEAF MOVED!',
 'ELLIE: Guys, this is a terrible idea. WAIT FOR ME!',
 'WINNIFRED: I find your conduct aristo-cat-astrophic.',
 'ROSIE: Are we pawsitively sure there is no cheese?',
 'MILLIE: Did someone say throw? ...AAAAAH, IT MOVED!'
];
function say(t,duration=3){$('game-message').textContent=t;messageClock=duration}
function player(id,num){let c=roster[id];return {...c,id,num,x:320+num*50,y:400+num*55,maxHp:c.hp,cool:rnd(0,.2),inv:0,dash:0,dashCooldown:0,healClock:1.7,healFlash:0,alive:true,reviveProgress:0,laserCooldown:1.5,spriteFacing:'down',spriteMoving:false,spriteAttackAt:-1,perkGlow:0,perkRarity:''}}
function start(){
 ++scenePresentationToken;perkOffer=null;perksAwarded=0;$('perk-panel').hidden=true;
 $('scene-control-help').hidden=true;$('ending-invite').hidden=true;cancelAnimationFrame(raf);
 joystickAxes.forEach(a=>{a.x=0;a.y=0});document.querySelectorAll('.joystick-knob').forEach(k=>k.style.transform='translate(0px,0px)');
 players=[player(selected[0],0)];if($('coop').checked)players.push(player(selected[1],1));
 const startHealth=DIFFICULTY_BALANCE[$('difficulty').value].startingHealth;
 players.forEach(p=>{p.maxHp=Math.round(p.maxHp*startHealth);p.hp=p.maxHp;});
 foes=[];shots=[];drops=[];fx=[];hazards=[];beams=[];difficulty=$('difficulty').value;gate=null;gateCleared=[false,false,false];scentStep=0;duoActive=false;duoDefeated=false;laserUnlocked=false;coneCooldown=6.8;coneWindup=0;bossPulseCooldown=4;bossPulseWindup=0;bananaWindup=0;daanActive=false;daanPulse=0;daanActionTimer=0;laserChallenge={index:0,timer:0,zapCooldown:0};phase='explore';paused=false;boss=null;cutsceneNext=null;sceneName=null;musicStep=0;musicMode='idle';musicBar=0;musicNextBarAt=0;
 elapsed=0;score=0;kills=0;level=1;xp=0;goal=35;clues=0;fridgeVisible=false;
 spawnClock=.55;surgeClock=33;attackClock=0;hudClock=0;keys.clear();ensureAudio();
 $('scene-skip').hidden=true;$('share-result').classList.remove('show');$('mission-unlock').classList.remove('show');$('scene-dialogues').hidden=true;$('share-status').textContent='';$('overlay').classList.remove('cinematic');$('overlay').classList.add('hidden');$('pause').disabled=false;$('pause').textContent='Ⅱ PAWS';
 $('paws-panel').hidden=true;$('bossbar').classList.remove('show');$('boss-card').classList.remove('show');$('overlay-art').classList.remove('show');$('scene-dialogues').hidden=true;$('overlay-kicker').textContent='ARCADE MODE';
 say('Okay '+players.map(p=>p.name).join(' & ')+'… '+(players.length===1?'SUCH TOLLY!':'SUCHT TOLLY!')+' ADVENTURE MODE!',5);
 syncHud();lastTime=performance.now();raf=requestAnimationFrame(loop);
 $('game-section').scrollIntoView({behavior:'smooth',block:'start'});
}
function scoreText(win){const squad=players.map(p=>p.name).join(' & ');const duration=Math.floor(elapsed/60)+':'+String(Math.floor(elapsed%60)).padStart(2,'0');return '🐾 LEVEL 32 — ROSIE SURVIVORS\n'+squad+' '+(win?'LIBERATED THE FRIDGE!':'WERE DEFEATED BY TOLLY!')+'\nScore: '+score+' | Snacklings boinked: '+kills+' | Time: '+duration+'\nCan you beat our run? 🎮\nBirthday invitation: '+new URL(inviteHref,location.href).href;}
function resetEnd(win){$('scene-control-help').hidden=true;$('paws-panel').hidden=true;$('ending-invite').hidden=false;phase='ended';paused=true;$('pause').disabled=true;let title=win?'🎉 TREATS LIBERATED!':'💀 THE FRIDGE PREVAILS';let detail=win?'Okay, you deserve the banana and cheese tax.':'Mwahahaha! You are a chonk and are of no match to the mighty Tolly!';if(score>best){best=score;try{localStorage.setItem('rosie-survivors-best',String(best))}catch{}detail+=' NEW PERSONAL BEST!'}$('overlay-kicker').textContent=win?'CUTSCENE · REWARD SCREEN':'GAME OVER · FRIDGE SEALED';$('overlay').classList.add('cinematic');$('overlay').querySelector('h3').textContent=title;$('boss-card').classList.remove('show');$('overlay').dataset.scene=win?'victory':'defeat';$('scene-skip').hidden=true;$('overlay-art').style.maxWidth='';$('overlay-art').src=win?SCENE_ART.victory:SCENE_ART.defeat;$('overlay-art').classList.add('show');renderSceneLines(win?'victory':'defeat');$('scene-dialogues').querySelectorAll('.scene-line').forEach(row=>row.hidden=false);$('mission-unlock').classList.add('show');$('overlay').querySelector('p').textContent=detail+' Score: '+score+' · Snacklings boinked: '+kills+'.';$('overlay-start').textContent='↻ PLAY AGAIN';$('scene-counter').textContent='';$('share-result').classList.add('show');$('share-status').textContent='';$('overlay').classList.remove('hidden'); if(win){playSfx('victory'); say(pick(slogans.victory),3)} else {playSfx('defeat')} syncHud()}
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
  speed:c.speed+Math.min(31,elapsed*.14),attack:rnd(.3,.8),size:c.size,kind,damage:Math.ceil((c.damage+Math.floor(tier*.75))*difficultyBalance().mobDamage),age:0,telegraph:0,charge:-1,trailTimer:0,slow:0});
}
function emit(text,x,y,col='#ffe1aa'){if(fx.length<(liteFx?45:90))fx.push({text,x,y,col,t:1.1})}
function nearest(origin,arr,r=Infinity){let item=null,bd=r;for(const o of arr){if(o.hp<=0||o.alive===false)continue;const d=dist(origin,o);if(d<bd){bd=d;item=o}}return item}
function fire(p){const target=nearest(p,[...foes,...(boss?[boss]:[])],p.range);if(!target)return;p.spriteAttackAt=elapsed;if(p.weapon==='sausage'){for(const e of [...foes,...(boss?[boss]:[])])if(e.hp>0&&dist(p,e)<p.range){damage(e,p.damage+level*2,p);emit('⚔',e.x,e.y,'#fff0a7')}return}const angle=Math.atan2(target.y-p.y,target.x-p.x);shots.push({x:p.x,y:p.y,vx:Math.cos(angle)*410,vy:Math.sin(angle)*410,damage:p.damage+level*2,ttl:1.1,owner:p.num,kind:p.weapon,pierce:p.weapon==='dragon'?1:0,hitTargets:new Set()})}
// XP remains standard for the first five levels in all difficulty modes.
function gainXP(amount){
 xp+=amount*(level<=5?1:difficulty==='story'?1:difficulty==='extreme'?.60:.78);
 processLevelUps();
}
function rollRarity(){const n=Math.random();return n<.75?'normal':n<.96?'epic':'legendary'}
function perkDetails(stat,rarity){
 if(stat==='hp')return rarity==='legendary'?{name:'ROYAL HEART',desc:'+65 Max HP · no downside',hp:65,damage:0,speed:0}:
  rarity==='epic'?{name:'TITAN HEART',desc:'+36 Max HP · -14 Speed',hp:36,damage:0,speed:-14}:
  {name:'SNACK STASH',desc:'+16 Max HP · -4 Speed',hp:16,damage:0,speed:-4};
 return rarity==='legendary'?{name:'DRAGON ASCENDANT',desc:'+14 Damage · no downside',hp:0,damage:14,speed:0}:
  rarity==='epic'?{name:'BERSERKER FLOOF',desc:'+9 Damage · -16 Max HP',hp:-16,damage:9,speed:0}:
  {name:'SHARPENED TOY',desc:'+4 Damage · -7 Max HP',hp:-7,damage:4,speed:0};
}
function offerUpgrade(){
 perkReturnPhase=phase;phase='upgrade';
 // XP and routine level-ups belong to the whole team. Special perks alternate
 // between P1 and P2: level 5 -> P1, 10 -> P2, 15 -> P1.
 const p=players[perksAwarded%players.length];
 perkOffer={player:p,offers:['hp','damage'].map(stat=>({stat,rarity:rollRarity()}))};
 $('perk-who').textContent='TEAM LEVEL '+level+' · P'+(p.num+1)+' ('+p.name+') takes this perk turn. Next perk: '+(players[(p.num+1)%players.length]?.name||p.name)+'. Choose one boost.';
 const choices=$('perk-choices');choices.replaceChildren();
 perkOffer.offers.forEach((o,i)=>{
  const d=perkDetails(o.stat,o.rarity),button=document.createElement('button');
  button.type='button';button.className='perk-choice perk-'+o.rarity;
  button.textContent=o.rarity.toUpperCase()+' · '+d.name+' — '+d.desc;
  button.addEventListener('click',()=>acceptUpgrade(i));choices.append(button);
 });
 $('perk-panel').hidden=false;choices.querySelector('button')?.focus({preventScroll:true});
}
function acceptUpgrade(index){
 if(!perkOffer||phase!=='upgrade'||![0,1].includes(index))return;
 const {player:p,offers}=perkOffer,choice=offers[index],d=perkDetails(choice.stat,choice.rarity);
 p.maxHp=Math.max(50,p.maxHp+d.hp);
 p.hp=clamp(p.hp+Math.max(d.hp,0),1,p.maxHp);
 p.damage+=d.damage;p.speed=Math.max(125,p.speed+d.speed);
 p.perkGlow=8;p.perkRarity=choice.rarity;
 perksAwarded++;
 perkOffer=null;$('perk-panel').hidden=true;phase=perkReturnPhase;
 playSfx('heal');say('✨ '+p.name+' gains '+d.name+'!',3.4);
 // Resume banked XP after the modal instead of requiring another pickup.
 processLevelUps();syncHud();
}
function processLevelUps(){
 if(perkOffer)return;
 for(let count=0;xp>=goal&&count<40;count++){
  xp-=goal;level++;goal=Math.round(goal*1.29);
  players.forEach(p=>{p.damage+=1;p.maxHp+=2;p.hp=Math.min(p.maxHp,p.hp+5)});
  if(level%5===0){offerUpgrade();return}
  say('✨ LEVEL '+level+'! Your squad grows stronger.',2.6);playSfx('heal');
 }
}
function damage(enemy,amount,p){
 if(phase==='ended'||phase==='cutscene'||enemy.hp<=0)return;
 enemy.hp-=amount;
 if(enemy===boss){boss.hitFlash=.19;
   if(!boss.rage&&boss.hp>0&&boss.hp<=boss.maxHp*.33&&coneWarned){
   boss.rage=true;bossPhase=3;emit('FINAL FRIDGE FRENZY!',boss.x,boss.y-100,'#ffe0aa');
   showScene('phase3','THE LEGENDARY FRIDGE DEFENCE','Tolly summons her final strategy!',[['tolly','MY FINAL DEFENCE! NO MORE BANANA!']]);return;
  }
 }
 if(enemy===boss&&enemy.hp>0&&!coneWarned&&enemy.hp<=enemy.maxHp*.67){
   coneWarned=true;bossPhase=2;showScene('phase2','THE CONE OF SHAME!',"Tolly has reached for the ultimate weapon. Watch the red warning arc!",[['tolly',"ARG. DON'T MAKE ME GET THE CONE OF SHAME OUT!!!"]]);return;
 }
 if(enemy.hp<=0){
  if(enemy===boss){score+=900;emit('FRIDGE OPEN!',enemy.x,enemy.y-50);resetEnd(true);return}
  kills++;score+=(ENEMY_TYPES[enemy.kind]?.score||12);gainXP(ENEMY_TYPES[enemy.kind]?.xp||7);
  emit('+'+(ENEMY_TYPES[enemy.kind]?.score||12),enemy.x,enemy.y); playSfx('hit');
  if(enemy.elite&&['boink','bocht'].includes(enemy.kind)&&!foes.some(f=>f!==enemy&&f.elite&&f.hp>0)){
    hazards=hazards.filter(h=>h.kind!=='duo-banana');
   duoActive=false;duoDefeated=true;score+=250;
   say('🎉 BOINK & BOCHT HAVE BEEN BOINKED! The last clue is revealed!',5);
   players.filter(q=>q.alive).forEach(q=>q.hp=Math.min(q.maxHp,q.hp+20));playSfx('victory');
  }
  if(Math.random()<.17&&drops.length<35)drops.push({x:enemy.x,y:enemy.y,kind:'xp',r:13});
  if(Math.random()<.052&&drops.length<35)drops.push({x:enemy.x,y:enemy.y,kind:'heal',r:15});

 }
}
function movePlayers(dt){
 players.forEach(p=>{
  if(!p.alive)return;
  let k=p.num===0?['a','d','w','s']:['arrowleft','arrowright','arrowup','arrowdown'];
  let dx=Number(keys.has(k[1]))-Number(keys.has(k[0])),dy=Number(keys.has(k[3]))-Number(keys.has(k[2]));
  if(Math.hypot(joystickAxes[p.num].x,joystickAxes[p.num].y)>.08){dx=joystickAxes[p.num].x;dy=joystickAxes[p.num].y;}
   // Presentation-only facing: never affect movement, combat, or hitboxes.
   p.spriteMoving=Math.hypot(dx,dy)>.08;
   if(p.spriteMoving)p.spriteFacing=Math.abs(dx)>Math.abs(dy)
     ?(dx>0?'right':'left'):(dy>0?'down':'up');
  // Keyboard diagonal is normalized, but a partially tilted thumbstick stays
  // proportional instead of snapping to maximum running speed.
  let l=Math.max(1,Math.hypot(dx,dy));
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
  p.perkGlow=Math.max(0,(p.perkGlow||0)-dt);p.inv=Math.max(0,p.inv-dt);p.dash=Math.max(0,p.dash-dt);
  p.dashCooldown=Math.max(0,p.dashCooldown-dt);
  p.cool-=dt;if(p.cool<=0){fire(p);p.cool=p.rate}
  p.laserCooldown-=dt;if(laserUnlocked&&p.laserCooldown<=0){laserAttack(p);p.laserCooldown=5.3}
  for(let i=drops.length-1;i>=0;i--){let d=drops[i];if(dist(p,d)<29){
    if(d.kind==='xp'){gainXP(12);score+=5;emit('+XP',p.x,p.y,'#a9f4d1')}
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
// Swept segment-to-circle collisions prevent frame skips on mobile.
// Rosie's dragon intentionally pierces one enemy to hit a second, never a third.
function advanceProjectiles(dt){
 for(let i=shots.length-1;i>=0;i--){
  const s=shots[i],x0=s.x,y0=s.y;
  const x1=x0+s.vx*dt,y1=y0+s.vy*dt;
  s.x=x1;s.y=y1;s.ttl-=dt;
  if(s.ttl<=0){shots.splice(i,1);continue}
  const dx=x1-x0,dy=y1-y0,length2=dx*dx+dy*dy;
  const hits=[...foes,...(boss?[boss]:[])]
   .filter(t=>t.hp>0&&!s.hitTargets.has(t))
   .map(t=>{
    const along=length2>0?clamp(((t.x-x0)*dx+(t.y-y0)*dy)/length2,0,1):0;
    const cx0=x0+along*dx,cy0=y0+along*dy,radius=(t.size||41)+9;
    return {target:t,along,hit:(cx0-t.x)**2+(cy0-t.y)**2<radius*radius};
   }).filter(v=>v.hit).sort((a,b)=>a.along-b.along);
  for(const {target} of hits){
   if(target.hp<=0||s.hitTargets.has(target))continue;
   s.hitTargets.add(target);
   damage(target,s.kind==='dragon'&&s.hitTargets.size===2?s.damage*.5:s.damage,players[s.owner]);
   if(s.kind==='dragon')emit(s.hitTargets.size===1?'DRAGON HIT!':'PIERCE · 50%!',target.x,target.y-27,'#caffb2');
   if(s.kind==='kong'){target.slow=Math.max(target.slow||0,2);emit('❄ SLOW',target.x,target.y-30,'#a9ecff')}
   if(phase==='cutscene'||phase==='ended')break;
   if(s.pierce>0)s.pierce--;
   else {shots.splice(i,1);break}
  }
  if(phase==='cutscene'||phase==='ended')break;
 }
}
// Extreme-only mini-boss attack: Boink fires an axis-aligned '+' volley;
// Bocht fires a 45-degree 'X' volley. A readable .78s windup precedes each.
function updateDuoVolley(e,dt){
 if(difficulty!=='extreme'||!duoActive||!e.elite||!['boink','bocht'].includes(e.kind))return;
 if(e.volleyWarmup>0){
  e.volleyWarmup-=dt;
  if(e.volleyWarmup<=0){
   const offset=e.kind==='bocht'?Math.PI/4:0;
   for(let n=0;n<4;n++){
    const angle=offset+n*Math.PI/2;
    hazards.push({kind:'duo-banana',source:e.kind,x:e.x,y:e.y,
      vx:Math.cos(angle)*220,vy:Math.sin(angle)*220,damage:11,size:19,ttl:2.3});
   }
   playSfx('special');
  }
  return;
 }
 e.volleyCooldown-=dt;
 if(e.volleyCooldown<=0){
  e.volleyWarmup=.78;e.volleyCooldown=e.kind==='boink'?4.3:5.1;
  say(e.kind==='boink'?'⚠ BOINK: + BANANA CROSS!':'⚠ BOCHT: X BANANA CROSS!',1.6);
  emit(e.kind==='boink'?'⚠ +':'⚠ X',e.x,e.y-42,'#ffe4aa');
 }
}
function update(dt){
 if(phase==='ended'||phase==='cutscene'||phase==='upgrade')return;
 elapsed+=dt;messageClock-=dt;
 if(messageClock<=0){$('game-message').textContent=phase==='explore'?'🫧 THE GREAT SNACK RIFT · Track the golden clues!':'⚠ BOSS RUSH · Dodge Tolly’s banana barrage!';messageClock=999}
 sloganClock-=dt;
 if(sloganClock<=0){
  if(players.some(p=>p.alive&&p.hp/p.maxHp<.33))shout(slogans.danger,2.2);
  else if(phase==='explore'&&!gate&&Math.random()<.48)say(pick(ambientBanter),3.6);
  else shout(phase==='boss'?slogans.boss:slogans.explore,2.2);
  sloganClock=phase==='boss'?6.5:9.5;
 }
 movePlayers(dt);
 if(phase==='ended'||phase==='cutscene')return;
 updateRevives(dt);
 updateEllieAuras(dt);
 spawnClock-=dt;
 if(spawnClock<=0&&elapsed>=difficultyBalance().earlySpawnGrace&&foes.length<(gate?23:duoActive?20:phase==='boss'?48:difficultyBalance().ambientCap)){
   const n=gate?1:duoActive?1:phase==='boss'?(difficulty==='story'?1:difficulty==='extreme'?3:2):elapsed>75?3:elapsed>18?2:1;
   for(let j=0;j<n&&foes.length<65;j++)spawnBleepling();
   spawnClock=Math.max(.42,.93-elapsed*.0035)*difficultyBalance().ambientInterval*(gate?1.5:1)*(phase==='boss'?.9:1);
 }
 surgeClock-=dt;
 if(surgeClock<=0&&!duoActive&&!gate&&difficulty!=='story'&&foes.length<60){
    let n=phase==='boss'?7:5;
    for(let j=0;j<n&&foes.length<65;j++)spawnBleepling();
    say('🫧 BLEEPLING STAMPEDE! '+n+' extra bleps!',3.5); playSfx('wave');
    surgeClock=Math.max(23,34-elapsed*.022);
 }
 advanceProjectiles(dt);
 if(phase==='ended'||phase==='cutscene')return; // stop all combat during illustrated scenes
 for(const beam of beams)beam.t-=dt;beams=beams.filter(b=>b.t>0);
 foes=foes.filter(e=>e.hp>0);
 for(const e of foes){
    const p=nearest(e,players,Infinity);if(!p)continue;
    // Elite twins separate whenever pursuit would otherwise stack their sprites.
    if(e.elite&&duoActive&&['boink','bocht'].includes(e.kind)){
      const other=foes.find(q=>q!==e&&q.elite&&q.hp>0&&['boink','bocht'].includes(q.kind));
      if(other){
       const separation=dist(e,other);
       if(separation<110){
        const a=separation>1?Math.atan2(e.y-other.y,e.x-other.x):(e.kind==='boink'?-.8:2.3);
        e.x=clamp(e.x+Math.cos(a)*(110-separation)*.54,35,WIDTH-35);
        e.y=clamp(e.y+Math.sin(a)*(110-separation)*.54,35,HEIGHT-35);
       }
      }
    }
    updateDuoVolley(e,dt);
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
 if(phase==='explore'&&clues===2&&duoDefeated&&!gateCleared[2]){
   laserChallenge.timer+=dt;
   laserChallenge.zapCooldown=Math.max(0,laserChallenge.zapCooldown-dt);
   const node=laserNodes[laserChallenge.index];
   if(node){
     const visitor=players.find(p=>p.alive&&dist(p,node)<66);
     if(visitor){
       if(laserSafe()){
         laserChallenge.index++;score+=40;playSfx('clue');
         if(laserChallenge.index===laserNodes.length){
           gateCleared[2]=true;say('🔴 SECURITY OVERRIDDEN! The last scroll is readable!',4);
         }else say('✅ SECURITY TERMINAL '+laserChallenge.index+'/3 DISARMED! Follow the next beacon.',3);
       }else if(laserChallenge.zapCooldown<=0){
         if(visitor.inv<=0){const amount=difficulty==='story'?7:difficulty==='extreme'?16:11;
           visitor.hp=Math.max(1,visitor.hp-amount);visitor.inv=.65;
           emit('ZAP! -'+amount,visitor.x,visitor.y-35,'#ffbfc6');
         }
         laserChallenge.zapCooldown=1.1;
         say('⚠ LASER ACTIVE! Retreat until the terminal glows green.',2);
       }
     }
   }
 }
 if(phase==='explore'){
   // Quest 1 is a short tracking mission rather than a repeat of guardian-wave combat.
   if(clues===0&&!gateCleared[0]){
     const paw=scentTrail[scentStep];
     if(paw&&players.some(p=>p.alive&&dist(p,paw)<78)){
       scentStep++;playSfx('clue');score+=25;
       say(scentStep===1?'ROSIE: I smell... banana?':scentStep===2?'MILLIE: BALL! AAAAAH! THE LEAVES MOVED!':'ELLIE: It is a pawprint trail. Guys, please keep up!',3.5);
     }
     if(scentStep>=scentTrail.length){gateCleared[0]=true;say('🐾 TRAIL FOUND! The first scroll is now readable!',4)}
   }
   const i=clues;
   if(i<3&&!duoActive&&(i!==2||duoDefeated)){
    const spot=clueSpots[i];
    if(players.some(p=>p.alive&&dist(p,spot)<68)){
     if(!gateCleared[i]){
      if(i===1&&!gate)beginGuardian(i);
      return;
     }
     clues++;score+=100;playSfx('clue');gate=null;
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
   boss.hitFlash=Math.max(0,(boss.hitFlash||0)-dt);
   // In 10/10 mode, Daan joins only during the second half of the finale.
   // His distinctive warning is an additional dodgable challenge, never an invitation gate.
   if(daanActive){
     daanActionTimer=Math.max(0,daanActionTimer-dt);
     daanPulse-=dt;
     if(daanPulse<=0){
       const focus=nearest(boss,players);
       if(focus){hazards.push({x:focus.x,y:focus.y,vx:0,vy:0,ttl:1.2,damage:0,kind:'daan-warning',size:78,triggered:false});
         daanActionTimer=.9;say('⚠ DAAN SPITE: BOULDER SLAM! MOVE AWAY!',2);}
       daanPulse=5.3;
     }
   }
   bossPulseCooldown-=dt;
    if(bossPulseWindup>0){
      bossPulseWindup-=dt;
      if(bossPulseWindup<=0){
        for(const q of players.filter(p=>p.alive&&dist(p,boss)<150)){
          const a=Math.atan2(q.y-boss.y,q.x-boss.x);
          q.x=clamp(q.x+Math.cos(a)*110,24,WIDTH-24);q.y=clamp(q.y+Math.sin(a)*110,24,HEIGHT-24);
          if(q.inv<=0){const amount=Math.round((q.id==='winnifred'?18:bossPhase===2?29:23)*(difficulty==='story'?.7:1));
            q.hp=Math.max(0,q.hp-amount);q.inv=.95;if(q.hp===0)q.alive=false;
            emit('FRIDGE REJECTION -'+amount,q.x,q.y-36,'#fff2ad');}
          else emit('SHOO!',q.x,q.y-34,'#fff2ad');
        }
        playSfx('cone');
      }
    }else if(bossPulseCooldown<=0&&players.some(p=>p.alive&&dist(p,boss)<210)){
      bossPulseWindup=.9;bossPulseCooldown=boss.rage?2.05:bossPhase===2?2.8:3.6;
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
         if(coneCooldown<=0){coneAngle=Math.atan2(p.y-boss.y,p.x-boss.x);coneWindup=boss.rage?1.05:1.4;coneCooldown=boss.rage?5.5:7.3;say('🔺 CONE OF SHAME! Dodge sideways!',1.35);playSfx('phase')}
       }
     }
     const a=Math.atan2(p.y-boss.y,p.x-boss.x),d=dist(p,boss);
     if(d>108){boss.x+=Math.cos(a)*boss.speed*dt*(boss.rage?1.16:1);boss.y+=Math.sin(a)*boss.speed*dt*(boss.rage?1.16:1)}
     // The illustrated cone cutscene triggers precisely when HP crosses 50% (in damage()).
     if(bananaWindup>0){
      bananaWindup-=dt;
      if(bananaWindup<=0){
       bananaWindup=0;
       boss.attack=boss.rage?.91:boss.hp<boss.maxHp*.5?1.09:1.4;
       const frenzy=boss.hp<boss.maxHp*.5;
       // Tolly sends warning-colored banana projectiles out from the fridge shrine.
       const count=frenzy?(boss.rage?13:10):7,base=Math.atan2(p.y-boss.y,p.x-boss.x);
       for(let j=0;j<count;j++){
         const dir=base+(j-(count-1)/2)*(.20);
         const speed=frenzy?198:176;
         hazards.push({x:boss.x+Math.cos(dir)*30,y:boss.y+Math.sin(dir)*30,
            vx:Math.cos(dir)*speed,vy:Math.sin(dir)*speed,ttl:3.3,damage:Math.ceil((frenzy?20:17)*(difficulty==='story'?.72:1))});
       }
       for(const q of players){
         if(q.alive&&dist(q,boss)<110&&q.inv<=0){
           q.hp=Math.max(0,q.hp-Math.ceil((frenzy?25:19)*(difficulty==='story'?.7:1)));q.inv=.56;
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
   const daanHazard=hazards[i];
   if(daanHazard.kind==='daan-warning'){
     daanHazard.ttl-=dt;
     if(daanHazard.ttl<=0){
       for(const p of players.filter(p=>p.alive&&dist(p,daanHazard)<daanHazard.size)){
         if(p.inv<=0){p.hp=Math.max(0,p.hp-24);p.inv=.8;if(p.hp===0)p.alive=false;emit('DAAN SHOCKWAVE -24',p.x,p.y-26,'#ffe3ab')}
       }
       hazards.splice(i,1);
     }
     continue;
   }
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
 hudClock-=dt;if(hudClock<=0){syncHud();hudClock=liteFx?.32:.23;}
}

function currentObjective(){
 if(phase!=='explore')return null;
 if(duoActive){const d=foes.find(f=>f.elite&&f.hp>0);return d?{x:d.x,y:d.y,name:'BOINK & BOCHT',hint:'Defeat the terrible twosome to unlock the final scroll!'}:null;}
 if(gate){const remaining=foes.filter(e=>e.guardian&&e.hp>0).length;
  return {...clueSpots[gate.index],name:'SAUSAGE AMBUSH · WAVE '+(gate.wave+1)+'/2',
   hint:remaining?'Defeat '+remaining+' scroll guardian'+(remaining===1?'':'s')+'!':'Next wave incoming — stay alert!'};
 }
 if(clues===0&&!gateCleared[0])return {...scentTrail[Math.min(scentStep,scentTrail.length-1)],name:'FOLLOW THE SCENT · '+scentStep+'/3',hint:'Follow the golden pawprints — investigate the next scent marker!'};
 if(clues===2&&duoDefeated&&!gateCleared[2])return {...laserNodes[Math.min(laserChallenge.index,2)],name:'LASER SECURITY · '+laserChallenge.index+'/3',hint:laserSafe()?'GREEN WINDOW! Touch the glowing terminal.':'RED LASER! Wait for a green window before entering.'};
 if(clues<3)return {...clueSpots[clues],name:'CLUE '+(clues+1)+' / 3',hint:gateCleared[clues]?'The trail or ward is cleared! Return and read the scroll.':['Track the scent trail','Survive the sausage ambush','Disarm three timed laser terminals'][clues]};
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
function syncHud(){
 $('fx-toggle').textContent=liteFx?'⚡ LITE FX ON':'✨ FULL FX';
 const dash=$('dash-status');
 if(dash){dash.replaceChildren();for(const p of players){
  const pill=document.createElement('span');pill.className='dash-pill';
  const key=p.num===0?'⇧ SHIFT':'↵ ENTER';
  pill.textContent='P'+(p.num+1)+' '+key+' = DASH · '+(p.dashCooldown<=0?'READY':p.dashCooldown.toFixed(1)+'s');
  pill.classList.toggle('on-cooldown',p.dashCooldown>0);dash.append(pill);
 }}
 updateObjective();let h='';for(const p of players){h+='<p><strong>P'+(p.num+1)+' '+p.name+'</strong> · '+Math.ceil(p.hp)+' / '+p.maxHp+' HP'+(p.id==='ellie'?' · 💚 Lick Aura':'')+'</p><div class="meter"><span style="width:'+100*clamp(p.hp/p.maxHp,0,1)+'%"></span></div>'}$('playerhud').innerHTML=h||'Choose your heroes!';
 const health=$('mobile-health');
 if(health){health.replaceChildren();for(const p of players){
  const card=document.createElement('div');card.className='mobile-health-card';
  const label=document.createElement('strong');label.textContent='P'+(p.num+1)+' · '+p.name+' · '+Math.ceil(p.hp)+'/'+p.maxHp+' HP';
  const track=document.createElement('div');track.className='meter';
  const fill=document.createElement('span');fill.style.width=(100*clamp(p.hp/p.maxHp,0,1))+'%';
  track.append(fill);card.append(label,track);health.append(card);
 }}
 const mobileQuest=$('mobile-quest');
 if(mobileQuest){
  const target=currentObjective();
  const status=document.createElement('strong');status.textContent=target?'QUEST · '+target.name:phase==='boss'?'QUEST · DEFEAT TOLLY':phase==='ended'?'QUEST COMPLETE':'QUEST · READY';
  const hint=document.createElement('span');
  hint.textContent=gate?'Defeat three guardian waves to unlock the story scene. '+(gate.wave+1)+'/3 underway.':target?target.hint:phase==='boss'?'Dodge Tolly and rescue the snacks!':'Open the invitation whenever you like.';
  mobileQuest.replaceChildren(status,hint);
 }
 const wardProgress=gate?'<div class="missionline">⚔ SCROLL '+(gate.index+1)+' · WAVE '+(gate.wave+1)+'/3 · '+foes.filter(e=>e.guardian&&e.hp>0).length+' guardians remain</div>':'';
 $('missions').innerHTML=wardProgress+'<div class="missionline '+(clues>=1?'done':'')+'">'+(clues>=1?'✓':'○')+' Find the first scroll</div><div class="missionline '+(clues>=2?'done':'')+'">'+(clues>=2?'✓':'○')+' Discover the sausage clue</div><div class="missionline '+(clues>=3?'done':'')+'">'+(clues>=3?'✓':'○')+' Reveal the fridge shrine</div><div class="missionline '+(phase==='boss'||phase==='ended'?'done':'')+'">'+(phase==='boss'||phase==='ended'?'✓':'○')+' Find Tolly</div><div class="missionline '+(phase==='ended'&&boss&&boss.hp<=0?'done':'')+'">'+(phase==='ended'&&boss&&boss.hp<=0?'✓':'○')+' Free the tasty treats & reveal Mission Two</div>';$('scoreline').textContent='Score: '+score+' · TEAM LV '+level+' · XP '+Math.floor(xp)+'/'+goal+' · NEXT PERK: '+(players[perksAwarded%players.length]?.name||'—');$('timerline').textContent='Time: '+Math.floor(elapsed/60)+':'+String(Math.floor(elapsed%60)).padStart(2,'0')+' · Snacklings boinked: '+kills;$('bestline').textContent='Personal best: '+(best||'—')}
function rect(x,y,w,h,col){cx.fillStyle=col;cx.fillRect(x,y,w,h)}function circle(x,y,r,col){cx.fillStyle=col;cx.beginPath();cx.arc(x,y,r,0,TAU);cx.fill()}function line(x1,y1,x2,y2,col,width=2){cx.strokeStyle=col;cx.lineWidth=width;cx.beginPath();cx.moveTo(x1,y1);cx.lineTo(x2,y2);cx.stroke()}
function drawQuestDressing(){
 // World-space illustration primitives: no changes to canonical character artwork.
 for(const [i,spot] of clueSpots.entries()){
  if(spot.x<cam.x-200||spot.x>cam.x+VIEWW+200||spot.y<cam.y-200||spot.y>cam.y+VIEWH+200)continue;
  const motif=i===0?'PAWPRINT TRAIL':i===1?'THE SAUSAGE INCIDENT':'LASER PROPHECY';
  const ground=i===0?'#e6c99c':i===1?'#eab4a1':'#d1a8c5';
  circle(spot.x,spot.y,100,ground+'55');
  for(let n=0;n<8;n++){const a=n*TAU/8;circle(spot.x+Math.cos(a)*88,spot.y+Math.sin(a)*88,5,ground)}
  txt(motif,spot.x,spot.y-112,15,'center','#fff2cb');
  if(i===0){for(let n=0;n<5;n++)txt('🐾',spot.x-185+n*34,spot.y+75-n*16,18,'center')}
  if(i===1){txt('🌭',spot.x+108,spot.y+32,26,'center');txt('🎾',spot.x-112,spot.y-18,22,'center')}
  if(i===2){line(spot.x-103,spot.y-75,spot.x+100,spot.y+73,'#ff8186',3);txt('⚡',spot.x+112,spot.y-40,24,'center')}
 }
 if(clues===0&&!gateCleared[0])for(let i=scentStep;i<scentTrail.length;i++){const s=scentTrail[i];if(Math.abs(s.x-cam.x)>VIEWW+80||Math.abs(s.y-cam.y)>VIEWH+80)continue;circle(s.x,s.y,29,i===scentStep?'#fff09a99':'#f4db8b33');txt('🐾',s.x,s.y+12,28,'center')}
 const f=fridge;if(f.x>=cam.x-250&&f.x<=cam.x+VIEWW+250&&f.y>=cam.y-250&&f.y<=cam.y+VIEWH+250){txt('NO BANANA',f.x,f.y-205,19,'center','#fff4ba');
 for(const a of [-1,1]){txt('🏮',f.x+a*139,f.y-52,39,'center');txt('🎀',f.x+a*112,f.y+68,24,'center')}}
}
function spritePose(p,moving){
 const state=!p.alive?'knockout':p.dash>0?'dash':
   p.healFlash>0?'special':p.inv>.05?'hurt':
   p.spriteAttackAt>=0&&elapsed-p.spriteAttackAt<.18?'attack':
   moving?'walk':'idle';
 return {state,direction:p.spriteFacing||'down'};
}
function world(){rect(0,0,VIEWW,VIEWH,'#69816d');cx.save();cx.translate(-cam.x,-cam.y);
// tiled moss and Japanese garden paths
for(let x=Math.max(0,Math.floor(cam.x/150)*150);x<Math.min(WIDTH,cam.x+VIEWW+150);x+=150)for(let y=Math.max(0,Math.floor(cam.y/150)*150);y<Math.min(HEIGHT,cam.y+VIEWH+150);y+=150){rect(x,y,149,149,(Math.floor(x/150)+Math.floor(y/150))%2?'#78917a':'#718b72');circle(x+35,y+58,20,'#7d987c')}
// mountain/stream ribbon
cx.strokeStyle='#8dc2b2';cx.lineWidth=100;cx.beginPath();cx.moveTo(100,-100);cx.bezierCurveTo(480,600,100,1000,520,1920);cx.stroke();cx.strokeStyle='#c1e2d2';cx.lineWidth=6;cx.stroke();
// main winding stone path towards fridge
cx.strokeStyle='#b6ab90';cx.lineWidth=95;cx.lineCap='round';cx.beginPath();cx.moveTo(300,400);cx.bezierCurveTo(600,350,620,760,1050,900);cx.bezierCurveTo(1430,1050,1440,1500,2180,1440);cx.stroke();cx.strokeStyle='#ddd1a8';cx.lineWidth=6;cx.setLineDash([8,20]);cx.stroke();cx.setLineDash([]);
// water bridge
rect(360,900,230,55,'#8e4d4e');for(let i=0;i<6;i++)rect(373+i*39,900,12,55,'#d28b71');line(365,885,585,885,'#7d4247',10);
for(const [ix,ob] of scenery.entries()){if(liteFx&&ix%3!==0)continue;if(ob.x<cam.x-80||ob.x>cam.x+VIEWW+80||ob.y<cam.y-80||ob.y>cam.y+VIEWH+80)continue;if(ob.t<.40){circle(ob.x,ob.y,ob.s,'#315c4c');circle(ob.x+9,ob.y-9,ob.s*.78,ob.t<.20?'#e9a4b5':'#e3c0be');circle(ob.x-12,ob.y-5,ob.s*.63,'#f7c1c6')}else if(ob.t<.68){circle(ob.x,ob.y,ob.s*.4,'#e8d99e');circle(ob.x+10,ob.y+6,ob.s*.23,'#edd5a5')}else{circle(ob.x,ob.y,ob.s*.35,'#527d5b');circle(ob.x-9,ob.y,ob.s*.35,'#4d7559')}}
drawQuestDressing();
// Laser terminals are world geometry, not character art.
if(clues===2&&duoDefeated&&!gateCleared[2]){
 for(let i=laserChallenge.index;i<laserNodes.length;i++){
  const spot=laserNodes[i],on=i===laserChallenge.index,safe=laserSafe();
  circle(spot.x,spot.y,on?55:26,on?(safe?'#86ffb06b':'#ff7f8d66'):'#af9fb066');
  cx.save();cx.strokeStyle=on?(safe?'#b0ffd3':'#ffd5d2'):'#dfd2c3';cx.lineWidth=on?5:2;
  cx.setLineDash(on?(safe?[8,8]:[3,4]):[]);cx.beginPath();cx.arc(spot.x,spot.y,on?55:27,0,TAU);cx.stroke();cx.restore();
  txt(on?(safe?'SAFE · TOUCH!':'DANGER · WAIT!'):'LOCKED',spot.x,spot.y-65,16,'center','#fff5cf');
  txt('🔴',spot.x,spot.y+12,27,'center');
 }
}
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
 if(e.x<cam.x-100||e.x>cam.x+VIEWW+100||e.y<cam.y-100||e.y>cam.y+VIEWH+100)continue;
 const bob=Math.sin(elapsed*(e.kind==='boink'?9:4)+(e.age||0)*3)*3;
 cx.save();cx.translate(e.x,e.y+bob);
 circle(0,e.size*.95,e.size*.84,'#2e465077');
 const spriteEnemy=window.Level32Sprites?.draw(cx,e.kind,
   {state:e.telegraph>0?'attack':e.slow>0?'hurt':'walk',direction:'down'},
   0,0,e.size*2.2,elapsed+(e.age||0)) || false;
 if(!spriteEnemy){
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
 }
 // Keep collision warnings, laser tells, slows and HP indicators above sprites.
 if(e.kind==='boink'&&e.telegraph>0){cx.beginPath();cx.arc(0,0,e.size+12,0,TAU);cx.strokeStyle='#ffe197';cx.lineWidth=5;cx.setLineDash([6,6]);cx.stroke();cx.setLineDash([]);txt('BOINK!',0,-e.size-22,14,'center','#ffe6a7')}
 if(e.kind==='bocht'){cx.beginPath();cx.arc(0,0,e.size+5,0,TAU);cx.strokeStyle='#b4f3fa';cx.lineWidth=2;cx.stroke()}
 if(e.slow>0){cx.beginPath();cx.arc(0,0,e.size+8,0,TAU);cx.strokeStyle='#a7edff';cx.lineWidth=4;cx.stroke()}
 if(e.elite){txt('⚠ '+e.kind.toUpperCase(),0,-e.size-25,16,'center','#fff2ac')}
 rect(-e.size,-e.size-11,e.size*2*clamp(e.hp/e.maxHp,0,1),4,'#d76c78');
 cx.restore();
}
// birthday boss
if(boss&&boss.hp>0){
 if(daanActive){
  // Symbolic animated emblem-faced Daan; NOT an approved personal likeness.
  // SPITE executes the existing delayed warning-zone slam, no damage changes.
  const dx=boss.x+140,dy=boss.y+30+Math.sin(elapsed*3.4)*3;
  const winding=daanPulse<.95,slamming=daanActionTimer>.05;
  circle(dx,dy+30,27,'#1c2d3d88');
  const spriteDaan=window.Level32Sprites?.draw(cx,'daan',
   {state:slamming?'special':winding?'attack':'idle',direction:'down'},dx,dy-13,116,elapsed)||false;
  if(!spriteDaan){
   line(dx-18,dy+8,dx-28,dy+29,'#9fd5d6',12);line(dx+18,dy+8,dx+28,dy+29,'#9fd5d6',12);
   line(dx-9,dy+34,dx-15,dy+55,'#4b4e78',13);line(dx+9,dy+34,dx+15,dy+55,'#4b4e78',13);
   circle(dx,dy+10,27,'#526997');
   if(daanPortrait.complete&&daanPortrait.naturalWidth)cx.drawImage(daanPortrait,dx-26,dy-56,52,52);
   else circle(dx,dy-36,24,'#d4ae87');
  }
  if(winding||slamming){cx.save();cx.setLineDash([6,5]);cx.strokeStyle='#ffe6a6';cx.lineWidth=4;
   cx.beginPath();cx.arc(dx,dy,43+(slamming?14*(1-daanActionTimer):0),0,TAU);cx.stroke();cx.restore();}
  txt(slamming?'DAAN · SPITE: SLAM!':winding?'DAAN · WINDING UP':'DAAN · SUPPORT',dx,dy-91,15,'center','#ffe3a0');
 }
 const wobble=Math.sin(elapsed*(boss.rage?9:4))*3;
 const portrait=$('boss-card').querySelector('img');
 const focus=nearest(boss,players);
 const facing=focus?(Math.abs(focus.x-boss.x)>Math.abs(focus.y-boss.y)
   ?(focus.x>boss.x?'right':'left'):(focus.y>boss.y?'down':'up')):'down';
 // Render the ground shadow behind the chibi, never over her face/body.
 circle(boss.x,boss.y+27,46,'#402f3a77');
 const spriteBoss=window.Level32Sprites?.draw(cx,'tolly',
    {state:boss.hitFlash>0?'hurt':bossPulseWindup>0||bananaWindup>0||coneWindup>0?'attack':
      boss.rage?'special':'walk',direction:facing},
    boss.x,boss.y+wobble-8,139,elapsed) || false;
 if(!spriteBoss)circle(boss.x,boss.y+wobble,52,boss.hitFlash>0?'#fff0d1':'#e4b9bd');
 if(bossPhase>=2){
  cx.save();cx.strokeStyle=bossPhase===3?'#ffd57f':'#ff8cbd';
  cx.lineWidth=bossPhase===3?6:3;cx.globalAlpha=.5+.2*Math.sin(elapsed*7);
  cx.beginPath();cx.arc(boss.x,boss.y+wobble,63+Math.sin(elapsed*7)*4,0,TAU);cx.stroke();
  cx.restore();
 }
 if(!spriteBoss&&portrait.complete&&portrait.naturalWidth){
   const crop=Math.min(portrait.naturalWidth,portrait.naturalHeight);
   cx.save();cx.translate(boss.x,boss.y+wobble);cx.rotate(Math.sin(elapsed*3)*.055);
   cx.beginPath();cx.arc(0,0,46,0,TAU);cx.clip();
   cx.drawImage(portrait,(portrait.naturalWidth-crop)/2,(portrait.naturalHeight-crop)/2,crop,crop,-48,-48,96,96);cx.restore();
 }else if(!spriteBoss)txt('🧑',boss.x,boss.y+21,52,'center');
 cx.save();cx.strokeStyle=boss.hitFlash>0?'#fff2ca':boss.rage?'#ff6886':bossPhase===2?'#ff959c':'#f8dea4';cx.lineWidth=5;cx.beginPath();cx.arc(boss.x,boss.y,49,0,TAU);cx.stroke();cx.restore();
 if(!spriteBoss)txt('👑',boss.x,boss.y-41+wobble,34,'center');
 txt('TOLLY · NO MORE BANANA',boss.x,boss.y-102,16,'center','#fff5ca');
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
 if(!p.alive){if(!window.Level32Sprites?.draw(cx,p.id,spritePose(p,false),p.x,p.y,54,elapsed))circle(p.x,p.y,23,'#4c5968');txt('💤',p.x,p.y+11,26,'center');txt('REVIVE P'+(p.num+1),p.x,p.y-32,16,'center','#fff4cd');cx.beginPath();cx.arc(p.x,p.y,30,-Math.PI/2,-Math.PI/2+TAU*(p.reviveProgress||0)/reviveSeconds);cx.strokeStyle='#9cffcb';cx.lineWidth=5;cx.stroke();continue}
 if(p.inv>0&&Math.floor(elapsed*16)%2)continue;
 const moving=Math.hypot(joystickAxes[p.num].x,joystickAxes[p.num].y)>.1||
   (p.num===0?['w','a','s','d']:['arrowup','arrowdown','arrowleft','arrowright']).some(k=>keys.has(k));
 const hop=moving?Math.sin(elapsed*15+p.num)*3:Math.sin(elapsed*2.7+p.num)*1.2;
 if(p.dash>0){cx.save();cx.globalAlpha=.36;circle(p.x-16,p.y+11,31,'#9be7ff');cx.restore();}
 circle(p.x,p.y+20,23,'#1b293a88');
  // Super-mode glow when a perk is chosen; rare Legendary glow persists.
  if(p.perkGlow>0||p.perkRarity==='legendary'){
    const v=p.perkRarity==='legendary'?'#ffd775':p.perkRarity==='epic'?'#d6acff':'#b6ffdd';
    const radius=28+Math.sin(elapsed*9+p.num)*4;
    cx.save();cx.globalAlpha=p.perkGlow>0?.9:.52;cx.strokeStyle=v;
    cx.lineWidth=p.perkRarity==='legendary'?5:3;
    cx.beginPath();cx.arc(p.x,p.y,radius,0,TAU);cx.stroke();
    if(!liteFx&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      for(let j=0;j<4;j++){
        const angle=elapsed*3+j*TAU/4;
        circle(p.x+Math.cos(angle)*(radius+6),p.y+Math.sin(angle)*(radius+6),3,v);
      }
    cx.restore();
  }
 const avatar=petImages[p.id];
 const spriteHero=window.Level32Sprites?.draw(cx,p.id,spritePose(p,moving),
   p.x,p.y+hop,52,elapsed) || false;
 if(!spriteHero&&avatar&&avatar.complete&&avatar.naturalWidth){
  // A readable, recognisable illustrated portrait for each actual furry friend.
  cx.save();cx.beginPath();cx.arc(p.x,p.y+hop,24,0,TAU);cx.clip();
  const scale=48/Math.min(avatar.naturalWidth,avatar.naturalHeight);
  const w=avatar.naturalWidth*scale,h=avatar.naturalHeight*scale;
  cx.drawImage(avatar,p.x-w/2,p.y+hop-h/2,w,h);cx.restore();
  cx.beginPath();cx.arc(p.x,p.y+hop,24,0,TAU);
  cx.strokeStyle=p.num===0?'#adf8db':'#ffc0c4';cx.lineWidth=3;cx.stroke();
 }else if(!spriteHero){circle(p.x,p.y,24,p.color);txt(p.emoji,p.x,p.y+16,37,'center')}
 txt('P'+(p.num+1),p.x,p.y-38,17,'center',p.num===0?'#a6ffe1':'#ffc7c3');
 // Health stays readable next to the character on phone and desktop.
 rect(p.x-28,p.y+29,56,7,'#152636');rect(p.x-27,p.y+30,54*clamp(p.hp/p.maxHp,0,1),5,p.hp/p.maxHp<.3?'#ff9995':'#9aebbb');
}
for(const s of shots){txt(s.kind==='dragon'?'🐉':s.kind==='kong'?'🧊':'🔴',s.x,s.y+9,24,'center')}
for(const h of hazards){if(h.kind==='duo-banana'){circle(h.x,h.y,17,'#e6a84b66');txt('🍌',h.x,h.y+9,23,'center');continue}if(h.kind==='daan-warning'){cx.save();cx.setLineDash([8,8]);circle(h.x,h.y,h.size,'#ffd35e38');cx.strokeStyle='#ffe4a3';cx.lineWidth=5;cx.beginPath();cx.arc(h.x,h.y,h.size,0,TAU);cx.stroke();cx.restore();txt('DAAN SPITE · MOVE!',h.x,h.y-85,18,'center','#fff1ae')}else if(h.kind==='goop'){circle(h.x,h.y,22,'#88e5e977');circle(h.x,h.y,13,'#b0f6ff99')}else{circle(h.x,h.y,17,'#ffbd6144');txt('🍌',h.x,h.y+9,25,'center')}}
if(boss&&boss.hp>0&&coneWindup>0){cx.save();cx.beginPath();cx.moveTo(boss.x,boss.y);cx.arc(boss.x,boss.y,275,coneAngle-.65,coneAngle+.65);cx.closePath();cx.fillStyle='#ff69735d';cx.fill();cx.strokeStyle='#ffeeb1';cx.lineWidth=5;cx.stroke();cx.restore()}
for(const beam of beams){cx.save();cx.globalAlpha=Math.max(.1,beam.t/.28);cx.strokeStyle='#ff586a';cx.lineWidth=13;cx.shadowColor='#ff7373';cx.shadowBlur=17;cx.beginPath();cx.moveTo(beam.x1,beam.y1);cx.lineTo(beam.x2,beam.y2);cx.stroke();cx.strokeStyle='#fff2b5';cx.lineWidth=4;cx.stroke();cx.restore()}
for(const f of fx){if(f.x<cam.x-60||f.x>cam.x+VIEWW+60||f.y<cam.y-60||f.y>cam.y+VIEWH+60)continue;txt(f.text,f.x,f.y,17,'center',f.col)}
cx.restore();}
function txt(t,x,y,size=20,align='left',color='#fff6de'){cx.textAlign=align;cx.font='bold '+size+'px system-ui, sans-serif';cx.fillStyle=color;if(!liteFx){cx.shadowColor='#28323b';cx.shadowBlur=3;}cx.fillText(t,x,y);cx.shadowBlur=0}
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
function render(){let live=players.filter(p=>p.alive);let center=live.length?{x:live.reduce((a,p)=>a+p.x,0)/live.length,y:live.reduce((a,p)=>a+p.y,0)/live.length}:{x:400,y:400};cam.x=clamp(center.x-VIEWW/2,0,WIDTH-VIEWW);cam.y=clamp(center.y-VIEWH/2,0,HEIGHT-VIEWH);world();drawObjectiveMarker();drawOffscreenArrows();rect(0,0,VIEWW,42,'#1a273ac9');txt('🌸 SAKURA GARDEN · '+(phase==='boss'?'FRIDGE DEFENCE':'THE GREAT SNACK RIFT'),15,28,18);txt('🐾 '+kills+'  ✨ LV '+level+'  🧾 '+clues+'/3  '+(difficulty==='story'?'🌼 STORY':difficulty==='extreme'?'⚠ EXTREME 10/10':'⚔ ADVENTURE'),VIEWW-17,28,17,'right');let dx=fridge.x-center.x,dy=fridge.y-center.y;if(clues>=3&&phase==='explore')txt('🧭 FRIDGE '+Math.round(Math.hypot(dx,dy))+'m',VIEWW/2,28,17,'center','#ffe6a4')}
function loop(now){let dt=Math.min(.045,(now-lastTime)/1000||.016);lastTime=now;if(!paused&&phase!=='ended'&&phase!=='cutscene')update(dt);render();if(phase!=='ended')raf=requestAnimationFrame(loop)}
function togglePause(){
 if(phase==='idle'||phase==='ended'||phase==='cutscene')return;
 paused=!paused;
 $('paws-quip').textContent=EXTRA_BANTER.paws[Math.floor(elapsed/7)%EXTRA_BANTER.paws.length].map((v,i)=>i===0?v.toUpperCase()+': ':v).join('');
 $('pause').textContent=paused?'▶ UNLEASH THE PAWSIBILITIES':'Ⅱ PAWS';
 $('paws-panel').hidden=!paused;
 if(!paused){lastTime=performance.now();raf=requestAnimationFrame(loop)}
 else cancelAnimationFrame(raf);
 $('game-message').textContent=paused?'PAWSITIVELY NECESSARY INTERMISSION':'THE QUEST IS UN-PAWSED!';
}
const inviteHref=location.pathname.includes('/game/')?'invitation.html':'game/invitation.html';
document.querySelectorAll('[data-invitation-link]').forEach(link=>link.setAttribute('href',inviteHref));
$('scene-skip').addEventListener('click',()=>{
 if(phase!=='cutscene'||performance.now()-sceneOpenedAt<350)return;
 $('scene-dialogues').dataset.beat=String($('scene-dialogues').querySelectorAll('.scene-line').length-1);
 continueScene();
});
$('share-result').addEventListener('click',async()=>{
 if(phase!=='ended')return;
 const text=scoreText(Boolean(boss&&boss.hp<=0));
 try{await navigator.clipboard.writeText(text);$('share-status').textContent='Copied! Paste it into our WhatsApp group.';}
 catch{$('share-status').textContent='Copy blocked by this browser. Take a screenshot of your score instead.';}
});
$('fx-toggle').addEventListener('click',()=>{liteFx=!liteFx;syncHud()});
// The owner-approved visuals can be reverted instantly for real-device QA.
const spriteButton=$('sprite-toggle');
function updateSpriteToggle(){
 const on=Boolean(window.Level32Sprites?.previewEnabled);
 spriteButton.textContent=on?'🐾 CHIBI ON · CLASSIC?':'🖼 CLASSIC ON · CHIBI?';
 spriteButton.setAttribute('aria-pressed',String(on));
}
spriteButton.addEventListener('click',()=>{
 window.Level32Sprites?.setPreviewEnabled(!window.Level32Sprites.previewEnabled);
 updateSpriteToggle();
});
updateSpriteToggle();
$('start').addEventListener('click',start);$('overlay-start').addEventListener('click',()=>{
 if(phase==='cutscene'){if(performance.now()-sceneOpenedAt>350)continueScene();}
 else start();
});$('restart').addEventListener('click',start);$('pause').addEventListener('click',togglePause);$('mute').addEventListener('click',()=>{audioEnabled=!audioEnabled; if(audioCtx){audioEnabled?audioCtx.resume():audioCtx.suspend()} $('mute').textContent=audioEnabled?'🔊 MUSIC + SFX':'🔇 SOUND OFF'; if(audioEnabled) ensureAudio();});
function tryDash(id){
 if(!['boss','explore'].includes(phase)||paused)return;
 const p=players[id];if(!p||!p.alive||p.dashCooldown>0)return;
 emit('DASH!',p.x,p.y-55,'#aaf5ff');p.dash=.18;p.dashCooldown=p.id==='ellie'?2.2:3.4;p.inv=Math.max(p.inv,.18);playSfx('dash');
}
// Device rotation is an opt-in enhancement. iOS/browser privacy restrictions can
// reject landscape locks; the responsive web layout still works without them.
$('focus-play').addEventListener('click',async()=>{
 const status=$('focus-status');
 try{
  if(document.fullscreenElement){await document.exitFullscreen();status.textContent='Wide play closed.';return}
  if(!$('game-section').requestFullscreen)throw Error('Fullscreen not supported here');
  await $('game-section').requestFullscreen();
  try{if(screen.orientation&&screen.orientation.lock)await screen.orientation.lock('landscape')}
  catch{status.textContent='Fullscreen opened. Rotate your phone sideways if it did not turn automatically.';return}
  status.textContent='Wide play enabled. Rotate your phone if needed.';
 }catch{status.textContent='Your browser cannot open landscape fullscreen. Rotate your phone manually; the controls will adapt.'}
});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden&&!paused&&(phase==='explore'||phase==='boss'))togglePause();
});
window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();
 if(phase==='upgrade'){e.preventDefault();return;}
 if(phase==='cutscene'){
   if(['arrowup','arrowdown','arrowleft','arrowright',' ','w','a','s','d','shift','enter'].includes(k))e.preventDefault();
   if(k==='c'){e.preventDefault();if(!e.repeat&&performance.now()-sceneOpenedAt>350)continueScene();}
   return;
 }
 if(['arrowup','arrowleft','arrowright','arrowdown',' '].includes(k))e.preventDefault();
 if(!e.repeat&&(k==='shift'||k==='enter'))tryDash(k==='shift'?0:1);
 if(k==='escape')togglePause();keys.add(k);
});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());
for(const b of document.querySelectorAll('[data-dash]'))b.addEventListener('pointerdown',e=>{e.preventDefault();tryDash(Number(b.dataset.dash));});
for(const pad of document.querySelectorAll('[data-joystick]')){
 const axis=joystickAxes[Number(pad.dataset.joystick)],knob=pad.querySelector('.joystick-knob');
 let active=null;
 function position(e){
  const box=pad.getBoundingClientRect(),cx=box.left+box.width/2,cy=box.top+box.height/2;
  const radius=box.width*.36,dx=e.clientX-cx,dy=e.clientY-cy,m=Math.hypot(dx,dy),ratio=m>radius?radius/m:1;
  const magnitude=Math.min(1,m/radius),analog=Math.max(0,(magnitude-.13)/.87);
  axis.x=m>.001?dx/m*analog:0;axis.y=m>.001?dy/m*analog:0;
  knob.style.transform='translate('+Math.round(dx*ratio)+'px,'+Math.round(dy*ratio)+'px)';
 }
 function release(e){if(active!==null&&(e.pointerId===active||!e.pointerId)){active=null;axis.x=axis.y=0;knob.style.transform='translate(0px,0px)'}}
 pad.addEventListener('pointerdown',e=>{if(active!==null)return;e.preventDefault();active=e.pointerId;pad.setPointerCapture(active);position(e)});
 pad.addEventListener('pointermove',e=>{if(active!==e.pointerId)return;e.preventDefault();position(e)});
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(ev,release);
 }
 window.addEventListener('blur',()=>{joystickAxes.forEach(a=>{a.x=a.y=0});document.querySelectorAll('.joystick-knob').forEach(k=>k.style.transform='translate(0px,0px)')})
// idle garden behind the opening card
players=[player('rosie',0),player('winnifred',1)];render();syncHud();
})();