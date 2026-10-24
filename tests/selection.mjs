import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {newGame,serialize} from '../web/model.js';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:412,height:915},deviceScaleFactor:1.5,isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const s=newGame();s.started=true;s.player={x:4,z:5};await page.addInitScript(data=>localStorage.setItem('emberline.save',data),serialize(s));await page.goto('http://127.0.0.1:8844/');await page.locator('#menu').waitFor();
 await page.locator('#menu').click();for(const label of ['Finish only','All strikes','Off']){await page.locator('#haptics').click();assert.equal(await page.locator('#haptics').innerText(),label);}await page.locator('#close-sheet').click();
 // Deliberately overlapping rendered geometry makes the ambiguity deterministic.
 // World data is unchanged; no harvest/progression is claimed from this fixture.
 await page.evaluate(async()=>{window.game=await import('./main.js');const v=game.view;window.coalPosition=v.objects.get('near-coal').position.clone();v.objects.get('near-coal').position.copy(v.objects.get('first-pine').position);game.state.discovered.push('-7,2');v.sync(true);v.center();});await page.waitForTimeout(900);
 const point=await page.evaluate(()=>game.view.project(4,6,.3));await page.touchscreen.tap(point.x,point.y);assert.ok(await page.locator('[data-near]').count()>=2);await page.locator('[data-near]').filter({hasText:'Coal outcrop'}).click();assert.equal(await page.evaluate(()=>game.view.selected.id),'near-coal');assert.ok(await page.locator('#perform-action').isVisible());
 await page.evaluate(()=>game.view.objects.get('near-coal').position.copy(coalPosition));assert.deepEqual(errors,[]);const checks=['Haptic settings cycle through Off, Finish only and All strikes','A real touch on overlapping geometry opens a named chooser; choosing the coal selects the intended resource'];writeFileSync('build/selection-results.json',JSON.stringify({checks,errors,overlappingGeometryFixture:true},null,2));console.log(JSON.stringify({checks,errors},null,2));
}finally{await browser.close();}
