import * as T from './vendor/three.module.js';
import {JourneyArt,makeJourneyNode,syncJourneyNode} from './journey-art.js';
import {FinishFX} from './finish-fx.js';
import {DragControls} from './controls.js';
import {ValleyArt} from './art.js';
import {makeRestoration,makeDiscovery,syncRestoration} from './valley-art.js';
import {workProfile} from './feel.js';
import {WORLD,stock,key,LIVERIES,weather,daylight} from './model.js';
const C={snow:0xe4f2f5,snowShade:0xb4cedb,ice:0x65a9c0,fir:0x315d64,bark:0x715347,red:0xaf5148,roof:0x385964,wood:0xa77855,gold:0xffbc6d,metal:0x456273};
export class WorldView{
 constructor(canvas,state,onTap){
  this.canvas=canvas;this.state=state;this.onTap=onTap;this.focus=new T.Vector3(state.player.x,0,state.player.z);this.manual=false;this.zoom=state.settings.zoom||24;this.zoomTarget=this.zoom;this.viewport=null;this.viewportTarget=null;this.treeFades=new Map();this.occlusionAge=1;this.occluders=new Set();this.recoils=new Map();this.objects=new Map();this.materials=new Map();this.effects=[];this.clock=0;
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));this.renderer.setClearColor(0xb8d3df);this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;
  this.scene=new T.Scene();this.scene.fog=new T.FogExp2(0xb8d3df,.014);this.hemi=new T.HemisphereLight(0xe9f8ff,0x728e9c,2.6);this.scene.add(this.hemi);this.skyColor=new T.Color();this.nightSky=new T.Color(0x617b98);this.nightSun=new T.Color(0xb8d9ff);this.nightAmbient=new T.Color(0x91afd1);
  this.sun=new T.DirectionalLight(0xffe5be,3.1);this.sun.position.set(-12,28,12);this.sun.castShadow=true;this.sun.shadow.mapSize.set(1024,1024);Object.assign(this.sun.shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:1,far:70});this.sun.shadow.bias=-.0005;this.scene.add(this.sun);
  this.camera=new T.OrthographicCamera(-10,10,16,-16,.1,100);this.ray=new T.Raycaster();this.groundPlane=new T.Plane(new T.Vector3(0,1,0),0);
  this.ground=this.box(this.scene,0,-.35,0,49,.6,48,C.snow);this.ground.receiveShadow=true;
  this.box(this.scene,0,-.02,-11,44,.08,2.2,C.ice);for(let i=-21;i<=21;i+=2){const shard=this.box(this.scene,i,.03,-10.4,.9,.08,.13,0xc4eef7);shard.rotation.y=i*.8;}
  // Fixed rail bed: the locomotive remains part of this settlement forever.
  const ties=new T.InstancedMesh(new T.BoxGeometry(.22,.13,1.9),this.material(0x7993a0),68),tieMatrix=new T.Matrix4();for(let i=0;i<68;i++){tieMatrix.makeTranslation(-22+i*.65,.02,-3.5);ties.setMatrixAt(i,tieMatrix);}ties.receiveShadow=true;this.scene.add(ties);
  for(const z of [-4.13,-2.87])this.box(this.scene,0,.1,z,48,.14,.09,0x67828d);
  const rng=(n)=>Math.abs(Math.sin(n*127.1+311.7)*43758.5453)%1;
  for(let i=0;i<110;i++){const x=(rng(i)-.5)*46,z=(rng(i+91)-.5)*44;const d=this.mesh(new T.CircleGeometry(.15+rng(i+31)*.6,6),i%2?0xd3e7ec:0xeef8fa);d.rotation.x=-Math.PI/2;d.position.set(x,-.035,z);this.scene.add(d);}
  for(let i=0;i<35;i++){const angle=i/35*Math.PI*2,r=26+rng(i)*5;const mountain=this.mesh(new T.ConeGeometry(3+rng(i)*4,5+rng(i+19)*7,5),i%2?0x98b7c7:0xaac7d3);mountain.position.set(Math.cos(angle)*r,1.5,Math.sin(angle)*r);mountain.rotation.y=i;this.scene.add(mountain);}
  for(const n of WORLD){const g=this.makeNode(n);g.position.set(n.x,0,n.z);g.userData.node=n;
   if(n.type==='building'){
    const existing=[...g.children],built=new T.Group();for(const child of existing)built.add(child);g.add(built);g.userData.built=built;
    const foundation=new T.Group();this.box(foundation,0,.02,0,1.9,.1,1.6,0xb4c7c9);for(const x of [-.8,.8])for(const z of [-.65,.65])this.box(foundation,x,.2,z,.12,.4,.12,C.wood);
    if(['greenhouse','infirmary'].includes(n.id)){g.add(foundation);g.userData.foundation=foundation;}
    const upgrade=new T.Group();
    if(n.id==='workshop'){for(const x of [-.85,.85])this.box(upgrade,x,1.1,-.55,.13,2.2,.13,C.wood);this.box(upgrade,0,2.15,0,2.1,.15,1.6,C.snow);this.box(upgrade,.8,1.7,.6,.2,.25,.18,C.gold);}
    if(n.id==='furnace'){this.box(upgrade,0,.4,-.35,1.2,.8,.65,C.red);this.box(upgrade,0,1.25,-.55,.25,1.8,.25,C.metal);this.box(upgrade,0,2.18,-.55,.42,.12,.42,C.snow);}
    if(n.id==='greenhouse'){for(const x of [-.5,0,.5])this.cylinder(upgrade,x,.72,.2,.12,.12,.2,0x5a9566);}
    if(n.id==='infirmary'){this.box(upgrade,1.15,.35,0,.4,.7,.65,C.red);this.box(upgrade,1.15,.72,0,.45,.08,.7,C.snow);}
    g.add(upgrade);g.userData.upgrade=upgrade;
   }
   g.traverse(o=>{o.userData.node=n;});this.scene.add(g);this.objects.set(n.id,g);}
  this.hero=this.person(0xe8a84e);this.scene.add(this.hero);this.hero.position.set(state.player.x,0,state.player.z);
  this.companion=this.person(0x648fbd);this.companion.scale.setScalar(.87);this.scene.add(this.companion);
  this.residents={};for(const [id,color]of Object.entries({mira:0x9c6067,oren:0x74875e,ivo:0x638fba})){const person=this.person(color);person.scale.setScalar(.85);this.scene.add(person);this.residents[id]=person;person.traverse(o=>o.userData.node={id:'crew-'+id,type:'crew',crew:id});}
  const sprite=document.createElement('canvas');sprite.width=sprite.height=32;const ctx=sprite.getContext('2d'),gradient=ctx.createRadialGradient(16,16,1,16,16,16);gradient.addColorStop(0,'rgba(255,255,255,1)');gradient.addColorStop(.45,'rgba(255,255,255,.7)');gradient.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,32,32);this.particleTexture=new T.CanvasTexture(sprite);
  this.steamPositions=new Float32Array(24*3);const steamGeo=new T.BufferGeometry();steamGeo.setAttribute('position',new T.BufferAttribute(this.steamPositions,3));this.steam=new T.Points(steamGeo,new T.PointsMaterial({color:0xf6fbfb,size:16,map:this.particleTexture,transparent:true,opacity:.32,depthWrite:false}));this.scene.add(this.steam);
  this.burstPositions=new Float32Array(28*3);const burstGeo=new T.BufferGeometry();burstGeo.setAttribute('position',new T.BufferAttribute(this.burstPositions,3));this.burst=new T.Points(burstGeo,new T.PointsMaterial({color:0xffe3ad,size:4,transparent:true,opacity:0,depthWrite:false}));this.burst.frustumCulled=false;this.scene.add(this.burst);this.burstLife=0;
  this.tool=new T.Group();this.tools={};
  for(const kind of ['axe','pick','prybar']){const g=new T.Group();this.tools[kind]=g;this.tool.add(g);this.box(g,0,-.25,.1,.065,.65,.07,kind==='prybar'?C.metal:C.wood);if(kind==='axe')this.box(g,.13,-.49,.1,.34,.22,.1,0xc9dbe0);if(kind==='pick'){const head=this.box(g,0,-.49,.1,.58,.09,.1,0xb7ced1);head.rotation.z=.18;}if(kind==='prybar')this.box(g,.08,-.54,.1,.2,.08,.07,0xc9dbe0);}
  this.hero.getObjectByName('arm1').add(this.tool);this.tool.visible=false;
  this.workRing=new T.Mesh(new T.RingGeometry(.86,.94,60),new T.MeshBasicMaterial({color:0xf1bd73,transparent:true,opacity:.9,depthWrite:false}));this.workRing.rotation.x=-Math.PI/2;this.workRing.visible=false;this.scene.add(this.workRing);
  this.routePositions=new Float32Array(120*3);const routeGeo=new T.BufferGeometry();routeGeo.setAttribute('position',new T.BufferAttribute(this.routePositions,3));routeGeo.setDrawRange(0,0);this.routeDots=new T.Points(routeGeo,new T.PointsMaterial({color:0x548b94,size:4,map:this.particleTexture,transparent:true,opacity:.65,depthWrite:false}));this.routeDots.frustumCulled=false;this.scene.add(this.routeDots);
  this.ring=this.mesh(new T.RingGeometry(.7,.78,40),0xffcd80);this.ring.rotation.x=-Math.PI/2;this.ring.position.y=.06;this.scene.add(this.ring);this.ring.visible=false;
  this.destination=this.mesh(new T.RingGeometry(.17,.25,24),0x2e8a96);this.destination.rotation.x=-Math.PI/2;this.destination.position.y=.09;this.scene.add(this.destination);this.destination.visible=false;
  this.fogMask=document.createElement('canvas');this.fogMask.width=328;this.fogMask.height=320;this.fogSoft=document.createElement('canvas');this.fogSoft.width=328;this.fogSoft.height=320;this.fogTexture=new T.CanvasTexture(this.fogSoft);this.fogTexture.minFilter=T.LinearFilter;this.fogTexture.generateMipmaps=false;
  const fogGeo=new T.PlaneGeometry(41,40);fogGeo.rotateX(-Math.PI/2);this.fog=new T.Mesh(fogGeo,new T.MeshBasicMaterial({color:0x94b4c6,alphaMap:this.fogTexture,transparent:true,opacity:.95,depthWrite:false}));this.fog.position.set(0,.045,-.5);this.scene.add(this.fog);
  this.weatherBlend=0;this.trees=[...this.objects.values()].filter(g=>g.userData.node.type==='tree');
  this.snowPositions=new Float32Array(360*3);for(let i=0;i<360;i++){this.snowPositions[i*3]=(rng(i+400)-.5)*32;this.snowPositions[i*3+1]=rng(i+600)*16;this.snowPositions[i*3+2]=(rng(i+800)-.5)*32;}const sg=new T.BufferGeometry();sg.setAttribute('position',new T.BufferAttribute(this.snowPositions,3));this.snow=new T.Points(sg,new T.PointsMaterial({color:0xffffff,size:2.1,map:this.particleTexture,transparent:true,opacity:.76,depthWrite:false}));this.snow.frustumCulled=false;this.scene.add(this.snow);
  // A fixed pool leaves a short trail without accumulating geometry or save data.
  const printGeo=new T.CircleGeometry(1,8);printGeo.rotateX(-Math.PI/2);
  this.footprints=new T.InstancedMesh(printGeo,new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.64,depthWrite:false}),128);this.footprints.frustumCulled=false;this.scene.add(this.footprints);
  this.prints=Array.from({length:128},()=>({age:75,x:0,z:0,angle:0}));this.printCursor=0;this.printSide=1;this.printDistance=0;this.lastPrintPosition=this.hero.position.clone();this.printTransform=new T.Object3D();this.printColor=new T.Color();this.printFresh=new T.Color(0x88a9bb);this.printSnow=new T.Color(C.snow);this.updateFootprints(0,null);
  this.waypointMark=new T.Group();const marker=this.mesh(new T.RingGeometry(.28,.34,24),0xbe804d);marker.rotation.x=-Math.PI/2;marker.position.y=.07;this.waypointMark.add(marker);this.box(this.waypointMark,0,.48,0,.045,.9,.045,0x526d79);this.box(this.waypointMark,.2,.82,0,.4,.22,.025,0xe9b46d);this.scene.add(this.waypointMark);
  this.finishFX=new FinishFX(this);this.art=new ValleyArt(this);this.journey=new JourneyArt(this);this.bindInput();this.resize();this.sync(true);window.addEventListener('resize',()=>this.resize());
 }
 material(color){if(!this.materials.has(color))this.materials.set(color,new T.MeshStandardMaterial({color,roughness:1,flatShading:true}));return this.materials.get(color);}
 mesh(geo,color){const m=new T.Mesh(geo,this.material(color));m.castShadow=true;m.receiveShadow=true;return m;}
 box(parent,x,y,z,w,h,d,color){const m=this.mesh(new T.BoxGeometry(w,h,d),color);m.position.set(x,y,z);parent.add(m);return m;}
 cylinder(parent,x,y,z,r1,r2,h,color,sides=8){const m=this.mesh(new T.CylinderGeometry(r1,r2,h,sides),color);m.position.set(x,y,z);parent.add(m);return m;}
 glow(parent,x,y,z,r=.5){const m=new T.Mesh(new T.CircleGeometry(r,24),new T.MeshBasicMaterial({color:0xffc477,transparent:true,opacity:.18,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.userData.warmGlow=true;parent.add(m);return m;}
 tree(g,scale=1){this.cylinder(g,0,.6,0,.13,.19,1.2,C.bark);for(let i=0;i<3;i++){const y=1.05+i*.63,r=(1.0-i*.23)*scale;const cone=this.mesh(new T.ConeGeometry(r,1.45*scale,7),C.fir);cone.position.y=y;g.add(cone);const snow=this.mesh(new T.ConeGeometry(r*.88,1.13*scale,7),C.snow);snow.position.y=y+.21;g.add(snow);}g.rotation.y=scale;}
 cabin(g,color=C.wood,small=false){const w=small?1.15:1.7;this.box(g,0,.65,0,w,1.25,1.35,color);for(const side of [-1,1]){const roof=this.box(g,side*.42,1.45,0,1.12,.18,1.7,C.snow);roof.rotation.z=side*-.48;}this.box(g,0,.4,.694,.38,.8,.05,C.roof);for(const x of [-.57,.57])this.box(g,x,.8,.7,.25,.32,.055,C.gold);this.box(g,.55,1.75,-.3,.2,.65,.23,C.metal);this.glow(g,0,.04,1,1);}
 person(color){const g=new T.Group();this.cylinder(g,0,.11,0,.3,.3,.02,0x8dabb9);const body=this.box(g,0,.67,0,.45,.58,.3,color);this.cylinder(g,0,1.1,0,.235,.235,.3,color);this.box(g,0,1.1,.19,.28,.14,.06,0xeec49a);this.cylinder(g,0,1.03,0,.25,.25,.07,0x536b70);this.box(g,0,.91,.04,.47,.1,.35,0xc7d3c7);for(const eye of [-.075,.075])this.box(g,eye,1.13,.228,.025,.025,.018,0x344e60);this.box(g,0,.65,-.23,.34,.39,.2,0x536b70);for(const s of [-1,1]){const leg=this.box(g,s*.13,.24,0,.16,.34,.18,0x344e60);leg.name='leg'+s;const arm=this.box(g,s*.3,.65,0,.13,.4,.17,color);arm.name='arm'+s;}return g;}
 train(g){
  this.box(g,0,.48,0,2.6,.3,1.45,0x2f4656);const cab=this.box(g,-.7,1.25,0,1,1.4,1.35,C.red);cab.name='livery';this.box(g,-.7,2,0,1.3,.16,1.65,C.snow);
  const boiler=this.cylinder(g,.55,1.04,0,.53,.53,1.5,0x345665,12);boiler.rotation.z=Math.PI/2;
  this.cylinder(g,.9,1.7,0,.18,.14,.9,0x314c59);this.cylinder(g,.9,2.15,0,.27,.21,.16,0x536c76);
  this.box(g,-.7,1.5,.69,.58,.4,.04,C.gold);this.box(g,-.7,1.5,-.69,.58,.4,.04,C.gold);this.box(g,1.34,1,0,.08,.22,.32,C.gold);
  for(const x of [-.8,.05,.85])for(const z of [-.72,.72]){const wheel=this.cylinder(g,x,.35,z,.35,.35,.16,0x2c4555,12);wheel.rotation.x=Math.PI/2;const hub=this.cylinder(g,x,.35,z*1.12,.14,.14,.17,C.red);hub.rotation.x=Math.PI/2;}
  this.box(g,-3.1,1,0,2.2,1.5,1.4,0x5b7f83);this.box(g,-3.1,1.84,0,2.45,.24,1.6,C.snow);
  for(const x of [-3.7,-3,-2.4]){this.box(g,x,1.2,.72,.38,.42,.05,C.gold);this.box(g,x,.3,.65,.3,.4,.2,0x344a58);this.box(g,x,.3,-.65,.3,.4,.2,0x344a58);}this.box(g,-1.75,.45,0,.6,.12,.13,C.metal);
  this.glow(g,-1,.04,1.2,2.2);
 }
 tower(g,beacon=false){for(const x of [-.55,.55])for(const z of [-.55,.55])this.box(g,x,1.8,z,.13,3.6,.13,C.metal);for(let y=.6;y<3.4;y+=.8)this.box(g,0,y,0,1.2,.12,1.2,C.metal);this.box(g,0,3.5,0,1.5,.18,1.5,C.snow);if(beacon){this.cylinder(g,0,3.98,0,.4,.4,.7,C.gold);}else{const dish=this.mesh(new T.SphereGeometry(.7,12,6,0,Math.PI),0xcadfe6);dish.position.set(0,3.9,0);dish.rotation.z=.5;g.add(dish);}}
 makeNode(n){const g=new T.Group();
  if(n.type==='puzzle'||n.type==='drift')makeJourneyNode(this,n,g);
  else if(n.type==='project')makeRestoration(this,n,g);
  else if(n.type==='discovery')makeDiscovery(this,n,g);
  else if(n.type==='tree')this.tree(g,.85+(n.seed||.5)*.35);
  else if(n.type==='coal'){for(let i=0;i<3;i++){const rock=this.mesh(new T.DodecahedronGeometry(.45+i*.12,0),i%2?0x4b5e6b:0x657d87);rock.position.set((i-1)*.35,.3,Math.sin(i*4)*.25);rock.scale.y=.8;g.add(rock);}this.box(g,0,.65,0,.65,.08,.35,C.snow);}
  else if(n.type==='scrap'){this.box(g,0,.3,0,.9,.6,.72,C.wood);this.box(g,0,.62,0,1,.08,.8,C.snow);for(const x of [-.28,.28])this.box(g,x,.3,.37,.08,.6,.02,C.metal);const barrel=this.cylinder(g,.5,.35,-.32,.27,.27,.7,C.red);this.cylinder(g,.5,.71,-.32,.28,.28,.04,C.snow);}
  else if(n.type==='food'){for(let i=0;i<4;i++){const bush=this.mesh(new T.IcosahedronGeometry(.4,0),0x657f7c);bush.position.set(Math.sin(i*2)*.35,.25,Math.cos(i*2)*.35);g.add(bush);const berry=this.mesh(new T.IcosahedronGeometry(.1,0),0xc75e58);berry.position.set(bush.position.x,.56,bush.position.z);g.add(berry);}}
  else if(n.type==='wolf'){this.box(g,0,.45,0,.42,.4,.9,0x748c9e);this.box(g,0,.63,.5,.39,.42,.4,0x8da5b7);for(const x of [-.16,.16]){this.box(g,x,.94,.4,.1,.2,.12,0x667f94);for(const z of [-.3,.3])this.box(g,x,.17,z,.1,.4,.12,0x4b657d);}this.box(g,0,.5,.75,.22,.14,.2,0x394f62);}
  else if(n.type==='secret'){if(n.id==='vault'){this.box(g,0,.4,0,1.25,.75,1,0x7f9498);this.box(g,0,.83,0,1.35,.12,1.1,C.snow);this.box(g,0,.45,.52,.16,.22,.04,C.gold);}else{for(let i=0;i<3;i++){const stone=this.mesh(new T.DodecahedronGeometry(.35-i*.065,0),0x91a7b1);stone.position.y=.2+i*.29;g.add(stone);}const gem=this.mesh(new T.OctahedronGeometry(.12),C.gold);gem.position.y=1.05;gem.name='secretglow';g.add(gem);this.glow(g,0,.04,0,.8);}}
  else if(n.type==='home')this.train(g);
  else if(n.id==='furnace'){this.cylinder(g,0,.3,0,.6,.75,.6,0x6e8790);this.cylinder(g,0,.6,0,.38,.38,.16,0xff9750);const flame=this.mesh(new T.ConeGeometry(.27,.7,6),C.gold);flame.position.y=.97;flame.name='flame';g.add(flame);this.glow(g,0,.05,0,2.8);}
  else if(n.id==='workshop'){this.box(g,0,.7,0,1.5,.14,.8,C.wood);for(const x of [-.6,.6])this.box(g,x,.33,0,.12,.66,.66,C.metal);this.box(g,0,1,0,.4,.45,.45,C.metal);this.box(g,-.5,.82,0,.3,.1,.45,C.gold);}
  else if(n.id==='greenhouse'){this.box(g,0,.35,0,1.8,.65,1.5,C.wood);this.box(g,0,1,0,1.6,.65,1.3,0x91c5c6);for(const x of [-.6,0,.6])this.box(g,x,1,0,.08,.8,1.4,C.snow);}
  else if(n.id==='infirmary'){this.cabin(g,0x6d94a2);this.box(g,0,1.3,.76,.12,.4,.04,0xf4e9dc);this.box(g,0,1.3,.77,.4,.12,.04,0xf4e9dc);}
  else if(n.type==='survivor'){this.cabin(g,n.id==='mira'?0xb18368:0x789099,true);const person=this.person(n.id==='mira'?0x9c6067:n.id==='oren'?0x74875e:0x638fba);person.name='survivor';person.position.set(.9,0,.9);g.add(person);}
  else if(n.id==='pump'){this.cylinder(g,0,.2,0,.7,.7,.35,C.metal);this.cylinder(g,0,.8,0,.15,.15,1.2,0x87a8b2);this.box(g,.35,1.36,0,.7,.15,.15,C.red);}
  else if(n.id==='bridge'){for(let i=0;i<6;i++)this.box(g,0,.15,-i*.4,2.6,.2,.32,i===2?0xabc4ce:C.wood);for(const x of [-1.2,1.2]){this.box(g,x,.7,-1,.1,.1,2.8,C.wood);for(const z of [0,-2])this.box(g,x,.4,z,.12,.9,.12,C.wood);}}
  else this.tower(g,n.id==='beacon');
  return g;
 }
 sync(force=false){const s=this.state,seen=new Set(s.discovered);for(const n of WORLD){const g=this.objects.get(n.id);g.visible=n.type==='home'||n.type==='building'||seen.has(key(n.x,n.z));syncRestoration(s,n,g);syncJourneyNode(s,n,g);if(n.type==='secret'){g.visible=s.secretSeen.includes(n.id);const found=n.id==='vault'?s.vault:s.relics.includes(n.relic);g.scale.y=found?.65:1;}if(n.stock){const depleted=stock(s,n)<=0;g.scale.y=depleted?.1:1;if(n.type==='wolf')g.visible=g.visible&&!depleted;}if(n.type==='building'){const level=s.buildings[n.id];g.scale.setScalar(level?1+level*.08:.85);if(g.userData.foundation){g.userData.foundation.visible=!level;g.userData.built.visible=!!level;}g.userData.upgrade.visible=!!level;}if(n.id==='home'){const paint=g.getObjectByName('livery');if(paint)paint.material=this.material(LIVERIES[s.livery].color);}}
  if(force||this.lastSeen!==s.discovered.length){const ctx=this.fogMask.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,328,320);ctx.fillStyle='black';for(let z=-20;z<=19;z++)for(let x=-20;x<=20;x++)if(seen.has(key(x,z))){ctx.beginPath();ctx.arc((x+20.5)*8,(z+20.5)*8,8.5,0,Math.PI*2);ctx.fill();}const soft=this.fogSoft.getContext('2d');soft.fillStyle='white';soft.fillRect(0,0,328,320);soft.filter='blur(5px)';soft.drawImage(this.fogMask,0,0);soft.filter='none';this.fogTexture.needsUpdate=true;this.lastSeen=s.discovered.length;}
  this.art?.sync();this.journey?.sync();this.warmGlows=[];this.scene.traverse(o=>{if(o.userData.warmGlow)this.warmGlows.push(o);});this.companion.visible=!!s.companion;if(s.companion)this.companion.traverse(o=>o.userData.node={id:'crew-'+s.companion,type:'crew',crew:s.companion});
  for(const [id,person]of Object.entries(this.residents)){person.visible=!!s.flags[id]&&s.companion!==id;const remote=this.objects.get(id).getObjectByName('survivor');if(remote)remote.visible=!s.flags[id];}
 }
 finishGather(n){this.finishFX.start(n);}
 impact(n,complete=false){this.burstOrigin={x:n.x,z:n.z};this.burstLife=complete?1:.75;const profile=workProfile(n.type);this.burst.material.color.setHex(profile.color);this.burst.material.size=n.type==='food'?5:n.type==='coal'?3:4;this.recoils.set(n.id,.18);}
 setPath(points=[]){const count=Math.min(120,points.length);for(let i=0;i<count;i++){this.routePositions[i*3]=points[i][0];this.routePositions[i*3+1]=.07;this.routePositions[i*3+2]=points[i][1];}this.routeDots.geometry.setDrawRange(0,count);this.routeDots.geometry.attributes.position.needsUpdate=true;}
 updateTreeFades(dt,working){
  this.workTarget=working?.type==='tree'?working.id:null;
  this.occlusionAge+=dt;
  if(this.occlusionAge>=.1){
   this.occlusionAge=0;this.occluders.clear();this.scene.updateMatrixWorld(true);
   const target=this.hero.position.clone(),direction=new T.Vector3(15,22,18).normalize(),right=new T.Vector3(18,0,-15).normalize();
   const nearby=this.trees.filter(g=>g.visible&&stock(this.state,g.userData.node)>0&&g.position.distanceTo(target)<7);
   const ray=new T.Raycaster();ray.far=12;
   for(const [side,height]of [[0,1.05],[-.23,.65],[.23,.65]]){
    const origin=target.clone().addScaledVector(right,side);origin.y+=height;origin.addScaledVector(direction,12);ray.set(origin,direction.clone().negate());
    for(const hit of ray.intersectObjects(nearby,true)){
     if(hit.object.name==='touch-target')continue;
     const materials=Array.isArray(hit.object.material)?hit.object.material:[hit.object.material];
     if(materials.every(m=>!m.visible))continue;
     this.occluders.add(hit.object.userData.node.id);
    }
   }
  }
  const wanted=new Set(this.occluders);if(this.workTarget)wanted.add(this.workTarget);
  for(const id of wanted){
   let entry=this.treeFades.get(id);
   if(!entry){
    entry={alpha:1,lastHit:this.clock,meshes:[]};
    // GLB instances share originals. Copies are local to faded trees and are
    // disposed after recovery; no permanent material growth from exploring.
    this.objects.get(id).traverse(mesh=>{if(!mesh.isMesh||mesh.name==='touch-target')return;const source=Array.isArray(mesh.material)?mesh.material:[mesh.material];if(source.every(m=>!m.visible))return;
     const copies=source.map(m=>{const copy=m.clone();copy.onBeforeCompile=m.onBeforeCompile;copy.customProgramCacheKey=m.customProgramCacheKey;copy.transparent=true;copy.depthWrite=false;return copy;});
     entry.meshes.push({mesh,original:mesh.material,shadow:mesh.castShadow,copies,opacity:source.map(m=>m.opacity)});mesh.material=Array.isArray(mesh.material)?copies:copies[0];mesh.castShadow=false;
    });this.treeFades.set(id,entry);
   }
   entry.lastHit=this.clock;
  }
  for(const [id,entry]of this.treeFades){
   const fading=wanted.has(id)||this.clock-entry.lastHit<.25,goal=fading?.24:1;
   entry.alpha+=(goal-entry.alpha)*(1-Math.exp(-dt*(fading?12:7)));
   for(const item of entry.meshes)item.copies.forEach((m,i)=>m.opacity=item.opacity[i]*entry.alpha);
   if(!fading&&entry.alpha>.995){for(const item of entry.meshes){item.mesh.material=item.original;item.mesh.castShadow=item.shadow;item.copies.forEach(m=>m.dispose());}this.treeFades.delete(id);}
  }
 }
 select(n){this.selected=n;this.ring.visible=!!n;if(n)this.ring.position.set(n.x,.07,n.z);}
 resize(){const w=this.canvas.clientWidth,h=this.canvas.clientHeight;this.renderer.setSize(w,h,false);this.updateProjection();}
 setViewport(bounds){this.viewportTarget={...bounds};if(!this.viewport){this.viewport={...bounds};this.updateProjection();}}
 updateProjection(){const w=this.canvas.clientWidth,h=this.canvas.clientHeight,a=w/h,b=this.viewport,span=this.zoom*Math.min(1,h/700);const cx=b?(b.left+b.right)/2:w/2,cy=b?(b.top+b.bottom)/2:h/2;const sx=(.5-cx/w)*span*a,sy=(cy/h-.5)*span;this.camera.left=-span*a/2+sx;this.camera.right=span*a/2+sx;this.camera.top=span/2+sy;this.camera.bottom=-span/2+sy;this.camera.updateProjectionMatrix();}
 setZoom(value,immediate=false){this.zoomTarget=T.MathUtils.clamp(value,16,34);const changed=this.state.settings.zoom!==this.zoomTarget&&!this.photoMode;if(!this.photoMode)this.state.settings.zoom=this.zoomTarget;if(immediate){this.zoom=this.zoomTarget;this.updateProjection();}this.onCameraChange?.(changed);}
 setQuality(low){this.lowQuality=low;this.renderer.setPixelRatio(low?1:Math.min(devicePixelRatio,1.65));this.renderer.shadowMap.enabled=!low;this.resize();}
 project(x,z,y=1){const v=new T.Vector3(x,y,z).project(this.camera);return{x:(v.x+1)/2*this.canvas.clientWidth,y:(1-v.y)/2*this.canvas.clientHeight};}
 groundAt(x,y){const r=this.canvas.getBoundingClientRect();this.ray.setFromCamera(new T.Vector2((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1),this.camera);return this.ray.ray.intersectPlane(this.groundPlane,new T.Vector3());}
 bindInput(){this.controls=new DragControls(this.canvas,this);}
 pick(x,y){
  const p=this.groundAt(x,y),hits=this.ray.intersectObjects([...this.objects.values(),...Object.values(this.residents),this.companion,...Object.values(this.journey.animals)].filter(o=>o.visible),true);
  const candidates=hits.filter(h=>{if(!h.object.userData.node)return false;for(let o=h.object;o;o=o.parent)if(!o.visible)return false;return true;});
  const real=candidates.filter(h=>h.object.name!=='touch-target'),unique=[...new Map((real.length?real:candidates).map(h=>[h.object.userData.node.id,h.object.userData.node])).values()];
  if(unique.length>1)this.onChoose?.(unique);else this.onTap(unique[0]||null,p);
 }
 clampFocus(){this.focus.x=T.MathUtils.clamp(this.focus.x,-20,20);this.focus.z=T.MathUtils.clamp(this.focus.z,-20,19);}
 positionCamera(){this.camera.position.copy(this.focus).add(new T.Vector3(15,22,18));this.camera.lookAt(this.focus);this.camera.updateMatrixWorld();}
 center(){this.manual=false;this.onCameraChange?.();}
 groundDirection(x,y){const r=this.canvas.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,a=this.groundAt(cx,cy),b=this.groundAt(cx+x*100,cy+y*100);if(!a||!b)return null;const dx=b.x-a.x,dz=b.z-a.z,m=Math.hypot(dx,dz)||1;return{x:dx/m,z:dz/m};}
 lookAt(x,z){this.focus.set(x,0,z);this.manual=true;this.positionCamera();this.onCameraChange?.();}
 updateFootprints(dt,moving){
  const p=this.hero.position,d=Math.hypot(p.x-this.lastPrintPosition.x,p.z-this.lastPrintPosition.z);
  if(moving?.walking&&d<1.5){
   this.printDistance+=d;
   if(this.printDistance>=.4){
    this.printDistance%=.4;this.printSide*=-1;
    // Timber rails and the river/bridge do not take impressions like snow.
    if(!(p.z>-4.5&&p.z<-2.5)&&!(p.z>-12.2&&p.z<-9.7)){
     const print=this.prints[this.printCursor++%this.prints.length],angle=this.hero.rotation.y;
     Object.assign(print,{age:0,x:p.x+Math.cos(angle)*.14*this.printSide,z:p.z-Math.sin(angle)*.14*this.printSide,angle});
    }
   }
  }else this.printDistance=0;
  this.lastPrintPosition.copy(p);
  for(let i=0;i<this.prints.length;i++){
   const print=this.prints[i];print.age=Math.min(75,print.age+dt*(1+this.weatherBlend*1.4));const fade=print.age/75;
   this.printTransform.position.set(print.x,.008,print.z);this.printTransform.rotation.y=print.angle;
   this.printTransform.scale.set(.12*(1-fade),1,.22*(1-fade));this.printTransform.updateMatrix();this.footprints.setMatrixAt(i,this.printTransform.matrix);
   this.footprints.setColorAt(i,this.printColor.copy(this.printFresh).lerp(this.printSnow,fade));
  }
  this.footprints.instanceMatrix.needsUpdate=true;this.footprints.instanceColor.needsUpdate=true;
 }
 updateWeather(dt){
  const storm=weather(this.state).storm?1:0;
  this.weatherBlend+=(storm-this.weatherBlend)*(1-Math.exp(-dt*.35));const strength=this.weatherBlend;
  const reduced=this.state.settings.reducedMotion;const gust=.72+Math.sin(this.clock*.63)*.2+Math.sin(this.clock*1.7)*.08;
  const wind=(.45+strength*2.7)*gust;
  for(const tree of this.trees){if(!tree.visible)continue;if(reduced){tree.rotation.x=tree.rotation.z=0;continue;}const n=tree.userData.node,phase=n.x*.31+n.z*.19;
   tree.rotation.z=-(.012+strength*.026)*gust+Math.sin(this.clock*1.3+phase)*(.008+strength*.013);
   tree.rotation.x=Math.sin(this.clock*.87+phase)*(.006+strength*.012);
  }
  const light=daylight(this.state),night=light.night;this.nightBlend=night;this.sun.intensity=3.1-strength*.85-night*1.4;this.sun.color.setHex(0xffe5be).lerp(this.nightSun,night);this.hemi.intensity=2.6-night*.8;this.hemi.color.setHex(0xe9f8ff).lerp(this.nightAmbient,night);const windows=this.material(0xffc477);windows.emissive.setHex(0xffc477);windows.emissiveIntensity=.06+night*.65;this.scene.fog.density=.014+strength*.009;this.skyColor.setHex(0xb8d3df).lerp(this.nightSky,night*.65);this.scene.fog.color.copy(this.skyColor);this.renderer.setClearColor(this.skyColor);this.renderer.toneMappingExposure=1.05-night*.15;for(const glow of this.warmGlows||[])glow.material.opacity=.14+night*.23;
  this.steam.visible=!reduced;
  this.snow.geometry.setDrawRange(0,reduced?0:Math.round((this.lowQuality?90:180)*(1+strength)));
  this.snow.material.size=2.1+strength*.7;
  for(let i=0;i<360;i++){
   const j=i*3;this.snowPositions[j]+=dt*(wind+Math.sin(this.clock+i)*.15);this.snowPositions[j+1]-=dt*(.65+(i%5)*.15+strength*1.05);this.snowPositions[j+2]+=dt*wind*.3;
   if(this.snowPositions[j+1]<0){this.snowPositions[j+1]=16;this.snowPositions[j]=this.focus.x+Math.sin(i*17+this.clock)*16;this.snowPositions[j+2]=this.focus.z+Math.cos(i*9+this.clock)*16;}
   if(this.snowPositions[j]>this.focus.x+17)this.snowPositions[j]-=34;
   if(this.snowPositions[j]<this.focus.x-17)this.snowPositions[j]+=34;
   if(this.snowPositions[j+2]>this.focus.z+17)this.snowPositions[j+2]-=34;
   if(this.snowPositions[j+2]<this.focus.z-17)this.snowPositions[j+2]+=34;
  }
  this.snow.geometry.attributes.position.needsUpdate=true;
  for(let i=0;i<24;i++){const p=(this.clock*.12+i/24)%1;this.steamPositions[i*3]=.9+p*(.65+wind*.65)+Math.sin(i*2+this.clock)*p*.12;this.steamPositions[i*3+1]=2.2+p*(3-strength*.6);this.steamPositions[i*3+2]=-3+p*wind*.2+Math.sin(i)*p*.3;}
  this.steam.geometry.attributes.position.needsUpdate=true;
 }
 update(dt,moving,working){const animationDt=this.photoMode?0:dt;this.clock+=animationDt;const s=this.state;const target=new T.Vector3(s.player.x,0,s.player.z);if(moving)target.set(moving.x,0,moving.z);this.hero.position.copy(target);if(moving?.angle!==undefined)this.hero.rotation.y=moving.angle;
  const pace=moving?.walking?Math.sin(this.clock*14):Math.sin(this.clock*2)*.04;this.hero.position.y=!s.settings.reducedMotion&&moving?.walking?Math.abs(pace)*.07:0;for(const sign of [-1,1]){this.hero.getObjectByName('leg'+sign).rotation.x=pace*sign*.6;this.hero.getObjectByName('arm'+sign).rotation.x=working?(workProfile(working.node.type).tool?-.4+Math.cos((working.progress-.2)/.3*Math.PI*2)*1.2:Math.sin(working.progress*Math.PI*6)*.35-.65):pace*-sign*.4;}
  this.companion.position.lerp(target.clone().add(new T.Vector3(-.8,0,.7)),animationDt*3);this.companion.rotation.y=this.hero.rotation.y;
  const profile=working?workProfile(working.node.type):null;this.tool.visible=!!profile?.tool;for(const [id,tool]of Object.entries(this.tools))tool.visible=id===profile?.tool;
  this.workRing.visible=!!working;if(working){this.workRing.position.set(working.node.x,.1,working.node.z);this.workRing.geometry.setDrawRange(0,Math.max(6,Math.floor(working.progress*60)*6));}this.art.update(animationDt,moving);this.journey.update();this.finishFX.update(animationDt);if(s.settings.reducedMotion)this.finishFX.root.visible=false;this.waypointMark.visible=!!s.camp.waypoint;if(s.camp.waypoint)this.waypointMark.position.set(s.camp.waypoint.x,0,s.camp.waypoint.z);
  if(this.burstLife>0){this.burstLife=Math.max(0,this.burstLife-animationDt*1.8);const p=1-this.burstLife;for(let i=0;i<28;i++){const a=i*2.4,r=p*(.5+(i%7)*.14);this.burstPositions[i*3]=this.burstOrigin.x+Math.cos(a)*r;this.burstPositions[i*3+1]=.4+Math.sin(p*Math.PI)*(.5+(i%4)*.2);this.burstPositions[i*3+2]=this.burstOrigin.z+Math.sin(a)*r;}this.burst.geometry.attributes.position.needsUpdate=true;this.burst.material.opacity=s.settings.reducedMotion?0:this.burstLife;}
  if(!this.manual){const aim=target.clone();if(this.selected)aim.lerp(new T.Vector3(this.selected.x,0,this.selected.z),.65);const homeBias=this.selected?0:Math.max(0,1-Math.hypot(target.x,target.z-1)/10);aim.add(new T.Vector3(-1.2*homeBias,0,-.5-1.7*homeBias));this.focus.lerp(aim,1-Math.exp(-dt*4));}if(Math.abs(this.zoom-this.zoomTarget)>.005){this.zoom+=(this.zoomTarget-this.zoom)*(1-Math.exp(-dt*10));this.updateProjection();}if(this.viewport&&this.viewportTarget){let changed=false;for(const key of ['left','right','top','bottom']){const delta=this.viewportTarget[key]-this.viewport[key];if(Math.abs(delta)>.05){this.viewport[key]+=delta*(1-Math.exp(-dt*7));changed=true;}}if(changed)this.updateProjection();}this.positionCamera();
  this.updateWeather(animationDt);this.updateTreeFades(dt,working?.node);this.updateFootprints(animationDt,moving);
  for(const [id,left]of this.recoils){const node=this.objects.get(id),remaining=Math.max(0,left-animationDt),kick=(s.settings.reducedMotion?0:1)*Math.sin(remaining/.18*Math.PI*3)*remaining*.22;if(node.userData.node.type==='tree')node.rotation.z+=kick;else node.rotation.z=kick;if(remaining)this.recoils.set(id,remaining);else this.recoils.delete(id);}
  if(this.destination.visible)this.destination.scale.setScalar(1+(s.settings.reducedMotion?0:Math.sin(this.clock*5)*.12));
  const f=this.objects.get('furnace').getObjectByName('flame');f.scale.setScalar(1+(s.settings.reducedMotion?0:Math.sin(this.clock*8)*.15));this.ring.scale.setScalar(1+(s.settings.reducedMotion?0:Math.sin(this.clock*3)*.03));this.renderer.render(this.scene,this.camera);
 }
}
