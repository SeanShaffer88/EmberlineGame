import {WORLD,seen,walkable,canContinueGather} from './model.js';

// Automatic work uses ordinary interact costs and stock. A small range margin
// holds a current target steady near the edge without extending interaction reach.
export const AUTO_REACH=1.55;
export function gatherWithinReach(s,n,range=AUTO_REACH){
 if(!n||!canContinueGather(s,n)||Math.hypot(s.player.x-n.x,s.player.z-n.z)>range||!seen(s,n))return false;
 // Do not swing through a train, building, unrepaired crossing or another node.
 // The resource's own occupied tile is the endpoint, not an obstruction.
 const steps=12;
 for(let i=1;i<steps;i++){const u=i/steps,x=Math.round(s.player.x+(n.x-s.player.x)*u),z=Math.round(s.player.z+(n.z-s.player.z)*u);if(x===n.x&&z===n.z)break;if(!walkable(s,x,z))return false;}
 return true;
}
export function autoGatherTarget(s,current=null){
 if(s.settings.autoGather===false)return null;
 const held=current&&WORLD.find(n=>n.id===current);if(held&&gatherWithinReach(s,held,1.65))return held;
 let closest=null,best=Infinity;for(const n of WORLD){if(!gatherWithinReach(s,n))continue;const d=Math.hypot(s.player.x-n.x,s.player.z-n.z);if(d<best){best=d;closest=n;}}
 return closest;
}
