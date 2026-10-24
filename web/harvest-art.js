import * as T from './vendor/three.module.js';
import {WORLD,stock} from './model.js';
import {isGathering,STRIKES,workProfile} from './feel.js';
import {nearbyResource} from './harvest-feel.js';
import {seedNoise} from './life-motion.js';

// Fixed-capacity instancing: no geometry, textures or materials allocated by
// a strike, harvest, replenishment, or animation frame.
export class HarvestArt{
 constructor(v){
  this.v=v;this.root=new T.Group();this.root.name='harvest-art';v.scene.add(this.root);
  this.matrix=new T.Object3D();this.color=new T.Color();this.serial=0;this.cursor=0;
  this.nodes=WORLD.filter(n=>isGathering(n.type));this.previous=new Map();this.growing=new Map();
  this.shapes={tree:new T.BoxGeometry(.18,.045,.07),coal:new T.DodecahedronGeometry(.055),scrap:new T.TorusGeometry(.055,.015,3,6),food:new T.PlaneGeometry(.12,.065)};
  this.fragments={};this.records={};for(const type of Object.keys(this.shapes)){
   const material=new T.MeshStandardMaterial({color:workProfile(type).color,roughness:type==='scrap'?.35:1,metalness:type==='scrap'?.65:0,side:T.DoubleSide});
   const mesh=new T.InstancedMesh(this.shapes[type],material,32);mesh.frustumCulled=false;mesh.count=0;this.root.add(mesh);this.fragments[type]=mesh;
   this.records[type]=Array.from({length:32},()=>({age:3,life:1}));
  }
  this.marks={};const spec={cuts:[new T.BoxGeometry(.18,.045,.035),0xe0bb83],logs:[new T.CylinderGeometry(.12,.12,.45,6),0xb98b59],veins:[new T.BoxGeometry(.025,.19,.028),0xb4d1ce],parts:[new T.BoxGeometry(.13,.07,.24),0xb4bec0],berries:[new T.IcosahedronGeometry(.07),0xd37768]};
  for(const [id,[geo,color]]of Object.entries(spec)){const m=new T.InstancedMesh(geo,v.material(color),this.nodes.length*4);m.frustumCulled=false;m.count=0;this.root.add(m);this.marks[id]=m;}
  this.halo=new T.Mesh(new T.RingGeometry(.68,.705,40),new T.MeshBasicMaterial({color:0xcbe8d1,transparent:true,opacity:.65,depthWrite:false}));this.halo.rotation.x=-Math.PI/2;this.root.add(this.halo);
  this.tickMaterials={ready:v.material(0xffd08c),pending:v.material(0x718f9b)};this.beats=[];this.beads=[];
  for(let i=0;i<3;i++){const tick=v.box(this.root,0,.12,0,.16,.035,.08,0xffdda0);tick.castShadow=false;this.beats.push(tick);}
  for(let i=0;i<4;i++){const bead=v.mesh(new T.SphereGeometry(.065,6,4),0xcde7d7);bead.castShadow=false;this.root.add(bead);this.beads.push(bead);}
 }
 impact(n,complete){
  const v=this.v;if(complete||!isGathering(n.type)||v.photoMode||v.state.settings.reducedMotion)return;
  const records=this.records[n.type],count=v.lowQuality?3:7;
  const angle=Math.atan2(v.hero.position.x-n.x,v.hero.position.z-n.z),height=n.type==='tree'?.63:.4;
  for(let i=0;i<count;i++){
   const serial=this.serial++,r=seedNoise(serial),a=angle+(seedNoise(serial+81)-.5)*1.8,p=records[this.cursor++%(v.lowQuality?12:records.length)],speed=.6+r*1.3;
   Object.assign(p,{age:0,life:.65+r*.45,x:n.x+Math.sin(angle)*.22,y:height,z:n.z+Math.cos(angle)*.22,vx:Math.sin(a)*speed,vy:.7+r,vz:Math.cos(a)*speed,spin:(r-.5)*12,bounced:false});
  }
 }
 update(dt,working){
  const v=this.v,s=v.state,reduced=s.settings.reducedMotion,counts={cuts:0,logs:0,veins:0,parts:0,berries:0},m=this.matrix;
  const stamp=(kind,x,y,z,rx=0,ry=0,rz=0,scale=1)=>{m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.scale.setScalar(scale);m.updateMatrix();this.marks[kind].setMatrixAt(counts[kind]++,m.matrix);};
  for(const n of this.nodes){
   const amount=stock(s,n),old=this.previous.get(n.id),g=v.objects.get(n.id),visible=g.visible;
   if(old===0&&amount>0&&visible&&!reduced)this.growing.set(n.id,0);
   this.previous.set(n.id,amount);
   if(this.growing.has(n.id)){const age=this.growing.get(n.id)+dt;this.growing.set(n.id,age);if(age>=.65||reduced||!amount){this.growing.delete(n.id);g.scale.y=amount?1:.1;}else g.scale.y=.1+.9*Math.sin(age/.65*Math.PI/2);}
   if(!visible)continue;
   if(n.type==='tree'){
    for(let j=0;j<Math.min(3,n.stock-amount);j++)stamp('cuts',n.x,.42+j*.095,n.z+.18,0,0,.2);
    if(!amount)for(let j=0;j<3;j++)stamp('logs',n.x+(j-1)*.24,.15,n.z+.35,Math.PI/2,0,j*.15);
   }else if(n.type==='coal'){
    for(let j=0;j<n.stock-amount;j++)stamp('veins',n.x+(j-1.5)*.15,amount?.47:.07,n.z+.4,0,0,(j%2?1:-1)*.5,amount?1:.3);
   }else if(n.type==='scrap'){
    for(let j=0;j<amount;j++)stamp('parts',n.x+(j-1.5)*.16,.7,n.z+.15,j*.2,j*.7);
   }else{
    // Existing berries also thin out; the added ripe clusters remain readable
    // even on the smallest screen. Every cluster follows actual stock.
    let i=0;for(const child of g.children)if(child.isMesh&&child.geometry.type==='IcosahedronGeometry'&&child.geometry.parameters.radius===.1)child.visible=i++<amount;
    for(let j=0;j<amount;j++)stamp('berries',n.x+Math.sin(j*2)*.36,.6,n.z+Math.cos(j*2)*.36,0,0,0,1);
   }
  }
  for(const [kind,mesh]of Object.entries(this.marks)){mesh.count=counts[kind];mesh.instanceMatrix.needsUpdate=true;}
  const n=working?.node&&isGathering(working.node.type)?working.node:nearbyResource(s),show=!!n&&!v.photoMode&&v.inputEnabled?.()!==false;
  this.halo.visible=show;if(show){this.halo.position.set(n.x,.085,n.z);this.halo.material.color.setHex(stock(s,n)?0xa6cfb7:0x89a8b6);}
  this.beats.forEach((tick,i)=>{tick.visible=show&&working?.node?.id===n.id;if(tick.visible){const a=STRIKES[i]*Math.PI*2;tick.position.set(n.x+Math.cos(a),.12,n.z+Math.sin(a));tick.rotation.y=-a;tick.scale.y=working.progress>=STRIKES[i]?2.5:1;tick.material=this.tickMaterials[working.progress>=STRIKES[i]?'ready':'pending'];}});
  this.beads.forEach((bead,i)=>{bead.visible=show&&i<stock(s,n);if(bead.visible)bead.position.set(n.x+(i-(Math.min(4,stock(s,n))-1)/2)*.17,.12,n.z+.78);});
  for(const [type,records]of Object.entries(this.records)){
   const mesh=this.fragments[type],limit=v.lowQuality?12:32;let count=0;
   for(let i=0;i<records.length;i++){const p=records[i];if(reduced||i>=limit){p.age=p.life;continue;}if(p.age>=p.life)continue;
    p.age+=dt;p.vy-=(type==='food'?1:4)*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;
    if(p.y<.08){p.y=.08;if(!p.bounced&&type!=='food'){p.vy=Math.abs(p.vy)*.27;p.vx*=.5;p.vz*=.5;p.bounced=true;}else{p.vy=0;p.vx*=Math.exp(-dt*8);p.vz*=Math.exp(-dt*8);}}
    const alpha=Math.max(0,1-p.age/p.life);m.position.set(p.x,p.y,p.z);m.rotation.set(p.age*p.spin,p.age*2,p.age*p.spin*.5);m.scale.setScalar(Math.min(1,alpha*4));m.updateMatrix();mesh.setMatrixAt(count++,m.matrix);
   }mesh.count=count;mesh.instanceMatrix.needsUpdate=true;
  }
 }
}
