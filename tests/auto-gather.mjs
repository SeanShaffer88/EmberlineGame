import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import * as M from '../web/model.js';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const checks=[],errors=[],external=[];
try{
 const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:1,isMobile:true,hasTouch:true}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!/^(http:\/\/127\.0\.0\.1:8844\/|data:|blob:)/.test(r.url()))external.push(r.url());});
 const fresh=(x=4,z=5)=>{const s=M.newGame(7);s.started=true;s.completed=M.QUESTS.map(q=>q.id);s.player={x,z};M.reveal(s);return s;};
 await page.addInitScript(data=>{if(!localStorage.getItem('emberline.save'))localStorage.setItem('emberline.save',data);},M.serialize(fresh(0,3)));
 await page.goto('http://127.0.0.1:8844/');await page.locator('#menu').waitFor();await page.evaluate(async()=>{window.g=await import('./main.js');window.m=await import('./model.js');window.strikes=[];const original=g.sound.play.bind(g.sound);g.sound.play=kind=>{strikes.push(kind);original(kind);};});
 const load=async s=>{await page.evaluate(data=>{window.importEmberlineSave(data);strikes=[];},M.serialize(s));};
 await load(fresh());await page.waitForFunction(()=>g.state.stock['first-pine']===0);
 const harvest=await page.evaluate(()=>({stock:g.state.stock['first-pine'],wood:g.state.gathered.wood,player:g.state.player,strikes:strikes.filter(k=>k==='tree').length,finishes:strikes.filter(k=>k==='finish-tree').length,selected:g.view.selected??null}));
 assert.deepEqual(harvest,{stock:0,wood:24,player:{x:4,z:5},strikes:12,finishes:4,selected:null});assert.ok(await page.locator('#action-card').isHidden());
 checks.push('Standing within reach automatically exhausts four tree harvests with twelve strikes and four rewards, without a tap, path or camera selection');
 const story=fresh();story.completed=[];await load(story);await page.locator('#story-continue').waitFor();assert.equal(await page.evaluate(()=>g.state.gathered.wood),12);assert.equal(await page.evaluate(()=>g.state.stock['first-pine']),2);const storyTime=await page.evaluate(()=>g.state.activeSeconds);await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>g.state.activeSeconds),storyTime);await page.locator('#story-continue').click();await page.waitForFunction(()=>g.state.stock['first-pine']===0);
 checks.push('Automatic harvests advance the normal story; its dialogue pauses gathering and closing it resumes the remaining stock');
 await load(fresh());await page.waitForFunction(()=>document.getElementById('work-progress').value>.1);await page.locator('#cancel-action').click();await page.waitForTimeout(1500);assert.equal(await page.evaluate(()=>g.state.gathered.wood||0),0);assert.ok(await page.locator('#activity').isHidden());
 checks.push('Cancel aborts an unfinished harvest without cost or loot and suppresses automatic restart while standing in place');
 await load(fresh());await page.waitForFunction(()=>document.getElementById('work-progress').value>.1);
 const cdp=await context.newCDPSession(page),touch=(type,p)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:p.map(([id,x,y])=>({id,x,y,radiusX:1,radiusY:1,force:1}))});
 // Drag away from the tree while its automatic swing is in progress.
 await touch('touchStart',[[1,170,530]]);await touch('touchMove',[[1,110,530]]);await page.waitForTimeout(1000);await touch('touchEnd',[]);
 const leaving=await page.evaluate(()=>({player:{...g.state.player},wood:g.state.gathered.wood||0}));assert.ok(Math.hypot(leaving.player.x-4,leaving.player.z-5)>.8);assert.equal(leaving.wood,0);await page.waitForTimeout(450);assert.deepEqual(await page.evaluate(()=>g.state.player),leaving.player);
 checks.push('Real one-finger dragging remains responsive during an automatic swing, leaving range cancels it, and lifting the finger still stops movement');
 await load(fresh(4,3.8));assert.ok(await page.locator('#activity').isHidden());
 const steer=await page.evaluate(()=>{const a=g.view.project(4,3.8,0),b=g.view.project(4,6,0),d=Math.hypot(b.x-a.x,b.y-a.y);return{x:(b.x-a.x)/d*60,y:(b.y-a.y)/d*60};});
 await touch('touchStart',[[1,210,530]]);await touch('touchMove',[[1,210+steer.x,530+steer.y]]);await page.waitForFunction(()=>!document.getElementById('work-progress').hidden);await touch('touchEnd',[]);await page.waitForFunction(()=>g.state.gathered.wood>=6);await page.evaluate(()=>g.openPanel('comfort'));
 await page.locator('#scenic-mode').click();const photo=await page.evaluate(()=>m.serialize(g.state));await page.waitForTimeout(1300);assert.equal(await page.evaluate(()=>m.serialize(g.state)),photo);await page.evaluate(()=>window.emberlineBack());
 checks.push('Dragging into range starts harvesting without tapping the resource; photo mode freezes the world and cannot finish a harvest');
 const low=fresh();low.energy=8;await load(low);await page.waitForFunction(()=>g.state.gathered.wood===6);await page.waitForTimeout(1700);assert.equal(await page.evaluate(()=>g.state.stock['first-pine']),3);assert.ok(await page.locator('#activity').isHidden());
 checks.push('Automatic work keeps the existing energy/warmth/health reserves');
 await load(fresh());await page.waitForFunction(()=>document.getElementById('work-progress').value>.1);await page.locator('#menu').click();const paused=await page.evaluate(()=>m.serialize(g.state));await page.waitForTimeout(1300);assert.equal(await page.evaluate(()=>m.serialize(g.state)),paused);await page.locator('[data-open-camp="comfort"]').click();await page.locator('#auto-gather').click();assert.equal(await page.locator('#auto-gather').innerText(),'Off');await page.locator('#close-sheet').click();await page.waitForTimeout(1500);assert.equal(await page.evaluate(()=>g.state.gathered.wood||0),0);await page.reload();await page.locator('#menu').waitFor();assert.equal(await page.evaluate(async()=>(await import('./main.js')).state.settings.autoGather),false);
 checks.push('Menus pause/cancel the action; the Comfort toggle opts into manual gathering and persists across reload');
 await page.evaluate(async()=>{window.g=await import('./main.js');window.m=await import('./model.js');});
 for(const [id,item,amount]of [['near-coal','coal',4],['near-scrap','scrap',5],['near-food','food',4]]){
  const n=M.WORLD.find(n=>n.id===id),s=fresh(n.x,n.z+1);s.stock[id]=1;await load(s);await page.waitForFunction(({item,amount})=>g.state.gathered[item]===amount,{item,amount});await page.evaluate(()=>g.openPanel('settings'));assert.equal(await page.evaluate(id=>g.state.stock[id],id),0);
 }
 checks.push('Coal, salvage and berries auto gather through the same normal economy and exhaust finite stock');
 await load(fresh());await page.waitForFunction(()=>document.getElementById('work-progress').value>.1);await page.evaluate(()=>window.emberlinePause());const stopped=await page.evaluate(()=>m.serialize(g.state));await page.waitForTimeout(1400);assert.equal(await page.evaluate(()=>m.serialize(g.state)),stopped);await context.setOffline(true);await page.evaluate(()=>window.emberlineResume());await page.waitForFunction(()=>g.state.gathered.wood>=6);await context.setOffline(false);
 checks.push('App pause cannot finish work or advance timers; automatic gathering resumes without networking');
 await page.screenshot({path:'build/screenshots/inhabitants-auto-gather.png'});assert.deepEqual(errors,[]);assert.deepEqual(external,[]);writeFileSync('build/auto-gather-results.json',JSON.stringify({checks,harvest,leaving,errors,external,physicalPhoneTested:false},null,2));console.log(JSON.stringify({checks,errors,external},null,2));
}finally{await browser.close();}
