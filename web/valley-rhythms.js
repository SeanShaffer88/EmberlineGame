import * as T from './vendor/three.module.js';
import {WORLD,daylight,stock} from './model.js';
import {squirrelRoute,owlRoute} from './harvest-feel.js';
import {blend} from './actor-motion.js';
import {windAt,turnToward} from './life-motion.js';

// A bounded cosmetic ecosystem. New inhabitants never block paths, consume
// supplies, reveal fog, move the camp, or grant rewards.
export class ValleyRhythms{
 constructor(v){
  this.v=v;this.root=new T.Group();this.root.name='valley-rhythms';v.scene.add(this.root);this.matrix=new T.Object3D();
  this.alert=0;this.squirrelClock=0;this.squirrelHeading=0;this.ventBeat=-1;this.time=0;
  this.makeSquirrel();this.makeOwl();this.makeWater();this.makeCamp();this.makeWolves();
 }
 group(name,x=0,y=0,z=0){const g=new T.Group();g.name=name;g.position.set(x,y,z);this.root.add(g);return g;}
 makeSquirrel(){
  const v=this.v,g=this.squirrel=this.group('red-squirrel');
  this.squirrelBody=v.box(g,0,.18,0,.21,.24,.4,0xa77950);this.squirrelHead=new T.Group();this.squirrelHead.position.set(0,.3,.22);g.add(this.squirrelHead);
  v.box(this.squirrelHead,0,0,0,.2,.21,.2,0xb98d61);v.box(this.squirrelHead,0,-.05,.12,.1,.08,.13,0xdbc1a0);
  for(const side of [-1,1]){v.box(this.squirrelHead,side*.07,.15,-.02,.05,.12,.06,0x8d654a);v.box(this.squirrelHead,side*.105,.02,.06,.02,.025,.03,0x344e5c);}
  this.squirrelTail=new T.Group();this.squirrelTail.position.set(0,.16,-.2);g.add(this.squirrelTail);const tail=v.mesh(new T.IcosahedronGeometry(.22,1),0xb88458);tail.position.set(0,.21,-.13);tail.scale.set(.7,1.9,.8);this.squirrelTail.add(tail);
  this.squirrelFeet=[];for(const side of [-1,1])for(const rear of [-1,1]){const foot=v.box(g,side*.1,.08,rear*.13,.075,.12,.13,0x71513f);this.squirrelFeet.push(foot);}
  this.acorn=v.mesh(new T.IcosahedronGeometry(.055),0xdbc08b);this.acorn.position.set(0,.2,.26);g.add(this.acorn);
 }
 makeOwl(){
  const v=this.v,g=this.owl=this.group('snow-owl');v.box(g,0,0,0,.34,.42,.28,0xddd7bf);this.owlHead=new T.Group();this.owlHead.position.y=.25;g.add(this.owlHead);
  v.box(this.owlHead,0,0,0,.39,.3,.29,0xe7e7d4);this.owlEyes=[];
  for(const side of [-1,1]){v.box(this.owlHead,side*.1,0,.15,.14,.14,.025,0x927e5b);this.owlEyes.push(v.box(this.owlHead,side*.1,0,.17,.035,.055,.02,0x304752));v.box(this.owlHead,side*.13,.17,0,.07,.12,.08,0xcac5ac);}
  v.box(this.owlHead,0,-.075,.17,.045,.07,.08,0xc49b4e);this.owlWings=[];for(const side of [-1,1]){const wing=new T.Group();wing.position.x=side*.16;g.add(wing);v.box(wing,side*.18,0,0,.38,.08,.27,0xd0d4c3);this.owlWings.push({wing,side});}
  const perch=this.group('owl-perch',-5.1,2.02,6.1);v.box(perch,0,0,0,.9,.09,.12,0x93755d);v.box(perch,-.35,-1,0,.1,2,.1,0x93755d);this.perch=perch;
 }
 makeWater(){
  const v=this.v;this.fish=[];this.fishRings=[];
  for(let i=0;i<3;i++){
   const g=this.group('pond-fish-'+i);const body=v.mesh(new T.SphereGeometry(.1,7,4),0x365f67);body.scale.set(.6,.2,1.8);g.add(body);
   const tail=v.mesh(new T.ConeGeometry(.09,.14,3),0x365f67);tail.rotation.x=Math.PI/2;tail.position.z=-.2;g.add(tail);this.fish.push({g,tail});
   const ring=new T.Mesh(new T.RingGeometry(.08,.092,20),new T.MeshBasicMaterial({color:0xd4eee6,transparent:true,opacity:0,depthWrite:false}));ring.rotation.x=-Math.PI/2;this.root.add(ring);this.fishRings.push(ring);
  }
  this.pump=this.group('pump-water',-9,0,7);v.cylinder(this.pump,.38,.12,.38,.24,.28,.15,0x7d969d);v.cylinder(this.pump,.38,.2,.38,.21,.21,.015,0x70a7b5);
  this.drops=[];for(let i=0;i<4;i++)this.drops.push(v.box(this.pump,.38,.7,.38,.025,.06,.025,0xa9dce5));
  this.pumpRipple=new T.Mesh(new T.RingGeometry(.04,.05,20),new T.MeshBasicMaterial({color:0xe2f7ed,transparent:true,opacity:.6,depthWrite:false}));this.pumpRipple.rotation.x=-Math.PI/2;this.pumpRipple.position.set(.38,.212,.38);this.pump.add(this.pumpRipple);
 }
 makeCamp(){
  const v=this.v;this.gauge=this.group('engine-pressure-gauge',1,1.25,-2.18);const face=v.cylinder(this.gauge,0,0,0,.13,.13,.05,0xe1d4b1,16);face.rotation.x=Math.PI/2;
  this.needle=new T.Group();this.gauge.add(this.needle);v.box(this.needle,0,.046,.035,.015,.095,.012,0xb16b4d);v.box(this.gauge,0,0,.045,.025,.025,.02,0x526876);
  const valve=this.group('engine-side-valve',.9,.65,-2.2);v.cylinder(valve,0,0,0,.07,.07,.3,0x8fa6a7);v.box(valve,0,.17,0,.24,.04,.07,0xb08057);
  this.chime=this.group('porch-wind-chime',-5.5,1.65,.1);v.box(this.chime,0,.3,0,.55,.055,.15,0xa48258);this.chimeTubes=[];
  for(let i=0;i<3;i++){const tube=new T.Group();tube.position.set((i-1)*.17,.28,0);this.chime.add(tube);v.box(tube,0,-.07,0,.012,.14,.012,0x698b8d);v.cylinder(tube,0,-.24-i*.025,0,.028,.028,.25+i*.05,0xb3bdb0);this.chimeTubes.push(tube);}
  this.fireflies=new T.InstancedMesh(new T.SphereGeometry(.024,5,3),new T.MeshBasicMaterial({color:0xe0cd77}),12);this.fireflies.frustumCulled=false;this.root.add(this.fireflies);
  this.leaves=new T.InstancedMesh(new T.PlaneGeometry(.12,.06),new T.MeshStandardMaterial({color:0xb99c67,side:T.DoubleSide,roughness:1}),8);this.leaves.frustumCulled=false;this.root.add(this.leaves);
  this.moths=new T.InstancedMesh(new T.PlaneGeometry(.065,.04),new T.MeshBasicMaterial({color:0xd9dbc6,side:T.DoubleSide}),12);this.moths.frustumCulled=false;this.root.add(this.moths);
 }
 makeWolves(){
  this.wolves=[];for(const n of WORLD.filter(n=>n.type==='wolf')){
   const p=this.v.objects.get(n.id),body=p.children[0],head=new T.Group();head.position.set(0,.58,.4);head.name='wolf-look';p.add(head);
   for(const part of [...p.children])if(part.isMesh&&(part.position.y>.5||part.position.z>.4)){part.position.sub(head.position);head.add(part);}this.wolves.push({n,p,head,body});
  }
 }
 update(dt){
  const v=this.v,s=v.state,reduced=s.settings.reducedMotion,t=reduced?0:v.clock,night=daylight(s).night,wind=windAt(t,v.weatherBlend),m=this.matrix,known=(x,z)=>v.details.knownAt(x,z);
  this.time=t;
  if(dt>0){this.alert=reduced?0:blend(this.alert,Math.hypot(s.player.x+2.6,s.player.z-6.7)<1.5?1:0,dt,4);this.squirrelClock+=reduced?0:dt*(1-this.alert);}
  const route=squirrelRoute(reduced?7:this.squirrelClock,this.alert),q=this.squirrel;
  q.position.set(route.x,.025+Math.abs(Math.sin(t*14))*.035*route.walk,route.z);if(dt>0)this.squirrelHeading=reduced?route.angle:turnToward(this.squirrelHeading,route.angle,dt*.5);q.rotation.y=this.squirrelHeading;this.squirrelHead.rotation.x=route.forage&&!this.alert?Math.sin(t*7)*.16:.02;this.squirrelTail.rotation.x=-.2+Math.sin(t*5)*.13+this.alert*.6;
  this.squirrelFeet.forEach((f,i)=>{f.rotation.x=Math.sin(t*14+i*Math.PI)*.45*route.walk;f.position.y=.08+(i<2?route.forage*.06:0);});this.acorn.visible=!!route.forage&&this.alert<.3;q.visible=known(q.position.x,q.position.z);this.squirrelMode=this.alert>.5?'startled':route.forage?'foraging':'scurrying';
  const o=owlRoute(t,night),owl=this.owl;owl.position.set(o.x,o.y,o.z);owl.rotation.y=o.flight?Math.PI/2:Math.sin(t*.18)*.2;
  this.owlHead.rotation.y=Math.sin(t*.45)*.75;this.owlHead.rotation.z=Math.sin(t*.23)*.12;this.owlEyes.forEach(eye=>eye.scale.y=reduced?1:night<.35?.3:Math.sin(t*.71)>.97?.1:1);
  this.owlWings.forEach(({wing,side})=>wing.rotation.z=side*(o.flight?Math.sin(t*9)*.7:1.25));owl.visible=known(o.x,o.z);this.perch.visible=known(-5.1,6.1);this.owlFlight=o.flight;
  this.fish.forEach(({g,tail},i)=>{
   const a=t*.65+i*2.09,x=-3+Math.sin(a)*.36,z=-10.9+Math.cos(a)*.28,phase=(t+i*2.3)%7;
   g.position.set(x,.132,z);g.rotation.y=Math.atan2(Math.cos(a)*.36,-Math.sin(a)*.28);tail.rotation.y=Math.sin(t*6+i)*.3;g.visible=known(-3,-11);
   const ring=this.fishRings[i],rise=phase/1.3;ring.visible=g.visible&&!reduced&&phase<1.3;ring.position.set(-3+Math.sin((t-phase)*.65+i*2.09)*.36,.141,-10.9+Math.cos((t-phase)*.65+i*2.09)*.28);ring.scale.setScalar(1+Math.min(1,rise)*2);ring.material.opacity=Math.max(0,1-rise)*.45;
  });
  this.pump.visible=!!s.flags.pump&&known(-9,7);this.drops.forEach((drop,i)=>{drop.visible=!reduced;drop.position.y=.78-((t*1.1+i/4)%1)*.56;});this.pumpRipple.visible=!reduced;this.pumpRipple.scale.setScalar(1+(t*4.4%1)*3);this.pumpRipple.material.opacity=(1-t*4.4%1)*.55;
  this.needle.rotation.z=-.6+Math.sin(t*1.3)*.18+Math.min(2,s.buildings.engine)*.25;
  const beat=Math.floor(t/9);if(dt>0&&!reduced&&beat!==this.ventBeat){this.ventBeat=beat;if(known(.9,-2.2))v.details.particles.emit('breath',.9,.78,-2.2,4);}
  this.chime.visible=known(-5.5,.1);this.chimeTubes.forEach((tube,i)=>{tube.rotation.z=reduced?0:Math.sin(t*(2+i*.2)+i)*.15*wind;tube.rotation.x=reduced?0:Math.cos(t*1.7+i)*.08*wind;});
  let flies=0;for(let i=0;i<(v.lowQuality?4:12);i++){const x=5+Math.sin(t*.7+i*2.4)*1.25,z=4+Math.cos(t*.5+i)*.95;if(reduced||night<.55||!s.buildings.greenhouse||!known(x,z))continue;m.position.set(x,.6+(Math.sin(t*.9+i)+1)*.32,z);m.rotation.set(0,0,0);m.scale.setScalar(.5+(Math.sin(t*2+i)+1)*.25);m.updateMatrix();this.fireflies.setMatrixAt(flies++,m.matrix);}this.fireflies.count=flies;this.fireflies.instanceMatrix.needsUpdate=true;
  const garden=WORLD.find(n=>n.id==='project-garden');let leaves=0;for(let i=0;i<(v.lowQuality?3:8);i++){const u=(t*.11+i/8)%1,x=garden.x-1.4+u*2.8,z=garden.z+Math.sin(t*.3+i)*.65;if(reduced||!s.projects.garden||!known(x,z))continue;m.position.set(x,.12+Math.abs(Math.sin(u*Math.PI*3))*.16,z);m.rotation.set(t*2+i,u*4,Math.sin(t+i));m.scale.setScalar(1);m.updateMatrix();this.leaves.setMatrixAt(leaves++,m.matrix);}this.leaves.count=leaves;this.leaves.instanceMatrix.needsUpdate=true;
  let moths=0;for(let i=0;i<(v.lowQuality?2:6);i++)for(const side of [-1,1]){const a=t*(1.7+i*.1)+i*1.4,x=-5.2+Math.sin(a)*.32,z=4.8+Math.cos(a)*.26;if(reduced||night<.4||!s.buildings.infirmary||!known(x,z))continue;m.position.set(x,1.25+Math.cos(t*2+i)*.2,z);m.rotation.set(Math.sin(t*30+i)*.9*side,a,side*.5);m.scale.setScalar(1);m.updateMatrix();this.moths.setMatrixAt(moths++,m.matrix);}this.moths.count=moths;this.moths.instanceMatrix.needsUpdate=true;
  for(const {n,p,head,body}of this.wolves){if(!p.visible||!stock(s,n))continue;body.scale.y=reduced?1:1+Math.sin(t*2.4+n.x)*.025;head.rotation.y=reduced?0:Math.sin(t*.7+n.z)*.35;head.rotation.x=reduced?0:Math.sin(t*.4+n.x)*.06;}
 }
}
