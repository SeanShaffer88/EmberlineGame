import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
mkdirSync('build/screenshots',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:1.5,isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[],checks=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8844/');await page.locator('#start').click();await page.locator('#begin-exploring').click();await page.waitForTimeout(1000);
 const where=()=>page.evaluate(async()=>{const {state,view}=await import('./main.js');return{...state.player,screen:view.project(state.player.x,state.player.z,0)};});
 const box=await page.locator('#stick').boundingBox(),cx=box.x+box.width/2,cy=box.y+box.height/2;
 const overlaps=(a,b)=>a&&b&&a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height;
 for(const id of ['#home-button','nav','#place-name'])assert.ok(!overlaps(box,await page.locator(id).boundingBox()),`joystick overlaps ${id}`);
 checks.push('Joystick sits clear of Return & rest, the menu bar and the place name');
 async function hold(dx,dy,ms){await page.mouse.move(cx,cy);await page.mouse.down();await page.mouse.move(cx+dx,cy+dy,{steps:3});await page.waitForTimeout(ms);await page.mouse.up();await page.waitForTimeout(450);}
 for(const [name,dx,dy] of [['right',48,0],['up',0,-48],['left',-48,0],['down',0,48]]){
  const a=await where();await hold(dx,dy,900);const b=await where();
  // Project both positions through the same camera: follow keeps the explorer
  // near the same screen point, so cross-frame screen deltas no longer measure walking.
  const from=await page.evaluate(async a=>(await import('./main.js')).view.project(a.x,a.z,0),a);
  const moved=Math.abs(b.x-a.x)+Math.abs(b.z-a.z),sx=b.screen.x-from.x,sy=b.screen.y-from.y;
  assert.ok(moved>=2,`${name}: walked ${moved} tiles`);
  assert.ok(dx?Math.sign(sx)===Math.sign(dx)&&Math.abs(sx)>Math.abs(sy):Math.sign(sy)===Math.sign(dy)&&Math.abs(sy)>Math.abs(sx),`${name}: screen motion ${sx},${sy}`);
  const c=await where();await page.waitForTimeout(600);const d=await where();assert.deepEqual([d.x,d.z],[c.x,c.z],`${name}: kept walking after release`);
 }
 checks.push('Holding the joystick walks in the matching screen direction and stops on release');
 const before=await where();await page.keyboard.down('ArrowUp');await page.waitForTimeout(900);await page.keyboard.up('ArrowUp');await page.waitForTimeout(450);const after=await where();
 const beforeProjection=await page.evaluate(async a=>(await import('./main.js')).view.project(a.x,a.z,0),before);
 assert.ok(after.screen.y<beforeProjection.y&&Math.abs(after.x-before.x)+Math.abs(after.z-before.z)>=2,'arrow key walking');
 checks.push('Arrow keys walk in screen directions');
 // This camera position puts the pine under the action button that will appear.
 // Its initiating touch must select only, never click through and start work.
 const selectionPosition=await where();
 const pine=await page.evaluate(async()=>(await import('./main.js')).view.project(4,6,1.2));await page.touchscreen.tap(pine.x,pine.y);await page.locator('#perform-action').waitFor();
 await page.waitForTimeout(500);assert.ok(await page.locator('#activity').isHidden(),'selection touch must not activate the newly shown action button');const selectedPosition=await where();assert.deepEqual([selectedPosition.x,selectedPosition.z],[selectionPosition.x,selectionPosition.z],'selection alone must not walk');
 checks.push('A resource touch does not click through to its newly opened action button');
 assert.ok(!overlaps(box,await page.locator('#action-card').boundingBox()),'joystick overlaps action card');await page.screenshot({path:'build/screenshots/07-joystick.png'});
 await hold(48,0,300);assert.ok(await page.locator('#action-card').isHidden(),'joystick should clear the selection');
 checks.push('Joystick clears a selection and does not overlap the action card');
 await page.waitForTimeout(600);const last=await where();await page.reload();await page.locator('#menu').waitFor();const saved=await where();assert.deepEqual([saved.x,saved.z],[last.x,last.z],'joystick position should survive reload');
 checks.push('Position reached with the joystick survives reload');
 assert.deepEqual(errors,[]);writeFileSync('build/joystick-results.json',JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks,errors},null,2));
}finally{await browser.close();}
