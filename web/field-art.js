import * as T from './vendor/three.module.js';
import {SPECIMENS,VISTAS,SIGNS,POND,fieldSeen} from './field.js';
import {daylight} from './camp.js';

export function makeFieldNode(v,n,g){
 const wood=0x987452,stone=0x819ba5;
 if(n.field==='notebook'){
  const p=SPECIMENS[n.entry];g.userData.specimen=p.shape;
  const base=v.mesh(new T.CircleGeometry(.48,12),0xc8dcd9);base.rotation.x=-Math.PI/2;base.position.y=.07;g.add(base);
  if(p.shape==='crystal'||p.shape==='fossil')for(let i=0;i<3;i++){const m=v.mesh(new T.OctahedronGeometry(.2+i*.04),p.shape==='crystal'?0xa4d4d9:0xbea784);m.scale.y=p.shape==='crystal'?2:0.6;m.position.set((i-1)*.2,.25,0);m.rotation.z=(i-1)*.25;g.add(m);}
  else if(p.shape==='feather'){for(let i=0;i<5;i++){const m=v.box(g,(i-2)*.08,.15+i*.02,0,.18,.025,.3-i*.03,0xa16f55);m.rotation.y=.5;}v.box(g,0,.18,0,.48,.025,.035,0xe2d9bb);}
  else if(p.shape==='cone'){for(let i=0;i<4;i++)v.cylinder(g,0,.1+i*.1,0,.17-i*.03,.2-i*.035,.13,wood,6);}
  else if(p.shape==='lichen'){v.box(g,0,.16,0,.65,.25,.45,stone);for(let i=0;i<5;i++)v.box(g,(i-2)*.09,.3,Math.sin(i)*.12,.1,.025,.12,0xc1aa56);}
  else{for(let i=0;i<3;i++){v.cylinder(g,(i-1)*.16,.23,0,.025,.04,.4,0x77937b);const m=v.mesh(new T.IcosahedronGeometry(.12),p.shape==='mushroom'?0xad815d:p.shape==='flower'?0xab8dac:0x8eae97);m.position.set((i-1)*.16,.42,0);m.scale.y=.5;g.add(m);}}
 }else if(n.field==='viewpoints'){
  v.box(g,0,.13,0,.85,.25,.7,stone);v.box(g,0,.28,0,.6,.06,.5,0xdce7db);v.cylinder(g,0,.38,0,.15,.15,.12,0xb6a16f);v.box(g,0,.45,0,.3,.025,.045,0x526d78);
 }else if(n.field==='trailworks'){
  v.box(g,0,.7,0,.12,1.4,.12,wood);const sign=v.box(g,0,1.2,0,.95,.35,.09,0xb8996f);sign.rotation.z=.22;sign.name='field-sign-board';
 }else{
  v.box(g,0,.1,0,.75,.16,.6,wood);v.box(g,.38,.38,.12,.3,.45,.32,0x8b6f58);v.cylinder(g,-.25,.5,0,.02,.025,.9,0x677e8a);v.box(g,0,.15,.3,.7,.045,.08,0xd9e8e5);
 }
}
export class FieldArt{
 constructor(v){
  this.v=v;this.root=new T.Group();v.scene.add(this.root);this.benches={};this.assets=[];
  this.cabinet=new T.Group();this.cabinet.position.set(-5.7,0,-1.4);this.root.add(this.cabinet);
  v.box(this.cabinet,0,.6,0,1.6,1.15,.55,0x8d6d51);v.box(this.cabinet,0,.7,.3,1.42,.87,.035,0x3e5c62);for(const y of [.36,.76,1.15])v.box(this.cabinet,0,y,.42,1.58,.07,.65,0xc4a47c);v.box(this.cabinet,0,1.23,0,1.85,.12,.8,0xd7e6de);
  this.display=[];for(let i=0;i<8;i++){const m=v.mesh(new T.IcosahedronGeometry(.12),[0xa58db1,0x8db99b,0xb88862,0xb7996b,0x876a4c,0x99d2dd,0xc6b45f,0xd7bea1][i]);m.position.set((i%4-1.5)*.34,i<4?.51:.91,.45);this.cabinet.add(m);this.display.push(m);}
  for(const [id,p]of Object.entries(VISTAS)){const g=new T.Group();g.position.set(p.x+.7,0,p.z+.55);v.box(g,0,.4,0,.9,.12,.4,0xb08b63);v.box(g,0,.7,-.16,.9,.5,.08,0x9b7c59);for(const x of [-.34,.34])v.box(g,x,.2,0,.09,.4,.3,0x627d85);this.root.add(g);this.benches[id]=g;}
  this.bridgeLights=new T.Group();this.root.add(this.bridgeLights);for(const x of [.8,3.2])for(const z of [-9.6,-12.4]){v.box(this.bridgeLights,x,.72,z,.07,1.4,.07,0x66808b);v.box(this.bridgeLights,x,1.5,z,.22,.3,.22,0xffc477);v.box(this.bridgeLights,x,1.69,z,.32,.07,.32,0x597582);v.glow(this.bridgeLights,x,.13,z,.65);}
  this.table=new T.Group();this.table.position.set(-1.8,0,.65);this.root.add(this.table);v.box(this.table,0,.55,0,1.3,.14,.75,0x9d805e);for(const x of [-.48,.48])v.box(this.table,x,.25,0,.1,.5,.55,0x73878a);v.box(this.table,0,.66,0,1.1,.035,.56,0xc8c0a2);
  const iceGeo=new T.RingGeometry(.65,.7,36);iceGeo.rotateX(-Math.PI/2);this.ice=new T.Mesh(iceGeo,new T.MeshBasicMaterial({color:0xd4f4f5,transparent:true,opacity:.4,depthWrite:false}));this.ice.position.set(POND.x,.14,-10.9);this.root.add(this.ice);
  this.pool=new T.Mesh(new T.CircleGeometry(.65,32),new T.MeshStandardMaterial({color:0x46899d,roughness:.24,metalness:.12}));this.pool.rotation.x=-Math.PI/2;this.pool.position.set(POND.x,.12,-10.9);this.root.add(this.pool);
  this.ripples=[];for(let i=0;i<3;i++){const r=new T.Mesh(iceGeo,new T.MeshBasicMaterial({color:0xc5ebec,transparent:true,opacity:.25,depthWrite:false}));r.position.copy(this.ice.position);r.position.y+=.01;this.root.add(r);this.ripples.push(r);}
  const verts=[];for(let i=0;i<=48;i++){const x=-26+i*52/48;verts.push(x,8+Math.sin(i*.22)*1.7,-24, x,13+Math.sin(i*.22)*1.7,-24);}
  const indices=[];for(let i=0;i<48;i++)indices.push(i*2,i*2+1,i*2+2,i*2+1,i*2+3,i*2+2);
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(verts,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  this.aurora=new T.Mesh(geometry,new T.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,side:T.DoubleSide,uniforms:{time:{value:0},strength:{value:0}},vertexShader:'varying vec2 p; void main(){p=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float time; uniform float strength; varying vec2 p; void main(){float bands=.5+.5*sin(p.x*.52+sin(p.x*.19+time*.12)*1.5); float edge=smoothstep(7.,10.,p.y)*(1.-smoothstep(11.,15.,p.y)); gl_FragColor=vec4(mix(vec3(.24,.9,.62),vec3(.66,.48,.9),bands),edge*bands*strength); }'}));this.aurora.frustumCulled=false;this.root.add(this.aurora);
  const trackGeo=new T.CircleGeometry(1,6);trackGeo.rotateX(-Math.PI/2);this.tracks=new T.InstancedMesh(trackGeo,new T.MeshBasicMaterial({color:0x789aaa,transparent:true,opacity:.35,depthWrite:false}),48);this.tracks.frustumCulled=false;this.root.add(this.tracks);this.trackMatrix=new T.Object3D();
 }
 installAssets(art){
  const v=this.v;
  for(const [id,p]of Object.entries(SPECIMENS)){const asset={flower:'violet',fern:'fern',mushroom:'mushrooms'}[p.shape];if(asset){const g=v.objects.get('specimen-'+id),m=art.model(asset,.5);if(m){g.clear();g.add(m);g.traverse(o=>o.userData.node=g.userData.node);this.assets.push(asset);}}}
  for(const id of Object.keys(SIGNS)){const g=v.objects.get('sign-'+id),m=art.model('trailSign',1.3);if(m){g.clear();m.name='field-sign-board';g.add(m);g.traverse(o=>o.userData.node=g.userData.node);this.assets.push('trailSign');}}
  for(const [id,x,z,size]of [['stewPot',-.32,-.1,.4],['soupBowl',.25,.16,.23],['teaCup',.44,-.2,.23],['breadLoaf',-.3,.23,.28],['campMug',.08,-.23,.19]]){const g=art.add(id,this.table,size,x,.69,z,'max');if(g)this.assets.push(id);}
  const nook=v.objects.get('fishing-nook');this.catchModel=art.add('caughtFish',nook,.3,.38,.62,.12,'max',Math.PI/2);if(this.catchModel){this.assets.push('caughtFish');this.catchModel.traverse(o=>o.userData.node=nook.userData.node);}
 }
 sync(){
  const s=this.v.state,f=s.field;this.cabinet.visible=f.builds.includes('cabinet');this.display.forEach((m,i)=>m.visible=i<f.specimens.length);this.table.visible=s.buildings.furnace>0;
  if(this.catchModel)this.catchModel.visible=f.casts>0;this.bridgeLights.visible=f.builds.includes('bridgeLights');
  for(const [id,g]of Object.entries(this.benches))g.visible=f.benches.includes(id);
  for(const id of Object.keys(SIGNS)){const g=this.v.objects.get('sign-'+id)?.getObjectByName('field-sign-board');if(g)g.rotation.z=f.signs.includes(id)?0:.22;}
  const known=fieldSeen(s,POND);this.pool.visible=this.ice.visible=known;for(const r of this.ripples)r.visible=known;
 }
 update(){
  const v=this.v,s=v.state,t=s.settings.reducedMotion?0:v.clock,night=daylight(s).night;
  this.aurora.visible=night>.45&&v.weatherBlend<.7&&!v.lowQuality;this.aurora.material.uniforms.time.value=t;this.aurora.material.uniforms.strength.value=Math.max(0,(night-.45)*.7)*(1-v.weatherBlend);
  this.ice.material.opacity=.35+Math.sin(t*.9)*.08;this.ripples.forEach((r,i)=>{const phase=(t*.19+i/3)%1;r.scale.setScalar(.12+phase*.85);r.material.opacity=s.settings.reducedMotion?.12:(1-phase)*.26;});
  let n=0;for(const [id,animal]of Object.entries(v.journey.animals)){if(!animal.visible||id==='hare')continue;const p=animal.position,ang=animal.rotation.y;for(let i=0;i<12;i++){const dist=.2+i*.15,x=p.x-Math.sin(ang)*dist+Math.cos(ang)*(i%2?.07:-.07),z=p.z-Math.cos(ang)*dist-Math.sin(ang)*(i%2?.07:-.07);if(!s.discovered.includes(`${Math.round(x)},${Math.round(z)}`))continue;const m=this.trackMatrix;m.position.set(x,.05,z);m.rotation.y=ang;m.scale.set(id==='bird'?.035:.055,1,id==='bird'?.075:.085);m.updateMatrix();this.tracks.setMatrixAt(n++,m.matrix);}}
  this.tracks.count=n;this.tracks.instanceMatrix.needsUpdate=true;
  const acknowledge=s.activeSeconds-s.field.whistleAt<2;for(const p of Object.values(v.residents))if(p.visible&&acknowledge)p.rotation.y=Math.atan2(-p.position.x,-3-p.position.z);
 }
}
