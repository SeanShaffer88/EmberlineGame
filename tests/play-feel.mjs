import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {newGame,serialize,WORLD} from '../web/model.js';
mkdirSync('build/screenshots',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const checks=[],errors=[],external=[];
try{
 const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:1.5,isMobile:true,hasTouch:true}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!/^(http:\/\/127\.0\.0\.1:8844\/|data:|blob:)/.test(r.url()))external.push(r.url());});
 await page.goto('http://127.0.0.1:8844/');await page.locator('#start').click();await page.locator('#begin-exploring').click();await page.waitForTimeout(1200);
 const snapshot=()=>page.evaluate(async()=>{const {view:v,state:s}=await import('./main.js');return{player:{...s.player},stock:{...s.stock},gathered:{...s.gathered},energy:s.energy,zoom:v.zoom,target:v.zoomTarget,settings:s.settings,manual:v.manual,hero:v.project(s.player.x,s.player.z,1),bounds:v.viewport,route:v.routeDots.geometry.drawRange.count};});
 const overlaps=(a,b)=>a&&b&&a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height;
 const quest=await page.locator('#quest-card').boundingBox();assert.ok(quest.y+quest.height<210,'compact HUD should leave more of the valley visible');
 for(const id of ['#center','#zoom','#zoom-in','#menu','#home-button']){const b=await page.locator(id).boundingBox();assert.ok(b.width>=44&&b.height>=44,`${id} touch size`);}
 await page.screenshot({path:'build/screenshots/play-feel-valley.png'});
 const initial=await snapshot();await page.locator('#zoom-in').click();const easing=await snapshot();assert.equal(easing.target,initial.target-3);assert.ok(easing.zoom>easing.target,'button zoom should ease instead of snap');await page.waitForTimeout(800);assert.ok(Math.abs((await snapshot()).zoom-easing.target)<.1);
 await page.locator('#zoom').click();await page.waitForTimeout(800);
 checks.push('Compact HUD, 44px camera controls and smoothly eased button zoom');
 // Real multi-touch through Chromium, including one finger remaining after the pinch.
 const cdp=await context.newCDPSession(page),start=await snapshot();
 const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([id,x,y])=>({id,x,y,radiusX:1,radiusY:1,force:1}))});
 await touch('touchStart',[[1,140,440],[2,260,440]]);
 for(let i=1;i<=6;i++)await touch('touchMove',[[1,140-i*5,440],[2,260+i*5,440]]);
 await touch('touchEnd',[[1,110,440]]);await touch('touchEnd',[]);await page.waitForTimeout(400);
 const pinched=await snapshot();assert.ok(pinched.zoom<start.zoom-3&&pinched.zoom>=16);assert.deepEqual(pinched.player,start.player);assert.ok(await page.locator('#action-card').isHidden());assert.ok(await page.locator('#activity').isHidden());assert.equal(await page.locator('#center').getAttribute('aria-pressed'),'false');
 await page.locator('#center').click();assert.equal((await snapshot()).manual,false);
 assert.equal(await page.locator('#stick').count(),0);
 const zoom=(await snapshot()).target;await page.reload();await page.locator('#menu').waitFor();assert.equal((await snapshot()).settings.zoom,zoom);
 checks.push('Pinch never walks or selects, compass resumes follow, zoom survives reload and no joystick exists');
 // Follow a far-away explorer fixture to guard against position-dependent camera drift.
 await page.evaluate(async()=>{const {state:s,view:v}=await import('./main.js');s.player={x:13,z:8};v.center();});await page.waitForTimeout(1200);
 const far=await snapshot();assert.ok(far.hero.x>70&&far.hero.x<342&&far.hero.y>far.bounds.top&&far.hero.y<far.bounds.bottom,'far explorer remains in clear viewing area');
 // A menu opened while a movement key is held must stop it until a fresh press.
 await page.keyboard.down('ArrowRight');await page.waitForTimeout(350);await page.locator('#menu').click();await page.locator('#close-sheet').click();await page.waitForTimeout(450);const stopped=await snapshot();await page.keyboard.down('ArrowRight');await page.waitForTimeout(450);assert.deepEqual((await snapshot()).player,stopped.player);await page.keyboard.up('ArrowRight');
 checks.push('Follow framing stays useful away from home; menus release held movement');
 const fresh=newGame(31);fresh.started=true;fresh.settings.autoGather=false;fresh.player={x:4,z:5};
 await page.evaluate(data=>window.importEmberlineSave(data),serialize(fresh));await page.locator('#toast').waitFor({state:'hidden'});await page.waitForTimeout(400);
 await page.evaluate(async()=>{window.feelGame=await import('./main.js');const {sound}=window.feelGame;window.strikeKinds=[];const original=sound.play.bind(sound);sound.play=kind=>{window.strikeKinds.push(kind);original(kind);};});
 async function selectPine(){const p=await page.evaluate(async()=>(await import('./main.js')).view.project(4,6,1.2));await page.touchscreen.tap(p.x,p.y);if(await page.locator('[data-near]').count())await page.locator('[data-near]').filter({hasText:'Snow pine'}).first().click();await page.locator('#perform-action').waitFor();}
 await selectPine();await page.locator('#perform-action').click();await page.locator('#work-progress').waitFor();
 await page.waitForFunction(()=>document.getElementById('work-progress').value>.22);await page.screenshot({path:'build/screenshots/play-feel-gathering.png'});
 const effect=await page.evaluate(async()=>{const {view:v}=await import('./main.js');return{tool:v.tool.visible,axe:v.tools.axe.visible,ring:v.workRing.visible,drawn:v.workRing.geometry.drawRange.count};});assert.ok(effect.tool&&effect.axe&&effect.ring&&effect.drawn>0);
 await page.waitForFunction(()=>window.feelGame.state.gathered.wood===6);assert.equal((await snapshot()).stock['first-pine'],3);assert.deepEqual(await page.evaluate(()=>window.strikeKinds.filter(k=>k==='tree')),['tree','tree','tree']);
 checks.push('Gathering shows an axe and progress arc, plays three timed strikes and grants one harvest');
 await page.locator('#perform-action').waitFor();await page.locator('#perform-action').click();await page.locator('#work-progress').waitFor();await page.locator('#cancel-action').click();const cancelled=await snapshot();await page.waitForTimeout(1500);assert.equal((await snapshot()).gathered.wood,6);assert.equal((await snapshot()).stock['first-pine'],3);assert.ok((await snapshot()).energy>=cancelled.energy);assert.ok(await page.locator('#activity').isHidden());assert.ok(await page.locator('#action-card').isHidden());assert.equal(await page.evaluate(async()=>(await import('./main.js')).view.workTarget),null);
 checks.push('Cancel during work grants no loot, spends no energy and never reopens a stale selection');
 for(const [id,item,amount,tool]of [['near-coal','coal',4,'pick'],['near-scrap','scrap',5,'prybar'],['near-food','food',4,null]]){
  const n=WORLD.find(n=>n.id===id),fixture=newGame(31);fixture.started=true;fixture.settings.autoGather=false;fixture.player={x:n.x,z:n.z+1};await page.evaluate(data=>window.importEmberlineSave(data),serialize(fixture));await page.locator('#toast').waitFor({state:'hidden'});await page.evaluate(()=>window.strikeKinds=[]);
  const point=await page.evaluate(async n=>(await import('./main.js')).view.project(n.x+(n.type==='scrap'?.5:0),n.z-(n.type==='scrap'?.32:0),.4),n);await page.touchscreen.tap(point.x,point.y);if(await page.locator('[data-near]').count())await page.locator('[data-near]').filter({hasText:n.name}).first().click();assert.equal(await page.evaluate(async()=>(await import('./main.js')).view.selected?.id),id);await page.locator('#perform-action').click();await page.locator('#work-progress').waitFor();await page.waitForTimeout(80);
  const visible=await page.evaluate(async()=>{const v=(await import('./main.js')).view;return v.tool.visible?Object.keys(v.tools).find(k=>v.tools[k].visible):null;});assert.equal(visible,tool,`${id} tool`);
  await page.waitForFunction(({item,amount})=>window.feelGame.state.gathered[item]===amount,{item,amount});assert.equal((await snapshot()).stock[id],3);assert.deepEqual(await page.evaluate(type=>window.strikeKinds.filter(k=>k===type),n.type),[n.type,n.type,n.type]);await page.locator('#perform-action').waitFor();await page.locator('#dismiss-action').click();
 }
 checks.push('Coal uses a pick, salvage a prybar and berries bare hands; all have timed feedback and one correct reward');
 for(const size of [{width:360,height:740},{width:915,height:412}]){await page.setViewportSize(size);await page.waitForTimeout(900);assert.equal(await page.locator('#stick').count(),0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.ok(!overlaps(await page.locator('nav').boundingBox(),await page.locator('#home-button').boundingBox()));await page.screenshot({path:`build/screenshots/play-feel-${size.width}x${size.height}.png`});}
 checks.push('Small portrait and landscape layouts remain usable without horizontal overflow');
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);writeFileSync('build/play-feel-results.json',JSON.stringify({checks,errors,external},null,2));console.log(JSON.stringify({checks,errors,external},null,2));
}finally{await browser.close();}
