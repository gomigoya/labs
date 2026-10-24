// Share floating-panel colors with the scene diagrams.
for(const [name,value]of Object.entries({'--diagram-paper':css(INK_CFG.diagram.screen),'--diagram-ink':css(INK_CFG.diagram.ink),'--diagram-border':INK_CFG.diagram.borderPx+'px'}))document.documentElement.style.setProperty(name,value);
// All accessible words live in this dictionary; no rendered labels or tooltips.
const LABELS={
 canvas:{ko:'공룡 줄다리기 실험실',en:'Dinosaur tug laboratory'},play:{ko:'당김 실행 또는 중단',en:'Play or pause pull'},reset:{ko:'시작 상태 복구',en:'Reset'},sound:{ko:'소리 전환',en:'Toggle sound'},
 species:SPECIES_KEYS.map((ko,i)=>({ko,en:['Velociraptor','Dilophosaurus','Stegosaurus','Triceratops','Tyrannosaurus','Argentinosaurus'][i]})),
 rival:PHYS.C.rivalChoices.map(n=>({ko:'?? ?? '+n+'?',en:'Rival team of '+n+' children'})),
 ground:[{ko:'유리 바닥',en:'Glass ground'},{ko:'모래 바닥',en:'Sand ground'},{ko:'자갈 바닥',en:'Gravel ground'},{ko:'아스팔트 바닥',en:'Asphalt ground'}]
};
const ICONS={play:'M8 5l11 7-11 7z',pause:'M8 5v14M16 5v14',reset:'M4 10a8 8 0 1 1 1 8M4 4v6h6',sound:'M3 9h4l5-4v14l-5-4H3zM16 8q6 4 0 8M19 5q9 7 0 14',muted:'M3 9h4l5-4v14l-5-4H3zM16 9l6 6M22 9l-6 6',
 rail:'M3 18h18M6 14V8M12 14V4M18 14V9',force:'M3 12h17m-5-5 5 5-5 5M7 9v6M11 9v6',
 s0:'M2 15l6-2 5-2 2-5 5 1-1 3h-3l-2 5 3 5M10 15l-2 5',
 s1:'M2 16l7-4 5-1 1-5 6 1-1 4h-3l-2 5 2 4M10 16l-2 4M16 5l1-2 2 2',
 s2:'M2 17l5-4 2-5 2 3 2-6 2 5 2-3 2 6 3 3M6 17h14M8 17v4M18 17v4',
 s3:'M2 15l6-4 6 1 3-5 2 3 3-2-2 6 2 2-5 1H6M8 17v4M17 17v4',
 s4:'M2 15l6-2 4-3 1-6 9 1-1 5h-5l-2 6 4 5M10 16l-2 5M14 12l3 2',
 s5:'M2 16l5-3h8l1-10h5v3h-3v11H6M8 17v4M15 17v4',
 g0:'M3 15h18M5 8l3-3M11 11l6-6M16 12l3-3',g1:'M3 17h18M4 13h1M8 9h1M12 13h1M16 9h1M20 13h1',
 g2:'M3 17l2-5 4 1 2 4M11 17l3-7 5 2 2 5M7 8l3-4 4 2',g3:'M3 17h18M3 13l3-3 3 3 3-3 3 3 3-3 3 3M5 6h1M13 5h1M20 6h1'};
