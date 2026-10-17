import {WORDS,text} from './curriculum-model.js';
import {DIRECT_LABELS,gestureValue,forceGesture,vectorGesture,guidePoint,loadIsOutside,quantize,withinDrop} from './direct-input-model.js';

export function createSceneInteraction({THREE,curriculum,targets,camera,canvas,controls,forceUnit,previewCart}){
 const language=document.documentElement.lang==='en'?'en':'ko',L=DIRECT_LABELS[language],root=document.createElement('div');
 root.id='scene-interaction';root.setAttribute('aria-label',language==='en'?'Manipulate the apparatus':'장면에서 기구 조작');document.getElementById('ui').append(root);
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('scene-guides');svg.setAttribute('aria-hidden','true');svg.innerHTML='<defs><marker id="gesture-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 8 4 0 8" fill="#477658"/></marker></defs><path class="gesture-path" marker-end="url(#gesture-arrow)"/><circle class="gesture-drop" r="25"/>';root.append(svg);
 const path=svg.querySelector('path.gesture-path'),drop=svg.querySelector('circle'),prompt=document.createElement('div');prompt.className='scene-gesture-prompt';prompt.setAttribute('role','status');root.append(prompt);
 const predictionJump=document.createElement('button');predictionJump.type='button';predictionJump.className='scene-jump';predictionJump.id='scene-prediction-first';predictionJump.textContent=L.predictionFirst;predictionJump.hidden=true;predictionJump.onclick=()=>document.getElementById('course-frame-prediction')?.focus();root.append(predictionJump);
 const nodes=new Map(),ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let drag=null,current=[],signature='',lastHint='',keyboard=null;
 const vec=a=>new THREE.Vector3(...a),world=s=>s.object.localToWorld(vec(s.offset||[0,0,0])),destination=s=>s.dropObject?.localToWorld(vec(s.dropOffset||[0,0,0]));
 function project(v){const rect=canvas.getBoundingClientRect(),p=v.clone().project(camera);return {x:rect.left+(p.x+1)*rect.width/2,y:rect.top+(1-p.y)*rect.height/2,z:p.z};}
 function point(event,d){const rect=canvas.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2);ray.setFromCamera(pointer,camera);const normal=d.spec.plane==='table'?new THREE.Vector3(0,1,0):new THREE.Vector3(0,0,1),plane=new THREE.Plane().setFromNormalAndCoplanarPoint(normal,d.anchor);return ray.ray.intersectPlane(plane,new THREE.Vector3());}
 const local=(p,s)=>s.coordinateObject?s.coordinateObject.worldToLocal(p.clone()):p;
 const needsRemoval=(s,c)=>s.removeKey&&c.inputs[s.removeKey]>(c.frame.inputs[s.removeKey]??c.inputs[s.removeKey]);
 function guideEnd(s,c){const a=world(s);if(needsRemoval(s,c)){const p=local(a,s);p.y=(s.removeFloor??-1.4)-.2;return s.coordinateObject?s.coordinateObject.localToWorld(p):p;}if(s.kind==='remove'||s.kind==='remove-sample')return a.add(new THREE.Vector3(-1.5,.15,0));const dest=destination(s);if(dest)return dest;const control=c.activity.controls.find(x=>x.key===s.key),start=local(a,s),unknown=/몇|빈칸|\?/.test(text(c.frame.title,language)),p=guidePoint(s,control,c.inputs,c.frame.inputs,start,forceUnit(),{unknown}),end=new THREE.Vector3(p.x,p.y,p.z);return s.coordinateObject?s.coordinateObject.localToWorld(end):end;}
 function priority(s,c){const goal=c.frame.inputs,v=c.inputs;if(s.kind==='action')return -100;if(s.kind==='bag')return -90;if(s.kind==='remove-sample'&&c.frame.empty&&c.placed)return -80;if(s.kind==='sample'&&(!c.placed||v.object!==goal.object)&&s.value===(goal.object??v.object))return -80;if(s.key==='eye'&&v.eye!==1)return -70;if(needsRemoval(s,c)||s.kind==='remove'&&v[s.key]>(goal[s.key]??v[s.key]))return -65;if(s.kind==='supply'&&v[s.key]<(goal[s.key]??v[s.key]))return -60;if(s.kind==='vector'&&(v[s.key]!==goal[s.key]||v[s.angleKey]!==goal[s.angleKey])||s.directionKey&&v[s.directionKey]!==goal[s.directionKey])return -50;if(s.key&&Object.hasOwn(goal,s.key)&&v[s.key]!==goal[s.key])return -50;return ['progress','observe','push','draw','vector','parallel-vector'].includes(s.kind)?-10:s.kind==='range'?-5:s.kind==='choice'?0:20;}
 function name(s){if(s.kind==='sample')return text(WORDS[s.value]||s.value,language)+' · '+(language==='en'?'Drag to the hook or pan':'잡고 끌어 놓기');return L[s.id]||L[s.action]||L[s.kind==='supply'?'load':s.kind==='remove-sample'||s.kind==='remove'?'remove':s.kind]||L.grab;}
 function hint(s,c){if(needsRemoval(s,c))return L.remove;const control=c.activity.controls.find(x=>x.key===s.key),value=s.key?c.inputs[s.key]:null;const shown=control?.options?text(WORDS[control.options.find(([v])=>v===value)?.[1]]||String(value),language):value;return (s.kind==='action'?(language==='en'?'Tap · ':'누르기 · '):'')+name(s)+(value!==null?' · '+text(WORDS[control.label]||control.label,language)+' '+shown+(control?.unit?' '+control.unit:''):'');}
 function restorePreview(d){if(d.frozen){d.spec.freezeObject.quaternion.copy(d.frozen);d.spec.freezeObject.updateMatrixWorld(true);}if(d.original&&d.spec.object.parent){d.spec.object.position.copy(d.original);d.spec.object.updateMatrixWorld();}previewCart(null);}
 function begin(s,event,method='pointer'){
  if(drag||!curriculum.directBegin())return;event?.preventDefault();event?.stopPropagation();const anchor=world(s),snapshot=curriculum.directContext();
  drag={tapObservation:nodes.get(s.id)?.dataset.observe==='true'&&snapshot.ready,frozen:s.freezeObject?.quaternion.clone(),spec:s,anchor,ctx:snapshot,inputs:{...snapshot.inputs},start:anchor.clone(),end:anchor.clone(),startClient:event?{x:event.clientX,y:event.clientY}:project(anchor),lastClient:event?{x:event.clientX,y:event.clientY}:project(anchor),pointerId:event?.pointerId,method,moved:false,original:s.dragObject?s.object.position.clone():null,objectWorld:s.dragObject?s.object.getWorldPosition(new THREE.Vector3()):null,progress:0,changes:{}};
  if(event){const p=point(event,drag);if(p)drag.start.copy(p);nodes.get(s.id)?.setPointerCapture?.(event.pointerId);}
  controls.enabled=false;document.body.classList.add('scene-dragging');nodes.get(s.id)?.setAttribute('aria-grabbed','true');prompt.textContent=L.release;
 }
 function moveTo(p,client){
  const d=drag;if(!d||!p)return;d.end.copy(p);d.lastClient=client;const delta=p.clone().sub(d.start);d.moved=d.moved||Math.hypot(client.x-d.startClient.x,client.y-d.startClient.y)>3;
  if(d.frozen){d.spec.freezeObject.quaternion.copy(d.frozen);d.spec.freezeObject.updateMatrixWorld(true);}const s=d.spec,c=d.ctx,control=c.activity.controls.find(x=>x.key===s.key),start=local(d.start,s),end=local(p,s);let changes={},progress=s.progress??1;
  if(s.kind==='push'){changes=forceGesture(c.id,c.activity.controls,d.inputs,delta.x,-delta.z,forceUnit());previewCart({x:Math.max(-.22,Math.min(.22,delta.x)),z:Math.max(-.15,Math.min(.15,delta.z))});}
  else if(s.kind==='draw'){const unit=forceUnit(),direction=delta.x<0?-1:1,magnitude=Math.max(1,Math.min(4,Math.round(Math.abs(delta.x)/unit)));changes={direction,magnitude};curriculum.directAction('draw',[.5,.5,.5+direction*magnitude*.075,.5]);d.drawingMagnitude=magnitude;}
  else if(s.kind==='orbit'){const angle=(Math.atan2(end.y-1.6,end.x)*180/Math.PI+360)%360;changes[s.key]=control.options.map(([v])=>v).reduce((a,b)=>Math.abs(((b-angle+540)%360)-180)<Math.abs(((a-angle+540)%360)-180)?b:a);}
  else if(s.kind==='vector'){const value=vectorGesture(control,c.activity.controls.find(c=>c.key===s.angleKey),end.x,end.z,s.unit);changes={[s.key]:value.magnitude,[s.angleKey]:value.angle};}
  else if(s.kind==='parallel-vector')changes={[s.key]:quantize(control,Math.abs(end.x)/s.unit),[s.directionKey]:end.x<0?'opposite':'same'};
  else if(s.kind==='progress'){d.progress=Math.max(0,Math.min(1,(end[s.axis||'y']-start[s.axis||'y'])/s.travel));progress=d.progress;}
  else if(control)changes[s.key]=gestureValue(s,control,d.inputs,start,end);
  d.changes=changes;curriculum.directSet(changes,progress);
  if(s.dragObject&&d.objectWorld){const next=d.objectWorld.clone().add(delta);s.object.parent.worldToLocal(next);s.object.position.copy(next);s.object.updateMatrixWorld();}
  const value=s.kind==='draw'?d.drawingMagnitude+' N':s.kind==='progress'?Math.round(d.progress*100)+'%':Object.entries(changes).map(([key,v])=>v+(c.activity.controls.find(x=>x.key===key)?.unit||'')).join(' · ');
  prompt.textContent=(value?value+' · ':'')+L.release;
 }
 function end(cancel=false){
  const d=drag;if(!d)return;const s=d.spec;drag=null;keyboard=null;nodes.get(s.id)?.setAttribute('aria-grabbed','false');try{if(d.pointerId!==undefined)nodes.get(s.id)?.releasePointerCapture?.(d.pointerId);}catch{}
  controls.enabled=false;document.body.classList.remove('scene-dragging');restorePreview(d);
  if(cancel||(!d.moved&&!d.tapObservation&&!(s.kind==='action'||s.kind==='observe'&&!s.dragObject))){curriculum.directCancel();prompt.textContent=L.cancel;return;}
  const ctx=curriculum.directContext();let accepted=true,instant=s.kind==='progress'&&!s.animateRelease,origin=null;
  if(s.kind==='action'){curriculum.directAction(s.action,s.value);curriculum.directEnd({target:s.id,action:s.action,method:d.method},false);prompt.textContent='';return;}
  if(['sample','bag','supply'].includes(s.kind)){
   let selected=s;if(s.kind==='supply'){const possible=current.filter(t=>t.kind==='supply'&&t.dropObject);selected=possible.reduce((a,b)=>destination(b).distanceTo(d.end)<destination(a).distanceTo(d.end)?b:a,s);}
   accepted=!!destination(selected)&&withinDrop(d.end,destination(selected),selected.radius||.85);
   if(s.kind==='sample'&&ctx.lesson.zero&&!ctx.zeroed)accepted=false;
   if(accepted){if(s.kind==='sample'){curriculum.directSet({object:s.value});curriculum.directAction('place',true);}else if(s.kind==='bag')curriculum.directAction('bag');else {const c=ctx.activity.controls.find(c=>c.key===selected.key),changes={[selected.key]:quantize(c,d.inputs[selected.key]+selected.amount)};if(selected.positionKey){const p=selected.dropObject.worldToLocal(d.end.clone()),control=ctx.activity.controls.find(c=>c.key===selected.positionKey);changes[selected.positionKey]=quantize(control,Math.abs(p.x)/selected.slotUnit);}curriculum.directSet(changes);}}
  }else if(s.kind==='remove-sample'||s.kind==='remove'){
   accepted=!withinDrop(d.end,destination(s),s.radius||.85);if(accepted){if(s.kind==='remove-sample')curriculum.directAction('place',false);else {const c=ctx.activity.controls.find(c=>c.key===s.key);curriculum.directSet({[s.key]:quantize(c,d.inputs[s.key]-s.amount)});}}
  }else if(s.kind==='progress')accepted=d.progress>=.85;
  else if(s.removeKey&&loadIsOutside(local(d.end,s),s.removeFloor)){const c=ctx.activity.controls.find(c=>c.key===s.removeKey);curriculum.directSet({[s.key]:d.inputs[s.key],[s.removeKey]:quantize(c,d.inputs[s.removeKey]-s.removeAmount)});}
  else if(s.kind==='push')origin={x:Math.max(-.22,Math.min(.22,d.end.x-d.start.x)),z:Math.max(-.15,Math.min(.15,d.end.z-d.start.z))};
  if(!accepted){curriculum.directCancel();prompt.textContent=s.kind==='progress'?(language==='en'?'Move to the guide endpoint.':'화살표 끝까지 움직여 보세요.'):L.drop;return;}
  const recorded=curriculum.directEnd({target:s.id,action:s.kind,method:d.method},instant,origin);prompt.textContent=recorded?'':L.need;
 }
 root.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.pointerId)return;e.preventDefault();moveTo(point(e,drag),{x:e.clientX,y:e.clientY});});
 root.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.pointerId)return;e.preventDefault();e.stopPropagation();const p=point(e,drag);if(p)moveTo(p,{x:e.clientX,y:e.clientY});end();});
 root.addEventListener('pointercancel',()=>end(true));addEventListener('blur',()=>end(true));addEventListener('resize',()=>end(true));
 function key(event,s){
  if([' ','Enter','Escape','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();event.stopPropagation();}
  if(event.key==='Escape'){end(true);return;}
  if(!drag&&[' ','Enter'].includes(event.key)){begin(s,null,'keyboard');keyboard=s.id;if(s.kind==='action'||drag?.tapObservation){end();return;}}
  else if(drag&&[' ','Enter'].includes(event.key)){end();return;}
  if(!drag||keyboard!==s.id||!event.key.startsWith('Arrow'))return;
  const d=drag,c=d.ctx.activity.controls.find(c=>c.key===s.key),step=['sample','bag','supply','remove-sample','remove'].includes(s.kind)?.25:c?.options?.length?((s.kind==='choice'?s.unit:1)||.65):c?(c.step*(s.unit||1)):.62,p=d.end.clone();
  if(s.kind==='progress'){const axis=s.axis||'y',direction=axis==='x'?(event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0):(event.key==='ArrowUp'?1:event.key==='ArrowDown'?-1:0);p[axis]+=direction*Math.abs(s.travel)/4;}
  else{if(event.key==='ArrowLeft')p.x-=step;if(event.key==='ArrowRight')p.x+=step;if(event.key==='ArrowUp')p.y+=step;if(event.key==='ArrowDown')p.y-=step;if(s.plane==='table'&&['ArrowUp','ArrowDown'].includes(event.key)){p.z+=(event.key==='ArrowUp'?-1:1)*step;p.y=d.end.y;}}
  moveTo(p,{x:d.lastClient.x+12,y:d.lastClient.y+12});
 }
 function update(){
  const c=curriculum.directContext(),mobile=innerWidth<=980,sceneBottom=112+Math.min(320,Math.max(250,innerHeight*.36));
  if(drag&&!c.dragging)end(true);
  root.hidden=!c.active||!['prepare','investigate'].includes(c.stage)||c.phase==='running'||document.getElementById('ui').classList.contains('hidden-ui')||(mobile&&scrollY>80);
  if(root.hidden){if(drag)end(true);return;}
  predictionJump.hidden=c.stage!=="investigate"||c.predictionReady!==false;
  const next=c.course+'/'+c.id+'/'+c.frame.id;if(next!==signature){if(drag)end(true);signature=next;lastHint='';prompt.textContent='';}
  if(drag){if(drag.frozen){drag.spec.freezeObject.quaternion.copy(drag.frozen);drag.spec.freezeObject.updateMatrixWorld(true);}if(drag.spec.dragObject&&drag.objectWorld){const next=drag.objectWorld.clone().add(drag.end.clone().sub(drag.start));drag.spec.object.parent.worldToLocal(next);drag.spec.object.position.copy(next);}const b=nodes.get(drag.spec.id);if(b){b.style.left=drag.lastClient.x+'px';b.style.top=drag.lastClient.y+'px';}return;}
  current=targets(c).sort((a,b)=>priority(a,c)-priority(b,c));const keep=new Set(current.map(s=>s.id));for(const [id,node]of nodes)if(!keep.has(id)){node.remove();nodes.delete(id);}
  let first=null;
  for(const [index,s]of current.entries()){
   const p=project(world(s));let b=nodes.get(s.id);if(!b){b=document.createElement('button');b.type='button';b.className='scene-handle';b.id='scene-handle-'+s.id;b.dataset.sceneTarget=s.id;b.innerHTML='<span aria-hidden="true">↔</span><span class="scene-target-label"></span>';root.append(b);nodes.set(s.id,b);b.onpointerdown=e=>{if(e.button!==0)return;const active=current.find(x=>x.id===s.id);if(active)begin(active,e);};b.onkeydown=e=>{const active=current.find(x=>x.id===s.id);if(active)key(e,active);};}
   const duplicateSupply=s.kind==='supply'&&current.slice(0,index).some(t=>t.kind==='supply'&&t.object===s.object);b.hidden=c.stage==="investigate"&&c.predictionReady===false||duplicateSupply||p.z< -1||p.z>1||p.x<22||p.x>innerWidth-22||p.y< (mobile?112:75)||p.y>(mobile?sceneBottom-12:innerHeight-100)||(!mobile&&p.x>innerWidth-420);
   const endpoint=project(guideEnd(s,c)),observing=c.ready&&['range','choice','orbit','vector','parallel-vector'].includes(s.kind)&&Object.entries(c.frame.inputs).every(([k,v])=>c.inputs[k]===v)&&(s.observePrepared||world(s).distanceTo(guideEnd(s,c))<.15&&Math.hypot(endpoint.x-p.x,endpoint.y-p.y)<20);b.dataset.observe=String(observing);
   b.style.left=p.x+'px';b.style.top=p.y+'px';b.dataset.gesture=observing||s.kind==='action'||s.kind==='observe'&&!s.dragObject?'tap':'drag';const label=observing?L.observeReady:hint(s,c);b.setAttribute('aria-label',label+' · '+L.keyboard);b.querySelector('.scene-target-label').textContent=label;b.classList.remove('scene-primary');b.querySelector('span').textContent=b.dataset.gesture==='tap'?'○':s.kind==='sample'||s.kind==='supply'?'↗':s.axis==='y'?'↕':'↔';if(!first&&!b.hidden)first={s,p};
  }
  if(!first)prompt.textContent='';path.style.display=first?'':'none';drop.style.display=first?'':'none';
  if(first){const {s,p}=first;nodes.get(s.id).classList.add('scene-primary');const q=project(guideEnd(s,c)),tap=nodes.get(s.id).dataset.gesture==='tap';drop.setAttribute('cx',q.x);drop.setAttribute('cy',q.y);drop.style.display=tap?'none':'';path.style.display=tap?'none':'';
   path.setAttribute('d',`M${p.x} ${p.y} Q${(p.x+q.x)/2} ${Math.min(p.y,q.y)-24} ${q.x} ${q.y}`);
   const observing=nodes.get(s.id).dataset.observe==='true',line=observing?L.observeReady:hint(s,c),hintKey=signature+'/'+line;if(lastHint!==hintKey){prompt.textContent=line;lastHint=hintKey;}const instruction=document.querySelector('.lesson-direct-instruction');if(instruction){if(!instruction.dataset.original)instruction.dataset.original=instruction.textContent;const next=observing?L.tapObserve:instruction.dataset.original;if(instruction.textContent!==next)instruction.textContent=next;}
   prompt.style.left=(mobile?22:28)+'px';prompt.style.top=(mobile?180:156)+'px';if(c.phase==='result'&&Object.entries(c.frame.inputs).every(([key,value])=>c.inputs[key]===value)&&(!c.frame.empty||!c.placed)){prompt.textContent='';path.style.display=drop.style.display='none';}
  }
 }
 return {update,cancel:()=>end(true),get dragging(){return !!drag;},diagnostics(){const available=targets(curriculum.directContext());return {dragging:!!drag,targets:available.map(s=>({id:s.id,kind:s.kind,valid:!!s.object?.isObject3D&&(!s.dropObject||!!s.dropObject.isObject3D)})),visible:[...nodes.values()].filter(n=>!n.hidden&&!root.hidden).map(n=>n.dataset.sceneTarget)};}};
}
