const LABELS={
  canvas:{ko:'천체와 무게 실험실',en:'Worlds and weight laboratory'},
  run:{ko:'점프 시험 실행',en:'Run jump trial'},pause:{ko:'시험 일시정지 또는 계속',en:'Pause or resume trial'},
  reset:{ko:'처음 상태',en:'Reset'},sound:{ko:'소리 켜기 또는 끄기',en:'Toggle sound'},
  bodyPrev:{ko:'이전 천체',en:'Previous world'},bodyNext:{ko:'다음 천체',en:'Next world'},
  massMinus:{ko:'추 하나 빼기',en:'Remove one weight'},massPlus:{ko:'추 하나 넣기',en:'Add one weight'},
  body:{ko:'선택 천체 견본',en:'Selected world specimen'},camera:{ko:'다음 카메라 샷',en:'Next camera shot'},
  inspect:{ko:'양팔 평형 또는 계측 상한 확인',en:'Inspect balance or measurement limit'},
  quest:{ko:'퀘스트',en:'Quests'},free:{ko:'자유 실험',en:'Free exploration'},
  pick:{ko:'예상 그림',en:'Prediction'},next:{ko:'다음 퀘스트',en:'Next quest'},
  replay:{ko:'예상과 실제 다시 비교',en:'Replay prediction comparison'},
  layerGroup:{ko:'표현 층 열기',en:'Open representation layers'},
  layers:[
    {ko:'무게 크기 층',en:'Weight magnitude layer'}, {ko:'천체 변경 비교 층',en:'World comparison layer'},
    {ko:'질량 불변 층',en:'Mass conservation layer'}, {ko:'추 개수와 무게 비례 층',en:'Weight proportion layer'},
    {ko:'계측 한계 층',en:'Measurement limit layer'}, {ko:'점프 비교 층',en:'Jump comparison layer'},
    {ko:'중력 방향 단면 층',en:'Gravity section layer'}, {ko:'시험 기록 층',en:'Trial record layer'},
    {ko:'양의 관계 그래프 층',en:'Relationship graph layer'}],
  bodies:[{ko:'지구',en:'Earth'},{ko:'달',en:'Moon'},{ko:'명왕성',en:'Pluto'},{ko:'화성',en:'Mars'},
    {ko:'금성',en:'Venus'},{ko:'토성',en:'Saturn'},{ko:'목성',en:'Jupiter'},{ko:'태양',en:'Sun'},
    {ko:'중성자별',en:'Neutron star'},{ko:'우주 공간',en:'Space'}]
};
const ICONS={
  run:'M4 18h16M7 14l5-8 5 8M12 6v12',pause:'M8 5v14M16 5v14',play:'M8 5l11 7-11 7z',
  reset:'M4 10a8 8 0 1 1 1 8M4 4v6h6',sound:'M3 9h4l5-4v14l-5-4H3zM16 8q6 4 0 8M19 5q9 7 0 14',
  muted:'M3 9h4l5-4v14l-5-4H3zM16 9l6 6M22 9l-6 6',
  bodyPrev:'M15 5l-7 7 7 7',bodyNext:'M9 5l7 7-7 7',massMinus:'M5 12h14',massPlus:'M5 12h14M12 5v14',
  body:'M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0',camera:'M3 7h4l2-3h6l2 3h4v13H3zM16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  spring:'M8 3h8M12 3v3l-4 2 8 3-8 3 8 3-4 2v2',balance:'M12 4v16M5 20h14M4 8h16M4 8l-3 7h6zM20 8l-3 7h6z',
  jump:'M5 20h14M12 17V5M8 9l4-4 4 4',limit:'M5 3v18M19 3v18M8 12l3-3 2 6 3-3',
  ring:'M21 8c2 3-2 7-7 9S3 19 2 16s2-7 8-9 10-2 11 1M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  earth:'M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0M6 6l5 2-2 5 5 3 2-5 4-1',
  moon:'M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0M8 7h1M15 10h2M10 16h1',
  rock:'M6 5l8-2 7 9-5 8-10-2-3-8zM7 9l4 3 4-6M11 12l4 6',
  band:'M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0M6 7h12M4 11h16M5 16h14',
  star:'M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0',
  compact:'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0M5 4l14 16M4 15l16-6',
  space:'M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5'
};
Object.assign(ICONS,{
  quest:'M5 20V4h14l-3 5 3 5H5',free:'M4 4h16v16H4zM8 8v8m8-8v8M6 12h4m4 0h4',
  target:'M4 4h16v16H4zM8 8h8v8H8z',check:'M4 12l5 5L21 5',next:'M5 12h14m-6-6 6 6-6 6',
  award:'M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
  layerGroup:'M3 8l9-5 9 5-9 5zM3 13l9 5 9-5M3 18l9 5 9-5',inspect:'M4 12l5 5L21 5'
});

