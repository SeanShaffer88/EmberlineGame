import {CharacterDetail} from './character-detail.js';
import * as T from './vendor/three.module.js';
import {daylight} from './model.js';
import {animalSpot} from './journey.js';
import {turnToward,snowSurface} from './life-motion.js';
import {ease,blend,blinkAt,advanceGait,stridePose,gatherPose,foxCycle,hareCycle,sipAt,brushAt} from './actor-motion.js';

// One final pose layer owns the new joints. Gameplay positions, routes, action
// beats and rewards still belong to the existing systems. Each pose is absolute,
// so a cancelled action, hidden actor or repeated frozen frame cannot accumulate.
function pivot(parent,children,name,x,y,z){
 const g=new T.Group();g.name=name;g.position.set(x,y,z);parent.add(g);
 for(const child of children){if(!child)continue;child.position.sub(g.position);g.add(child);}return g;
}
function tag(root,node){if(node)root.traverse(o=>o.userData.node=node);}
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);

class PersonRig{
 constructor(v,p,id,seed){
  this.v=v;this.root=p;this.id=id;this.seed=seed;this.last=p.position.clone();this.phase=0;this.weight=0;this.look=0;this.facing=p.rotation.y;this.brush=0;this.simulationTime=v.state.activeSeconds;
  this.head=pivot(p,['hat','face','hat-band','eye-1','eye1'].map(n=>p.getObjectByName(n)),'head',0,.99,0);
  const scarf=v.details.scarves[v.details.people.indexOf(p)];
  this.torso=pivot(p,['coat','collar','pack','arm-1','arm1'].map(n=>p.getObjectByName(n)).concat(this.head,scarf),'torso',0,.45,0);
  this.pack=p.getObjectByName('pack');this.packY=this.pack.position.y;
  this.eyes=[p.getObjectByName('eye-1'),p.getObjectByName('eye1')];
  this.legs=[];this.arms=[p.getObjectByName('arm-1'),p.getObjectByName('arm1')];
  for(const side of [-1,1]){
   const thigh=p.getObjectByName('leg'+side);thigh.name='thigh'+side;thigh.scale.y=.59;
   const hip=pivot(p,[thigh],'leg'+side,side*.13,.43,0);thigh.position.set(0,-.1,0);
   const knee=new T.Group();knee.name='knee'+side;knee.position.y=-.2;hip.add(knee);
   v.box(knee,0,-.075,0,.15,.15,.16,0x344e60);
   const ankle=new T.Group();ankle.position.y=-.16;knee.add(ankle);v.box(ankle,0,-.025,.035,.18,.09,.26,0x42535b);
   this.legs.push({hip,knee,ankle,side});
   const strap=v.box(this.torso,side*.16,.25,.169,.045,.43,.023,0x745e48);strap.rotation.z=side*.08;
  }
  this.props={};this.makeProps();this.detail=new CharacterDetail(v,this);tag(p,p.userData.node);
 }
 makeProps(){
  const v=this.v,p=this.root,hand=p.getObjectByName('sleeve1');
  if(this.id==='ash'||this.id==='companion')return;
  const mug=new T.Group();mug.name='tea-mug';mug.position.set(0,-.2,.08);hand.add(mug);
  v.cylinder(mug,0,0,0,.075,.065,.13,0xd2c69f);v.cylinder(mug,0,.069,0,.058,.058,.008,0x745344);
  const handle=v.mesh(new T.TorusGeometry(.047,.012,4,8),0xd2c69f);handle.position.x=.084;mug.add(handle);this.props.mug=mug;
  if(this.id==='oren'){
  const tool=new T.Group();tool.position.set(0,-.19,.03);tool.rotation.x=-Math.PI/2;hand.add(tool);this.props.hammer=tool;
  v.box(tool,0,-.12,0,.045,.33,.045,0xb18a5e);v.box(tool,0,-.3,0,.26,.1,.1,0x89a5ac);
  }
  if(this.id==='mira'){
  const roll=new T.Group();roll.position.set(0,-.18,.08);hand.add(roll);this.props.bandage=roll;
  v.cylinder(roll,0,0,0,.075,.075,.13,0xe9e4ce);v.cylinder(roll,0,.067,0,.025,.025,.01,0x8b9da0);
  const kit=new T.Group();kit.position.set(-.16,.12,.34);this.torso.add(kit);this.props.kit=kit;
  v.box(kit,0,0,0,.3,.2,.18,0xb87068);v.box(kit,0,0,.095,.035,.12,.012,0xf1e5ca);v.box(kit,0,0,.1,.12,.035,.014,0xf1e5ca);
  }
  if(this.id==='ivo'){
  const map=new T.Group();map.position.set(0,.22,.4);map.rotation.x=-.65;this.torso.add(map);this.props.map=map;this.mapLeaves=[];
  for(const side of [-1,1]){const leaf=new T.Group();map.add(leaf);v.box(leaf,side*.115,0,0,.23,.25,.014,0xddd8b7);for(let i=0;i<3;i++){const line=v.box(leaf,side*(.06+i*.052),.015-i*.025,.011,.025,.12,.006,i===1?0x789f9a:0xa49e7c);line.rotation.z=side*.3;}this.mapLeaves.push({leaf,side});}
  }
  for(const prop of Object.values(this.props))prop.visible=false;
 }
 update(dt,moving,working){
  const v=this.v,s=v.state,p=this.root,reduced=s.settings.reducedMotion,t=reduced?0:v.clock;
  const hero=this.id==='ash',companion=this.id==='companion',r=p.userData.routine;
  const dx=p.position.x-this.last.x,dz=p.position.z-this.last.z,d=Math.hypot(dx,dz),walk=hero?!!moving?.walking:companion?d>1e-4:!!r?.walking;
  const gaitDt=hero||companion?dt:Math.min(dt,Math.max(0,s.activeSeconds-this.simulationTime));
  advanceGait(this,d,gaitDt,p.visible&&walk,reduced);if(dt>0){this.last.copy(p.position);this.simulationTime=s.activeSeconds;}
  const weight=reduced?0:this.weight,phase=this.phase;
  this.torso.position.y=.45;this.torso.rotation.set(0,0,0);this.head.rotation.set(0,0,0);
  this.brush=0;
  this.pack.position.y=this.packY;this.pack.rotation.set(0,0,0);
  for(const prop of Object.values(this.props))prop.visible=false;
  for(const {hip,knee,ankle,side}of this.legs){const pose=stridePose(phase,weight,side);hip.rotation.set(pose.hip,0,0);knee.rotation.x=pose.knee;ankle.rotation.x=pose.ankle;}
  // Lift follows the travelled stride, not a second independent running clock.
  p.position.y=Math.abs(Math.sin(phase))*.035*weight;
  this.torso.rotation.z=Math.sin(phase)*.035*weight;
  this.pack.position.y+=Math.sin(phase*2-.5)*.018*weight;this.pack.rotation.x=Math.sin(phase-.4)*.07*weight;
  const cargo=p.getObjectByName('carrying');if(cargo)cargo.visible=!!r?.walking;
  if(!hero&&!p.userData.greeting){for(const arm of this.arms)arm.rotation.z=0;}
  if(companion){
   if(dt>0&&d>1e-4&&d<1.5)this.facing=turnToward(this.facing,Math.atan2(dx,dz),dt);
   p.rotation.y=this.facing;
   for(let i=0;i<2;i++)this.arms[i].rotation.x=Math.sin(phase)*(i?-.32:.32)*weight;
  }else if(hero&&!working&&walk){for(let i=0;i<2;i++)this.arms[i].rotation.x=Math.sin(phase)*(i?-.35:.35)*weight;}
  let lookTarget=null;
  if(hero){lookTarget=working?.node||v.selected; if(!lookTarget&&!walk){let nearest=3.5;for(const friend of Object.values(v.residents)){const gap=distance(p.position,friend.position);if(friend.visible&&gap<nearest){lookTarget=friend.position;nearest=gap;}}}}
  else if(distance(p.position,v.hero.position)<3.5)lookTarget=v.hero.position;
  const wanted=lookTarget?Math.max(-.65,Math.min(.65,Math.atan2(Math.sin(Math.atan2(lookTarget.x-p.position.x,lookTarget.z-p.position.z)-p.rotation.y),Math.cos(Math.atan2(lookTarget.x-p.position.x,lookTarget.z-p.position.z)-p.rotation.y)))):Math.sin(t*.53+this.seed)*.12;
  if(dt>0)this.look=reduced?0:blend(this.look,wanted,dt,5);this.head.rotation.y=reduced?0:this.look;
  for(const eye of this.eyes)eye.scale.y=reduced?1:blinkAt(t,this.seed);
  if(hero&&working){
   const pose=gatherPose(working.progress,working.node.type==='food'),onMove=working.automatic&&walk;
   this.torso.position.y-=onMove?0:pose.crouch;this.torso.rotation.x=pose.torso*(onMove?.4:1);this.torso.rotation.y=pose.twist;
   if(onMove){const aim=Math.atan2(working.node.x-p.position.x,working.node.z-p.position.z)-p.rotation.y;this.torso.rotation.y+=Math.max(-.65,Math.min(.65,Math.atan2(Math.sin(aim),Math.cos(aim))));}
   else for(const {hip,knee,ankle}of this.legs){hip.rotation.x=-pose.brace; knee.rotation.x=pose.brace*1.5;ankle.rotation.x=-pose.brace*.5;}
   if(!reduced){this.arms[1].rotation.x=pose.reach;this.arms[0].rotation.x=working.node.type==='food'?-.7:-.45;this.arms[0].rotation.z=-.18;this.head.rotation.x=working.node.type==='food'?.25:.08;}
  }else if(hero&&!walk&&!reduced){
   const idle=v.details.idle,warming=idle>4&&idle%12<8;this.brush=warming?0:brushAt(idle);
   if(this.brush){this.arms[1].rotation.x=-1.4*this.brush;this.arms[1].rotation.z=(.85+Math.sin(t*12)*.12)*this.brush;this.head.rotation.z=-.13*this.brush;}
  }else this.brush=0;
  // Assigned chores and greetings take precedence over incidental props.
  this.pose='idle';
  if(!hero&&!companion&&p.visible&&!r?.walking&&!p.userData.greeting){
   if(this.id==='mira'&&r.pose==='tend'&&p.position.x<-3){
    this.pose='bandages';this.props.kit.visible=this.props.bandage.visible=true;
    this.arms[0].rotation.x=-.9;this.arms[1].rotation.x=-1+(reduced?0:Math.sin(t*2.6)*.17);this.head.rotation.x=.22;
   }else if(this.id==='oren'&&r.pose==='hammer'){
    this.pose='hammer';this.props.hammer.visible=true;this.arms[0].rotation.x=-.65;
    const tx=p.position.x<0?-6:3,tz=p.position.x<0?-1:1;p.rotation.y=Math.atan2(tx-p.position.x,tz-p.position.z);
    // Contact is at phase zero, matching the existing workshop spark beat.
    this.arms[1].rotation.x=reduced?-.8:-1.2+Math.cos(s.activeSeconds*7)*.5;this.torso.rotation.x=reduced?.04:.04+Math.cos(s.activeSeconds*7)*.035;
   }else if(this.id==='ivo'&&r.pose==='survey'){
    this.pose='map';this.props.map.visible=true;this.arms[0].rotation.x=this.arms[1].rotation.x=-.95;
    const read=reduced?1:sipAt(t,2);for(const {leaf,side}of this.mapLeaves)leaf.rotation.y=side*(1-read)*.65;this.head.rotation.x=.2*read;
   }else if(r.pose==='rest'){
    this.pose='tea';this.props.mug.visible=true;const sip=reduced?0:sipAt(t,this.seed);this.arms[1].rotation.x=-.65-sip*.95;this.props.mug.rotation.x=-this.arms[1].rotation.x-.2;this.head.rotation.x=-sip*.08;
   }
  }
  this.detail.update(dt,moving,hero?working:null);
  if(reduced){this.torso.position.y=.45;this.torso.rotation.set(0,0,0);this.head.rotation.set(0,0,0);this.pack.position.y=this.packY;this.pack.rotation.set(0,0,0);for(const leg of this.legs){leg.hip.rotation.set(0,0,0);leg.knee.rotation.x=leg.ankle.rotation.x=0;}}
 }
}