Object.assign(ICONS,{
 q1:'M2 18h20M4 14v-4m-2 0h4M12 14l4-8 6 2-2 5M10 3l3 3m-3 0 3-3',
 q2:'M2 20h20M4 16V9h3v7m3 0V6h3v10m3 0V3h3v13',
 q3:'M2 20h20M3 16v-4h3v4m3 0V9h3v7m3 0V5h3v11M18 2l3 3-3 3',
 q4:'M2 7h8M2 4l3-2m9 15h8m-8-4 3-3 4 3M7 12h10m-3-3 3 3-3 3',
 q5:'M2 19h20M4 15v-4m4 4v-4M13 14h8m-4-3 4 3-4 3M4 6h7m4 0h6',
 q6:'M3 3h7v18H3zM14 3h7v18h-7zM6 18V6m11 12v-3',
 q8:'M3 12h18M12 12v8m-4 0h8M5 12V9m14 3V9M3 5a1 1 0 1 0 2 0a1 1 0 1 0-2 0M7 5a1 1 0 1 0 2 0a1 1 0 1 0-2 0M15 5a1 1 0 1 0 2 0a1 1 0 1 0-2 0M19 5a1 1 0 1 0 2 0a1 1 0 1 0-2 0',
 q9:'M3 14l18-4M12 12v8m-4 0h8M5 13V10m14 1V8M3 6a1 1 0 1 0 2 0a1 1 0 1 0-2 0M7 6a1 1 0 1 0 2 0a1 1 0 1 0-2 0M15 4a1 1 0 1 0 2 0a1 1 0 1 0-2 0M19 4a1 1 0 1 0 2 0a1 1 0 1 0-2 0M17 1a1 1 0 1 0 2 0a1 1 0 1 0-2 0',
 q12:'M3 18l10-10h8M4 4a1 1 0 1 0 0 .01M8 4a1 1 0 1 0 0 .01M12 4a1 1 0 1 0 0 .01',
 q11:'M2 13h18M3 8a1 1 0 1 0 0 .01M6 8a1 1 0 1 0 0 .01M16 8a1 1 0 1 0 0 .01M19 8a1 1 0 1 0 0 .01M15 15a3 3 0 1 0 6 0a3 3 0 1 0-6 0M20 18l3 4',
 q10:'M2 16h20M12 16v-3M12 3a5 5 0 1 0 0 10 5 5 0 1 0 0-10M12 8l3-3M9 5l1 1m5 4-1-1',
 q7:'M2 3h20v18H2zM5 8h3m3 0h3m3 0h3M6 14l3 3 6-6M18 12v6'
});
for(let i=0;i<12;i++)ICONS['layer'+i]=[
 'M3 20V5h18v15zM6 17l4-7 4 4 4-7','M3 5h18v14H3zM6 9h12M6 14h4m4 0h4',
 'M2 9l10-5 10 5-10 5zM2 15l10 5 10-5','M3 18V6m0 12h18M7 15v-5m5 5V7m5 8v-9',
 'M3 12h18M6 8v8m4-8v8m4-8v8m4-8v8','M3 19h5v-5h5V9h5V4h3',
 'M3 18h18M3 6h18M7 3v6m10 6v6','M3 5h8v14H3zM13 5h8v14h-8zM7 8v8m10-8v8',
 'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14M15 15l7 7M5 11h10',
 'M3 12h2m3 0h2m3 0h2m3 0h3M5 8v8M19 8v8','M3 3v18h18M7 17V7m5 10V10m5 7v-3',
 'M4 3h16v18H4zM8 7h8m-8 5h8m-8 5h8'][i];
