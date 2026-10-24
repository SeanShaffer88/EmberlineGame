// All benefits and lighting use active play time, never the device clock.
export const MEALS={
 stew:{name:'Trail stew',cost:{food:3,coal:1},hint:'Restore the hearth',unlock:s=>s.buildings.furnace>=1,description:'Gathering costs 2 energy instead of 3 for three minutes of play.',energy:20,warmth:20},
 tea:{name:'Pine-tip tea',cost:{food:1,coal:1},hint:'Restore the hearth and start the winter garden',unlock:s=>s.buildings.furnace>=1&&s.projects.garden>=1,description:'Cold exposure falls by 35% for three minutes of play.',energy:0,warmth:30},
 oatcakes:{name:'Pocket oatcakes',cost:{food:3,wood:1},hint:'Restore the hearth and build the greenhouse',unlock:s=>s.buildings.furnace>=1&&s.buildings.greenhouse>=1,description:'Walk 12% faster for three minutes of play.',energy:30,warmth:0}
};
export function newCamp(){return{waypoint:null,pin:null,meal:null,cooked:{stew:0,tea:0,oatcakes:0}};}
export function readCamp(value,s,catalog){
 const c=newCamp();if(!value||typeof value!=='object')return c;
 const w=value.waypoint;if(w&&validPoint(s,w.x,w.z))c.waypoint={x:w.x,z:w.z};
 const m=value.meal;if(m&&Object.hasOwn(MEALS,m.id)&&Number.isFinite(m.ends)&&m.ends>s.activeSeconds&&m.ends<=s.activeSeconds+180)c.meal={id:m.id,ends:m.ends};
 for(const id of Object.keys(c.cooked)){const n=value.cooked?.[id];if(Number.isInteger(n)&&n>=0)c.cooked[id]=Math.min(n,1000000);}
 const p=value.pin;if(p&&Object.hasOwn(catalog,p.kind)&&Object.hasOwn(catalog[p.kind],p.id)){
  if(p.kind==='recipe'){if(Number.isInteger(p.target)&&p.target>0&&p.target<=1000000&&Number.isInteger(p.baseline)&&p.baseline>=0&&p.baseline< p.target&&p.target-p.baseline<=150&&p.baseline<=(s.crafted[p.id]||0))c.pin={kind:p.kind,id:p.id,target:p.target,baseline:p.baseline};}
  else if(Number.isInteger(p.target)&&p.target>=1&&p.target<=3&&p.target<=({building:s.buildings,project:s.projects,gear:s.gear}[p.kind][p.id]+1))c.pin={kind:p.kind,id:p.id,target:p.target};
 }return c;
}
export function validPoint(s,x,z){return Number.isInteger(x)&&Number.isInteger(z)&&Math.abs(x)<=20&&z>=-20&&z<=19&&(s.discovered.includes(`${x},${z}`)||(x===0&&z===-3));}
export function setWaypoint(s,x,z){if(!validPoint(s,x,z))return{ok:false,message:'Explore this part of the valley before marking it.'};s.camp.waypoint={x,z};return{ok:true,message:'Waypoint marked. Follow its distance from the valley view.'};}
export function waypointInfo(s){const p=s.camp.waypoint;if(!p)return null;const dx=p.x-s.player.x,dz=p.z-s.player.z;return{...p,distance:Math.hypot(dx,dz),direction:Math.hypot(dx,dz)<1?'Here':['N','NE','E','SE','S','SW','W','NW'][(Math.round(Math.atan2(dx,-dz)/(Math.PI/4))+8)%8]};}
export function activeMeal(s){const m=s.camp?.meal;return m&&m.ends>s.activeSeconds?{...MEALS[m.id],id:m.id,seconds:Math.ceil(m.ends-s.activeSeconds)}:null;}
export function nearKitchen(s){return Math.hypot(s.player.x+3,s.player.z-1)<=4;}
export function cookMeal(s,id){
 const m=Object.hasOwn(MEALS,id)?MEALS[id]:null;if(!m)return{ok:false,message:'Choose a known recipe.'};
 if(!nearKitchen(s))return{ok:false,message:'Return to the hearth to cook.'};if(!m.unlock(s))return{ok:false,message:m.hint+'.'};
 if(!Object.entries(m.cost).every(([k,n])=>s.inventory[k]>=n))return{ok:false,message:'Gather the listed ingredients first.'};
 for(const [k,n]of Object.entries(m.cost))s.inventory[k]-=n;
 s.energy=Math.min(100,s.energy+m.energy);s.warmth=Math.min(100,s.warmth+m.warmth);s.camp.meal={id,ends:s.activeSeconds+180};s.camp.cooked[id]=Math.min(1000000,s.camp.cooked[id]+1);
 return{ok:true,message:m.name+' shared. Its benefit lasts for three minutes of play.',sound:'reward'};
}
export function daylight(s){const phase=(s.activeSeconds%720)/720,night=s.settings.steadyDaylight?0:(1-Math.cos(phase*Math.PI*2))/2;return{night,label:s.settings.steadyDaylight?'Steady daylight':phase<.18||phase>=.82?'Daylight':phase<.36?'Evening':phase<.64?'Moonlight':'Dawn'};}
export const mealSpeed=s=>activeMeal(s)?.id==='oatcakes'?1.12:1;
export const mealCold=s=>activeMeal(s)?.id==='tea'?.65:1;
export const gatherEnergy=s=>activeMeal(s)?.id==='stew'?2:3;
