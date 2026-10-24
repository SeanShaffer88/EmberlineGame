import * as T from './vendor/three.module.js';
import {DECOR_SLOTS,DECOR_COLORS,ANIMALS,PUZZLES,animalSpot,driftReady} from './journey.js';
export function makeJourneyNode(v,n,g){
 if(n.type==='drift'){
  const drift=v.mesh(new T.SphereGeometry(.65,8,5),0xe2edf0);drift.scale.set(1,.45,.8);drift.position.y=.08;drift.name='drift-snow';g.add(drift);
  const cache=new T.Group();cache.name='drift-cache';v.box(cache,0,.2,0,.6,.35,.45,0xa98463);v.box(cache,0,.39,0,.68,.07,.52,0xdadfd4);g.add(cache);return;
 }
 v.box(g,0,.08,0,1.35,.12,.75,0x8ca3aa);
 if(n.puzzle==='tracks'){
  for(let i=0;i<3;i++){v.box(g,(i-1)*.42,.17,0,.32,.08,.5,0xd4d7c4);for(let j=0;j<[2,4,3][i];j++){const mark=v.mesh(new T.CircleGeometry(.035,6),0x607b88);mark.rotation.x=-Math.PI/2;mark.scale.y=i===0?2:1;mark.position.set((i-1)*.42+(j%2)*.08-.04,.215,-.13+Math.floor(j/2)*.18);g.add(mark);}}
 }else if(n.puzzle==='chimes'){
  // The west-facing brass arrow is also described in the written clue.
  v.box(g,0,.16,.42,.6,.035,.055,0xb99053);const arrow=new T.Shape();arrow.moveTo(-.46,-.42);arrow.lineTo(-.2,-.29);arrow.lineTo(-.2,-.55);arrow.closePath();const mark=v.mesh(new T.ShapeGeometry(arrow),0xb99053);mark.rotation.x=-Math.PI/2;mark.position.y=.18;g.add(mark);
  for(const x of [-.65,.65])v.box(g,x,.9,0,.08,1.8,.08,0x8f785c);v.box(g,0,1.8,0,1.5,.1,.12,0xcee0e0);
  for(let i=0;i<3;i++){const cup=new T.Group();cup.name='dial'+i;cup.position.set((i-1)*.4,1.2,0);v.cylinder(cup,0,0,0,.12,.08,.4,0xc09c65);v.box(cup,0,.04,-.15,.055,.07,.2,0x385d68);g.add(cup);}
 }else{
  v.box(g,0,.8,0,.14,1.5,.14,0x6f8a92);v.box(g,0,1.4,0,1.4,.5,.15,0xbd9e6f);
  [1,3,2,3].forEach((count,i)=>{for(let j=0;j<count;j++)v.box(g,-.48+i*.32,1.27+j*.11,.09,.12,.04,.025,0x546d77);});
 }
}
export function syncJourneyNode(s,n,g){
 if(n.type==='drift'){g.getObjectByName('drift-cache').visible=driftReady(s,n.drift);g.getObjectByName('drift-snow').scale.y=driftReady(s,n.drift)?.18:.45;}
 if(n.type==='puzzle'&&n.puzzle==='chimes'){const d=s.journey.puzzleSteps.chimes||[0,0,0];for(let i=0;i<3;i++)g.getObjectByName('dial'+i).rotation.y=-d[i]*Math.PI/2;}
}
export class JourneyArt{
 constructor(v){
  this.v=v;this.slots={};this.animals={};this.lastDecor='';
  for(const [id,p]of Object.entries(DECOR_SLOTS)){const g=new T.Group();g.position.set(p.x,id==='coach'?1:0,p.z);v.scene.add(g);this.slots[id]=g;}
  const fox=new T.Group();v.box(fox,0,.3,0,.35,.35,.65,0xbe8052);v.box(fox,0,.48,.35,.28,.3,.3,0xc38b5f);v.box(fox,0,.43,.53,.18,.12,.17,0xe5dfcc);v.box(fox,0,.47,.63,.08,.07,.05,0x334e5c);for(const side of [-1,1]){v.box(fox,side*.1,.7,.3,.08,.22,.12,0xab7048);for(const z of [-.2,.2])v.box(fox,side*.12,.12,z,.08,.2,.09,0x4b5760);}const tail=v.box(fox,.12,.31,-.53,.22,.2,.5,0xe6d9be);tail.rotation.y=.25;fox.name='fox';v.scene.add(fox);this.animals.fox=fox;
  const bird=new T.Group();v.box(bird,0,.2,0,.18,.22,.3,0x648996);v.box(bird,0,.31,.14,.16,.15,.16,0x94b2b6);v.box(bird,0,.28,.25,.06,.05,.1,0xccaa6f);for(const side of [-1,1])v.box(bird,side*.11,.2,-.02,.08,.13,.25,0x446c7c);v.scene.add(bird);this.animals.bird=bird;
  this.animals.hare=v.art.hare;
  for(const [id,g]of Object.entries(this.animals))g.traverse(o=>o.userData.node={id:'animal-'+id,type:'animal',animal:id,name:ANIMALS[id].name});
  const geo=new T.CircleGeometry(.46,8);geo.rotateX(-Math.PI/2);this.paths=new T.InstancedMesh(geo,new T.MeshBasicMaterial({color:0x9bb4be,transparent:true,opacity:.38,depthWrite:false}),1640);this.paths.count=0;this.paths.frustumCulled=false;this.matrix=new T.Object3D();v.scene.add(this.paths);
 }
 decoration(id){
  const v=this.v,g=new T.Group(),color=DECOR_COLORS[v.state.journey.color],wood=0xa1805d;
  if(id==='bench'||id==='quilt'){v.box(g,0,.3,0,.55,.09,.28,wood);for(const x of [-.2,.2])v.box(g,x,.15,0,.06,.3,.22,0x677e83);v.box(g,0,.53,-.12,.55,.3,.06,id==='quilt'?color:wood);if(id==='quilt')for(let i=0;i<3;i++)v.box(g,-.18+i*.18,.37,0,.12,.035,.25,i%2?0xe3ddbc:color);}
  else if(id==='planter'){v.box(g,0,.2,0,.4,.32,.4,color);for(let i=0;i<3;i++){v.cylinder(g,(i-1)*.12,.48,0,.04,.02,.3,0x719163);const bloom=v.mesh(new T.IcosahedronGeometry(.08),i%2?0xe6b767:0xb97875);bloom.position.set((i-1)*.12,.64,0);g.add(bloom);}}
  else if(id==='hareSign'){v.box(g,0,.21,0,.18,.22,.25,wood);for(const x of [-.045,.045])v.box(g,x,.44,.05,.045,.24,.05,wood);}
  else{v.box(g,0,.45,0,.055,.9,.055,0x6e8182);
   if(id==='lantern'||id==='starLantern'){const lamp=v.mesh(id==='starLantern'?new T.OctahedronGeometry(.2):new T.BoxGeometry(.22,.3,.22),0xf2c476);lamp.position.y=.95;g.add(lamp);v.glow(g,0,.02,0,.55);}
   else if(id==='feeder'){v.box(g,0,.83,0,.42,.18,.35,wood);v.box(g,0,1.08,0,.5,.07,.43,color);for(const x of [-.17,.17])v.box(g,x,.96,0,.04,.3,.04,wood);}
   else if(id==='windchime'){v.box(g,0,.95,0,.5,.05,.05,color);for(let i=0;i<3;i++)v.cylinder(g,(i-1)*.17,.78,0,.025,.025,.25+i*.05,0xc6a16f);}
   else if(id==='pennant'){v.box(g,.18,.8,0,.35,.3,.025,color);}
   else{v.box(g,0,.8,0,.54,.36,.06,wood);v.box(g,0,.8,.04,.45,.28,.015,id==='map'?0xc7d7bd:color);for(let i=0;i<3;i++)v.box(g,(i-1)*.1,.8,.06,.035,.17-i*.03,.015,0x597880);}
  }return g;
 }
 sync(){const v=this.v,s=v.state,j=s.journey,stamp=JSON.stringify([j.decor,j.color]);if(stamp!==this.lastDecor){this.lastDecor=stamp;for(const [id,g]of Object.entries(this.slots)){g.traverse(o=>{if(o.isMesh){o.geometry.dispose();if(![...v.materials.values()].includes(o.material))o.material.dispose();}});g.clear();if(j.decor[id])g.add(this.decoration(j.decor[id]));}}
  let i=0;for(const [key,count]of Object.entries(j.trails)){if(count<2)continue;const [x,z]=key.split(',').map(Number);if((z>=-4&&z<=-3)||z===-11)continue;this.matrix.position.set(x,.014,z);this.matrix.scale.setScalar(.55+count*.065);this.matrix.rotation.y=(x+z)*.2;this.matrix.updateMatrix();this.paths.setMatrixAt(i++,this.matrix.matrix);}this.paths.count=i;this.paths.instanceMatrix.needsUpdate=true;
 }
 update(){const v=this.v,s=v.state,t=s.activeSeconds;for(const [id,g]of Object.entries(this.animals)){
   const p=animalSpot(s,id);g.visible=s.discovered.includes(`${Math.round(p.x)},${Math.round(p.z)}`);
   if(id==='hare')continue;
   if(id==='fox'){const phase=t%32,walk=phase<16,u=walk?phase/16:1;g.position.set(p.x+Math.sin(u*Math.PI*2)*.65,walk?Math.abs(Math.sin(t*10))*.025:0,p.z+Math.cos(u*Math.PI*2)*.55);g.rotation.y=walk?Math.PI/2+u*Math.PI*2:Math.sin(t*.5)*.15;}
   else{const feeder=Object.values(s.journey.decor).includes('feeder');g.position.set(p.x,feeder?1.15:.25,p.z);g.rotation.y=Math.sin(t*.7)*.4;g.position.y+=Math.max(0,Math.sin(t*2))* .035;}
  }
 }
}