function icon(name){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+ICONS[name]+'"/></svg>';}
canvas.setAttribute('aria-label',LABELS.canvas[LANG]);
const toolbar=document.getElementById('tools');
for(const name of ['play','reset','sound',...SPECIES_KEYS.map((_,i)=>'s'+i),...GROUND_VALUES.map((_,i)=>'g'+i)]){
 const b=document.createElement('button');b.id='tool-'+name;
 b.setAttribute('aria-label',(name[0]==='s'&&name.length===2?LABELS.species[+name[1]]:name[0]==='g'?LABELS.ground[+name[1]]:LABELS[name])[LANG]);
 b.innerHTML=icon(name);b.addEventListener('click',()=>action(name));toolbar.append(b);
}
// Wordless layer tools use existing instrument line icons; accessible names stay off screen.
const grammarIcons=[...Array.from({length:8},(_,i)=>'layer'+(i+4)),'q10','lens','q12'];
ICONS.lens='M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14M15 15l7 7';
ICONS.layer12=ICONS.q10;ICONS.layer13=ICONS.lens;ICONS.layer14=ICONS.q12;
for(const [i,name]of GRAMMAR.LAYERS.entries()){
 const b=document.createElement('button');b.className='grammar-tool';b.dataset.layer=name;b.setAttribute('aria-label',({ko:['마디','쌓기와 계단','한계 윤곽','겹치기','접촉 돋보기','시간 흔적','비율 비교','실행 기록','장력계','렌즈','서서히 당기기'],en:['Force units','Stack and steps','Limits','Overlay','Contact magnifier','Time traces','Ratio comparison','Run records','Tension gauges','Object lens','Gradual pull']}[LANG])[i]);b.setAttribute('aria-pressed',String(GRAMMAR.defaults[name]));b.innerHTML=icon(grammarIcons[i]);
 b.addEventListener('click',()=>{if(!Q.free)return;GRAMMAR.set({[name]:!GRAMMAR.enabled[name]});b.setAttribute('aria-pressed',String(GRAMMAR.enabled[name]));});toolbar.append(b);
}
for(const [name,glyph]of [['pin','g0'],['record','rail']]){
 const b=document.createElement('button');b.className='grammar-tool';b.setAttribute('aria-label',({pin:{ko:'비교 고정',en:'Pin comparison'},record:{ko:'상태 기록',en:'Record setup'}}[name])[LANG]);b.innerHTML=icon(glyph);
 b.addEventListener('click',()=>{if(!Q.free)return;if(name==='pin'){if(GRAMMAR.baseline)GRAMMAR.unpin();else GRAMMAR.pin();b.setAttribute('aria-pressed',String(!!GRAMMAR.baseline));}
 else{GRAMMAR.record();GRAMMAR.set({[GRAMMAR.LAYERS[7]]:true});}});toolbar.append(b);
}
let audioContext;
function tick(){if(!S.sound.target)return;audioContext ||= new(window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')void audioContext.resume();
 const o=audioContext.createOscillator(),g=audioContext.createGain(),now=audioContext.currentTime;o.frequency.setValueAtTime(1300,now);o.frequency.exponentialRampToValueAtTime(750,now+.035);g.gain.setValueAtTime(.035,now);g.gain.exponentialRampToValueAtTime(.0001,now+.045);o.connect(g).connect(audioContext.destination);o.start();o.stop(now+.05);}
function action(name){
 if(name!=='sound'&&!QUEST.allows())return;QUEST.touch();
 if(name==='play'){if(Q.free)S.playing.target=1-S.playing.target;else QUEST.pull();}
 else if(name==='sound'){S.sound.target=1-S.sound.target;tick();}
 else if(name==='reset'){if(!Q.free){QUEST.go(Q.i);return;}preset(0);S.t.value=S.t.target=0;S.playing.target=1;shot(S.vertical?0:1,S.vertical);}
 else if(/^s[0-5]$/.test(name))set('species',+name[1]);
 else if(/^g[0-3]$/.test(name))set('ground',+name[1]);
 syncUI();
}
function syncUI(missionOnly=false){
 const mission=document.getElementById('mission');
 mission.hidden=T.mode==='teacher'||(!Q.free&&Q.phase==='explain'); // 설명 단계는 질문 패널이 안내한다
 mission.style.setProperty('--mission-top',(document.getElementById('quests').getBoundingClientRect().bottom+8)+'px');
 const text=missionText(Q.i,Q.phase,{...QUEST.sample(),free:Q.free,focus:QUEST.focus(),pending:Q.flags.pending,right:Q.pick===null||Q.pick===QUESTS[Q.i].answerKey,toolPage,toolGroup});
 if(mission.textContent!==text){
  mission.textContent=text;
  for(const animation of mission.getAnimations())animation.cancel();
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)mission.animate([{opacity:0},{opacity:1}],{duration:120});
 }
 if(missionOnly)return;
 for(const b of [...speciesTools,...groundTools,...rivalTools])b.disabled=!!S.pullMode;
 toolbar.dataset.rival=String(S.rivalN>0);
 lensTool.hidden=!lensAvailable();
 lensTool.setAttribute('aria-pressed',String(toolGroup==='lens'));
 lensTools.forEach((b,i)=>b.setAttribute('aria-pressed',String(S.lens===lensValues[i])));
 if(!lensAvailable()&&toolGroup==='lens')showTools('species');
 rivalTool.hidden=S.rivalN===0;
 rivalTool.setAttribute('aria-pressed',String(toolGroup==='rival'));
 rivalTools.forEach((b,i)=>b.setAttribute('aria-pressed',String(S.rivalN===PHYS.C.rivalChoices[i])));
 if(S.rivalN===0&&toolGroup==='rival')showTools('species');
 if(window.__lab&&!window.__lab.GRAMMAR){
  window.__lab.GRAMMAR=GRAMMAR;
  window.__lab.sample=()=>QUEST.sample();
  window.__lab.layer=(name,on)=>{if(GRAMMAR.LAYERS.includes(name))GRAMMAR.set({[name]:!!on});else layer(name,on);};
 }
 if(window.__lab)toolbar.querySelectorAll('[data-layer]').forEach(b=>b.setAttribute('aria-pressed',String(GRAMMAR.enabled[b.dataset.layer])));
 for(const name of ['play','sound']){const b=document.getElementById('tool-'+name);b.innerHTML=icon(name==='play'?(S.playing.target?'pause':'play'):(S.sound.target?'sound':'muted'));b.setAttribute('aria-pressed',String(!!S[name==='play'?'playing':'sound'].target));}
 SPECIES_KEYS.forEach((_,i)=>speciesTools[i].setAttribute('aria-pressed',String(i===S.species.target)));
 GROUND_VALUES.forEach((_,i)=>groundTools[i].setAttribute('aria-pressed',String(i===S.ground.target)));
}
// One normalized control value feeds all three handles and pointer deltas.
function controlValue(n=PHYS.kidsFromRailX(S.u.value)){return S.pullMode?S.pullP:PHYS.railX(n);}
function setRailFromPointer(u){if(S.pullMode){set('pull',clamp(u,0,1));return;}QUEST.changed('n');u=clamp(u,0,1);const near=PHYS.DETENTS.reduce((a,b)=>Math.abs(a.x-u)<Math.abs(b.x-u)?a:b);const snap=Math.abs(near.x-u)<=.012;if(snap&&S.snap!==near.n)tick();S.snap=snap?near.n:null;S.u.target=PHYS.railX(PHYS.kidsFromRailX(snap?near.x:u));}
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
const dragObjects=[RAIL_HANDLE,SLIDER.handle,DIAL.knob,PLAY_BUTTON,SWITCH,...GRAPHS.map(g=>g.mesh)];
function rayFromEvent(e){const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);}
canvas.addEventListener('pointerdown',e=>{
 if(e.button!==0||S.drag)return;if(!QUEST.allows()){e.stopImmediatePropagation();return;}QUEST.touch();rayFromEvent(e);scene.updateMatrixWorld(true);let hit=raycaster.intersectObjects(dragObjects,true)[0];
 // Projected 56 px hit area keeps the small physical handles usable from the hero camera.
 if(!hit){let nearest=Infinity;for(const object of dragObjects.slice(0,5)){const p=object.getWorldPosition(V3()).project(camera),x=(p.x+1)*innerWidth/2,y=(1-p.y)*innerHeight/2,d=Math.hypot(e.clientX-x,e.clientY-y);if(p.z>=-1&&p.z<=1&&d<= (T.mode==='teacher'?36:28)&&d<nearest){nearest=d;hit={object};}}}if(!hit)return;
 let object=hit.object;while(object.parent&&!dragObjects.includes(object))object=object.parent;
 e.stopImmediatePropagation();S.fly=null;controls.enabled=false;
 if(object===PLAY_BUTTON||object===SWITCH){action('play');controls.enabled=true;return;}
 const type=object===RAIL_HANDLE?'rail':object===SLIDER.handle?'slider':object===DIAL.knob?'dial':object===GRAPHS[0].mesh?'graph':'ratio';
 const local=type!=='rail';
 const plane=local?new THREE.Plane().setFromNormalAndCoplanarPoint(V3(0,0,1).applyQuaternion(CONSOLE.quaternion),object.getWorldPosition(V3())):new THREE.Plane(V3(0,0,1),-PHYS.SCENE.railZ);
 const p=raycaster.ray.intersectPlane(plane,V3());if(!p){controls.enabled=true;return;}if(local)CONSOLE.worldToLocal(p);
 QUEST.changed('drag');S.drag={id:e.pointerId,type,plane,local,start:p,u:controlValue(PHYS.kidsFromRailX(S.u.target)),angle:Math.atan2(p.x-CONTROL_LAYOUT.dial[0],p.y-CONTROL_LAYOUT.dial[1])};canvas.setPointerCapture(e.pointerId);
},{capture:true});
canvas.addEventListener('pointermove',e=>{
 const d=S.drag;if(!d||e.pointerId!==d.id)return;rayFromEvent(e);const p=raycaster.ray.intersectPlane(d.plane,V3());if(!p)return;if(d.local)CONSOLE.worldToLocal(p);
 if(d.type==='rail'||d.type==='slider')setRailFromPointer(d.u+(p.x-d.start.x)/(d.type==='rail'?PHYS.SCENE.railWidth:SLIDER.width));
 if(d.type==='dial'){const a=Math.atan2(p.x-CONTROL_LAYOUT.dial[0],p.y-CONTROL_LAYOUT.dial[1]),delta=Math.atan2(Math.sin(a-d.angle),Math.cos(a-d.angle));setRailFromPointer(controlValue(PHYS.kidsFromRailX(S.u.target))+delta/(Math.PI*1.7));d.angle=a;}
 if(d.type==='graph')setRailFromPointer((p.x-CONTROL_LAYOUT.graphs[0][0])/CONTROL_LAYOUT.graphSize[0]+.5);
 if(d.type==='ratio'){const u=clamp((p.x-CONTROL_LAYOUT.graphs[1][0])/CONTROL_LAYOUT.graphSize[0]+.5,0,1);set('species',SPECIES_KEYS.reduce((best,s,i)=>Math.abs(PHYS.massGraphX(s)-u)<Math.abs(PHYS.massGraphX(SPECIES_KEYS[best])-u)?i:best,0));}
 e.stopImmediatePropagation();
},{capture:true});
function endDrag(e){if(!S.drag||S.drag.id!==e.pointerId)return;S.drag=null;S.snap=null;controls.enabled=true;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);syncUI();}
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,endDrag);
window.addEventListener('keydown',e=>{if(e.key==='/'&&!e.repeat){S.ui.target=1-S.ui.target;document.body.classList.toggle('hide-ui',!S.ui.target);window.__site?.setVisible(!!S.ui.target);e.preventDefault();}});
function set(name,v){
 if(name==='pull'){
  if(typeof v!=='number'||!Number.isFinite(v))throw new TypeError(name);
  if(v<0||v>1)throw new RangeError(name);
  if(!S.pullMode)return;
  QUEST.touch();S.pullP=v;syncUI();return;
 }
 if(S.pullMode&&['kids','n','u','species','ground','mu','rival'].includes(name))return;
 if(name==='lens'){
  if(v===null||v===0||v===''||v==='none')v=null;
  if(v!==null&&!['rope','A','B'].includes(v))throw new RangeError(name);
  S.lens=S.rivalN>0?v:null;
  if(S.lens){Q.flags.lensVisited||=[];if(!Q.flags.lensVisited.includes(S.lens))Q.flags.lensVisited.push(S.lens);}
  syncUI();return;
 }
 if(name==='rival'){if(typeof v!=='number'||!Number.isFinite(v))throw new TypeError(name);if(!Number.isInteger(v)||v<0||v>100)throw new RangeError(name);}
 if(name==='quest'){QUEST.go(Number(v));return;}
 if(['species','ground','mu','kids','n','u','rival'].includes(name)&&Q.phase==='act')QUEST.changed('edit');
 if(name==='rival'){S.rivalN=v;if(v===0)S.lens=null;}
 else if(name==='species'){const i=typeof v==='string'?SPECIES_KEYS.indexOf(v):v;if(!Number.isInteger(i)||i<0||i>=SPECIES_KEYS.length)throw new RangeError(name);S.species.value=S.species.target=i;}
 else if(name==='ground'||name==='mu'){const i=name==='mu'?GROUND_VALUES.indexOf(Number(v)):typeof v==='string'?Object.keys(PHYS.GROUNDS).indexOf(v):v;if(!Number.isInteger(i)||i<0||i>=GROUND_VALUES.length)throw new RangeError(name);if(i!==S.ground.target)S.previousGround=S.ground.target;S.ground.value=S.ground.target=i;S.cassette.value=1;S.cassette.target=0;}
 else if(['playing','sound'].includes(name))S[name].target=v?1:0;
 else{v=Number(v);if(!Number.isFinite(v))throw new TypeError(name);
  if(name==='kids'||name==='n')S.u.target=PHYS.railX(clamp(Math.round(v),...PHYS.RANGE.kids));
  else if(name==='u')S.u.target=PHYS.railX(PHYS.kidsFromRailX(clamp(v,0,1)));
  else if(name==='t')S.t.target=Math.max(0,v);else throw new RangeError(name);}
 if(name==='species'&&Q.phase==='act')QUEST.changed('species');
 syncUI();
}
const PRESETS=[[1,0,2],[49,3,2],[59,4,2],[59,4,0],[68,4,1],[30,1,2],[100,5,3]];
function preset(i){if(!Number.isInteger(i)||!PRESETS[i])throw new RangeError('preset');const [n,s,g]=PRESETS[i];set('kids',n);set('species',s);set('ground',g);S.previousGround=g;S.cassette.value=S.cassette.target=0;S.t.value=S.t.target=0;}
function textAudit(){const found=[],walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 while(walker.nextNode()){const n=walker.currentNode,p=n.parentElement;if(!p||p.closest('script,style,template,[hidden]'))continue;
 if(p.closest('#mission[data-mission]')||p.closest('[data-learn]'))continue;
 const range=document.createRange();range.selectNodeContents(n);const r=range.getBoundingClientRect();let visible=!!r.width&&!!r.height;
 for(let a=p;a;a=a.parentElement){const s=getComputedStyle(a);if(s.visibility==='hidden'||s.display==='none'||+s.opacity===0)visible=false;}
 if(!visible||r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth)continue;
 if(p.closest('[data-numeric]')&&T.mode==='teacher'&&T.numbers&&/^\s*-?\d+(?:\.\d+)?\s*(?:km|kg|N|m|s|h|°|×)\s*$/.test(n.textContent))continue;
 const words=n.textContent.match(/[\p{L}\p{N}]+/gu);if(words)found.push({words,x:r.x,y:r.y,width:r.width,height:r.height});}return found;}

