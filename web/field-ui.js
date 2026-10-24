import * as M from './model.js';
const $=id=>document.getElementById(id);
const TABS=[['notebook','Notebook'],['viewpoints','Views'],['fishing','Fishing'],['fieldcamp','Camp life'],['trailworks','Trails'],['mastery','Mastery']];
export const FIELD_PANELS=TABS.map(([id])=>id).concat('soundmix');
export function fieldUI(api){
 const tabs=()=>`<div class="field-tabs">${TABS.map(([id,label])=>`<button class="secondary" data-field-tab="${id}">${label}</button>`).join('')}</div>`;
 const card=(title,text,actions='')=>`<article class="item-card"><h3>${title}</h3><p>${text}</p>${actions}</article>`;
 const button=(attr,label,disabled=false,cls='secondary')=>`<button class="${cls} talk-button" ${attr} ${disabled?'disabled':''}>${label}</button>`;
 const mark=(kind,id)=>button(`data-field-mark="${kind}:${id}"`,'Mark explored location');
 function apply(result,name){api.updated(result,false);open(name);api.toast(result.message,result.ok?3000:4000);}
 function open(name,entry){
  const s=api.state(),f=s.field;let title,body='';
  if(name==='notebook'){
   title='Small wonders of Frosthollow';body=`<img class="notebook-art" src="./assets/notebook.png" alt="An illustrated field notebook beside a warm lantern, overlooking the snowy valley"><p class="intro">${f.specimens.length} / 8 sketches. Inspect finds nearby to keep their stories. Leave the plants rooted and carry their sketches home.</p>`;
   for(const [id,p]of Object.entries(M.SPECIMENS)){const found=f.specimens.includes(id),seen=M.fieldSeen(s,p);body+=card(found?p.name:seen?p.name:'An unfilled page',found?p.text:p.hint,found?'<span class="status-tag">Recorded · reward collected</span>':seen?button(`data-observe="${id}"`,'Sketch this find',Math.hypot(s.player.x-p.x,s.player.z-p.z)>2,'primary')+mark('specimen',id):'<small>Explore to find its place in the valley.</small>');}
   body+=card('A cabinet for small wonders','Sketch three finds, then build a cabinet at camp. It fills with your recorded discoveries.',api.costHTML(M.FIELD_BUILDS.cabinet.cost)+button('data-field-build="cabinet"',f.builds.includes('cabinet')?'Cabinet built':'Build the display cabinet',f.builds.includes('cabinet')));
  }
  if(name==='viewpoints'){
   title='Places worth pausing';body='<p class="intro">Three views, all in your own valley. Discover them on foot, then add a bench if you like.</p>';
   for(const [id,p]of Object.entries(M.VISTAS)){const seen=M.fieldSeen(s,p),found=f.vistas.includes(id),close=Math.hypot(s.player.x-p.x,s.player.z-p.z)<=2;body+=card(seen?p.name:'An undiscovered viewpoint',found?p.text:seen?'A little height, a different view of home.':'Look for a small stone marker on the outer trails.',seen?button(`data-vista="${id}"`,found?'View recorded':'Record this view',found||!close,'primary')+mark('vista',id)+(found?(f.benches.includes(id)?button(`data-breather="${id}"`,(f.breathers[id]||0)>s.activeSeconds?`Bench settling · ${Math.ceil(f.breathers[id]-s.activeSeconds)}s of play`:'Take a breather · +25 energy & warmth',!close||(f.breathers[id]||0)>s.activeSeconds):api.costHTML({planks:3,scrap:2})+button(`data-bench="${id}"`,'Build a rest bench',!close)):''):'');}
  }
  if(name==='fishing'){
   title='A quiet line in the water';const c=f.fishing,near=Math.hypot(s.player.x-M.POND.x,s.player.z-M.POND.z)<=2.5;
   body='<p class="intro">Watch the written float cues and choose a gentle response. There is no time limit, bait cost, or penalty for a missed fish. Each catch supplies 3 food; the pool then settles for 60 seconds of active play.</p>';
   if(!f.builds.includes('rod'))body+=card('Make a fishing rod','Requires the workshop. Prepare it at camp, then walk to the creek.',api.costHTML(M.FIELD_BUILDS.rod.cost)+button('data-field-build="rod"','Make rod',false,'primary'));
   else if(c)body+=card('Watching the float · '+(c.step+1)+' / 3',M.fishingCue(s),`<div class="fishing-float" aria-hidden="true"><i></i><span></span></div><div class="fish-choices">${M.FISH_MOVES.map((label,i)=>button(`data-fish-move="${i}"`,label,!near)).join('')}</div>`+button('id="release-fish"','Release this cast'));
   else body+=card(M.POND.name,near?'You are beside the fishing nook.':'Walk to the creek northwest of home.',button('id="cast-line"',f.fishReady>s.activeSeconds?`Pool settling · ${Math.ceil(f.fishReady-s.activeSeconds)}s`:'Cast the line',!near||f.fishReady>s.activeSeconds,'primary')+(M.fieldSeen(s,M.POND)?mark('pond','pool'):''));
   body+='<h3 class="section-title">The fish journal · '+Object.keys(f.fish).length+' / 4</h3>';
   for(const [id,p]of Object.entries(M.FISH))body+=card(f.fish[id]?p.name:'An empty fish sketch',f.fish[id]?p.text+` Recorded ${f.fish[id]} time${f.fish[id]===1?'':'s'}.`:'Keep fishing to fill this page. Each successful cast brings the next species.');
  }
  if(name==='fieldcamp'){
   title='Good work, good company';body='<p class="intro">Jobs use supplied ingredients and active play time. Menus and time away pause them. Collect finished work yourself; cancel at camp for a full ingredient refund. A working friend stays home.</p>';
   for(const [id,j]of Object.entries(M.JOBS)){const job=f.jobs[id],ready=job&&job.ends<=s.activeSeconds;body+=card(M.CREW[id].name+' · '+j.name,job?(ready?'Finished. Collect at camp.':`${Math.ceil(job.ends-s.activeSeconds)} seconds of play remaining.`):`${j.seconds} seconds of play · Makes ${M.costText(j.reward)}.`,job?button(`data-job-claim="${id}"`,'Collect finished work',!ready,'primary')+button(`data-job-cancel="${id}"`,'Cancel & refund'):api.costHTML(j.cost)+button(`data-job-start="${id}"`,!s.flags[id]?'Rescue '+M.CREW[id].name+' first':'Assign this job',!s.flags[id]));}
   body+='<h3 class="section-title">Around the campfire</h3><p class="intro">No time-of-day gate. Share a story beside the restored hearth, then revisit it here.</p>';
   for(const [id,d]of Object.entries(M.CAMP_STORIES))body+=card(d.title,f.stories.includes(id)?d.text:'A quiet story from '+M.CREW[d.crew].name+'.',button(`data-camp-story="${id}"`,f.stories.includes(id)?'Share again':'Hear the story',!s.flags[id]||!s.buildings.furnace));
   // Keep the archive separate from the action so every heard message remains readable.
   body+='<h3 class="section-title">The train radio</h3><p class="intro">Repair the relay to recover four recorded messages. Keep each voice in the archive and revisit it whenever you need a little company.</p>';
   body+=M.RADIO_NOTES.slice(0,f.radio).map(n=>card(n.title,n.text)).join('')+button('id="tune-radio"',f.radio===4?'All four messages archived':'Listen to the next recording',!s.flags.relay||f.radio===4);
   body+=card('The home whistle','One short note; the crew answers with a glance.',button('id="home-whistle"','Sound the whistle',false,'primary'));
   body+='<h3 class="section-title">The salvage bench</h3><p class="intro">Fixed workshop exchanges for spare supplies. The listed cost is spent only when you exchange.</p>';
   for(const [id,e]of Object.entries(M.EXCHANGES))body+=card(e.name,'Receive '+M.costText(e.reward)+'.',api.costHTML(e.cost)+button(`data-exchange="${id}"`,'Exchange supplies',!s.buildings.workshop));
  }
  if(name==='trailworks'){
   title='A valley that welcomes you back';body='<p class="intro">Repair signs where you find them. Their home arrows give you a waypoint without moving you. Add bridge lamps from camp once the crossing is repaired.</p>';
   for(const [id,p]of Object.entries(M.SIGNS)){const seen=M.fieldSeen(s,p),done=f.signs.includes(id);body+=card(seen?p.name:'A sign along an unexplored trail',done?'A familiar arrow points toward the train.':seen?'The wood is weathered, but the post can stand again.':'Explore the paths near home and either bank of the creek.',seen?(done?button('data-sign-home="true"','Mark home')+mark('sign',id):api.costHTML({wood:3,scrap:1})+button(`data-repair-sign="${id}"`,'Repair this sign',Math.hypot(s.player.x-p.x,s.player.z-p.z)>2,'primary')+mark('sign',id)):'');}
   body+=card('Lanterns over the creek','A warm string of lamps marks the repaired crossing. No fuel upkeep.',api.costHTML(M.FIELD_BUILDS.bridgeLights.cost)+button('data-field-build="bridgeLights"',f.builds.includes('bridgeLights')?'Bridge lanterns installed':'Prepare bridge lanterns',f.builds.includes('bridgeLights')));
  }
  if(name==='mastery'){
   title='Practice leaves its mark';body='<p class="intro">Ordinary gathering counts toward three rewards for each material. Previous gathering counts too. Claim each reward once; tools never wear out.</p>';
   for(const id of Object.keys(f.mastery)){const m=M.masteryInfo(s,id);body+=card(M.ITEMS[id]+' · '+m.level+' / 3',m.level===3?'Every mastery reward earned.':`${m.amount} / ${m.target} gathered · Reward ${M.costText(m.reward)}.`,`<progress class="field-progress" value="${Math.min(m.amount,m.target||m.amount)}" max="${m.target||Math.max(1,m.amount)}"></progress>`+button(`data-mastery="${id}"`,m.level===3?'Mastered':'Claim mastery reward',!m.ready,'primary'));}
  }
  if(name==='soundmix'){
   title='The sounds of home';body='<p class="intro">Set each part of the mix independently. Master sound and the music switch still take priority.</p>';
   for(const [id,label]of [['musicVolume','Music'],['ambienceVolume','Wind, water & birds'],['effectsVolume','Tools, footsteps & interface']])body+=`<label class="mix-row"><b>${label}</b><output id="mix-${id}">${Math.round(s.settings[id]*100)}%</output><input type="range" min="0" max="100" step="5" value="${Math.round(s.settings[id]*100)}" data-mix="${id}" aria-label="${label} volume"></label>`;
   body+=button('id="mix-preview"','Preview a gentle whistle');
  }
  if(!title)return;api.showSheet('THE LITTLE THINGS · ONE PERMANENT VALLEY',title,(name==='soundmix'?'':tabs())+body,name);
  document.querySelectorAll('[data-field-tab]').forEach(b=>b.onclick=()=>open(b.dataset.fieldTab));
  const actions={'observe':M.observeSpecimen,'vista':M.visitVista,'bench':M.buildBench,'breather':M.takeBreather,'field-build':M.buildField,'fish-move':(s,id)=>M.fishingMove(s,+id),'job-start':M.startJob,'job-claim':M.claimJob,'job-cancel':M.cancelJob,'camp-story':M.readCampStory,'exchange':M.exchangeSupplies,'repair-sign':M.repairSign,'mastery':M.claimMastery};
  for(const [key,fn]of Object.entries(actions))document.querySelectorAll(`[data-${key}]`).forEach(b=>b.onclick=()=>apply(fn(s,b.getAttribute('data-'+key)),name));
  for(const [id,fn]of [['cast-line',M.startFishing],['tune-radio',M.tuneRadio],['home-whistle',M.blowWhistle]])if($(id))$(id).onclick=()=>apply(fn(s),name);
  if($('release-fish'))$('release-fish').onclick=()=>{s.field.fishing=null;apply({ok:true,message:'Line released. No supplies spent.'},name);};
  document.querySelectorAll('[data-sign-home]').forEach(b=>b.onclick=()=>{api.updated(M.setWaypoint(s,0,-3),false);api.openPanel('map');});
  document.querySelectorAll('[data-field-mark]').forEach(b=>b.onclick=()=>{const [kind,id]=b.dataset.fieldMark.split(':'),p=kind==='pond'?M.POND:{specimen:M.SPECIMENS,vista:M.VISTAS,sign:M.SIGNS}[kind][id];const r=M.setWaypoint(s,p.x,p.z);api.updated(r,false);if(r.ok)api.openPanel('map');});
  document.querySelectorAll('[data-mix]').forEach(input=>{input.oninput=()=>{$('mix-'+input.dataset.mix).textContent=input.value+'%';s.settings[input.dataset.mix]=+input.value/100;api.mix();};input.onchange=api.save;});
  if($('mix-preview'))$('mix-preview').onclick=()=>api.previewSound();
  if(entry){const action={notebook:'observe',viewpoints:'vista',trailworks:'repair-sign'}[name];const target=action&&document.querySelector(`[data-${action}="${entry}"]`);target?.closest('article')?.scrollIntoView({block:'start'});}
 }
 return{open};
}
