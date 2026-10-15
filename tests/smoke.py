import sys,re,json, traceback, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT/'tools'))
from build import game_as_single_html
html=game_as_single_html()
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
  const saved={players,worldBubbles:worldBubbles.slice(),pairBanterClock};
  const keys=Object.keys(PAIR_BANTER),details=[];
  for(const key of keys){
   players=key.split('|').map((id,i)=>player(id,i));
   players[0].x=players[1].x;players[0].y=players[1].y;worldBubbles=[];pairBanterClock=0;
   updatePairBanter(.1);details.push({key,lines:worldBubbles.length});
  }
  players=saved.players;worldBubbles=saved.worldBubbles;pairBanterClock=saved.pairBanterClock;
  return details;
 },
 getEnemyList(){return [...new Set(foes.map(e=>e.kind))]},
 state(){return {phase,clues,duoActive,duoDefeated,laserUnlocked,laserIndex:laserChallenge.index,scentStep,score,kills,coneWindup,elapsed,hp:players.map(p=>p.hp),sceneName,cutsceneNext,bossHp:boss?.hp||0,daanActive,bossRage:boss?.rage||false,bossMaxHp:boss?.maxHp||0,liteFx,guardWave:gate?.wave??null,guardians:foes.filter(e=>e.guardian&&e.hp>0).length,cleared:gateCleared.slice(),mode:difficulty,overlay:!$('overlay').classList.contains('hidden'),imgSrc:$('overlay-art').getAttribute('src').slice(0,90),dialogueImages:[...$('scene-dialogues').querySelectorAll('img')].map(im=>im.getAttribute('src').slice(0,80)),missionUnlock:$('mission-unlock').classList.contains('show'),objectText:$('objective-label').textContent}}
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
    page.wait_for_function('window.Level32Sprites && window.Level32Sprites.loadedCharacters.length === 9', timeout=15000)
    # Day 5C: eight approved sheets plus a provisional Daan sheet decode in Chromium.
    assert page.evaluate("window.Level32Sprites.loadedCharacters.length")==9
    assert page.evaluate("window.Level32Sprites.previewEnabled") is True
    assert page.evaluate("window.Level32Sprites.loadedCharacters.includes('daan')")
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
      const artRestored=realSheets.every(Boolean) && engine.loadedCharacters.length===9;
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
    if solo: page.locator('#coop').uncheck()
    assert page.locator('[data-dash]').count()==2
    assert page.locator('[data-joystick]').count()==2
    assert 'Daan joins' not in page.locator('#difficulty').inner_text()
    assert page.locator('.select-invite').get_attribute('target')=='_blank'
    assert page.locator('.hero-invite-line a').get_attribute('target')=='_blank'
    assert page.locator('#ending-invite').is_hidden()
    if not mobile and mode=='challenge' and not solo:
        matrix=page.evaluate('window.__rosieTest.combatMatrix()')
        assert len(matrix)==12,matrix
        for hero in ['rosie','millie','winnifred','ellie']:
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
        print('12-character-mode balance matrix and Extreme-only +/X bananas: PASS')
    soundtrack=page.evaluate('window.__rosieTest.soundtrackConfig()')
    assert set(['duo','boss1','boss2','boss3']).issubset(soundtrack['modes']),soundtrack
    assert soundtrack['legendaryBpm']>=170,soundtrack
    s=page.evaluate('window.__rosieTest.start()')
    if not mobile and mode=='challenge' and not solo:
        ambush=page.evaluate('window.__rosieTest.bushAmbushProbe()')
        assert all(ambush.values()),ambush
        nick=page.evaluate('window.__rosieTest.nicknameProbe()')
        assert set(nick['names'])=={'Rosie the Dog','Silly Millie','Ellie Bellie',
          'Princess Winnifred, floof of her name'},nick
        assert all(any(lyric[1] in line for line in nick['lines']) for lyric in nick['theme']),nick
        print('Ambush crit, bush-hit ejection and new Rosie/Daan lyrics: PASS')
    if not mobile and mode=='challenge' and not solo:
        stealth=page.evaluate('window.__rosieTest.bushStealthProbe()')
        assert all(stealth.values()),stealth
        pairs=page.evaluate('window.__rosieTest.pairDialogueProbe()')
        assert len(pairs)==6 and all(pair['lines']==2 for pair in pairs),pairs
        print('Bush concealment, 30s scene, search and all six pair dialogues: PASS')
    assert page.locator('.hero-stats').count()==4
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
        assert 'DAAN' in daan_line.inner_text()
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
    browser.close()