import * as T from './vendor/three.module.js';
import {WORLD,stock,daylight} from './model.js';
import {DECOR_SLOTS} from './journey.js';
import {seedNoise,windAt,turnToward,goldenHour,snowSurface} from './life-motion.js';
import {feederVisit} from './life-motion.js';

// Original procedural scenery. Fixed pools and shared geometry keep cosmetic
// activity bounded. This module never writes gameplay state or requests files.
class DetailParticles{
 constructor(v){
  this.v=v;this.capacity=128;this.cursor=0;this.serial=0;
  this.items=Array.from({length:this.capacity},()=>({age:2,life:1,x:0,y:0,z:0,vx:0,vy:0,vz:0,size:0,r:1,g:1,b:1,gravity:0,kind:''}));
  this.positions=new Float32Array(this.capacity*3);this.sizes=new Float32Array(this.capacity);this.alphas=new Float32Array(this.capacity);this.colors=new Float32Array(this.capacity*3);
  const geo=new T.BufferGeometry();for(const [name,data,n]of [['position',this.positions,3],['pSize',this.sizes,1],['pAlpha',this.alphas,1],['pColor',this.colors,3]])geo.setAttribute(name,new T.BufferAttribute(data,n));
  this.mesh=new T.Points(geo,new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{map:{value:v.particleTexture},scale:{value:30}},
   vertexShader:'attribute float pSize; attribute float pAlpha; attribute vec3 pColor; uniform float scale; varying float a; varying vec3 c; void main(){a=pAlpha;c=pColor;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=max(1.,pSize*scale);}',
   fragmentShader:'uniform sampler2D map; varying float a; varying vec3 c; void main(){float alpha=texture2D(map,gl_PointCoord).a*a;if(alpha<.005)discard;gl_FragColor=vec4(c,alpha);}'
  }));this.mesh.frustumCulled=false;v.scene.add(this.mesh);
 }
 emit(kind,x,y,z,count=1){
  if(this.v.state.settings.reducedMotion||this.v.photoMode)return;
  const limit=this.v.lowQuality?32:this.capacity;
  for(let i=0;i<count;i++){
   const n=this.serial++,r=seedNoise(n+7),a=seedNoise(n+39)*Math.PI*2,p=this.items[this.cursor++%limit];
   Object.assign(p,{age:0,kind,x,y,z,vx:Math.cos(a)*.2,vy:.12+r*.1,vz:Math.sin(a)*.2,life:1.1+r*.4,size:.16+r*.09,r:.86,g:.94,b:1,gravity:0});
   if(kind==='breath')Object.assign(p,{life:1.35,size:.23,vx:.25,vy:.16,vz:.12});
   if(kind==='foot')Object.assign(p,{life:.55+r*.25,size:.2,vy:.2+r*.2,gravity:.7});
   if(kind==='branch')Object.assign(p,{life:1.2+r*.4,size:.19+r*.12,vx:Math.cos(a)*.65,vy:-.3-r*.4,vz:Math.sin(a)*.65,gravity:1.6});
   if(kind==='spark')Object.assign(p,{life:.35+r*.25,size:.07,vx:Math.cos(a)*.8,vy:.8+r*.6,vz:Math.sin(a)*.8,gravity:3,r:1,g:.6+r*.2,b:.2});
  }
 }
 clear(){for(const p of this.items)p.age=p.life;}
 update(dt){
  const v=this.v,reduced=v.state.settings.reducedMotion,limit=v.lowQuality?32:this.capacity;
  this.mesh.visible=!reduced;if(reduced)this.clear();this.mesh.geometry.setDrawRange(0,limit);
  this.mesh.material.uniforms.scale.value=v.canvas.clientHeight/Math.max(16,v.zoom)*v.renderer.getPixelRatio();
  let active=0;for(let i=0;i<this.capacity;i++){
   const p=this.items[i];if(i>=limit)p.age=p.life;
   if(p.age<p.life){p.age+=dt;p.vy-=p.gravity*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;}
   const u=Math.min(1,p.age/p.life),alive=u<1&&p.y>0;
   const j=i*3;this.positions[j]=p.x;this.positions[j+1]=p.y;this.positions[j+2]=p.z;this.sizes[i]=p.size*(1+u*1.6);this.alphas[i]=alive?(1-u)*(p.kind==='breath'?.4:.65):0;this.colors[j]=p.r;this.colors[j+1]=p.g;this.colors[j+2]=p.b;if(alive&&i<limit)active++;
  }
  for(const a of Object.values(this.mesh.geometry.attributes))a.needsUpdate=true;this.active=active;
 }
}

