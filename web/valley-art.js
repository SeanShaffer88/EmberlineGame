import * as T from './vendor/three.module.js';
import {PROJECTS,DISCOVERIES} from './valley.js';

// Small original meshes, sharing the existing winter palette and renderer.
export function makeRestoration(v,n,g){
 const stages=[new T.Group(),new T.Group(),new T.Group()],keepsake=new T.Group();
 g.userData.stages=stages;g.userData.keepsake=keepsake;g.add(...stages,keepsake);
 v.box(g,0,.04,0,1.7,.08,1.4,0xb0c5c7);
 if(n.project==='garden'){
  for(const x of [-.73,.73])v.box(g,x,.22,0,.12,.35,1.3,0x947359);
  v.box(stages[0],0,.17,0,1.4,.18,1.15,0x655c51);
  for(const z of [-.61,.61])v.box(stages[1],0,.42,z,1.55,.12,.1,0xb39168);
  for(const x of [-.73,0,.73])v.box(stages[1],x,.39,0,.06,.08,1.2,0xe3ede9);
  const glass=v.box(stages[1],0,.43,0,1.4,.03,1.1,0xa2d1ce);glass.material=new T.MeshStandardMaterial({color:0xa2d1ce,transparent:true,opacity:.3,roughness:.45,depthWrite:false});
  for(let i=0;i<6;i++){v.cylinder(stages[2],-.5+i%3*.5,.4,-.3+Math.floor(i/3)*.6,.07,.035,.35,0x719063);const leaf=v.box(stages[2],-.5+i%3*.5,.55,-.3+Math.floor(i/3)*.6,.22,.055,.14,0x8daa68);leaf.rotation.z=i%2?.3:-.3;}
  v.box(keepsake,.98,.24,.2,.3,.35,.3,0x52869a);v.box(keepsake,.98,.43,.2,.34,.04,.34,0xbed2d4);
 }else if(n.project==='platform'){
  for(const x of [-.65,0,.65])v.box(g,x,.16,0,.09,.25,1.4,0x7d6858);
  for(let i=0;i<6;i++)v.box(stages[0],-.68+i*.27,.29,0,.24,.13,1.4,0xa5815e);
  v.box(stages[1],0,.65,-.25,1.4,.12,.5,0x9f7854);v.box(stages[1],0,1.02,-.49,1.4,.48,.1,0xb69166);
  for(const x of [-.58,.58])v.box(stages[1],x,.47,-.25,.1,.4,.42,0x6f6256);
  for(const x of [-.78,.78])v.box(stages[2],x,1.1,-.6,.1,1.8,.1,0x6b5d51);
  v.box(stages[2],0,1.98,-.6,1.8,.12,.16,0xe4eff0);v.box(stages[2],.62,1.66,-.57,.21,.3,.21,0xffc679);v.glow(stages[2],0,.36,0,1.1);
  v.box(keepsake,.28,.8,-.16,.43,.17,.19,0xb5574b);v.box(keepsake,.14,.94,-.16,.17,.17,.2,0x5d8490);for(const x of [.14,.42])v.cylinder(keepsake,x,.72,-.04,.065,.065,.06,0x3f5865).rotation.x=Math.PI/2;
 }else{
  v.box(g,0,.2,0,.7,.28,.7,0x8f9da0);
  v.box(stages[0],0,1.25,0,.16,2.4,.16,0x657e87);
  v.box(stages[1],0,1.15,.12,1.1,.78,.1,0x997651);v.box(stages[1],0,1.58,.12,1.2,.08,.24,0xe4eff0);
  v.box(stages[1],.28,1.15,.19,.35,.48,.02,0xc1d0bd);v.cylinder(stages[1],-.38,.72,.21,.15,.15,.09,0xb39762).rotation.x=Math.PI/2;
  v.box(stages[2],.36,2.42,0,.85,.07,.07,0x6e7f82);const flag=v.box(stages[2],.43,2.14,0,.7,.5,.035,0xe3b568);flag.name='valley-pennant';v.glow(stages[2],0,.08,0,.65);
  for(const x of [-.22,.15])v.box(keepsake,x,1.18,.2,.28,.38,.025,0xeee1bf);
 }
}
export function makeDiscovery(v,n,g){
 const rock=v.mesh(new T.DodecahedronGeometry(.3),0xc9d9d9);rock.scale.set(1,.55,.8);rock.position.y=.12;g.add(rock);
 const glint=v.mesh(new T.OctahedronGeometry(.075),0xf0be72);glint.name='discovery-glint';glint.position.set(.16,.3,0);g.add(glint);
 v.box(g,.12,.08,.15,.22,.12,.16,0x648e9a);
}
export function syncRestoration(s,n,g){
 if(n.type==='project'){
  g.userData.stages.forEach((stage,i)=>stage.visible=s.projects[n.project]>i);
  g.userData.keepsake.visible=s.discoveries.includes(PROJECTS[n.project].discovery);
 }else if(n.type==='discovery'){
  g.visible=s.projects[DISCOVERIES[n.discovery].project]===3&&s.discoverySeen.includes(n.discovery);
  g.getObjectByName('discovery-glint').visible=!s.discoveries.includes(n.discovery);
 }
}
