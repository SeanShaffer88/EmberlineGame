import {weather} from './journey.js';
// Original, bundled Frosthollow stories and active-play routines. No wall clock.
export const PROJECTS={
 garden:{name:'Winter garden',crew:'mira',building:'greenhouse',x:-1,z:4,description:'Turn a forgotten seed bed into a sheltered patch of green.',stages:[
  {name:'Clear the seed bed',cost:{wood:6,scrap:3}},
  {name:'Build the cold frame',cost:{planks:4,parts:2}},
  {name:'Plant the first shoots',cost:{food:4,coal:3}}
 ],clue:'Mira found a drawing of a small tin. Look beside the pale stone just south of the garden.',discovery:'seedtin'},
 platform:{name:'Gathering porch',crew:'oren',building:'workshop',x:-6,z:-1,description:'Repair the old platform into a warm place to sit and tell stories.',stages:[
  {name:'Brace the platform',cost:{wood:8,scrap:4}},
  {name:'Fit the seats',cost:{planks:6,parts:2}},
  {name:'Hang the lantern',cost:{parts:3,coal:4}}
 ],clue:'A loose seat held a child’s sketch: a toy engine tucked beside the western fence, two paces from the porch.',discovery:'toytrain'},
 signal:{name:'Valley signal post',crew:'ivo',building:'engine',x:6,z:-1,description:'Restore a hand-cranked signal and a board for the valley’s familiar trails.',stages:[
  {name:'Straighten the post',cost:{wood:6,scrap:5}},
  {name:'Repair the mechanism',cost:{parts:5,planks:3}},
  {name:'Raise the pennant',cost:{food:3,coal:4}}
 ],clue:'Ivo noticed three scratches pointing east. A weatherproof message tube may still lie under the snow beside the post.',discovery:'timecapsule'}
};
export const DISCOVERIES={
 seedtin:{project:'garden',name:'The blue seed tin',x:0,z:6,reward:{food:12,medkit:2},text:'Inside the tin, seeds are folded into scraps of timetable. “For spring, even if it takes a while.” Mira sets the empty blue tin beside the new shoots. Someone once believed this patch of ground would be green again.',decoration:'A blue keepsake tin now sits in the garden.'},
 toytrain:{project:'platform',name:'A pocket-sized engine',x:-8,z:0,reward:{planks:10,parts:6},text:'The wooden engine has four mismatched wheels and a thumb-worn roof. Under it, a pencil note reads: “This one can stay.” Oren repairs its little axle and leaves it on the porch, where any small visitor will find it.',decoration:'Oren’s restored toy engine now rests on the porch.'},
 timecapsule:{project:'signal',name:'The ordinary-day letter',x:8,z:-1,reward:{coal:12,scrap:10},text:'The letter records an unremarkable morning: a late train, warm bread, an argument about the weather. At the bottom: “If you find this, tell us about your ordinary day.” Ivo pins a fresh page beside the old one. There is plenty to write.',decoration:'The letter and a new reply now hang on the signal board.'}
};
export const CONVERSATIONS=[
 {id:'mira-home',crew:'mira',title:'A place to exhale',line:'I used to count how many blankets I could carry. Now I count how many people fit around the stove.',choices:[['What makes a place home?','Someone noticing you have not eaten. A dry pair of socks put aside without being asked. We can manage both.'],['What do you need?','Keep a little food in reserve, and let yourself rest. You are part of this crew too.']]},
 {id:'oren-home',crew:'oren',title:'The sound of a door',line:'That coach door squeaks in B-flat. I could fix it, but then how would I know who was sneaking out before breakfast?',choices:[['Perhaps it needs a bell.','A bell! Finally, someone who understands that not every repair needs to make a thing quieter.'],['What would you build for yourself?','A seat that does not fold into a pack. Something too comfortable to carry away. The old platform has possibilities.']]},
 {id:'ivo-home',crew:'ivo',title:'A map with a centre',line:'I used to draw maps from one edge to the other. This one starts with a small circle around our train.',choices:[['What is beyond the circle?','Our pump, our creek, that crooked pine. Knowing a place well is a different sort of exploring. I like it.'],['Seen anything unusual?','Small cairns. Hare tracks that vanish at stones. Someone left stories in this valley before we arrived. Walk slowly sometimes.']]},
 {id:'mira-project',crew:'mira',project:'garden',title:'Something worth waiting for',line:'A garden is a promise with dirt under its nails. The old seed bed had a scrap of blue paint in it.',choices:[['Will anything grow here?','The cold frame catches the sun, and the hearth keeps us patient. First we make shelter. Then we give the green things a chance.'],['Tell me about the blue paint.','It matches a tin in an old drawing. When the garden is finished, look south, beside the pale stone. It might have survived.']]},
 {id:'oren-project',crew:'oren',project:'platform',title:'The seat by the lantern',line:'Whoever built this platform measured twice. Whoever last repaired it did neither.',choices:[['Can we save the old wood?','Most of it. A scar is not the same as a weakness. I will leave the old nail holes where you can see them.'],['Find anything under the seats?','A child’s sketch of a tiny engine. Finish the porch and we can follow its arrow toward the western fence.']]},
 {id:'ivo-project',crew:'ivo',project:'signal',title:'A flag for coming home',line:'The signal is not a departure sign. From the far side of the creek, this pennant will say: the kettle is on.',choices:[['What colour should it be?','Warm gold. Something the snow cannot swallow. You will see it through the trees.'],['Why the scratches on the post?','Three little marks toward the east. Let us finish the mechanism; then we can look for what the old keeper tucked away.']]},
 {id:'mira-found',crew:'mira',discovery:'seedtin',title:'Spring in a small tin',line:'I kept the timetable wrappers. Imagine saving seeds on the back of a plan to leave.',choices:[['We should keep planting.','We will. A little patch, tended well, can change the way a whole valley feels.'],['Who do you think left them?','Someone whose name we may never learn. We can thank them by taking care of what they started.']]},
 {id:'oren-found',crew:'oren',discovery:'toytrain',title:'Four mismatched wheels',line:'The toy rolls straight now. Better than some of the full-sized engines I have known.',choices:[['You look pleased.','It is good to repair something that does not need to save our lives. I had almost forgotten.'],['Leave it where people can play.','Already done. No glass case. A toy ought to collect new scratches.']]},
 {id:'ivo-found',crew:'ivo',discovery:'timecapsule',title:'An ordinary day',line:'I wrote our reply. “The soup was too thick. Oren blamed the spoon. Nobody was missing at supper.”',choices:[['That sounds like a good day.','The best sort. I hope we have so many that I lose count.'],['Leave room for tomorrow.','A whole page. There is no hurry to fill it.']]}
];
export function conversationAvailable(s,c){return !!s.flags[c.crew]&&(!c.project||s.projects[c.project]>0)&&(!c.discovery||s.discoveries.includes(c.discovery));}

