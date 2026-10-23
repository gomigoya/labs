const LABELS={
 grammar:{ko:'\uc2dc\uac01 \ubb38\ubc95 \uce35 \uc21c\ud658',en:'Cycle visual layers'},compare:{ko:'\uae30\uc900 \uace0\uc815 \ub610\ub294 \ud574\uc81c',en:'Pin or unpin comparison'},
 canvas:{ko:'지구 자전 실험 장치',en:'Earth rotation apparatus'},
 play:{ko:'재생 또는 일시정지',en:'Play or pause'},reset:{ko:'처음 상태',en:'Reset'},
 sound:{ko:'소리 켜기 또는 끄기',en:'Toggle sound'},execute:{ko:'현재 자전에서 급정지 실행',en:'Execute sudden stop from present rotation'},
 sudden:{ko:'갑자기 멈추는 방식',en:'Sudden stop'},gradual:{ko:'느린 자전 비교 방식',en:'Slow rotation comparison'},
 phi:{ko:'위도 조절',en:'Adjust latitude'},P:{ko:'자전 주기 조절',en:'Adjust rotation period'}
};
const ICONS={
 play:'M8 5l11 7-11 7z',pause:'M8 5v14M16 5v14',reset:'M4 10a8 8 0 1 1 1 8M4 4v6h6',
 sound:'M3 9h4l5-4v14l-5-4H3zM16 8q6 4 0 8M19 5q9 7 0 14',muted:'M3 9h4l5-4v14l-5-4H3zM16 9l6 6M22 9l-6 6',
 execute:'M6 6h12v12H6z',sudden:'M3 6h9v12h9',gradual:'M3 6c12 0 6 12 18 12',
 globe:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M3 12h18M12 3c6 5 6 13 0 18-6-5-6-13 0-18',
 pin:'M12 21V11M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
 tangent:'M3 16h18l-5-5M3 16a8 8 0 0 1 8-8',
 sun:'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2',
 ring:'M21 12a9 9 0 1 1-9-9M21 3v7h-7',limit:'M5 20V4M5 8h14M5 16h8',
 phi:'M3 12h18M12 3v18M7 6l5-3 5 3M7 18l5 3 5-3',P:'M19 7a8 8 0 1 0 1 9M19 3v6h-6'
};
function icon(name){return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[name]||ICONS.globe}"/></svg>`;}
canvas.setAttribute('aria-label',LABELS.canvas[LANG]);
const toolbar=document.getElementById('tools');
for(const name of ['play','execute','reset','sudden','gradual','sound']){
 const button=document.createElement('button');button.id=`tool-${name}`;button.setAttribute('aria-label',LABELS[name][LANG]);button.innerHTML=icon(name);button.addEventListener('click',()=>action(name));toolbar.append(button);
}
let audioContext;
function tick(){
 if(!S.sound.target)return;
 audioContext ||= new (window.AudioContext||window.webkitAudioContext)();
 if(audioContext.state==='suspended')void audioContext.resume();
 const o=audioContext.createOscillator(),g=audioContext.createGain(),now=audioContext.currentTime;
 o.frequency.setValueAtTime(1300,now);o.frequency.exponentialRampToValueAtTime(750,now+.035);
 g.gain.setValueAtTime(.035,now);g.gain.exponentialRampToValueAtTime(.0001,now+.045);
 o.connect(g).connect(audioContext.destination);o.start();o.stop(now+.05);
}
function executeStop(){
 if(S.mode.target!==0)return;
 QUEST.evidence();
 S.runId++;
 const phi=currentPhi(),measurement=PHYS.stopMeasurement({runId:S.runId,phi,mode:'sudden',executed:true});
 // An execution always starts at the present sidereal period, not the slow dial condition.
 S.period.value=S.period.target=PHYS.periodRailX(PHYS.C.T0);
 for(const name of ['t','spin','sun'])S[name].value=S[name].target=0;
 S.playing.value=S.playing.target=1;
 S.run={measurement,phi,angle:PHYS.spinAngle(0,PHYS.C.T0),elapsed:pair(0)};
 QUEST.evidence();tick();syncUI();
}
function action(name){
 if(name!=='sound'&&name!=='reset'&&!QUEST.allows(name))return;
 QUEST.touch();
 if(name==='play')S.playing.target=1-S.playing.target;
 if(name==='execute')executeStop();
 if(name==='reset')TEACHER.reset();
 if(name==='sound'){S.sound.target=1-S.sound.target;tick();}
 if(name==='sudden'||name==='gradual'){S.mode.target=name==='gradual'?1:0;S.run=null;}
 syncUI();
}
function syncUI(){
 for(const name of ['play','sound','sudden','gradual'])document.getElementById(`tool-${name}`).setAttribute('aria-pressed',String(name==='play'?!!S.playing.target:name==='sound'?!!S.sound.target:name==='sudden'?S.mode.target===0:S.mode.target===1));
 document.getElementById('tool-play').innerHTML=icon(S.playing.target?'pause':'play');
 document.getElementById('tool-sound').innerHTML=icon(S.sound.target?'sound':'muted');
 document.getElementById('tool-execute').disabled=S.mode.target!==0;
}
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
const dragObjects=[PIN_HIT,DIAL.knob,SLIDER.handle,PLAY_BUTTON,MODE_SWITCH,SWITCH_LEVER,...GRAPHS.map(g=>g.mesh)];
function rayFromEvent(event){
 const r=canvas.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);
}
function setRailFromPointer(name,u){
 QUEST.invalidate();
 u=clamp(u,0,1);const list=PHYS.DETENTS[name==='phi'?'phi':'P'];
 const near=list.reduce((best,d)=>Math.abs(d.x-u)<Math.abs(best.x-u)?d:best,list[0]);
 const snapped=Math.abs(near.x-u)<=.012,key=snapped?`${name}:${near.x}`:null;
 if(key&&S.snap!==key)tick();S.snap=key;
 S[name].target=snapped?near.x:u;
 S.run=null;QUEST.evidence();
}
canvas.addEventListener('pointerdown',event=>{
 if(event.button!==0||S.drag)return;
 rayFromEvent(event);scene.updateMatrixWorld(true);camera.updateMatrixWorld();
 const hits=raycaster.intersectObjects(dragObjects,true);let object=hits[0]?.object;
 if(object)while(object.parent&&!dragObjects.includes(object))object=object.parent;
 // Screen-space acquisition guarantees a 56 px touch target in every shot.
 if(!object){let best=typeof T!=='undefined'&&T.mode==='teacher'?36:28;for(const candidate of dragObjects){
  const p=candidate.getWorldPosition(V3()).project(camera);if(p.z < -1 || p.z>1)continue;
  const d=Math.hypot((p.x+1)*innerWidth/2-event.clientX,(1-p.y)*innerHeight/2-event.clientY);
  if(d<=best){best=d;object=candidate;}
 }}
 if(!object)return;
 const handle=object===PIN_HIT||object===SLIDER.handle||object===GRAPHS[0].mesh?'phi':object===DIAL.knob||object===GRAPHS[1].mesh?'P':object===PLAY_BUTTON?(S.mode.target?'play':'execute'):(S.mode.target?'sudden':'gradual');
 if(!QUEST.allows(handle)){event.stopImmediatePropagation();return;}QUEST.touch();
 event.stopImmediatePropagation();controls.enabled=false;S.fly=null;
 if(object===PLAY_BUTTON){action(S.mode.target?'play':'execute');controls.enabled=true;return;}
 if(object===MODE_SWITCH||object===SWITCH_LEVER){action(S.mode.target?'sudden':'gradual');controls.enabled=true;return;}
 const type=object===PIN_HIT?'pin':object===DIAL.knob?'dial':object===SLIDER.handle?'slider':'graph';
 const plane=new THREE.Plane(V3(0,0,1),-.82),p=raycaster.ray.intersectPlane(plane,V3());if(!p){controls.enabled=true;return;}
 const poles=[-90,90].map(phi=>V3(...PHYS.scenePoint(phi,0,MODEL.pinReach)).project(camera));
 S.drag={id:event.pointerId,type,plane,start:p,startY:event.clientY,phi:S.phi.target,period:S.period.target,
  height:Math.max(56,Math.abs(poles[0].y-poles[1].y)*innerHeight/2),angle:Math.atan2(p.x+1.32,p.y-.6),graph:object===GRAPHS[0].mesh?0:1};
 S.snap=null;canvas.setPointerCapture(event.pointerId);
},{capture:true});
canvas.addEventListener('pointermove',event=>{
 if(!S.drag||event.pointerId!==S.drag.id)return;
 event.stopImmediatePropagation();rayFromEvent(event);const d=S.drag,p=raycaster.ray.intersectPlane(d.plane,V3());if(!p)return;
 if(d.type==='pin')setRailFromPointer('phi',d.phi-(event.clientY-d.startY)/d.height);
 if(d.type==='slider')setRailFromPointer('phi',d.phi+(p.x-d.start.x)/SLIDER.width);
 if(d.type==='dial'){
  const a=Math.atan2(p.x+1.32,p.y-.6),delta=Math.atan2(Math.sin(a-d.angle),Math.cos(a-d.angle));
  d.period=clamp(d.period+delta/(Math.PI*1.5),0,1);setRailFromPointer('period',d.period);d.angle=a;
 }
 if(d.type==='graph'){
  const center=GRAPHS[d.graph].mesh.position.x;
  // Map exactly the graph's inner plotting rectangle, not the metal bezel.
  const canvasX=(p.x-center)/.67*768+384;
  setRailFromPointer(d.graph?'period':'phi',(canvasX-48)/(714-48));
 }
},{capture:true});
function endDrag(event){
 if(!S.drag||event.pointerId!==S.drag.id)return;S.drag=null;S.snap=null;controls.enabled=true;
 if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);syncUI();
}
canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);canvas.addEventListener('lostpointercapture',endDrag);
window.addEventListener('keydown',event=>{
 if(event.key!=='/'||event.repeat)return;S.ui.target=1-S.ui.target;document.body.classList.toggle('hide-ui',!S.ui.target);window.__site?.setVisible(!!S.ui.target);event.preventDefault();
});
function set(name,v){
 if(['phi','P','mode'].includes(name))QUEST.invalidate();
 if(name==='mode'){if(!['sudden','gradual'].includes(v))throw new RangeError(name);S.mode.target=v==='gradual'?1:0;S.run=null;syncUI();return;}
 if(name==='execute'){if(v)executeStop();return;}
 if(name==='playing'||name==='sound'){S[name].target=v?1:0;syncUI();return;}
 if(name==='P'&&(v===Infinity||v==='stop')){S.period.target=1;S.run=null;return;}
 v=Number(v);if(!Number.isFinite(v))throw new TypeError(name);
 if(name==='phi'){S.phi.target=PHYS.phiRailX(clamp(v,...PHYS.RANGE.phi));S.run=null;}
 else if(name==='P'){S.period.target=PHYS.periodRailX(clamp(v,...PHYS.RANGE.P));S.run=null;}
 else if(name==='t'){S.t.target=Math.max(0,v);S.spin.target=PHYS.spinAngle(S.t.target,currentPeriod());S.sun.target=PHYS.sunAngle(S.t.target,currentPeriod());}
 else throw new RangeError(name);
}
const PRESETS=Object.freeze([
 {phi:0,P:PHYS.C.T0,mode:'sudden'},
 {phi:60,P:PHYS.C.T0,mode:'sudden'},
 {phi:90,P:PHYS.C.T0,mode:'sudden'},
 {phi:0,P:PHYS.C.T0,mode:'sudden',execute:true},
 {phi:0,P:PHYS.C.questPeriod,mode:'gradual'},
 {phi:0,P:'stop',mode:'gradual'},
 {phi:0,P:PHYS.C.Pmax,mode:'gradual'},
 {phi:PHYS.phiSafe(PHYS.C.designSpeed),P:PHYS.C.T0,mode:'sudden'}
]);
function preset(i){
 if(!Number.isInteger(i)||i<0||i>=PRESETS.length)throw new RangeError('preset');
 const p=PRESETS[i];S.run=null;set('mode',p.mode);set('phi',p.phi);set('P',p.P);
 for(const name of ['phi','period','mode'])S[name].value=S[name].target;
 for(const name of ['t','spin','sun'])S[name].value=S[name].target=0;
 S.playing.value=S.playing.target=1;
 if(p.execute)executeStop();syncUI();return p;
}
function textAudit() {
  const found = [], walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode, parent = node.parentElement;
    if (!parent || parent.closest('script,style,template,[hidden]')) continue;
    const range = document.createRange(); range.selectNodeContents(node);
    const r = range.getBoundingClientRect(), style = getComputedStyle(parent);
    if (!r.width || !r.height || style.visibility === 'hidden' || style.display === 'none' || +style.opacity === 0 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
    const numeric = parent.closest('[data-numeric]');
    const content = node.textContent.trim();
    const words = numeric
      ? (T.mode === 'teacher' && T.numbers && /^[-+−\d.,\s]+(?:m\/s|km|m|s|h|°|×)?$/u.test(content) ? null : [content])
      : content.match(/[\p{L}\p{N}]+/gu);
    if (words) found.push({ words, x: r.x, y: r.y, width: r.width, height: r.height });
  }
  return found;
}