class Pawprints{
 constructor(v){
  this.v=v;this.records=Array.from({length:96},()=>({age:40,x:0,z:0,angle:0,kind:'fox'}));this.cursor=0;this.last={};this.travel={};this.matrix=new T.Object3D();this.color=new T.Color();this.fresh=new T.Color(0x8eacba);this.snow=new T.Color(0xdcecf1);
  const geo=new T.CircleGeometry(1,6);geo.rotateX(-Math.PI/2);this.mesh=new T.InstancedMesh(geo,new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.5,depthWrite:false}),96);this.mesh.frustumCulled=false;this.mesh.name='animal-pawprints';v.scene.add(this.mesh);this.mesh.count=0;
 }
 update(dt,animals){
  const v=this.v,reduced=v.state.settings.reducedMotion,limit=v.lowQuality?32:96;
  this.mesh.visible=!reduced;v.field.tracks.visible=false; // Replace the old floating ribbon with actual travelled tracks.
  for(const [id,p]of Object.entries(animals)){
   const previous=this.last[id],d=previous?distance(p.position,previous):0;
   if(dt>0){this.last[id]={x:p.position.x,z:p.position.z};if(!reduced&&p.visible&&d>0&&d<.7){this.travel[id]=(this.travel[id]||0)+d;
    if(this.travel[id]>.2&&p.position.y<.08&&snowSurface(p.position.x,p.position.z)&&v.details.knownAt(p.position.x,p.position.z)){
     this.travel[id]=0;for(const side of [-1,1]){const r=this.records[this.cursor++%limit],a=p.rotation.y;Object.assign(r,{age:0,x:p.position.x+Math.cos(a)*side*.09,z:p.position.z-Math.sin(a)*side*.09,angle:a,kind:id});}
    }
   }else this.travel[id]=0;}
  }
  let n=0;for(let i=0;i<this.records.length;i++){const r=this.records[i];if(dt>0)r.age+=dt*(1+v.weatherBlend*2);if(reduced||i>=limit||r.age>=28||!v.details.knownAt(r.x,r.z))continue;
   const life=1-r.age/28,m=this.matrix;m.position.set(r.x,.055,r.z);m.rotation.y=r.angle;m.scale.set(.045*life,1,(r.kind==='hare'?.1:.067)*life);m.updateMatrix();this.mesh.setMatrixAt(n,m.matrix);this.color.copy(this.snow).lerp(this.fresh,life);this.mesh.setColorAt(n++,this.color);
  }this.mesh.count=n;this.mesh.instanceMatrix.needsUpdate=true;if(this.mesh.instanceColor)this.mesh.instanceColor.needsUpdate=true;
 }
}

