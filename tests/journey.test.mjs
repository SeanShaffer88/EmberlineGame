import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../web/model.js';
const node=id=>M.WORLD.find(n=>n.id===id);
function ready(){const s=M.newGame(90);for(const k of Object.keys(s.inventory))s.inventory[k]=150;for(const k of Object.keys(s.buildings))s.buildings[k]=1;for(const k of ['mira','oren','ivo','bridge'])s.flags[k]=true;s.projects={garden:3,platform:3,signal:3};return s;}
function approach(s,n){const path=M.pathTo(s,n.x,n.z,true);assert.ok(path,'reachable '+n.id);for(const [x,z]of path)assert.ok(M.move(s,x,z));}
function gather(s,id,count=1){const n=node(id);approach(s,n);for(let i=0;i<count;i++)assert.ok(M.interact(s,id).ok);}

test('continuous movement preserves fractions, slides around collisions, and cannot tunnel or leave the valley',()=>{
 const s=M.newGame();assert.ok(M.moveFree(s,.24,.13));assert.ok(Math.abs(s.player.x-.24)<1e-9&&Math.abs(s.player.z-3.13)<1e-9);
 const saved=M.deserialize(M.serialize(s));assert.deepEqual(saved.player,s.player);assert.ok(saved.discovered.every(k=>/^-?\d+,-?\d+$/.test(k)));
 const before={...s.player};assert.equal(M.moveFree(s,NaN,1),false);assert.equal(M.moveFree(s,0,100),false);assert.deepEqual(s.player,before);
 s.player={x:4,z:5};for(let i=0;i<20;i++)M.moveFree(s,0,.1);assert.ok(s.player.z<5.29,'solid pine blocks continuous movement');
 for(let i=0;i<15;i++)M.moveFree(s,.1,.1);assert.ok(s.player.x>5&&s.player.z>5.5,'diagonal slide gets around pine');
 s.player={x:19,z:18};for(let i=0;i<30;i++)M.moveFree(s,.1,.1);assert.ok(s.player.x<=20&&s.player.z<=19);
 s.player={x:2,z:-10};assert.equal(M.moveFree(s,0,-2),true);assert.ok(s.player.z>-10.3,'unrepaired river blocks crossing');
 s.flags.bridge=true;for(let i=0;i<30;i++)M.moveFree(s,0,-.1);assert.ok(s.player.z<-12,'bridge gives continuous access to same north bank');
 s.player={x:0,z:3};M.moveFree(s,.18,.12);const path=M.pathTo(s,2,5);assert.ok(path);for(const [x,z]of path)assert.ok(M.move(s,x,z));assert.deepEqual(s.player,{x:2,z:5});
});

test('repeat gathering safety requires a resource, stock, and reserve vitals',()=>{
 const s=M.newGame(),n=node('first-pine');assert.ok(M.canContinueGather(s,n));
 for(const [key,value]of [['energy',7.9],['warmth',14.9],['health',24.9]]){s[key]=value;assert.equal(M.canContinueGather(s,n),false);s[key]=100;}
 s.stock[n.id]=0;assert.equal(M.canContinueGather(s,n),false);assert.equal(M.canContinueGather(s,node('home')),false);
});

test('all three puzzles have free retries, require proximity, persist partial progress, and pay once',()=>{
 let s=ready();for(const [id,p]of Object.entries(M.PUZZLES)){
  s.player={x:0,z:3};assert.equal(M.solvePuzzle(s,id,0).ok,false);approach(s,node('puzzle-'+id));
  if(id==='signal'){s.projects.signal=2;assert.equal(M.solvePuzzle(s,id,0).ok,false);s.projects.signal=3;}
  const inv={...s.inventory};assert.equal(M.solvePuzzle(s,id,-1).ok,false);assert.deepEqual(s.inventory,inv);
  if(p.kind==='dials'){M.solvePuzzle(s,id,0);s=M.deserialize(M.serialize(s));assert.deepEqual(s.journey.puzzleSteps[id],[1,0,0]);for(const index of [0,0,1,1,1,2,2,2])assert.ok(M.solvePuzzle(s,id,index).ok);}
  else{M.solvePuzzle(s,id,(p.answer[0]+1)%3);assert.deepEqual(s.journey.puzzleSteps[id],[]);M.solvePuzzle(s,id,p.answer[0]);s=M.deserialize(M.serialize(s));for(const input of p.answer.slice(1))assert.ok(M.solvePuzzle(s,id,input).ok);}
  assert.ok(s.journey.solved.includes(id));for(const [k,v]of Object.entries(p.reward))assert.equal(s.inventory[k],inv[k]+v);
  const paid={...s.inventory};assert.equal(M.solvePuzzle(s,id,0).ok,false);assert.deepEqual(s.inventory,paid);
 }
});