// Existing debug layer API retains structural layers and accepts exact theory keys.
layer=new Proxy(layer,{apply(target,thisArg,args){
 if(GRAMMAR.LAYERS.includes(args[0]))return GRAMMAR.set({[args[0]]:!!args[1]});
 return Reflect.apply(target,thisArg,args);
}});
let grammarIndex=-1;
for(const name of ['grammar','compare']){
 const button=document.createElement('button');button.id=`tool-${name}`;
 button.setAttribute('aria-label',LABELS[name][LANG]);button.innerHTML=icon(name==='grammar'?'ring':'pin');
 button.setAttribute('aria-pressed','false');toolbar.append(button);
 button.addEventListener('click',()=>{
  if(!Q.free)return;
  if(name==='compare'){if(GRAMMAR.baseline)GRAMMAR.unpin();else GRAMMAR.pin();button.setAttribute('aria-pressed',String(!!GRAMMAR.baseline));}
  else{grammarIndex=(grammarIndex+1)%(GRAMMAR.LAYERS.length+1);
   GRAMMAR.set(Object.fromEntries(GRAMMAR.LAYERS.map((n,i)=>[n,grammarIndex===GRAMMAR.LAYERS.length?GRAMMAR.defaults[n]:i===grammarIndex])));
   button.setAttribute('aria-pressed',String(grammarIndex!==GRAMMAR.LAYERS.length));}
 });
}