// All quest UI uses this same icon vocabulary and bilingual off-screen names.
Object.assign(ICONS,{
 quest:'M3 5h18v15H3zM7 9h2m4 0h4M7 14h2m4 0h4',free:'M3 12h18M12 3v18M5 5l14 14M19 5 5 19',
 hand:'M7 12V5a2 2 0 0 1 4 0v7-4a2 2 0 0 1 4 0v4-2a2 2 0 0 1 4 0v5q0 6-6 6-4 0-6-4l-3-4q-1-3 2-2l3 2',
 check:'M4 12l5 5L21 5',next:'M4 12h16m-6-6 6 6-6 6',star:'M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
 compare:'M4 5h6v14H4zM14 5h6v14h-6zM6 16v-8m10 8v-3',layers:'M3 7l9-4 9 4-9 4zM3 12l9 4 9-4M3 17l9 4 9-4',
 rival:'M6 7a1 1 0 1 0 0 .01M12 7a1 1 0 1 0 0 .01M18 7a1 1 0 1 0 0 .01M9 15a1 1 0 1 0 0 .01M15 15a1 1 0 1 0 0 .01',species:'M3 19h18M5 15V9h5v6m4 0V5h5v10',ground:'M3 17h18M4 12l4-4 4 4 4-4 4 4'
});
Object.assign(LABELS,{quest:{ko:'퀘스트',en:'Quests'},free:{ko:'자유 실험',en:'Free exploration'},pick:{ko:'예상 선택',en:'Choose prediction'},next:{ko:'다음',en:'Next quest'},replay:{ko:'예상 다시 비교',en:'Replay comparison'},compare:{ko:'비율 비교 열기',en:'Open ratio comparison'},rivalTool:{ko:'?? ?? ???',en:'Show rival team sizes'},speciesTool:{ko:'종 견본 펼치기',en:'Show species samples'},groundTool:{ko:'바닥 견본 펼치기',en:'Show ground samples'},layersTool:{ko:'층 도구 펼치기',en:'Show layer tools'}});
LABELS.play={ko:'당김 실행 또는 중단',en:'Run or interrupt pull'};LABELS.reset={ko:'시작 상태 복구',en:'Restore starting setup'};LABELS.sound={ko:'소리 켜기 또는 끄기',en:'Toggle sound'};
for(const name of ['play','reset','sound'])document.getElementById('tool-'+name).setAttribute('aria-label',LABELS[name][LANG]);
const qPictures=document.createElement('div');qPictures.id='q-pictures';document.body.append(qPictures);
const qOverlay=document.createElement('div');qOverlay.id='q-overlay';qOverlay.setAttribute('aria-hidden','true');document.body.append(qOverlay);
const qArchive=document.createElement('div');qArchive.id='q-archive';qArchive.className='hud';document.body.append(qArchive);
function qButton(label,symbol,fn,parent,suffix=''){
 const b=document.createElement('button');b.setAttribute('aria-label',LABELS[label][LANG]+suffix);b.innerHTML=icon(symbol);b.onclick=fn;parent.append(b);return b;
}
// A fixed two-row tool strip; sample palettes replace row two rather than growing it.
const toolMain=document.createElement('div'),toolPalette=document.createElement('div');toolMain.className='tool-row';toolPalette.className='tool-row';toolbar.append(toolMain,toolPalette);
const sampleButtons=[...toolbar.children].filter(b=>b.tagName==='BUTTON');
for(const b of sampleButtons.slice(0,3))toolMain.append(b);
const speciesTools=sampleButtons.filter(b=>/^tool-s[0-5]$/.test(b.id)),groundTools=sampleButtons.filter(b=>/^tool-g/.test(b.id)),layerTools=sampleButtons.filter(b=>b.classList.contains('grammar-tool'));
for(const b of sampleButtons.slice(3))b.remove();
let toolGroup='species',toolPage=0;
const rivalTools=PHYS.C.rivalChoices.map((n,i)=>{
 const b=document.createElement('button');b.id='tool-r'+n;b.setAttribute('aria-label',LABELS.rival[i][LANG]);
 b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+Array.from({length:n},(_,j)=>'<circle cx="'+(5+j%4*4.5)+'" cy="'+(8+Math.floor(j/4)*8)+'" r="1.3" fill="currentColor"/>').join('')+'</svg>';
 b.onclick=()=>{if(!QUEST.allows())return;QUEST.touch();set('rival',n);};return b;
});

