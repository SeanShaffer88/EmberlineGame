// One finger steers. Two fingers inspect the camera. UI taps never become motion.
export class DragControls {
 constructor(canvas,view){
  this.view=view;this.canvas=canvas;this.points=new Map();this.multi=false;this.tap=null;
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  canvas.addEventListener('pointerdown',e=>{
   if(!view.inputEnabled?.())return;
   e.preventDefault();this.tap=null;canvas.setPointerCapture(e.pointerId);
   this.points.set(e.pointerId,{x:e.clientX,y:e.clientY,ax:e.clientX,ay:e.clientY,drag:false,pan:e.button===2||e.button===1||e.shiftKey});
   if(this.points.size>1){this.multi=true;this.stop();for(const p of this.points.values())p.drag=true;}
  });
  canvas.addEventListener('pointermove',e=>{
   const p=this.points.get(e.pointerId);if(!p)return;
   if(this.points.size===2){
    const before=this.pinch(),anchor=view.groundAt(before.x,before.y)?.clone();p.x=e.clientX;p.y=e.clientY;const after=this.pinch();
    if(before.d>8&&after.d>8)view.setZoom(view.zoom*before.d/after.d,true);
    const next=view.groundAt(after.x,after.y);if(anchor&&next)view.focus.add(anchor.sub(next));view.manual=true;view.clampFocus();view.positionCamera();view.onCameraChange?.();return;
   }
   if(this.multi){p.x=e.clientX;p.y=e.clientY;return;}
   const dx=e.clientX-p.ax,dy=e.clientY-p.ay,m=Math.hypot(dx,dy);if(m>8)p.drag=true;
   if(p.pan&&p.drag){const a=view.groundAt(p.x,p.y),b=view.groundAt(e.clientX,e.clientY);if(a&&b){view.focus.add(a.sub(b));view.manual=true;view.clampFocus();view.positionCamera();view.onCameraChange?.();}}
   else if(p.drag){
    if(m>90){p.ax=e.clientX-dx/m*90;p.ay=e.clientY-dy/m*90;}
    view.onDrag?.(m>8?{x:dx/m,y:dy/m,speed:Math.min(1,(m-8)/48)}:null);
    const guide=document.getElementById('drag-guide');if(guide){guide.hidden=false;guide.style.left=p.ax+'px';guide.style.top=p.ay+'px';guide.firstElementChild.style.transform=`translate(${dx/(m||1)*Math.min(m,42)}px,${dy/(m||1)*Math.min(m,42)}px)`;}
   }
   p.x=e.clientX;p.y=e.clientY;
  });
  canvas.addEventListener('pointerup',e=>{const p=this.points.get(e.pointerId);if(!p)return;this.tap=!p.drag&&!p.pan&&!this.multi?{x:e.clientX,y:e.clientY}:null;this.points.delete(e.pointerId);this.stop();if(!this.points.size)this.multi=false;});
  canvas.addEventListener('click',()=>{if(!this.tap||!view.inputEnabled?.())return;const p=this.tap;this.tap=null;view.pick(p.x,p.y);});
  for(const event of ['pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{if(this.points.has(e.pointerId))this.reset();});
  window.addEventListener('blur',()=>this.reset());
  canvas.addEventListener('wheel',e=>{if(!view.inputEnabled?.())return;e.preventDefault();view.setZoom(view.zoomTarget+e.deltaY*.012);},{passive:false});
 }
 pinch(){const [a,b]=[...this.points.values()];return{x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.hypot(a.x-b.x,a.y-b.y)};}
 stop(){this.view.onDrag?.(null);const guide=document.getElementById('drag-guide');if(guide)guide.hidden=true;}
 reset(){this.points.clear();this.multi=false;this.tap=null;this.stop();}
}
