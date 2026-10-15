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
  const saved={foes,shots,boss,phase,fx};
  const targets=[320,365,410].map(x=>({x,y:200,hp:200,maxHp:200,size:12,kind:'bleepling'}));
  const shot={x:290,y:200,vx:3000,vy:0,ttl:1,kind:'dragon',damage:17,owner:0,pierce:1,hitTargets:new Set()};
  foes=targets;shots=[shot];boss=null;phase='explore';fx=[];
  advanceProjectiles(.045);
  const value={hp:targets.map(t=>t.hp),hits:shot.hitTargets.size,left:shots.length};
  foes=saved.foes;shots=saved.shots;boss=saved.boss;phase=saved.phase;fx=saved.fx;
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
  const previous={level,xp,goal,phase,players:players.map(p=>({hp:p.hp,maxHp:p.maxHp,speed:p.speed,damage:p.damage,perkGlow:p.perkGlow,perkRarity:p.perkRarity}))};
  const oldLevel=level;level=4;xp=goal-1;gainXP(2);
  const offered=phase==='upgrade'&&Boolean(perkOffer),choices=$('perk-choices').querySelectorAll('button').length;
  const rarities=perkOffer?.offers.map(x=>x.rarity)||[];
  acceptUpgrade(0);
  const closed=phase===previous.phase&&$('perk-panel').hidden&&!perkOffer;
  level=previous.level;xp=previous.xp;goal=previous.goal;
  players.forEach((p,i)=>Object.assign(p,previous.players[i]));
  return {offered,choices,rarities,closed,level:oldLevel};
 },
 xpProbe(){
  const old={level,xp,goal},modes={};
  level=6;goal=999999;xp=0;gainXP(10);modes.afterFive=xp;
  level=5;xp=0;gainXP(10);modes.firstFive=xp;
  level=old.level;xp=old.xp;goal=old.goal;
  return modes;
 },
 heroBalance(){return Object.fromEntries(Object.entries(roster).map(([key,v])=>[key,Math.round(v.damage/v.rate)]))},
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
    s=page.evaluate('window.__rosieTest.start()')
    assert page.locator('.hero-stats').count()==4
    assert 'FIGHTER STATS' in page.locator('.hero-stats').first.inner_text()
    ratios=page.evaluate('window.__rosieTest.heroBalance()')
    assert ratios['winnifred']>ratios['rosie'] and ratios['millie']>ratios['ellie'],ratios
    levels=page.evaluate('window.__rosieTest.xpProbe()')
    assert levels['firstFive']==10 and abs(levels['afterFive']-(10 if mode=='story' else 6 if mode=='extreme' else 7.8))<0.00001,levels
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
    assert s['sceneName']=='clue2' and s['imgSrc'].startswith('data:image/webp')
    s=page.evaluate('window.__rosieTest.continue()')
    assert s['duoActive'] and s['phase']=='explore',s
    print('mini-boss',page.evaluate('window.__rosieTest.getEnemyList()'))
    assert page.evaluate('window.__rosieTest.duoGap()')>350, 'Boink and Bocht must spawn apart'
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
    assert s['phase']=='cutscene' and s['clues']==3 and s['sceneName']=='clue3' and s['imgSrc'].startswith('data:image/webp'),s
    s=page.evaluate('window.__rosieTest.continue()')
    assert s['laserUnlocked'] and s['phase']=='explore'
    s=page.evaluate('window.__rosieTest.nearFridge()')
    assert s['phase']=='cutscene' and s['sceneName']=='intro',s
    print('fridge reveal: PASS')
    s=page.evaluate('window.__rosieTest.continue()')
    assert s['phase']=='boss'
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
        print('Daan animated SPITE boulder slam: PASS')
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