Object.assign(ICONS,{"layer0": "M3 4h18v16H3zM6 8h12M6 12h8M6 16h10", "layer1": "M3 8l9-5 9 5-9 5zM3 14l9 5 9-5", "layer2": "M5 3h14M8 6l8 3-8 3 8 3-8 3M5 21h14", "layer3": "M3 18h18M5 14h14M7 10h10M10 4h4v6", "layer4": "M12 3v18M3 10l9-4 9 4M3 10v6h6v-6m6 0v6h6v-6", "layer5": "M3 21h18M6 18V8h4v10m4 0V3h4v15", "layer6": "M4 3h16v4H4zM12 7v14m-4-4 4 4 4-4", "layer7": "M5 3v18h14V3M5 7h14M5 11h14M5 15h14M5 19h14", "layer8": "M4 5h7v14H4zM14 3h6v18h-6z", "layer9": "M3 6h7v4H3zM14 6h7v4h-7zM3 15h7v4H3zM14 15h7v4h-7z", "layer10": "M3 20h5v-5h5v-5h5V4h3", "layer11": "M3 5h18M3 19h18M7 8l5 5-5 3m10-8-5 5 5 3", "layer12": "M3 21V3M3 21h18M7 17Q12 3 20 5", "layer13": "M3 3l7 7m4 0 7-7M3 21l7-7m4 0 7 7M10 10h4v4h-4z", "layer14": "M4 3h16v18H4zM8 7h8M8 12h8M8 17h8", "layer15": "M3 21V3M3 21h18M6 17l5-4 4 2 6-10", "hand": "M8 12V5q0-3 2-3t2 3v6-7q0-2 2-2t2 2v7-4q0-2 2-2t2 2v8l-4 6H9l-6-7q-1-3 2-3z"});
function icon(name){return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[name]||ICONS.body}"/></svg>`;}
canvas.setAttribute('aria-label',LABELS.canvas[LANG]);
const toolbar=document.getElementById('tools');
for(const name of ['run','pause','reset','sound','inspect','bodyPrev','body','bodyNext','massMinus','massPlus']){
  const button=document.createElement('button');button.id=`tool-${name}`;button.setAttribute('aria-label',LABELS[name][LANG]);
  button.innerHTML=icon(name);button.addEventListener('click',()=>action(name));toolbar.append(button);
}
const layerGroup=document.createElement('div');layerGroup.id='layer-group';layerGroup.hidden=true;toolbar.append(layerGroup);
const layerToggle=document.createElement('button');layerToggle.id='tool-layerGroup';layerToggle.setAttribute('aria-label',LABELS.layerGroup[LANG]);layerToggle.innerHTML=icon('layerGroup');
layerToggle.onclick=()=>{layerGroup.hidden=!layerGroup.hidden;layerToggle.setAttribute('aria-expanded',String(!layerGroup.hidden));};toolbar.append(layerToggle);
GRAMMAR.LAYERS.forEach((name,k)=>{
  const button=document.createElement('button');button.dataset.layer=name;
  button.setAttribute('aria-label',LABELS.layers[k][LANG]);
  button.setAttribute('aria-pressed',String(GRAMMAR.enabled[name]));
  button.innerHTML=icon(`layer${k+7}`);
  button.addEventListener('click',()=>GRAMMAR.set({[name]:!GRAMMAR.enabled[name]}));
  layerGroup.append(button);
});
let audioContext;
function tick(){
  if(!S.sound.target)return;
  audioContext||=new(window.AudioContext||window.webkitAudioContext)();
  if(audioContext.state==='suspended')void audioContext.resume();
  const o=audioContext.createOscillator(),gain=audioContext.createGain(),now=audioContext.currentTime;
  o.frequency.setValueAtTime(1300,now);o.frequency.exponentialRampToValueAtTime(750,now+0.035);
  gain.gain.setValueAtTime(0.035,now);gain.gain.exponentialRampToValueAtTime(0.0001,now+0.045);
  o.connect(gain).connect(audioContext.destination);o.start();o.stop(now+0.05);
}
function runTrial(){
  const i=S.body.target,n=S.nWeights.target;
  S.body.value=i;S.nWeights.value=n;
  S.trial=PHYS.jumpTrial(i,n,++S.runId);S.t.value=S.t.target=0;S.playing.value=S.playing.target=1;tick();
  QUEST.trial(S.trial);
}
function action(name){
  const control=['bodyPrev','bodyNext','body'].includes(name)?'body':['massMinus','massPlus'].includes(name)?'mass':name;
  if(name!=='reset'&&!QUEST.allows(control))return;
  QUEST.touch();
  const previousBody=S.body.target,previousWeights=S.nWeights.target;
  if(name==='run')runTrial();
  if(name==='pause'&&S.trial)S.playing.target=1-S.playing.target;
  if(name==='sound'){S.sound.target=1-S.sound.target;tick();}
  if(name==='reset')TEACHER.reset();
  if(name==='inspect')QUEST.inspect();
  if(name==='bodyPrev')set('body',(S.body.target+PHYS.RANGE.body[1])%PHYS.BODIES.length);
  if(name==='bodyNext'||name==='body')set('body',(S.body.target+1)%PHYS.BODIES.length);
  if(name==='massMinus')set('nWeights',S.nWeights.target-1);
  if(name==='massPlus')set('nWeights',S.nWeights.target+1);
  if(name==='camera'){const count=S.vertical?SHOTS_VERTICAL.length:SHOTS.length;shot((Number.isInteger(S.shotIndex)?S.shotIndex+1:0)%count,S.vertical);}
  if(previousBody!==S.body.target||previousWeights!==S.nWeights.target)tick();
  syncUI();
}
function syncUI(){
  const key=`${Math.round(S.body.value)}:${Math.round(S.nWeights.value)}:${S.playing.target}:${S.sound.target}`;
  if(toolbar.dataset.key===key)return;toolbar.dataset.key=key;
  const i=Math.round(S.body.value),bodyNames=['earth','moon','rock','rock','band','ring','band','star','compact','space'];
  const selected=document.getElementById('tool-body');selected.innerHTML=icon(bodyNames[i]);
  selected.style.color='#'+new THREE.Color(INK_CFG.diagram.ink).getHexString();selected.setAttribute('aria-label',LABELS.bodies[i][LANG]);
  document.getElementById('tool-pause').innerHTML=icon(S.playing.target?'pause':'play');
  document.getElementById('tool-pause').setAttribute('aria-pressed',String(!!S.playing.target));
  document.getElementById('tool-sound').innerHTML=icon(S.sound.target?'sound':'muted');
  document.getElementById('tool-sound').setAttribute('aria-pressed',String(!!S.sound.target));
  const count=Math.round(S.nWeights.value);
  // Countable dots share the same weight state as both physical rails.
  const plus=document.getElementById('tool-massPlus');plus.innerHTML=icon('massPlus').replace('</svg>',Array.from({length:count},(_,k)=>`<circle cx="${4+k*4}" cy="22" r="0.8"/>`).join('')+'</svg>');
}
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
const HIT_MATERIAL=new THREE.MeshBasicMaterial({visible:false});
function hitBox(parent,w,h,d,x,y,z,type){const mesh=KIT.mesh(new THREE.BoxGeometry(w,h,d),HIT_MATERIAL,parent,x,y,z);mesh.userData.control=type;mesh.castShadow=false;return mesh;}
const specimenHits=SPECIMENS.map((s,i)=>{const hit=KIT.ball(0.095,HIT_MATERIAL,s.group);hit.userData.body=i;hit.castShadow=false;return hit;});
const dragObjects=[
  ...[['dial','bodyDial'],['slider','mass'],['run','run'],['sound','sound']].map(([key,type])=>{
    const c=CONTROL_LAYOUT[key];return hitBox(CONTROL_FACE,...c.hit,...c.at,type);
  }),
  hitBox(BALANCE_RIG,0.95,0.23,0.20,0,1.15,0.30,'massHero'),
  hitBox(SHELF_RIG,1.20,0.22,1.20,0,0.99,0,'carousel'),
  hitBox(JUMP_RIG,0.22,0.23,0.22,0.24,1.16,0.27,'run'),
  ...GRAPHS.map((g,k)=>{g.mesh.userData.control=k?'bodyGraph':'massGraph';return g.mesh;})
];
function rayFromEvent(event){const r=canvas.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);}
function setRailFromPointer(name,u){
  u=clamp(u,0,1);const detents=PHYS.DETENTS[name];
  const near=detents.reduce((a,b)=>Math.abs(b.x-u)<Math.abs(a.x-u)?b:a);
  const snapped=Math.abs(near.x-u)<=0.012,key=snapped?`${name}:${near.x}`:null;
  if(key&&S.snap!==key)tick();S.snap=key;
  set(name,name==='body'?PHYS.bodyFromRailX(snapped?near.x:u):PHYS.weightsFromRailX(snapped?near.x:u));
}
canvas.addEventListener('pointerdown',event=>{
  if(event.button!==0)return;rayFromEvent(event);scene.updateMatrixWorld(true);
  const picked=raycaster.intersectObjects(specimenHits,false)[0];
  if(picked){if(QUEST.allows('body')){QUEST.touch();set('body',picked.object.userData.body);tick();}event.stopImmediatePropagation();return;}
  const hit=raycaster.intersectObjects(dragObjects,false)[0];if(!hit)return;
  const type=hit.object.userData.control;
  const control=['carousel','bodyDial','bodyGraph'].includes(type)?'body':['mass','massHero','massGraph'].includes(type)?'mass':type;
  if(!QUEST.allows(control)){event.stopImmediatePropagation();return;}QUEST.touch();
  if(type==='run'||type==='sound'){action(type);event.stopImmediatePropagation();return;}
  const world=hit.object.getWorldPosition(V3());
  const normal=V3(0,0,1).applyQuaternion(hit.object.getWorldQuaternion(new THREE.Quaternion()));
  const plane=new THREE.Plane().setFromNormalAndCoplanarPoint(normal,world),p=raycaster.ray.intersectPlane(plane,V3());if(!p)return;
  const local=hit.object.parent.worldToLocal(p.clone());
  S.drag={type,id:event.pointerId,plane,start:local,body:S.body.target,nWeights:S.nWeights.target,
    angle:Math.atan2(local.x-CONTROL_LAYOUT.dial.at[0],local.y-CONTROL_LAYOUT.dial.at[1]),object:hit.object};
  controls.enabled=false;S.fly=null;canvas.setPointerCapture(event.pointerId);event.stopImmediatePropagation();
},{capture:true});
canvas.addEventListener('pointermove',event=>{
  const d=S.drag;if(!d||d.id!==event.pointerId)return;
  rayFromEvent(event);const world=raycaster.ray.intersectPlane(d.plane,V3());if(!world)return;
  const p=d.object.parent.worldToLocal(world.clone());
  if(d.type==='mass'||d.type==='massHero'){
    const width=d.type==='mass'?SLIDER.width:MASS_RAIL.width;
    setRailFromPointer('nWeights',PHYS.railX(d.nWeights)+(p.x-d.start.x)/width);
  }
  if(d.type==='carousel')setRailFromPointer('body',PHYS.bodyRailX(d.body)+(p.x-d.start.x)/(PHYS.VIEW.carouselRadius*2));
  if(d.type==='bodyDial'){
    const angle=Math.atan2(p.x-CONTROL_LAYOUT.dial.at[0],p.y-CONTROL_LAYOUT.dial.at[1]),delta=Math.atan2(Math.sin(angle-d.angle),Math.cos(angle-d.angle));
    setRailFromPointer('body',PHYS.bodyRailX(d.body)+delta/(Math.PI*1.7));
  }
  if(d.type==='massGraph'||d.type==='bodyGraph'){
    const local=d.object.worldToLocal(world.clone());
    // Plot limits stay in texture space; width comes from the shared panel layout.
    const u=(local.x/CONTROL_LAYOUT.graphs[d.type==='massGraph'?0:1].size[0]+0.5-52/768)/((724-52)/768);
    setRailFromPointer(d.type==='massGraph'?'nWeights':'body',u);
  }
  event.stopImmediatePropagation();
},{capture:true});
function endDrag(event){
  if(!S.drag||S.drag.id!==event.pointerId)return;
  S.drag=null;S.snap=null;controls.enabled=true;
  if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
}
canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);canvas.addEventListener('lostpointercapture',endDrag);
window.addEventListener('keydown',event=>{
  if(event.key!=='/'||event.repeat)return;S.ui.target=1-S.ui.target;
  document.body.classList.toggle('hide-ui',!S.ui.target);window.__site?.setVisible(!!S.ui.target);event.preventDefault();
});
function set(name,value){
  if(!['body','nWeights','playing','t','sound'].includes(name))throw new RangeError(name);
  if(typeof value==='boolean')value=Number(value);
  if(typeof value!=='number'||!Number.isFinite(value))throw new TypeError(name);
  if(name==='body'||name==='nWeights'){
    const range=PHYS.RANGE[name];value=clamp(Math.round(value),...range);
    if(S[name].target!==value){S.trial=null;S.playing.value=S.playing.target=0;S.t.value=S.t.target=0;}
  }else if(name==='t')value=Math.max(0,value);else value=value?1:0;
  S[name].target=value;
}
const PRESETS=[{body:0,nWeights:5},{body:1,nWeights:5},{body:6,nWeights:5},{body:7,nWeights:5},
  {body:8,nWeights:5},{body:4,nWeights:5},{body:9,nWeights:5}];
