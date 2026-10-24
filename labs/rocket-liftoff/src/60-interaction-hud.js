// Cream and ink tokens share the configured diagram palette.
if(typeof INK_CFG!=='undefined'&&document.documentElement?.style?.setProperty)for(const [name,value]of Object.entries({'--diagram-paper':css(INK_CFG.diagram.screen),'--diagram-ink':css(INK_CFG.diagram.ink),'--diagram-border':INK_CFG.diagram.borderPx+'px'}))document.documentElement.style.setProperty(name,value);
// Screen-reader language lives only in this dictionary; no visible text or tooltips.
const LABELS={
 canvas:{ko:'\ub85c\ucf13 \ubc1c\uc0ac\ub300 \ubaa8\ud615 \uc2e4\ud5d8\uc2e4',en:'Rocket launch model laboratory'},
 play:{ko:'\uc810\ud654 \ub610\ub294 \uc7ac\uc0dd \uc77c\uc2dc\uc815\uc9c0',en:'Ignite or play or pause'},
 reset:{ko:'\ucc98\uc74c \uc0c1\ud0dc',en:'Reset'},sound:{ko:'\uc18c\ub9ac \ucf1c\uae30 \ub610\ub294 \ub044\uae30',en:'Toggle sound'},
 minus:{ko:'\uc5d4\uc9c4 \uc904\uc774\uae30',en:'Remove engine'},plus:{ko:'\uc5d4\uc9c4 \ub298\ub9ac\uae30',en:'Add engine'},
 skip:{ko:'\ub2e4\uc74c \uc0ac\uac74',en:'Next event'},
 load0:{ko:'\ube48 \uc9d0 \ud648',en:'Empty cargo socket'},load1:{ko:'\uc911\uac04 \uc9d0',en:'Medium cargo'},load2:{ko:'\ud070 \uc9d0',en:'Large cargo'},
 earth:{ko:'\uc9c0\uad6c \uc911\ub825',en:'Earth gravity'},moon:{ko:'\ub2ec \uc911\ub825',en:'Lunar gravity'},
};
const ICONS={
 play:'M8 5l11 7-11 7z',pause:'M8 5v14M16 5v14',minus:'M6 12h12',plus:'M6 12h12M12 6v12',
 reset:'M4 10a8 8 0 1 1 1 8M4 4v6h6',skip:'M5 5l10 7-10 7zM19 5v14',
 sound:'M3 9h4l5-4v14l-5-4H3zM16 8q6 4 0 8M19 5q9 7 0 14',muted:'M3 9h4l5-4v14l-5-4H3zM16 9l6 6M22 9l-6 6',
 load0:'M4 9v11h16V9M8 4h8M6 12h12',load1:'M4 20h16M7 17V9h10v8z',load2:'M4 20h16M5 17V4h14v13zM8 7h8',
 earth:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M3 12h18M12 3c-5 6-5 12 0 18M12 3c5 6 5 12 0 18',
 moon:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M9 8h1M15 13h2M8 16h1',
 rocket:'M9 17V8l3-5 3 5v9M9 13l-4 5h4M15 13l4 5h-4M10 21v-2M14 21v-2',
 engines:'M4 5h16M7 5v8l-3 6h7l-3-6M15 5v8l-3 6h8l-3-6',
 fuel:'M7 3h10v18H7zM7 10h10M10 14h4M10 17h4',height:'M7 21V3M7 5h5M7 9h3M7 13h5M7 17h3M16 19V5l-3 3M16 5l3 3',
};
function icon(name){return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[name]}"/></svg>`;}
canvas.setAttribute('aria-label',LABELS.canvas[LANG]);
const toolbar=document.getElementById('tools');
for(const name of ['play','reset','sound','minus','plus','skip','load0','load1','load2','earth','moon']){
 const b=document.createElement('button');b.id=`tool-${name}`;b.type='button';b.setAttribute('aria-label',LABELS[name][LANG]);b.innerHTML=icon(name);b.addEventListener('click',()=>action(name));toolbar.append(b);
 if(name==='minus'){const dots=document.createElement('span');dots.id='engine-dots';dots.setAttribute('aria-hidden','true');toolbar.append(dots);}
}
// Layers belong to the free-experiment tool group, never the quest strip.
const layerGroup=document.createElement('div');layerGroup.id='q-layers';toolbar.append(layerGroup);
const layerLabels=[{ko:'힘 마디',en:'Force cells'},{ko:'상쇄와 지지',en:'Cancellation and support'},{ko:'이륙 문턱',en:'Threshold'},{ko:'엔진 계단',en:'Engine steps'},{ko:'탱크 단면',en:'Tank section'},{ko:'동일 시간 점',en:'Motion dots'},{ko:'조건 기록',en:'Pinned record'},{ko:'관찰 곡선',en:'Graphs'}];
Object.assign(ICONS,{
 layer0:'M5 21V3h6v18zM5 9h6M5 15h6',layer1:'M3 6h18M3 18h18M7 3l10 18M17 3 7 21',
 layer2:'M3 15h18M5 19v-8m14 8V7M8 5h8',layer3:'M3 20h5v-5h5v-5h5V4h4',
 layer4:'M3 5h18v14H3zM12 5v14M5 9h5m4 6h5',layer5:'M3 18h18M4 12h1m3 0h1m4 0h1m6 0h1',
 layer6:'M3 3h13v14H3zM8 8h13v13H8z',layer7:'M3 3v18h18M5 17l5-3 4 1 6-10'
});
GRAMMAR.LAYERS.forEach((name,i)=>{
 const b=document.createElement('button');b.type='button';b.dataset.layerIndex=String(i);b.setAttribute('aria-label',layerLabels[i][LANG]);
 b.innerHTML=icon(`layer${i}`);
 b.addEventListener('click',()=>{if(Q.free)GRAMMAR.set({[name]:!GRAMMAR.enabled[name]});});layerGroup.append(b);
});
let audioContext;
function tick(){
 if(!S.sound.target)return;
 audioContext ||= new(window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')void audioContext.resume();
 const o=audioContext.createOscillator(),gain=audioContext.createGain(),now=audioContext.currentTime;
 o.frequency.setValueAtTime(1300,now);o.frequency.exponentialRampToValueAtTime(750,now+.035);
 gain.gain.setValueAtTime(.035,now);gain.gain.exponentialRampToValueAtTime(.0001,now+.045);
 o.connect(gain).connect(audioContext.destination);o.start();o.stop(now+.05);
}
function prepare(){
 QUEST.invalidate();
 S.t.value=S.t.target=0;S.ignited.value=S.ignited.target=0;S.playing.value=S.playing.target=0;
}
function action(name){
 if(name!=='sound'&&!QUEST.allows(name))return;
 QUEST.touch();

 const desired=PHYS.sceneSelection(S.engines.target,S.load.target,S.g.target);
 if(name==='play'){
  for(const key of ['engines','load','g'])S[key].value=S[key].target;
  const v=selection(),landing=PHYS.stateAt(v.n,v.load,v.g,0).landingT,end=Number.isFinite(landing)?landing:PHYS.burnTime(v.n);
  if(S.t.target>=end)S.t.value=S.t.target=0;
  S.ignited.value=S.ignited.target=1;QUEST.ignite();S.playing.target=1-S.playing.target;
 }
 else if(name==='reset'){TEACHER.reset();}
 else if(name==='sound'){S.sound.target=1-S.sound.target;tick();}
 else if(name==='minus'||name==='plus'){set('engines',desired.n+(name==='plus'?1:-1));tick();}
 else if(name.startsWith('load')){set('load',PHYS.DETENTS.load[Number(name.slice(-1))].value);tick();}
 else if(name==='earth'||name==='moon'){set('g',name==='earth'?PHYS.C.earthG:PHYS.C.moonG);tick();}
 else if(name==='skip'){
  if(!S.ignited.target){action('play');S.playing.target=0;}
  const {n,load,g}=selection(),landing=PHYS.stateAt(n,load,g,0).landingT;
  const next=[PHYS.liftoffTime(n,load,g),PHYS.burnTime(n),landing].filter(t=>Number.isFinite(t)&&t>S.t.target+1e-6).sort((a,b)=>a-b)[0];
  if(next!==undefined)S.t.target=next;S.playing.value=S.playing.target=0;tick();
 }
 syncUI();
}
function syncUI(){
 const mission=document.getElementById('mission');
 mission.hidden=document.body.dataset.mode==='teacher';
 const text=missionText(Q.i,Q.phase,{...selection(),free:Q.free,before:Q.flags.before,ignited:!!S.ignited.target,correct:Q.pick===null||Q.pick===QUESTS[Q.i].answerKey});
 if(mission.textContent!==text){
  mission.textContent=text;
  if(!mission.hidden&&typeof matchMedia==='function'&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
   mission.getAnimations().forEach(a=>a.cancel());
   mission.animate([{opacity:0},{opacity:1}],{duration:120});
  }
 }
 const {n,load,g}=selection(),key=[n,load,g,S.playing.target,S.sound.target].join(':');if(S.uiKey===key)return;S.uiKey=key;
 const play=document.getElementById('tool-play'),sound=document.getElementById('tool-sound');
 play.innerHTML=icon(S.playing.target?'pause':'play');play.setAttribute('aria-pressed',String(!!S.playing.target));
 sound.innerHTML=icon(S.sound.target?'sound':'muted');sound.setAttribute('aria-pressed',String(!!S.sound.target));
 document.getElementById('engine-dots').innerHTML='<i></i>'.repeat(n);
 PHYS.DETENTS.load.forEach((d,i)=>document.getElementById(`tool-load${i}`).setAttribute('aria-pressed',String(load===d.value)));
 for(const [id,value]of [['earth',PHYS.C.earthG],['moon',PHYS.C.moonG]])document.getElementById(`tool-${id}`).setAttribute('aria-pressed',String(g===value));
}
function set(name,value){
 value=Number(value);if(!Number.isFinite(value))throw new TypeError(name);
 if(name==='engines'||name==='n'){prepare();S.engines.target=PHYS.engineRailX(clamp(Math.round(value),...PHYS.RANGE.engines));}
 else if(name==='load'){prepare();const d=PHYS.DETENTS.load.reduce((a,b)=>Math.abs(a.value-value)<Math.abs(b.value-value)?a:b);S.load.target=d.x;}
 else if(name==='g'){prepare();const d=PHYS.DETENTS.g.reduce((a,b)=>Math.abs(a.value-value)<Math.abs(b.value-value)?a:b);S.g.target=d.x;}
 else if(name==='t'){
  const {n,load,g}=selection(),landing=PHYS.stateAt(n,load,g,0).landingT;
  S.t.target=clamp(value,0,Number.isFinite(landing)?landing:PHYS.burnTime(n));
 }
 else if(['playing','sound','ignited'].includes(name))S[name].target=value?1:0;
 else throw new RangeError(name);
 syncUI();
}
function preset(index){
 // Input combinations, never hand-authored physical output. 0 is the unlit initial state.
 const states=[
  [1,0,PHYS.C.earthG,0,false],
  [1,0,PHYS.C.earthG,PHYS.burnTime(1),true],
  [4,0,PHYS.C.earthG,30,true],
  [5,0,PHYS.C.earthG,10,true],
  [5,PHYS.C.loads[1],PHYS.C.earthG,10,true],
  [5,PHYS.C.loads[2],PHYS.C.earthG,10,true],
  [1,0,PHYS.C.moonG,30,true],
 ];
 if(!Number.isInteger(index)||index<0||index>=states.length)throw new RangeError('preset');
 const[n,load,g,t,ignited]=states[index];prepare();
 for(const[key,value]of Object.entries({engines:PHYS.engineRailX(n),load:PHYS.loadRailX(load),g:PHYS.gRailX(g),t,ignited:+ignited}))S[key].value=S[key].target=value;
 syncUI();return {n,load,g,t,ignited};
}
// Enlarged geometric hit regions; discrete choices also have 56px toolbar targets.
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),hitObjects=[];
function hitRegion(parent,center,radius,kind,index){
 const hit=KIT.ball(radius,new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),parent,...center,1);
 hit.castShadow=hit.receiveShadow=false;hit.userData={kind,index};hitObjects.push(hit);return hit;
}
hitRegion(CONTROL_FACE,C.dial.position,C.dial.hit,'dial');hitRegion(CONTROL_FACE,C.play.position,C.play.hit,'play');
hitRegion(CONTROL_FACE,C.gravity.position,C.gravity.hit,'gravity');
const sliderHit=KIT.roundedPanel(C.slider.width+.08,C.slider.hitHeight,C.slider.hitDepth,new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),CONTROL_FACE,...C.slider.position);
sliderHit.userData.kind='slider';sliderHit.castShadow=sliderHit.receiveShadow=false;hitObjects.push(sliderHit);
hitRegion(ENGINE_HANDLE,[0,0,0],.09,'engines');
LOAD_SAMPLES.forEach((o,i)=>hitRegion(HERO,[o.position.x,1.14,.13],.12,'load',i));
GLOBES.forEach((o,i)=>hitRegion(HERO,o.position.toArray(),.16,'globe',i));
GRAPHS.forEach((o,i)=>{o.mesh.userData={kind:'graph',index:i};hitObjects.push(o.mesh);});
function rayFromEvent(event){const r=canvas.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);}
function setRailFromPointer(u){
 u=clamp(u,0,1);const near=PHYS.DETENTS.engines.reduce((a,b)=>Math.abs(a.x-u)<Math.abs(b.x-u)?a:b);
 const magnetic=Math.abs(near.x-u)<=.012,chosen=PHYS.enginesFromRailX(magnetic?near.x:u);
 if((magnetic&&S.snap!==near.x)||PHYS.enginesFromRailX(S.engines.target)!==chosen)tick();
 S.snap=magnetic?near.x:null;prepare();S.engines.target=PHYS.engineRailX(chosen);
}
canvas.addEventListener('pointerdown',event=>{
 if(event.button!==0||S.drag)return;scene.updateMatrixWorld(true);rayFromEvent(event);
 const hit=raycaster.intersectObjects(hitObjects,false)[0];if(!hit)return;
 const {kind,index}=hit.object.userData;
 if(!QUEST.allows(kind)){event.stopImmediatePropagation();return;}QUEST.touch();
 if(['play','gravity','load','globe'].includes(kind)){
  if(kind==='play')action('play');if(kind==='gravity')set('g',PHYS.gFromRailX(1-S.g.target));
  if(kind==='load')set('load',PHYS.DETENTS.load[index].value);if(kind==='globe')set('g',PHYS.DETENTS.g[index].value);
  tick();event.stopImmediatePropagation();return;
 }
 const local=['dial','slider','graph'].includes(kind),normal=local?V3(0,0,1).transformDirection(CONTROL_FACE.matrixWorld):V3(0,0,1);
 const plane=new THREE.Plane().setFromNormalAndCoplanarPoint(normal,hit.point),start=raycaster.ray.intersectPlane(plane,V3());if(!start)return;
 if(local)CONTROL_FACE.worldToLocal(start);
 S.drag={kind,index,id:event.pointerId,plane,local,start,u:S.engines.target,angle:Math.atan2(start.x-C.dial.position[0],start.y-C.dial.position[1])};
 controls.enabled=false;S.fly=null;canvas.setPointerCapture(event.pointerId);event.stopImmediatePropagation();
},{capture:true});
canvas.addEventListener('pointermove',event=>{
 const d=S.drag;if(!d||d.id!==event.pointerId)return;rayFromEvent(event);const p=raycaster.ray.intersectPlane(d.plane,V3());if(!p)return;if(d.local)CONTROL_FACE.worldToLocal(p);
 if(d.kind==='slider'||d.kind==='engines')setRailFromPointer(d.u+(p.x-d.start.x)/(d.kind==='slider'?SLIDER.width:.75));
 if(d.kind==='dial'){
  const angle=Math.atan2(p.x-C.dial.position[0],p.y-C.dial.position[1]),delta=Math.atan2(Math.sin(angle-d.angle),Math.cos(angle-d.angle));
  d.u=PHYS.dialRailAfterTurn(d.u,delta);d.angle=angle;setRailFromPointer(d.u);
 }
 if(d.kind==='graph'){
  const graph=GRAPHS[d.index],{n,load,g}=selection(),land=PHYS.stateAt(n,load,g,0).landingT;
  const horizon=Number.isFinite(land)?land:PHYS.burnTime(n);
  const width=graph.mesh.geometry.parameters.width,u=PHYS.graphTimeRailX((p.x-graph.mesh.position.x+width/2)/width);S.playing.value=S.playing.target=0;
  // Scrubbing observes an actual ignited run; an untouched graph remains empty.
  S.ignited.value=S.ignited.target=1;QUEST.ignite();S.t.target=u*horizon;
 }
 event.stopImmediatePropagation();
},{capture:true});
function endDrag(event){if(!S.drag||event.pointerId!==S.drag.id)return;S.drag=null;S.snap=null;controls.enabled=true;if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);}
for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,endDrag);
window.addEventListener('keydown',event=>{if(event.key!=='/'||event.repeat)return;S.ui.target=1-S.ui.target;document.body.classList.toggle('hide-ui',!S.ui.target);window.__site?.setVisible(!!S.ui.target);event.preventDefault();});
function textAudit(){
 const found=[],walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 while(walker.nextNode()){
  const node=walker.currentNode,parent=node.parentElement;if(!parent||parent.closest('script,style,template,[hidden]')||parent.closest('#mission[data-mission]'))continue;
  const range=document.createRange();range.selectNodeContents(node);const r=range.getBoundingClientRect();
  let visible=true;for(let e=parent;e;e=e.parentElement){const style=getComputedStyle(e);if(style.visibility==='hidden'||style.display==='none'||+style.opacity===0)visible=false;}
  if(!visible||!r.width||!r.height||r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth)continue;
  const content=node.textContent.trim(),numeric=parent.closest('[data-numeric]');
  const words=numeric?(T.mode==='teacher'&&T.numbers&&/^[-+−\d.,\s]+(?:kg|N|m\/s²|km|m|s|h|°|×)?$/u.test(content)?null:[content]):content.match(/[\p{L}\p{N}]+/gu);if(words)found.push({words,x:r.x,y:r.y,width:r.width,height:r.height});
 }
 return found;
}