const lensValues=[null,'rope','A','B'];
LABELS.lensTool={ko:'보는 물체 고르기',en:'Choose what to look at'};
LABELS.lens=[{ko:'렌즈 해제',en:'Show both teams'},{ko:'줄',en:'Rope'},{ko:'왼쪽 팀',en:'Left team'},{ko:'오른쪽 팀',en:'Right team'}];
const lensTools=lensValues.map((v,i)=>{
 const b=document.createElement('button');b.id='tool-lens-'+(v??'none');b.setAttribute('aria-label',LABELS.lens[i][LANG]);
 const dots=x=>[0,1,2].map(j=>'<circle cx="'+(x+j*3)+'" cy="8" r="1" fill="currentColor"/>').join('');
 b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 14h18"/>'+((v===null||v==='A')?dots(3):'')+((v===null||v==='B')?dots(15):'')+'</svg>';
 b.onclick=()=>{if(!QUEST.allows())return;QUEST.touch();set('lens',v);};return b;
});
function lensAvailable(){return S.rivalN>0&&(Q.free||!!QUESTS[Q.i].lens);}
const toolBank={species:speciesTools,rival:rivalTools,lens:lensTools,ground:groundTools,layers:layerTools};
qButton('speciesTool','species',()=>showTools('species'),toolMain);
const rivalTool=qButton('rivalTool','rival',()=>showTools('rival'),toolMain);rivalTool.id='rivalTool';rivalTool.hidden=true;
const lensTool=qButton('lensTool','lens',()=>showTools('lens'),toolMain);lensTool.id='lensTool';lensTool.hidden=true;
qButton('groundTool','ground',()=>showTools('ground'),toolMain);
qButton('compare','compare',()=>QUEST.compare(),toolMain).id='tool-compare';
const layersToggle=qButton('layersTool','layers',()=>showTools('layers'),toolPalette);
const paletteNext=qButton('next','next',()=>{toolPage++;showTools(toolGroup,false);},toolPalette);
function showTools(group,reset=true){
 if(group==='lens'&&!lensAvailable())group='species';
 if(group==='rival'&&S.rivalN===0)group='species';
 if(group==='layers'&&!Q.free)group='species';toolGroup=group;if(reset)toolPage=0;
 const bank=toolBank[group],slots=Q.free?4:5,pages=Math.ceil(bank.length/slots);toolPage%=pages;
 toolPalette.replaceChildren();if(Q.free)toolPalette.append(layersToggle);
 for(const b of bank.slice(toolPage*slots,(toolPage+1)*slots))toolPalette.append(b);
 if(pages>1)toolPalette.append(paletteNext);
 layersToggle.setAttribute('aria-pressed',String(group==='layers'));
}
function conceptHTML(id){return '<div class="q-concept">'+icon('star')+text(CONCEPTS.find(c=>c.id===CONCEPTS_OF[id][0]))+'</div>';}
function cardHTML(i,s,stars){
 const id=QUESTS[i].id,done=new Set([...Q.completed].flatMap(i=>CONCEPTS_OF[QUESTS[i].id]));
 const bridge=EXPLAIN[id].bridge?`<p class="q-bridge">${text(EXPLAIN[id].bridge)}</p>`:'';
 const map='<div class="q-map" aria-hidden="true">'+CONCEPTS.map(c=>'<svg viewBox="0 0 24 24" aria-hidden="true"><circle data-concept="'+c.id+'" cx="12" cy="12" r="8" fill="'+(done.has(c.id)?'currentColor':'none')+'" stroke-width="'+(CONCEPTS_OF[id].includes(c.id)?4:1.5)+'"/></svg>').join('')+'</div>';
 return `<div class="q-principle" data-learn>${conceptHTML(id)}<p class="q-recap">${text(EXPLAIN[id].recap)}</p>${bridge}${QUESTS[i].card(s)}${map}<span class="q-stars">${icon('star').repeat(stars)}</span></div>`;
}
function questUI(){
 const d=QUESTS[Q.i],f=Q.flags,top=document.getElementById('quests');top.removeAttribute('aria-hidden');top.replaceChildren();
 qButton('quest','quest',()=>TEACHER.mode('student'),top).setAttribute('aria-pressed',String(!Q.free));
 qButton('free','free',()=>TEACHER.mode('free'),top).setAttribute('aria-pressed',String(Q.free));
 qButton('teacher','teacher',()=>TEACHER.mode('teacher'),top).setAttribute('aria-pressed',String(T.mode==='teacher'));
 const row=document.createElement('div');row.className='quest-row';top.append(row);
 SEQUENCE.forEach((i,pos)=>{const b=qButton('quest',QUESTS[i].icon,()=>{if(QUEST.unlocked(i))QUEST.go(i);},row,' '+(pos+1));b.className='quest'+(Q.i===i?' current':'')+(Q.completed.has(i)?' complete':'')+(pos>0&&levelOf(i)!==levelOf(SEQUENCE[pos-1])?' level-gap':'');b.setAttribute('aria-disabled',String(!QUEST.unlocked(i)));b.innerHTML+='<span class="q-dots">'+('<i></i>'.repeat(Q.i===i?PHASES.indexOf(Q.phase)+1:1))+'</span>';});
 qPictures.replaceChildren();qPictures.className=Q.phase;qPictures.hidden=Q.free;
 if(!Q.free&&Q.phase==='predict')d.candidates.forEach((c,k)=>{const b=qButton('pick',d.icon,()=>QUEST.pick(k),qPictures,' '+(k+1));b.dataset.candidate=k;b.innerHTML=CARDS.picture(d.id,c,0,QUEST.sample());});
 if(!Q.free&&Q.phase==='confirm'){
  const chosen=d.candidates.find(c=>c.key===Q.pick)||d.candidates[0];
  qPictures.innerHTML='<div class="q-compare '+(Q.stars[Q.i]===3?'matched':'')+'">'+CARDS.picture(d.id,chosen,0,f.success)+CARDS.actual(d.id,f.success||QUEST.sample())+(Q.stars[Q.i]===3?icon('check'):'')+'</div>';
  if(Q.stars[Q.i]===2)qButton('replay','reset',()=>QUEST.skip('event'),qPictures);
 }
 if(!Q.free&&Q.phase==='explain'){
  const e=f.explain,data=EXPLAIN[d.id],last=data.options.find(o=>o.key===e.tries.at(-1));
  qPictures.innerHTML='<div class="q-explain" data-learn>'+conceptHTML(d.id)+'<p class="q-ask">'+text(data.q)+'</p><div class="q-options"></div><p class="q-hint" role="status">'+(last?text(last.hint):'')+'</p></div>';
  const options=qPictures.querySelector('.q-options');
  for(const key of e.order){const o=data.options.find(o=>o.key===key),b=document.createElement('button');b.dataset.option=key;b.textContent=text(o);b.setAttribute('aria-label',text(o));b.setAttribute('aria-disabled',String(e.tries.includes(key)));b.onclick=()=>QUEST.answer(key);options.append(b);}
 }
 if(!Q.free&&Q.phase==='card'){
  qPictures.innerHTML=cardHTML(Q.i,f.success||QUEST.sample(),Q.stars[Q.i]);
  const next=QUEST.next(),action=next===null?'free':'next';
  qButton(action,action,()=>next===null?QUEST.mode(true):QUEST.go(next),qPictures);
 }
 qArchive.replaceChildren();for(const i of Q.completed){const b=qButton('quest',QUESTS[i].icon,()=>{qPictures.hidden=false;qPictures.className='card';qPictures.innerHTML=cardHTML(i,Q.results[i].success,Q.stars[i]);},qArchive);b.className='archive-card';}
 qArchive.hidden=!Q.free||!Q.completed.size;
 document.body.dataset.qphase=Q.free?'free':Q.phase;document.body.dataset.focus=QUEST.focus();
 showTools(QUEST.focus()==='lens'?'lens':QUEST.focus()==='ground'?'ground':toolGroup,false);
 syncUI();
}

