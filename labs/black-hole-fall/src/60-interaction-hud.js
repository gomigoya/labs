// Shared diagram colors; no visible labels added.
for(const [name,value]of Object.entries({'--diagram-paper':'#'+INK_CFG.diagram.screen.toString(16),'--diagram-ink':'#'+INK_CFG.diagram.ink.toString(16),'--diagram-border':INK_CFG.diagram.borderPx+'px'}))document.documentElement.style.setProperty(name,value);
// All user-facing language lives only in this accessibility dictionary.
const LABELS={
 canvas:{ko:'\uBE14\uB799\uD640 \uC870\uC11D \uC2E4\uD5D8\uC2E4',en:'Black hole tidal laboratory'},
 play:{ko:'\uAC70\uB9AC \uC790\uB3D9 \uC2A4\uCE94',en:'Scan or pause distance'},
 reset:{ko:'새 실행으로 복구',en:'Restore probe in a new run'},
 sound:{ko:'\uC18C\uB9AC \uCF1C\uAE30 \uB610\uB294 \uB044\uAE30',en:'Toggle sound'},
 mass0:{ko:'\uD0DC\uC591 \uC9C8\uB7C9 \uC5F4 \uBC30',en:'Ten solar masses'},
 mass1:{ko:'\uD0DC\uC591 \uC9C8\uB7C9 \uC0AC\uBC31\uB9CC \uBC30',en:'Four million solar masses'},
 mass2:{ko:'\uD0DC\uC591 \uC9C8\uB7C9 \uC2ED\uC5B5 \uBC30',en:'One billion solar masses'},
 orientation:{ko:'\uD0D0\uC0AC \uB9C9\uB300 \uBC29\uD5A5',en:'Rotate probe'},
 cutaway:{ko:'\uACA9\uC790 \uC55E \uBC18\uD310 \uBD84\uD574',en:'Open front grid half'}
};
const ICONS={
 play:'M8 5l11 7-11 7z',pause:'M8 5v14M16 5v14',reset:'M4 10a8 8 0 1 1 1 8M4 4v6h6',
 sound:'M3 9h4l5-4v14l-5-4H3zM16 8q6 4 0 8M19 5q9 7 0 14',
 muted:'M3 9h4l5-4v14l-5-4H3zM16 9l6 6M22 9l-6 6',
 mass0:'M12 3l8 16H4zM12 8v5M9 16h6',
 mass1:'M4 4h16v16H4zM8 12h8M12 8v8',
 mass2:'M12 2l10 10-10 10L2 12zM12 6l6 6-6 6-6-6z',
 orientation:'M5 12h14M5 9v6M19 9v6M7 4a9 9 0 0 1 13 5M20 4v5h-5',
 cutaway:'M3 9l9-5 9 5-9 5zM3 15l9 5 9-5M3 12l9 5 9-5',
 rail:'M3 17h18M6 13V7M12 13V4M18 13V9',
 ends:'M12 4v16M7 8l5-4 5 4M7 16l5 4 5-4',
 ring:'M21 12a9 6 0 1 1-18 0 9 6 0 0 1 18 0M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
 broken:'M3 12h7l-2-4 7 8-2-4h8'
};
function icon(name){return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[name]}"/></svg>`;}
canvas.setAttribute('aria-label',LABELS.canvas[LANG]);
const toolbar=document.getElementById('tools');
for(const name of ['play','reset','sound','mass0','mass1','mass2','orientation','cutaway']){
 const b=document.createElement('button');b.id=`tool-${name}`;b.setAttribute('aria-label',LABELS[name][LANG]);b.innerHTML=icon(name);
 b.addEventListener('click',()=>action(name));toolbar.append(b);
}
let audioContext;
function tick(){
 if(!S.sound.target)return;
 audioContext ||= new (window.AudioContext||window.webkitAudioContext)();
 if(audioContext.state==='suspended')void audioContext.resume();
 const osc=audioContext.createOscillator(),gain=audioContext.createGain(),now=audioContext.currentTime;
 osc.frequency.setValueAtTime(1300,now);osc.frequency.exponentialRampToValueAtTime(750,now+0.035);
 gain.gain.setValueAtTime(0.035,now);gain.gain.exponentialRampToValueAtTime(0.0001,now+0.045);
 osc.connect(gain).connect(audioContext.destination);osc.start();osc.stop(now+0.05);
}
function action(name){
 if(name==='sound'){S.sound.target=1-S.sound.target;tick();syncUI();return;}
 if(name==='reset'){QUEST.restore();return;}
 if(name==='compare'){QUEST.open('compare');return;}
 if(!QUEST.allows())return;QUEST.touch();
 if(name==='play'){if(S.u.target>=1){S.u.value=S.u.target=0;QUEST.restore();}S.playing.target=1-S.playing.target;}
 
 if(name.startsWith('mass'))set('massIndex',Number(name.slice(-1)));
 if(name==='orientation')set('orientation',S.orientation.target?'radial':'transverse');
 if(name==='cutaway')set('cutaway',!S.cutaway.target);
 syncUI();
}
function syncUI(){
 for(const name of ['play','sound','orientation','cutaway','mass0','mass1','mass2']){
  const b=document.getElementById(`tool-${name}`);
  const on=name==='play'?!!S.playing.target:name==='sound'?!!S.sound.target:name==='orientation'?!!S.orientation.target:name==='cutaway'?!!S.cutaway.target:S.massIndex.target===Number(name.slice(-1));
  b.setAttribute('aria-pressed',String(on));
 }
 document.getElementById('tool-play').innerHTML=icon(S.playing.target?'pause':'play');
 document.getElementById('tool-sound').innerHTML=icon(S.sound.target?'sound':'muted');
}
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
const dragObjects=[RAIL_HIT,TURN_HIT,SLIDER.handle,DIAL.knob,PLAY_BUTTON,SWITCH,...GRAPHS.map(g=>g.mesh)];
function rayFromEvent(event){const rect=canvas.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);}
function setRailFromPointer(u){
 u=clamp(u,0,1);const near=PHYS.DETENTS.reduce((best,d)=>Math.abs(d.x-u)<Math.abs(best-u)?d.x:best,Infinity);
 const snapped=Math.abs(near-u)<=0.012;
 if(snapped&&S.snap!==near)tick();S.snap=snapped?near:null;S.u.target=snapped?near:u;
}
function pointerValue(p,d){
 if(d.type==='rail')setRailFromPointer(d.u+(p.x-d.start.x)/(railEnd-railStart));
 if(d.type==='slider')setRailFromPointer(d.u+(p.x-d.start.x)/SLIDER.width);
 if(d.type==='graph0')setRailFromPointer((p.x-GRAPHS[0].mesh.position.x+CONTROL_LAYOUT.graphSize[0]/2)/CONTROL_LAYOUT.graphSize[0]);
 if(d.type==='graph1')set('massIndex',clamp(Math.floor((p.x-GRAPHS[1].mesh.position.x+CONTROL_LAYOUT.graphSize[0]/2)/CONTROL_LAYOUT.graphSize[0]*3),0,2));
 if(d.type==='turn'||d.type==='dial'){
  const delta=d.type==='turn'?p.z-d.start.z:p.x-d.start.x;
  if(Math.abs(delta)>0.035){set('orientation',delta>0?'transverse':'radial');d.moved=true;}
 }
}
canvas.addEventListener('pointerdown',event=>{
 if(event.button!==0||S.drag)return;
 rayFromEvent(event);scene.updateMatrixWorld(true);const hit=raycaster.intersectObjects(dragObjects,true)[0];if(!hit)return;
 let obj=hit.object;while(obj.parent&&!dragObjects.includes(obj))obj=obj.parent;
 event.stopImmediatePropagation();
 if(!QUEST.allows())return;QUEST.touch();S.fly=null;
 if(obj===PLAY_BUTTON){action('play');return;}if(obj===SWITCH){action('cutaway');return;}
 const type=obj===RAIL_HIT?'rail':obj===TURN_HIT?'turn':obj===DIAL.knob?'dial':obj===SLIDER.handle?'slider':obj===GRAPHS[0].mesh?'graph0':'graph1';
 const plane=['rail','turn'].includes(type)?new THREE.Plane(V3(0,1,0),-(type==='turn'?E.y+0.28:railY+0.045)):new THREE.Plane(V3(0,0,1),-obj.getWorldPosition(V3()).z);
 const p=raycaster.ray.intersectPlane(plane,V3());if(!p)return;
 S.drag={id:event.pointerId,type,plane,start:p,u:S.u.target,moved:false};S.playing.target=0;
 controls.enabled=false;canvas.setPointerCapture(event.pointerId);
 if(type.startsWith('graph'))pointerValue(p,S.drag);syncUI();
},{capture:true});
canvas.addEventListener('pointermove',event=>{
 if(!S.drag||event.pointerId!==S.drag.id)return;event.stopImmediatePropagation();
 rayFromEvent(event);const p=raycaster.ray.intersectPlane(S.drag.plane,V3());if(p)pointerValue(p,S.drag);
},{capture:true});
function endDrag(event){
 if(!S.drag||S.drag.id!==event.pointerId)return;
 if(['turn','dial'].includes(S.drag.type)&&!S.drag.moved&&event.type==='pointerup')action('orientation');
 if(['rail','slider','graph0'].includes(S.drag.type))S.u.target=PHYS.railX(PHYS.snapR(PHYS.rFromRailX(S.u.target)));
 S.drag=null;S.snap=null;QUEST.touch();controls.enabled=true;if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);syncUI();
}
for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,endDrag);
window.addEventListener('keydown',event=>{if(event.key!=='/'||event.repeat)return;S.ui.target=1-S.ui.target;document.body.classList.toggle('hide-ui',!S.ui.target);window.__site?.setVisible(!!S.ui.target);event.preventDefault();});
function set(name,v){
 if(name==='orientation'){
  if(!['radial','transverse',0,1].includes(v))throw new RangeError(name);
  S.orientation.target=v==='transverse'||v===1?1:0;
 }else if(['playing','sound','cutaway'].includes(name))S[name].target=v?1:0;
 else{
  v=Number(v);if(!Number.isFinite(v))throw new TypeError(name);
  if(name==='r')S.u.target=PHYS.railX(clamp(v,...PHYS.RANGE.r));
  else if(name==='u')S.u.target=clamp(v,0,1);
  else if(name==='massIndex')S.massIndex.target=clamp(Math.round(v),...PHYS.RANGE.massIndex);
  else if(name==='t')S.t.target=Math.max(0,v);
  else throw new RangeError(name);
 }
 syncUI();
}
const PRESETS=[
 {massIndex:0,r:1000,orientation:'radial'},
 {massIndex:0,r:200,orientation:'radial'},
 {massIndex:0,r:40,orientation:'radial'},
 {massIndex:0,r:20,orientation:'radial'},
 {massIndex:0,r:1,orientation:'radial'},
 {massIndex:1,r:0.5,orientation:'radial'},
 {massIndex:2,r:0.5,orientation:'radial'},
 {massIndex:0,r:20,orientation:'transverse'}
];
function preset(i){
 if(!Number.isInteger(i)||!PRESETS[i])throw new RangeError('preset');
 S.records=[];S.graphKeys=[];S.playing.target=0;S.t.value=S.t.target=0;S.cutaway.target=0;
 for(const [name,v]of Object.entries(PRESETS[i]))set(name,v);
 S.drag=null;S.snap=null;controls.enabled=true;syncUI();return {...PRESETS[i]};
}
function textAudit(){
 const found=[],walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 while(walker.nextNode()){
  const node=walker.currentNode,parent=node.parentElement;if(!parent||parent.closest('script,style,template,[hidden]'))continue;
  const range=document.createRange();range.selectNodeContents(node);const r=range.getBoundingClientRect(),style=getComputedStyle(parent);
  if(!r.width||!r.height||style.visibility==='hidden'||style.display==='none'||+style.opacity===0||r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth)continue;
  if(parent.closest('[data-numeric]')&&T.mode==='teacher'&&T.numbers&&/^\s*-?\d+(?:\.\d+)?\s*(?:km|m|s|h|\u00b0|\u00d7|m\/s\u00b2)\s*$/.test(node.textContent))continue;
  const words=node.textContent.match(/[\p{L}\p{N}]+/gu);
  if(words)found.push({words,x:r.x,y:r.y,width:r.width,height:r.height});
 }
 return found;
}
Object.assign(ICONS,{
 quest:'M3 4h18v16H3zM7 8h2m4 0h4M7 12h2m4 0h4M7 16h2m4 0h4',
 free:'M12 2v20M2 12h20M8 6l4-4 4 4M8 18l4 4 4-4M6 8l-4 4 4 4M18 8l4 4-4 4',compare:'M3 5h7v14H3zM14 5h7v14h-7zM7 12h10',
 check:'M4 12l5 5L21 5',next:'M4 12h16m-7-7 7 7-7 7',
 star:'M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
 hand:'M8 12V4a2 2 0 0 1 4 0v7-4a2 2 0 0 1 4 0v4-2a2 2 0 0 1 4 0v6q0 7-7 7-4 0-7-5l-3-4q-1-3 2-2l3 2'
});
Object.assign(LABELS,{
 quest:{ko:'퀘스트',en:'Quests'},free:{ko:'자유 실험',en:'Free exploration'},pick:{ko:'예상 그림 선택',en:'Choose prediction'},
 compare:{ko:'측정 비교 열기',en:'Open measurement comparison'},next:{ko:'다음 퀘스트',en:'Next quest'},replay:{ko:'다시 비교 보기',en:'Replay comparison'}
});
const qPictures=document.createElement('div');qPictures.id='q-pictures';document.body.append(qPictures);
const qOverlay=document.createElement('div');qOverlay.id='q-overlay';qOverlay.setAttribute('aria-hidden','true');document.body.append(qOverlay);
function qButton(label,symbol,fn,parent,suffix=''){
 const b=document.createElement('button');b.setAttribute('aria-label',LABELS[label][LANG]+suffix);b.innerHTML=icon(symbol);b.onclick=fn;parent.append(b);return b;
}
qButton('compare','compare',()=>action('compare'),toolbar).id='tool-compare';
function questUI(){
 const d=QUESTS[Q.i],f=Q.flags,top=document.getElementById('quests');top.replaceChildren();
 for(const [mode,label]of [['student','quest'],['free','free'],['teacher','teacher']])qButton(label,label,()=>TEACHER.mode(mode),top).setAttribute('aria-pressed',String(T.mode===mode));
 QUESTS.forEach((row,i)=>{
  const locked=i>0&&!Q.completed.has(i-1)&&!Q.completed.has(i)&&i!==Q.i;
  const b=qButton('quest',row.icon,()=>{if(T.mode!=='student')TEACHER.select(i);else if(!locked)QUEST.go(i);},top,` ${i+1}`);
  b.className=`quest ${i===Q.i?'current':''} ${Q.completed.has(i)?'complete':''}`;
  b.setAttribute('aria-disabled',String(locked));
  if(Q.stars[i])b.innerHTML+=`<span class="q-stars">${icon('star').repeat(Q.stars[i])}</span>`;
 });
 const dots=document.createElement('span');dots.className='q-dots';dots.setAttribute('aria-hidden','true');
 dots.innerHTML=PHASES.map((p,j)=>`<i class="${j<PHASES.indexOf(Q.phase)?'done':''} ${p===Q.phase?'now':''}"></i>`).join('');top.append(dots);
 qPictures.replaceChildren();qPictures.hidden=Q.free;qPictures.className=Q.phase;
 if(!Q.free&&Q.phase==='predict')d.candidates.forEach((c,k)=>{const b=qButton('pick',d.icon,()=>QUEST.pick(k),qPictures,` ${k+1}`);b.dataset.candidate=k;b.innerHTML=CARDS.picture(d.id,c);});
 if(!Q.free&&Q.phase==='act'&&f.comparing){const picture=CARDS.comparison(d.id,QUEST.sample());if(picture)qPictures.innerHTML=`<div class="q-principle">${picture}</div>`;}
 if(!Q.free&&Q.phase==='confirm'){
  const chosen=d.candidates.find(c=>c.key===Q.pick)||d.candidates[0];
  qPictures.innerHTML=`<div class="q-compare ${QUEST.correct()?'matched':''}">${CARDS.picture(d.id,chosen)}${CARDS.actual(d.id,f.success||QUEST.sample())}${QUEST.correct()?icon('check'):''}</div>`;
  if(!QUEST.correct())qButton('replay','reset',()=>QUEST.skip('observe'),qPictures);
 }
 if(!Q.free&&Q.phase==='card'){
  qPictures.innerHTML=`<div class="q-principle">${d.card(f.success||QUEST.sample())}<span class="q-stars">${icon('star').repeat(Q.stars[Q.i])}</span></div>`;
  qButton(Q.i<5?'next':'free',Q.i<5?'next':'free',()=>Q.i<5?QUEST.go(Q.i+1):QUEST.mode(true),qPictures);
 }
 for(const name of ['play','mass0','mass1','mass2','orientation','cutaway','compare','reset']){
  const relevant=Q.free||d.handles.includes(name.startsWith('mass')?'mass':name==='reset'?'rail':name);
  document.getElementById(`tool-${name}`).classList.toggle('sub',!relevant);
 }
 document.body.dataset.qphase=Q.free?'free':Q.phase;
}

Object.assign(ICONS,Object.fromEntries([
 'M3 5h18M5 9v11m-3-3 3 3 3-3M19 20V9m-3 3 3-3 3 3',
 'M3 20h18M4 17h4v-4h4V9h4V4h4',
 'M3 5h18M3 19h18M7 8l4 4-4 4m10-8-4 4 4 4',
 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M2 12h5m10 0h5',
 'M3 21V3m0 18h18M7 17V7m5 10V11m5 6v-2',
 'M3 4v16m18-16v16M5 12h6m-3-3 3 3-3 3m11-3h-6m3-3-3 3 3 3',
 'M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18',
 'M3 3h18v8H3zM3 15l18 6M9 3v8M15 3v8',
 'M12 3c12 0 12 18 0 18s-12-14 0-14 9 10 0 10-5-6 0-6',
 'M3 18Q12 2 21 18M3 18h18M8 18v-3m8 3v-3',
 'M3 8h18v8H3zM6 5v14M18 5v14M10 12h4'
].map((path,i)=>[`layer${i}`,path])));
