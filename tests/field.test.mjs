import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../web/model.js';
const ready=()=>{const s=M.newGame(65);s.started=true;for(const k of Object.keys(s.inventory))s.inventory[k]=100;for(const k of Object.keys(s.buildings))s.buildings[k]=1;for(const k of ['mira','oren','ivo','bridge','relay'])s.flags[k]=true;return s;};
function walk(s,p){const route=M.pathTo(s,p.x,p.z);assert.ok(route,`reachable ${p.x},${p.z}`);for(const [x,z]of route)assert.ok(M.move(s,x,z));M.reveal(s);}
test('every new field site is walkable and reachable without relocating any old node',()=>{
 const s=ready();for(const n of M.fieldNodes()){assert.ok(M.walkable(s,n.x,n.z),n.id);walk(s,n);assert.ok(M.fieldSeen(s,n));}
 assert.equal(new Set(M.WORLD.map(n=>n.id)).size,M.WORLD.length);
});
test('eight notebook finds require legal approach, record once and unlock a paid cabinet',()=>{
 const s=ready(),p=s.inventory.parts;assert.equal(M.observeSpecimen(s,'fossil').ok,false);assert.equal(M.buildField(s,'cabinet').ok,false);
 for(const [id,n]of Object.entries(M.SPECIMENS)){walk(s,n);assert.ok(M.observeSpecimen(s,id).ok);assert.equal(M.observeSpecimen(s,id).ok,false);}
 assert.equal(s.inventory.parts,p+8);walk(s,{x:0,z:3});assert.ok(M.buildField(s,'cabinet').ok);assert.equal(M.buildField(s,'cabinet').ok,false);assert.equal(s.inventory.parts,p+5);assert.equal(M.deserialize(M.serialize(s)).field.specimens.length,8);
});
test('all viewpoints, local benches and signs require visits; breathers and rewards cannot be repeated immediately',()=>{
 const s=ready();for(const [id,p]of Object.entries(M.VISTAS)){assert.equal(M.buildBench(s,id).ok,false);walk(s,p);assert.ok(M.visitVista(s,id).ok);assert.equal(M.visitVista(s,id).ok,false);assert.ok(M.buildBench(s,id).ok);s.energy=40;s.warmth=40;assert.ok(M.takeBreather(s,id).ok);assert.equal(s.energy,65);assert.equal(M.takeBreather(s,id).ok,false);}
 for(const [id,p]of Object.entries(M.SIGNS)){walk(s,p);assert.ok(M.repairSign(s,id).ok);assert.equal(M.repairSign(s,id).ok,false);}
 const saved=M.deserialize(M.serialize(s));assert.equal(saved.field.benches.length,3);assert.equal(saved.field.signs.length,3);
});
test('fishing has clear untimed cues, free retries, active-time cooldown and four saved species',()=>{
 const s=ready();assert.equal(M.startFishing(s).ok,false);assert.ok(M.buildField(s,'rod').ok);walk(s,M.POND);assert.ok(M.startFishing(s).ok);const food=s.inventory.food;assert.match(M.fishingCue(s),/Wait/);assert.equal(M.fishingMove(s,2).ok,false);assert.equal(s.inventory.food,food);
 for(let i=0;i<4;i++){
  assert.ok(M.startFishing(s).ok);const pattern=M.FISH[s.field.fishing.id].pattern;for(let j=0;j<3;j++){const before=s.activeSeconds;assert.ok(M.fishingMove(s,pattern[j]).ok);assert.equal(s.activeSeconds,before);if(j===0){const restored=M.deserialize(M.serialize(s));assert.deepEqual(restored.field.fishing,s.field.fishing);}}
  assert.equal(M.fishingMove(s,2).ok,false);assert.equal(M.startFishing(s).ok,false);for(let tick=0;tick<60;tick++)M.tick(s,1);
 }assert.equal(s.inventory.food,food+12);assert.equal(Object.keys(s.field.fish).length,4);
});
test('mastery uses ordinary gathered totals and pays each of twelve thresholds once',()=>{
 const s=ready();for(const id of Object.keys(s.field.mastery)){assert.equal(M.claimMastery(s,id).ok,false);for(const threshold of M.MASTERY_STEPS){s.gathered[id]=threshold;assert.ok(M.claimMastery(s,id).ok);assert.equal(M.claimMastery(s,id).ok,false);}assert.equal(M.masteryInfo(s,id).level,3);}
 assert.equal(M.claimMastery(s,'__proto__').ok,false);
});
test('crew jobs spend once, pause without ticks, finish after active ticks and refund without duplication',()=>{
 const s=ready();s.companion='oren';assert.equal(M.startJob(s,'oren').ok,false);s.companion=null;
 for(const id of Object.keys(M.JOBS))assert.ok(M.startJob(s,id).ok);const before={...s.inventory};assert.equal(M.startJob(s,'oren').ok,false);assert.deepEqual(s.inventory,before);assert.equal(M.claimJob(s,'oren').ok,false);
 const saved=M.deserialize(M.serialize(s));assert.deepEqual(saved.field.jobs,s.field.jobs);for(let i=0;i<150;i++)M.tick(s,1);
 assert.ok(M.claimJob(s,'oren').ok);assert.equal(M.claimJob(s,'oren').ok,false);assert.equal(M.cancelJob(s,'oren').ok,false);assert.ok(M.cancelJob(s,'mira').ok);assert.equal(M.claimJob(s,'mira').ok,false);assert.ok(M.claimJob(s,'ivo').ok);assert.equal(s.field.jobCount.oren,1);
 assert.equal(M.startJob(s,'toString').ok,false);
});
test('camp stories and radio have earned gates, persistent archives and no reward farming',()=>{
 const s=M.newGame();assert.equal(M.readCampStory(s,'mira').ok,false);assert.equal(M.tuneRadio(s).ok,false);s.buildings.furnace=1;s.flags.mira=true;assert.ok(M.readCampStory(s,'mira').ok);assert.ok(M.readCampStory(s,'mira').ok);assert.deepEqual(s.field.stories,['mira']);
 s.flags.relay=true;const inventory={...s.inventory};for(let i=0;i<4;i++)assert.ok(M.tuneRadio(s).ok);assert.equal(M.tuneRadio(s).ok,false);assert.deepEqual(s.inventory,inventory);assert.equal(M.deserialize(M.serialize(s)).field.radio,4);
});
test('workshop exchanges and bridge lanterns cannot overspend, repeat builds, or operate away from camp',()=>{
 const s=ready();assert.ok(M.buildField(s,'bridgeLights').ok);assert.equal(M.buildField(s,'bridgeLights').ok,false);s.inventory.scrap=5;const before={...s.inventory};assert.equal(M.exchangeSupplies(s,'fuel').ok,false);assert.deepEqual(s.inventory,before);s.inventory.scrap=6;assert.ok(M.exchangeSupplies(s,'fuel').ok);assert.equal(s.inventory.scrap,0);walk(s,M.VISTAS.pines);assert.equal(M.exchangeSupplies(s,'salvage').ok,false);assert.equal(M.blowWhistle(s).ok,false);
});
test('whistle acknowledges camp locally and has an active-time cooldown',()=>{
 const s=ready();assert.ok(M.blowWhistle(s).ok);assert.equal(M.blowWhistle(s).ok,false);for(let i=0;i<5;i++)M.tick(s,1);assert.ok(M.blowWhistle(s).ok);assert.equal(s.field.whistles,2);
});
test('imported optional field progress and mixer values stay bounded; old saves get empty activities',()=>{
 const s=ready();delete s.field;const old=M.deserialize(JSON.stringify(s));assert.deepEqual(old.field,M.newField());
 const raw=ready();raw.field={specimens:['violet','violet','bad'],vistas:['pines'],benches:['pines','ridge'],builds:['rod','bad'],fish:{dace:-4,loach:Infinity},radio:99,casts:-1,mastery:{wood:3},fishing:{id:'dace',step:99},jobs:{oren:{ends:Infinity}},breathers:{pines:1e99}};raw.settings.effectsVolume=4;raw.settings.musicVolume=-1;raw.settings.ambienceVolume='loud';const restored=M.deserialize(JSON.stringify(raw));assert.deepEqual(restored.field.specimens,['violet']);assert.deepEqual(restored.field.benches,['pines']);assert.equal(restored.field.radio,4);assert.equal(restored.field.mastery.wood,0);assert.equal(restored.field.fishing,null);assert.deepEqual(restored.field.jobs,{});assert.equal(restored.settings.effectsVolume,1);assert.equal(restored.settings.musicVolume,0);assert.equal(restored.settings.ambienceVolume,.7);
});
test('route previews use explored passable cells and never alter discovery or player position',()=>{
 const s=ready();M.setWaypoint(s,2,5);const before=M.serialize(s),route=M.exploredRoute(s);assert.ok(route?.length);for(const [x,z]of route){assert.ok(s.discovered.includes(`${x},${z}`));assert.ok(M.walkable(s,x,z));}assert.equal(M.serialize(s),before);s.discovered=['0,3','10,10'];s.camp.waypoint={x:10,z:10};assert.equal(M.exploredRoute(s),null);
});
test('river and bird ambience respond to location and weather without affecting rules',()=>{
 const s=ready();s.player={x:0,z:3};const home=M.ambienceLevels(s);s.player.z=-10;assert.ok(M.ambienceLevels(s).river>home.river);s.activeSeconds=250;assert.equal(M.ambienceLevels(s).birds,0);
});
