import {weather} from './journey.js';

// Optional activities in Frosthollow. All durations use active simulation time.
export const SPECIMENS = {
 violet:{name:'Snow violet',x:-2,z:8,shape:'flower',hint:'On the southern trail',text:'A violet shelters in the lee of a warm stone. Ash sketches its petals and leaves the roots undisturbed.'},
 fern:{name:'Glass fern',x:8,z:4,shape:'fern',hint:'East of the greenhouse',text:'Ice outlines every frond. The notebook keeps a rubbing of its shape, not a picked plant.'},
 mushroom:{name:'Coppercap cluster',x:-7,z:11,shape:'mushroom',hint:'Beyond the western garden',text:'Tiny copper roofs under the pines. Mira labels this an observation, never a cooking ingredient.'},
 feather:{name:'Russet feather',x:11,z:-4,shape:'feather',hint:'Beside the eastern rails',text:'A single feather catches the sunset. Ivo thinks the bird has already found a warmer perch.'},
 cone:{name:'Old pine cone',x:-14,z:1,shape:'cone',hint:'Near the western treeline',text:'The scales still guard next spring. Oren sees a miniature roof in every overlapping plate.'},
 quartz:{name:'Frost quartz',x:5,z:-15,shape:'crystal',hint:'Across the creek, east of the bridge',text:'Clear facets turn a little light into many small lights. Nothing here needs to be precious to be beautiful.'},
 lichen:{name:'Gold lichen',x:-7,z:-15,shape:'lichen',hint:'On a rock on the northern bank',text:'A bright patch survives where almost nothing else grows. Mira sketches its patient circles.'},
 fossil:{name:'Spiral stone',x:9,z:-18,shape:'fossil',hint:'Below the northeastern ridge',text:'A tiny spiral from an older valley. Ivo wonders what this snowfield sounded like when it was water.'}
};
export const VISTAS = {
 pines:{name:'Pinewatch',x:-15,z:11,text:'The western trees frame the train like a small red promise. From here, the smoke is the first thing you notice.'},
 dawn:{name:'Sunward rise',x:15,z:8,text:'Every roof catches the light differently. What once looked abandoned now looks lived in.'},
 ridge:{name:'Stillwater ridge',x:-10,z:-18,text:'The bridge stitches two banks together. The valley feels larger without ever becoming somewhere else.'}
};
export const SIGNS = {south:{name:'Home trail sign',x:-1,z:6},east:{name:'Creek trail sign',x:8,z:-8},north:{name:'Ridge trail sign',x:2,z:-14}};
export const POND={name:'Stillwater fishing nook',x:-3,z:-9};
export const FISH={dace:{name:'Silver dace',text:'A quick silver flash below the ice.',pattern:[0,1,2]},char:{name:'Ember char',text:'A copper flank in the blue water.',pattern:[1,0,2]},perch:{name:'Snowfin perch',text:'Striped like the shadows of reeds.',pattern:[0,0,2]},loach:{name:'Pebble loach',text:'A small, patient fish from the creek bed.',pattern:[1,1,2]}};
export const FISH_MOVES=['Wait','Ease the line','Reel gently'];
const FISH_CUES=['The float is only trembling. Wait for a clear pull.','The line is taut. Ease it so the fish can turn.','The float settles toward you. Reel gently.'];
export const JOBS={
 mira:{name:'Sort medical supplies',seconds:150,cost:{food:2,scrap:1},reward:{medkit:2},station:'infirmary'},
 oren:{name:'Prepare a timber bundle',seconds:120,cost:{wood:4},reward:{planks:4},station:'workshop'},
 ivo:{name:'Sort recovered salvage',seconds:150,cost:{scrap:4},reward:{parts:4},station:'engine'}
};
export const CAMP_STORIES={
 mira:{title:'The blue cup',crew:'mira',text:'Mira sets a chipped blue cup beside the stove. “I carried this through three winters. I kept thinking a home would deserve a better one.” She turns the chip toward the wall. “Maybe a home is where you stop apologising for what survived.”'},
 oren:{title:'A table for four',crew:'oren',text:'Oren measures the same plank twice, then draws an extra place at the table. “That seat is for whoever comes next.” Ash asks whether the bench is strong enough. Oren grins. “I am building it with that in mind.”'},
 ivo:{title:'The way back',crew:'ivo',text:'Ivo once knew every route out of Frosthollow. Tonight the scout marks the trail back to the hearth. “It is a different sort of map,” Ivo says. The others make room on the bench without being asked.'}
};
export const RADIO_NOTES=[
 {title:'A voice in the snow',text:'A stored message crackles from the repaired set: “Northline shelter reporting. We see your light. Keep it burning.”'},
 {title:'Garden advice',text:'“We grew beans in old tins,” says the next stored transmission. “Turn them toward whatever light you have.” Mira saves the idea in the margins.'},
 {title:'A song without words',text:'The tape holds a few hummed notes, then laughter. No coordinates. No request. Just proof that somewhere, someone had a good evening.'},
 {title:'Home frequency',text:'“If you can hear this, you are not the last.” Ash labels the archive HOME, then leaves a little space on the shelf for the next voice.'}
];
export const EXCHANGES={fuel:{name:'Sort salvage for fuel',cost:{scrap:6},reward:{coal:3}},timber:{name:'Reclaim packing timber',cost:{scrap:6},reward:{wood:4}},salvage:{name:'Trade spare planks',cost:{planks:6},reward:{scrap:4}}};
export const FIELD_BUILDS={rod:{name:'Fishing rod',cost:{planks:2,scrap:2}},cabinet:{name:'Notebook display cabinet',cost:{planks:6,parts:3}},bridgeLights:{name:'Bridge lanterns',cost:{parts:4,coal:3}}};
export const MASTERY_STEPS=[30,90,180];
const owns=(o,k)=>typeof k==='string'&&Object.hasOwn(o,k);
const ok=(message,extra={})=>({ok:true,message,...extra}),fail=message=>({ok:false,message});
const near=(s,p,r=2)=>Math.hypot(s.player.x-p.x,s.player.z-p.z)<=r;
const afford=(s,c)=>Object.entries(c).every(([k,n])=>s.inventory[k]>=n);
const pay=(s,c)=>{for(const [k,n]of Object.entries(c))s.inventory[k]-=n;};
const give=(s,c)=>{for(const [k,n]of Object.entries(c))s.inventory[k]=Math.min(1000000,s.inventory[k]+n);};
export const atCamp=s=>Math.hypot(s.player.x,s.player.z)<7;
export const fieldSeen=(s,p)=>s.discovered.includes(`${p.x},${p.z}`);
export function fieldNodes(){return[
 ...Object.entries(SPECIMENS).map(([id,p])=>({id:'specimen-'+id,type:'field',field:'notebook',entry:id,name:p.name,x:p.x,z:p.z})),
 ...Object.entries(VISTAS).map(([id,p])=>({id:'vista-'+id,type:'field',field:'viewpoints',entry:id,name:p.name,x:p.x,z:p.z})),
 ...Object.entries(SIGNS).map(([id,p])=>({id:'sign-'+id,type:'field',field:'trailworks',entry:id,name:p.name,x:p.x,z:p.z})),
 {id:'fishing-nook',type:'field',field:'fishing',name:POND.name,x:POND.x,z:POND.z}
];}
export function newField(){return{specimens:[],vistas:[],fish:{},casts:0,fishing:null,fishReady:0,builds:[],signs:[],benches:[],breathers:{},mastery:{wood:0,scrap:0,coal:0,food:0},jobs:{},jobCount:{mira:0,oren:0,ivo:0},stories:[],radio:0,whistleAt:-10,whistles:0};}
export function readField(v,s){
 const f=newField();if(!v||typeof v!=='object')return f;
 const bounded=(n,max=1000000)=>Number.isFinite(n)?Math.max(0,Math.min(max,Math.floor(n))):0;
 const list=(a,keys)=>Array.isArray(a)?[...new Set(a)].filter(k=>keys.includes(k)):[];
 f.specimens=list(v.specimens,Object.keys(SPECIMENS));f.vistas=list(v.vistas,Object.keys(VISTAS));f.signs=list(v.signs,Object.keys(SIGNS));f.benches=list(v.benches,f.vistas);f.builds=list(v.builds,Object.keys(FIELD_BUILDS));f.stories=list(v.stories,Object.keys(CAMP_STORIES));f.radio=bounded(v.radio,4);f.casts=bounded(v.casts);f.whistles=bounded(v.whistles);f.whistleAt=Number.isFinite(v.whistleAt)?Math.max(-10,Math.min(s.activeSeconds,v.whistleAt)):-10;
 for(const id of Object.keys(FISH)){const n=bounded(v.fish?.[id]);if(n)f.fish[id]=n;}
 for(const id of Object.keys(f.mastery))f.mastery[id]=Math.min(bounded(v.mastery?.[id],3),MASTERY_STEPS.filter(n=>(s.gathered[id]||0)>=n).length);
 for(const id of Object.keys(VISTAS)){const t=v.breathers?.[id];if(Number.isFinite(t)&&t>=0&&t<=s.activeSeconds+90)f.breathers[id]=t;}
 f.fishReady=Number.isFinite(v.fishReady)?Math.max(0,Math.min(s.activeSeconds+60,v.fishReady)):0;
 const cast=v.fishing;if(cast&&owns(FISH,cast.id)&&f.builds.includes('rod')&&Number.isInteger(cast.step)&&cast.step>=0&&cast.step<3)f.fishing={id:cast.id,step:cast.step};
 for(const id of Object.keys(JOBS)){
  f.jobCount[id]=bounded(v.jobCount?.[id]);const j=v.jobs?.[id];
  if(j&&s.flags[id]&&Number.isFinite(j.ends)&&j.ends>=0&&j.ends<=s.activeSeconds+JOBS[id].seconds)f.jobs[id]={ends:j.ends};
 }return f;
}
export function observeSpecimen(s,id){if(!owns(SPECIMENS,id)||!fieldSeen(s,SPECIMENS[id])||!near(s,SPECIMENS[id]))return fail('Walk close to the find to sketch it.');if(s.field.specimens.includes(id))return fail('This sketch is already in your notebook.');s.field.specimens.push(id);give(s,{parts:1});return ok('Sketch saved: '+SPECIMENS[id].name+'. Found 1 spare part along the trail.',{sound:'reward'});}
export function visitVista(s,id){if(!owns(VISTAS,id)||!fieldSeen(s,VISTAS[id])||!near(s,VISTAS[id]))return fail('Walk to this viewpoint first.');if(s.field.vistas.includes(id))return fail('This view is already in your notebook.');s.field.vistas.push(id);give(s,{food:2});return ok('Viewpoint recorded. A tucked-away trail box holds 2 food.',{sound:'reward'});}
export function buildField(s,id){
 if(!owns(FIELD_BUILDS,id))return fail('Choose a known improvement.');if(!atCamp(s))return fail('Return to camp to prepare this improvement.');if(s.field.builds.includes(id))return fail('Already made.');
 if(id==='rod'&&!s.buildings.workshop)return fail('Build the workshop first.');if(id==='cabinet'&&s.field.specimens.length<3)return fail('Sketch three finds to design a display.');if(id==='bridgeLights'&&!s.flags.bridge)return fail('Repair the bridge first.');
 const d=FIELD_BUILDS[id];if(!afford(s,d.cost))return fail('Gather the listed supplies first.');pay(s,d.cost);s.field.builds.push(id);return ok(d.name+' completed.',{sound:'reward'});
}
export function startFishing(s){if(!fieldSeen(s,POND)||!near(s,POND,2.5))return fail('Walk to the Stillwater fishing nook.');if(!s.field.builds.includes('rod'))return fail('Make a fishing rod at camp first.');if(s.activeSeconds<s.field.fishReady)return fail('Let the pool settle for '+Math.ceil(s.field.fishReady-s.activeSeconds)+' seconds of play.');if(s.field.fishing)return fail('Finish or release your current cast.');s.field.fishing={id:Object.keys(FISH)[s.field.casts%4],step:0};return ok('Watch the float. There is no time limit.');}
export function fishingCue(s){const c=s.field.fishing;return c?FISH_CUES[FISH[c.id].pattern[c.step]]:'';}
export function fishingMove(s,move){
 const c=s.field.fishing;if(!c||!near(s,POND,2.5)||!Number.isInteger(move)||move<0||move>2)return fail('Cast from the fishing nook first.');
 if(FISH[c.id].pattern[c.step]!==move){s.field.fishing=null;return fail('The fish slips free. No supplies lost; try another cast.');}
 if(++c.step<3)return ok('The line responds. Watch the next movement.');
 s.field.fish[c.id]=Math.min(1000000,(s.field.fish[c.id]||0)+1);s.field.casts=Math.min(1000000,s.field.casts+1);s.field.fishReady=s.activeSeconds+60;give(s,{food:3});s.field.fishing=null;return ok(FISH[c.id].name+' recorded. +3 food for camp.',{sound:'reward'});
}
export function masteryInfo(s,id){if(!owns(s.field.mastery,id))return null;const level=s.field.mastery[id],amount=s.gathered[id]||0,target=MASTERY_STEPS[level];return{level,amount,target,ready:level<3&&amount>=target,reward:{parts:2+level,food:2}};}
export function claimMastery(s,id){const m=masteryInfo(s,id);if(!m?.ready)return fail('Keep gathering to earn this mastery reward.');s.field.mastery[id]++;give(s,m.reward);return ok('Mastery '+s.field.mastery[id]+' earned. Supplies added once.',{sound:'reward'});}
export function startJob(s,id){if(!owns(JOBS,id)||!s.flags[id])return fail('Rescue this friend first.');if(!atCamp(s))return fail('Assign camp work while at home.');if(s.field.jobs[id])return fail('This friend already has a job.');if(s.companion===id)return fail('Let your companion stay at camp before assigning a job.');const j=JOBS[id];if(!s.buildings[j.station])return fail('Restore the '+({infirmary:'infirmary',workshop:'workshop',engine:'locomotive'}[j.station])+' first.');if(!afford(s,j.cost))return fail('Gather the listed supplies first.');pay(s,j.cost);s.field.jobs[id]={ends:s.activeSeconds+j.seconds};return ok('Job started. It progresses only while you play.');}
export function claimJob(s,id){const j=s.field.jobs[id];if(!j||!owns(JOBS,id)||j.ends>s.activeSeconds)return fail('This job is still in progress.');if(!atCamp(s))return fail('Collect finished work at camp.');delete s.field.jobs[id];s.field.jobCount[id]=Math.min(1000000,s.field.jobCount[id]+1);give(s,JOBS[id].reward);return ok('Finished work collected.',{sound:'reward'});}
export function cancelJob(s,id){if(!owns(JOBS,id)||!s.field.jobs[id])return fail('No job to cancel.');if(!atCamp(s))return fail('Return to camp to cancel work.');delete s.field.jobs[id];give(s,JOBS[id].cost);return ok('Job cancelled. All supplied ingredients returned.');}
export function readCampStory(s,id){const d=owns(CAMP_STORIES,id)?CAMP_STORIES[id]:null;if(!d||!s.flags[d.crew]||!s.buildings.furnace)return fail('Restore the hearth and rescue this friend first.');if(!atCamp(s))return fail('Gather at camp for a story.');if(!s.field.stories.includes(id))s.field.stories.push(id);return ok(d.text);}
export function tuneRadio(s){if(!s.flags.relay)return fail('Repair the valley radio relay first.');if(!atCamp(s))return fail('Listen at the train radio.');if(s.field.radio>=RADIO_NOTES.length)return fail('Every recording is saved in your notebook.');const note=RADIO_NOTES[s.field.radio++];return ok(note.text,{sound:'note-1'});}
export function exchangeSupplies(s,id){const e=owns(EXCHANGES,id)?EXCHANGES[id]:null;if(!e||!atCamp(s)||!s.buildings.workshop)return fail('Use the restored workshop at camp.');if(!afford(s,e.cost))return fail('Not enough spare supplies.');pay(s,e.cost);give(s,e.reward);return ok('Supplies exchanged.');}
export function repairSign(s,id){if(!owns(SIGNS,id)||!fieldSeen(s,SIGNS[id])||!near(s,SIGNS[id]))return fail('Walk close to the sign first.');if(s.field.signs.includes(id))return fail('This sign is already repaired.');if(!afford(s,{wood:3,scrap:1}))return fail('Need 3 timber and 1 salvage.');pay(s,{wood:3,scrap:1});s.field.signs.push(id);return ok('The trail has a name again.',{sound:'reward'});}
export function buildBench(s,id){if(!owns(VISTAS,id)||!s.field.vistas.includes(id)||!near(s,VISTAS[id]))return fail('Visit this viewpoint to build its bench.');if(s.field.benches.includes(id))return fail('The bench is already built.');if(!afford(s,{planks:3,scrap:2}))return fail('Need 3 planks and 2 salvage.');pay(s,{planks:3,scrap:2});s.field.benches.push(id);return ok('A place to pause, right here in the valley.',{sound:'reward'});}
export function takeBreather(s,id){if(!owns(VISTAS,id)||!s.field.benches.includes(id)||!near(s,VISTAS[id]))return fail('Walk to your bench first.');if((s.field.breathers[id]||0)>s.activeSeconds)return fail('This bench will be ready after a little more exploring.');s.energy=Math.min(100,s.energy+25);s.warmth=Math.min(100,s.warmth+25);s.field.breathers[id]=s.activeSeconds+90;return ok('A quiet moment. +25 energy and warmth.');}
export function blowWhistle(s){if(!atCamp(s))return fail('Return to the train to sound its whistle.');if(s.activeSeconds-s.field.whistleAt<5)return fail('Let the whistle settle for a moment.');s.field.whistleAt=s.activeSeconds;s.field.whistles=Math.min(1000000,s.field.whistles+1);return ok('One warm note. The crew looks up: home is here.',{sound:'whistle'});}
export function ambienceLevels(s){return{river:Math.max(0,1-Math.abs(s.player.z+11)/7),birds:weather(s).storm?0:Math.max(0,1-Math.hypot(s.player.x-5,s.player.z-6)/18)};}
