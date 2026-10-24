import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../web/model.js';
import {autoGatherTarget,gatherWithinReach} from '../web/auto-gather.js';
test('automatic gathering defaults on for new and old saves, and preserves an explicit manual preference',()=>{
 const s=M.newGame();assert.equal(s.settings.autoGather,true);delete s.settings.autoGather;assert.equal(M.deserialize(JSON.stringify(s)).settings.autoGather,true);
 s.settings.autoGather=false;assert.equal(M.deserialize(M.serialize(s)).settings.autoGather,false);
 s.player={x:4,z:5};M.reveal(s);assert.equal(autoGatherTarget(s),null);
});
test('proximity work holds one in-range resource, rejects depletion, fog, low vitals and distant targets without modifying state',()=>{
 const s=M.newGame();s.player={x:4,z:5};M.reveal(s);const before=M.serialize(s),n=M.WORLD.find(n=>n.id==='first-pine');
 assert.equal(autoGatherTarget(s).id,n.id);assert.equal(M.serialize(s),before);
 s.player.z=4.4;assert.equal(autoGatherTarget(s),null);assert.equal(autoGatherTarget(s,n.id).id,n.id);
 s.player.z=4.3;assert.equal(autoGatherTarget(s,n.id),null);s.player.z=5;
 for(const [key,value]of [['energy',7.9],['warmth',14.9],['health',24.9]]){s[key]=value;assert.equal(autoGatherTarget(s,n.id),null);s[key]=100;}
 s.stock[n.id]=0;assert.equal(autoGatherTarget(s,n.id),null);delete s.stock[n.id];s.discovered=[];assert.equal(autoGatherTarget(s,n.id),null);
});
test('only four resource types auto harvest, with ordinary economy and no automatic fights, purchases or restoration',()=>{
 const s=M.newGame();s.completed=M.QUESTS.map(q=>q.id);
 for(const [id,item,yieldCount]of [['first-pine','wood',6],['near-coal','coal',4],['near-scrap','scrap',5],['near-food','food',4]]){
  const n=M.WORLD.find(n=>n.id===id);s.player={x:n.x,z:n.z+1};M.reveal(s);const target=autoGatherTarget(s,id);assert.equal(target.id,id);const before=s.inventory[item];assert.ok(M.interact(s,target.id).ok);assert.equal(s.inventory[item]-before,yieldCount);assert.equal(M.stock(s,n),n.stock-1);
 }
 for(const n of M.WORLD.filter(n=>!['tree','coal','scrap','food'].includes(n.type))){s.player={x:n.x,z:n.z+1};M.reveal(s);assert.equal(gatherWithinReach(s,n),false,n.id);}
});