export class LivingDetails{
 constructor(v){
  this.v=v;this.root=new T.Group();this.root.name='living-details';v.scene.add(this.root);this.matrix=new T.Object3D();this.known=new Set(v.state.discovered);
  this.time={value:0};this.wind={value:0};this.cloud={value:0};
  this.particles=new DetailParticles(v);this.heading=v.hero.rotation.y;this.lean=0;this.idle=0;this.stepDistance=0;this.lastStep=v.hero.position.clone();this.lastSpark=-1;
  this.greetings={};this.breathTicks=new Map();this.branchCooldown=new Map();
  this.makeSnow();this.makeTerrain();this.makeAtmosphere();this.makeClothes();this.makeCamp();this.makePeople();this.makeBird();
 }
 knownAt(x,z){return this.known.has(`${Math.round(x)},${Math.round(z)}`);}
 makeSnow(){
  const m=this.v.ground.material.clone();this.v.ground.material=m;this.snowMaterial=m;
  m.onBeforeCompile=shader=>{
   shader.uniforms.livingTime=this.time;shader.uniforms.cloudStrength=this.cloud;
   shader.vertexShader='varying vec3 snowWorld;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nsnowWorld=(modelMatrix*vec4(position,1.)).xyz;');
   shader.fragmentShader=`varying vec3 snowWorld; uniform float livingTime; uniform float cloudStrength;
    float grain(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float softNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(grain(i),grain(i+vec2(1,0)),f.x),mix(grain(i+vec2(0,1)),grain(i+vec2(1)),f.x),f.y);}
   `+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    float ripple=.5+.5*sin(snowWorld.x*2.4+sin(snowWorld.z*.9)*1.7);
    float crystals=grain(floor(snowWorld.xz*75.));
    diffuseColor.rgb*=.97+crystals*.045;
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.64,.78,.85),ripple*.035);
    float shade=smoothstep(.32,.78,softNoise(snowWorld.xz*.13-vec2(livingTime*.008,livingTime*.003)));
    diffuseColor.rgb*=1.-shade*cloudStrength;
   `);
  };m.customProgramCacheKey=()=> 'living-snow-v1';
 }
 makeTerrain(){
  const v=this.v,snow=new T.MeshStandardMaterial({color:0xddebf0,roughness:1,flatShading:true});
  this.driftNodes=WORLD.filter(n=>n.type==='tree'||n.type==='coal');
  this.drifts=new T.InstancedMesh(new T.SphereGeometry(1,8,5),snow,this.driftNodes.length*2);this.drifts.receiveShadow=true;this.drifts.frustumCulled=false;this.root.add(this.drifts);
  const ice=new T.ConeGeometry(.075,1,5);ice.rotateZ(Math.PI);ice.translate(0,-.5,0);
  this.icicles=new T.InstancedMesh(ice,new T.MeshStandardMaterial({color:0xaacfdc,roughness:.3,metalness:.15,flatShading:true}),40);this.icicles.frustumCulled=false;this.root.add(this.icicles);
  this.reedSites=[];for(let i=0;i<28;i++){const x=-18+i*1.33;if(Math.abs(x-2)<2.5||Math.abs(x+3)<1.3)continue;for(let j=0;j<2;j++)this.reedSites.push({x:x+j*.17,z:-11+(i%2?1.36:-1.36)+j*.1,h:.5+seedNoise(i*3+j)*.55,phase:i+j*.5});}
  this.reeds=new T.InstancedMesh(new T.CylinderGeometry(.016,.025,1,4),v.material(0x9c997c),this.reedSites.length);
  this.seedheads=new T.InstancedMesh(new T.CylinderGeometry(.042,.046,.16,5),v.material(0x8a7259),this.reedSites.length);this.reeds.frustumCulled=this.seedheads.frustumCulled=false;this.root.add(this.reeds,this.seedheads);
 }
 makeAtmosphere(){
  const geo=new T.PlaneGeometry(1,1);geo.rotateX(-Math.PI/2);
  const make=(name,count,color)=>Array.from({length:count},(_,i)=>{const m=new T.Mesh(geo,new T.MeshBasicMaterial({map:this.v.particleTexture,color,transparent:true,opacity:0,depthWrite:false}));m.name=name+'-'+i;this.root.add(m);return m;});
  this.mist=make('creek-mist',6,0xd4e3eb);this.gusts=make('ground-snow',8,0xf4fbff);
 }
 fabric(color){
  const m=new T.MeshStandardMaterial({color,roughness:1,side:T.DoubleSide});
  m.onBeforeCompile=shader=>{
   shader.uniforms.fabricTime=this.time;shader.uniforms.fabricWind=this.wind;
   shader.vertexShader='uniform float fabricTime;uniform float fabricWind;varying vec2 fabricUV;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    fabricUV=uv;float loose=1.-uv.y;transformed.z+=sin(fabricTime*2.5+position.x*6.+uv.y*4.)*loose*loose*.11*fabricWind;
    transformed.x+=sin(fabricTime*1.7+uv.y*3.)*loose*.035*fabricWind;`);
   shader.fragmentShader='varying vec2 fabricUV;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    float thread=.5+.5*sin(fabricUV.x*160.);diffuseColor.rgb*=.96+thread*.04;
    float hem=step(fabricUV.y,.1)+step(.93,fabricUV.y);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.78,.82,.73),hem*.5);`);
  };m.customProgramCacheKey=()=> 'living-fabric-v1';return m;
 }
 makeClothes(){
  const v=this.v;this.clothesline=new T.Group();this.root.add(this.clothesline);
  for(const x of [-7.5,-4.3])v.box(this.clothesline,x,.95,5.7,.075,1.9,.075,0x7f7965);
  v.box(this.clothesline,-5.9,1.84,5.7,3.3,.025,.025,0x898a77);
  this.linen=[];for(let i=0;i<3;i++){const cloth=new T.Mesh(new T.PlaneGeometry(.62,i===1?.85:.65,6,6),this.fabric([0xe2d8b4,0x77a4a9,0xc2977b][i]));cloth.position.set(-6.85+i*.92,1.84-(i===1?.85:.65)/2,5.7);this.clothesline.add(cloth);this.linen.push(cloth);for(const x of [-.25,.25])v.box(this.clothesline,cloth.position.x+x,1.85,5.72,.045,.09,.045,0xa57f55);}
 }
 makeCamp(){
  const v=this.v;this.porchLamps=new T.Group();this.porchLamps.position.set(-6,0,-1);this.root.add(this.porchLamps);this.pendants=[];
  for(const x of [-.5,.15]){
   const pivot=new T.Group();pivot.position.set(x,1.94,-.6);this.porchLamps.add(pivot);v.box(pivot,0,-.14,0,.023,.28,.023,0x7f8680);v.box(pivot,0,-.38,0,.18,.26,.18,0xffc477);v.box(pivot,0,-.23,0,.26,.055,.26,0x66818a);v.box(pivot,0,-.54,0,.23,.05,.23,0x66818a);this.pendants.push(pivot);
   v.glow(this.porchLamps,x,.37,-.1,.7);
  }
  this.vent=new T.Group();const greenhouse=v.objects.get('greenhouse');this.vent.position.set(0,1.36,-.44);greenhouse.add(this.vent);
  v.box(this.vent,0,0,.3,1.1,.05,.65,0x6e9a9c);for(const x of [-.55,.55])v.box(this.vent,x,.025,.3,.04,.06,.67,0xcee0dc);v.box(this.vent,0,.025,.62,1.1,.06,.04,0xcee0dc);this.vent.traverse(o=>o.userData.node=greenhouse.userData.node);
  this.greenLeaves=[];for(let i=0;i<3;i++){const leaf=v.mesh(new T.SphereGeometry(.13,5,4),0x66976a);leaf.scale.set(1.2,.3,.7);leaf.position.set((i-1)*.35,1.4,.25);greenhouse.add(leaf);leaf.userData.node=greenhouse.userData.node;this.greenLeaves.push(leaf);}
  this.warmTint=new T.Color(0xffbf88);
 }
 makePeople(){
  const v=this.v;this.people=[v.hero,...Object.values(v.residents),v.companion];this.scarves=[];
  // Pivot at the shoulder instead of the middle of the sleeve. The sleeve's
  // children (including Ash's tools) keep their original neutral placement.
  for(const p of this.people)for(const side of [-1,1]){
   const sleeve=p.getObjectByName('arm'+side),pivot=new T.Group();pivot.name=sleeve.name;pivot.position.copy(sleeve.position);pivot.position.y+=.2;
   sleeve.name='sleeve'+side;sleeve.position.set(0,-.2,0);p.add(pivot);pivot.add(sleeve);
  }
  this.people.forEach((p,i)=>{const scarf=new T.Mesh(new T.PlaneGeometry(.17,.5,2,8).translate(0,-.25,0),this.fabric([0xb85249,0xd9ad61,0x98b8b1,0xcf9876,0xb3c4a5][i]));scarf.position.set(-.15,.91,-.23);scarf.rotation.x=-.35;p.add(scarf);this.scarves.push(scarf);});
 }
 makeBird(){
  const bird=this.v.journey.animals.bird;this.birdWings=[];
  // Original wing pieces gain pivots; all existing animal hit tags are retained.
  for(const side of [-1,1]){const wing=bird.children.find(c=>Math.abs(c.position.x-side*.11)<.001);if(!wing)continue;const pivot=new T.Group();pivot.position.set(side*.09,.24,-.02);bird.add(pivot);wing.position.set(side*.05,-.04,0);pivot.add(wing);this.birdWings.push({pivot,side});}
 }
 sync(){
  const v=this.v,s=v.state;this.known=new Set(s.discovered);let count=0;
  this.driftNodes.forEach((n,i)=>{if(!v.objects.get(n.id).visible||stock(s,n)<=0)return;for(let j=0;j<2;j++){const a=i*2.4+j*2.7,m=this.matrix;m.position.set(n.x+Math.cos(a)*.45,-.06,n.z+Math.sin(a)*.45);m.rotation.set(0,a,0);m.scale.set(.55+seedNoise(i)*.3,.13+j*.04,.38);m.updateMatrix();this.drifts.setMatrixAt(count++,m.matrix);}});this.drifts.count=count;this.drifts.instanceMatrix.needsUpdate=true;
  count=0;for(const id of ['home','infirmary','workshop','greenhouse']){
   if(id!=='home'&&!s.buildings[id])continue;const node=v.objects.get(id),scale=id==='home'?1:1+s.buildings[id]*.08;
   for(let i=0;i<8;i++){const m=this.matrix,x=id==='home'?-4.45+i*.34:-.72+i*.2,y=id==='home'?1.95:id==='workshop'?2.15:1.45,z=id==='home'?.66:.78;
    m.position.set(node.position.x+x*scale,y*scale,node.position.z+z*scale);m.rotation.set(0,0,0);m.scale.set(.6+seedNoise(i+12),(.17+seedNoise(i*2+id.length)*.28)*scale,1);m.updateMatrix();this.icicles.setMatrixAt(count++,m.matrix);
   }
  }this.icicles.count=count;this.icicles.instanceMatrix.needsUpdate=true;
  this.clothesline.visible=!!s.buildings.infirmary;this.porchLamps.visible=s.projects.platform===3;this.vent.visible=!!s.buildings.greenhouse;for(const leaf of this.greenLeaves)leaf.visible=s.buildings.greenhouse>=2;
 }
 impact(n){
  if(n.type!=='tree'||!this.knownAt(n.x,n.z)||this.v.state.settings.reducedMotion||this.v.photoMode)return;
  const last=this.branchCooldown.get(n.id)??-10;if(this.v.clock-last<.65)return;this.branchCooldown.set(n.id,this.v.clock);
  this.particles.emit('branch',n.x,2.2,n.z,this.v.lowQuality?5:12);
 }
 atmosphere(t){
  const v=this.v,s=v.state,reduced=s.settings.reducedMotion,storm=v.weatherBlend;
  this.mist.forEach((m,i)=>{const p=(t*.024+i/6)%1,x=-18+p*36,z=-11.3+Math.sin(i*3)*.65;m.position.set(x,.18,z);m.scale.set(5.5,1,1.4);m.material.opacity=Math.sin(p*Math.PI)*(.1+storm*.09);m.visible=!reduced&&!v.lowQuality&&this.knownAt(x,z);});
  this.gusts.forEach((m,i)=>{const p=(t*(.045+storm*.08)+i/8)%1,x=v.focus.x-10+p*20,z=v.focus.z-8+seedNoise(i+42)*16;m.position.set(x,.085,z);m.rotation.y=.2;m.scale.set(2.8+storm*2,1,.35);m.material.opacity=Math.sin(p*Math.PI)*(.05+storm*.15);m.visible=!reduced&&!v.lowQuality&&this.knownAt(x,z)&&snowSurface(x,z);});
  let count=0;for(const p of this.reedSites){if(!this.knownAt(p.x,p.z))continue;const angle=reduced?0:Math.sin(t*1.1+p.phase)*.12*this.wind.value,m=this.matrix;m.rotation.set(0,0,-angle);m.scale.set(1,p.h,1);m.position.set(p.x+Math.sin(angle)*p.h*.5,p.h*.5,p.z);m.updateMatrix();this.reeds.setMatrixAt(count,m.matrix);m.scale.set(1,1,1);m.position.set(p.x+Math.sin(angle)*p.h,p.h*Math.cos(angle),p.z);m.updateMatrix();this.seedheads.setMatrixAt(count++,m.matrix);}
  this.reeds.count=this.seedheads.count=count;this.reeds.instanceMatrix.needsUpdate=this.seedheads.instanceMatrix.needsUpdate=true;
 }
 animatePeople(dt,moving,working,t){
  const v=this.v,s=v.state,reduced=s.settings.reducedMotion,hero=v.hero,walking=!!moving?.walking;
  if(dt>0){const wanted=hero.rotation.y,delta=Math.atan2(Math.sin(wanted-this.heading),Math.cos(wanted-this.heading));this.heading=reduced?wanted:turnToward(this.heading,wanted,dt);this.lean=reduced?0:this.lean+((walking?-delta*.09:0)-this.lean)*(1-Math.exp(-dt*10));this.idle=walking||working?0:this.idle+dt;}
  hero.rotation.y=this.heading;hero.rotation.z=this.lean;
  const warming=!reduced&&!working&&!walking&&this.idle>4&&this.idle%12<8;
  for(const side of [-1,1]){const arm=hero.getObjectByName('arm'+side);arm.rotation.z=warming?-side*.32:0;if(warming)arm.rotation.x=-1.2+Math.sin(t*6)*.07;}
  const distance=hero.position.distanceTo(this.lastStep);if(dt>0&&walking&&distance<1.5){this.stepDistance+=distance;if(this.stepDistance>.36){this.stepDistance%=.36;if(snowSurface(hero.position.x,hero.position.z))this.particles.emit('foot',hero.position.x,.08,hero.position.z,v.lowQuality?1:3);}}else if(!walking||distance>=1.5)this.stepDistance=0;this.lastStep.copy(hero.position);
  this.people.forEach((p,i)=>{const tick=Math.floor((v.clock+i*.65)/3.8);if(dt>0&&p.visible&&tick!==this.breathTicks.get(i)&&!reduced){const h=p.scale.x;this.particles.emit('breath',p.position.x+Math.sin(p.rotation.y)*.3,p.position.y+1.12*h,p.position.z+Math.cos(p.rotation.y)*.3);this.breathTicks.set(i,tick);}this.scarves[i].rotation.x=-.35-(i===0&&walking?.5:0);});
  for(const [id,p]of Object.entries(v.residents)){
   const r=this.greetings[id]??(this.greetings[id]={near:false,last:-30,until:0}),near=p.visible&&p.position.distanceTo(hero.position)<2.6,free=!p.userData.routine?.walking&&!s.field.jobs[id]&&p.userData.routine?.pose!=='hammer';
   if(dt>0){if(!reduced&&near&&!r.near&&free&&v.clock-r.last>18){r.last=v.clock;r.until=v.clock+1.8;}r.near=near;}
   const wave=!reduced&&near&&free&&v.clock<r.until,arm=p.getObjectByName('arm1');arm.rotation.z=0;
   if(wave){const phase=(v.clock-r.last)/1.8,weight=Math.sin(phase*Math.PI);arm.rotation.z=1.9*weight;arm.rotation.x=-.15+Math.sin(phase*16)*.2*weight;const target=Math.atan2(hero.position.x-p.position.x,hero.position.z-p.position.z);p.rotation.y+=Math.atan2(Math.sin(target-p.rotation.y),Math.cos(target-p.rotation.y))*weight;}
   p.userData.greeting=wave;
  }
  const oren=v.residents.oren,routine=oren.userData.routine,beat=Math.floor(s.activeSeconds*7/Math.PI/2);
  if(dt>0&&!reduced&&oren.visible&&routine?.pose==='hammer'&&Math.hypot(oren.position.x-3,oren.position.z-1)<2&&s.buildings.workshop&&beat!==this.lastSpark){this.particles.emit('spark',3,.85,1,v.lowQuality?2:5);this.lastSpark=beat;}
 }
 animateBird(t){
  const v=this.v,s=v.state,bird=v.journey.animals.bird,slot=Object.keys(DECOR_SLOTS).find(id=>s.journey.decor[id]==='feeder');
  if(!slot){for(const w of this.birdWings)w.pivot.rotation.z=0;bird.rotation.x=0;this.birdPhase=null;return;}
  const p=DECOR_SLOTS[slot],visit=feederVisit(s.settings.reducedMotion?8:t);this.birdPhase=visit;
  bird.position.set(p.x+visit.x,(slot==='coach'?1:0)+visit.y,p.z+visit.z);bird.visible=this.knownAt(bird.position.x,bird.position.z);bird.rotation.x=visit.peck;bird.rotation.y=visit.flight>.05?Math.PI/2:Math.sin(t*.5)*.2;
  for(const {pivot,side}of this.birdWings)pivot.rotation.z=s.settings.reducedMotion?0:Math.sin(t*18)*side*.85*visit.flight;
 }
 update(dt,moving,working){
  const v=this.v,s=v.state,reduced=s.settings.reducedMotion,t=reduced?0:v.clock,night=daylight(s).night;
  this.time.value=t;this.wind.value=reduced?0:windAt(t,v.weatherBlend);this.cloud.value=v.lowQuality?0:(1-night*.85)*(1-v.weatherBlend*.7)*.12;
  this.atmosphere(t);this.animatePeople(dt,moving,working,t);this.animateBird(t);
  for(let i=0;i<this.pendants.length;i++)this.pendants[i].rotation.z=reduced?0:Math.sin(t*1.6+i*.5)*this.wind.value*.11;
  this.vent.rotation.x=-(.08+(1-night)*(1-v.weatherBlend)*.26)+(reduced?0:Math.sin(t*.2)*.025);
  this.greenLeaves.forEach((leaf,i)=>leaf.rotation.z=reduced?0:Math.sin(t*.9+i)*.07);
  const warm=goldenHour(night,v.weatherBlend,s.settings.steadyDaylight);v.sun.color.lerp(this.warmTint,warm*.48);this.golden=warm;
  this.particles.update(dt);
 }
}
