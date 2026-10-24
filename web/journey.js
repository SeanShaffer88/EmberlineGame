// Original, offline additions to the permanent valley. Active play time only.
export const PUZZLES={
 tracks:{name:'Three visitors',x:-6,z:9,kind:'sequence',answer:[1,0,2],options:['Fox','Hare','Bird'],clue:'Read the prints from the cairn outward: long paired bounds, four small paws, then three-toed marks.',story:'Under the last marked stone is a little wooden hare. Someone made a game of the walk home.',reward:{parts:5,food:6},deco:'hareSign'},
 chimes:{name:'The quiet chimes',x:9,z:-6,kind:'dials',answer:[3,3,3],options:['North','East','South','West'],clue:'An arrow scratched beneath the cups points west. Turn all three openings toward that arrow.',story:'The cups catch the wind together. A hollow note answers from a loose cap, where a maker left spare fittings.',reward:{scrap:12,parts:4},deco:'windchime'},
 signal:{name:'A reply in brass',x:3,z:-16,kind:'sequence',answer:[0,2,1,2],options:['Low','Middle','High'],clue:'The brass strip reads: one notch, three notches, two notches, three notches. Low has one; high has three. Sound is optional.',story:'The old mechanism answers with a warm click. Inside is a star-shaped lantern pattern and a note: “So you can see your way back.”',reward:{coal:12,planks:6},deco:'starLantern'}
};
export const DECORATIONS={
 lantern:{name:'Amber lantern',cost:{wood:3,coal:1},unlock:s=>s.buildings.engine>=1,hint:'Restore the locomotive'},
 planter:{name:'Winter planter',cost:{wood:4,food:2},unlock:s=>s.projects.garden>=1,hint:'Start the winter garden'},
 bench:{name:'Carved bench',cost:{wood:5,planks:2},unlock:s=>s.projects.platform>=1,hint:'Start the gathering porch'},
 sign:{name:'Trail sign',cost:{planks:2,parts:2},unlock:s=>s.projects.signal>=1,hint:'Start the signal post'},
 feeder:{name:'Bird feeder',cost:{wood:4,food:2},unlock:s=>s.journey.friendships.oren>=2,hint:'Finish Oren’s two requests'},
 quilt:{name:'Patchwork seat',cost:{planks:1,food:3},unlock:s=>s.journey.friendships.mira>=2,hint:'Finish Mira’s two requests'},
 map:{name:'Framed valley map',cost:{planks:2,parts:1},unlock:s=>s.journey.friendships.ivo>=2,hint:'Finish Ivo’s two requests'},
 hareSign:{name:'Little hare carving',cost:{wood:3},unlock:s=>s.journey.solved.includes('tracks'),hint:'Solve Three visitors'},
 windchime:{name:'Copper wind chimes',cost:{scrap:3},unlock:s=>s.journey.solved.includes('chimes'),hint:'Solve The quiet chimes'},
 starLantern:{name:'Star lantern',cost:{parts:2,coal:1},unlock:s=>s.journey.solved.includes('signal'),hint:'Solve A reply in brass'},
 pennant:{name:'Winter champion pennant',cost:{wood:2},unlock:s=>Object.values(s.journey.wins).some(v=>v>0),hint:'Complete any winter challenge'}
};
export const DECOR_SLOTS={hearth:{name:'Hearth corner',x:-3.45,z:.55},coach:{name:'Coach ledge',x:-2.2,z:-3},garden:{name:'Garden corner',x:-1.55,z:4.35},workshop:{name:'Workshop corner',x:3.4,z:.6}};
export const DECOR_COLORS={amber:0xd9ab63,cranberry:0xae5960,pine:0x6f927d,blue:0x6a98b1};
export const REQUESTS={
 mira:[{title:'A shelf of clean bandages',need:{medkit:2},ready:s=>s.buildings.infirmary>=1,hint:'Build the infirmary',text:'Mira leaves one shelf empty on purpose. “For the days when nobody needs it.”',reward:{food:5}}, {title:'Supper beside the seedlings',need:{food:6},ready:s=>s.projects.garden===3,hint:'Finish the winter garden',text:'The crew shares supper beside the green shoots. Mira brings out a quilt made from old travelling coats. You can make patchwork seats now; her advice also reduces cold exposure by 10%.',reward:{medkit:2}}],
 oren:[{title:'A tool that belongs to someone',need:{parts:3,planks:2},ready:s=>s.buildings.workshop>=1,hint:'Build the workshop',text:'Oren carves your initials into a handle. “Borrowed tools always feel ready to leave. This one is yours.”',reward:{wood:8}}, {title:'Room for the small visitors',need:{wood:8,food:3},ready:s=>s.projects.platform===3,hint:'Finish the gathering porch',text:'Oren hangs a feeder beside the porch. His bird feeder design is yours, and his careful saw setup makes one extra plank per crafting batch.',reward:{planks:4}}],
 ivo:[{title:'A map with the small things',need:{parts:2,food:3},ready:s=>s.flags.bridge,hint:'Repair the footbridge',text:'Ivo marks the crooked pine and the place where the hare sleeps. “A map should help you recognise home.”',reward:{scrap:7}}, {title:'Flags for the familiar trails',need:{planks:4,coal:3},ready:s=>s.projects.signal===3,hint:'Finish the signal post',text:'You and Ivo mark the sheltered paths. His framed map design is yours, and his route advice reduces the movement penalty in storms.',reward:{parts:4}}]
};
export const ANIMALS={hare:{name:'Thimble the hare',x:-6,z:8,text:'Thimble bounds from the low stones toward Ada’s first cairn. Look for long paired prints near Three visitors.'},fox:{name:'Ember the fox',x:-8,z:7,text:'Ember checks the snow near the pump, circles once, then pauses between the pines. After a storm, look for exposed bundles near the western trail.'},bird:{name:'Pip the snowbird',x:2,z:0,text:'Pip waits near warm roofs, then visits any bird feeder you place. A tiny regular visitor makes the camp feel occupied.'}};
export const DRIFTS={west:{name:'Western snowdrift',x:-10,z:4},east:{name:'Eastern snowdrift',x:10,z:6},ridge:{name:'Ridge snowdrift',x:-4,z:-16}};
export const CHALLENGES={
 handtools:{name:'Back to hand tools',text:'Gather 30 timber using basic tools. Equipment yield bonuses are temporarily disabled; your upgrades stay yours.',reward:{parts:8,food:4}},
 careful:{name:'A careful outing',text:'Gather at least 8 timber, 8 coal and 8 food within 8 harvests. You may rest. No supplies are lost if you restart.',reward:{parts:10,planks:5}},
 snowwalk:{name:'The white walk',text:'Visit 6 different trail tiles away from camp during a personal snowstorm. Sheltered paths and warm clothing help. Cozy difficulty is welcome.',reward:{food:8,coal:10}}
};
const ok=(message,extra={})=>({ok:true,message,...extra}),fail=message=>({ok:false,message});
const afford=(s,c)=>Object.entries(c).every(([id,n])=>s.inventory[id]>=n),pay=(s,c)=>Object.entries(c).forEach(([id,n])=>s.inventory[id]-=n),give=(s,c)=>Object.entries(c).forEach(([id,n])=>s.inventory[id]+=n);
export function newJourney(){return{solved:[],puzzleSteps:{},craftedDecor:[],decor:{},color:'amber',friendships:{mira:0,oren:0,ivo:0},animals:[],trails:{},cacheClaims:{},challenge:null,wins:{handtools:0,careful:0,snowwalk:0}};}
export function readJourney(v,s){
 const j=newJourney();if(!v||typeof v!=='object')return j;
 const list=(value,keys)=>Array.isArray(value)?[...new Set(value)].filter(id=>keys.includes(id)):[];
 j.solved=list(v.solved,Object.keys(PUZZLES));j.craftedDecor=list(v.craftedDecor,Object.keys(DECORATIONS));j.animals=list(v.animals,Object.keys(ANIMALS));
 const bounded=(v,max)=>Number.isFinite(v)?Math.max(0,Math.min(max,Math.floor(v))):0;
 for(const [id,p]of Object.entries(PUZZLES)){const values=v.puzzleSteps?.[id];if(!Array.isArray(values))continue;if(p.kind==='dials')j.puzzleSteps[id]=[0,1,2].map(i=>bounded(values[i],3));else{const prefix=[];for(let i=0;i<Math.min(values.length,p.answer.length);i++){if(values[i]!==p.answer[i])break;prefix.push(values[i]);}j.puzzleSteps[id]=prefix;}}
 for(const id of Object.keys(REQUESTS))j.friendships[id]=bounded(v.friendships?.[id],2);
 for(const id of Object.keys(DECOR_SLOTS))if(j.craftedDecor.includes(v.decor?.[id]))j.decor[id]=v.decor[id];
 if(Object.hasOwn(DECOR_COLORS,v.color))j.color=v.color;
 for(const [key,value]of Object.entries(v.trails||{}).slice(0,1640)){const parts=key.split(',').map(Number);if(parts.length===2&&parts.every(Number.isInteger)&&Math.abs(parts[0])<=20&&parts[1]>=-20&&parts[1]<=19&&bounded(value,8))j.trails[key]=bounded(value,8);}
 for(const id of Object.keys(DRIFTS))if(Number.isInteger(v.cacheClaims?.[id])&&v.cacheClaims[id]>=0&&v.cacheClaims[id]<=Math.floor(s.activeSeconds/360))j.cacheClaims[id]=v.cacheClaims[id];
 for(const id of Object.keys(CHALLENGES))j.wins[id]=bounded(v.wins?.[id],1000000);
 const c=v.challenge;if(c&&Object.hasOwn(CHALLENGES,c.id)){j.challenge={id:c.id,baseline:{wood:0,coal:0,food:0},harvests:bounded(c.harvests,9),visits:[]};for(const k of ['wood','coal','food'])j.challenge.baseline[k]=Math.min(s.gathered[k]||0,bounded(c.baseline?.[k],1000000));j.challenge.visits=list(c.visits,Object.keys(j.trails)).slice(0,6);}
 return j;
}
export function markTrail(s,before){const key=`${Math.round(s.player.x)},${Math.round(s.player.z)}`;if(key===`${Math.round(before.x)},${Math.round(before.z)}`)return;s.journey.trails[key]=Math.min(8,(s.journey.trails[key]||0)+1);const c=s.journey.challenge;if(c?.id==='snowwalk'&&Math.hypot(s.player.x,s.player.z)>6&&s.warmth>0&&!c.visits.includes(key)&&c.visits.length<6)c.visits.push(key);}
export function weather(s){const phase=s.activeSeconds%360,personal=s.journey?.challenge?.id==='snowwalk',storm=personal||phase>=240;return{storm,personal,next:Math.ceil(storm?360-phase:240-phase),sheltered:sheltered(s),label:personal?'Challenge snow':storm?'Snowstorm':phase>=210?'Snow approaching':'Light snow'};}
export function sheltered(s){return Math.hypot(s.player.x,s.player.z)<6||[['infirmary',-5,4],['greenhouse',5,4],['workshop',3,1]].some(([id,x,z])=>s.buildings[id]>0&&Math.hypot(x-s.player.x,z-s.player.z)<2.5)||[[-6,-1,'platform'],[-1,4,'garden']].some(([x,z,id])=>s.projects[id]===3&&Math.hypot(x-s.player.x,z-s.player.z)<2);}
export function travelSpeed(s){if(!weather(s).storm||sheltered(s))return 1;return s.difficulty==='cozy'?.97:Math.min(1,(s.difficulty==='harsh'?.72:.82)+s.gear.coat*.03+(s.journey.friendships.ivo===2?.1:0));}
export function driftReady(s,id){const cycle=Math.floor(s.activeSeconds/360);return cycle>0&&s.journey.cacheClaims[id]!==cycle;}
export function searchDrift(s,id){const d=DRIFTS[id];if(!d||Math.hypot(s.player.x-d.x,s.player.z-d.z)>1.65)return fail('Move closer to the drift.');if(!driftReady(s,id))return fail('A passing storm may uncover something here.');s.journey.cacheClaims[id]=Math.floor(s.activeSeconds/360);give(s,{wood:4,scrap:4});return ok('The wind exposed a bundle: 4 timber and 4 salvage.');}
export function solvePuzzle(s,id,input){
 const p=PUZZLES[id];if(!p||Math.hypot(s.player.x-p.x,s.player.z-p.z)>2)return fail('Walk close to inspect the mechanism.');if(s.journey.solved.includes(id))return fail('This puzzle is already solved.');if(id==='signal'&&s.projects.signal<3)return fail('Finish your valley signal post to understand this mechanism.');
 if(!Number.isInteger(input)||input<0||input>=(p.kind==='dials'?3:p.options.length))return fail('Choose a marked part.');
 let steps=s.journey.puzzleSteps[id]||(p.kind==='dials'?[0,0,0]:[]);
 if(p.kind==='dials'){steps=[...steps];steps[input]=(steps[input]+1)%4;}else{steps=[...steps,input];if(steps.some((n,i)=>p.answer[i]!==n))steps=[];}
 s.journey.puzzleSteps[id]=steps;
 if(steps.length===p.answer.length&&steps.every((n,i)=>n===p.answer[i])){s.journey.solved.push(id);give(s,p.reward);return ok('A secret solved. '+p.story,{story:p.story,sound:'reward'});}
 return ok(p.kind==='dials'?'The cup turns.':steps.length?'The marks agree. Continue the pattern.':'The pattern resets. Look at the clue and try again.',{sound:id==='tracks'?'step-packed':'note-'+input});
}
export function craftDecoration(s,id){const d=DECORATIONS[id];if(!d)return fail('Unknown design.');if(s.journey.craftedDecor.includes(id))return fail('You already made this design; place it freely.');if(!d.unlock(s))return fail(d.hint+'.');if(!afford(s,d.cost))return fail('Gather the listed supplies first.');pay(s,d.cost);s.journey.craftedDecor.push(id);return ok(d.name+' made. Place or move it freely.');}
export function placeDecoration(s,slot,id){if(!Object.hasOwn(DECOR_SLOTS,slot)||(id!==''&&!s.journey.craftedDecor.includes(id)))return fail('Choose a crafted decoration and a marked spot.');if(id)s.journey.decor[slot]=id;else delete s.journey.decor[slot];return ok('Your camp has a new detail.');}
export function helpFriend(s,id){const level=s.journey.friendships[id],r=REQUESTS[id]?.[level];if(!r||!s.flags[id])return fail('This request is not available.');if(!r.ready(s))return fail(r.hint+'.');if(!afford(s,r.need))return fail('Gather the listed supplies first.');pay(s,r.need);s.journey.friendships[id]++;give(s,r.reward);return ok(r.text,{story:r.text});}
export function animalSpot(s,id){if(id==='bird'){const feeder=Object.entries(s.journey.decor).find(([,v])=>v==='feeder');if(feeder)return DECOR_SLOTS[feeder[0]];}return ANIMALS[id];}
export function observeAnimal(s,id){const a=animalSpot(s,id);if(!a||Math.hypot(s.player.x-a.x,s.player.z-a.z)>3)return fail('Move closer and watch quietly.');if(s.journey.animals.includes(id))return ok(ANIMALS[id].text);s.journey.animals.push(id);return ok('A familiar face: '+ANIMALS[id].text,{story:ANIMALS[id].text});}
export function startChallenge(s,id){if(!Object.hasOwn(CHALLENGES,id))return fail('Unknown challenge.');if(s.journey.challenge)return fail('Finish or leave your current challenge first.');s.journey.challenge={id,baseline:{wood:s.gathered.wood||0,coal:s.gathered.coal||0,food:s.gathered.food||0},harvests:0,visits:[]};return ok(CHALLENGES[id].name+' started. You can leave it at any time.');}
export function challengeProgress(s){const c=s.journey.challenge;if(!c)return{ready:false,text:'No challenge active'};const got=k=>(s.gathered[k]||0)-c.baseline[k];if(c.id==='handtools')return{ready:got('wood')>=30,text:`${Math.min(30,got('wood'))} / 30 timber`};if(c.id==='snowwalk')return{ready:c.visits.length>=6,text:`${c.visits.length} / 6 snowy trail tiles`};const ready=['wood','coal','food'].every(k=>got(k)>=8)&&c.harvests<=8;return{ready,failed:c.harvests>=8&&!ready,text:`Timber ${Math.min(8,got('wood'))}/8 · coal ${Math.min(8,got('coal'))}/8 · food ${Math.min(8,got('food'))}/8 · ${c.harvests}/8 harvests`};}
export function finishChallenge(s,claim){const c=s.journey.challenge;if(!c)return fail('No challenge active.');if(claim&&!challengeProgress(s).ready)return fail('Complete the challenge first.');if(claim){give(s,CHALLENGES[c.id].reward);s.journey.wins[c.id]++;}s.journey.challenge=null;return ok(claim?'Challenge complete! Supplies received and the winter pennant design unlocked.':'Challenge ended. Your settlement, upgrades and supplies are safe.');}

export function surfaceAt(s){if(s.player.z>=-12.3&&s.player.z<=-9.5&&s.flags.bridge&&Math.abs(s.player.x-2)<1.6)return 'step-wood';if(s.player.z>=-4.6&&s.player.z<=-2.5)return 'step-metal';const count=s.journey.trails[`${Math.round(s.player.x)},${Math.round(s.player.z)}`]||0;return count>=3?'step-packed':'step';}
