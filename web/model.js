import * as Field from './field.js';
export * from './field.js';
import * as Camp from './camp.js';
export * from './camp.js';
import * as J from './journey.js';
export * from './journey.js';
import {RELICS, SECRET_SPOTS, GEAR, DIFFICULTIES, ACHIEVEMENTS, LIVERIES} from './content.js';
import {PROJECTS, DISCOVERIES, CONVERSATIONS, conversationAvailable, crewRoutine} from './valley.js';
export {RELICS, GEAR, DIFFICULTIES, ACHIEVEMENTS, LIVERIES, PROJECTS, DISCOVERIES, CONVERSATIONS, conversationAvailable, crewRoutine};
// Pure, deterministic game rules. No renderer, clock, network or Android dependencies.
export const VERSION=1;
export const ITEMS={wood:'Timber',scrap:'Salvage',coal:'Coal',food:'Food',planks:'Planks',parts:'Parts',medkit:'Medkits'};
export const RECIPES={planks:{name:'Saw planks',cost:{wood:3},yield:2},parts:{name:'Machine parts',cost:{scrap:3},yield:2},medkit:{name:'Pack a medkit',cost:{food:2,scrap:2},yield:1}};
export const BUILDINGS={
 furnace:{name:'Hearth',description:'A warmer home. Each level slows cold exposure.',costs:[{planks:6,scrap:4},{planks:10,parts:8},{planks:18,parts:14}]},
 workshop:{name:'Workshop',description:'Better tools. Each level adds one resource per harvest.',costs:[{planks:6,parts:4},{planks:12,parts:8},{planks:18,parts:14}]},
 greenhouse:{name:'Greenhouse',description:'Grow food while you play. Harvest from the Crew panel.',costs:[{planks:8,parts:6},{planks:12,parts:10},{planks:18,parts:16}]},
 infirmary:{name:'Infirmary',description:'Rest heals the crew. Each level adds 15 maximum health.',costs:[{parts:8,planks:6},{parts:12,planks:12},{parts:18,planks:18}]},
 engine:{name:'Locomotive',description:'Restore the stationary engine to power the settlement.',costs:[{parts:12,coal:8},{parts:16,coal:12},{parts:24,coal:18}]}
};
export const CREW={mira:{name:'Mira',role:'Medic',description:'Cold and wildlife deal 30% less damage.'},oren:{name:'Oren',role:'Carpenter',description:'Gather one extra timber from every tree.'},ivo:{name:'Ivo',role:'Scout',description:'Reveal more of the valley with every step.'}};
export const QUESTS=[
 {id:'timber',title:'A spark in the snow',text:'Gather 12 timber from the snowy pines near the train.',kind:'gather',key:'wood',amount:12,reward:{food:3},dialog:'The rails end here. Our story does not. This old train can become a home.',speaker:'Ash · Engineer'},
 {id:'planks',title:'Something to build on',text:'Craft 4 planks at the workshop. Open Craft below.',kind:'crafted',key:'planks',amount:4,reward:{scrap:4}},
 {id:'hearth',title:'Keep the fire alive',text:'Restore the Hearth from the Build menu.',kind:'building',key:'furnace',amount:1,reward:{coal:5},dialog:'Warmth is the first promise we make to anyone who finds us.',speaker:'Ash · Engineer'},
 {id:'mira',title:'A voice through the trees',text:'Find Mira at the old cabin northeast of the train. Bring 5 food.',kind:'flag',key:'mira',target:'mira',reward:{medkit:2}},
 {id:'workshop',title:'Tools for tomorrow',text:'Build the Workshop to improve every harvest.',kind:'building',key:'workshop',amount:1,reward:{wood:8}},
 {id:'pump',title:'Water beneath the ice',text:'Repair the frozen pump southwest of home.',kind:'flag',key:'pump',target:'pump',reward:{food:6},dialog:'Clean water. A hot stove. We are building more than a place to hide.',speaker:'Mira · Medic'},
 {id:'greenhouse',title:'Green in a white world',text:'Build a Greenhouse. It produces food while you play.',kind:'building',key:'greenhouse',amount:1,reward:{parts:4}},
 {id:'oren',title:'The last carpenter',text:'Find Oren west of the old logging trail. Bring 2 medkits.',kind:'flag',key:'oren',target:'oren',reward:{planks:6}},
 {id:'bridge',title:'Across the frozen creek',text:'Repair the footbridge north of camp to explore the far bank.',kind:'flag',key:'bridge',target:'bridge',reward:{coal:8},dialog:'One valley. One home. There is enough here to start again.',speaker:'Oren · Carpenter'},
 {id:'engine',title:'The heart of the settlement',text:'Restore the Locomotive to level 1. It stays here to power our home.',kind:'building',key:'engine',amount:1,reward:{food:8}},
 {id:'ivo',title:'A light on the ridge',text:'Rescue Ivo at the northeastern lookout. Bring 3 medkits.',kind:'flag',key:'ivo',target:'ivo',reward:{parts:6}},
 {id:'infirmary',title:'A place to heal',text:'Build the Infirmary for your growing crew.',kind:'building',key:'infirmary',amount:1,reward:{medkit:3}},
 {id:'relay',title:'Break the silence',text:'Repair the radio relay on the northwest ridge.',kind:'flag',key:'relay',target:'relay',reward:{scrap:12},dialog:'A faint reply beneath the static. Someone else is still out there.',speaker:'Ivo · Scout'},
 {id:'warmth',title:'A home through any storm',text:'Upgrade the Hearth to level 2.',kind:'building',key:'furnace',amount:2,reward:{planks:8}},
 {id:'power',title:'Light the valley',text:'Upgrade the stationary Locomotive to level 2.',kind:'building',key:'engine',amount:2,reward:{coal:10}},
 {id:'beacon',title:'We are still here',text:'Restore the northern beacon and send a signal of hope.',kind:'flag',key:'beacon',target:'beacon',reward:{food:20,wood:20,scrap:20},dialog:'The beacon rises over Frosthollow. The train never left, and neither did we. This is home now.',speaker:'The crew of Frosthollow'}
];
const COSTS={mira:{food:5},oren:{medkit:2},ivo:{medkit:3},pump:{parts:6,planks:4},bridge:{planks:10,parts:6},relay:{parts:12,coal:6},beacon:{parts:20,planks:16,coal:12}};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const key=(x,z)=>`${x},${z}`;
export const costText=c=>Object.entries(c).map(([k,v])=>`${v} ${ITEMS[k]}`).join(' · ');
function random(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
export function makeWorld(){
 const nodes=[
  {id:'home',type:'home',name:'The last train',x:0,z:-3},
  {id:'furnace',type:'building',name:'Hearth',x:-3,z:1},
  {id:'workshop',type:'building',name:'Workshop',x:3,z:1},
  {id:'greenhouse',type:'building',name:'Greenhouse',x:5,z:4},
  {id:'infirmary',type:'building',name:'Infirmary',x:-5,z:4},
  {id:'mira',type:'survivor',name:'Mira’s cabin',x:7,z:-6},
  {id:'oren',type:'survivor',name:'Oren’s refuge',x:-12,z:-5},
  {id:'ivo',type:'survivor',name:'Ivo’s lookout',x:12,z:-15},
  {id:'pump',type:'landmark',name:'Frozen water pump',x:-9,z:7},
  {id:'bridge',type:'landmark',name:'Broken footbridge',x:2,z:-10},
  {id:'relay',type:'landmark',name:'Silent radio relay',x:-12,z:-16},
  {id:'beacon',type:'landmark',name:'Northern beacon',x:0,z:-19},
  ...SECRET_SPOTS.map(([x,z],i)=>({id:'secret'+i,type:'secret',name:'Snowbound cairn',x,z,relic:i})),
  {id:'vault',type:'secret',name:'The keeper’s stone vault',x:-18,z:15}
 ];
 const rng=random(78219);
 const taken=new Set(nodes.map(n=>key(n.x,n.z)));
 for(let z=-19;z<=17;z+=2)for(let x=-18;x<=18;x+=2){
  const px=x+Math.floor(rng()*2),pz=z+Math.floor(rng()*2);
  if((Math.abs(px)<7&&pz>=-5&&pz<=5)||Math.abs(pz+11)<2||nodes.some(n=>Math.hypot(n.x-px,n.z-pz)<2.1)||taken.has(key(px,pz)))continue;
  const v=rng();if(v>.72)continue;
  const type=v<.30?'tree':v<.46?'scrap':v<.58?'coal':v<.68?'food':'wolf';
  nodes.push({id:`n${nodes.length}`,type,name:{tree:'Snow pine',scrap:'Abandoned supplies',coal:'Coal outcrop',food:'Winter berries',wolf:'Frost wolf'}[type],x:px,z:pz,stock:type==='wolf'?1:3,seed:rng()});taken.add(key(px,pz));
 }
 for(const [id,type,x,z] of [['first-pine','tree',4,6],['near-pine','tree',-4,7],['near-scrap','scrap',7,2],['near-coal','coal',-7,2],['near-food','food',1,7]])nodes.push({id,type,name:{tree:'Snow pine',scrap:'Abandoned supplies',coal:'Coal outcrop',food:'Winter berries'}[type],x,z,stock:4,seed:.5});
 // Append content so every original resource ID, seed and position stays stable.
 nodes.push(...Object.entries(PROJECTS).map(([id,p])=>({id:'project-'+id,type:'project',project:id,name:p.name,x:p.x,z:p.z})),...Object.entries(DISCOVERIES).map(([id,d])=>({id:'discovery-'+id,type:'discovery',discovery:id,name:'Something beneath the snow',x:d.x,z:d.z})));
 nodes.push(...Object.entries(J.PUZZLES).map(([id,p])=>({id:'puzzle-'+id,type:'puzzle',puzzle:id,name:p.name,x:p.x,z:p.z})),...Object.entries(J.DRIFTS).map(([id,p])=>({id:'drift-'+id,type:'drift',drift:id,name:p.name,x:p.x,z:p.z})));
 nodes.push(...Field.fieldNodes());
 return nodes;
}
export const WORLD=makeWorld();
export function newGame(seed=78219){const s={version:VERSION,field:Field.newField(),camp:Camp.newCamp(),journey:J.newJourney(),seed:seed>>>0,gear:{axe:0,prybar:0,coat:0,boots:0,lantern:0},projects:{garden:0,platform:0,signal:0},discoveries:[],discoverySeen:[],conversations:{},relics:[],secretSeen:[],vault:false,achievements:[],contractSerial:0,contract:null,contractsCompleted:0,difficulty:'standard',livery:'classic',inventory:{wood:6,scrap:6,coal:3,food:5,planks:0,parts:0,medkit:0},buildings:{furnace:0,workshop:0,greenhouse:0,infirmary:0,engine:0},flags:{},stock:{},regrowth:{},completed:[],gathered:{},crafted:{},discovered:[],player:{x:0,z:3},energy:100,health:100,warmth:100,activeSeconds:0,restCount:0,harvest:0,companion:null,settings:{sound:true,music:true,quality:'balanced',zoom:24,haptics:'off',autoGather:true,dragSensitivity:1,reducedMotion:false,steadyDaylight:false,musicVolume:0.7,ambienceVolume:0.7,effectsVolume:0.8},started:false};reveal(s);return s;}
export const maxHealth=s=>100+s.buildings.infirmary*15;
export const currentQuest=s=>QUESTS.find(q=>!s.completed.includes(q.id));
export function progress(s,q){if(!q)return 1;if(q.kind==='gather')return s.gathered[q.key]||0;if(q.kind==='crafted')return s.crafted[q.key]||0;if(q.kind==='building')return s.buildings[q.key]||0;return s.flags[q.key]?1:0;}
export const canPay=(s,c)=>Object.entries(c).every(([k,v])=>(s.inventory[k]||0)>=v);
export function pinGoal(s,kind,id,batches=1){
 const catalog={recipe:RECIPES,building:BUILDINGS,project:PROJECTS,gear:GEAR};if(!Object.hasOwn(catalog,kind)||!Object.hasOwn(catalog[kind],id))return{ok:false,message:'Choose a known project.'};
 if(kind==='recipe'){if(![1,5].includes(batches))return{ok:false,message:'Choose one or five batches.'};const baseline=s.crafted[id]||0,amount=(RECIPES[id].yield+(id==='planks'&&s.journey.friendships.oren===2?1:0))*batches;s.camp.pin={kind,id,baseline,target:baseline+amount};}
 else{const levels={building:s.buildings,project:s.projects,gear:s.gear},level=levels[kind][id];if(level>=3)return{ok:false,message:'This improvement is complete.'};s.camp.pin={kind,id,target:level+1};}
 return{ok:true,message:'Supplies pinned above the valley. Tap the list to review it.'};
}
export function goalInfo(s){
 const p=s.camp.pin;if(!p)return null;let title,cost,done,reason='',panel;
 if(p.kind==='recipe'){const r=RECIPES[p.id],remaining=Math.max(0,p.target-(s.crafted[p.id]||0)),yieldEach=r.yield+(p.id==='planks'&&s.journey.friendships.oren===2?1:0);done=!remaining;cost=Object.fromEntries(Object.entries(r.cost).map(([k,n])=>[k,n*Math.ceil(remaining/yieldEach)]));title=`Make ${p.target-p.baseline} ${ITEMS[p.id]}`;panel='craft';}
 if(p.kind==='building'){done=s.buildings[p.id]>=p.target;cost=BUILDINGS[p.id].costs[p.target-1];title=BUILDINGS[p.id].name+' · level '+p.target;panel='build';if(p.id==='greenhouse'&&!s.flags.pump)reason='Repair the water pump first.';}
 if(p.kind==='project'){done=s.projects[p.id]>=p.target;const info=projectInfo(s,p.id);cost=info.cost;reason=info.reason||'';title=PROJECTS[p.id].name+' · stage '+p.target;panel='build';}
 if(p.kind==='gear'){done=s.gear[p.id]>=p.target;cost=GEAR[p.id].costs[p.target-1];reason=gearLock(s,p.id);title=GEAR[p.id].name+' · level '+p.target;panel='craft';}
 if(done)cost={};return{title,cost,done,reason:done?'':reason,ready:!done&&!reason&&canPay(s,cost),panel};
}
export function mapNodes(s){return WORLD.filter(n=>{
 if(n.type==='home'||n.type==='building')return true;if(!seen(s,n))return false;
 if(n.type==='secret')return s.secretSeen.includes(n.id);
 if(n.type==='discovery')return s.discoverySeen.includes(n.discovery);
 if(n.type==='survivor'&&s.flags[n.id])return false;
 return true;
});}
function pay(s,c){for(const [k,v]of Object.entries(c))s.inventory[k]-=v;}
function add(s,items){for(const [k,v]of Object.entries(items))s.inventory[k]=(s.inventory[k]||0)+v;}
export function settleQuests(s){const done=[];for(const q of QUESTS){if(s.completed.includes(q.id))continue;if(progress(s,q)<(q.amount||1))break;s.completed.push(q.id);add(s,q.reward);done.push(q);}return done;}
export const stock=(s,n)=>s.stock[n.id]??n.stock??1;
export function reveal(s){const seen=new Set(s.discovered);const px=Math.round(s.player.x),pz=Math.round(s.player.z);const r=5+(s.companion==='ivo'?2:0)+(s.gear?.lantern||0);for(let z=-r;z<=r;z++)for(let x=-r;x<=r;x++)if(x*x+z*z<=r*r&&Math.abs(px+x)<=20&&pz+z>=-20&&pz+z<=19)seen.add(key(px+x,pz+z));s.discovered=[...seen];for(const n of WORLD)if(n.type==='secret'&&Math.hypot(n.x-s.player.x,n.z-s.player.z)<=2+(s.gear.lantern>=2?1:0)&&!s.secretSeen.includes(n.id))s.secretSeen.push(n.id);for(const [id,d]of Object.entries(DISCOVERIES))if(s.projects[d.project]===3&&Math.hypot(d.x-s.player.x,d.z-s.player.z)<=2&&!s.discoverySeen.includes(id))s.discoverySeen.push(id);}
export const seen=(s,n)=>s.discovered.includes(key(n.x,n.z));
export function walkable(s,x,z){if(Math.abs(x)>20||z< -20||z>19)return false;if(z===-11&&(!s.flags.bridge||Math.abs(x-2)>1))return false;if(z<-11&&!s.flags.bridge)return false;if(z>=-4&&z<=-3&&x>=-4&&x<=4)return false;return !WORLD.some(n=>n.x===x&&n.z===z&&n.type!=='field'&&n.type!=='wolf'&&n.type!=='discovery'&&n.type!=='puzzle'&&n.type!=='drift'&&n.id!=='bridge'&&stock(s,n)>0);}
export function pathTo(s,x,z,adjacent=false){
 const start=[Math.round(s.player.x),Math.round(s.player.z)],queue=[start],visited=new Map([[key(...start),null]]);let end=null;
 for(let i=0;i<queue.length;i++){const [cx,cz]=queue[i];if((adjacent?Math.abs(cx-x)+Math.abs(cz-z)<=1:cx===x&&cz===z)){end=[cx,cz];break;}for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,nz=cz+dz,k=key(nx,nz);if(!visited.has(k)&&walkable(s,nx,nz)){visited.set(k,[cx,cz]);queue.push([nx,nz]);}}}
 if(!end)return null;const path=[];while(visited.get(key(...end))){path.push(end);end=visited.get(key(...end));}path.reverse();if(Math.hypot(s.player.x-start[0],s.player.z-start[1])>.001)path.unshift(start);return path;
}
export function move(s,x,z){if(!Number.isInteger(x)||!Number.isInteger(z)||(Math.abs(Math.round(s.player.x)-x)+Math.abs(Math.round(s.player.z)-z)>1||Math.hypot(s.player.x-x,s.player.z-z)<.001)||!walkable(s,x,z))return false;const before=s.player;s.player={x,z};J.markTrail(s,before);reveal(s);if(s.contract?.kind==='survey'&&Math.hypot(x-s.contract.x,z-s.contract.z)<=1.5)s.contract.visited=true;return true;}
// Continuous collision movement keeps diagonal speed normalized at the caller.
// Short substeps prevent crossing a blocked tile even on a slow device.
export function canStand(s,x,z){
 const radius=.22;if(x< -20||x>20||z< -20||z>19)return false;
 for(let tz=Math.floor(z-radius+.5);tz<=Math.floor(z+radius+.5);tz++)for(let tx=Math.floor(x-radius+.5);tx<=Math.floor(x+radius+.5);tx++){
  if(walkable(s,tx,tz)||WORLD.some(n=>n.type==='project'&&n.x===tx&&n.z===tz&&Math.round(s.player.x)===tx&&Math.round(s.player.z)===tz))continue;const nx=clamp(x,tx-.5,tx+.5),nz=clamp(z,tz-.5,tz+.5);if(Math.hypot(x-nx,z-nz)<radius)return false;
 }return true;
}
export function moveFree(s,dx,dz){
 if(!Number.isFinite(dx)||!Number.isFinite(dz)||Math.hypot(dx,dz)>2)return false;
 const before={...s.player},count=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.08));
 for(let i=0;i<count;i++){const x=s.player.x+dx/count,z=s.player.z+dz/count;
  if(canStand(s,x,z))s.player={x,z};else{if(canStand(s,x,s.player.z))s.player.x=x;if(canStand(s,s.player.x,z))s.player.z=z;}
 }
 const changed=Math.hypot(s.player.x-before.x,s.player.z-before.z)>.00001;
 if(changed){J.markTrail(s,before);if(Math.round(before.x)!==Math.round(s.player.x)||Math.round(before.z)!==Math.round(s.player.z))reveal(s);if(s.contract?.kind==='survey'&&Math.hypot(s.player.x-s.contract.x,s.player.z-s.contract.z)<=1.5)s.contract.visited=true;}return changed;
}
export function gatherYield(s,n){const item={tree:'wood',scrap:'scrap',coal:'coal',food:'food'}[n?.type];if(!item)return {};const count=({tree:6,scrap:5,coal:4,food:4}[n.type])+s.buildings.workshop+(s.journey.challenge?.id==='handtools'?0:n.type==='tree'?s.gear.axe:['scrap','coal'].includes(n.type)?s.gear.prybar:0)+(n.type==='tree'&&s.companion==='oren'?1:0);return {[item]:count};}
export function canContinueGather(s,n){return ['tree','coal','scrap','food'].includes(n.type)&&stock(s,n)>0&&s.energy>=8&&s.warmth>=15&&s.health>=25;}
export function actionInfo(s,n){
 if(!n)return null;
 if(n.type==='puzzle')return{label:s.journey.solved.includes(n.puzzle)?'Puzzle solved':'Inspect the marks',detail:J.PUZZLES[n.puzzle].clue,cost:{}};
 if(n.type==='drift')return{label:J.driftReady(s,n.drift)?'Search the exposed bundle':'Snow-covered drift',detail:'Passing storms expose old supplies. Each bundle can be collected once per weather cycle.',cost:{},done:!J.driftReady(s,n.drift)};
 if(n.type==='project')return projectInfo(s,n.project);
 if(n.type==='discovery'){const d=DISCOVERIES[n.discovery],found=s.discoveries.includes(n.discovery);return{label:found?'Discovery kept':'Brush away the snow',detail:found?d.decoration:'A small trace of someone who lived here before. 3 energy.',cost:{},energy:3,done:found,reason:s.projects[d.project]!==3||!s.discoverySeen.includes(n.discovery)?'Finish the restoration and follow its clue.':''};}
 if(n.type==='secret'){if(n.id==='vault')return{label:s.vault?'Vault opened':'Open Ada’s vault',detail:s.vault?'The keeper’s gift lives on in your settlement.':s.relics.length<8?'Eight keepsakes hold the key.': 'A gift left for whoever came after.',cost:{},done:s.vault,reason:s.relics.length<8?'Find the eight keepsakes first.':'',energy:5};return{label:s.relics.includes(n.relic)?'Keepsake found':'Search the cairn',detail:s.relics.includes(n.relic)?RELICS[n.relic].text:'5 energy · something lies beneath the snow',cost:{},done:s.relics.includes(n.relic),energy:5};}
 if(n.type==='home')return {label:'Rest at home',detail:'Restore energy, warmth and health',cost:{}};
 if(n.type==='building')return {label:'Open settlement',detail:BUILDINGS[n.id].description,cost:{}};
 if(n.type==='survivor'||n.type==='landmark'){
  if(s.flags[n.id])return{label:'Restored',detail:n.type==='survivor'?'Safe at home. Choose a companion in Crew.':'A permanent part of Frosthollow.',done:true,cost:{}};
  let reason='';if(n.id==='beacon'&&(!s.flags.relay||s.buildings.engine<2||!s.flags.mira||!s.flags.oren||!s.flags.ivo))reason='Requires relay, level 2 locomotive and all three survivors.';
  return {label:n.type==='survivor'?'Rescue survivor':'Restore',detail:reason||costText(COSTS[n.id]),cost:COSTS[n.id],reason};
 }
 if(stock(s,n)<=0)return{label:'Recovering',detail:n.type==='wolf'?'The trail is safe.':'Supplies replenish after resting or time at camp.',done:true,cost:{}};
 if(n.type==='wolf')return{label:'Drive off wolf',detail:'8 energy · up to 18 health · food and salvage',cost:{},energy:8};
 return{label:{tree:'Chop timber',scrap:'Gather salvage',coal:'Mine coal',food:'Pick berries'}[n.type],detail:`${Camp.gatherEnergy(s)} energy · ${stock(s,n)} harvests left`,cost:{},energy:Camp.gatherEnergy(s)};
}
export function interact(s,id){
 const n=WORLD.find(n=>n.id===id);if(!n)return{ok:false,message:'Unknown object.'};
 if(Math.hypot(s.player.x-n.x,s.player.z-n.z)>1.65)return{ok:false,message:'Move closer first.'};
 const info=actionInfo(s,n);if(info.done||info.reason)return{ok:false,message:info.detail};
 if(info.energy>s.energy)return{ok:false,message:'Low energy. Rest at the train for a free refill.'};
 if(!canPay(s,info.cost))return{ok:false,message:'Need '+costText(info.cost)};
 if(n.type==='drift')return J.searchDrift(s,n.drift);
 if(n.type==='puzzle')return{ok:false,message:'Inspect the puzzle first.'};
 if(n.type==='project'){pay(s,info.cost);s.projects[n.project]++;reveal(s);return{ok:true,message:`${n.name}: ${info.label} complete.`,restoration:n.project,finished:s.projects[n.project]===3};}
 if(n.type==='discovery'){const d=DISCOVERIES[n.discovery];s.energy-=3;s.discoveries.push(n.discovery);add(s,d.reward);return{ok:true,message:'Found '+d.name,discovery:d};}
 if(n.type==='secret'){s.energy-=5;if(n.id==='vault'){s.vault=true;add(s,{parts:30,planks:30,coal:20});return{ok:true,message:'Ada’s last gift: supplies and Keeper’s gold livery.',secret:{name:'Her last gift',text:'You open the vault. Tools, fuel, and a gold paint tin wait inside. Ada never knew who would find this place. She left you a beginning.'}};}s.relics.push(n.relic);add(s,{parts:3,food:3});return{ok:true,message:'Found '+RELICS[n.relic].name,secret:RELICS[n.relic]};}
 if(n.type==='building'||n.type==='home')return{ok:false,message:'Use the settlement menu.'};
 if(n.type==='survivor'||n.type==='landmark'){pay(s,info.cost);s.flags[n.id]=true;return{ok:true,message:n.type==='survivor'?`${CREW[n.id].name} is safe at home!`:`${n.name} restored.`,quests:settleQuests(s)};}
 s.energy-=info.energy;s.stock[n.id]=stock(s,n)-1;s.regrowth[n.id]=s.activeSeconds+180;
 let loot;if(n.type==='wolf'){const damage=Math.round(18*(s.companion==='mira'?.7:1)*DIFFICULTIES[s.difficulty].damage);s.health-=damage;loot={food:4,scrap:3};}else{loot=gatherYield(s,n);const [item,count]=Object.entries(loot)[0];s.gathered[item]=(s.gathered[item]||0)+count;}
 if(s.journey.challenge&&n.type!=='wolf')s.journey.challenge.harvests=Math.min(9,s.journey.challenge.harvests+1);add(s,loot);let message='+'+costText(loot);if(s.health<=0){returnHome(s);message+=' · The crew brought you home to recover.';}
 return{ok:true,message,loot,quests:settleQuests(s)};
}
export function projectInfo(s,id){
 const p=PROJECTS[id],level=s.projects[id],stage=p.stages[level];
 const reason=!s.flags[p.crew]?`Rescue ${CREW[p.crew].name} first.`:s.buildings[p.building]<1?`Requires ${BUILDINGS[p.building].name} level 1.`:'';
 return{label:stage?.name||'Restoration complete',detail:stage?`Stage ${level+1} of 3 · ${reason||p.description}`:p.clue,cost:stage?.cost||{},done:!stage,reason:stage?reason:''};
}
export function converse(s,id,choice){
 const c=CONVERSATIONS.find(c=>c.id===id);
 if(!c||!conversationAvailable(s,c)||!Number.isInteger(choice)||!c.choices[choice])return{ok:false,message:'This conversation is not available yet.'};
 // A conversation is a keepsake, never a currency or a repeatable reward.
 s.conversations[id]=choice;return{ok:true,message:c.choices[choice][1],conversation:c,choice};
}
export function craft(s,id,count=1){const r=RECIPES[id];if(!r||!Number.isInteger(count)||count<1||count>50)return{ok:false,message:'Invalid recipe.'};const cost=Object.fromEntries(Object.entries(r.cost).map(([k,v])=>[k,v*count]));if(!canPay(s,cost))return{ok:false,message:'Need '+costText(cost)};pay(s,cost);const quantity=(r.yield+(id==='planks'&&s.journey.friendships.oren===2?1:0))*count;s.inventory[id]+=quantity;s.crafted[id]=(s.crafted[id]||0)+quantity;return{ok:true,message:`Crafted ${quantity} ${ITEMS[id]}.`,quests:settleQuests(s)};}
export function upgrade(s,id){const b=BUILDINGS[id];if(!b)return{ok:false,message:'Unknown building.'};const level=s.buildings[id];if(level>=b.costs.length)return{ok:false,message:'Fully upgraded.'};if(id==='greenhouse'&&!s.flags.pump)return{ok:false,message:'Repair the water pump first.'};const cost=b.costs[level];if(!canPay(s,cost))return{ok:false,message:'Need '+costText(cost)};pay(s,cost);s.buildings[id]++;return{ok:true,message:`${b.name} upgraded to level ${level+1}.`,quests:settleQuests(s)};}
export function returnHome(s){s.player={x:0,z:3};s.warmth=100;s.health=Math.max(50,s.health);reveal(s);}
export function rest(s){returnHome(s);const fed=s.inventory.food>0;if(fed)s.inventory.food--;s.energy=100;s.health=maxHealth(s);s.restCount++;if(s.contract?.kind==='endurance')s.contract.baseline=s.gathered[s.contract.item]||0;let replenished=0;for(const n of WORLD){if(!n.stock||n.type==='wolf')continue;if(stock(s,n)<n.stock){s.stock[n.id]=n.stock;replenished++;}}return{ok:true,message:fed?'A hot meal. Energy, warmth and health restored.':'Rested by the stove. Energy and health restored.',replenished};}
export function consume(s,item){if(!['food','medkit'].includes(item)||s.inventory[item]<1)return{ok:false,message:'No supplies available.'};s.inventory[item]--;if(item==='food'){s.energy=clamp(s.energy+30,0,100);s.warmth=clamp(s.warmth+15,0,100);}else{s.health=clamp(s.health+60,0,maxHealth(s));}return{ok:true,message:item==='food'?'+30 energy · +15 warmth':'+60 health'};}
export function tick(s,dt){
 dt=clamp(dt,0,1);s.activeSeconds+=dt;if(s.camp.meal&&!Camp.activeMeal(s))s.camp.meal=null;const distance=Math.hypot(s.player.x,s.player.z);const storm=J.weather(s).storm;
 if(distance<6){s.warmth=clamp(s.warmth+dt*5,0,100);s.energy=clamp(s.energy+dt*1.6,0,100);}else{s.warmth=clamp(s.warmth-dt*(storm?.8:.28)*(J.sheltered(s)?.45:1)*(s.journey.friendships.mira===2?.9:1)*DIFFICULTIES[s.difficulty].cold*Camp.mealCold(s)/(1+s.buildings.furnace*.6+s.gear.coat*.4),0,100);if(s.warmth===0)s.health-=dt*(s.companion==='mira'?.7:1)*DIFFICULTIES[s.difficulty].damage;}
 if(s.health<=0)returnHome(s);
 if(s.buildings.greenhouse)s.harvest=clamp(s.harvest+dt*s.buildings.greenhouse/45,0,30);
 for(const n of WORLD)if(n.stock&&n.type!=='wolf'&&stock(s,n)<n.stock&&s.regrowth[n.id]&&s.activeSeconds>=s.regrowth[n.id]){s.stock[n.id]=n.stock;delete s.regrowth[n.id];}
}
export function harvest(s){const amount=Math.floor(s.harvest);if(!amount)return{ok:false,message:'Crops are still growing.'};s.harvest-=amount;s.inventory.food+=amount;return{ok:true,message:`Harvested ${amount} food.`};}
export function gearLock(s,id){if(id==='lantern'&&!s.relics.length)return 'Discover a hidden keepsake to learn this design.';if(s.gear[id]===2&&!s.flags.beacon)return 'Restore the beacon to unlock masterwork equipment.';return '';}
export function upgradeGear(s,id){const g=GEAR[id];if(!g)return{ok:false,message:'Unknown equipment.'};const level=s.gear[id];if(level>=3)return{ok:false,message:'Masterwork complete.'};const lock=gearLock(s,id);if(lock)return{ok:false,message:lock};const cost=g.costs[level];if(!canPay(s,cost))return{ok:false,message:'Need '+costText(cost)};pay(s,cost);s.gear[id]++;reveal(s);return{ok:true,message:`${g.name} improved to level ${level+1}.`};}
export function achievementProgress(s,a){switch(a.kind){case'building':return s.buildings[a.key];case'gathered':return s.gathered[a.key]||0;case'crafted':return s.crafted[a.key]||0;case'flag':return s.flags[a.key]?1:0;case'crew':return Object.keys(CREW).filter(k=>s.flags[k]).length;case'explored':return s.discovered.length;case'relics':return s.relics.length;case'vault':return s.vault?1:0;case'contracts':return s.contractsCompleted;case'gear':return Object.values(s.gear).reduce((a,b)=>a+b,0);case'buildings':return Object.values(s.buildings).reduce((a,b)=>a+b,0);default:return 0;}}
export function awardAchievements(s){const unlocked=[];for(const a of ACHIEVEMENTS)if(!s.achievements.includes(a.id)&&achievementProgress(s,a)>=a.target){s.achievements.push(a.id);unlocked.push(a);}return unlocked;}
export function setLivery(s,id){const l=LIVERIES[id];if(!l)return{ok:false,message:'Unknown livery.'};awardAchievements(s);if(l.achievement&&!s.achievements.includes(l.achievement))return{ok:false,message:l.description};s.livery=id;return{ok:true,message:`Locomotive painted ${l.name}.`};}
export function newContract(s){s.contractSerial++;const rng=random((s.seed+Math.imul(s.contractSerial,7919))>>>0),kind=['gather','craft','survey','endurance'][Math.floor(rng()*4)],tier=Math.min(4,Math.floor(s.contractsCompleted/5));const item=kind==='craft'?['planks','parts'][Math.floor(rng()*2)]:['wood','scrap','coal','food'][Math.floor(rng()*4)];const target=kind==='survey'?1:kind==='craft'?6+tier*2:12+tier*4;let x=Math.floor(rng()*36)-18,z=Math.floor(rng()*(s.flags.bridge?36:24))-(s.flags.bridge?18:6);while(!walkable(s,x,z)){x=x<18?x+1:-18;z=z<18?z+1:-6;}s.contract={kind,item,target,baseline:(kind==='craft'?s.crafted:s.gathered)[item]||0,x,z,visited:false,reward:{parts:3+tier,food:4+tier}};return s.contract;}
export function contractProgress(s,c=s.contract){if(!c)return 0;if(c.kind==='survey')return c.visited?1:0;return Math.max(0,((c.kind==='craft'?s.crafted:s.gathered)[c.item]||0)-c.baseline);}
export function contractText(c){return c.kind==='survey'?`Scout the marked trail at ${c.x}, ${c.z}, then claim your reward.`:`${c.kind==='craft'?'Craft':'Gather'} ${c.target} ${ITEMS[c.item]}${c.kind==='endurance'?' in one outing without resting':''}.`;}
export function claimContract(s){if(!s.contract||contractProgress(s)<s.contract.target)return{ok:false,message:'Complete this contract first.'};const reward=s.contract.reward;add(s,reward);s.contractsCompleted++;newContract(s);return{ok:true,message:'Contract complete! '+costText(reward)};}
export function serialize(s){return JSON.stringify(s);}
export function deserialize(text){
 if(typeof text!=='string'||text.length>500000)throw Error('Invalid save size.');const v=JSON.parse(text);if(!v||v.version!==VERSION)throw Error('Unsupported save version.');const s=newGame();
 function number(x,max=1000000){if(typeof x!=='number'||!Number.isFinite(x)||x<0||x>max)throw Error('Invalid save value.');return x;}
 for(const id of Object.keys(PROJECTS))s.projects[id]=Math.floor(number(v.projects?.[id]??0,3));
 s.discoverySeen=Object.keys(DISCOVERIES).filter(id=>s.projects[DISCOVERIES[id].project]===3&&Array.isArray(v.discoverySeen)&&v.discoverySeen.includes(id));
 s.discoveries=s.discoverySeen.filter(id=>Array.isArray(v.discoveries)&&v.discoveries.includes(id));
 for(const c of CONVERSATIONS)if(Number.isInteger(v.conversations?.[c.id])&&c.choices[v.conversations[c.id]])s.conversations[c.id]=v.conversations[c.id];
 s.seed=number(v.seed??78219,4294967295);
 for(const k of Object.keys(GEAR))s.gear[k]=Math.floor(number(v.gear?.[k]??0,3));
 s.relics=Array.isArray(v.relics)?[...new Set(v.relics.filter(n=>Number.isInteger(n)&&n>=0&&n<8))]:[];
 s.secretSeen=Array.isArray(v.secretSeen)?[...new Set(v.secretSeen.filter(id=>WORLD.some(n=>n.type==='secret'&&n.id===id)))]:[];
 s.vault=v.vault===true;s.achievements=Array.isArray(v.achievements)?ACHIEVEMENTS.filter(a=>v.achievements.includes(a.id)).map(a=>a.id):[];s.contractSerial=number(v.contractSerial??0);s.contractsCompleted=number(v.contractsCompleted??0);
 s.difficulty=DIFFICULTIES[v.difficulty]?v.difficulty:'standard';s.livery=LIVERIES[v.livery]?v.livery:'classic';
 if(v.contract){const c=v.contract;if(!['gather','craft','survey','endurance'].includes(c.kind)||!ITEMS[c.item]||!Number.isInteger(c.x)||!Number.isInteger(c.z)||Math.abs(c.x)>19||c.z< -19||c.z>18)throw Error('Invalid contract.');s.contract={kind:c.kind,item:c.item,target:number(c.target,100),baseline:number(c.baseline,1e9),x:c.x,z:c.z,visited:c.visited===true,reward:{parts:number(c.reward?.parts,25),food:number(c.reward?.food,25)}};}
 for(const k of Object.keys(ITEMS))s.inventory[k]=Math.floor(number(v.inventory?.[k]));
 for(const k of Object.keys(BUILDINGS))s.buildings[k]=Math.floor(number(v.buildings?.[k],3));
 if(!v.player||!Number.isFinite(v.player.x)||!Number.isFinite(v.player.z)||Math.abs(v.player.x)>20||v.player.z< -20||v.player.z>19)throw Error('Invalid player position.');s.player={x:v.player.x,z:v.player.z};
 for(const k of ['energy','warmth'])s[k]=number(v[k],100);s.health=number(v.health,145);s.activeSeconds=number(v.activeSeconds,1e10);s.restCount=number(v.restCount);s.harvest=number(v.harvest,30);
 for(const k of Object.keys(COSTS))if(v.flags?.[k]===true)s.flags[k]=true;
 for(const n of WORLD)if(n.stock&&v.stock?.[n.id]!==undefined)s.stock[n.id]=Math.floor(number(v.stock[n.id],n.stock));
 for(const n of WORLD)if(v.regrowth?.[n.id]!==undefined)s.regrowth[n.id]=number(v.regrowth[n.id],1e10);
 for(const kind of ['gathered','crafted'])for(const k of Object.keys(ITEMS))if(v[kind]?.[k]!==undefined)s[kind][k]=number(v[kind][k]);
 if(!Array.isArray(v.completed)||!Array.isArray(v.discovered)||v.discovered.length>4000)throw Error('Invalid progress.');
 s.completed=QUESTS.filter(q=>v.completed.includes(q.id)).map(q=>q.id);s.discovered=[...new Set(v.discovered.filter(k=>typeof k==='string'&&/^-?\d{1,2},-?\d{1,2}$/.test(k)))];
 s.journey=J.readJourney(v.journey,s);s.field=Field.readField(v.field,s);s.camp=Camp.readCamp(v.camp,s,{recipe:RECIPES,building:BUILDINGS,project:PROJECTS,gear:GEAR});
 s.companion=CREW[v.companion]&&s.flags[v.companion]&&!s.field.jobs[v.companion]?v.companion:null;s.settings={sound:v.settings?.sound!==false,music:v.settings?.music!==false,quality:v.settings?.quality==='low'?'low':'balanced',zoom:Number.isFinite(v.settings?.zoom)?Math.max(16,Math.min(34,v.settings.zoom)):24,haptics:['off','light','full'].includes(v.settings?.haptics)?v.settings.haptics:'off',autoGather:v.settings?.autoGather!==false,dragSensitivity:[.75,1,1.5].includes(v.settings?.dragSensitivity)?v.settings.dragSensitivity:1,reducedMotion:v.settings?.reducedMotion===true,steadyDaylight:v.settings?.steadyDaylight===true,...Object.fromEntries(['musicVolume','ambienceVolume','effectsVolume'].map((k,i)=>[k,Number.isFinite(v.settings?.[k])?Math.max(0,Math.min(1,v.settings[k])):[.7,.7,.8][i]]))};s.started=v.started===true;
 // A pre-update save may stand on a newly added project tile; it can walk out.
 if(!walkable(s,Math.round(s.player.x),Math.round(s.player.z))&&!WORLD.some(n=>n.type==='project'&&n.x===s.player.x&&n.z===s.player.z))s.player={x:0,z:3};reveal(s);return s;
}

// Route previews use only known walkable tiles; they cannot disclose a hidden shortcut.
export function exploredRoute(s){
 const w=s.camp.waypoint;if(!w)return null;
 const start=[Math.round(s.player.x),Math.round(s.player.z)],queue=[start],visited=new Map([[key(...start),null]]),known=new Set(s.discovered),adjacent=!walkable(s,w.x,w.z);let end=null;
 for(let i=0;i<queue.length;i++){const [x,z]=queue[i];if(adjacent?Math.abs(x-w.x)+Math.abs(z-w.z)<=1:x===w.x&&z===w.z){end=[x,z];break;}for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz,k=key(nx,nz);if(!visited.has(k)&&known.has(k)&&walkable(s,nx,nz)){visited.set(k,[x,z]);queue.push([nx,nz]);}}}
 if(!end)return null;const path=[];while(visited.get(key(...end))){path.push(end);end=visited.get(key(...end));}return path.reverse();
}