// Waypoints remain in the cleared camp lanes. Travel duration follows distance,
// and the loop closes on its first stop so routines never teleport at rollover.
const ROUTINES={
 mira:[{x:-5,z:3,wait:12,job:'Preparing bandages',pose:'tend'}, {x:-3,z:2,via:[[-4,3],[-4,2]],wait:10,job:'Sharing tea by the hearth',pose:'rest'}, {x:-1,z:3,wait:14,job:'Sorting the seed packets',project:'garden',restored:'Tending the winter garden',pose:'tend'}],
 oren:[{x:3,z:2,wait:12,job:'Mending tools',pose:'hammer'}, {x:-6,z:0,via:[[1,2],[1,0],[-6,0]],wait:14,job:'Measuring the old platform',project:'platform',restored:'Checking the porch joinery',pose:'hammer'}, {x:-3,z:2,via:[[-6,2]],wait:10,job:'Warming his hands',pose:'rest'}],
 ivo:[{x:6,z:0,via:[[-2,0],[6,0]],wait:14,job:'Reading the trail markers',project:'signal',restored:'Checking the valley signal',pose:'survey'}, {x:1,z:-1,via:[[6,0],[1,0]],wait:10,job:'Updating the valley map',pose:'survey'}, {x:-2,z:2,via:[[1,2]],wait:12,job:'Trading stories by the hearth',pose:'rest'}]
};
const offsets={mira:0,oren:21,ivo:42};
export function crewRoutine(s,id){
 if(s.field?.jobs[id]){const [x,z,pose]=({mira:[-4,5,'tend'],oren:[4,2,'hammer'],ivo:[-2,-1,'survey']})[id];return{x,z,pose,walking:false,angle:0,job:s.field.jobs[id].ends<=s.activeSeconds?'Finished work is ready to collect':'Working on your camp job'};}
 const stops=ROUTINES[id],segments=[];
 for(let i=0;i<stops.length;i++){
  const a=stops[i],b=stops[(i+1)%stops.length];segments.push({duration:a.wait,stop:a});
  let from=a;for(const [x,z]of [...(b.via||[]),[b.x,b.z]]){const distance=Math.hypot(x-from.x,z-from.z);if(distance)segments.push({duration:distance/.75,from,to:{x,z},stop:b});from={x,z};}
 }
 const total=segments.reduce((n,p)=>n+p.duration,0);let time=(s.activeSeconds+offsets[id])%total;
 for(const seg of segments){if(time>=seg.duration){time-=seg.duration;continue;}const a=seg.stop,walking=!!seg.from,u=time/seg.duration;
  const storm=weather(s).storm;
  return {x:walking?seg.from.x+(seg.to.x-seg.from.x)*u:a.x,z:walking?seg.from.z+(seg.to.z-seg.from.z)*u:a.z,angle:walking?Math.atan2(seg.to.x-seg.from.x,seg.to.z-seg.from.z):a.pose==='rest'?Math.PI:0,walking,pose:walking?'carry':a.pose,job:walking?'Carrying supplies through camp':storm&&a.pose==='rest'?'Waiting out the snow over tea':a.project&&s.projects[a.project]===3?a.restored:a.job};
 }
}
