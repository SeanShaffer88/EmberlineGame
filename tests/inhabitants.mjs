import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import * as M from '../web/model.js';
mkdirSync('build/screenshots',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[],external=[],checks=[];
try{
 const context=await browser.newContext({viewport:{width:1100,height:800},deviceScaleFactor:1}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(!/^(http:\/\/127\.0\.0\.1:8844\/|data:|blob:)/.test(r.url()))external.push(r.url());});
 const s=M.newGame(38);s.started=true;await page.addInitScript(data=>localStorage.setItem('emberline.save',data),M.serialize(s));
 await page.goto('http://127.0.0.1:8844/');await page.locator('#menu').waitFor();
 await page.evaluate(async()=>{window.g=await import('./main.js');window.m=await import('./model.js');window.emberlinePause();window.frame=(dt=.033,motion={x:g.state.player.x,z:g.state.player.z,angle:0,walking:false},work=null)=>g.view.update(dt,motion,work);});
 const startup=await page.evaluate(()=>{frame();const v=g.view;return{loaded:v.art.report.loaded.length,people:v.inhabitants.people.length,knees:v.hero.getObjectByName('knee1')?.isGroup,world:m.WORLD.length,foxHidden:!v.journey.animals.fox.visible,home:v.objects.get('home').position.toArray()};});
 assert.equal(startup.loaded,26);assert.equal(startup.people,5);assert.ok(startup.knees&&startup.foxHidden);assert.deepEqual(startup.home,[0,0,-3]);
 checks.push('Older save loads all local models and five joint rigs; wildlife stays inside explored terrain; the stationary train and world data are retained');
 await page.evaluate(()=>{const s=g.state,v=g.view;for(const id in s.buildings)s.buildings[id]=2;for(const id in s.projects)s.projects[id]=3;s.flags={mira:true,oren:true,ivo:true,bridge:true,pump:true,relay:true};s.completed=m.QUESTS.map(q=>q.id);s.activeSeconds=0;s.discovered=[];for(let x=-20;x<=20;x++)for(let z=-20;z<=19;z++)s.discovered.push(`${x},${z}`);s.player={x:0,z:3};s.companion='ivo';v.sync(true);v.lookAt(-3,2);v.setZoom(16,true);frame();});
 const gait=await page.evaluate(()=>{
  const v=g.view,r=v.inhabitants.people[0],before=m.serialize(g.state),samples=[];
  for(let i=0;i<40;i++){frame(.033,{x:i*.04,z:3,angle:Math.PI/2,walking:true});if(i%10===0)samples.push({knee:r.legs[0].knee.rotation.x,pack:r.pack.position.y,phase:r.phase,weight:r.weight});}
  const weight=r.weight,phase=r.phase,companion=v.inhabitants.people[4],companionWeight=companion.weight;
  for(let i=0;i<30;i++)frame(.033,{x:1.56,z:3,angle:Math.PI/2,walking:false});
  return{samples,weight,phase,stopWeight:r.weight,stopPhase:r.phase,companionWeight,companionAngle:companion.facing,saveSame:before===m.serialize(g.state)};
 });assert.ok(gait.weight>.9&&gait.stopWeight<.001&&gait.phase===gait.stopPhase&&gait.companionWeight>.5&&gait.saveSame);assert.ok(new Set(gait.samples.map(a=>a.knee)).size>1&&new Set(gait.samples.map(a=>a.pack)).size>1);
 checks.push('Jointed knees/boots and backpack follow travelled strides, gait eases to rest, and companion locomotion follows its own catch-up distance without changing saves');
 const faces=await page.evaluate(()=>{const v=g.view,r=v.inhabitants.people[0];v.clock=.08;frame(0);const closed=r.eyes[0].scale.y;v.clock=.5;frame(0);const open=r.eyes[0].scale.y;for(let i=0;i<20;i++)frame(.033,{x:-4.3,z:3.8,angle:0,walking:false});const gaze=r.head.rotation.y;v.details.idle=11.5;frame(.033);const brush={amount:r.brush,arm:r.arms[1].rotation.z};frame(.033,{x:-4.3,z:3.8,angle:0,walking:true});return{closed,open,gaze,brush,cancel:r.brush===0};});
 assert.ok(faces.closed<.2&&faces.open===1&&Math.abs(faces.gaze)>.1&&faces.brush.amount>.8&&faces.brush.arm>.5&&faces.cancel,JSON.stringify(faces));
 checks.push('Staggered blinking and bounded head glances render; a shoulder-brushing idle yields to player movement');
 const work=await page.evaluate(()=>{const v=g.view,r=v.inhabitants.people[0],node=m.WORLD.find(n=>n.type==='tree'),food=m.WORLD.find(n=>n.type==='food'),motion={x:0,z:3,angle:0,walking:false};frame(.033,motion,{node,progress:.5});const tool={y:r.torso.position.y,x:r.torso.rotation.x,twist:r.torso.rotation.y,arm:r.arms[1].rotation.x,visible:v.tool.visible};frame(.033,motion,{node:food,progress:.5});const forage={y:r.torso.position.y,knee:r.legs[0].knee.rotation.x,visible:v.tool.visible};frame(.033,motion);return{tool,forage,reset:{y:r.torso.position.y,x:r.torso.rotation.x,knee:r.legs[0].knee.rotation.x,tool:v.tool.visible}};});
 assert.ok(work.tool.visible&&work.tool.x>.1&&work.tool.twist>.1&&work.forage.y<work.tool.y&&work.forage.knee>.6&&!work.forage.visible);assert.equal(work.reset.y,.45);assert.equal(work.reset.x,0);assert.ok(!work.reset.tool&&work.reset.knee<.001);
 checks.push('Tool anticipation/contact/body bracing follows actual work progress; berry picking crouches; cancellation restores the neutral pose and tool visibility');
 const crew=await page.evaluate(()=>{
  const v=g.view,a={};g.state.companion=null;v.sync();g.state.player={x:9,z:7};v.details.greetings={};
  for(const [id,pose]of [['mira','tend'],['oren','hammer'],['ivo','survey']]){let time=0;while(time<200&&!(m.crewRoutine({...g.state,activeSeconds:time},id).pose===pose&&(!['mira'].includes(id)||m.crewRoutine({...g.state,activeSeconds:time},id).x<-3)))time+=.25;g.state.activeSeconds=time;frame();const r=v.inhabitants.people.find(r=>r.id===id);a[id]={time,pose:r.pose,props:Object.entries(r.props).filter(([,o])=>o.visible).map(([id])=>id)};}
  let time=0;while(time<200&&m.crewRoutine({...g.state,activeSeconds:time},'mira').pose!=='rest')time+=.25;g.state.activeSeconds=time;v.clock=2.5;frame();const r=v.inhabitants.people.find(r=>r.id==='mira'),low=r.arms[1].rotation.x;v.clock=4;frame();a.tea={visible:r.props.mug.visible,low,high:r.arms[1].rotation.x};
  g.state.field.jobs.mira={ends:200};frame();a.job={mug:r.props.mug.visible,pose:r.pose};delete g.state.field.jobs.mira;return a;
 });assert.equal(crew.mira.pose,'bandages');assert.deepEqual(crew.mira.props,['bandage','kit']);assert.equal(crew.oren.pose,'hammer');assert.equal(crew.ivo.pose,'map');assert.ok(crew.tea.visible&&crew.tea.low!==crew.tea.high&&!crew.job.mug&&crew.job.pose==='bandages');
 checks.push('Mira checks a medical kit, Oren holds a moving hammer, Ivo opens a map, resting crew sip tea, and assigned jobs supersede rest gestures');
 const wildlife=await page.evaluate(()=>{
  const v=g.view,l=v.inhabitants,samples=[];g.state.activeSeconds=0;g.state.player={x:3,z:3};
  for(const [fox,hare,t]of [[3,2,2],[8,7,4],[12,15,6],[28,11,8]]){l.fox.clock=fox;l.hare.clock=hare;v.clock=t;frame();samples.push({fox:l.fox.mode,hare:l.hare.mode,tail:l.fox.tail.rotation.y,foxY:v.journey.animals.fox.position.y,hareY:v.journey.animals.hare.position.y,hareFoot:l.hare.feet[0].leg.rotation.x,pawHeight:l.hare.feet[0].leg.position.y,ear:l.hare.ears[0].pivot.rotation.x});}
  g.state.activeSeconds=360;for(let i=0;i<50;i++){v.clock+=.05;l.update(.05,null,null);}const sleep=l.fox.sleep;
  g.state.player={x:-7.8,z:7};for(let i=0;i<50;i++)frame(.05);const alert={fox:l.fox.mode,hare:l.hare.mode,sleep:l.fox.sleep,fx:v.journey.animals.fox.position.x,hx:v.journey.animals.hare.position.x};
  g.state.player={x:-6,z:8.8};for(let i=0;i<40;i++)frame(.05);const hareAlert=l.hare.mode==='alert';
  g.state.player={x:3,z:3};g.state.activeSeconds=0;for(let i=0;i<60;i++)frame(.05);const recover=l.fox.alert<.01&&l.hare.alert<.01;
  sLoop:for(const t of [3.5,5.5,7.5]){v.clock=t;frame(0);if(l.birdPreen>.1)break sLoop;}const preen=l.birdPreen;
  g.state.journey.craftedDecor=['feeder'];g.state.journey.decor={garden:'feeder'};v.sync();v.clock=1;frame(0);const flight={value:v.details.birdPhase.flight,preen:l.birdPreen};return{samples,sleep,alert,hareAlert,recover,preen,flight};
 });assert.deepEqual(wildlife.samples.map(a=>a.fox),['trot','sniff','pounce','rest']);assert.ok(new Set(wildlife.samples.map(a=>a.hare)).size>=3);assert.ok(wildlife.samples[2].foxY>.2&&wildlife.samples[1].pawHeight>.29&&wildlife.sleep>.9&&wildlife.alert.fox==='alert'&&wildlife.alert.sleep<.2&&wildlife.recover&&wildlife.hareAlert&&wildlife.preen>.1,JSON.stringify(wildlife));assert.ok(wildlife.flight.value>.8&&wildlife.flight.preen===0);
 checks.push('Ember trots, sniffs, pounces and curls; night rest yields smoothly to nearby players; Thimble hops with jointed feet, grooms and listens; Pip preens only while perched');
 const tracks=await page.evaluate(()=>{
  const v=g.view,l=v.inhabitants;g.state.player={x:3,z:3};g.state.activeSeconds=0;l.fox.clock=l.hare.clock=0;l.fox.sleep=0;l.fox.alert=l.hare.alert=0;
  // Run the actual pose layer for a long interval, rendering periodically. This
  // avoids mistaking a software-renderer throughput measurement for phone FPS.
  for(let i=0;i<600;i++){v.clock+=1/30;l.update(1/30,null,null);if(i%120===0)frame(0);}
  const active=l.paws.mesh.count,kinds=[...new Set(l.paws.records.filter(p=>p.age<28).map(p=>p.kind))];
  const records=l.paws.records.filter(p=>p.age<28).map(p=>({x:p.x,z:p.z}));for(let i=0;i<600;i++)l.paws.update(.05,{});frame(0);
  return{active,kinds,records,expired:l.paws.mesh.count,capacity:l.paws.records.length,oldRibbon:v.field.tracks.visible};
 });assert.ok(tracks.active>0&&tracks.kinds.includes('fox')&&tracks.kinds.includes('hare')&&tracks.expired===0&&tracks.capacity===96&&!tracks.oldRibbon);assert.ok(tracks.records.every(p=>p.x<-4.8&&p.x>-9.2&&p.z>6&&p.z<9));
 checks.push('Fixed-pool pawprints follow real animal travel, stay near their observation sites, replace the old trailing ribbon and fade away');
 const lifecycle=await page.evaluate(()=>{
  const v=g.view,l=v.inhabitants;g.state.activeSeconds=0;g.state.player={x:0,z:3};frame();
  // Upload every earned prop once before checking steady-state GPU allocations.
  for(const r of l.people)for(const prop of Object.values(r.props))prop.visible=true;v.renderer.render(v.scene,v.camera);frame();
  const memory={...v.renderer.info.memory},state=m.serialize(g.state);for(let i=0;i<160;i++){v.clock+=.03;l.update(.03,null,null);}frame();const stable={before:memory,after:{...v.renderer.info.memory},saveSame:state===m.serialize(g.state)};
  const snapshot=()=>JSON.stringify({people:l.people.map(r=>[r.phase,r.weight,r.head.rotation.toArray(),r.torso.rotation.toArray(),r.eyes[0].scale.y]),fox:[l.fox.clock,l.fox.head.rotation.toArray(),v.journey.animals.fox.position.toArray()],hare:[l.hare.clock,l.hare.head.rotation.toArray()],bird:l.birdHead.rotation.toArray(),paws:l.paws.records});
  v.photoMode=true;frame(0);const a=snapshot();for(let i=0;i<10;i++)frame(.05);const frozen=a===snapshot();v.photoMode=false;
  g.state.settings.reducedMotion=true;frame();const reduced={eyes:l.people.map(r=>r.eyes[0].scale.y),paws:l.paws.mesh.visible,knees:l.people.map(r=>r.legs[0].knee.rotation.x),preen:l.birdPreen};
  g.state.settings.reducedMotion=false;v.setQuality(true);for(let i=0;i<400;i++){v.clock+=.05;l.update(.05,null,null);}frame();const low=l.paws.mesh.count;v.setQuality(false);frame();return{stable,frozen,reduced,low};
 });assert.ok(lifecycle.stable.saveSame);assert.equal(lifecycle.stable.before.geometries,lifecycle.stable.after.geometries);assert.equal(lifecycle.stable.before.textures,lifecycle.stable.after.textures);assert.ok(lifecycle.frozen&&lifecycle.low<=32);assert.deepEqual(lifecycle.reduced,{eyes:[1,1,1,1,1],paws:false,knees:[0,0,0,0,0],preen:0});
 checks.push('Cosmetic updates leave saved progress unchanged and stabilize GPU allocations; photo freezes poses/tracks; Reduced motion disables secondary animation; Battery saver caps tracks at 32');
 await context.setOffline(true);await page.evaluate(()=>{for(let i=0;i<12;i++)frame(.04);});await context.setOffline(false);
 // Actual clean-photo controls. Supplied progression/time fixtures are art QA,
 // not evidence of earning the upgrades in a playthrough.
 await page.evaluate(()=>g.openPanel('comfort'));await page.locator('#scenic-mode').click();await page.locator('#photo-clean').click();
 for(const [name,x,z,seconds,fox,hare,clock]of [['camp',-3,2,25,8,7,5],['wildlife',-7,7.5,0,8,7,5],['fox',-8,7,0,28,15,5]]){
  await page.evaluate(a=>{const [x,z,seconds,fox,hare,clock]=a,v=g.view,l=v.inhabitants;g.state.activeSeconds=seconds;g.state.player={x:-4,z:3};v.clock=clock;l.fox.clock=fox;l.hare.clock=hare;l.fox.alert=l.hare.alert=l.fox.sleep=0;v.lookAt(x,z);v.setZoom(16,true);v.resize();v.viewport={...v.viewportTarget};v.updateProjection();frame(0);},[x,z,seconds,fox,hare,clock]);
  await page.screenshot({path:`build/screenshots/inhabitants-${name}.png`});
 }
 await page.evaluate(()=>window.emberlineBack());await page.setViewportSize({width:412,height:915});await page.waitForTimeout(150);await page.evaluate(()=>{const v=g.view;v.lookAt(-3,2);v.resize();v.viewport={...v.viewportTarget};v.updateProjection();frame(0);});await page.screenshot({path:'build/screenshots/inhabitants-portrait.png'});
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);checks.push('Actual WebGL frames render in desktop and phone portrait layouts, continue after disconnection and make no external requests');
 writeFileSync('build/inhabitants-results.json',JSON.stringify({checks,startup,gait,faces,work,crew,wildlife,tracks,lifecycle,errors,external,visualAndClockFixtures:true,physicalPhoneTested:false},null,2));console.log(JSON.stringify({checks,errors,external},null,2));
}finally{await browser.close();}
