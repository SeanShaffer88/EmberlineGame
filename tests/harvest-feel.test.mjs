import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../web/model.js';
import {Haul,nearbyResource,resourceHint,harvestDetail,strikeVoice,finishGesture,squirrelRoute,owlRoute} from '../web/harvest-feel.js';

test('yield previews use the actual economy across gear, crew, workshop and hand-tool challenge',()=>{
 for(const type of ['tree','coal','scrap','food'])for(const challenge of [null,{id:'handtools',harvests:0}])for(const level of [0,2]){
  const s=M.newGame(1),n=M.WORLD.find(n=>n.type===type);s.completed=M.QUESTS.map(q=>q.id);s.player={x:n.x,z:n.z+1};M.reveal(s);s.gear.axe=s.gear.prybar=level;s.buildings.workshop=level;s.companion='oren';s.journey.challenge=challenge;
  const before=M.serialize(s),predicted=M.gatherYield(s,n),detail=harvestDetail(s,n);assert.equal(M.serialize(s),before);const result=M.interact(s,n.id);assert.ok(result.ok);assert.deepEqual(predicted,result.loot);assert.ok(detail.includes('harvests left'));
 }
 assert.deepEqual(M.gatherYield(M.newGame(),{type:'wolf'}),{});
});
test('resource hints respect fog, distance, stock, automatic preference and each safety reserve',()=>{
 const s=M.newGame(),n=M.WORLD.find(n=>n.id==='first-pine');s.player={x:4,z:5};M.reveal(s);assert.equal(nearbyResource(s).id,n.id);
 s.discovered=[];assert.equal(nearbyResource(s),null);M.reveal(s);
 for(const [key,min,word]of [['energy',8,'energy'],['warmth',15,'warm'],['health',25,'health']]){s[key]=min-1;assert.ok(resourceHint(s,n).includes(word));s[key]=100;}
 s.stock[n.id]=0;s.regrowth[n.id]=180;s.activeSeconds=32;assert.ok(resourceHint(s,n).includes('148s'));s.stock[n.id]=4;s.settings.autoGather=false;assert.ok(resourceHint(s,n).includes('tap'));assert.equal(resourceHint(s,null),'');
});
test('haul receipts count earned material only, expire on active time, and do not cross save imports',()=>{
 const s=M.newGame(),h=new Haul(),before=M.serialize(s);h.add(s,{wood:6});h.add(s,{wood:6,coal:4});assert.ok(h.text(s).includes('+12 Timber'));assert.ok(h.text(s).includes('+4 Coal'));assert.equal(M.serialize(s),before);
 assert.equal(h.text(M.deserialize(before)),'');s.activeSeconds=21;assert.equal(h.text(s),'');h.add(s,{wood:6});assert.ok(h.text(s).includes('+6 Timber'));h.reset();assert.equal(h.text(s),'');
});
test('material audio variants are deterministic, bounded, and emphasize each third hit',()=>{
 for(const type of ['tree','coal','scrap','food']){const values=Array.from({length:12},(_,i)=>strikeVoice(type,i));assert.ok(new Set(values.map(v=>v.frequency)).size===6);assert.deepEqual(values.slice(0,6),values.slice(6));assert.ok(values.every(v=>v.frequency>0&&v.pitch>=.9&&v.pitch<1.13&&v.weight<1.1));assert.ok(values[2].weight>values[0].weight);}
});
test('finishing gestures return to neutral with no accumulating pose',()=>{
 assert.deepEqual(finishGesture(-1),{stow:0,nod:0});assert.deepEqual(finishGesture(.85),{stow:0,nod:0});for(let a=0;a<1;a+=.005){const p=finishGesture(a);assert.ok(p.stow>=0&&p.stow<=1&&p.nod>=0&&p.nod<=1);}assert.ok(finishGesture(.35).stow>.9);
});
test('new wildlife routes stay in one patch and cross loop boundaries continuously',()=>{
 for(const [fn,period]of [[t=>squirrelRoute(t),22],[t=>owlRoute(t,1),45]]){
  let prev=fn(0);for(let t=.01;t<period*3;t+=.01){const next=fn(t);assert.ok(Math.hypot(next.x-prev.x,next.z-prev.z)<.02);assert.ok(Math.abs(next.x)<7&&next.z>5&&next.z<8);prev=next;}
 }
 assert.equal(owlRoute(38,0).flight,0);assert.ok(owlRoute(38,1).flight>.9);assert.equal(squirrelRoute(7).forage,1);assert.ok(squirrelRoute(7,1).x<squirrelRoute(7).x);
});
