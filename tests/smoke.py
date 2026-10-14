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
 getEnemyList(){return [...new Set(foes.map(e=>e.kind))]},
 state(){return {phase,clues,duoActive,duoDefeated,laserUnlocked,score,kills,coneWindup,elapsed,hp:players.map(p=>p.hp),sceneName,cutsceneNext,bossHp:boss?.hp||0,guardWave:gate?.wave??null,guardians:foes.filter(e=>e.guardian&&e.hp>0).length,cleared:gateCleared.slice(),mode:difficulty,overlay:!$('overlay').classList.contains('hidden'),imgSrc:$('overlay-art').getAttribute('src').slice(0,90),dialogueImages:[...$('scene-dialogues').querySelectorAll('img')].map(im=>im.getAttribute('src').slice(0,80)),missionUnlock:$('mission-unlock').classList.contains('show'),objectText:$('objective-label').textContent}}
};'''
pos=html.rfind('})();')
assert pos>0
html=html[:pos]+hook+'\n'+html[pos:]
assert 'window.__rosieTest' in html

def browser_run(browser,screen=(1280,900),mobile=False):
    page=browser.new_page(viewport={'width':screen[0],'height':screen[1]},device_scale_factor=1, is_mobile=mobile,has_touch=mobile)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(html,wait_until='domcontentloaded',timeout=60000)
    page.wait_for_timeout(300)
    s=page.evaluate('window.__rosieTest.state()')
    print('idle',s['phase'])
    page.locator('#mute').click()
    assert page.locator('.select-invite').get_attribute('target')=='_blank'
    assert page.locator('.hero-invite-line a').get_attribute('target')=='_blank'
    s=page.evaluate('window.__rosieTest.start()')
    assert s['phase']=='explore'
    s=page.evaluate('window.__rosieTest.place(0)')
    assert s['phase']=='explore' and s['clues']==0 and s['guardWave']==0 and s['guardians']>0, s
    # Running to a later scroll cannot bypass the current ward.
    skipped=page.evaluate('window.__rosieTest.place(1)')
    assert skipped['clues']==0 and skipped['guardWave']==0
    page.evaluate('window.__rosieTest.place(0)')
    s=page.evaluate('window.__rosieTest.clearGuards()')
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
    page.locator('#overlay-start').click()
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
    s=page.evaluate('window.__rosieTest.killsDuo()')
    assert s['duoDefeated'] and not s['duoActive'],s
    s=page.evaluate('window.__rosieTest.place(2)')
    assert s['phase']=='explore' and s['clues']==2 and s['guardians']>0
    s=page.evaluate('window.__rosieTest.clearGuards()')
    assert s['phase']=='cutscene' and s['clues']==3 and s['sceneName']=='clue3' and s['imgSrc'].startswith('data:image/webp'),s
    s=page.evaluate('window.__rosieTest.continue()')
    assert s['laserUnlocked'] and s['phase']=='explore'
    s=page.evaluate('window.__rosieTest.nearFridge()')
    assert s['phase']=='cutscene' and s['sceneName']=='intro',s
    print('fridge reveal: PASS')
    s=page.evaluate('window.__rosieTest.continue()')
    assert s['phase']=='boss'
    camp=page.evaluate('window.__rosieTest.bossCampCheck()')
    assert camp['pushed'] and camp['hpAfter'] < camp['hpBefore'] and camp['bossAfter']>0, camp
    print('Tolly standing-on-boss regression: PASS')
    s=page.evaluate('window.__rosieTest.hitBoss()')
    assert s['phase']=='cutscene' and s['sceneName']=='phase2'
    s=page.evaluate('window.__rosieTest.continue()')
    assert s['phase']=='boss'
    s=page.evaluate('window.__rosieTest.killBoss()')
    assert s['phase']=='ended' and s['missionUnlock'] and s['overlay']
    assert len(s['dialogueImages'])>=2 and all(im.startswith('data:image/webp') for im in s['dialogueImages'])
    print('victory and invitation: PASS')
    # Screenshot optional; uncomment if visual debugging is useful.
    assert page.locator('#party-details').get_attribute('target')=='_blank'
    assert page.locator('#party-details').get_attribute('href').endswith('invitation.html')
    assert page.locator('.footer-invite').get_attribute('href').endswith('invitation.html')
    assert page.locator('#mission-unlock').is_visible()
    # Direct invitation is available outside the ending overlay.
    assert page.locator('.footer-invite').count()==1
    # Fresh defeat ensures we show invitation even if nobody wins.
    s=page.evaluate('window.__rosieTest.start()')
    s=page.evaluate('window.__rosieTest.lose()')
    assert s['phase']=='ended' and s['missionUnlock'],s
    assert page.locator('#party-details').is_visible()
    assert not errors,errors
    print('defeat/missions/syntax:', 'PASS')
    page.close()

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium') or shutil.which('google-chrome'),args=['--no-sandbox','--disable-gpu'])
    browser_run(browser)
    browser_run(browser,screen=(390,844),mobile=True)
    browser.close()