import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {newGame,serialize} from '../web/model.js';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const checks=[],errors=[],external=[];
try{
 const page=await browser.newPage({viewport:{width:412,height:915},deviceScaleFactor:1.5,isMobile:true,hasTouch:true});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('request',r=>{if(!/^(http:\/\/127\.0\.0\.1:8844\/|data:|blob:)/.test(r.url()))external.push(r.url());});
 const old=newGame(73);old.started=true;old.inventory.wood=71;old.buildings.engine=1;old.flags.mira=true;delete old.settings.music;
 await page.addInitScript(data=>{if(!localStorage.getItem('emberline.save'))localStorage.setItem('emberline.save',data);},serialize(old));
 await page.goto('http://127.0.0.1:8844/');await page.locator('#menu').waitFor();
 const initial=await page.evaluate(async()=>{const {view,state}=await import('./main.js');return{report:view.art.report,wood:state.inventory.wood,music:state.settings.music,engine:state.buildings.engine,home:view.objects.get('home').position.toArray(),tree:view.objects.get('first-pine').children[0].userData.asset};});
 assert.equal(initial.report.loaded.length,16);assert.deepEqual(initial.report.failed,[]);assert.equal(initial.wood,71);assert.equal(initial.music,true);assert.equal(initial.engine,1);assert.equal(initial.tree,'pineSmall');assert.deepEqual(initial.home,[0,0,-3]);
 checks.push('All 16 local GLBs and palette texture load without CSP, shader or console errors; old save retains progress and gains the default music setting');
 await page.locator('#menu').click();await page.waitForTimeout(300);
 assert.equal(await page.evaluate(async()=>(await import('./main.js')).sound.ctx.state),'running');
 await page.locator('#music').click();await page.waitForTimeout(600);
 assert.equal(await page.evaluate(async()=>(await import('./main.js')).state.settings.music),false);
 await page.locator('#sound').click();await page.waitForTimeout(100);
 assert.equal(await page.evaluate(async()=>(await import('./main.js')).sound.ctx.state),'suspended');
 await page.locator('#sound').click();await page.locator('#music').click();await page.locator('#close-sheet').click();
 await page.evaluate(()=>window.emberlinePause());await page.waitForTimeout(200);
 assert.equal(await page.evaluate(async()=>(await import('./main.js')).sound.ctx.state),'suspended');
 await page.evaluate(()=>window.emberlineResume());await page.waitForTimeout(200);
 checks.push('Audio starts after interaction, music can be disabled separately, master mute and Android pause suspend the audio context');
 const audio=await page.evaluate(async()=>{
  const {Sound}=await import('./audio.js');const {newGame}=await import('./model.js');
  const s=new Sound(()=>true),c=new OfflineAudioContext(1,48000*3,48000);s.ctx=c;s.noise=c.createBuffer(1,48000,48000);const data=s.noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.sin(i*1.7);
  s.tone(261.6256,0,2.8,.025);s.rustle(.5,1800,.12,.023);const result=await c.startRendering(),samples=result.getChannelData(0);let sum=0,peak=0;for(const n of samples){sum+=n*n;peak=Math.max(peak,Math.abs(n));}return{rms:Math.sqrt(sum/samples.length),peak,finite:samples.every(Number.isFinite)};
 });assert.ok(audio.finite&&audio.rms>.001&&audio.peak<.2);checks.push('Original note/footstep synthesis renders finite, non-silent PCM below clipping (not a speaker listening test)');
 // Explicit visual fixture: this does not claim UI completion of the campaign.
 await page.evaluate(async()=>{const {state:s,view:v}=await import('./main.js');for(const id in s.buildings)s.buildings[id]=3;s.flags={mira:true,oren:true,ivo:true,bridge:true,beacon:true};s.companion=null;s.discovered=[];for(let x=-20;x<=20;x++)for(let z=-20;z<=19;z++)s.discovered.push(`${x},${z}`);s.secretSeen=['secret0'];v.sync(true);v.lookAt(-1,0);v.zoom=24;v.resize();});
 const positions=()=>page.evaluate(async()=>{const {view:v}=await import('./main.js');return{crew:v.residents.oren.position.toArray(),hare:v.art.hare.position.toArray(),tree:v.objects.get('first-pine').rotation.z};});
 const before=await positions();await page.waitForTimeout(1300);const after=await positions();assert.notDeepEqual(before.crew,after.crew);assert.notDeepEqual(before.hare,after.hare);assert.notEqual(before.tree,after.tree);
 const upgraded=await page.evaluate(async()=>{const {view:v}=await import('./main.js');return{lamps:v.art.lamps.every(x=>x.visible),wagon:v.objects.get('home').children.find(c=>c.userData.asset==='wagon').visible,home:v.objects.get('home').position.toArray(),rewards:v.art.rewards.filter(r=>r.group.visible).length};});
 assert.ok(upgraded.lamps&&upgraded.wagon&&upgraded.rewards>=12);assert.deepEqual(upgraded.home,[0,0,-3]);
 await page.screenshot({path:'build/screenshots/07-living-settlement.png'});checks.push('Upgraded fixture shows wagon, porch, lamps and building decorations; residents, hare and trees animate; home remains at its original coordinates');
 await page.evaluate(async()=>{const {state:s}=await import('./main.js');s.activeSeconds=250;});
 for(let i=0;i<50;i++){if(await page.evaluate(async()=>(await import('./main.js')).view.weatherBlend>.8))break;await page.waitForTimeout(250);}
 const storm=await page.evaluate(async()=>{const {view:v}=await import('./main.js');const full=v.snow.geometry.drawRange.count;v.setQuality(true);v.updateWeather(.02);return{blend:v.weatherBlend,full,low:v.snow.geometry.drawRange.count,shadows:v.renderer.shadowMap.enabled};});
 assert.ok(storm.blend>.8&&storm.full>300&&storm.low<190&&!storm.shadows);checks.push('Storm fixture strengthens snowfall; Battery saver reduces density and disables shadows');
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 const fallback=await browser.newPage();await fallback.route('**/assets/models/**',r=>r.abort());await fallback.goto('http://127.0.0.1:8844/');await fallback.locator('#start').waitFor();
 const failed=await fallback.evaluate(async()=>{const {view:v}=await import('./main.js');return{failed:v.art.report.failed.length,tree:!!v.objects.get('first-pine').children.length,train:!!v.objects.get('home').getObjectByName('livery')};});assert.equal(failed.failed,16);assert.ok(failed.tree&&failed.train);await fallback.locator('#start').click();await fallback.locator('#begin-exploring').click();await fallback.locator('[data-panel="craft"]').click();await fallback.locator('[data-craft="planks"][data-count="1"]').click();
 assert.equal(await fallback.evaluate(async()=>(await import('./main.js')).state.inventory.planks),2);checks.push('Injected art failures leave a playable original-mesh fallback; startup and crafting still work');
 writeFileSync('build/art-audio-results.json',JSON.stringify({checks,audio,upgraded,storm,errors,external,visualFixture:true},null,2));console.log(JSON.stringify({checks,errors,external},null,2));
}finally{await browser.close();}
