import {WORLD,stock,seen,gatherYield,ITEMS} from './model.js';
import {isGathering} from './feel.js';

export function nearbyResource(s,range=2.6){
 let best=null,distance=range;
 for(const n of WORLD){if(!isGathering(n.type))continue;const d=Math.hypot(n.x-s.player.x,n.z-s.player.z);if(d<distance&&seen(s,n)){best=n;distance=d;}}
 return best;
}
export function resourceHint(s,n){
 if(!n)return '';
 if(stock(s,n)<=0){const seconds=Math.max(0,Math.ceil((s.regrowth[n.id]||s.activeSeconds)-s.activeSeconds));return seconds?`${n.name} · returns in ${seconds}s of play, or rest`:`${n.name} · rest to replenish`;}
 if(s.settings.autoGather===false)return `${n.name} · tap to gather`;
 if(s.energy<8)return 'Gathering paused · rest to restore energy';
 if(s.warmth<15)return 'Gathering paused · warm up by the train';
 if(s.health<25)return 'Gathering paused · rest to recover health';
 return `${n.name} · move close to gather`;
}
export function harvestDetail(s,n){
 const loot=gatherYield(s,n),[item,count]=Object.entries(loot)[0]||[];
 return item?`+${count} ${ITEMS[item]} · ${stock(s,n)} harvests left`:'';
}
// A presentation-only outing receipt. Idle expiry uses active play time, so
// opening a menu cannot erase it and imported saves cannot inherit old totals.
export class Haul{
 constructor(){this.reset();}
 reset(){this.items={};this.last=-Infinity;this.owner=null;}
 add(s,loot){if(this.owner!==s||s.activeSeconds-this.last>20)this.items={};this.owner=s;this.last=s.activeSeconds;for(const [k,n]of Object.entries(loot))this.items[k]=(this.items[k]||0)+n;}
 text(s){return this.owner===s&&s.activeSeconds-this.last<=20?`This haul · ${Object.entries(this.items).map(([k,n])=>`+${n} ${ITEMS[k]}`).join(' · ')}`:'';}
}
export function strikeVoice(type,index){
 const pitch=[.94,1.04,1.12,.98,1.07,.91][index%6];
 return {pitch,weight:[.82,.94,1.08][index%3],frequency:({tree:170,coal:580,scrap:940,food:660}[type]||440)*pitch};
}
export function finishGesture(age){
 if(age<0||age>=.85)return {stow:0,nod:0};
 return {stow:Math.sin(Math.PI*Math.min(1,age/.65)),nod:age>.25?Math.sin((age-.25)/.6*Math.PI):0};
}
export function squirrelRoute(t,alert=0){
 const p=((t%22)+22)%22,u=p<5?p/5:p<13?1:p<18?1-(p-13)/5:0;
 const walking=p<5||(p>=13&&p<18),x=-3.2+u*1.35,z=6.5+Math.sin(u*Math.PI)*.4;
 return {x:x-alert*.8,z:z-alert*.3,walk:walking?1:0,forage:p>=5&&p<13?1:0,angle:p<13?Math.PI/2:-Math.PI/2};
}
export function owlRoute(t,night){
 const p=((t%45)+45)%45,flight=night>.35&&p>30?Math.sin((p-30)/15*Math.PI):0;
 return {x:-5.1+flight*2.2,y:2.35+flight*1.2,z:6.1+flight*.7,flight};
}