Object.assign(LABELS,{
 quest:{ko:'퀘스트',en:'Quest'},free:{ko:'자유 실험',en:'Free experiment'},pick:{ko:'예상 선택',en:'Choose prediction'},
 inspect:{ko:'두 상태 관찰',en:'Observe both states'},pin:{ko:'조건 기록 고정',en:'Pin condition record'},next:{ko:'다음 퀘스트',en:'Next quest'},replay:{ko:'다시 관찰',en:'Observe again'}
});
Object.assign(ICONS,{
 quest:'M4 19V5h16v14zM8 9h8M8 13h5',free:'M4 17l4-10 4 10 4-10 4 10',inspect:'M16 16l5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
 pin:'M8 3h8l-2 7 4 4H6l4-4zM12 14v8',next:'M5 12h14m-6-6 6 6-6 6',check:'M4 12l5 5L20 5',
 star:'M12 3l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',hand:'M9 14V5a2 2 0 0 1 4 0v7-3a2 2 0 0 1 4 0v3-1a2 2 0 0 1 4 0v5q0 6-7 6h-3l-7-8q-1-3 2-2z'
});
const qPictures=document.createElement('div');qPictures.id='q-pictures';qPictures.className='hud';document.body.append(qPictures);
const qOverlay=document.createElement('div');qOverlay.id='q-overlay';qOverlay.setAttribute('aria-hidden','true');document.body.append(qOverlay);
for(const name of ['pin','inspect']){
 const b=document.createElement('button');b.id=`tool-${name}`;b.type='button';b.setAttribute('aria-label',LABELS[name][LANG]);b.innerHTML=icon(name);b.addEventListener('click',()=>{if(Q.free&&name==='pin')GRAMMAR.pin();else QUEST.open(name);});toolbar.insertBefore(b,layerGroup);
}
function qButton(name,symbol,fn,parent,suffix=''){
 const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',LABELS[name][LANG]+suffix);b.innerHTML=icon(symbol);b.addEventListener('click',fn);parent.append(b);return b;
}
function questUI(){
 const d=QUESTS[Q.i],f=Q.flags,top=document.getElementById('quests');top.removeAttribute('aria-hidden');top.replaceChildren();
 qButton('quest','quest',()=>TEACHER.mode('student'),top).setAttribute('aria-pressed',String(typeof T==='undefined'?!Q.free:T.mode==='student'));
 qButton('free','free',()=>TEACHER.mode('free'),top).setAttribute('aria-pressed',String(typeof T==='undefined'?Q.free:T.mode==='free'));
 if(typeof T!=='undefined')qButton('teacher','teacher',()=>TEACHER.mode('teacher'),top).setAttribute('aria-pressed',String(T.mode==='teacher'));
 if(typeof T==='undefined'||T.mode!=='teacher') QUESTS.forEach((row,i)=>{
  const unlocked=i===0||Q.completed.has(i-1)||Q.completed.has(i),b=qButton('quest',row.icon,()=>{if(unlocked)QUEST.go(i);},top,` ${i+1}`);
  b.className=`quest ${i===Q.i?'current':''} ${Q.completed.has(i)?'complete':''}`;b.setAttribute('aria-disabled',String(!unlocked));
  b.innerHTML+=`<span class="q-dots">${'<i></i>'.repeat(i===Q.i?['intro','predict','act','observe','confirm','card'].indexOf(Q.phase)+1:1)}</span>`;
  if(Q.stars[i])b.innerHTML+=`<span class="q-stars">${icon('star').repeat(Q.stars[i])}</span>`;
 });
 qPictures.replaceChildren();qPictures.dataset.phase=Q.phase;qPictures.hidden=Q.free||['intro','act','observe'].includes(Q.phase);
 if(!Q.free&&Q.phase==='predict')d.candidates.forEach((c,k)=>{const b=qButton('pick',d.icon,()=>QUEST.pick(k),qPictures,` ${k+1}`);b.dataset.candidate=k;b.innerHTML=CARDS.picture(d.id,c);});
 if(!Q.free&&Q.phase==='confirm'){
  const c=d.candidates.find(c=>c.key===Q.pick)||d.candidates[0],match=Q.stars[Q.i]===3;
  qPictures.innerHTML=`<div class="q-compare ${match?'matched':''}">${CARDS.picture(d.id,c)}${CARDS.actual(d.id,f.success||QUEST.sample())}${match?icon('check'):''}</div>`;
  if(!match)qButton('replay','reset',()=>QUEST.skip('event'),qPictures);
 }
 if(!Q.free&&Q.phase==='card'){
  const content=d.card(f.success||QUEST.sample());qPictures.hidden=!content;
  if(content){
  qPictures.innerHTML=`<div class="q-principle">${content}<span class="q-stars">${icon('star').repeat(Q.stars[Q.i])}</span></div>`;
  qButton(Q.i<5?'next':'free',Q.i<5?'next':'free',()=>Q.i<5?QUEST.go(Q.i+1):QUEST.mode(true),qPictures);
  }
 }
 layerGroup.hidden=!Q.free;document.body.dataset.qphase=Q.free?'free':Q.phase;
 for(const b of toolbar.querySelectorAll('button')){const name=b.id.replace('tool-','');b.classList.toggle('sub',!Q.free&&name!=='sound'&&name!=='reset'&&!d.controls.includes(({plus:'engines',minus:'engines',load0:'load',load1:'load',load2:'load',earth:'g',moon:'g'})[name]||name));}
 syncUI();
}