function preset(index){
  if(!Number.isInteger(index)||index<0||index>=PRESETS.length)throw new RangeError('preset');
  const p=PRESETS[index];for(const name of ['body','nWeights'])S[name].value=S[name].target=p[name];
  S.trial=null;S.playing.value=S.playing.target=0;S.t.value=S.t.target=0;S.graphKeys=[];syncUI();return {...p};
}
function textAudit(){
  const found=[],walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){
    const node=walker.currentNode,parent=node.parentElement;
    if(!parent||parent.closest('script,style,template,[hidden]'))continue;
    const range=document.createRange();range.selectNodeContents(node);const r=range.getBoundingClientRect();
    let visible=!!r.width&&!!r.height&&r.bottom>=0&&r.top<=innerHeight&&r.right>=0&&r.left<=innerWidth;
    for(let el=parent;el&&visible;el=el.parentElement){const style=getComputedStyle(el);visible=style.visibility!=='hidden'&&style.display!=='none'&&+style.opacity!==0;}
    const content=node.textContent.trim(),numeric=parent.closest('[data-numeric]');
    const words=numeric?(T.mode==='teacher'&&T.numbers&&/^[-+−\d.,\s]+(?:km|m|s|h|°|×|kg|N|m\/s²)?$/u.test(content)?null:[content]):content.match(/[\p{L}\p{N}]+/gu);
    if(visible&&words)found.push({words,x:r.x,y:r.y,width:r.width,height:r.height});
  }return found;
}

