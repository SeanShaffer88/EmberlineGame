import * as T from './vendor/three.module.js';
import {nearbyResource,finishGesture} from './harvest-feel.js';
import {snowSurface} from './life-motion.js';

// Final local-joint detail. It never alters player x/z, controls, work timing,
// costs or routes. Gesture priority: work > finish > weather > social > idle.
export class CharacterDetail{
 constructor(v,rig){
  this.v=v;this.r=rig;this.hands=[];this.finished=-Infinity;this.mode='idle';
  for(const side of [-1,1]){
   const shoulder=rig.root.getObjectByName('arm'+side),sleeve=rig.root.getObjectByName('sleeve'+side);
   const upper=v.box(shoulder,0,-.1,0,.13,.2,.17,0xffffff);upper.material=sleeve.material;
   const elbow=new T.Group();elbow.name='elbow'+side;elbow.position.y=-.2;shoulder.add(elbow);elbow.add(sleeve);sleeve.position.y=-.1;
   const old=sleeve.geometry;sleeve.geometry=new T.BoxGeometry(.13,.2,.17);old.dispose();
   const wrist=new T.Group();wrist.name='wrist'+side;wrist.position.y=-.2;elbow.add(wrist);v.box(wrist,0,-.025,.02,.15,.11,.17,0x614d42);v.box(wrist,-side*.07,0,.04,.06,.07,.07,0x77604c);
   this.hands.push({elbow,wrist,side});
  }
  this.berry=v.mesh(new T.IcosahedronGeometry(.065),0xc75e58);this.berry.position.set(0,-.055,.09);this.hands[0].wrist.add(this.berry);this.berry.visible=false;
  const node=rig.root.userData.node;if(node)rig.root.traverse(o=>o.userData.node=node);
 }
 finish(){this.finished=this.v.clock;}
 update(dt,moving,working){
  const v=this.v,r=this.r,p=r.root,s=v.state,t=v.clock,hero=r.id==='ash',reduced=s.settings.reducedMotion,walking=r.weight>.05;
  for(const {elbow,wrist}of this.hands){elbow.rotation.set(0,0,0);wrist.rotation.set(0,0,0);}
  this.berry.visible=false;r.torso.scale.y=1;this.mode='idle';
  for(const leg of r.legs)leg.ankle.position.y=-.16;
  if(reduced)return;
  const [left,right]=this.hands;
  // Flexed elbows counterbalance a stride; mitten pivots keep tools readable.
  for(const h of this.hands){h.elbow.rotation.x=-.12-Math.max(0,Math.sin(r.phase)*h.side)*r.weight*.2;h.wrist.rotation.z=Math.sin(r.phase)*r.weight*.08*h.side;}
  if(walking){
   const bridge=s.flags.bridge&&Math.abs(p.position.x-2)<1.1&&p.position.z<-9.5&&p.position.z>-12.5;
   for(const leg of r.legs){if(bridge){leg.knee.rotation.x+=Math.max(0,Math.sin(r.phase)*leg.side)*.18*r.weight;leg.ankle.position.y+=Math.max(0,Math.sin(r.phase)*leg.side)*.045*r.weight;}
    else if(snowSurface(p.position.x,p.position.z))leg.ankle.position.y-=Math.max(0,Math.sin(r.phase)*leg.side)*.035*r.weight;}
  }else r.torso.scale.y=1+Math.sin(t*2.1+r.seed)*.009;
  if(hero&&working){
   const u=working.progress,stroke=Math.cos((u-.2)/.3*Math.PI*2),envelope=Math.min(1,u*10,(1-u)*10),type=working.node.type;
   this.mode=type;
   if(type==='tree'){left.elbow.rotation.x=-.7*envelope;left.wrist.rotation.z=-.45*envelope;right.elbow.rotation.x=-(.25+(1-stroke)*.27)*envelope;}
   if(type==='coal'){right.elbow.rotation.x=-(.15+(1-stroke)*.5)*envelope;left.elbow.rotation.x=-.9*envelope;r.arms[1].rotation.z=.14*envelope;}
   if(type==='scrap'){r.torso.rotation.y+=.18*envelope;r.arms[1].rotation.z=-.3*envelope;right.elbow.rotation.x=-.65*envelope;left.elbow.rotation.x=-.8*envelope;left.wrist.rotation.y=.55*envelope;}
   if(type==='food'){left.elbow.rotation.x=-1.1*envelope;left.wrist.rotation.x=-.4*envelope;right.elbow.rotation.x=-(.35+(1-stroke)*.2)*envelope;right.wrist.rotation.y=Math.sin(u*6*Math.PI)*.25*envelope;this.berry.visible=u>.35;}
   right.wrist.rotation.x=(type==='food'?.12:.3)*Math.max(0,stroke)*envelope;return;
  }
  const finish=finishGesture(t-this.finished);
  if(hero&&(finish.stow||finish.nod)&&!walking){this.mode='stow';r.arms[1].rotation.x=.6*finish.stow;r.arms[1].rotation.z=-.5*finish.stow;right.elbow.rotation.x=-.7*finish.stow;r.head.rotation.x+=.2*finish.nod;return;}
  if(hero&&v.weatherBlend>.55&&!working){this.mode='shield';r.arms[0].rotation.x=-1.4*v.weatherBlend;left.elbow.rotation.x=-.7*v.weatherBlend;left.wrist.rotation.z=-.3;r.head.rotation.x=.13*v.weatherBlend;return;}
  if(r.id==='companion'&&!walking){const n=nearbyResource(s,3);if(n&&Math.sin(t*.6)>0.6){this.mode='point';r.arms[1].rotation.x=-1.35;right.elbow.rotation.x=-.12;r.head.rotation.y=Math.max(-.5,Math.min(.5,Math.atan2(n.x-p.position.x,n.z-p.position.z)-p.rotation.y));return;}}
  if(hero&&!walking&&!working){const idle=v.details.idle,u=(idle-16)/2;
   if(u>0&&u<1&&idle<18){this.mode='boot-shake';r.legs[1].hip.rotation.x=-.32*Math.sin(u*Math.PI);r.legs[1].knee.rotation.x=.65*Math.sin(u*Math.PI);r.legs[1].ankle.rotation.z=Math.sin(u*Math.PI*8)*.2;r.arms[0].rotation.z=-.25*Math.sin(u*Math.PI);return;}
  }
  const routine=p.userData.routine;
  if(!hero&&r.id!=='companion'&&p.visible&&!routine?.walking&&routine?.pose==='rest'&&!p.userData.greeting){
   const peers=v.inhabitants.people.filter(other=>other!==r&&other.root.visible&&other.root.userData.routine?.pose==='rest'&&!other.root.userData.routine?.walking&&Math.hypot(other.root.position.x-p.position.x,other.root.position.z-p.position.z)<3);
   if(peers.length){const ids=[r,...peers].map(a=>a.id).sort(),speaker=ids[Math.floor(s.activeSeconds/4)%ids.length]===r.id,peer=peers[0].root;
    this.mode=speaker?'speaking':'listening';const target=Math.atan2(peer.position.x-p.position.x,peer.position.z-p.position.z)-p.rotation.y;r.head.rotation.y=Math.max(-.6,Math.min(.6,Math.atan2(Math.sin(target),Math.cos(target))));
    r.head.rotation.x=speaker?Math.sin(t*4)*.045:.1+Math.sin(t*2)*.055;
    if(speaker){r.arms[0].rotation.x=-.55+Math.sin(t*3)*.16;left.elbow.rotation.x=-.7;left.wrist.rotation.y=.4+Math.sin(t*2)*.18;}
   }
  }
 }
}