Object.assign(ICONS,{
 quest:'M4 4h16v16H4zM8 12l3 3 6-7',free:'M3 6h18v12H3zM7 9v6m10-6v6M5 12h4m6 0h4',
 hand:'M8 12V4a2 2 0 0 1 4 0v7-4a2 2 0 0 1 4 0v4-2a2 2 0 0 1 4 0v6q0 7-7 7-4 0-7-5l-3-4q-1-3 2-2l3 2',
 check:'M4 12l5 5L21 5',next:'M5 12h14m-6-6 6 6-6 6',
 star:'M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',lens:'M16 16l5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0'
});
Object.assign(LABELS,{
 quest:{ko:'퀘스트',en:'Quests'},free:{ko:'자유 탐험',en:'Free exploration'},pick:{ko:'예상 그림 선택',en:'Choose prediction'},
 next:{ko:'다음 퀘스트',en:'Next quest'},replay:{ko:'비교 다시 보기',en:'Replay comparison'},
 speed:{ko:'속도 렌즈 열기',en:'Inspect speed lens'},bench:{ko:'벤치마크 비교',en:'Inspect benchmarks'},
 decrease:{ko:'위도 비교',en:'Inspect latitude comparison'},relative:{ko:'급정지 접선 보기',en:'Inspect this stop tangent'},day:{ko:'태양일 고리 보기',en:'Inspect solar cycle'}
});
const qPictures=document.createElement('div');qPictures.id='q-pictures';document.body.append(qPictures);
const qOverlay=document.createElement('div');qOverlay.id='q-overlay';qOverlay.setAttribute('aria-hidden','true');document.body.append(qOverlay);
const qViews=document.createElement('div');qViews.id='q-views';toolbar.append(qViews);
const qLayers=document.createElement('div');qLayers.id='q-layers';toolbar.append(qLayers);
for(const name of ['grammar','compare'])qLayers.append(document.getElementById(`tool-${name}`));
function qButton(label,symbol,fn,parent,suffix=''){
 const b=document.createElement('button');b.setAttribute('aria-label',LABELS[label][LANG]+suffix);b.innerHTML=icon(symbol);b.onclick=fn;parent.append(b);return b;
}
function questUI(){
 const d=QUESTS[Q.i],f=Q.flags,top=document.getElementById('quests');top.removeAttribute('aria-hidden');top.replaceChildren();
 qButton('quest','quest',()=>TEACHER.mode('student'),top).setAttribute('aria-pressed',String(T.mode==='student'));
 qButton('free','free',()=>TEACHER.mode('free'),top).setAttribute('aria-pressed',String(T.mode==='free'));
 qButton('teacher','teacher',()=>TEACHER.mode('teacher'),top).setAttribute('aria-pressed',String(T.mode==='teacher'));
 if(T.mode!=='teacher')
 QUESTS.forEach((row,i)=>{
  const unlocked=i===0||Q.completed.has(i-1)||Q.completed.has(i)||i===Q.i;
  const b=qButton('quest',row.icon,()=>{if(unlocked)QUEST.go(i);},top,` ${i+1}`);
  b.className=`quest ${i===Q.i?'current':''} ${Q.completed.has(i)?'complete':''}`;b.setAttribute('aria-disabled',String(!unlocked));
  b.innerHTML+=`<span class="q-dots">${'<i></i>'.repeat(i===Q.i?['intro','predict','act','observe','confirm','card'].indexOf(Q.phase)+1:1)}</span>`;
 });
 qPictures.replaceChildren();qPictures.hidden=Q.free||!['predict','confirm','card'].includes(Q.phase);qPictures.className=Q.phase;
 if(!Q.free&&Q.phase==='predict')d.candidates.forEach((c,k)=>{const b=qButton('pick','globe',()=>QUEST.pick(k),qPictures,` ${k+1}`);b.dataset.candidate=k;b.innerHTML=CARDS.picture(d.id,c);});
 if(!Q.free&&Q.phase==='confirm'){
  const c=d.candidates.find(c=>c.key===Q.pick)||d.candidates[0],actual=f.success||QUEST.sample();
  qPictures.innerHTML=`<div class="q-compare ${Q.stars[Q.i]===3?'matched':''}">${CARDS.picture(d.id,c)}${CARDS.actual(d.id,actual)}${Q.stars[Q.i]===3?icon('check'):''}</div>`;
  if(Q.stars[Q.i]===2)qButton('replay','reset',()=>QUEST.skip('observe'),qPictures);
 }
 if(!Q.free&&Q.phase==='card'){
  qPictures.innerHTML=`<div class="q-principle">${d.card(f.success||QUEST.sample())}<span class="q-stars">${icon('star').repeat(Q.stars[Q.i])}</span></div>`;
  if(Q.i<QUESTS.length-1)qButton('next','next',()=>QUEST.go(Q.i+1),qPictures);else qButton('free','free',()=>QUEST.mode(true),qPictures);
 }
 qViews.replaceChildren();
 for(const name of Q.free?['speed','bench','day']:d.handles.filter(n=>['speed','bench','decrease','relative','day'].includes(n)))
  qButton(name,name==='bench'?'limit':name==='relative'?'tangent':'lens',()=>QUEST.open(name),qViews).setAttribute('aria-pressed',String(f.lens===name));
 qLayers.hidden=!Q.free;
 for(const name of ['play','execute','sudden','gradual'])document.getElementById(`tool-${name}`).classList.toggle('sub',!Q.free&&!d.handles.includes(name));
 document.body.dataset.qphase=Q.free?'free':Q.phase;
 DIRECTOR.layoutDirty=true;
}