test('decorations are earned, crafted once and freely reused only in designated nonblocking slots',()=>{
 const s=M.newGame();assert.equal(M.craftDecoration(s,'lantern').ok,false);s.buildings.engine=1;s.inventory.wood=3;s.inventory.coal=1;
 assert.ok(M.craftDecoration(s,'lantern').ok);assert.equal(s.inventory.wood,0);assert.equal(M.craftDecoration(s,'lantern').ok,false);
 const inv={...s.inventory};for(const slot of Object.keys(M.DECOR_SLOTS))assert.ok(M.placeDecoration(s,slot,'lantern').ok);
 assert.equal(M.placeDecoration(s,'outside','lantern').ok,false);assert.equal(M.placeDecoration(s,'hearth','feeder').ok,false);assert.ok(M.placeDecoration(s,'hearth','').ok);assert.deepEqual(s.inventory,inv);
 const save=M.deserialize(M.serialize(s));assert.deepEqual(save.journey,s.journey);
});

test('six friend requests require their restoration gates and grant permanent useful perks without repeat claims',()=>{
 const s=ready();for(const id of Object.keys(M.REQUESTS)){s.flags[id]=false;assert.equal(M.helpFriend(s,id).ok,false);s.flags[id]=true;assert.ok(M.helpFriend(s,id).ok);const project={mira:'garden',oren:'platform',ivo:'signal'}[id];s.projects[project]=2;assert.equal(M.helpFriend(s,id).ok,false);s.projects[project]=3;assert.ok(M.helpFriend(s,id).ok);const inv={...s.inventory};assert.equal(M.helpFriend(s,id).ok,false);assert.deepEqual(s.inventory,inv);}
 const count=s.inventory.planks;assert.ok(M.craft(s,'planks',5).ok);assert.equal(s.inventory.planks-count,(M.RECIPES.planks.yield+1)*5);
 const plain=ready();s.player=plain.player={x:14,z:14};s.warmth=plain.warmth=80;s.activeSeconds=plain.activeSeconds=250;M.tick(s,1);M.tick(plain,1);assert.ok(s.warmth>plain.warmth);assert.ok(M.travelSpeed(s)>M.travelSpeed(plain));
});

test('forecast, shelter, storm speed and uncovered bundles use only active time and one claim per natural storm',()=>{
 const s=ready();s.player={x:14,z:14};s.activeSeconds=210;assert.equal(M.weather(s).label,'Snow approaching');assert.equal(M.weather(s).next,30);s.activeSeconds=240;assert.ok(M.weather(s).storm);assert.ok(M.travelSpeed(s)<1);
 s.player={x:0,z:3};assert.ok(M.weather(s).sheltered);assert.equal(M.travelSpeed(s),1);
 const d=M.DRIFTS.west;s.player={x:d.x,z:d.z};assert.equal(M.searchDrift(s,'west').ok,false);s.activeSeconds=360;assert.equal(M.weather(s).storm,false);assert.ok(M.searchDrift(s,'west').ok);const inv={...s.inventory};assert.equal(M.searchDrift(s,'west').ok,false);assert.deepEqual(s.inventory,inv);
 const saved=M.deserialize(M.serialize(s));assert.equal(M.searchDrift(saved,'west').ok,false);saved.activeSeconds=720;assert.ok(M.searchDrift(saved,'west').ok);
 assert.ok(M.startChallenge(saved,'snowwalk').ok);assert.ok(M.weather(saved).personal);assert.ok(M.weather(saved).storm);M.finishChallenge(saved,false);assert.equal(M.weather(saved).storm,false);
});

test('named wildlife observations are local, repeat safely, and a crafted feeder attracts the bird',()=>{
 const s=ready();for(const [id,a]of Object.entries(M.ANIMALS)){s.player={x:20,z:19};assert.equal(M.observeAnimal(s,id).ok,false);s.player={x:a.x,z:a.z};assert.ok(M.observeAnimal(s,id).ok);const inv={...s.inventory};assert.ok(M.observeAnimal(s,id).ok);assert.deepEqual(s.inventory,inv);}
 assert.equal(s.journey.animals.length,3);s.journey.friendships.oren=2;assert.ok(M.craftDecoration(s,'feeder').ok);assert.ok(M.placeDecoration(s,'hearth','feeder').ok);assert.deepEqual(M.animalSpot(s,'bird'),M.DECOR_SLOTS.hearth);
});

