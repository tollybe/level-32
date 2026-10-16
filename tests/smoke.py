import sys,re,json, traceback, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT/'tools'))
from build import game_as_single_html
html=game_as_single_html()
# Party mission times must agree in the invitation, game hint, and calendar.
invite_text=(ROOT/'game/invitation.html').read_text(encoding='utf-8')
calendar=(ROOT/'game/birthday.ics').read_text(encoding='utf-8')
game_text=(ROOT/'game/index.html').read_text(encoding='utf-8')
assert calendar.count('BEGIN:VEVENT')==2 and calendar.count('END:VEVENT')==2
assert invite_text.count('href="birthday.ics" download="level32-birthday.ics"')==1
assert game_text.count('href="birthday.ics" download="level32-birthday.ics"')==1
assert 'MISSION ONE · 18:15–20:15' in invite_text
assert 'Mission One begins at 18:15' in game_text
assert 'DTSTART;TZID=Europe/Amsterdam:20261113T181500' in calendar
assert 'DTEND;TZID=Europe/Amsterdam:20261113T201500' in calendar
assert 'MISSION TWO · 20:40' in invite_text
assert 'DTSTART;TZID=Europe/Amsterdam:20261113T204000' in calendar
assert '183000' not in calendar and '203000' not in calendar

hook='''window.__rosieTest={
 start(){start();cancelAnimationFrame(raf);players.forEach(p=>p.inv=9999);spawnClock=9999;surgeClock=9999;return this.state()},
 place(i){players[0].x=clueSpots[i].x;players[0].y=clueSpots[i].y;update(.016);return this.state()},
 track(){for(const spot of scentTrail){players[0].x=spot.x;players[0].y=spot.y;update(.016)}return this.state()},
 solveLaser(){laserChallenge.timer=2.0;for(const spot of laserNodes){players[0].x=spot.x;players[0].y=spot.y;update(.016)}return this.state()},
 joystickCheck(){const p=players[0],before=p.x;joystickAxes[0].x=.35;joystickAxes[0].y=0;movePlayers(.1);const partial=p.x-before;joystickAxes[0].x=1;movePlayers(.1);const full=p.x-before-partial;joystickAxes[0].x=0;return {partial,full}},
 dualStickCheck(){if(players.length<2)return null;const a=players[0].x,b=players[1].x;
   joystickAxes[0].x=.8;joystickAxes[1].x=-.6;movePlayers(.04);joystickAxes[0].x=joystickAxes[1].x=0;
   return {first:players[0].x-a,second:players[1].x-b}},
 unsafeLaser(){laserChallenge.timer=0;const node=laserNodes[laserChallenge.index];
   players[0].x=node.x;players[0].y=node.y;update(.016);return this.state()},
 step(){update(.016);return this.state()},
 clearGuards(){for(let n=0;n<4&&gate;n++){
  foes.filter(e=>e.guardian&&e.hp>0).forEach(e=>e.hp=0);
  gate.remainingDelay=0;update(.016);
 }return this.state()},
 bossCampCheck(){
  if(phase!=='boss'||!boss)throw Error('Expected boss encounter');
  const p=players[0];p.x=boss.x;p.y=boss.y;p.inv=0;
  const at={x:p.x,y:p.y,hp:p.hp},hp=boss.hp;
  bossPulseCooldown=0;boss.attack=9999;spawnClock=9999;surgeClock=9999;
  movePlayers(.016);
  const pushed=dist(p,boss)>=boss.size+43.9;
  for(let n=0;n<45&&phase==='boss';n++)update(.04);
  const result={pushed,hpBefore:at.hp,hpAfter:p.hp,bossBefore:hp,bossAfter:boss.hp,phase};
  p.inv=9999;return result;
 },
 continue(){for(let i=0;i<12&&phase==='cutscene';i++)continueScene();return this.state()},
 killsDuo(){for(const e of foes.filter(f=>f.elite&&f.hp>0))damage(e,e.hp+1,players[0]);return this.state()},
 nearFridge(){players[0].x=fridge.x;players[0].y=fridge.y;update(.016);return this.state()},
 hitBoss(){if(!boss)throw Error('no boss');damage(boss,Math.ceil(boss.maxHp*.52),players[0]);return this.state()},
 killBoss(){damage(boss,boss.hp+9999,players[0]);return this.state()},
 lose(){resetEnd(false);return this.state()},
 dragonPierceCheck(){
  const saved={foes,shots,boss,phase,fx,ambush:players[0].ambushReady};players[0].ambushReady=0;
  const targets=[320,365,410].map(x=>({x,y:200,hp:200,maxHp:200,size:12,kind:'bleepling'}));
  const shot={x:290,y:200,vx:3000,vy:0,ttl:1,kind:'dragon',damage:17,owner:0,pierce:1,hitTargets:new Set()};
  foes=targets;shots=[shot];boss=null;phase='explore';fx=[];
  advanceProjectiles(.045);
  const value={hp:targets.map(t=>t.hp),hits:shot.hitTargets.size,left:shots.length};
  foes=saved.foes;shots=saved.shots;boss=saved.boss;phase=saved.phase;fx=saved.fx;players[0].ambushReady=saved.ambush;
  return value;
 },
 triggerDaanSpite(){
  if(!daanActive)return {active:false};
  daanPulse=.02;update(.04);
  return {active:daanActive,action:daanActionTimer,warning:hazards.some(h=>h.kind==='daan-warning')};
 },
 phase3(){if(!boss)throw Error('no boss');damage(boss,boss.maxHp*.19,players[0]);return this.state()},
 duoGap(){const pair=foes.filter(e=>e.elite&&e.hp>0);return pair.length===2?dist(pair[0],pair[1]):0},
 musicModeNow(){return currentMusic()},
 perkProbe(){
  const previous={level,xp,goal,phase,perksAwarded,players:players.map(p=>({hp:p.hp,maxHp:p.maxHp,speed:p.speed,damage:p.damage,perkGlow:p.perkGlow,perkRarity:p.perkRarity}))};
  const oldLevel=level;level=4;xp=goal-1;gainXP(2);
  const offered=phase==='upgrade'&&Boolean(perkOffer),choices=$('perk-choices').querySelectorAll('button').length;
  const rarities=perkOffer?.offers.map(x=>x.rarity)||[];
  acceptUpgrade(0);
  const closed=phase===previous.phase&&$('perk-panel').hidden&&!perkOffer;
  level=previous.level;xp=previous.xp;goal=previous.goal;perksAwarded=previous.perksAwarded;
  players.forEach((p,i)=>Object.assign(p,previous.players[i]));
  return {offered,choices,rarities,closed,level:oldLevel};
 },
 perkAlternationProbe(){
  const old={level,xp,goal,phase,perksAwarded,perkOffer,perkReturnPhase,
   stats:players.map(p=>({hp:p.hp,maxHp:p.maxHp,speed:p.speed,damage:p.damage,
      perkGlow:p.perkGlow,perkRarity:p.perkRarity}))};
  let order=[],labels=[];
  perksAwarded=0;
  for(const wanted of [5,10,15]){
   level=wanted-1;xp=goal-1;gainXP(2);
   order.push(perkOffer?.player?.num??-1);
   labels.push($('perk-who').textContent);
   acceptUpgrade(0);
  }
  const count=perksAwarded;
  level=old.level;xp=old.xp;goal=old.goal;phase=old.phase;perksAwarded=old.perksAwarded;
  perkOffer=old.perkOffer;perkReturnPhase=old.perkReturnPhase;$('perk-panel').hidden=true;
  players.forEach((p,i)=>Object.assign(p,old.stats[i]));
  return {order,labels,count};
 },
 daanHealProbe(){
  if(!daanActive||!boss)return {active:false};
  const old={hp:boss.hp,daanHealCooldown,daanHealWindup,daanHealsRemaining,
   daanHealFlash,daanPulse,daanActionTimer,hazards:hazards.slice()};
  boss.hp=boss.maxHp*.25;daanHealsRemaining=2;daanHealWindup=0;daanHealCooldown=.01;
  daanPulse=999; // test healing isolated from the boulder cooldown
  let casts=[],warnings=[];
  for(let i=0;i<2;i++){
   daanHealCooldown=.01;update(.02);
   warnings.push(daanHealWindup>1.35);
   update(1.5);
   casts.push(boss.hp);
  }
  daanHealCooldown=0;update(.02);
  const capped=daanHealsRemaining===0&&daanHealWindup<=0&&
    boss.hp<=boss.maxHp*.43+1e-5;
  boss.hp=old.hp;daanHealCooldown=old.daanHealCooldown;
  daanHealWindup=old.daanHealWindup;daanHealsRemaining=old.daanHealsRemaining;
  daanHealFlash=old.daanHealFlash;daanPulse=old.daanPulse;
  daanActionTimer=old.daanActionTimer;hazards=old.hazards;
  return {active:true,casts,warnings,capped,maxHp:boss.maxHp};
 },
 xpProbe(){
  const old={level,xp,goal},modes={};
  level=6;goal=999999;xp=0;gainXP(10);modes.afterFive=xp;
  level=5;xp=0;gainXP(10);modes.firstFive=xp;
  level=old.level;xp=old.xp;goal=old.goal;
  return modes;
 },
 heroBalance(){return Object.fromEntries(Object.entries(roster).map(([key,v])=>[key,Math.round(v.damage/v.rate)]))},
 combatMatrix(){
   const previous={selected:selected.slice(),mode:$('difficulty').value,coop:$('coop').checked};
   const results=[];
   for(const mode of ['story','challenge','extreme']){
    $('difficulty').value=mode;$('coop').checked=false;
    for(const hero of Object.keys(roster)){
     selected=[hero,hero];start();cancelAnimationFrame(raf);
     const p=players[0];
     beginGuardian(0);
     const guardians=foes.filter(e=>e.guardian);
     foes=[];gate=null;spawnDuo();
     const elites=foes.filter(e=>e.elite);
     // Force the same scripted attack phase; only Extreme should fire.
     for(const e of elites){e.volleyWarmup=.04;updateDuoVolley(e,.05);updateDuoVolley(e,.001)}
     const banana=hazards.filter(h=>h.kind==='duo-banana');
     const signature=banana.map(h=>({source:h.source,vx:h.vx,vy:h.vy}));
     results.push({mode,hero,heroHp:p.maxHp,baseHp:roster[hero].hp,
       guardians:guardians.length,guardianHp:guardians[0].maxHp,
       guardianDamage:guardians[0].damage,
       eliteHp:elites.map(e=>e.maxHp),banana:signature,
       startingLevel:level});
    }
   }
   selected=previous.selected;$('difficulty').value=previous.mode;
   $('coop').checked=previous.coop;start();cancelAnimationFrame(raf);
   players.forEach(p=>p.inv=9999);spawnClock=9999;surgeClock=9999;
   return results;
 },
 sceneVisibleAndReady(){const art=$('overlay-art'),overlay=$('overlay');
   return !overlay.classList.contains('hidden')&&art.complete&&art.naturalWidth>0 &&
     !art.classList.contains('scene-art-pending')},
 soundtrackConfig(){return {modes:Object.keys(battleScores),legendaryBpm:battleScores.boss3.bpm,
   tiers:DIFFICULTY_BALANCE}},
 duoMachineGunProbe(){
  const prev={hazards:hazards.slice(),duoActive,mode:difficulty};
  const two=foes.filter(e=>e.elite&&['boink','bocht'].includes(e.kind)&&e.hp>0);
  if(two.length!==2)return {error:'missing two elites'};
  const original=two.map(e=>({e,volleyWarmup:e.volleyWarmup,volleyCooldown:e.volleyCooldown,
   volleyShots:e.volleyShots,volleyShotClock:e.volleyShotClock,volleyShotIndex:e.volleyShotIndex}));
  difficulty='extreme';duoActive=true;hazards=[];
  const staggered=two[0].volleyCooldown<two[1].volleyCooldown;
  for(const e of two){e.volleyWarmup=0;e.volleyCooldown=e.kind==='boink'?.4:1.0;
   e.volleyShots=0;e.volleyShotClock=0;e.volleyShotIndex=0}
  let warningFirst=false,overlap=false;
  for(let i=0;i<150;i++){
   two.forEach(e=>updateDuoVolley(e,.02));
   if(two[0].volleyWarmup>0&&two[1].volleyWarmup===0)warningFirst=true;
   if(two.every(e=>e.volleyShots>0))overlap=true;
  }
  const fired=hazards.filter(h=>h.kind==='duo-banana');
  const count=Object.fromEntries(two.map(e=>[e.kind,fired.filter(h=>h.source===e.kind).length]));
  const cooldown=two.every(e=>e.volleyShots===0&&e.volleyCooldown>.5&&e.volleyCooldown<=5.7);
  const directional=fired.every(h=>{const x=Math.abs(h.vx),y=Math.abs(h.vy);
    return h.source==='boink'?Math.min(x,y)<1e-6:Math.abs(x-y)<1e-6});
  const random=Math.random;let loB,loC,hiB,hiC;
  try{
   Math.random=()=>0;loB=nextDuoCooldown('boink');loC=nextDuoCooldown('bocht');
   Math.random=()=>.999;hiB=nextDuoCooldown('boink');hiC=nextDuoCooldown('bocht');
  }finally{Math.random=random}
  const ranges=loB>=2.1&&loB<2.11&&hiB>5&&hiB<5.1&&
    loC>=2.7&&loC<2.71&&hiC>5.6&&hiC<5.7;
  for(const o of original)Object.assign(o.e,{volleyWarmup:o.volleyWarmup,volleyCooldown:o.volleyCooldown,
   volleyShots:o.volleyShots,volleyShotClock:o.volleyShotClock,volleyShotIndex:o.volleyShotIndex});
  hazards=prev.hazards;duoActive=prev.duoActive;difficulty=prev.mode;
  return {staggered,warningFirst,overlap,count,cooldown,directional,ranges};
 },
 bushAmbushProbe(){
  const old={phase,foes,shots,beams,boss,hazards,laserUnlocked,worldBubbles:worldBubbles.slice(),
   poses:players.map(p=>({x:p.x,y:p.y,hp:p.hp,inv:p.inv,hidden:p.hidden,bushTime:p.bushTime,
    bushId:p.bushId,ambushReady:p.ambushReady,cool:p.cool,laserCooldown:p.laserCooldown}))};
  phase='explore';foes=[];shots=[];beams=[];boss=null;hazards=[];laserUnlocked=false;
  const b=bushes[0],p=players[0];
  players.forEach(q=>{q.x=b.x;q.y=b.y;q.cool=0;q.inv=0;q.laserCooldown=0});
  updateBushes(.6);
  const mob={x:b.x+125,y:b.y,hp:1000,maxHp:1000,size:18,kind:'bleepling',
   speed:0,attack:999,damage:1,slow:0,age:0};
  foes=[mob];
  shots.push({owner:0,x:b.x,y:b.y,vx:400,vy:0,ttl:1,kind:'ball',damage:10,pierce:0,hitTargets:new Set()});
  beams.push({owner:0,x1:b.x,y1:b.y,x2:b.x+90,y2:b.y,t:.2});
  update(.02);
  const noAttacks=shots.length===0&&beams.length===0&&mob.hp===1000&&players.every(q=>q.hidden);
  p.x=b.x+90;updateBushes(.02);const armed=p.ambushReady>0;
  const hp=mob.hp;damage(mob,10,p);const crit=mob.hp===hp-20&&p.ambushReady===0;
  p.ambushReady=2;
  const elite={x:p.x,y:p.y,hp:200,maxHp:200,kind:'boink',elite:true,size:22};
  damage(elite,10,p);const eliteImmune=elite.hp===190&&p.ambushReady===2;
  boss={x:p.x,y:p.y,hp:1000,maxHp:1000,hitFlash:0,rage:false};
  damage(boss,10,p);const bossImmune=boss.hp===990&&p.ambushReady===2;
  boss=null;p.x=b.x;p.y=b.y;p.inv=0;updateBushes(.6);p.ambushReady=0;
  hazards=[{kind:'duo-banana',source:'bocht',x:b.x-10,y:b.y,vx:255,vy:0,damage:8,size:18,ttl:1}];
  const hp2=p.hp;update(.02);
  const knocked=!p.hidden&&p.bushId===-1&&dist(p,b)>51&&p.hp===hp2-2&&p.ambushReady===0;
  const ow=worldBubbles.some(x=>x.speaker===p.id&&x.line.startsWith('OW!'));
  const consumed=hazards.length===0;
  phase=old.phase;foes=old.foes;shots=old.shots;beams=old.beams;
  boss=old.boss;hazards=old.hazards;laserUnlocked=old.laserUnlocked;worldBubbles=old.worldBubbles;
  players.forEach((q,i)=>Object.assign(q,old.poses[i]));
  return {noAttacks,armed,crit,eliteImmune,bossImmune,knocked,ow,consumed};
 },
 nicknameProbe(){
  const was=difficulty,names=Object.values(TOLLY_NICKNAMES);
  difficulty='extreme';renderSceneLines('phase3');
  const lines=[...document.querySelectorAll('#scene-dialogues .scene-line')].map(el=>el.textContent);
  difficulty=was;
  return {names,lines,theme:ROSIE_THEME};
 },
 bushStealthProbe(){
  const was={phase,gate,foes:foes.slice(),boss,bushEggSeen,
   pos:players.map(p=>({x:p.x,y:p.y,hidden:p.hidden,bushTime:p.bushTime,bushId:p.bushId,ambushReady:p.ambushReady}))};
  const b=bushes[0];phase='explore';gate=null;boss=null;foes=[];
  players.forEach(p=>{p.x=b.x;p.y=b.y;p.inv=9999});
  updateBushes(.1);
  const hidden=players.every(p=>p.hidden);
  const cannotFire=(()=>{const count=shots.length;const target={x:b.x+45,y:b.y,hp:100,size:12};
   foes=[target];for(const p of players)fire(p);
   return shots.length===count&&target.hp===100;
  })();
  const notTargeted=nearest({x:b.x,y:b.y},players)===null;
  foes[0].kind='bleepling';foes[0].attack=99;foes[0].slow=0;
  update(.1);const question=Boolean(foes[0].searching);
  bushEggSeen=false;updateBushes(30.1);
  const easter=phase==='cutscene'&&sceneName==='bushEgg';
  if(easter)for(let i=0;i<10&&phase==='cutscene';i++)continueScene();
  players.forEach(p=>{p.x=b.x+125;p.y=b.y});
  updateBushes(.1);
  const visible=players.every(p=>!p.hidden);
  phase=was.phase;gate=was.gate;foes=was.foes;boss=was.boss;
  bushEggSeen=was.bushEggSeen;
  players.forEach((p,i)=>Object.assign(p,was.pos[i]));
  return {hidden,cannotFire,notTargeted,question,easter,visible};
 },
 bossWinstonProbe(){
  if(!boss||phase!=='boss')return {error:'not at Tolly'};
  const orig={bossBushVisits,bossBushOccupied,winston,winstonForcedReveal,worldBubbles:worldBubbles.slice(),
    pos:players.map(p=>({x:p.x,y:p.y,hidden:p.hidden,bushTime:p.bushTime,bushId:p.bushId}))};
  bossBushVisits=0;bossBushOccupied=false;winston=null;winstonForcedReveal=0;worldBubbles=[];
  const b=bushes[3];players.forEach(p=>{p.x=b.x;p.y=b.y});
  updateBushes(.05);const first=bossBushVisits===1&&!winston;
  players.forEach(p=>{p.x=b.x+160;p.y=b.y});
  updateBushes(.05);
  players.forEach(p=>{p.x=b.x;p.y=b.y});
  updateBushes(.05);const second=bossBushVisits===2&&Boolean(winston);
  updateBushes(8.1);const shakes=Boolean(winston?.shaking)&&!winston?.complete;
  updateBushes(2.0);const exposed=Boolean(winston?.complete)&&winstonForcedReveal>0&&players.every(p=>!p.hidden);
  const words=worldBubbles.map(b=>b.line).join(' ');
  const textOK=words.includes("WINSTON")&&words.includes('AHAHAHAH');
  bossBushVisits=orig.bossBushVisits;bossBushOccupied=orig.bossBushOccupied;winston=orig.winston;
  winstonForcedReveal=orig.winstonForcedReveal;worldBubbles=orig.worldBubbles;
  players.forEach((p,i)=>Object.assign(p,orig.pos[i]));
  return {first,second,shakes,exposed,textOK};
 },
 pairDialogueProbe(){
  const saved={players,worldBubbles:worldBubbles.slice(),pairBanterClock,
   pairConversation,pairBanterVisits:{...pairBanterVisits}};
  const keys=Object.keys(PAIR_BANTER),details=[];
  for(const key of keys){
   players=key.split('|').map((id,i)=>player(id,i));
   players[0].x=players[1].x;players[0].y=players[1].y;
   worldBubbles=[];pairBanterClock=0;pairConversation=null;pairBanterVisits={};
   const encounters=[],sequential=[];
   for(let visit=0;visit<3;visit++){
    worldBubbles=[];pairBanterClock=0;
    const prior=worldBubbles.length;
    updatePairBanter(.1);
    const first=worldBubbles[worldBubbles.length-1]?.line;
    const initialSingle=worldBubbles.length===prior+1;
    let ordered=true,steps=0;
    while(pairConversation&&steps++<12){
     const before=worldBubbles.length;
     updatePairBanter(2.8);
     ordered=ordered&&worldBubbles.length===before+1;
    }
    sequential.push(initialSingle&&ordered&&!pairConversation);
    encounters.push({first,lines:worldBubbles.slice(prior).map(x=>x.line)});
   }
   details.push({key,encounters,visits:pairBanterVisits[key],sequential:sequential.every(Boolean)});
  }
  players=saved.players;worldBubbles=saved.worldBubbles;
  pairBanterClock=saved.pairBanterClock;pairConversation=saved.pairConversation;
  pairBanterVisits=saved.pairBanterVisits;
  return details;
 },
 gardenProbe(){
  const original={trees:cherryTrees,grass:grassTufts,seed:gardenSeed};
  const runs=[],seen=new Set();
  for(let i=0;i<8;i++){
   generateGarden();
   const valid=cherryTrees.every((p,index)=>treeSiteSafe(p,cherryTrees.slice(0,index)));
   const mark=cherryTrees.slice(0,3).map(p=>Math.floor(p.x)+':'+Math.floor(p.y)).join(',');
   runs.push({count:cherryTrees.length,grass:grassTufts.length,valid});
   seen.add(mark);
  }
  const stationary=grassLean({x:100,y:100},[{alive:true,spriteMoving:false,x:90,y:100}]);
  const moving=grassLean({x:100,y:100},[{alive:true,spriteMoving:true,x:90,y:100}]);
  const far=grassLean({x:100,y:100},[{alive:true,spriteMoving:true,x:400,y:400}]);
  cherryTrees=original.trees;grassTufts=original.grass;gardenSeed=original.seed;
  return {runs,distinct:seen.size,stationary,moving,far,treeAsset:treeArt.src.includes('cherry-tree.svg')||
   treeArt.src.startsWith('data:image/svg+xml')};
 },
 treeDepthProbe(){
  const saved=cherryTrees;
  const tree={x:1200,y:1100,scale:1,phase:0},tr=treeTrunk(tree);
  cherryTrees=[tree];
  const moving={x:tr.x-115,y:tr.y};
  let tunneled=false;
  for(let i=0;i<15;i++){
   moveAroundTrees(moving,35,0,18);if(blockedByTree(moving.x,moving.y,18))tunneled=true;
  }
  const blocked=moving.x<tr.x-37&&Math.abs(moving.y-tr.y)<1;
  const embedded={x:tr.x,y:tr.y};
  moveAroundTrees(embedded,1,0,18);
  const escaped=!blockedByTree(embedded.x,embedded.y,18);
  const sliding={x:tr.x-80,y:tr.y+5};
  for(let i=0;i<15;i++){
   moveAroundTrees(sliding,9,7,18);
   if(blockedByTree(sliding.x,sliding.y,18))tunneled=true;
  }
  const mob={x:tr.x-95,y:tr.y};
  for(let i=0;i<110;i++){
   const dx=tr.x+140-mob.x,dy=tr.y-mob.y,d=Math.hypot(dx,dy)||1;
   const v=steerAroundTrees(mob,dx/d,dy/d,19);
   moveAroundTrees(mob,v.x*2.5,v.y*2.5,19);
   if(blockedByTree(mob.x,mob.y,19))tunneled=true;
  }
  const playerFade=cherryCanopyOpacity(tree,[{x:tree.x,y:tree.y-95,hp:100,alive:true}],[]);
  const mobFade=cherryCanopyOpacity(tree,[],[{x:tree.x,y:tree.y-95,hp:100}]);
  const normal=cherryCanopyOpacity(tree,[],[]);
  cherryTrees=saved;
  return {blocked,escaped,slides:sliding.y>tr.y+15,steers:mob.x>tr.x+30,
    tunneled,playerFade,mobFade,normal};
 },
 millieDoubleDashProbe(){
  const saved={phase,paused,players,selected,trees:cherryTrees};
  phase='explore';paused=false;cherryTrees=[];
  const p=player('millie',0);players=[p];
  const before=p.dashCharges;
  tryDash(0);const first=p.dashCharges;
  tryDash(0);const second=p.dashCharges;
  tryDash(0);const third=p.dashCharges;
  const clocks=p.dashRecharge.length;
  p.dashRecharge=p.dashRecharge.map(t=>t-3.31);
  for(let i=p.dashRecharge.length-1;i>=0;i--)if(p.dashRecharge[i]<=0){
    p.dashRecharge.splice(i,1);p.dashCharges=Math.min(2,p.dashCharges+1);
  }
  const recharged=p.dashCharges;
  const other=player('rosie',0);players=[other];
  tryDash(0);const normalFirst=other.dashCooldown>0;
  tryDash(0);const normalSecond=other.dashCooldown>0;
  phase=saved.phase;paused=saved.paused;players=saved.players;
  selected=saved.selected;cherryTrees=saved.trees;
  return {before,first,second,third,clocks,recharged,normalFirst,normalSecond};
 },
 teamXPBarProbe(){
  const prev={xp,goal,level},val=goal*.5;
  xp=val;level=2;syncHud();
  const element=$('team-xp-progress');
  const result={progress:parseFloat($('team-xp-fill').style.width),
   actual:element.getAttribute('aria-valuenow'),
   max:element.getAttribute('aria-valuemax'),
   label:$('team-level-label').textContent,
   perk:$('team-perk-label').textContent,
   visible:!!element.getClientRects().length};
  xp=prev.xp;goal=prev.goal;level=prev.level;syncHud();
  return result;
 },
 snackPowerProbe(){
  const saved={players,foes,boss,shots,drops,fx,phase,elapsed,kills,score,level,xp,goal,
   messageClock,gameMessage:$('game-message').textContent};
  const result={};
  try{
   phase='explore';boss=null;foes=[];shots=[];drops=[];fx=[];
   kills=0;score=0;level=1;xp=0;goal=10000;elapsed=0;
   const pet=player('rosie',0);players=[pet];
   collectDrop(pet,{kind:'heal'});
   result.fullHpChocolate=pet.hp===pet.maxHp&&pet.snackCharge===42;
   pet.snackCharge=0;pet.hp=pet.maxHp-9;
   collectDrop(pet,{kind:'heal'});
   result.partialChocolate=pet.hp===pet.maxHp&&pet.snackCharge===24;
   pet.snackCharge=0;
   const mob={x:pet.x+45,y:pet.y,hp:1000,maxHp:1000,kind:'bleepling',size:20};
   foes=[mob];damage(mob,5,pet);
   const firstCharge=pet.snackCharge;damage(mob,5,pet);
   result.hitRateCapped=firstCharge===.75&&pet.snackCharge===.75;
   elapsed+=.36;damage(mob,5,pet);
   result.hitProgress=pet.snackCharge===1.5;
   result.meter=(()=>{
    pet.snackCharge=0;const empty=snackMeterGeometry(pet);
    pet.snackCharge=50;const half=snackMeterGeometry(pet);
    pet.snackCharge=100;const full=snackMeterGeometry(pet);
    return {empty:empty.width,half:half.width,full:full.width,
     underneath:empty.y>empty.hpBarY,constantWidth:empty.maxWidth===54&&
      half.maxWidth===54&&full.maxWidth===54};
   })();
   pet.snackCharge=100;shots=[];fire(pet);
   result.rosie=pet.snackCharge===0&&shots.length===1&&
    shots[0].pierce===1&&shots[0].damage>(pet.damage+level*2);
   const millie=player('millie',0);millie.x=pet.x;millie.y=pet.y;
   millie.snackCharge=100;millie.dashCharges=1;millie.dashRecharge=[2.8];
   players=[millie];shots=[];fire(millie);
   result.millie=shots.length===1&&millie.snackCharge===0&&
    shots[0].pierce===0&&millie.dashCharges===2&&millie.dashRecharge.length===0&&
    shots[0].damage>(millie.damage+level*2);
   const winni=player('winnifred',0);winni.x=pet.x;winni.y=pet.y;
   winni.snackCharge=100;players=[winni];shots=[];
   mob.x=winni.x+60;mob.y=winni.y;mob.hp=1000;
   fire(winni);
   result.winnifred=winni.snackCharge<1&&shots.length===0&&
    1000-mob.hp>(winni.damage+level*2);
   const ellie=player('ellie',0),friend=player('rosie',1);
   players=[ellie,friend];foes=[];ellie.snackCharge=100;
   friend.x=ellie.x+35;friend.y=ellie.y;friend.hp=friend.maxHp;
   ellie.healClock=0;updateEllieAuras(.02);
   result.ellieWaits=ellie.snackCharge===100;
   friend.hp=friend.maxHp-60;ellie.healClock=0;
   updateEllieAuras(.02);
   result.ellie=friend.hp===friend.maxHp-38&&ellie.snackCharge>0&&
    ellie.snackCharge<100; // 22 healed, charge creeps back in
   // Guaranteed milestone; never a blossom at 99 or earlier.
   drops=[];kills=99;
   result.locked=maybeDropMagnet({x:400,y:500})===false&&drops.length===0;
   kills=100;
   result.milestone=maybeDropMagnet({x:400,y:500})===true&&
    drops.length===1&&drops[0].kind==='magnet'&&
    maybeDropMagnet({x:400,y:500})===false;
   drops=[];kills=101;
   const original=Math.random;
   try{
    Math.random=()=>.5;
    result.postMilestoneNoDrop=maybeDropMagnet({x:400,y:500})===false&&drops.length===0;
    Math.random=()=>0;
    result.postMilestoneRare=maybeDropMagnet({x:400,y:500})===true&&drops[0].kind==='magnet';
   }finally{Math.random=original}
   // Sakura Breeze gathers XP only: never chocolates or other blossoms.
   players=[pet];foes=[];pet.hidden=false;pet.magnetTime=4.2;
   drops=[{kind:'xp',x:pet.x+110,y:pet.y},
    {kind:'heal',x:pet.x+130,y:pet.y},
    {kind:'magnet',x:pet.x+160,y:pet.y}];
   const preXP=xp,preHealth=pet.hp,initialOther=drops.slice(1).map(d=>d.x);
   updateSnackMagnet(.75);
   result.magnetXP=xp===preXP+12&&!drops.some(d=>d.kind==='xp');
   result.magnetDoesNotPullOther=drops.length===2&&
    drops[0].x===initialOther[0]&&drops[1].x===initialOther[1]&&
    pet.hp===preHealth;
   pet.hidden=true;drops=[{kind:'xp',x:pet.x+80,y:pet.y}];
   const beforeHidden=drops[0].x;updateSnackMagnet(.5);
   result.noMagnetThroughBush=drops.length===1&&drops[0].x===beforeHidden;
   return result;
  }finally{
   players=saved.players;foes=saved.foes;boss=saved.boss;shots=saved.shots;
   drops=saved.drops;fx=saved.fx;phase=saved.phase;elapsed=saved.elapsed;
   kills=saved.kills;score=saved.score;level=saved.level;xp=saved.xp;goal=saved.goal;
   messageClock=saved.messageClock;$('game-message').textContent=saved.gameMessage;
   syncHud();
  }
 },
 scrollReturnProbe(){
  const previous={phase,clues,gate,duoActive,duoDefeated,gateCleared:gateCleared.slice()};
  try{
   phase='explore';gate=null;duoActive=false;duoDefeated=true;
   const checkpoints=[];
   for(let i=0;i<3;i++){
    clues=i;gateCleared=[false,false,false];gateCleared[i]=true;
    syncHud();
    const label=$('objective-label').textContent,detail=$('objective-detail').textContent;
    const banner=$('scroll-return-notice'),r=banner.getBoundingClientRect();
    const frame=banner.parentElement.getBoundingClientRect();
    checkpoints.push({visible:!banner.hidden,
     strong:label.includes('SCROLL UNSEALED'),
     instruction:detail.includes('glowing scroll')&&banner.textContent.includes('RETURN AND READ'),
     distance:$('scroll-return-distance').textContent.includes('steps'),
     marker:currentObjective()?.x===clueSpots[i].x,
     fits:r.width>100&&r.left>=frame.left-1&&r.right<=frame.right+1});
   }
   gateCleared=[false,false,false];clues=0;syncHud();
   const noFalsePrompt=$('scroll-return-notice').hidden&&
     !$('objective-strip').classList.contains('scroll-unsealed');
   gateCleared[0]=true;gate={index:0,wave:0,remainingDelay:3};syncHud();
   const busyHidden=$('scroll-return-notice').hidden;
   gate=null;phase='boss';syncHud();
   const bossHidden=$('scroll-return-notice').hidden;
   return {checkpoints,noFalsePrompt,busyHidden,bossHidden};
  }finally{
   phase=previous.phase;clues=previous.clues;gate=previous.gate;
   duoActive=previous.duoActive;duoDefeated=previous.duoDefeated;
   gateCleared=previous.gateCleared;syncHud();
  }
 },
 soloRecoveryProbe(){
  const saved={players,phase,fx};
  try{
   phase='explore';fx=[];
   const p=player('rosie',0);players=[p];
   p.hp=p.maxHp-30;p.recoveryClock=0;
   const initial=p.hp;
   updateSoloRecovery(4.5);
   const waiting=p.hp===initial;
   updateSoloRecovery(.5);
   const outside=Math.abs(p.hp-(initial+2.4))<1e-6;
   p.recoveryClock=4.9;recordPlayerHit(p);
   const reset=p.recoveryClock===0;
   const beforeHitWait=p.hp;updateSoloRecovery(4.9);
   const noEarlyHeal=p.hp===beforeHitWait;
   updateSoloRecovery(.1);
   const healedAfterFive=Math.abs(p.hp-(beforeHitWait+2.4))<1e-6;
   p.hidden=true;p.recoveryClock=3;
   const bushBefore=p.hp;
   updateSoloRecovery(10);
   const bushSlow=Math.abs(p.hp-(bushBefore+1))<1e-6&&p.recoveryClock===0;
   p.hidden=false;
   const returnBefore=p.hp;updateSoloRecovery(4.9);
   const noStoredOutdoorTick=p.hp===returnBefore;
   updateSoloRecovery(.1);
   const backOutside=Math.abs(p.hp-(returnBefore+2.4))<1e-6;
   p.hp=p.maxHp-.7;p.recoveryClock=0;updateSoloRecovery(5);
   const capped=p.hp===p.maxHp;
   p.hp=p.maxHp-10;p.recoveryClock=0;
   players=[p,player('ellie',1)];
   const coOpBefore=p.hp;updateSoloRecovery(15);
   const coopNoRegen=p.hp===coOpBefore;
   p.hidden=true;updateSoloRecovery(12);
   const coopBushNoRegen=p.hp===coOpBefore;
   players=[p];phase='cutscene';updateSoloRecovery(30);
   const pausedByScene=p.hp===coOpBefore;
   phase='explore';p.alive=false;p.hp=0;updateSoloRecovery(20);
   const noResurrection=p.hp===0;
   return {waiting,outside,reset,noEarlyHeal,healedAfterFive,bushSlow,
    noStoredOutdoorTick,backOutside,capped,coopNoRegen,coopBushNoRegen,
    pausedByScene,noResurrection};
  }finally{players=saved.players;phase=saved.phase;fx=saved.fx;syncHud()}
 },
 phoneLayoutProbe(){
  const section=$('game-section'),frame=section.querySelector('.game-frame');
  const perk=$('perk-panel'),choices=$('perk-choices');
  const old={panelHidden:perk.hidden,choices:choices.innerHTML,
   phone:document.body.classList.contains('phone-play')};
  setPhonePlay(true);
  const bounds=e=>e.getBoundingClientRect();
  const stage=bounds(section),canvas=bounds($('game')),screenW=innerWidth,screenH=innerHeight;
  const view={stage:{left:stage.left,right:stage.right,top:stage.top,bottom:stage.bottom,
    width:stage.width,height:stage.height},screenW,screenH,
   canvas:{width:canvas.width,height:canvas.height},
   center:Math.abs((canvas.left+canvas.right)/2-screenW/2)<4,
   full:stage.left>=-1&&stage.top>=-1&&Math.abs(stage.width-screenW)<4&&
    Math.abs(stage.height-screenH)<4,
   frameFull:bounds(frame).height>=screenH-8,
   exitVisible:getComputedStyle($('phone-exit')).display!=='none',
   inviteVisible:getComputedStyle(document.querySelector('.phone-play-invite')).display!=='none',
   solo:document.body.classList.contains('solo-play'),
   firstStick:getComputedStyle(document.querySelector('.touch-player:first-child')).display!=='none',
   secondStick:getComputedStyle(document.querySelector('.touch-player:nth-child(2)')).display!=='none'};
  const rgbaAlpha=el=>{
   const color=getComputedStyle(el).backgroundColor;
   const parts=color.replace(/rgba?\(|\)/g,'').split(',').map(x=>Number(x.trim()));
   return parts.length===4?parts[3]:1;
  };
  view.alpha={health:rgbaAlpha($('mobile-health')),
   quest:rgbaAlpha($('mobile-quest')),xp:rgbaAlpha($('team-xp-overlay'))};
  // The same large phone button must clearly show how to unpause.
  $('phone-pause').click();
  view.pause={paused,button:$('phone-pause').textContent,
   pressed:$('phone-pause').getAttribute('aria-pressed'),
   panel:!$('paws-panel').hidden};
  $('phone-pause').click();
  view.unpause={paused,button:$('phone-pause').textContent,
   pressed:$('phone-pause').getAttribute('aria-pressed'),
   panel:!$('paws-panel').hidden};
  // Measure the compact two-choice upgrade layout without altering level,
  // character stats or existing modal callback state.
  perk.hidden=false;choices.replaceChildren();
  for(let i=0;i<2;i++){const b=document.createElement('button');
   b.className='perk-choice perk-normal';b.textContent='NORMAL · HP +20 — quick choice '+(i+1);
   choices.append(b)}
  const inner=bounds(perk.querySelector('.perk-inner'));
  const buttons=[...choices.children].map(el=>bounds(el));
  view.perk={inside:inner.left>=-1&&inner.right<=screenW+1&&inner.top>=-1&&inner.bottom<=screenH+1,
   compact:inner.height<=screenH*.80&&inner.width<=screenW*.99,
   tappable:buttons.every(b=>b.width>95&&b.height>=44),
   choices:buttons.length};
  perk.hidden=old.panelHidden;choices.innerHTML=old.choices;
  setPhonePlay(old.phone);
  return view;
 },
 mobileFacingAndSceneProbe(){
  const coop=$('coop'),wasCoop=coop.checked,oldPhase=phase,
   wasPhone=document.body.classList.contains('phone-play');
  const old={sceneName,cutsceneNext,sceneOpenedAt,sceneToken:scenePresentationToken,
   overlayClass:$('overlay').className,sceneAttr:$('overlay').dataset.scene,
   overlayHidden:$('overlay').classList.contains('hidden'),
   pauseDisabled:$('pause').disabled,
   sceneHelp:$('scene-control-help').textContent,
   sceneHelpHidden:$('scene-control-help').hidden,
   sceneSkipHidden:$('scene-skip').hidden,
   hp:players.map(p=>p.hp),elapsed};
  const rect=el=>{const b=el.getBoundingClientRect();
   return {x:b.x,y:b.y,left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,height:b.height}};
  const within=(b)=>b.left>=-1&&b.right<=innerWidth+1&&b.top>=-1&&b.bottom<=innerHeight+1;
  try{
   setPhonePlay(true);
   const solo=()=>{
    coop.checked=false;syncTouchPlayers();
    const stick=rect(document.querySelector('[data-joystick="0"]')),
      dash=rect(document.querySelector('[data-dash="0"]'));
    return {leftRight:stick.right+5<dash.left,visible:within(stick)&&within(dash),
      stickNearLeft:stick.left>=0&&stick.left<=46,
      dashNearRight:innerWidth-dash.right>=0&&innerWidth-dash.right<=46,
      stickNearBottom:innerHeight-stick.bottom>=0&&innerHeight-stick.bottom<=56,
      dashNearBottom:innerHeight-dash.bottom>=0&&innerHeight-dash.bottom<=56,
      secondHidden:getComputedStyle(document.querySelector('.touch-player:nth-child(2)')).display==='none'};
   };
   const first=solo();
   coop.checked=true;syncTouchPlayers();
   const p1={stick:rect(document.querySelector('[data-joystick="0"]')),
    dash:rect(document.querySelector('[data-dash="0"]'))};
   const p2={stick:rect(document.querySelector('[data-joystick="1"]')),
    dash:rect(document.querySelector('[data-dash="1"]'))};
   const topRow=rect(document.querySelector('.touch-player:nth-child(2)'));
   const bottomRow=rect(document.querySelector('.touch-player:first-child'));
   const opposite={
    topBottom:p2.stick.bottom+25<p1.stick.top,
    p1LeftRight:p1.stick.right<p1.dash.left,
    p1DashNearRight:innerWidth-p1.dash.right>=0&&innerWidth-p1.dash.right<=46,
    p1StickNearLeft:p1.stick.left>=0&&p1.stick.left<=46,
    p1DashNearBottom:innerHeight-p1.dash.bottom>=0&&innerHeight-p1.dash.bottom<=56,
    p2LeftRight:p2.dash.right<p2.stick.left,
    controlsFit:[p1.stick,p1.dash,p2.stick,p2.dash].every(within),
    flipped:getComputedStyle(document.querySelector('.touch-player:nth-child(2)')).transform.startsWith('matrix(-1'),
    inputsP1:playerTouchDirection(0,1,-.5).x===1&&playerTouchDirection(0,1,-.5).y===-.5,
    inputsP2:playerTouchDirection(1,1,-.5).x===-1&&playerTouchDirection(1,1,-.5).y===.5,
    rowPositions:topRow.bottom<bottomRow.top
   };
   // Test the actual illustrated story layer while game is paused.
   showScene('clue3','THE THIRD SCROLL','This is a longer mobile illustrated scene.');
   $('overlay').classList.remove('hidden'); // presentation asset decode can be asynchronous
   const sceneCard=$('overlay').querySelector('.overlay-inner'),
     overlay=rect($('overlay')),card=rect(sceneCard),art=rect($('overlay-art')),
     button=rect($('overlay-start')),skip=rect($('scene-skip'));
   const before=players.map(p=>p.hp),elapsedBefore=elapsed;
   update(9);
   const frozen=phase==='cutscene'&&elapsed===elapsedBefore&&
    players.every((p,i)=>p.hp===before[i]);
   const scene={frozen,cardFits:within(card),nextVisible:within(button)&&button.height>=40,
    skipVisible:within(skip),noScroll:sceneCard.scrollHeight<=sceneCard.clientHeight+2,
    noPageScroll:getComputedStyle(document.body).overflow==='hidden',
    artFits:art.bottom<=button.top&&art.height<=innerHeight*.32,
    help:$('scene-control-help').textContent.includes('Tap NEXT LINE'),
    overlayFits:overlay.height<=innerHeight+2,
    inputsHidden:getComputedStyle(document.querySelector('.mobile-keys')).visibility==='hidden',
    canAdvance:advanceSceneBeat()&&$('scene-dialogues').dataset.beat==='1'};
   return {first,opposite,scene};
  }finally{
   ++scenePresentationToken;phase=oldPhase;sceneName=old.sceneName;
   cutsceneNext=old.cutsceneNext;sceneOpenedAt=old.sceneOpenedAt;
   $('overlay').className=old.overlayClass;
   if(old.sceneAttr===undefined)delete $('overlay').dataset.scene;
   else $('overlay').dataset.scene=old.sceneAttr;
   $('pause').disabled=old.pauseDisabled;
   $('scene-control-help').textContent=old.sceneHelp;
   $('scene-control-help').hidden=old.sceneHelpHidden;
   $('scene-skip').hidden=old.sceneSkipHidden;
   coop.checked=wasCoop;syncTouchPlayers();setPhonePlay(wasPhone);
   players.forEach((p,i)=>p.hp=old.hp[i]);elapsed=old.elapsed;syncHud();
  }
 },
 getEnemyList(){return [...new Set(foes.map(e=>e.kind))]},
 state(){return {phase,clues,duoActive,duoDefeated,laserUnlocked,laserIndex:laserChallenge.index,scentStep,score,kills,coneWindup,elapsed,hp:players.map(p=>p.hp),sceneName,cutsceneNext,bossHp:boss?.hp||0,daanActive,bossRage:boss?.rage||false,bossMaxHp:boss?.maxHp||0,liteFx,guardWave:gate?.wave??null,guardians:foes.filter(e=>e.guardian&&e.hp>0).length,cleared:gateCleared.slice(),mode:difficulty,overlay:!$('overlay').classList.contains('hidden'),imgSrc:$('overlay-art').getAttribute('src').slice(0,90),dialogueImages:[...$('scene-dialogues').querySelectorAll('img')].map(im=>im.getAttribute('src').slice(0,80)),missionUnlock:$('mission-unlock').classList.contains('show'),objectText:$('objective-label').textContent}}
,
 vanilleProbe(){
  const v=players[0],intruder=players[1];
  if(!v||v.id!=='vanille'||!intruder)return {error:'Need P1 Vanille and P2 ally'};
  const initial={hp:v.maxHp,speed:v.speed,damage:v.damage,regen:v.selfRegen};
  const e={x:v.x+90,y:v.y,hp:240,maxHp:240,size:21,kind:'bleepling',damage:0,speed:0,attack:99,age:0,telegraph:0,slow:0};
  foes=[e];v.hidden=false;v.ambushReady=0;fire(v);
  const glare=240-e.hp;
  const before={x:v.x,y:v.y,enemyX:e.x};v.dashCooldown=0;
  tryDash(0);
  const ploff={moved:Math.hypot(v.x-before.x,v.y-before.y),enemyMoved:e.x-before.enemyX,cooldown:v.dashCooldown};
  v.hp=100;updateVanille(1);const healed=v.hp-100;
  const bush=bushes[0];v.personalSpaceLock=0;v.x=bush.x;v.y=bush.y;
  intruder.x=bush.x+210;intruder.y=bush.y;v.bushId=-1;intruder.bushId=-1;
  updateBushes(.016);const wasHidden=v.hidden;
  intruder.x=bush.x+3;intruder.y=bush.y+3;updateBushes(.016);
  const personalSpace={wasHidden,ejected:!v.hidden,dist:Math.hypot(v.x-bush.x,v.y-bush.y),lock:v.personalSpaceLock,speech:worldBubbles.some(b=>b.speaker==='vanille'&&b.line.includes('PERSONAL SPACE'))};
  return {initial,glare,ploff,healed,personalSpace};
 }
};'''
pos=html.rfind('})();')
assert pos>0
html=html[:pos]+hook+'\n'+html[pos:]
assert 'window.__rosieTest' in html

