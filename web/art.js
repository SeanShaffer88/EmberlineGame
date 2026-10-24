import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {WORLD, key, LIVERIES} from './model.js';

const FILES={
 engine:'train-kit/train-locomotive-b',classic:'train-kit/train-locomotive-a',coach:'train-kit/train-locomotive-passenger-a',wagon:'train-kit/train-carriage-lumber',
 pineA:'nature-kit/tree_pineDefaultA',pineB:'nature-kit/tree_pineDefaultB',pineSmall:'nature-kit/tree_pineSmallA',pineTall:'nature-kit/tree_pineTallA',
 rockA:'nature-kit/rock_largeA',rockB:'nature-kit/rock_largeB',rockSmall:'nature-kit/rock_smallA',logs:'nature-kit/log_stack',stump:'nature-kit/stump_round',bridge:'nature-kit/bridge_wood',fire:'nature-kit/campfire_stones',tent:'nature-kit/tent_detailedOpen'
};
const PALETTE={leafsDark:0x315f61,woodBarkDark:0x715346,woodBark:0x785746,woodInner:0xc4a07b,wood:0xa77855,dirt:0x536c7b,grass:0xe3f0f2,stone:0x78909c,colorRed:0xa75048};

// All models, texture references, and loader modules live inside the APK.
// Optional art has a bounded load; the original playable meshes remain a fallback.
export class ValleyArt {
 constructor(view){this.v=view;this.templates={};this.report={loaded:[],failed:[]};this.rewards=[];this.livery={value:new T.Color(0xaf5148)};this.trails=[];this.lamps=[];this.secrets=WORLD.filter(n=>n.type==='secret');this.makeLife();}
 async load(progress){
  let done=0;
  await Promise.all(Object.entries(FILES).map(async([id,file])=>{
   let timer;
   try{
    const gltf=await Promise.race([new GLTFLoader().loadAsync('./assets/models/'+file+'.glb'),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Art load timed out')),8000);})]);
    this.prepare(gltf.scene,id);this.templates[id]=gltf.scene;this.report.loaded.push(id);
   }catch(e){this.report.failed.push({id,reason:String(e.message||e)});}
   finally{clearTimeout(timer);progress?.(++done,Object.keys(FILES).length);}
  }));
  this.install();this.sync();return this.report;
 }
 prepare(root,id){
  const materials=new Map();root.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;
   const convert=source=>{
    if(materials.has(source))return materials.get(source);
    const m=source.clone();m.roughness=.92;m.metalness=0;
    if(PALETTE[m.name])m.color.setHex(PALETTE[m.name]);
    // Upward-facing surfaces catch snow. The loaded model's actual contours
    // remain visible, including fir skirts and the train's pipes and wheels.
    const isTrain=['engine','classic','coach','wagon'].includes(id);
    const snow=!['woodInner'].includes(m.name);
    m.onBeforeCompile=shader=>{
     shader.uniforms.emberLivery=this.livery;
     shader.vertexShader='varying float winterUp; varying vec3 winterPosition;\n'+shader.vertexShader;
     shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nwinterUp=normalize(mat3(modelMatrix)*objectNormal).y; winterPosition=(modelMatrix*vec4(position,1.0)).xyz;');
     shader.fragmentShader='uniform vec3 emberLivery; varying float winterUp; varying vec3 winterPosition;\n'+shader.fragmentShader;
     shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      ${isTrain?`if(diffuseColor.r>diffuseColor.g*1.7 && diffuseColor.r>diffuseColor.b*1.5) diffuseColor.rgb=emberLivery;`:''}
      ${snow?`float snowEdge=sin(winterPosition.x*15.0+sin(winterPosition.z*9.0))*0.035;
      float snowMask=smoothstep(0.26+snowEdge,0.57+snowEdge,winterUp);
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.79,0.9,0.93),snowMask*0.94);`:''}`);
    };
    m.customProgramCacheKey=()=>`winter-${isTrain}-${snow}`;
    materials.set(source,m);return m;
   };
   o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);
  });
 }
 model(id,size,axis='y',angle=0){
  const source=this.templates[id];if(!source)return null;
  const g=new T.Group(),m=source.clone(true);g.add(m);m.rotation.y=angle;m.updateMatrixWorld(true);
  const box=new T.Box3().setFromObject(m),s=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3()),scale=size/(axis==='max'?Math.max(s.x,s.y,s.z):s[axis]);
  m.scale.multiplyScalar(scale);m.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);g.userData.asset=id;return g;
 }
 replace(g,model){if(!model)return false;g.clear();g.add(model);g.traverse(o=>o.userData.node=g.userData.node);return true;}
 add(id,parent,size,x,y,z,axis='y',angle=0){const model=this.model(id,size,axis,angle);if(model){model.position.set(x,y,z);parent.add(model);}return model;}
 reward(group,condition){this.rewards.push({group,condition});return group;}
 install(){
  const v=this.v;
  for(const n of WORLD){const g=v.objects.get(n.id);
   if(n.type==='tree')this.replace(g,this.model(['pineA','pineB','pineSmall','pineTall'][Math.floor((n.seed||.5)*4)%4],2.7+(n.seed||.5)*.9));
   if(n.type==='coal')this.replace(g,this.model(n.x%2?'rockA':'rockB',1.35+(n.seed||.5)*.25,'max'));
  }
  const train=v.objects.get('home'),engine=this.model('engine',3.1,'x',Math.PI/2),coach=this.model('coach',2.8,'x',Math.PI/2);
  if(engine&&coach){
   train.clear();train.add(engine);coach.position.x=-3.3;train.add(coach);this.engine=engine;
   this.classic=this.add('classic',train,3.1,0,0,0,'x',Math.PI/2);
   // Warm windows and cabin roof stay legible at the gameplay camera distance.
   for(const x of [-4.2,-3.3,-2.4])for(const z of [-.56,.56])v.box(train,x,1.22,z,.46,.43,.045,0xffc477);
   v.box(train,-3.3,1.95,0,2.7,.13,1.25,0xe4f2f5);
   const wagon=this.add('wagon',train,2.5,-6.25,0,0,'x',Math.PI/2);if(wagon)this.reward(wagon,s=>s.buildings.engine>=2);
   const porch=new T.Group();v.box(porch,-3.3,.16,.95,2.8,.22,.7,0x8c7967);for(const x of [-4.55,-2.05])v.box(porch,x,.65,1.25,.09,1.1,.09,0x6e6459);v.box(porch,-3.3,1.18,1.25,2.6,.08,.08,0xa78b6a);train.add(porch);this.reward(porch,s=>s.buildings.engine>=1);
   const flags=new T.Group();for(let i=0;i<9;i++){const flag=v.mesh(new T.ConeGeometry(.12,.28,3),i%2?0xb6554e:0xd4a44b);flag.position.set(-4.5+i*.48,2.2+Math.sin(i/8*Math.PI)*.25,.65);flag.rotation.z=Math.PI;flags.add(flag);}train.add(flags);this.flags=flags;this.reward(flags,s=>s.buildings.engine>=3);
   v.glow(train,-2,.02,.9,2);train.traverse(o=>o.userData.node=train.userData.node);
  }
  const bridge=v.objects.get('bridge'),newBridge=this.model('bridge',2.65,'z');if(newBridge){
   const broken=new T.Group();for(const child of [...bridge.children])broken.add(child);bridge.add(broken,newBridge);newBridge.position.z=-1;
   this.reward(broken,s=>!s.flags.bridge);this.reward(newBridge,s=>s.flags.bridge);
  }
  const hearth=v.objects.get('furnace').userData.built;
  const stones=this.add('fire',hearth,1.7,0,.01,0,'x');if(stones)stones.position.y=-.01;
  const wood=this.add('logs',v.objects.get('workshop').userData.built,1.2,-.25,.01,-1,'x');if(wood)this.reward(wood,s=>s.buildings.workshop>=1);
  for(const [id,x,z]of [['oren',-1.1,-.4],['ivo',-1,-.4]]){const g=v.objects.get(id);const tent=this.add('tent',g,1.3,x,0,z);if(tent)tent.traverse(o=>o.userData.node=g.userData.node);}
  for(const [id,x,z]of [['first-pine',-.45,.2],['near-pine',.4,-.2]]){
   const n=WORLD.find(n=>n.id===id),g=new T.Group();g.position.set(n.x+x,0,n.z+z);this.add('stump',g,.26,0,0,0);v.scene.add(g);this.reward(g,s=>s.stock[id]===0);
  }
  // Small boulders are decoration around existing resource nodes, never new blockers.
  for(const n of WORLD.filter(n=>n.type==='coal')){const g=v.objects.get(n.id);this.add('rockSmall',g,.3,.6,0,.2);g.traverse(o=>o.userData.node=n);}
  for(const n of WORLD)v.objects.get(n.id).traverse(o=>o.userData.node=n);
  v.sync(true);
 }
 makeLife(){
  const v=this.v;this.fireGlow=new T.PointLight(0xffac5d,2,8,2);this.fireGlow.position.set(-3,1.3,1);v.scene.add(this.fireGlow);
  this.embers=new T.Group();for(let i=0;i<10;i++){const e=v.mesh(new T.OctahedronGeometry(.025),0xffb766);e.castShadow=false;this.embers.add(e);}v.scene.add(this.embers);
  // Each building gains distinct details at levels two and three.
  for(const id of ['workshop','greenhouse','infirmary','furnace']){
   const root=v.objects.get(id),level2=new T.Group(),level3=new T.Group();root.add(level2,level3);
   if(id==='greenhouse'){
    for(let i=0;i<4;i++){v.box(level2,-.65+i*.4,.4,1.05,.3,.3,.36,0x8d6348);v.cylinder(level2,-.65+i*.4,.68,1.05,.12,.05,.35,0x688a5c);const bloom=v.mesh(new T.IcosahedronGeometry(.08,0),i%2?0xe9ba65:0xc57468);bloom.position.set(-.65+i*.4,.88,1.05);level3.add(bloom);}
   }else{
    for(const x of [-.65,.65]){v.box(level2,x,0.28,1.08,.36,.5,.45,0x866c58);v.box(level2,x,.55,1.08,.4,.07,.5,0xe3f0f2);}
    v.box(level3,0,1.8,1.02,1.4,.18,.18,0xa77855);for(const x of [-.62,.62])v.box(level3,x,1.1,1.02,.08,1.4,.08,0x735645);
   }
   this.reward(level2,s=>s.buildings[id]>=2);this.reward(level3,s=>s.buildings[id]>=3);
   root.traverse(o=>o.userData.node=root.userData.node);
  }
  for(const [x,z]of [[-5,-1],[2,-1],[-2,4],[4,4]]){
   const lamp=new T.Group();v.cylinder(lamp,0,.8,0,.045,.07,1.6,0x54707b);v.box(lamp,0,1.6,0,.22,.32,.22,0xffc477);v.box(lamp,0,1.82,0,.35,.09,.35,0xe4f2f5);v.glow(lamp,0,.02,0,.85);lamp.position.set(x,0,z);v.scene.add(lamp);this.lamps.push(lamp);this.reward(lamp,s=>s.buildings.engine>=1);
  }
  // Props make the residents' return trips read as chores instead of orbiting.
  for(const [id,p]of Object.entries(v.residents)){
   const load=new T.Group();load.name='carrying';v.box(load,0,.7,.42,.7,.22,.22,id==='mira'?0xc9bda4:0x996e4b);if(id==='mira'){v.box(load,0,.72,.54,.05,.14,.02,0xa65049);v.box(load,0,.72,.55,.14,.05,.02,0xa65049);}p.add(load);
  }
  // A hare has a small route near the first secret. It does not consume food,
  // block paths, or grant automatic resources. Tracks are clues, not gates.
  this.hare=new T.Group();v.box(this.hare,0,.23,0,.3,.32,.48,0xe8f1ef);v.box(this.hare,0,.42,.22,.25,.26,.24,0xf3f5ed);for(const x of [-.07,.07]){v.box(this.hare,x,.69,.17,.07,.36,.07,0xd6e3e3);v.box(this.hare,x,.46,.35,.035,.035,.02,0x3b5665);}v.scene.add(this.hare);
  const geo=new T.CircleGeometry(.075,6);geo.rotateX(-Math.PI/2);
  for(let i=0;i<15;i++){const x=-5.1-i*.12,z=7.6+i*.14;const dot=new T.Mesh(geo,v.material(0xabc5d1));dot.scale.z=1.8;dot.position.set(x,.012,z);v.scene.add(dot);this.trails.push(dot);}
  this.birds=new T.Group();for(let i=0;i<3;i++){const b=new T.Group();for(const side of [-1,1]){const wing=v.box(b,side*.13,0,0,.28,.035,.14,0x506c7d);wing.name='wing'+side;}b.position.set(i*.8,0,i*.4);this.birds.add(b);}v.scene.add(this.birds);
  this.chimneySmoke=new T.Points(new T.BufferGeometry(),new T.PointsMaterial({color:0xf3f6ed,size:11,map:v.particleTexture,transparent:true,opacity:.28,depthWrite:false}));this.smokePositions=new Float32Array(36*3);this.chimneySmoke.geometry.setAttribute('position',new T.BufferAttribute(this.smokePositions,3));this.chimneySmoke.frustumCulled=false;v.scene.add(this.chimneySmoke);
 }
 sync(){
  const s=this.v.state;this.livery.value.setHex(LIVERIES[s.livery].color);
  if(this.classic){this.classic.visible=s.livery==='pine';this.engine.visible=!this.classic.visible;}
  for(const r of this.rewards)r.group.visible=!!r.condition(s);
  const seen=new Set(s.discovered);for(const p of this.trails)p.visible=seen.has(key(Math.round(p.position.x),Math.round(p.position.z)));
  this.hare.visible=seen.has(key(-6,8));
 }
 update(dt,motion){
  const v=this.v,t=v.clock,s=v.state;
  this.fireGlow.intensity=(2+s.buildings.furnace*.5)*(1+Math.sin(t*9)*.09);this.fireGlow.visible=!v.lowQuality;
  this.embers.children.forEach((e,i)=>{const p=(t*.4+i/10)%1;e.position.set(-3+Math.sin(i*4+t)*p*.3,p*1.5+.55,1+Math.cos(i*3)*p*.25);e.scale.setScalar(1-p);});
  if(this.flags)this.flags.children.forEach((f,i)=>f.rotation.x=Math.sin(t*3+i)*(.12+v.weatherBlend*.25));
  for(const [i,id]of ['mira','oren','ivo'].entries()){
   const p=v.residents[id],a=[[-4,2],[2,2],[2,-1]][i],b=[[-5,3],[-.5,-1],[5,2]][i],phase=(t*.045+i/3)%1;
   const moving=phase<.35||(phase>.5&&phase<.85),u=phase<.5?Math.min(1,phase/.35):Math.max(0,1-(phase-.5)/.35);
   p.position.set(a[0]+(b[0]-a[0])*u,moving?Math.abs(Math.sin(t*9))*.04:Math.sin(t*2+i)*.012,a[1]+(b[1]-a[1])*u);
   p.rotation.y=Math.atan2(b[0]-a[0],b[1]-a[1])+(phase>.5?Math.PI:0);
   const carry=phase>.5&&phase<.85;p.getObjectByName('carrying').visible=carry;
   for(const sign of [-1,1]){p.getObjectByName('leg'+sign).rotation.x=moving?Math.sin(t*9)*sign*.4:0;p.getObjectByName('arm'+sign).rotation.x=carry?-1:moving?-Math.sin(t*9)*sign*.3:-.6+Math.sin(t*(id==='oren'?7:2))*.25;}
  }
  for(const sign of [-1,1]){v.companion.getObjectByName('leg'+sign).rotation.x=motion?.walking?Math.sin(t*13)*sign*.5:0;v.companion.getObjectByName('arm'+sign).rotation.x=motion?.walking?-Math.sin(t*13)*sign*.3:0;}
  const hp=(t*.12)%1;this.hare.position.set(-6+Math.sin(t*.23)*.65,Math.max(0,Math.sin(hp*Math.PI*8))*.12,8+Math.cos(t*.23)*.6);this.hare.rotation.y=Math.atan2(Math.cos(t*.23),-Math.sin(t*.23));
  this.birds.visible=!v.lowQuality&&v.weatherBlend<.6;this.birds.position.set(Math.sin(t*.06)*10,5.5+Math.sin(t*.2)*.2,-6+Math.cos(t*.06)*5);this.birds.rotation.y=-t*.06;
  this.birds.children.forEach((b,i)=>{for(const sign of [-1,1])b.getObjectByName('wing'+sign).rotation.z=Math.sin(t*6+i)*sign*.45;});
  for(let i=0;i<36;i++){const p=(t*.1+i%12/12)%1,k=Math.floor(i/12),origin=[[-3,1],[-5,4],[3,1]][k],enabled=k===0?s.buildings.furnace>=1:k===1?s.buildings.infirmary>=1:s.buildings.workshop>=2;this.smokePositions[i*3]=origin[0]+.55+p*(.9+v.weatherBlend);this.smokePositions[i*3+1]=enabled?1.8+p*2.2:-10;this.smokePositions[i*3+2]=origin[1]-.3+p*.2;}
  this.chimneySmoke.geometry.attributes.position.needsUpdate=true;
  for(const n of this.secrets){const gem=v.objects.get(n.id).getObjectByName('secretglow');if(gem){gem.rotation.y=t*.8;gem.position.y=1.05+Math.sin(t*2+n.x)*.06;gem.scale.setScalar(.9+Math.sin(t*2)*.12+v.weatherBlend*.25);}}
 }
}