test('packed paths accumulate across visits, survive saves, and imported extension data stays bounded',()=>{
 const s=M.newGame();for(let i=0;i<12;i++){M.move(s,1,3);M.move(s,0,3);}assert.equal(s.journey.trails['1,3'],8);assert.equal(M.surfaceAt(s),'step-packed');assert.deepEqual(M.deserialize(M.serialize(s)).journey.trails,s.journey.trails);
 const old=JSON.parse(M.serialize(s));delete old.journey;delete old.settings.haptics;assert.deepEqual(M.deserialize(JSON.stringify(old)).journey,M.newJourney());
 s.journey.trails={'1,3':999,'999,3':2,'1.2,3':3,bad:2};s.journey.decor={hearth:'not-made',bad:'bench'};s.journey.puzzleSteps={chimes:[],tracks:[2,1]};s.journey.solved=['tracks','tracks','bad'];s.journey.friendships.mira=99;s.settings.haptics='bad';const read=M.deserialize(M.serialize(s));assert.deepEqual(read.journey.trails,{'1,3':8});assert.deepEqual(read.journey.decor,{});assert.deepEqual(read.journey.puzzleSteps,{chimes:[0,0,0],tracks:[]});assert.deepEqual(read.journey.solved,['tracks']);assert.equal(read.journey.friendships.mira,2);assert.equal(read.settings.haptics,'off');
});

test('hand-tool and efficiency outings complete through real harvests, preserve upgrades, and can repeat',()=>{
 const s=M.newGame();s.gear.axe=3;s.gathered.wood=100;s.completed=M.QUESTS.map(q=>q.id);assert.ok(M.startChallenge(s,'handtools').ok);assert.equal(M.startChallenge(s,'careful').ok,false);assert.equal(M.challengeProgress(s).ready,false);
 gather(s,'first-pine',4);M.rest(s);gather(s,'first-pine');assert.equal(s.gathered.wood,130);assert.ok(M.challengeProgress(s).ready);const parts=s.inventory.parts;assert.ok(M.finishChallenge(s,true).ok);assert.equal(s.inventory.parts,parts+8);assert.equal(s.gear.axe,3);assert.equal(M.finishChallenge(s,true).ok,false);assert.ok(M.DECORATIONS.pennant.unlock(s));
 assert.ok(M.startChallenge(s,'careful').ok);gather(s,'first-pine');gather(s,'near-coal',2);gather(s,'near-food',2);assert.ok(M.challengeProgress(s).ready);assert.ok(M.finishChallenge(s,true).ok);assert.equal(s.journey.wins.careful,1);
 assert.ok(M.startChallenge(s,'careful').ok);for(let i=0;i<9;i++){M.rest(s);gather(s,'first-pine');}assert.equal(M.challengeProgress(s).ready,false);assert.ok(M.challengeProgress(s).failed);assert.equal(M.finishChallenge(s,true).ok,false);const home={...s.buildings},gear={...s.gear},inv={...s.inventory};assert.ok(M.finishChallenge(s,false).ok);assert.deepEqual(s.inventory,inv);assert.deepEqual(s.buildings,home);assert.deepEqual(s.gear,gear);assert.ok(M.startChallenge(s,'careful').ok);assert.equal(s.journey.challenge.harvests,0);
});

test('white walk records distinct snowy trail visits, resumes through saves, and can be left without a reset',()=>{
 let s=M.newGame();s.stock=Object.fromEntries(M.WORLD.filter(n=>n.stock).map(n=>[n.id,0]));s.player={x:12,z:12};assert.ok(M.startChallenge(s,'snowwalk').ok);for(const [x,z]of [[13,12],[12,12],[13,12]])assert.ok(M.move(s,x,z));assert.equal(s.journey.challenge.visits.length,2);s=M.deserialize(M.serialize(s));
 for(const [x,z]of [[14,12],[15,12],[16,12],[17,12]]){s.stock=Object.fromEntries(M.WORLD.filter(n=>n.stock).map(n=>[n.id,0]));assert.ok(M.move(s,x,z));}
 assert.ok(M.challengeProgress(s).ready);assert.ok(M.finishChallenge(s,true).ok);assert.equal(s.journey.wins.snowwalk,1);assert.equal(M.weather(s).personal,false);
});
