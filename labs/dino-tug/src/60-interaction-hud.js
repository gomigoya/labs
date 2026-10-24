// Share floating-panel colors with the scene diagrams.
for(const [name,value]of Object.entries({'--diagram-paper':css(INK_CFG.diagram.screen),'--diagram-ink':css(INK_CFG.diagram.ink),'--diagram-border':INK_CFG.diagram.borderPx+'px'}))document.documentElement.style.setProperty(name,value);
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
function icon(name){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+ICONS[name]+'"/></svg>';}
Object.assign(ICONS,{
 quest:'M3 5h18v15H3zM7 9h2m4 0h4M7 14h2m4 0h4',free:'M3 12h18M12 3v18M5 5l14 14M19 5 5 19',
 hand:'M7 12V5a2 2 0 0 1 4 0v7-4a2 2 0 0 1 4 0v4-2a2 2 0 0 1 4 0v5q0 6-6 6-4 0-6-4l-3-4q-1-3 2-2l3 2',
 check:'M4 12l5 5L21 5',next:'M4 12h16m-6-6 6 6-6 6',star:'M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
 compare:'M4 5h6v14H4zM14 5h6v14h-6zM6 16v-8m10 8v-3',layers:'M3 7l9-4 9 4-9 4zM3 12l9 4 9-4M3 17l9 4 9-4',
 rival:'M6 7a1 1 0 1 0 0 .01M12 7a1 1 0 1 0 0 .01M18 7a1 1 0 1 0 0 .01M9 15a1 1 0 1 0 0 .01M15 15a1 1 0 1 0 0 .01',species:'M3 19h18M5 15V9h5v6m4 0V5h5v10',ground:'M3 17h18M4 12l4-4 4 4 4-4 4 4'
});
ICONS.lens='M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14M15 15l7 7';
let audioContext;
function tick(){if(!S.sound.target)return;audioContext ||= new(window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')void audioContext.resume();
 const o=audioContext.createOscillator(),g=audioContext.createGain(),now=audioContext.currentTime;o.frequency.setValueAtTime(1300,now);o.frequency.exponentialRampToValueAtTime(750,now+.035);g.gain.setValueAtTime(.035,now);g.gain.exponentialRampToValueAtTime(.0001,now+.045);o.connect(g).connect(audioContext.destination);o.start();o.stop(now+.05);}
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
const hudRoot=document.createElement('div');hudRoot.id='student-hud';document.body.append(hudRoot);
const header=document.createElement('header');header.id='lab-header';hudRoot.append(header);
// 사이트 공통 메뉴(shared/shell.js의 data-site-slot)는 머리줄 안에 넣어 조작 패널을 가리지 않게 한다.
const siteSlot=document.getElementById('site-slot');
const guide=document.createElement('section');guide.id='lab-guide';hudRoot.append(guide);
const progress=document.createElement('ol');progress.id='lab-progress';guide.append(progress);
const mission=document.getElementById('mission');guide.append(mission);
const questList=document.createElement('section');questList.id='quest-list';questList.hidden=true;hudRoot.append(questList);
const qPictures=document.createElement('section');qPictures.id='q-pictures';hudRoot.append(qPictures);
const qOverlay=document.createElement('div');qOverlay.id='q-overlay';document.body.append(qOverlay);
const controlPanel=document.createElement('section');controlPanel.id='control-panel';hudRoot.append(controlPanel);
const forceCard=document.createElement('section');forceCard.id='force-card';hudRoot.append(forceCard);
const resultNotice=document.createElement('div');resultNotice.id='result-notice';resultNotice.setAttribute('role','status');resultNotice.hidden=true;hudRoot.append(resultNotice);
function ui(key){return text(UI_TEXT[key]);}
function button(label,fn,parent){const b=document.createElement('button');b.textContent=label;b.onclick=fn;parent.append(b);return b;}
function element(tag,words,parent){const e=document.createElement(tag);if(words!==undefined)e.textContent=words;parent.append(e);return e;}
function phaseStep(phase){return {intro:0,predict:0,act:1,observe:2,confirm:2,explain:3,card:4}[phase];}
function experimentPosition(i=Q.i){return LANG==='ko'?`${ui('experiment')} ${SEQUENCE.indexOf(i)+1} / ${SEQUENCE.length} · ${levelOf(i)}${ui('level')}`:`${ui('experiment')} ${SEQUENCE.indexOf(i)+1} / ${SEQUENCE.length} · ${ui('level')} ${levelOf(i)}`;}
function renderHeader(){
 header.replaceChildren();const brand=element('div',undefined,header);brand.className='brand';element('strong',ui('lab'),brand);if(siteSlot)brand.append(siteSlot);
 const middle=element('div',undefined,header);element('div',Q.free?ui('free'):experimentPosition(),middle);element('h1',Q.free?ui('free'):text(QUESTS[Q.i].title),middle);
 const nav=element('nav',undefined,header);
 const listButton=button(ui('list'),()=>{questList.hidden=!questList.hidden;renderQuestList();listButton.setAttribute('aria-expanded',String(!questList.hidden));},nav);listButton.setAttribute('aria-expanded',String(!questList.hidden));
 button(ui(Q.free?'back':'free'),()=>TEACHER.mode(Q.free?'student':'free'),nav);
 button(ui('teacher'),()=>TEACHER.mode('teacher'),nav);
 progress.replaceChildren();UI_TEXT.steps.forEach((label,i)=>{const li=element('li',(i<phaseStep(Q.phase)?'✓ ':'')+text(label),progress);if(!Q.free&&i===phaseStep(Q.phase))li.setAttribute('aria-current','step');});progress.hidden=Q.free;
 renderQuestList();
}
function renderQuestList(){
 questList.replaceChildren();
 for(const level of LEVELS){element('h2',LANG==='ko'?`${level.id}${ui('level')} · ${text(UI_TEXT.levels[level.id-1])}`:`${ui('level')} ${level.id} · ${text(UI_TEXT.levels[level.id-1])}`,questList);
 for(const id of level.quests){const i=id-1,unlocked=QUEST.unlocked(i),status=Q.completed.has(i)?`${ui('done')} ${'★'.repeat(Q.stars[i])}`:i===Q.i?ui('now'):unlocked?'':ui('lock');
 const b=button(`${text(QUESTS[i].title)} · ${status}`,()=>{if(!QUEST.unlocked(i)){mission.textContent=ui('locked');questList.dataset.notice='locked';return;}questList.hidden=true;TEACHER.mode('student');QUEST.go(i);},questList);b.dataset.quest=i;b.setAttribute('aria-disabled',String(!unlocked));}
 }
 if(questList.dataset.notice)element('p',ui(questList.dataset.notice),questList).setAttribute('role','status');
}
const lensValues=[null,'rope','A','B'];
function countControl(name,parent){
 const left=name==='kids',n=left?PHYS.kidsFromRailX(S.u.target):S.rivalN,max=left?100:20;
 const row=element('div',undefined,parent);row.className='count-row';
 button('−',()=>set(name,Math.max(1,n-1)),row).setAttribute('aria-label',ui(name)+' −');element('output',n+ui('people'),row);
 button('+',()=>set(name,Math.min(max,n+1)),row).setAttribute('aria-label',ui(name)+' +');
 if(left)rangeControl(name,n,1,100,1,v=>set('kids',v),parent);
}
function rangeControl(name,value,min,max,step,change,parent){
 const label=element('label',ui(name),parent);label.htmlFor='input-'+name;
 const input=element('input',undefined,parent);input.id='input-'+name;input.type='range';input.min=min;input.max=max;input.step=step;input.value=value;input.oninput=()=>change(Number(input.value));return input;
}
function chips(values,current,change,parent){for(const [i,label]of values.entries())button(label,()=>change(i),parent).setAttribute('aria-pressed',String(i===current));}
// Each control is defined once. The quest controls array is the only student selector.
const CONTROL_TYPES={
 kids:parent=>countControl('kids',parent),rival:parent=>countControl('rival',parent),
 ground:parent=>chips(UI_TEXT.grounds.map(text),S.ground.target,i=>set('ground',i),parent),
 species:parent=>chips(UI_TEXT.dinos.map((d,i)=>text(d)+' · '+PHYS.SPECIES[SPECIES_KEYS[i]]+' kg'),S.species.target,i=>set('species',i),parent),
 compare:parent=>button(ui('compare'),()=>QUEST.compare(),parent).setAttribute('aria-pressed',String(!!Q.flags.compareOpen)),
 lens:parent=>chips(UI_TEXT.lenses.map(text),lensValues.indexOf(S.lens),i=>set('lens',lensValues[i]),parent),
 pullSlider:parent=>{rangeControl('pullSlider',Math.round(S.pullP*100),0,100,1,v=>set('pull',v/100),parent);element('output',Math.round(S.pullP*100)+'%',parent);element('small',ui('slow'),parent);},
 pull:parent=>{const b=button(ui(S.playing.target?'stop':'pull'),()=>QUEST.pull(),parent);b.className='primary';},
};
function focusedControl(name){const f=QUEST.focus();return f==='rail'?['kids','rival'].includes(name):f==='play'?name==='pull':['pull','slip'].includes(f)?name==='pullSlider':name===f;}
function activeControls(){return Q.free?['kids','rival','ground',...(S.rivalN===0?['species']:[]),'lens','pull']:QUESTS[Q.i].controls;}
function showTools(){renderControls();} // The boot entry now renders the text control panel.
// The control rows are drawn by one function for the student panel and the teacher panel.
function controlSignature(){return JSON.stringify([Q.free,Q.i,Q.phase,QUEST.focus(),S.u.target,S.rivalN,S.species.target,S.ground.target,S.lens,S.pullP,S.playing.target,S.sound.target,S.pullMode,Q.flags.compareOpen,GRAMMAR.enabled]);}
// A slider under the pointer is never rebuilt; only its readout follows.
function sliderHeld(parent){
 const active=document.activeElement;
 if(!(active?.type==='range'&&active.matches(':active')&&parent.contains(active)))return false;
 const output=active.parentElement.querySelector('output');if(output)output.textContent=active.id==='input-pullSlider'?Math.round(S.pullP*100)+'%':PHYS.kidsFromRailX(S.u.target)+ui('people');return true;
}
function drawControls(parent,names){
 for(const name of names){
 const group=element('fieldset',undefined,parent);group.dataset.control=name;element('legend',ui(name),group);CONTROL_TYPES[name](group);
 group.disabled=!Q.free&&!['act','card','confirm'].includes(Q.phase)||S.pullMode&&['kids','rival','species','ground'].includes(name);
 if(!Q.free&&Q.phase==='act'&&!group.disabled&&focusedControl(name)){group.classList.add('focus-control');element('small',ui('here'),group).className='focus-label';}
 }
}
function renderControls(){
 const active=document.activeElement,selection=active?.id,detailsOpen=controlPanel.querySelector('details')?.open;
 const signature=controlSignature();
 if(renderControls.signature===signature||sliderHeld(controlPanel))return;
 renderControls.signature=signature;
 controlPanel.replaceChildren();
 if(Q.free){const opponent=element('div',undefined,controlPanel);element('strong',ui('opponent'),opponent);chips([ui('dinosaur'),ui('team')],+(S.rivalN>0),i=>set('rival',i?5:0),opponent);}
 drawControls(controlPanel,activeControls());
 const auxiliary=element('div',undefined,controlPanel);auxiliary.className='auxiliary';
 button(ui('reset'),()=>action('reset'),auxiliary);button(ui(S.sound.target?'soundOff':'soundOn'),()=>action('sound'),auxiliary);
 if(Q.free){const details=element('details',undefined,controlPanel);details.open=!!detailsOpen;element('summary',ui('layers'),details);for(const [i,name]of GRAMMAR.LAYERS.entries()){const label=element('label',undefined,details),check=element('input',undefined,label);check.type='checkbox';check.checked=!!GRAMMAR.enabled[name];check.onchange=()=>{GRAMMAR.set({[name]:check.checked});syncUI();};label.append(document.createTextNode(text(UI_TEXT.layerNames[i])));}}
 if(selection&&controlPanel.querySelector('#'+selection)){const input=controlPanel.querySelector('#'+selection);input.focus({preventScroll:true});}
}
function action(name){
 if(name==='sound'){S.sound.target=1-S.sound.target;tick();}
 else if(!QUEST.allows())return;
 else if(name==='play')QUEST.pull();
 else if(name==='reset'){if(Q.free){preset(0);S.t.value=S.t.target=0;S.playing.target=0;}else QUEST.go(Q.i);}
 syncUI();
}
function forceRows(quest,sample){
 const s=sample,row=(key,value,color)=>({label:ui(key),value,color});
 if(quest.pullMode&&!Q.free){const p=PHYS.staticPull(s.n,s.mu,s.pullP);return {rows:[row('pullSlider',p.applied,'#d77732'),row('friction',p.friction,'#ad466c'),{...row('limit',p.limit,'#ad466c'),dashed:true}],status:ui(p.slipped?'slipping':'holding')};}
 if((quest.lens||Q.free)&&s.rivalN>0&&s.lens){const f=PHYS.lensForces(s.n,s.species,s.rivalN,s.mu,s.lens);return {rows:f.arrows.map(a=>row(a.kind==='pull'?'ropeForce':'friction',a.value,a.kind==='pull'?'#d77732':'#ad466c')),status:ui(f.balanced?'balanced':f.sum>0?'netRight':'netLeft')};}
 const m=PHYS.matchOutcome(s.n,s.species,s.rivalN,s.mu),rows=[row(s.rivalN?'leftForce':'kidForce',m.kids,'#d77732'),row(s.rivalN?'rightForce':'dinoForce',m.dino,s.rivalN?'#467daa':'#568553')];
 if(quest.layers.includes('장력계'))rows.push(row('tension',PHYS.tensionOf(s.n,s.species,s.rivalN,s.mu),'#7863a6'));
 return {rows,status:Math.abs(m.kids-m.dino)<1e-7?ui('equal'):''};
}
function resultSentence(s,slip=false){
 if(slip)return ui('slipped');
 const winner=PHYS.matchOutcome(s.n,s.species,s.rivalN,s.mu).winner;
 return ui(s.rivalN?(winner==='kids'?'winLeft':winner==='dino'?'winRight':'tieTeams'):(winner==='kids'?'winKids':winner==='dino'?'winDino':'tieDino'));
}
function renderForces(){
 forceCard.hidden=!(Q.free||['act','observe','confirm'].includes(Q.phase));if(forceCard.hidden)return;
 const {rows,status}=forceRows(QUESTS[Q.i],QUEST.sample()),max=Math.max(1,...rows.map(r=>r.value))*1.1,numbers=Q.free||levelOf(Q.i)>=2;
 forceCard.replaceChildren();element('strong',ui('forces'),forceCard);
 for(const row of rows){const line=element('div',undefined,forceCard);line.className='force-row';element('span',row.label+(numbers?' · '+Math.round(row.value)+' N':''),line);const track=element('div',undefined,line);track.className='force-track';const bar=element('div',undefined,track);bar.className=row.dashed?'force-bar dashed':'force-bar';bar.style.width=(row.value/max*100)+'%';bar.style.background=row.color;}
 element('div',status,forceCard);if(rows.length>=2&&Math.abs(rows[0].value-rows[1].value)<1e-7&&status!==ui('equal'))element('div',ui('equal'),forceCard);
}
function announceResult(s,slip=false){resultNotice.textContent=resultSentence(s,slip);resultNotice.hidden=false;clearTimeout(announceResult.timer);announceResult.timer=setTimeout(()=>{resultNotice.hidden=true;},2600);}
function conceptHTML(id){return '<div class="q-concept">'+text(CONCEPTS.find(c=>c.id===CONCEPTS_OF[id][0]))+'</div>';}
function cardHTML(i,s,stars){const id=QUESTS[i].id;return `<div class="q-principle"><h2>${ui('learned')}</h2>${conceptHTML(id)}<p>${text(EXPLAIN[id].recap)}</p><p class="q-bridge">${EXPLAIN[id].bridge?text(EXPLAIN[id].bridge):''}</p>${QUESTS[i].card(s)}<span>${'★'.repeat(stars)}</span></div>`;}
function questUI(){
 if(Q.phase==='intro'){resultNotice.hidden=true;delete questList.dataset.notice;}
 renderHeader();qPictures.replaceChildren();qPictures.className=Q.phase;qPictures.hidden=Q.free;
 const d=QUESTS[Q.i],f=Q.flags;
 if(!Q.free&&Q.phase==='predict'){
 element('h2',text(MISSION[Q.i].ask),qPictures);const choices=element('div',undefined,qPictures);choices.className='prediction-choices';
 d.candidates.forEach((c,k)=>{const b=button(text(c.label),()=>QUEST.pick(k),choices);b.dataset.candidate=k;const diagram=element('div',undefined,b);diagram.setAttribute('aria-hidden','true');diagram.innerHTML=CARDS.picture(d.id,c,0,QUEST.sample());});
 }
 if(!Q.free&&Q.phase==='confirm'){
 const chosen=d.candidates.find(c=>c.key===Q.pick)||d.candidates[0],s=f.success||QUEST.sample();element('p',ui('myPick')+': '+text(chosen.label),qPictures);element('p',ui('actual')+': '+resultSentence(s,!!d.pullMode),qPictures);element('strong',ui(Q.pick===d.answerKey?'right':'wrong'),qPictures);
 element('div',undefined,qPictures).innerHTML='<div class="q-compare">'+CARDS.picture(d.id,chosen,0,s)+CARDS.actual(d.id,s)+'</div>';
 }
 if(!Q.free&&Q.phase==='explain'){
 const data=EXPLAIN[d.id],e=f.explain,last=data.options.find(o=>o.key===e.tries.at(-1));const panel=element('div',undefined,qPictures);panel.className='q-explain';
 // 결과는 짧은 확인 단계 뒤에도 여기서 계속 읽을 수 있다(학생이 고를 때까지 기다리는 단계).
 const chosen=d.candidates.find(c=>c.key===Q.pick),outcome=element('div',undefined,panel);outcome.className='q-outcome';if(chosen)element('p',ui('myPick')+': '+text(chosen.label),outcome);element('p',ui('actual')+': '+resultSentence(f.success||QUEST.sample(),!!d.pullMode),outcome);
 element('h2',text(data.q),panel);const options=element('div',undefined,panel);options.className='q-options';
 for(const key of e.order){const o=data.options.find(o=>o.key===key),b=button(text(o),()=>QUEST.answer(key),options);b.dataset.option=key;b.disabled=e.tries.includes(key);}
 const hint=element('p',last?text(last.hint):'',panel);hint.className='q-hint';hint.setAttribute('role','status');
 }
 if(!Q.free&&Q.phase==='card'){qPictures.innerHTML=cardHTML(Q.i,f.success||QUEST.sample(),Q.stars[Q.i]);const next=QUEST.next();button(ui(next===null?'last':'next'),()=>next===null?TEACHER.mode('free'):QUEST.go(next),qPictures);}
 document.body.dataset.qphase=Q.free?'free':Q.phase;document.body.dataset.focus=QUEST.focus();syncUI();
}
function syncUI(){
 hudRoot.hidden=T.mode==='teacher';mission.hidden=false;
 mission.textContent=questList.dataset.notice&&!questList.hidden?ui(questList.dataset.notice):missionText(Q.i,Q.phase,{...QUEST.sample(),free:Q.free,focus:QUEST.focus(),pending:Q.flags.pending,right:Q.pick===null||Q.pick===QUESTS[Q.i].answerKey});
 if(T.mode!=='teacher')renderControls();
 renderForces();
 guide.style.top=(header.getBoundingClientRect().bottom+6)+'px';
 hudRoot.style.setProperty('--panel-height',controlPanel.getBoundingClientRect().height+'px');
 hudRoot.style.setProperty('--guide-bottom',guide.getBoundingClientRect().bottom+'px');
 // 카메라 맞춤(stageRect)이 HUD를 피하도록 위·아래 예약 높이를 알려 준다.
 const covers=[controlPanel,qPictures].filter(e=>e.getClientRects().length&&e.getBoundingClientRect().height>0).map(e=>e.getBoundingClientRect().top);
 if(T.mode!=='teacher'){document.documentElement?.style?.setProperty('--hud-right','0px');
 document.documentElement?.style?.setProperty('--hud-top',Math.round(guide.getBoundingClientRect().bottom+8)+'px');
 document.documentElement?.style?.setProperty('--hud-bottom',Math.round(innerHeight-Math.min(innerHeight,...covers)+8)+'px');}
 resultNotice.style.top=(guide.getBoundingClientRect().bottom+10)+'px';
 if(innerWidth>600)forceCard.style.top=(guide.getBoundingClientRect().bottom+10)+'px';else forceCard.style.top='auto';
 canvas.setAttribute('aria-label',ui('lab'));
 if(window.__lab&&!window.__lab.GRAMMAR){window.__lab.GRAMMAR=GRAMMAR;window.__lab.sample=()=>QUEST.sample();window.__lab.layer=(name,on)=>{if(GRAMMAR.LAYERS.includes(name))GRAMMAR.set({[name]:!!on});else layer(name,on);};}
}
function textAudit(){
 const found=[];for(const e of document.querySelectorAll('#student-hud button,#student-hud h1,#student-hud h2,#student-hud p,#student-hud label,#mission')){
 if(!e.getClientRects().length)continue;let r=e.getBoundingClientRect(),visible=true;
 for(let parent=e.parentElement;parent;parent=parent.parentElement){const style=getComputedStyle(parent);if(style.visibility==='hidden'||style.display==='none')visible=false;if(/auto|scroll|hidden/.test(style.overflowY)){const p=parent.getBoundingClientRect();r={left:Math.max(r.left,p.left),right:Math.min(r.right,p.right),top:Math.max(r.top,p.top),bottom:Math.min(r.bottom,p.bottom)};}}
 if(!visible||r.right<=r.left||r.bottom<=r.top)continue;
 if(r.left<-.5||r.right>innerWidth+.5||r.top<-.5||r.bottom>innerHeight+.5)found.push({kind:'hud-clipped',text:e.textContent});
 }
 for(const e of document.querySelectorAll('#gl text,#gl [data-text]'))if(e.textContent.trim())found.push({kind:'canvas-text',text:e.textContent});return found;
}