export class Inhabitants{
 constructor(v){
  this.v=v;this.people=[new PersonRig(v,v.hero,'ash',0),...Object.entries(v.residents).map(([id,p],i)=>new PersonRig(v,p,id,i+1)),new PersonRig(v,v.companion,'companion',4)];
  this.fox={clock:0,alert:0,sleep:0,heading:0};this.hare={clock:0,alert:0,heading:1.02};this.makeFox();this.makeHare();this.makeBird();this.paws=new Pawprints(v);
 }
 makeFox(){
  const v=this.v,p=v.journey.animals.fox,f=this.fox;
  f.body=p.children.find(c=>c.position.y===.3);f.head=pivot(p,p.children.filter(c=>c.position.z>=.3&&c.position.y>.38),'fox-head',0,.46,.3);
  f.ears=f.head.children.filter(c=>c.position.y>.2);f.eyes=[];for(const side of [-1,1])f.eyes.push(v.box(f.head,side*.13,.07,.19,.03,.035,.025,0x334e5c));
  const tail=p.children.find(c=>c.position.z<-.4);f.tail=pivot(p,[tail],'fox-tail',0,.32,-.31);tail.position.set(.04,0,-.22);tail.material=v.material(0xbe8052);v.box(f.tail,.04,0,-.48,.18,.18,.2,0xe6d9be);
  f.legs=[];for(const foot of p.children.filter(c=>c.isMesh&&c.position.y===.12)){const leg=pivot(p,[foot],'fox-leg',foot.position.x,.24,foot.position.z);f.legs.push(leg);}
  tag(p,p.userData.node);
 }
 makeHare(){
  const v=this.v,p=v.journey.animals.hare,h=this.hare;
  h.body=p.children.find(c=>c.position.y===.23);h.head=pivot(p,p.children.filter(c=>c.position.y>.35),'hare-head',0,.4,.18);
  h.ears=[];for(const ear of h.head.children.filter(c=>c.position.y>.25)){const side=Math.sign(ear.position.x);h.ears.push({side,pivot:pivot(h.head,[ear],'hare-ear'+side,ear.position.x,.12,-.01)});}
  h.feet=[];for(const side of [-1,1])for(const rear of [false,true]){const leg=new T.Group();leg.position.set(side*(rear?.16:.11),.13,rear?-.18:.19);p.add(leg);v.box(leg,0,-.055,.045,rear?.14:.08,.11,rear?.27:.13,0xd4e2df);h.feet.push({leg,side,rear});}
  const tail=v.mesh(new T.IcosahedronGeometry(.1,1),0xf4f4e9);tail.position.set(0,.24,-.29);p.add(tail);tag(p,p.userData.node);
 }
 makeBird(){
  const v=this.v,p=v.journey.animals.bird;this.birdHead=pivot(p,p.children.filter(c=>c.isMesh&&c.position.y>.25),'pip-head',0,.3,.12);
  this.birdEyes=[];for(const side of [-1,1])this.birdEyes.push(v.box(this.birdHead,side*.078,.035,.065,.018,.022,.023,0x334e5c));tag(p,p.userData.node);
 }
 updateWildlife(dt){
  const v=this.v,s=v.state,reduced=s.settings.reducedMotion,t=reduced?0:v.clock,night=daylight(s).night;
  const f=this.fox,fox=v.journey.animals.fox,h=this.hare,hare=v.journey.animals.hare;
  for(const [id,r,p]of [['fox',f,fox],['hare',h,hare]]){
   const home=animalSpot(s,id),near=distance(v.hero.position,home)<(id==='fox'?2.25:1.9);
   if(dt>0){r.alert=reduced?0:blend(r.alert,near?1:0,dt,5);r.clock+=reduced?0:dt*(1-r.alert);}
  }
  if(dt>0)f.sleep=reduced?0:blend(f.sleep,night>.7&&f.alert<.1?1:0,dt,1.2);
  const fp=foxCycle(reduced?8:f.clock),sleep=reduced?0:Math.max(fp.curl*(1-f.alert),f.sleep),spot=animalSpot(s,'fox');
  fox.position.set(spot.x+fp.x*(1-f.sleep)-.65*f.sleep,fp.y*(1-f.alert)*(1-f.sleep),spot.z+fp.z*(1-f.sleep)-.2*f.sleep);
  const wanted=f.alert>.3?Math.atan2(v.hero.position.x-fox.position.x,v.hero.position.z-fox.position.z):fp.angle;
  if(dt>0)f.heading=reduced?wanted:turnToward(f.heading,wanted,dt*.4);fox.rotation.set(0,f.heading,0);
  f.body.scale.set(1+sleep*.2,1-sleep*.3,1-sleep*.22);f.body.position.y=.3-sleep*.08;
  f.head.rotation.set(reduced?0:fp.sniff*(1-f.alert)*.45+sleep*.4,Math.sin(t*1.1)*.08*(1-sleep),-sleep*.15);f.head.position.y=.46-sleep*.16;
  f.tail.rotation.set(-fp.pounce*.35,-.25+sleep*1.7+Math.sin(t*2)*.13*(1-sleep),Math.sin(t*1.5)*.08*(1-sleep));
  f.legs.forEach((leg,i)=>leg.rotation.x=reduced?0:Math.sin(t*9+(i===0||i===3?0:Math.PI))*.42*fp.walk*(1-f.alert)*(1-f.sleep)-fp.pounce*.5+sleep*.8);
  f.ears.forEach((ear,i)=>ear.rotation.z=reduced?0:Math.sin(t*2+i*2)*.07*(1-sleep));f.eyes.forEach(eye=>eye.scale.y=sleep>.7?.12:reduced?1:blinkAt(t,6));
  fox.visible=v.details.knownAt(fox.position.x,fox.position.z);f.mode=f.alert>.5?'alert':f.sleep>.5?'sleep':fp.mode;
  const hp=hareCycle(reduced?15:h.clock),hs=animalSpot(s,'hare');hare.position.set(hs.x+hp.x,hp.y*(1-h.alert),hs.z+hp.z);
  const ha=h.alert>.3?Math.atan2(v.hero.position.x-hare.position.x,v.hero.position.z-hare.position.z):hp.angle;
  if(dt>0)h.heading=reduced?ha:turnToward(h.heading,ha,dt*.6);hare.rotation.set(0,h.heading,0);
  h.body.scale.y=1+(hp.hop*.15-hp.groom*.07)*(1-h.alert);h.head.rotation.set(reduced?0:hp.groom*(.25+Math.sin(t*9)*.12)*(1-h.alert),reduced?0:Math.sin(t*1.7)*.14*hp.watch,0);
  h.ears.forEach(({pivot,side})=>{pivot.rotation.x=reduced?0:-hp.hop*.45*(1-h.alert)+Math.sin(t*3+side)*.07; pivot.rotation.z=reduced?0:side*(.08+hp.watch*.18+hp.groom*.24)*(1-h.alert);});
  h.feet.forEach(({leg,side,rear})=>{const groom=reduced||rear?0:hp.groom*(1-h.alert);leg.position.y=.13+groom*.18;leg.position.z=rear?-.18:.19+groom*.12;leg.rotation.x=reduced?0:rear?-hp.hop*.9*(1-h.alert):(hp.groom?-(.7+Math.sin(t*9+side)*.12)*hp.groom:hp.hop*.6)*(1-h.alert);});
  hare.visible=v.details.knownAt(hare.position.x,hare.position.z);h.mode=h.alert>.5?'alert':hp.mode;
  const bird=v.journey.animals.bird,flight=v.details.birdPhase?.flight||0,peck=v.details.birdPhase?.peck||0;
  const preen=reduced?0:(1-ease(flight*8))*(1-ease(peck*6))*sipAt(t,1);
  this.birdHead.rotation.set(preen*.6,preen*1.45,preen*.25+(reduced?0:Math.sin(t*2)*.13*(1-flight)));this.birdEyes.forEach(eye=>eye.scale.y=reduced?1:blinkAt(t,5));
  this.birdPreen=preen;this.paws.update(dt,{fox,hare});
 }
 update(dt,moving,working){
  for(const person of this.people)person.update(dt,moving,working);this.updateWildlife(dt);
 }
}
