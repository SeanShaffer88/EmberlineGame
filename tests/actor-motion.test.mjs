import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceGait,stridePose,blinkAt,gatherPose,foxCycle,hareCycle,sipAt,brushAt} from '../web/actor-motion.js';

test('stride follows distance at different frame rates, settles at rest, rejects teleports and freezes with zero delta',()=>{
 const a={phase:0,weight:0},b={phase:0,weight:0};
 for(let i=0;i<30;i++)advanceGait(a,2/30,1/30);
 for(let i=0;i<120;i++)advanceGait(b,2/120,1/120);
 assert.ok(Math.abs(a.phase-b.phase)<1e-10);assert.ok(Math.abs(a.weight-b.weight)<1e-10);
 const p=a.phase;for(let i=0;i<60;i++)advanceGait(a,0,1/60);assert.equal(a.phase,p);assert.ok(a.weight<.0001);
 advanceGait(a,20,.05);assert.equal(a.phase,p);const frozen={...a};advanceGait(a,1,0);assert.deepEqual(a,frozen);
 advanceGait(b,.1,.05,true,true);assert.equal(b.weight,0);
 for(let p=0;p<7;p+=.03)for(const side of [-1,1]){const pose=stridePose(p,1,side);assert.ok(pose.knee>=0&&pose.knee<=.78);assert.ok(Math.abs(pose.hip)<=.48);}
});
test('tool body contact agrees with the three existing impact beats; forage and cancelled poses are distinct',()=>{
 for(const p of [.2,.5,.8]){const contact=gatherPose(p);assert.ok(Math.abs(contact.reach+.35)<1e-9);assert.ok(contact.torso>gatherPose(p+.1).torso);}
 assert.ok(gatherPose(.5,true).crouch>gatherPose(.5).crouch);assert.equal(gatherPose(0).crouch,0);assert.ok(Math.abs(gatherPose(1).reach)<1e-12);
});
test('fox and hare routes remain finite, continuous at every boundary and within their observation sites',()=>{
 for(const [cycle,period,bounds]of [[foxCycle,36,[0,6,11,13,17,24,36]],[hareCycle,18,[0,1.6,3.2,4.8,9,10.6,12.2,13.8,18]]]){
  for(const t of bounds){const a=cycle(t-1e-6),b=cycle(t+1e-6);assert.ok(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<.00001,`position continuity ${t}`);}
  for(let t=-period;t<=period*2;t+=.025){const p=cycle(t);assert.ok(Object.entries(p).filter(([k])=>k!=='mode').every(([,v])=>Number.isFinite(v)));assert.ok(Math.hypot(p.x,p.z)<1.1&&p.y>=-1e-9&&p.y<=.33);}
  assert.deepEqual(cycle(2),cycle(2+period));
 }
});
test('blinks, sips and brush gestures have bounded poses, independent phases and no early idle brush',()=>{
 for(let t=0;t<80;t+=.013){assert.ok(blinkAt(t,2)>=.08&&blinkAt(t,2)<=1);assert.ok(sipAt(t,1)>=0&&sipAt(t,1)<=1);assert.ok(brushAt(t)>=0&&brushAt(t)<=1);}
 assert.notEqual(blinkAt(.08,0),blinkAt(.08,1));assert.equal(brushAt(6),0);assert.ok(brushAt(11)>.8);assert.equal(brushAt(14),0);
});
