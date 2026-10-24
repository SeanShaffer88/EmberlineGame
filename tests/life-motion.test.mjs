import test from 'node:test';
import assert from 'node:assert/strict';
import {windAt,turnToward,goldenHour,snowSurface,feederVisit} from '../web/life-motion.js';

test('cosmetic turning takes the short arc across north without overshooting at frame-rate changes',()=>{
 const from=Math.PI-.05,to=-Math.PI+.05;
 const once=turnToward(from,to,.5);let split=from;for(let i=0;i<30;i++)split=turnToward(split,to,1/60);
 assert.ok(once>from&&once<Math.PI+.05);assert.ok(Math.abs(once-split)<1e-10);assert.equal(turnToward(from,to,0),from);
});
test('feeder approach, landing, departure and loop remain continuous with bounded motion',()=>{
 for(const boundary of [0,5,15,20,24]){const a=feederVisit(boundary-1e-6),b=feederVisit(boundary+1e-6);assert.ok(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<.00001,`continuous at ${boundary}`);}
 for(let t=-24;t<=72;t+=.025){const p=feederVisit(t);assert.ok(Object.values(p).every(Number.isFinite));assert.ok(Math.abs(p.x)<=2.5&&p.y>=1.12&&p.y<=3.3);assert.ok(p.flight>=0&&p.flight<=1);}
 assert.deepEqual(feederVisit(8),feederVisit(32));assert.equal(feederVisit(10).flight,0);
});
test('weather and sun treatments are bounded, steady daylight disables golden transitions, and timber/ice reject powder',()=>{
 for(let t=0;t<720;t+=.25){assert.ok(windAt(t,1)>=windAt(t,0));assert.ok(windAt(t,1)<2);}
 assert.equal(goldenHour(.5,0),1);assert.equal(goldenHour(.5,1),0);assert.equal(goldenHour(.5,0,true),0);assert.equal(goldenHour(1,0),0);
 assert.equal(snowSurface(0,3),true);assert.equal(snowSurface(0,-3),false);assert.equal(snowSurface(2,-11),false);assert.equal(snowSurface(21,0),false);
});