Object.assign(ICONS,{
 shell:'M3 4h18v16H3zM6 8h12M6 12h12M6 16h12',locator:'M4 4h16v16H4zM8 8h8v8H8z',
 bead:'M4 4h16v16H4zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',vector:'M3 4h18v16H3zM6 12h12m-4-4 4 4-4 4',
 rack:'M4 3v18M4 6h14M4 12h10M4 18h17',ticks:'M3 12h18M6 6v12M12 6v12M18 6v12',
 overlap:'M3 5h12v10H3zM9 9h12v10H9z',stairs:'M3 20V15h5v-5h5V5h8',
 trail:'M3 17h2m3-3h2m3-3h2m3-3h3M3 5v14h18',split:'M3 4h18v16H3zM12 4v16M4 5l7 7-7 7',
 lamp:'M3 20h18M7 20V8h10v12M9 4h6M12 4v4',arcs:'M3 7q9-8 18 0M3 12q9-8 18 0M3 17q9-8 18 0',
 threshold:'M3 3h18v18H3zM7 6v12m0-6h11m-4-3 4 3-4 3',records:'M3 4h18v16H3zM6 8h4m-4 4h8m-8 4h12',
 deck:'M2 7h20v12H2zM6 10v6m4-6v6m4-6v6m4-6v6',apparatus:'M2 3h20v18H2zM6 17V7h12v10z'
});
