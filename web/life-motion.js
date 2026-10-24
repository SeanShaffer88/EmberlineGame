// Cosmetic motion only. Inputs are simulation/animation time, never wall time.
export const clamp01=n=>Math.max(0,Math.min(1,n));
export const seedNoise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
export function windAt(t,storm=0){return(.65+clamp01(storm)*1.1)*(.8+Math.sin(t*.63)*.14+Math.sin(t*1.7)*.06);}
export function turnToward(from,to,dt){const delta=Math.atan2(Math.sin(to-from),Math.cos(to-from));return from+delta*(1-Math.exp(-Math.max(0,dt)*12));}
export function goldenHour(night,storm,steady=false){return steady?0:Math.max(0,1-Math.abs(night-.5)/.26)*(1-clamp01(storm));}
export function snowSurface(x,z){return !(z>-4.5&&z<-2.5)&&!(z>-12.2&&z<-9.7)&&Math.abs(x)<=20&&z>=-20&&z<=19;}
// A continuous 24-second visit: approach, settle/peck, depart, circle back.
export function feederVisit(t){
 const phase=((t%24)+24)%24,smooth=u=>u*u*(3-2*u);
 if(phase<5){const u=smooth(phase/5);return{x:-2.5*(1-u),y:1.12+(1-u)*1.8+Math.sin(u*Math.PI)*.4,z:-1.5*(1-u),flight:1-u,peck:0};}
 if(phase<15)return{x:0,y:1.12,z:0,flight:0,peck:Math.max(0,Math.sin((phase-5)*3))*.4};
 if(phase<20){const u=smooth((phase-15)/5);return{x:2.5*u,y:1.12+u*1.8+Math.sin(u*Math.PI)*.4,z:-1.5*u,flight:u,peck:0};}
 const u=(phase-20)/4;return{x:2.5*Math.cos(u*Math.PI),y:2.92+Math.sin(u*Math.PI)*.3,z:-1.5-Math.sin(u*Math.PI),flight:1,peck:0};
}
