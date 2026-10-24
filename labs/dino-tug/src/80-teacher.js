// Lab-specific bindings stop at this object. The controller below is portable.
const TEACHER_CFG = {
  idleSeconds: 90,
  layerOrder: ['hero','console','track','capacities',...GRAMMAR.LAYERS],
  words:UI_TEXT,
  get layerLabels(){const words=[...UI_TEXT.tcBaseLayers,...UI_TEXT.layerNames];return Object.fromEntries(this.layerOrder.map((n,i)=>[n,words[i]]));},
  numbers: [
    {label:'tcKids',fn:()=>PHYS.kidsFromRailX(S.u.value),unit:'people',digits:0},
    {label:'tcWeight',fn:()=>PHYS.SPECIES[SPECIES_KEYS[Math.round(S.species.value)]],unit:'unitKg',digits:0},
    {label:'kidForce',fn:()=>PHYS.kidCap(PHYS.kidsFromRailX(S.u.value),GROUND_VALUES[Math.round(S.ground.value)]),unit:'unitN',digits:0},
    {label:'dinoForce',fn:()=>PHYS.dinoCap(SPECIES_KEYS[Math.round(S.species.value)],GROUND_VALUES[Math.round(S.ground.value)]),unit:'unitN',digits:0},
    {label:'tcRatio',fn:()=>PHYS.weightRatio(SPECIES_KEYS[Math.round(S.species.value)]),unit:'unitTimes',digits:2}
  ],
  attract: [
    {shot:1,closer:PHYS.railX(PHYS.C.kidsMin),species:0,ground:2,layers:['hero','console','track',GRAMMAR.LAYERS[0]],seconds:8},
    {shot:1,closer:PHYS.railX(PHYS.minKidsToWin(SPECIES_KEYS[4],GROUND_VALUES[2])),species:4,ground:2,layers:['hero','console','track',...GRAMMAR.LAYERS.slice(0,3)],seconds:12},
    {shot:3,closer:PHYS.railX(PHYS.minKidsToWin(SPECIES_KEYS[4],GROUND_VALUES[2])),species:4,ground:0,layers:['hero','console','track',GRAMMAR.LAYERS[0],GRAMMAR.LAYERS[2],GRAMMAR.LAYERS[4]],seconds:12},
    {shot:1,closer:PHYS.railX(PHYS.C.kidsMax),species:5,ground:3,layers:['hero','console','track',GRAMMAR.LAYERS[6]],seconds:10}
  ],
  shots:SHOTS,verticalShots:SHOTS_VERTICAL,heroShot:SHOTS[1],language:LANG,icon,
  setLayer(name,on){if(GRAMMAR.LAYERS.includes(name))GRAMMAR.set({[name]:on});else layer(name,on);},
  layerOn:name=>name in GRAMMAR.enabled?GRAMMAR.enabled[name]:name==='capacities'?S.layers[name]===true:S.layers[name]!==false,
  // The portable scalar is the continuous rail coordinate; PHYS owns integer detents.
  getCloser:()=>S.u.value,
  setCloser(value,immediate=false){if(S.pullMode){set('pull',clamp(value,0,1));return;}S.u.target=clamp(value,PHYS.railX(PHYS.C.kidsMin),PHYS.railX(PHYS.C.kidsMax));if(immediate)S.u.value=S.u.target;},
  getPlaying:()=>!!S.playing.target,
  play(on){S.playing.value=S.playing.target=+on;syncUI();},
  oneFrame(){const p=S.playing.target;S.playing.value=S.playing.target=1;step(1);S.playing.value=S.playing.target=p;syncUI();},
  ui(on){S.ui.value=S.ui.target=+on;document.body.classList.toggle('hide-ui',!on);window.__site?.setVisible(on);},
  getUI:()=>!!S.ui.target,
  fly(spec,duration){flyTo(spec,duration);},
  shotForStage(row){set('species',row.species);set('ground',row.ground);S.species.value=S.species.target;S.ground.value=S.ground.target;S.t.value=S.t.target=0;return S.vertical?SHOTS_VERTICAL[row.shot===3?2:0]:SHOTS[row.shot];},
  get levels(){return LEVELS;},firstOfLevel,levelOf,questNote:i=>CONCEPTS.find(c=>c.id===CONCEPTS_OF[QUESTS[i].id][0]),
  quests:QUESTS,get questOrder(){return SEQUENCE;},getQuest:()=>Q.i,
  bindMode(state){Object.defineProperty(Q,'free',{get:()=>state.mode!=='student',set(value){if(state.mode!=='teacher')state.mode=value?'free':'student';},enumerable:true,configurable:true});},
  // The console stays off until the teacher turns its chip on; the control rows below replace its handles.
  controlSignature,sliderHeld,drawControls:parent=>drawControls(parent,QUESTS[Q.i].controls),
  questMode(free){for(const n of ['hero','track'])layer(n,true);QUEST.mode(free);},
  selectQuest(i){QUEST.go(i);Q.free=true;Q.phase='act';DIRECTOR.clear();TEACHER.layers(['hero','track',...QUESTS[i].layers]);shot(S.vertical?0:1,S.vertical);questUI();},
  cardBusy:()=>!Q.free&&['intro','predict','observe','confirm','explain','card'].includes(Q.phase),
  exportLog(){
    const data={app:'dino-tug',version:1,exportedAt:new Date().toISOString(),entries:QUEST.log()};
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='dino-tug-log.json';document.body.append(a);
    try{a.click();}finally{a.remove();setTimeout(()=>URL.revokeObjectURL(url),0);}
  },
  reset(){
    if(S.drag)endDrag({pointerId:S.drag.id});S.fly=null;controls.enabled=true;
    Q.completed.clear();Q.stars.fill(0);Q.results=[];Q.predict=[];Q.explain=[];Q.run=0;Q.pick=null;
    GRAMMAR.unpin();GRAMMAR.clearRecords();DIRECTOR.clear();QUEST.go(QUEST.first());Q.free=true;Q.phase='act';
    preset(0);S.u.value=S.u.target;S.species.value=S.species.target;S.ground.value=S.ground.target;
    S.playing.value=S.playing.target=0;S.sound.value=S.sound.target=0;
    updateHero();GRAMMAR.update(0);shot(S.vertical?0:1,S.vertical);syncUI();
  },
  startStudent(){for(const n of ['hero','track'])layer(n,true);QUEST.go(QUEST.first());},
  refresh(){for(const n of ['hero','track'])layer(n,true);questUI();},visibilityReset(){S.lastTime=0;},
  frameViewport(){
    if(!this.getUI()){camera.clearViewOffset();return;}
    const strip=teacherStrip.getBoundingClientRect(),top=document.getElementById('lab-header').getBoundingClientRect().bottom+12;
    const width=Math.max(100,strip.left-24),height=Math.max(100,innerHeight-top-12);
    camera.setViewOffset(width,height,-12,-top,innerWidth,innerHeight);
  },
  scale(value){S.lineScale=value;if(value===1){camera.clearViewOffset();camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
    for(const grip of [RAIL_HANDLE,SLIDER.handle,DIAL.knob,PLAY_BUTTON,SWITCH])grip.scale.setScalar(value);
    scene.traverse(o=>{if(o.isLine)o.material.linewidth=value;});
  },
  ghost(snapshot){if(snapshot)GRAMMAR.pin();else GRAMMAR.unpin();},
  predict(open=false,choice=null,dt=0){
    const d=QUESTS[Q.i],f=Q.flags;
    if(open){Q.phase='predict';Q.pick=null;f.classElapsed=0;}
    if(choice!==null){
      Q.pick=d.candidates[choice].key;Q.phase='observe';f.classElapsed=0;
      const observations=[];
      // Use the same declarative solution as students, without issuing completed runs or stars.
      for(const command of d.solve(QUEST.sample())){
        for(const k of ['n','species','mu','lens'])if(command[k]!==undefined)set(k,command[k]);
        S.u.value=S.u.target;S.species.value=S.species.target;S.ground.value=S.ground.target;
        if(typeof command.pull==='number')set('pull',command.pull);
        const s=QUEST.sample();if(command.pull===true)observations.push({n:s.n,species:s.species,mu:s.mu,rivalN:s.rivalN});
        if(command.compare)GRAMMAR.set({[GRAMMAR.LAYERS[6]]:true});
      }
      f.classSample={...QUEST.sample(),observations,before:observations[0]||null,after:observations[1]||null};
      S.t.value=S.t.target=Math.PI;this.play(false);
    }
    if(Q.phase==='observe'){f.classElapsed+=dt;if(f.classElapsed>=2.5)Q.phase='confirm';}
    const chosen=()=>d.candidates.find(c=>c.key===Q.pick)||d.candidates[0],sample=()=>f.classSample||QUEST.sample();
    return {phase:Q.phase,candidates:d.candidates,ask:MISSION[Q.i].ask,picture:c=>CARDS.picture(d.id,c,DIRECTOR.clock,QUEST.sample()),
      summary:()=>({pick:chosen().label,result:resultSentence(sample(),!!d.pullMode)}),
      compare:()=>`<div class="q-compare">${CARDS.picture(d.id,chosen(),0,sample())}${CARDS.actual(d.id,sample())}</div>`};
  }
};

const T = { mode: 'student', slow: false, spotlight: false, laser: false, numbers: false, ab: null, layerStep: 0 };
TEACHER_CFG.bindMode(T);
// Compatibility view, never a second stored snapshot.
Object.defineProperty(S, 'ab', { get: () => T.ab, set: value => { T.ab = value; } });
const TEACHER_KEYS = { Space: 'play', '.': 'frame', '/': 'ui', Escape: 'reset' };
const teacherStrip = document.createElement('aside'); teacherStrip.id = 'teacher-strip'; document.body.append(teacherStrip);
const numericLayer = document.createElement('div'); numericLayer.id = 'teacher-numbers'; document.body.append(numericLayer);
const classPanel = document.createElement('div'); classPanel.id = 'teacher-class'; classPanel.hidden = true; document.body.append(classPanel);
const spotMask = document.createElement('div'); spotMask.id = 'teacher-spot'; document.body.append(spotMask);
const laserCanvas = document.createElement('canvas'); laserCanvas.id = 'teacher-laser'; document.body.append(laserCanvas);
const laserTrail = [];
let controlBox = null;
// All words come from UI_TEXT through TEACHER_CFG; this controller owns no strings.
const say = words => words[TEACHER_CFG.language];
const W = key => say(TEACHER_CFG.words[key]);
const levelName = id => TEACHER_CFG.language === 'ko' ? `${id}${W('level')}` : `${W('level')} ${id}`;
const shortcut = command => Object.keys(TEACHER_KEYS).find(k => TEACHER_KEYS[k] === command)?.replace('Escape', 'Esc');
function node(tag, parent, words, className) {
  const e = document.createElement(tag); if (words !== undefined) e.textContent = words; if (className) e.className = className; parent.append(e); return e;
}
// pressed === undefined means a plain action button; the shortcut hint is drawn by CSS from data-key.
function teacherButton(words, fn, parent, id, pressed, command) {
  const b = node('button', parent, words); b.dataset.id = id; b.onclick = fn;
  if (pressed !== undefined) b.setAttribute('aria-pressed', String(pressed));
  const key = command && shortcut(command); if (key) b.dataset.key = key;
  return b;
}
const TEACHER = {
  state: T, config: TEACHER_CFG,
  mode(mode) {
    if (!['student', 'free', 'teacher'].includes(mode)) throw new RangeError('mode');
    if (T.mode === 'teacher' && mode !== 'teacher') this.reset();
    T.mode = mode; document.body.dataset.mode = mode;
    TEACHER_CFG.scale(mode === 'teacher' ? 1.4 : 1);
    TEACHER_CFG.questMode(mode !== 'student');
    if (mode === 'teacher') this.select(TEACHER_CFG.getQuest());
    this.render();
  },
  layers(names) { for (const name of TEACHER_CFG.layerOrder) TEACHER_CFG.setLayer(name, names.includes(name)); },
  stack() {
    if (T.layerStep >= TEACHER_CFG.layerOrder.length) { T.layerStep = 0; this.layers([]); }
    else { if (!T.layerStep) this.layers([]); TEACHER_CFG.setLayer(TEACHER_CFG.layerOrder[T.layerStep++], true); }
    this.render();
  },
  select(i) { TEACHER_CFG.selectQuest(i); T.layerStep = 0; classPanel.hidden = true; this.render(); },
  reset() {
    const mode = T.mode;
    T.slow = T.spotlight = T.laser = T.numbers = false; T.ab = null; T.layerStep = 0;
    classPanel.hidden = true; laserTrail.length = 0;
    TEACHER_CFG.reset(); T.mode = mode; this.layers([]); TEACHER_CFG.ghost(null); TEACHER_CFG.ui(true);
    if (T.mode === 'student') TEACHER_CFG.startStudent();
    TEACHER_CFG.refresh(); this.render();
  },
  command(name) {
    if (name === 'reset') this.reset();
    else if (name === 'export') TEACHER_CFG.exportLog();
    else if (name === 'play') TEACHER_CFG.play(!TEACHER_CFG.getPlaying());
    else if (name === 'frame') TEACHER_CFG.oneFrame();
    else if (name === 'stack') this.stack();
    else if (name === 'off') { T.layerStep = 0; this.layers([]); }
    else if (name === 'ab') { T.ab = { closer: TEACHER_CFG.getCloser() }; TEACHER_CFG.ghost(T.ab); }
    else if (name === 'clear') { T.ab = null; TEACHER_CFG.ghost(null); }
    else if (name === 'predict') { TEACHER_CFG.predict(true); classPanel.hidden = false; this.prediction(); }
    else if (['slow', 'spotlight', 'laser', 'numbers'].includes(name)) T[name] = !T[name];
    this.render();
  },
  render() {
    const focused = document.activeElement?.closest('#teacher-strip') ? document.activeElement.dataset.id : null;
    teacherStrip.hidden = T.mode !== 'teacher'; teacherStrip.replaceChildren();
    const quest = TEACHER_CFG.getQuest(), level = TEACHER_CFG.levelOf(quest), playing = TEACHER_CFG.getPlaying();
    const section = (title, className) => {
      const s = node('section', teacherStrip); node('h2', s, W(title)); return node('div', s, undefined, className ? 't-row ' + className : 't-row');
    };
    const act = (key, command, parent = group) => teacherButton(W(key), () => this.command(command), parent, command, undefined, command);
    const toggle = (key, command, on, parent = group) => teacherButton(W(key), () => this.command(command), parent, command, on, command);
    let group = node('div', teacherStrip, undefined, 't-row t-wide');
    teacherButton(W('toStudent'), () => this.mode('student'), group, 'student');

    group = section('tcNow', 't-now');
    node('h3', group, say(TEACHER_CFG.quests[quest].title)); node('p', group, say(TEACHER_CFG.questNote(quest)));

    group = section('tcPick');
    for (const l of TEACHER_CFG.levels) teacherButton(levelName(l.id), () => { T.numbers = l.id >= 2; this.select(TEACHER_CFG.firstOfLevel(l.id)); }, group, 'level' + l.id, level === l.id);
    group = node('div', group.parentElement, undefined, 't-row t-quests');
    TEACHER_CFG.questOrder.forEach((i, pos) => {
      if (TEACHER_CFG.levelOf(i) === level) teacherButton(`${pos + 1}. ${say(TEACHER_CFG.quests[i].title)}`, () => this.select(i), group, 'quest' + i, i === quest);
    });

    group = section('tcControls');
    controlBox = group; controlBox.signature = null;

    group = section('tcPlayback');
    teacherButton(W(playing ? 'tcPause' : 'tcPlay'), () => this.command('play'), group, 'play', playing, 'play');
    toggle('tcFrame', 'frame', undefined); toggle('tcSlow', 'slow', T.slow);

    group = section('tcLayers', 't-layers');
    for (const name of TEACHER_CFG.layerOrder) teacherButton(say(TEACHER_CFG.layerLabels[name]), () => {
      TEACHER_CFG.setLayer(name, !TEACHER_CFG.layerOn(name)); this.render();
    }, group, 'layer-' + name, TEACHER_CFG.layerOn(name));
    group = node('div', group.parentElement, undefined, 't-row');
    act('tcStack', 'stack'); act('tcAllOff', 'off');

    group = section('tcCompare');
    toggle('tcPin', 'ab', !!T.ab); act('tcUnpin', 'clear');

    group = section('tcPresent');
    toggle('tcSpot', 'spotlight', T.spotlight); toggle('tcLaser', 'laser', T.laser); toggle('tcNumbers', 'numbers', T.numbers);

    group = section('tcClass');
    act('tcPredict', 'predict'); act('reset', 'reset'); act('tcExport', 'export');

    if (focused) [...teacherStrip.querySelectorAll('button')].find(b => b.dataset.id === focused)?.focus({ preventScroll: true });
    this.update(0);
  },
  // Same rows as the student panel (drawn by the lab's one control function), redrawn when their state changes.
  controls() {
    const signature = TEACHER_CFG.controlSignature();
    if (!controlBox || controlBox.signature === signature || TEACHER_CFG.sliderHeld(controlBox)) return;
    controlBox.signature = signature; controlBox.replaceChildren(); TEACHER_CFG.drawControls(controlBox);
  },
  prediction() {
    const data = TEACHER_CFG.predict(); classPanel.replaceChildren();
    teacherButton(W('tcClose'), () => { classPanel.hidden = true; }, classPanel, 'close');
    node('h2', classPanel, say(data.ask));
    if (data.phase === 'predict') {
      const row = node('div', classPanel, undefined, 't-choices');
      data.candidates.forEach((c, i) => {
        const b = teacherButton(say(c.label), () => { TEACHER_CFG.predict(false, i); this.prediction(); }, row, 'choice' + i);
        b.dataset.choice = i; node('div', b, undefined, 'pic');
      });
    } else {
      const { pick, result } = data.summary();
      node('p', classPanel, `${W('tcPredicted')}: ${say(pick)} / ${W('actual')}: ${result}`, 'class-summary');
      node('div', classPanel, undefined, 'class-result');
    }
    classPanel.querySelector('button')?.focus({ preventScroll: true });
  },
  // Tell the camera lane which side the panel covers (--hud-* are read by stageRect).
  reserve() {
    const r = teacherStrip.getBoundingClientRect(), drawer = r.width > innerWidth / 2;
    const top = !numericLayer.hidden ? numericLayer.getBoundingClientRect().bottom + 8 : 12;
    const values = { top, right: drawer ? 0 : innerWidth - r.left, bottom: drawer ? innerHeight - r.top + 8 : 12 };
    for (const [side, px] of Object.entries(values)) document.documentElement.style.setProperty('--hud-' + side, Math.round(px) + 'px');
  },
  update(dt) {
    spotMask.hidden = T.mode !== 'teacher' || !T.spotlight;
    laserCanvas.hidden = T.mode !== 'teacher' || !T.laser;
    numericLayer.hidden = T.mode !== 'teacher' || !T.numbers;
    if (!numericLayer.hidden) {
      if (numericLayer.children.length !== TEACHER_CFG.numbers.length) {
        numericLayer.replaceChildren();
        for (const row of TEACHER_CFG.numbers) { const line = node('div', numericLayer); node('span', line); node('b', line).dataset.numeric = ''; }
      }
      TEACHER_CFG.numbers.forEach((row, i) => {
        const [label, value] = numericLayer.children[i].children;
        label.textContent = W(row.label); value.textContent = row.fn().toFixed(row.digits) + W(row.unit);
      });
    }
    if (T.mode === 'teacher') { this.reserve(); this.controls(); }
    if (!classPanel.hidden) {
      const data = TEACHER_CFG.predict(false, null, dt);
      if (data.phase === 'predict') classPanel.querySelectorAll('[data-choice] .pic').forEach(pic => { pic.innerHTML = data.picture(data.candidates[+pic.parentElement.dataset.choice]); });
      else classPanel.querySelector('.class-result').innerHTML = data.compare();
    }
    if (!laserCanvas.hidden) {
      if (laserCanvas.width !== innerWidth || laserCanvas.height !== innerHeight) { laserCanvas.width = innerWidth; laserCanvas.height = innerHeight; }
      const c = laserCanvas.getContext('2d'), now = performance.now(); c.clearRect(0, 0, innerWidth, innerHeight);
      while (laserTrail.length > 1 && now - laserTrail[0].t > 160) laserTrail.shift();
      if (laserTrail.length) {
        c.strokeStyle = '#ff3838'; c.fillStyle = '#ff3838'; c.lineWidth = 4; c.shadowColor = '#ff0000'; c.shadowBlur = 12;
        c.beginPath(); laserTrail.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.stroke();
        const p = laserTrail.at(-1); c.beginPath(); c.arc(p.x, p.y, 5, 0, Math.PI * 2); c.fill();
      }
    }
  }
};
window.addEventListener('pointermove', e => {
  spotMask.style.setProperty('--pointer-x', `${e.clientX}px`); spotMask.style.setProperty('--pointer-y', `${e.clientY}px`);
  if (T.laser) laserTrail.push({ x: e.clientX, y: e.clientY, t: performance.now() });
}, { passive: true });
window.addEventListener('pointerdown', e => {
  spotMask.style.setProperty('--pointer-x', `${e.clientX}px`); spotMask.style.setProperty('--pointer-y', `${e.clientY}px`);
  if (T.laser) laserTrail.push({ x: e.clientX, y: e.clientY, t: performance.now() });
}, { passive: true });
window.addEventListener('keydown', e => {
  if (T.mode !== 'teacher' || e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
  const command = TEACHER_KEYS[e.code === 'Space' ? 'Space' : e.key];
  // The existing HUD owns the shared slash shortcut in all modes.
  if (command && command !== 'ui') { e.preventDefault(); TEACHER.command(command); }
});
Object.assign(window.__lab, { teacher: TEACHER });