def browser_run(browser,screen=(1280,900),mobile=False,mode='challenge',solo=False):
    page=browser.new_page(viewport={'width':screen[0],'height':screen[1]},device_scale_factor=1, is_mobile=mobile,has_touch=mobile)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(html,wait_until='domcontentloaded',timeout=60000)
    page.wait_for_function('window.Level32Sprites && window.Level32Sprites.loadedCharacters.length === 10', timeout=15000)
    # Nine pet/boss/enemy sheets plus provisional Daan decode in Chromium.
    assert page.evaluate("window.Level32Sprites.loadedCharacters.length")==10
    assert page.evaluate("window.Level32Sprites.previewEnabled") is True
    assert page.evaluate("window.Level32Sprites.loadedCharacters.includes('daan')")
    assert page.evaluate("window.Level32Sprites.loadedCharacters.includes('vanille')")
    assert page.locator('[data-hero="vanille"]').count()==1
    assert page.evaluate("""() => {
        const source=window.Level32Sprites.approvedFiles.daan;
        return source.endsWith('daan.svg') || source.startsWith('data:image/svg+xml;base64,');
    }""")
    # Synthetic sheet verifies frame cropping and reversible fallback, then
    # restores the actual approved artwork before the gameplay regression run.
    sprite_check=page.evaluate("""async () => {
      const engine=window.Level32Sprites;
      if(!engine)return {exists:false};
      const tile=document.createElement('canvas');tile.width=64*8;tile.height=64*4;
      const pixels=tile.getContext('2d');
      pixels.fillStyle='#ff0000';pixels.fillRect(0,0,64,64);
      pixels.fillStyle='#00ff00';pixels.fillRect(64*2,64*2,64,64);
      const img=new Image();img.src=tile.toDataURL('image/png');await img.decode();
      const surface=document.createElement('canvas');surface.width=100;surface.height=100;
      const ctx=surface.getContext('2d');
      const original=ctx.imageSmoothingEnabled;
      engine.setPreviewEnabled(false);
      const defaultFallback=engine.draw(ctx,'rosie',{state:'idle',direction:'down'},50,50,32,0)===false;
      const invalidRejected=!engine.register('rosie',tile);
      const validAccepted=engine.register('rosie',img);
      engine.setPreviewEnabled(true);
      const result=engine.draw(ctx,'rosie',{state:'walk',direction:'right'},50,50,32,.16);
      const pix=[...ctx.getImageData(50,50,1,1).data];
      const smoothingRestored=ctx.imageSmoothingEnabled===original;
      engine.setPreviewEnabled(false);
      const fallbackRestored=engine.draw(ctx,'rosie',{state:'idle',direction:'down'},50,50,32,0)===false;
      const realSheets=await engine.loadApproved();
      engine.setPreviewEnabled(true);
      const artRestored=realSheets.every(Boolean) && engine.loadedCharacters.length===10;
      const visibleRestored=engine.draw(ctx,'rosie',{state:'idle',direction:'down'},50,50,32,0);
      return {exists:true,defaultFallback,invalidRejected,validAccepted,result,pix,smoothingRestored,fallbackRestored,artRestored,visibleRestored};
    }""")
    assert sprite_check['exists'] and sprite_check['defaultFallback'],sprite_check
    assert sprite_check['invalidRejected'] and sprite_check['validAccepted'],sprite_check
    assert sprite_check['result'] and sprite_check['pix'][:3]==[0,255,0],sprite_check
    assert sprite_check['smoothingRestored'] and sprite_check['fallbackRestored'],sprite_check
    assert sprite_check['artRestored'] and sprite_check['visibleRestored'],sprite_check
    s=page.evaluate('window.__rosieTest.state()')
    print('idle',s['phase'])
    page.locator('#mute').click()
    page.locator('#difficulty').select_option(mode)
    # Non-gamers begin in solo mode, keeping the existing P1 Rosie selection.
    assert not page.locator('#coop').is_checked()
    assert page.locator('[data-slot="0"]').get_attribute('aria-pressed')=='true'
    assert page.locator('[data-slot="1"]').is_disabled()
    assert 'P1: Rosie' in page.locator('#selection-status').inner_text()
    assert 'SOLO MODE' in page.locator('#selection-status').inner_text()
    if not solo:
        page.locator('#coop').check()
        assert page.locator('#coop').is_checked()
        assert page.locator('[data-slot="1"]').is_enabled()
        assert 'P2: Winnifred' in page.locator('#selection-status').inner_text()
    assert page.locator('[data-dash]').count()==2
    assert page.locator('[data-joystick]').count()==2
    assert 'Daan joins' not in page.locator('#difficulty').inner_text()
    assert page.locator('.select-invite').get_attribute('target')=='_blank'
    invite_primary=page.locator('.hero-primary-invite')
    assert invite_primary.count()==1 and invite_primary.is_visible()
    assert invite_primary.get_attribute('href').endswith('invitation.html')
    assert invite_primary.get_attribute('target')=='_blank'
    assert 'BIRTHDAY INVITATION' in invite_primary.inner_text()
    optional_game=page.locator('.hero-play-link')
    assert optional_game.count()==1 and optional_game.get_attribute('href')=='#character-select'
    assert page.locator('#character-select').count()==1
    assert 'optional' in page.locator('.hero-entry-note').inner_text().lower()
    assert not any(text in page.locator('.masthead').inner_text() for text in
      ('1–2 LOCAL PLAYERS','JAPANESE GARDEN ARCADE','ADVENTURE · 7/10'))
    entry_bounds=page.evaluate("""()=>{
      const p=document.querySelector('.hero-primary-invite').getBoundingClientRect();
      const q=document.querySelector('.hero-play-link').getBoundingClientRect();
      const vw=window.innerWidth;
      return {inviteOnScreen:p.width>=180&&p.left>=0&&p.right<=vw,
        playOnScreen:q.width>=180&&q.left>=0&&q.right<=vw,
        inviteFirst:p.top<=q.top};
    }""")
    assert all(entry_bounds.values()),entry_bounds
    assert page.locator('#ending-invite').is_hidden()
    if not mobile and mode=='challenge' and not solo:
        matrix=page.evaluate('window.__rosieTest.combatMatrix()')
        assert len(matrix)==15,matrix
        for hero in ['rosie','millie','winnifred','ellie','vanille']:
            tiers=[next(row for row in matrix if row['hero']==hero and row['mode']==m)
              for m in ('story','challenge','extreme')]
            story,adventure,extreme=tiers
            assert story['heroHp']>adventure['heroHp']==extreme['heroHp'],tiers
            assert story['startingLevel']==adventure['startingLevel']==extreme['startingLevel']==1,tiers
            assert story['guardianHp']<adventure['guardianHp']<extreme['guardianHp'],tiers
            assert story['guardianDamage']<adventure['guardianDamage']<extreme['guardianDamage'],tiers
            assert story['guardians']<adventure['guardians']<extreme['guardians'],tiers
            assert all(x<y<z for x,y,z in zip(story['eliteHp'],adventure['eliteHp'],extreme['eliteHp'])),tiers
            assert not story['banana'] and not adventure['banana'],tiers
            pattern=extreme['banana']
            assert len(pattern)==2,pattern
            for shot in pattern:
                vx,vy=abs(shot['vx']),abs(shot['vy'])
                if shot['source']=='boink': assert min(vx,vy)<1e-6,shot
                else: assert abs(vx-vy)<1e-6,shot
        print('15-character-mode balance matrix and Extreme-only +/X bananas: PASS')
    soundtrack=page.evaluate('window.__rosieTest.soundtrackConfig()')
    assert set(['duo','boss1','boss2','boss3']).issubset(soundtrack['modes']),soundtrack
    assert soundtrack['legendaryBpm']>=170,soundtrack
    s=page.evaluate('window.__rosieTest.start()')
    if mobile:
        full=page.evaluate('window.__rosieTest.phoneLayoutProbe()')
        assert full['full'] and full['frameFull'] and full['center'],full
        assert full['exitVisible'] and full['inviteVisible'] and full['firstStick'],full
        assert full['secondStick']==(not solo),full
        assert full['perk']['inside'] and full['perk']['compact'] and full['perk']['tappable'],full
        assert full['perk']['choices']==2,full
        assert full['pause']=={'paused':True,'button':'▶ UNPAWS','pressed':'true','panel':True},full
        assert full['unpause']=={'paused':False,'button':'Ⅱ PAWS','pressed':'false','panel':False},full
        if screen[0]>screen[1]:
            assert all(abs(value-.10)<.015 for value in full['alpha'].values()),full
        assert not page.evaluate("document.body.classList.contains('phone-play')")
        face=page.evaluate('window.__rosieTest.mobileFacingAndSceneProbe()')
        assert all(face['first'].values()),face
        assert all(face['opposite'].values()),face
        assert all(face['scene'].values()),face
        print('Mobile right-thumb Dash corner placement, live rotation and co-op layout: PASS')
        print('Mobile-only left-stick/right-dash, opposite-edge co-op and non-scrolling frozen cutscene: PASS')
        print('Full-screen phone stage, solo joystick, 10% rotated HUD panels and compact upgrades: PASS')
    prompt=page.evaluate('window.__rosieTest.scrollReturnProbe()')
    assert len(prompt['checkpoints'])==3 and all(all(entry.values())
      for entry in prompt['checkpoints']),prompt
    assert prompt['noFalsePrompt'] and prompt['busyHidden'] and prompt['bossHidden'],prompt
    recovery=page.evaluate('window.__rosieTest.soloRecoveryProbe()')
    assert all(recovery.values()),recovery
    if not mobile and mode=='challenge' and not solo:
        snack=page.evaluate('window.__rosieTest.snackPowerProbe()')
        assert snack['fullHpChocolate'] and snack['partialChocolate'],snack
        assert snack['hitRateCapped'] and snack['hitProgress'],snack
        assert snack['meter']=={'empty':0,'half':27,'full':54,
          'underneath':True,'constantWidth':True},snack
        for key in ('rosie','millie','winnifred','ellieWaits','ellie',
          'locked','milestone','postMilestoneNoDrop','postMilestoneRare',
          'magnetXP','magnetDoesNotPullOther','noMagnetThroughBush'):
            assert snack[key],(key,snack)
        print('Snack meters, four role bonuses, healing, 100-kill blossom magnet: PASS')
    if not mobile and mode=='challenge' and not solo:
        tree=page.evaluate('window.__rosieTest.treeDepthProbe()')
        assert tree['blocked'] and tree['escaped'] and tree['slides'] and tree['steers'] and not tree['tunneled'],tree
        assert tree['playerFade']<tree['mobFade']<tree['normal'] and tree['normal']==1,tree
        dash=page.evaluate('window.__rosieTest.millieDoubleDashProbe()')
        assert (dash['before'],dash['first'],dash['second'],dash['third'],
          dash['clocks'],dash['recharged'])==(2,1,0,0,2,2),dash
        assert dash['normalFirst'] and dash['normalSecond'],dash
        bounds=page.evaluate("""()=>{
          const q=id=>document.getElementById(id).getBoundingClientRect();
          const level=q('team-level-label'),amount=q('team-xp-text'),perk=q('team-perk-label'),
            track=q('team-xp-progress');
          return {headerSeparate:level.right+4<=amount.left,
            perkOwnRow:perk.top>=track.bottom,
            fitting:amount.right<=q('team-xp-overlay').right-2,
            height:track.height};
        }""")
        assert bounds['headerSeparate'] and bounds['perkOwnRow'] and bounds['fitting'] and bounds['height']>=5,bounds
        xpbar=page.evaluate('window.__rosieTest.teamXPBarProbe()')
        assert xpbar['visible'] and abs(xpbar['progress']-50)<.01,xpbar
        assert xpbar['label']=='TEAM LV 2' and xpbar['perk']=='NEXT PERK LV 5',xpbar
        print('Millie double dash, tree collisions/steering/fading and shared XP meter: PASS')
    if not mobile and mode=='challenge' and not solo:
        ambush=page.evaluate('window.__rosieTest.bushAmbushProbe()')
        assert all(ambush.values()),ambush
        nick=page.evaluate('window.__rosieTest.nicknameProbe()')
        assert set(nick['names'])=={'Rosie the Dog','Silly Millie','Ellie Bellie',
          'Princess Winnifred, floof of her name','Vanille, Keeper of Personal Space'},nick
        assert all(any(lyric[1] in line for line in nick['lines']) for lyric in nick['theme']),nick
        print('Ambush crit, bush-hit ejection and new Rosie/Daan lyrics: PASS')
        garden=page.evaluate('window.__rosieTest.gardenProbe()')
        assert garden['treeAsset'] and garden['distinct']>1,garden
        assert all(5<=run['count']<=9 and run['grass']==180 and run['valid']
          for run in garden['runs']),garden
        assert garden['stationary']==0 and garden['far']==0 and abs(garden['moving'])>1,garden
        print('Eight random cherry groves, free quest paths and reactive grass: PASS')
    if not mobile and mode=='challenge' and not solo:
        stealth=page.evaluate('window.__rosieTest.bushStealthProbe()')
        assert all(stealth.values()),stealth
        pairs=page.evaluate('window.__rosieTest.pairDialogueProbe()')
        assert len(pairs)==6 and all(pair['visits']==3 and pair['sequential']
          and len({visit['first'] for visit in pair['encounters']})==3
          and all(len(visit['lines'])>=3 for visit in pair['encounters'])
          for pair in pairs),pairs
        rw=next(pair for pair in pairs if pair['key']=='rosie|winnifred')
        assert rw['encounters'][0]['lines'][:2]==['Boop!','>:('],rw
        assert rw['encounters'][1]['lines'][:2]==['Boop! >:)','Hehehehe! Again!'],rw
        em=next(pair for pair in pairs if pair['key']=='ellie|millie')
        assert em['encounters'][0]['lines'][:3]==['Zoom?','ZOOOOM!!','Ball?'],em
        assert 'forgetting me' in ' '.join(em['encounters'][1]['lines']),em
        print('Six hero pairings, three evolving scenes each, sequential readable bubbles: PASS')
    xp_layout=page.evaluate("""()=>{
       const box=id=>document.getElementById(id).getBoundingClientRect();
       const left=box('team-level-label'),right=box('team-xp-text'),
        progress=box('team-xp-progress'),perk=box('team-perk-label'),
        container=box('team-xp-overlay');
       return {levelAndXPSeparate:left.right+4<=right.left,
        perkOnOwnRow:perk.top>=progress.bottom,
        contentInside:right.right<=container.right-2,
        progressVisible:progress.width>30&&progress.height>=5};
    }""")
    assert all(xp_layout.values()),xp_layout
    assert page.locator('.hero-stats').count()==5
    for card in page.locator('.hero').all():
        assert card.locator('.hero-stats').is_visible(), 'Stats must be displayed without hover'
        assert card.locator('.stat-line').count()==3
    assert 'FIGHTER STATS' in page.locator('.hero-stats').first.inner_text()
    assert page.locator('[data-hero="millie"] .hero-stats .stat-line').first.locator('.stars').inner_text()=='★★★★☆'
    assert 'damage 4 of five' in page.locator('[data-hero="millie"] .hero-stats').get_attribute('aria-label')
    if not mobile:
        page.locator('[data-hero="rosie"]').hover()
        assert page.locator('[data-hero="rosie"] .stats-summary').is_visible()
    else:
        page.locator('[data-hero="rosie"]').focus()
        assert page.locator('[data-hero="rosie"] .stats-summary').is_visible()
    ratios=page.evaluate('window.__rosieTest.heroBalance()')
    assert ratios['winnifred']>ratios['rosie'] and ratios['millie']>ratios['ellie'],ratios
    levels=page.evaluate('window.__rosieTest.xpProbe()')
    assert levels['firstFive']==10 and abs(levels['afterFive']-(10 if mode=='story' else 6 if mode=='extreme' else 7.8))<0.00001,levels
    turn=page.evaluate('window.__rosieTest.perkAlternationProbe()')
    assert turn['order']==([0,1,0] if not solo else [0,0,0]),turn
    assert all('TEAM LEVEL' in label and 'Next perk' in label for label in turn['labels']),turn
    upgrade=page.evaluate('window.__rosieTest.perkProbe()')
    assert upgrade['offered'] and upgrade['choices']==2 and upgrade['closed'],upgrade
    assert all(x in ['normal','epic','legendary'] for x in upgrade['rarities']),upgrade
    pierce=page.evaluate('window.__rosieTest.dragonPierceCheck()')
    assert pierce['hp']==[183,191.5,200] and pierce['hits']==2 and pierce['left']==0,pierce
    print('Rosie two-enemy swept collision: PASS')
    assert page.locator('#pause').inner_text().endswith('PAWS')
    assert page.locator('#fx-toggle').count()==1
    assert page.locator('#sprite-toggle').count()==1
    assert page.locator('#sprite-toggle').get_attribute('aria-pressed')=='true'
    page.locator('#sprite-toggle').click()
    assert page.locator('#sprite-toggle').get_attribute('aria-pressed')=='false'
    assert page.evaluate("window.Level32Sprites.previewEnabled") is False
    page.locator('#sprite-toggle').click()
    assert page.locator('#sprite-toggle').get_attribute('aria-pressed')=='true'
    assert page.evaluate("window.Level32Sprites.previewEnabled") is True
    assert page.evaluate("window.__rosieTest.state().phase")=='explore'
    assert page.locator('#dash-status .dash-pill').count()==(1 if solo else 2)
    assert 'SHIFT' in page.locator('#dash-status').inner_text()
    assert page.locator('#scene-control-help').count()==1
    assert page.locator('#mobile-health .mobile-health-card').count()>=1
    assert 'HP' in page.locator('#mobile-health').inner_text()
    assert 'QUEST' in page.locator('#mobile-quest').inner_text()
    assert page.locator('#paws-panel').is_hidden()
    page.locator('#pause').click()
    assert page.locator('#paws-panel').is_visible()
    assert 'PAWSIBILITIES' in page.locator('#pause').inner_text()
    page.locator('#pause').click()
    assert page.locator('#paws-panel').is_hidden()
    assert s['phase']=='explore' and s['mode']==mode
    assert len(s['hp'])==(1 if solo else 2),s
    if not solo:
        simultaneous=page.evaluate('window.__rosieTest.dualStickCheck()')
        assert simultaneous['first']>0 and simultaneous['second']<0,simultaneous
    assert page.locator('#focus-play').count()==1
    assert page.locator('.footer-invite').count()==1
    analog=page.evaluate('window.__rosieTest.joystickCheck()')
    assert analog['partial']>0 and analog['full']>analog['partial']*1.8,analog
    skipped=page.evaluate('window.__rosieTest.place(1)')
    assert skipped['clues']==0
    s=page.evaluate('window.__rosieTest.track()')
    assert s['cleared'][0] and s['clues']==0
    scroll_before=page.evaluate('window.scrollY')
    s=page.evaluate('window.__rosieTest.place(0)')
    assert abs(page.evaluate('window.scrollY')-scroll_before)<2, 'First cinematic must not jump document'
    assert s['phase']=='cutscene' and s['clues']==1 and s['cleared'][0], s
    page.wait_for_function("window.__rosieTest.sceneVisibleAndReady()",timeout=15000)
    assert s['sceneName']=='clue1' and s['imgSrc'].startswith('data:image/webp'),s
    assert len(s['dialogueImages'])==3,s
    frozen=page.evaluate('window.__rosieTest.state()')
    page.wait_for_timeout(450)
    s=page.evaluate('window.__rosieTest.state()')
    assert s['elapsed']==frozen['elapsed'] and s['hp']==frozen['hp']
    print('clue1 cutscene and canonical portraits: PASS')
    assert page.locator('#scene-dialogues .scene-line:not([hidden])').count()==1
    assert page.locator('#scene-counter').inner_text()=='1 / 3'
    assert page.locator('#scene-control-help').is_visible()
    page.keyboard.press('ArrowRight')
    assert page.locator('#scene-counter').inner_text()=='1 / 3'
    assert page.locator('#scene-dialogues').is_visible()
    assert page.locator('#scene-dialogues .scene-line:not([hidden])').is_visible()
    page.keyboard.press('c')
    assert page.locator('#scene-counter').inner_text()=='2 / 3'
    assert page.locator('#scene-dialogues .scene-line:not([hidden])').count()==1
    page.locator('#scene-skip').click()
    s=page.evaluate('window.__rosieTest.state()')
    assert s['phase']=='explore'
    s=page.evaluate('window.__rosieTest.place(1)')
    assert s['phase']=='explore' and s['clues']==1 and s['guardians']>0
    s=page.evaluate('window.__rosieTest.clearGuards()')
    assert s['phase']=='cutscene' and s['clues']==2
    page.wait_for_function("window.__rosieTest.sceneVisibleAndReady()",timeout=15000)
    assert s['sceneName']=='clue2' and s['imgSrc'].startswith('data:image/webp')
    s=page.evaluate('window.__rosieTest.continue()')
    assert s['duoActive'] and s['phase']=='explore',s
    print('mini-boss',page.evaluate('window.__rosieTest.getEnemyList()'))
    assert page.evaluate('window.__rosieTest.duoGap()')>350, 'Boink and Bocht must spawn apart'
    if mode=='extreme':
        burst=page.evaluate('window.__rosieTest.duoMachineGunProbe()')
        assert all(burst[k] for k in ('staggered','warningFirst','overlap','cooldown','directional','ranges')),burst
        assert burst['count']=={'boink':12,'bocht':12},burst
        print('Impossible independent and sometimes-overlapping Boink/Bocht bursts: PASS')
    assert page.evaluate('window.__rosieTest.musicModeNow()')=='duo'
    s=page.evaluate('window.__rosieTest.killsDuo()')
    assert s['duoDefeated'] and not s['duoActive'],s
    # Third quest is now a green-window laser security puzzle, not guardian waves.
    s=page.evaluate('window.__rosieTest.place(2)')
    assert s['phase']=='explore' and s['clues']==2 and s['laserIndex']==0,s
    unsafe=page.evaluate('window.__rosieTest.unsafeLaser()')
    assert unsafe['laserIndex']==0 and not unsafe['cleared'][2],unsafe
    s=page.evaluate('window.__rosieTest.solveLaser()')
    assert s['cleared'][2] and s['laserIndex']==3,s
    s=page.evaluate('window.__rosieTest.place(2)')
    page.wait_for_function("window.__rosieTest.sceneVisibleAndReady()",timeout=15000)
    assert s['phase']=='cutscene' and s['clues']==3 and s['sceneName']=='clue3' and s['imgSrc'].startswith('data:image/webp'),s
    s=page.evaluate('window.__rosieTest.continue()')
    assert s['laserUnlocked'] and s['phase']=='explore'
    s=page.evaluate('window.__rosieTest.nearFridge()')
    assert s['phase']=='cutscene' and s['sceneName']=='intro',s
    print('fridge reveal: PASS')
    s=page.evaluate('window.__rosieTest.continue()')
    assert s['phase']=='boss'
    if not mobile and not solo and mode=='challenge':
        winston=page.evaluate('window.__rosieTest.bossWinstonProbe()')
        assert all(winston.values()),winston
        print("Tolly in-world Winston, Rosie shake and timed expose: PASS")
    assert s['bossMaxHp']>=(1400 if not solo else 900) if mode!='story' else s['bossMaxHp']>400,s
    camp=page.evaluate('window.__rosieTest.bossCampCheck()')
    assert camp['pushed'] and camp['hpAfter'] < camp['hpBefore'] and camp['bossAfter']>0, camp
    print('Tolly standing-on-boss regression: PASS')
    s=page.evaluate('window.__rosieTest.hitBoss()')
    assert s['phase']=='cutscene' and s['sceneName']=='phase2'
    s=page.evaluate('window.__rosieTest.continue()')
    assert s['phase']=='boss'
    assert not s['daanActive'], 'Daan must not join until phase three'
    s=page.evaluate('window.__rosieTest.phase3()')
    assert s['phase']=='cutscene' and s['sceneName']=='phase3',s
    s=page.evaluate('window.__rosieTest.continue()')
    assert s['phase']=='boss' and s['daanActive']==(mode=='extreme'),s
    assert page.evaluate('window.__rosieTest.musicModeNow()')=='boss3'
    if mode=='extreme':
        spite=page.evaluate('window.__rosieTest.triggerDaanSpite()')
        assert spite['active'] and spite['warning'] and spite['action']>0,spite
        drawn=page.evaluate("""() => {
          const cv=document.createElement('canvas');cv.width=cv.height=128;
          return window.Level32Sprites.draw(cv.getContext('2d'),'daan',
            {state:'special',direction:'right'},64,64,96,0);
        }""")
        assert drawn, 'Daan provisional sprite should render in Extreme'
        # Daan's reference-based chibi renders as a valid 8×4 sheet.
        assert page.evaluate("window.Level32Sprites.loadedCharacters.includes('daan')")
        daan_line=page.locator('#scene-dialogues [data-speaker="daan"]')
        # The phase-three dialogue was dismissed before the fight; the avatar
        # and speaker content are still in the scene DOM.
        assert daan_line.count()>=2 and 'DOOOOOOG' in daan_line.all_inner_texts()[-1],daan_line.all_inner_texts()
        assert 'DAAN' in daan_line.first.inner_text()
        heal=page.evaluate('window.__rosieTest.daanHealProbe()')
        assert heal['active'] and all(heal['warnings']) and heal['capped'],heal
        assert heal['casts'][1]>heal['casts'][0]>0,heal
        assert heal['casts'][1]-heal['casts'][0]<=heal['maxHp']*.051,heal
        print('Daan two capped heals, special sprite and boulder slam: PASS')
    s=page.evaluate('window.__rosieTest.killBoss()')
    assert s['phase']=='ended' and s['missionUnlock'] and s['overlay']
    assert len(s['dialogueImages'])>=2 and all(im.startswith('data:image/webp') for im in s['dialogueImages'])
    print('victory and invitation: PASS')
    # Screenshot optional; uncomment if visual debugging is useful.
    both=page.locator('#birthday-mission .calendar-both')
    assert both.count()==1 and both.get_attribute('href')=='birthday.ics'
    assert both.get_attribute('download')=='level32-birthday.ics'
    assert 'BOTH MISSIONS' in both.inner_text()
    assert page.locator('#party-details').get_attribute('target')=='_blank'
    assert page.locator('#party-details').get_attribute('href').endswith('invitation.html')
    assert page.locator('.footer-invite').get_attribute('href').endswith('invitation.html')
    assert page.locator('#mission-unlock').is_visible()
    assert page.locator('#ending-invite').is_visible()
    assert page.locator('#ending-invite').get_attribute('target')=='_blank'
    # Direct invitation is available outside the ending overlay.
    assert page.locator('.footer-invite').count()==1
    # Fresh defeat ensures we show invitation even if nobody wins.
    s=page.evaluate('window.__rosieTest.start()')
    s=page.evaluate('window.__rosieTest.lose()')
    assert s['phase']=='ended' and s['missionUnlock'],s
    assert page.locator('#party-details').is_visible()
    assert page.locator('#ending-invite').is_visible()
    assert not errors,errors
    print('defeat/missions/syntax:', 'PASS')
    # Test live auto-rotation after all story/scroll tests. Browsers may
    # re-anchor document scroll during viewport rotation, which must not
    # contaminate unrelated cutscene no-scroll checks.
    if mobile and mode=='challenge' and not solo:
        original={'width':screen[0], 'height':screen[1]}
        rotated={'width':screen[1], 'height':screen[0]}
        page.set_viewport_size(rotated)
        other=page.evaluate('window.__rosieTest.mobileFacingAndSceneProbe()')
        assert all(other['first'].values()),other
        assert all(other['opposite'].values()),other
        assert all(other['scene'].values()),other
        page.set_viewport_size(original)
        restored=page.evaluate('window.__rosieTest.mobileFacingAndSceneProbe()')
        assert all(restored['first'].values()) and all(restored['opposite'].values()),restored
        print('Live phone auto-rotate and restore, lower-right Dash: PASS')
    page.close()

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium') or shutil.which('google-chrome'),args=['--no-sandbox','--disable-gpu'])
    browser_run(browser)
    browser_run(browser,screen=(390,844),mobile=True)
    browser_run(browser,screen=(390,844),mobile=True,mode='story')
    browser_run(browser,screen=(844,390),mobile=True,mode='challenge')
    browser_run(browser,screen=(1280,900),mode='extreme')
    browser_run(browser,screen=(1280,900),mode='story',solo=True)
    browser_run(browser,screen=(390,844),mobile=True,mode='extreme',solo=True)

    # Fifth hero mechanics: solo controls reused in co-op; exact bush-entry trigger.
    vanille_page=browser.new_page(viewport={'width':1280,'height':900})
    vanille_errors=[]
    vanille_page.on('pageerror',lambda e:vanille_errors.append(str(e)))
    vanille_page.set_content(html,wait_until='domcontentloaded',timeout=60000)
    vanille_page.wait_for_function("window.Level32Sprites && window.Level32Sprites.loadedCharacters.includes('vanille')",timeout=15000)
    assert vanille_page.locator('[data-hero="vanille"] .portrait img').evaluate('(im)=>im.complete && im.naturalWidth>0')
    vanille_page.locator('[data-hero="vanille"]').click()
    vanille_page.locator('#coop').check()
    vanille_page.evaluate('window.__rosieTest.start()')
    result=vanille_page.evaluate('window.__rosieTest.vanilleProbe()')
    assert result['initial']=={'hp':180,'speed':185,'damage':10,'regen':2.5},result
    assert result['glare']>0,result
    assert result['ploff']['moved']==0 and result['ploff']['enemyMoved']>0 and result['ploff']['cooldown']>3.4,result
    assert abs(result['healed']-2.5)<.01,result
    assert result['personalSpace']['wasHidden'] and result['personalSpace']['ejected'] and result['personalSpace']['dist']>51,result
    assert result['personalSpace']['speech'] and result['personalSpace']['lock']>0,result
    assert not vanille_errors,vanille_errors
    print('Vanille stats, glare, stationary Ploff, regen and private bush: PASS')
    vanille_page.close()
    browser.close()