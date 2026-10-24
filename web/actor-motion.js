// Original cosmetic choreography. Seconds come from the paused game renderer;
// no wall time, random rewards, pathfinding, saved state or network access.
import {clamp01} from './life-motion.js';
export const ease=n=>{n=clamp01(n);return n*n*(3-2*n);};
export const blend=(a,b,dt,rate=9)=>a+(b-a)*(1-Math.exp(-Math.max(0,dt)*rate));
const mod=(n,d)=>((n%d)+d)%d;
export function blinkAt(t,seed=0){
 const p=mod(t+seed*1.73,4.7+seed*.27);
 return p<.16?Math.max(.08,Math.abs(p-.08)/.08):1;
}
export function advanceGait(g,distance,dt,allowed=true,reduced=false){
 if(dt<=0)return g;
 const valid=allowed&&distance>1e-5&&distance<1.5;
 g.weight=reduced?0:blend(g.weight,valid?1:0,dt,valid?14:10);
 if(!valid&&g.weight<.001)g.weight=0;
 if(valid&&!reduced)g.phase=mod(g.phase+distance/.88*Math.PI*2,Math.PI*2);
 return g;
}
export function stridePose(phase,weight,side){
 const p=phase+(side===1?Math.PI:0),s=Math.sin(p);
 return {hip:s*.48*weight,knee:Math.max(0,-s)*.78*weight,ankle:-Math.max(0,-s)*.28*weight};
}
// Each stroke reaches its contact pose exactly at the existing impact beats.
// Between contacts it recovers and anticipates the next; costs/timing stay in main.
export function gatherPose(progress,food=false){
 const p=clamp01(progress),envelope=ease(p/.1)*ease((1-p)/.1);
 const stroke=(1+Math.cos((p-.2)/.3*Math.PI*2))/2;
 return food?{crouch:.18*envelope,torso:.32*envelope,twist:0,reach:(-.95-stroke*.35)*envelope,brace:.65*envelope}
  :{crouch:.035*envelope,torso:(.02+stroke*.16)*envelope,twist:(stroke-.5)*.3*envelope,reach:(-1.9+stroke*1.55)*envelope,brace:.18*envelope};
}
export function foxCycle(t){
 const p=mod(t,36),a={x:-.65,z:-.2},b={x:.5,z:.1},c={x:.75,z:.65};
 const travel=(from,to,u)=>{u=ease(u);return{x:from.x+(to.x-from.x)*u,z:from.z+(to.z-from.z)*u,angle:Math.atan2(to.x-from.x,to.z-from.z)};};
 if(p<6)return {...travel(a,b,p/6),y:0,walk:Math.sin(p/6*Math.PI),sniff:0,curl:0,pounce:0,mode:'trot'};
 if(p<11)return {...b,angle:.6,y:0,walk:0,sniff:Math.sin((p-6)/5*Math.PI),curl:0,pounce:0,mode:'sniff'};
 if(p<13){const u=(p-11)/2;return {...travel(b,c,u),y:Math.sin(u*Math.PI)*.32,walk:0,sniff:0,curl:0,pounce:Math.sin(u*Math.PI),mode:'pounce'};}
 if(p<17)return {...c,angle:.6,y:0,walk:0,sniff:Math.sin((p-13)/4*Math.PI),curl:0,pounce:0,mode:'sniff'};
 if(p<24)return {...travel(c,a,(p-17)/7),y:0,walk:Math.sin((p-17)/7*Math.PI),sniff:0,curl:0,pounce:0,mode:'trot'};
 const curl=ease((p-24)/2)*ease((36-p)/2);return {...a,angle:-1,y:0,walk:0,sniff:0,curl,pounce:0,mode:'rest'};
}
export function hareCycle(t){
 const p=mod(t,18),out=p<4.8,back=p>=9&&p<13.8;
 if(out||back){const u=(out?p:p-9)/4.8,n=Math.min(2,Math.floor(u*3)),f=u*3-n,along=(n+ease(f))/3,k=out?along:1-along;
  return{x:-.4+k*.9,z:-.3+k*.55,y:Math.sin(f*Math.PI)*.26,hop:Math.sin(f*Math.PI),groom:0,watch:0,angle:out?1.02:1.02+Math.PI,mode:'hop'};
 }
 const groom=p<9?Math.sin((p-4.8)/4.2*Math.PI):0,watch=p>=13.8?Math.sin((p-13.8)/4.2*Math.PI):0;
 return{x:p<9?.5:-.4,z:p<9?.25:-.3,y:0,hop:0,groom,watch,angle:p<9?1.02:4.16,mode:p<9?'groom':'watch'};
}
// Raising a mug and opening a map have eased ends rather than on/off snaps.
export function sipAt(t,seed=0){const p=mod(t+seed,9);return ease((p-2)/1.1)*(1-ease((p-5)/1.2));}
export function brushAt(idle){const p=mod(idle,22);return idle>8&&p>=10&&p<13?Math.sin((p-10)/3*Math.PI):0;}
