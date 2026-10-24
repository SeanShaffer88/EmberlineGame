import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as M from '../web/model.js';
const visit=(s,id)=>{const n=M.WORLD.find(n=>n.id===id),path=M.pathTo(s,n.x,n.z,true);assert.ok(path,`reachable ${id}`);path.forEach(([x,z])=>assert.ok(M.move(s,x,z)));return n;};
const ready=()=>{const s=M.newGame(90);for(const id of Object.keys(M.CREW))s.flags[id]=true;for(const id of Object.keys(M.BUILDINGS))s.buildings[id]=1;for(const item of Object.keys(M.ITEMS))s.inventory[item]=100;return s;};
test('new places preserve every original resource ID and placement',()=>{
 const old=M.WORLD.filter(n=>!['project','discovery','puzzle','drift','field'].includes(n.type));
 assert.equal(createHash('sha256').update(JSON.stringify(old)).digest('hex'),'ebebfc25808330ab5218419eb8c52353900073e0147f749c4e89ddd54f86d15e');
 assert.equal(new Set(M.WORLD.map(n=>M.key(n.x,n.z))).size,M.WORLD.length);
});
test('three restorations require proximity, crew and infrastructure; each has a unique nearby discovery',()=>{
 const fresh=M.newGame();visit(fresh,'project-garden');assert.equal(M.interact(fresh,'project-garden').ok,false);fresh.flags.mira=true;assert.match(M.actionInfo(fresh,M.WORLD.find(n=>n.id==='project-garden')).reason,/Greenhouse/);
 const s=ready();
 for(const [id,p]of Object.entries(M.PROJECTS)){
  s.player={x:0,z:0};assert.equal(M.interact(s,'project-'+id).ok,false,'must visit');
  visit(s,'discovery-'+p.discovery);assert.ok(!s.discoverySeen.includes(p.discovery));assert.equal(M.interact(s,'discovery-'+p.discovery).ok,false);
  visit(s,'project-'+id);
  for(let stage=0;stage<3;stage++){
   const before={...s.inventory},r=M.interact(s,'project-'+id);assert.ok(r.ok);assert.equal(r.finished,stage===2);assert.equal(s.projects[id],stage+1);
   for(const [item,cost]of Object.entries(p.stages[stage].cost))assert.equal(s.inventory[item],before[item]-cost);
  }
  const complete=M.serialize(s);assert.equal(M.interact(s,'project-'+id).ok,false);assert.equal(M.serialize(s),complete);
  visit(s,'discovery-'+p.discovery);assert.ok(s.discoverySeen.includes(p.discovery));s.energy=0;assert.equal(M.interact(s,'discovery-'+p.discovery).ok,false);s.energy=100;
  const before={...s.inventory},r=M.interact(s,'discovery-'+p.discovery);assert.ok(r.discovery.text.length>60);for(const [item,count]of Object.entries(r.discovery.reward))assert.equal(s.inventory[item],before[item]+count);
  const claimed=M.serialize(s);assert.equal(M.interact(s,'discovery-'+p.discovery).ok,false);assert.equal(M.serialize(s),claimed);
 }
 assert.equal(s.discoveries.length,3);assert.equal(s.relics.length,0,'original keepsake trail is independent');
 M.rest(s);assert.deepEqual(s.projects,{garden:3,platform:3,signal:3});assert.deepEqual(M.deserialize(M.serialize(s)),s);
});
test('restoration cannot overspend or partially apply a failed stage',()=>{
 const s=ready();visit(s,'project-platform');s.inventory.wood=0;const before=M.serialize(s);assert.equal(M.interact(s,'project-platform').ok,false);assert.equal(M.serialize(s),before);
});
test('crew conversations unlock with the valley, retain choices and never grant farmable supplies',()=>{
 const s=M.newGame();assert.equal(M.converse(s,'mira-home',0).ok,false);s.flags.mira=true;const supplies={...s.inventory};
 assert.equal(M.converse(s,'mira-project',0).ok,false);s.projects.garden=1;assert.ok(M.converse(s,'mira-project',1).ok);assert.equal(s.conversations['mira-project'],1);
 assert.equal(M.converse(s,'mira-found',0).ok,false);s.projects.garden=3;s.discoverySeen=['seedtin'];s.discoveries=['seedtin'];assert.ok(M.converse(s,'mira-found',0).ok);
 for(const choice of [-1,2,1.5,Infinity,'0'])assert.equal(M.converse(s,'mira-home',choice).ok,false);
 for(let i=0;i<10;i++)assert.ok(M.converse(s,'mira-home',i%2).ok);assert.deepEqual(s.inventory,supplies);assert.deepEqual(M.deserialize(M.serialize(s)),s);
});
test('legacy saves migrate without resetting the valley, including a newly occupied project tile',()=>{
 const old=ready();old.player={x:-1,z:4};old.stock['first-pine']=2;old.settings.stickSide='right';for(const k of ['projects','discoveries','discoverySeen','conversations'])delete old[k];
 const s=M.deserialize(M.serialize(old));assert.deepEqual(s.player,old.player);assert.equal(s.stock['first-pine'],2);assert.deepEqual(s.projects,{garden:0,platform:0,signal:0});assert.equal(s.settings.stickSide,undefined);assert.ok(M.move(s,-1,3));
 old.projects={garden:99};assert.throws(()=>M.deserialize(M.serialize(old)));old.projects={garden:0};old.discoveries=['seedtin','bogus'];old.discoverySeen=['seedtin'];old.conversations={'mira-home':'bad',unknown:0};const clean=M.deserialize(M.serialize(old));assert.deepEqual(clean.discoveries,[]);assert.deepEqual(clean.conversations,{});
});
test('crew routines walk continuous clear lanes, alternate chores and rest, and depend only on active play',()=>{
 const s=ready();s.projects={garden:3,platform:3,signal:3};
 for(const id of Object.keys(M.CREW)){
  const poses=new Set();let previous=null,restored=false;
  for(let i=0;i<3600;i++){
   s.activeSeconds=i/10;const r=M.crewRoutine(s,id);poses.add(r.pose);restored ||= /winter garden|porch joinery|valley signal/.test(r.job);
   if(previous)assert.ok(Math.hypot(previous.x-r.x,previous.z-r.z)<=.076,`${id} jumped at ${s.activeSeconds}`);
   for(const n of M.WORLD.filter(n=>!['discovery','wolf'].includes(n.type)))assert.ok(Math.hypot(n.x-r.x,n.z-r.z)>.48,`${id} crosses ${n.id} at ${s.activeSeconds}`);
   previous=r;
  }
  assert.ok(poses.has('carry')&&poses.has('rest')&&poses.size>=3);assert.ok(restored);
  assert.deepEqual(M.crewRoutine(s,id),M.crewRoutine(M.deserialize(M.serialize(s)),id));
 }
});