const qPictures=document.createElement('div');qPictures.id='q-pictures';document.body.append(qPictures);
const qOverlay=document.createElement('div');qOverlay.id='q-overlay';qOverlay.setAttribute('aria-hidden','true');document.body.append(qOverlay);
function qButton(label,symbol,fn,parent,suffix=''){
  const b=document.createElement('button');b.setAttribute('aria-label',LABELS[label][LANG]+suffix);b.innerHTML=icon(symbol);b.onclick=fn;parent.append(b);return b;
}
function questUI(){
  const d=QUESTS[Q.i],f=Q.flags,top=document.getElementById('quests');top.removeAttribute('aria-hidden');top.replaceChildren();
  for(const mode of ['student','free','teacher'])qButton(mode==='student'?'quest':mode,mode==='student'?'quest':mode,()=>TEACHER.mode(mode),top).setAttribute('aria-pressed',String(T.mode===mode));
  QUESTS.forEach((row,i)=>{
    const locked=T.mode==='student'&&i>0&&!Q.completed.has(i-1)&&!Q.completed.has(i);
    const b=qButton('quest',row.icon,()=>{if(!locked){if(T.mode==='teacher')TEACHER.select(i);else QUEST.go(i);}},top,` ${i+1}`);
    b.className=`quest ${i===Q.i?'current':''} ${Q.completed.has(i)?'complete':''}`;
    b.setAttribute('aria-disabled',String(locked));
    b.innerHTML+=`<span class="q-dots">${Array.from({length:6},(_,k)=>`<i class="${i===Q.i&&k<=['intro','predict','act','observe','confirm','card'].indexOf(Q.phase)?'lit':''}"></i>`).join('')}</span>`;
  });
  qPictures.replaceChildren();qPictures.className=Q.phase;qPictures.hidden=Q.free;
  if(!Q.free&&Q.phase==='predict')d.candidates.forEach((c,k)=>{const b=qButton('pick',d.icon,()=>QUEST.pick(k),qPictures,` ${k+1}`);b.dataset.candidate=k;b.innerHTML=CARDS.picture(d.id,c);});
  if(!Q.free&&Q.phase==='confirm'){
    const chosen=d.candidates.find(c=>c.key===Q.pick)||d.candidates.find(c=>c.key===d.answerKey),s=f.success||QUEST.sample();
    qPictures.innerHTML=`<div class="q-compare ${Q.stars[Q.i]===3?'matched':''}">${CARDS.picture(d.id,chosen)}${CARDS.actual(d.id,s)}${Q.stars[Q.i]===3?icon('check'):''}</div>`;
    if(Q.stars[Q.i]===2)qButton('replay','reset',()=>{DIRECTOR.event(s);QUEST.phase('confirm');},qPictures);
  }
  if(!Q.free&&Q.phase==='card'){
    qPictures.innerHTML=`<div class="q-principle">${d.card(f.success||QUEST.sample())}<span class="q-stars">${icon('award').repeat(Q.stars[Q.i])}</span></div>`;
    qButton(Q.i===6?'free':'next',Q.i===6?'free':'next',()=>Q.i===6?QUEST.mode(true):QUEST.go(Q.i+1),qPictures);
  }
  for(const b of toolbar.querySelectorAll('button:not([data-layer])')){
    const name=b.id.replace('tool-',''),control=['bodyPrev','bodyNext','body'].includes(name)?'body':['massMinus','massPlus'].includes(name)?'mass':name;
    b.classList.toggle('sub',!Q.free&&!d.controls.includes(control)&&!['reset','sound'].includes(name));
  }
  document.getElementById('tool-inspect').hidden=Q.free;
  layerToggle.hidden=!Q.free;if(!Q.free)layerGroup.hidden=true;
  document.getElementById('tool-inspect').innerHTML=icon(Q.i===1?'balance':'inspect');
  qPictures.hidden=Q.free||!qPictures.children.length;
  document.body.dataset.qphase=Q.free?'free':Q.phase;
  DIRECTOR.refit=true;
}
