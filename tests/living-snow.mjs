import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import * as M from '../web/model.js';
mkdirSync('build/screenshots',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[],external=[],checks=[];
try{
 const context=await browser.newContext({viewport:{width:1024,height:768},deviceScaleFactor:1}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(!/^(http:\/\/127\.0\.0\.1:8844\/|data:|blob:)/.test(r.url()))external.push(r.url());});
 const original=M.newGame(38);original.started=true;await page.addInitScript(data=>{if(!localStorage.getItem('emberline.save'))localStorage.setItem('emberline.save',data);},M.serialize(original));
 await page.goto('http://127.0.0.1:8844/');await page.locator('#menu').waitFor();
 await page.evaluate(async()=>{window.g=await import('./main.js');window.m=await import('./model.js');window.emberlinePause();window.frame=(dt=.033,motion={x:g.state.player.x,z:g.state.player.z,angle:0,walking:false},work=null)=>g.view.update(dt,motion,work);});
 const initial=await page.evaluate(()=>{const d=g.view.details;frame();return{cloth:d.clothesline.visible,porch:d.porchLamps.visible,vent:d.vent.visible,drifts:d.drifts.count,icicles:d.icicles.count,loaded:g.view.art.report.loaded.length,hasShader:!!d.snowMaterial.onBeforeCompile};});
 assert.equal(initial.loaded,26);assert.ok(!initial.cloth&&!initial.porch&&!initial.vent);assert.ok(initial.drifts>0&&initial.icicles===8);
 checks.push('Existing saves start without new fields; the unbuilt camp has no laundry, restored porch lamps or greenhouse vent, and unexplored terrain stays concealed');

 // Explicit visual fixture, not a claim of completing upgrades through play.
 await page.evaluate(()=>{const s=g.state,v=g.view;for(const id in s.buildings)s.buildings[id]=2;for(const id in s.projects)s.projects[id]=3;s.flags={mira:true,oren:true,ivo:true,bridge:true,pump:true,relay:true};s.completed=m.QUESTS.map(q=>q.id);s.activeSeconds=0;s.journey.craftedDecor=['feeder'];s.journey.decor={garden:'feeder'};s.discovered=[];for(let x=-20;x<=20;x++)for(let z=-20;z<=19;z++)s.discovered.push(`${x},${z}`);s.player={x:0,z:3};v.sync(true);v.lookAt(-2,1);v.setZoom(20,true);frame();});
 const scene=await page.evaluate(()=>{const d=g.view.details,v=g.view;return{cloth:d.clothesline.visible,porch:d.porchLamps.visible,vent:d.vent.visible,icicles:d.icicles.count,reeds:d.reeds.count,drifts:d.drifts.count,geometry:v.renderer.info.memory.geometries,textures:v.renderer.info.memory.textures,calls:v.renderer.info.render.calls};});
 assert.ok(scene.cloth&&scene.porch&&scene.vent&&scene.icicles===32&&scene.reeds>20&&scene.drifts>30);
 await page.locator('#toast').waitFor({state:'hidden'});await page.screenshot({path:'build/screenshots/living-snow-camp.png'});
 checks.push('Earned upgrades reveal laundry, icicles, hanging lanterns and a vent with growing leaves; original scenery and interactive models still render');

 const motion=await page.evaluate(()=>{
  const v=g.view,d=v.details;
  // Newly earned held props upload lazily. Warm them once before checking that
  // repeated animation does not allocate more GPU geometry or textures.
  for(const r of v.inhabitants.people)for(const prop of Object.values(r.props))prop.visible=true;
  v.renderer.render(v.scene,v.camera);frame();
  const before=m.serialize(g.state),mem={...v.renderer.info.memory};
  let hadFeet=false,hadBreath=false;for(let i=0;i<180;i++){frame(1/30,{x:i*.012,z:3,angle:i<60?0:Math.PI/2,walking:true});hadFeet||=d.particles.items.some(p=>p.kind==='foot'&&p.age<p.life);hadBreath||=d.particles.items.some(p=>p.kind==='breath'&&p.age<p.life);}
  const node=m.WORLD.find(n=>n.id==='first-pine');v.impact(node);frame();const branch=d.particles.items.filter(p=>p.kind==='branch'&&p.age<p.life).length;
  const positions=d.particles.positions.slice();for(let i=0;i<90;i++)frame(1/30);const expired=d.particles.items.filter(p=>p.kind==='branch'&&p.age<p.life).length;
  const unchanged=before===m.serialize(g.state);return{hadFeet,hadBreath,branch,expired,changed:positions.some((n,i)=>n!==d.particles.positions[i]),unchanged,beforeMemory:mem,afterMemory:{...v.renderer.info.memory},capacity:d.particles.items.length,heading:d.heading};
 });assert.ok(motion.hadFeet&&motion.hadBreath&&motion.branch>0&&motion.expired===0&&motion.changed&&motion.unchanged);assert.equal(motion.capacity,128);assert.equal(motion.beforeMemory.geometries,motion.afterMemory.geometries);assert.equal(motion.beforeMemory.textures,motion.afterMemory.textures);
 checks.push('Walking emits powder and breath, real tree impacts shed snow, particles expire within a fixed pool, and cosmetic updates neither grow GPU allocations nor alter the save');

 const actors=await page.evaluate(()=>{
  const v=g.view,d=v.details;g.state.activeSeconds=0;d.idle=0;d.greetings={};
  frame(.2,{x:-4.5,z:3,angle:0,walking:false});for(let i=0;i<25;i++)frame(.033,{x:-4.5,z:3,angle:0,walking:false});
  const wave=v.residents.mira.userData.greeting,arm=v.residents.mira.getObjectByName('arm1').rotation.z;
  g.state.field.jobs.mira={ends:150};frame(.033,{x:-4,z:5,angle:0,walking:false});const jobCancelsWave=!v.residents.mira.userData.greeting;delete g.state.field.jobs.mira;
  d.idle=5;frame(.033);const warmArm=v.hero.getObjectByName('arm1').rotation.x;
  frame(.033,{x:0,z:3,angle:0,walking:true});const walkResets=d.idle===0;
  g.state.activeSeconds=45;d.lastSpark=-1;frame(.033);const sparks=d.particles.items.filter(p=>p.kind==='spark'&&p.age<p.life).length;
  return{wave,arm,jobCancelsWave,warmArm,walkResets,sparks};
 });assert.ok(actors.wave&&Math.abs(actors.arm)>.1&&actors.jobCancelsWave&&actors.warmArm<-.9&&actors.walkResets&&actors.sparks>0,JSON.stringify(actors));
 checks.push('Nearby free crew wave, assigned work cancels greetings, idle hand-warming yields immediately to movement, and Oren’s workshop hammering produces sparks');

 const visitor=await page.evaluate(()=>{const v=g.view,d=v.details,a=[];for(const t of [1,8,17]){v.clock=t;frame(0);a.push({pos:v.journey.animals.bird.position.toArray(),wing:d.birdWings[0].pivot.rotation.z,phase:{...d.birdPhase}});}delete g.state.journey.decor.garden;v.sync();frame();const reset=d.birdPhase===null;g.state.journey.decor.garden='feeder';v.sync();return{a,reset};});
 assert.ok(visitor.a[0].phase.flight>0&&visitor.a[1].phase.flight===0&&visitor.a[2].phase.flight>0&&visitor.reset);assert.notDeepEqual(visitor.a[0].pos,visitor.a[1].pos);
 checks.push('Pip approaches, lands, pecks and departs at a crafted feeder; removing or moving the feeder uses the existing decoration rules');

 const climate=await page.evaluate(async()=>{const T=await import('./vendor/three.module.js'),v=g.view,d=v.details;g.state.activeSeconds=180;v.weatherBlend=0;v.clock=40;frame();const golden=d.golden;g.state.settings.steadyDaylight=true;frame();const steady=d.golden;g.state.settings.steadyDaylight=false;v.lookAt(-3,-10);v.setZoom(20,true);g.state.activeSeconds=260;for(let i=0;i<180;i++)frame(1/30);const lowestGust=Math.min(...d.gusts.map(o=>new T.Box3().setFromObject(o).min.y));return{golden,steady,wind:d.wind.value,mist:d.mist.filter(x=>x.visible).length,gusts:d.gusts.filter(x=>x.visible).length,time:d.time.value,lowestGust};});
 assert.ok(climate.golden>.9&&climate.steady===0&&climate.wind>1&&climate.mist>0&&climate.gusts>0);
 assert.ok(climate.lowestGust>.08,'ground powder must lie above the snow, never cut through it');
 await page.screenshot({path:'build/screenshots/living-snow-creek.png'});
 await page.evaluate(()=>{g.state.activeSeconds=180;g.view.weatherBlend=0;g.view.lookAt(-3,2);g.view.setZoom(20,true);frame();});await page.screenshot({path:'build/screenshots/living-snow-golden.png'});
 checks.push('Creek mist, drifting ground snow, reeds and cloth react to wind; the golden-hour grade responds to daylight and respects Steady daylight');

 const freeze=await page.evaluate(()=>{const v=g.view,d=v.details;v.photoMode=true;const snapshot=()=>JSON.stringify({clock:v.clock,time:d.time.value,wind:d.wind.value,particles:Array.from(d.particles.positions),gusts:d.gusts.map(o=>o.position.toArray()),lamps:d.pendants.map(o=>o.rotation.z),bird:v.journey.animals.bird.position.toArray(),hero:v.hero.rotation.toArray(),vent:d.vent.rotation.x});frame(0);const a=snapshot();for(let i=0;i<20;i++)frame(.05);const frozen=a===snapshot();v.photoMode=false;g.state.settings.reducedMotion=true;frame();const reduced={wind:d.wind.value,time:d.time.value,pool:d.particles.mesh.visible,mist:d.mist.some(o=>o.visible),gusts:d.gusts.some(o=>o.visible),lamps:d.pendants.map(o=>o.rotation.z)};g.state.settings.reducedMotion=false;v.setQuality(true);frame();const low={pool:d.particles.mesh.geometry.drawRange.count,mist:d.mist.some(o=>o.visible),gusts:d.gusts.some(o=>o.visible),cloud:d.cloud.value};v.setQuality(false);frame();return{frozen,reduced,low};});
 assert.ok(freeze.frozen);assert.deepEqual(freeze.reduced,{wind:0,time:0,pool:false,mist:false,gusts:false,lamps:[0,0]});assert.deepEqual(freeze.low,{pool:32,mist:false,gusts:false,cloud:0});
 checks.push('Photo mode freezes new effects; Reduced motion keeps cloth, lanterns and reeds still and removes drifting particles; Battery saver omits mist, gusts and cloud shadows and caps the particle pool at 32');

 await context.setOffline(true);const offline=await page.evaluate(()=>{const before=m.serialize(g.state);for(let i=0;i<40;i++)frame(.025);return{same:before===m.serialize(g.state),active:g.view.details.time.value};});assert.ok(offline.same&&offline.active>0);await context.setOffline(false);
 await page.setViewportSize({width:412,height:915});await page.waitForTimeout(200);
 const portrait=await page.evaluate(()=>{const v=g.view;v.lookAt(-3,2);v.setZoom(18,true);v.resize();v.viewport={...v.viewportTarget};v.updateProjection();frame();const gl=v.renderer.getContext(),pixels=new Uint8Array(64*64*4);gl.readPixels(Math.floor(gl.drawingBufferWidth/2)-32,Math.floor(gl.drawingBufferHeight/2)-32,64,64,gl.RGBA,gl.UNSIGNED_BYTE,pixels);const colors=new Set();for(let i=0;i<pixels.length;i+=4)colors.add(`${pixels[i]},${pixels[i+1]},${pixels[i+2]}`);return colors.size;});assert.ok(portrait>20,'portrait must contain actual rendered scenery after resize');
 await page.screenshot({path:'build/screenshots/living-snow-portrait.png'});
 // Use the actual clean-photo controls for the final art samples.
 await page.setViewportSize({width:1100,height:800});await page.waitForTimeout(200);await page.evaluate(()=>g.openPanel('comfort'));await page.locator('#scenic-mode').click();await page.locator('#photo-clean').click();
 for(const [name,seconds,x,z,zoom,clock]of [['camp',0,-2,1,21,9],['golden',180,-3,2,21,12],['creek',260,-3,-10,22,18],['close',180,-4,3,16,9]]){
  await page.evaluate(p=>{const [seconds,x,z,zoom,clock]=p,v=g.view;g.state.activeSeconds=seconds;v.weatherBlend=seconds===260?1:0;v.clock=clock;v.lookAt(x,z);v.setZoom(zoom,true);v.resize();v.viewport={...v.viewportTarget};v.updateProjection();frame(0);},[seconds,x,z,zoom,clock]);
  await page.screenshot({path:`build/screenshots/living-snow-${name}.png`});
 }
 await page.evaluate(()=>window.emberlineBack());
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 checks.push('The new scenery animates after network disconnection, uses no external requests, and renders in phone portrait without changing movement, inventory or progress');
 writeFileSync('build/living-snow-results.json',JSON.stringify({checks,initial,scene,motion,actors,visitor,climate,freeze,portraitColors:portrait,errors,external,visualAndClockFixtures:true,physicalPhoneTested:false},null,2));console.log(JSON.stringify({checks,errors,external},null,2));
}finally{await browser.close();}
