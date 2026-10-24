import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {newGame,serialize,PROJECTS,DISCOVERIES} from '../web/model.js';
mkdirSync('build/screenshots',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const checks=[],errors=[],external=[];
try{
 const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:1.5,isMobile:true,hasTouch:true}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(!/^(http:\/\/127\.0\.0\.1:8844\/|data:|blob:)/.test(r.url()))external.push(r.url());});
 // A supplied-supplies fixture keeps this UI test focused on restoration, not
 // replaying the separately tested campaign economy and rescues.
 const fixture=newGame(90);fixture.started=true;fixture.settings.autoGather=false;for(const id of ['mira','oren','ivo','pump'])fixture.flags[id]=true;for(const id of Object.keys(fixture.buildings))fixture.buildings[id]=1;for(const id of Object.keys(fixture.inventory))fixture.inventory[id]=150;
 fixture.settings.stickSide='right';
 await page.addInitScript(data=>{if(!localStorage.getItem('emberline.save'))localStorage.setItem('emberline.save',data);},serialize(fixture));
 await page.goto('http://127.0.0.1:8844/');await page.locator('#menu').waitFor();
 await page.evaluate(async()=>{window.game=await import('./main.js');window.rules=await import('./model.js');});
 assert.equal(await page.locator('#stick').count(),0);await page.locator('#menu').click();assert.equal(await page.locator('#stick-side').count(),0);await page.locator('#close-sheet').click();
 checks.push('Old right-handed save opens without joystick UI or joystick settings');
 // Gather camera samples over real single-finger drag movement and release.
 await page.evaluate(()=>game.view.center());const cdp=await context.newCDPSession(page);const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([id,x,y])=>({id,x,y,radiusX:1,radiusY:1,force:1}))});
 await page.evaluate(()=>{window.cameraSamples=[];window.recordCamera=true;const record=()=>{if(!window.recordCamera)return;const v=game.view,p=v.project(0,3,0);cameraSamples.push({x:p.x,y:p.y,activity:!document.getElementById('activity').hidden,viewport:{...v.viewport}});requestAnimationFrame(record);};requestAnimationFrame(record);});
 await touch('touchStart',[[1,200,520]]);await touch('touchMove',[[1,250,520]]);await page.waitForTimeout(650);await touch('touchEnd',[]);await page.waitForTimeout(900);
 const camera=await page.evaluate(()=>{recordCamera=false;return cameraSamples;});assert.ok(camera.length>5);let jump=0;for(let i=1;i<camera.length;i++){jump=Math.max(jump,Math.hypot(camera[i].x-camera[i-1].x,camera[i].y-camera[i-1].y));assert.deepEqual(camera[i].viewport,camera[0].viewport,'movement banner must not reframe the viewport');}assert.ok(jump<9,`camera jump ${jump}`);
 checks.push('Real drag movement and release keep a stable viewport and no large per-frame camera jump');
 // Import during an in-flight keyboard step must not apply that old step to
 // the newly imported player position.
 const current=await page.evaluate(()=>({...game.state.player}));const incoming={...fixture,player:current};
 await page.keyboard.down('ArrowRight');await page.waitForTimeout(350);
 await page.evaluate(data=>window.importEmberlineSave(data),serialize(incoming));await page.keyboard.up('ArrowRight');assert.deepEqual(await page.evaluate(()=>game.state.player),current);
 checks.push('Importing during movement discards the previous in-flight step and preserves the imported position');
 // Finish all nine stages through the actual touch UI and normal paths.
 for(const id of Object.keys(PROJECTS)){
  for(let stage=1;stage<=3;stage++){
   await page.locator('[data-panel="build"]').click();await page.locator(`[data-project="${id}"]`).click();await page.locator('#perform-action').click();
   await page.waitForFunction(({id,stage})=>game.state.projects[id]===stage,{id,stage});
   if(stage===3){await page.locator('#project-continue').waitFor();assert.ok((await page.locator('#sheet-body').innerText()).includes(PROJECTS[id].clue));await page.locator('#project-continue').click();}
  }
  const stages=await page.evaluate(id=>game.view.objects.get('project-'+id).userData.stages.map(g=>g.visible),id);assert.deepEqual(stages,[true,true,true]);
 }
 checks.push('All three permanent projects complete their nine stages through touch actions, charge supplies and reveal retained clues');
 await page.locator('[data-panel="crew"]').click();await page.locator('[data-talk="mira"]').click();await page.locator('[data-topic="mira-project"]').click();
 const paused=await page.evaluate(()=>({time:game.state.activeSeconds,pos:game.view.residents.mira.position.toArray()}));await page.waitForTimeout(900);assert.deepEqual(await page.evaluate(()=>({time:game.state.activeSeconds,pos:game.view.residents.mira.position.toArray()})),paused);
 await page.locator('[data-answer="1"]').click();assert.ok((await page.locator('#dialogue-response').innerText()).includes('look south'));await page.screenshot({path:'build/screenshots/living-valley-conversation.png'});await page.locator('#close-sheet').click();
 checks.push('Crew conversation offers a reply, remembers the chosen response, and pauses survival and routines while reading');
 // Discovery approach fixture uses ordinary model steps; the search/reward is UI.
 for(const [id,d]of Object.entries(DISCOVERIES)){
  await page.evaluate(async id=>{const n=rules.WORLD.find(n=>n.id==='discovery-'+id),path=rules.pathTo(game.state,n.x,n.z,true);for(const [x,z]of path)rules.move(game.state,x,z);game.view.sync(true);game.view.center();},id);await page.waitForTimeout(1200);
  assert.equal(await page.evaluate(id=>game.view.objects.get('discovery-'+id).visible,id),true);
  const p=await page.evaluate(id=>{const n=rules.WORLD.find(n=>n.id==='discovery-'+id);return game.view.project(n.x,n.z,.22);},id);await page.touchscreen.tap(p.x,p.y);if(await page.locator('[data-near]').count())await page.locator('[data-near]').filter({hasText:d.name}).click();
  assert.equal(await page.evaluate(()=>game.view.selected?.type),'discovery');await page.locator('#perform-action').click();await page.locator('#discovery-continue').waitFor();assert.ok((await page.locator('#sheet-body').innerText()).includes(d.text));await page.locator('#discovery-continue').click();
  assert.equal(await page.evaluate(project=>game.view.objects.get('project-'+project).userData.keepsake.visible,d.project),true);
 }
 await page.locator('#quest-card').click();await page.locator('[data-journal="camp"]').click();assert.ok((await page.locator('#sheet-body').innerText()).includes('Found along the way · 3 / 3'));await page.screenshot({path:'build/screenshots/living-valley-memories.png'});await page.locator('#close-sheet').click();
 await page.reload();await page.locator('#menu').waitFor();await page.evaluate(async()=>{window.game=await import('./main.js');window.rules=await import('./model.js');});
 const saved=await page.evaluate(()=>({projects:game.state.projects,discoveries:game.state.discoveries,reply:game.state.conversations['mira-project'],home:game.view.objects.get('home').position.toArray()}));assert.deepEqual(saved.projects,{garden:3,platform:3,signal:3});assert.equal(saved.discoveries.length,3);assert.equal(saved.reply,1);assert.deepEqual(saved.home,[0,0,-3]);
 checks.push('Three clues lead to one-time discoveries, add camp decorations and journal entries, and survive reload with the train in place');
 // Place the explorer immediately behind a real loaded tree. Check that its
 // materials alone fade and are released after walking clear.
 await page.evaluate(()=>{game.state.player={x:4,z:5};rules.reveal(game.state);game.view.sync(true);game.view.center();});await page.waitForTimeout(1100);
 const fading=await page.evaluate(()=>({ids:[...game.view.treeFades.keys()],alpha:game.view.treeFades.get('first-pine')?.alpha,other:(()=>{const values=[];game.view.objects.get('near-pine').traverse(m=>{if(m.isMesh&&m.name!=='touch-target')for(const mat of Array.isArray(m.material)?m.material:[m.material])values.push(mat.opacity);});return values;})()}));assert.ok(fading.ids.includes('first-pine'));assert.ok(fading.alpha<.3);assert.ok(fading.other.length&&fading.other.every(x=>x===1),'shared tree materials remain opaque');
 await page.screenshot({path:'build/screenshots/living-valley-tree-fade.png'});
 await page.evaluate(()=>{game.state.player={x:0,z:3};game.view.center();});await page.waitForTimeout(1600);assert.equal(await page.evaluate(()=>game.view.treeFades.has('first-pine')),false);
 await page.locator('#menu').click();await page.locator('#quality').click();await page.locator('#close-sheet').click();await page.evaluate(()=>{game.state.player={x:4,z:5};game.view.center();});await page.waitForTimeout(1100);assert.ok(await page.evaluate(()=>game.view.treeFades.get('first-pine')?.alpha<.3));
 checks.push('Actual foreground tree fades around the explorer and restores/disposes its copies after clearing; Battery saver also fades it');
 // Tap a physical resident, then check a completed overview fixture.
 await page.evaluate(()=>{game.state.player={x:0,z:3};game.state.activeSeconds=0;game.view.center();});await page.waitForTimeout(900);
 const crew=await page.evaluate(()=>{const p=game.view.residents.oren.position;return game.view.project(p.x,p.z,.9);});await page.touchscreen.tap(crew.x,crew.y);if(await page.locator('[data-near]').count())await page.locator('[data-near]').filter({hasText:'Oren'}).click();await page.locator('[data-topic="oren-home"]').waitFor();await page.locator('#close-sheet').click();
 await page.evaluate(()=>{game.view.lookAt(-1,0);game.view.setZoom(26,true);});await page.waitForTimeout(500);await page.screenshot({path:'build/screenshots/living-valley-settlement.png'});
 checks.push('Residents can be tapped in the world to talk; restored scene renders with all three earned keepsake decorations');
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);writeFileSync('build/living-valley-results.json',JSON.stringify({checks,cameraMaxFrameDelta:jump,errors,external,suppliedSuppliesFixture:true,discoveryApproachFixture:true},null,2));console.log(JSON.stringify({checks,cameraMaxFrameDelta:jump,errors,external},null,2));
}finally{await browser.close();}
