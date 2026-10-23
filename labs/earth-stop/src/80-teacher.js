// Lab-specific bindings stop at this object. The controller below is portable.
const TEACHER_CFG = {
  idleSeconds: 90,
  layerOrder: ['hero','console','globe','pin','body','speed','benchmark','접선 속도의 크기','벤치마크 비교','위도에 따른 감소','관성','낮밤 경계','sun','상대 각속도','설계 속도 한계','반복 관측'],
  layerIcons: {globe:'shell',pin:'locator',body:'bead',speed:'vector',benchmark:'rack','접선 속도의 크기':'ticks','벤치마크 비교':'overlap','위도에 따른 감소':'stairs','관성':'trail','낮밤 경계':'split',sun:'lamp','상대 각속도':'arcs','설계 속도 한계':'threshold','반복 관측':'records',console:'deck',hero:'apparatus'},
  layerLabels: {
    globe:{ko:'지구본',en:'Globe'},pin:{ko:'위도 핀',en:'Latitude pin'},body:{ko:'몸 구슬',en:'Body bead'},speed:{ko:'속도 화살표',en:'Velocity arrow'},benchmark:{ko:'기준 장치',en:'Benchmark rack'},
    '접선 속도의 크기':{ko:'접선 속도의 크기',en:'Tangential speed'},'벤치마크 비교':{ko:'벤치마크 비교',en:'Benchmark comparison'},'위도에 따른 감소':{ko:'위도에 따른 감소',en:'Latitude decrease'},'관성':{ko:'관성',en:'Inertia'},'낮밤 경계':{ko:'낮밤 경계',en:'Day-night boundary'},sun:{ko:'태양 램프',en:'Sun lamp'},'상대 각속도':{ko:'상대 각속도',en:'Relative angular velocity'},'설계 속도 한계':{ko:'설계 속도 한계',en:'Design speed limit'},'반복 관측':{ko:'반복 관측',en:'Repeated observations'},console:{ko:'콘솔',en:'Console'},hero:{ko:'전체 장치',en:'Whole apparatus'}
  },
  numbers: [
    {label:'locator',fn:()=>currentPhi(),unit:'°'},
    {label:'vector',fn:()=>S.run?.measurement.relativeSpeed??PHYS.v(currentPhi(),currentPeriod()),unit:'m/s'},
    {label:'ticks',fn:()=>PHYS.mach(S.run?.measurement.relativeSpeed??PHYS.v(currentPhi(),currentPeriod())),unit:'×'},
    {label:'arcs',fn:()=>PHYS.solarDay(currentPeriod())/PHYS.C.day,unit:'×'},
    {label:'threshold',fn:()=>PHYS.phiSafe(PHYS.C.designSpeed),unit:'°'}
  ],
  // closer is the portable controller's scalar input slot: here it is the P rail.
  attract: [
    {shot:1,closer:PHYS.periodRailX(PHYS.C.T0),layers:['hero','console','globe','pin','body','speed','sun','접선 속도의 크기','벤치마크 비교'],seconds:8},
    {shot:5,closer:PHYS.periodRailX(PHYS.C.questPeriod),layers:['hero','console','globe','pin','body','speed','sun','낮밤 경계','상대 각속도'],seconds:12},
    {shot:5,closer:PHYS.periodRailX(PHYS.C.P_stop),layers:['hero','console','globe','pin','body','speed','sun','상대 각속도'],seconds:12},
    {shot:1,closer:PHYS.periodRailX(PHYS.C.T0),layers:['hero','console','globe','pin','body','speed','sun','접선 속도의 크기'],seconds:8}
  ],
  shots:SHOTS,verticalShots:SHOTS_VERTICAL,heroShot:SHOTS[1],language:LANG,icon,setLayer:layer,
  layerOn:name=>name in GRAMMAR.enabled?GRAMMAR.enabled[name]:S.layers[name]!==false,
  getCloser:()=>S.period.value,
  setCloser(value,immediate=false){S.run=null;S.mode.value=S.mode.target=1;S.period.target=clamp(value,0,1);if(immediate)S.period.value=S.period.target;},
  getPlaying:()=>!!S.playing.target,
  play(on){S.playing.value=S.playing.target=+on;syncUI();},
  oneFrame(){const playing=S.playing.target;S.playing.value=S.playing.target=1;step(1);S.playing.value=S.playing.target=playing;syncUI();},
  ui(on){S.ui.value=S.ui.target=+on;document.body.classList.toggle('hide-ui',!on);window.__site?.setVisible(on);},
  getUI:()=>!!S.ui.target,
  fly(spec,duration){flyTo(spec,duration);},
  shotForStage(row){return S.vertical?SHOTS_VERTICAL[row.shot===5?2:0]:SHOTS[row.shot];},
  quests:QUESTS,getQuest:()=>Q.i,
  bindMode(state){Object.defineProperty(Q,'free',{get:()=>state.mode!=='student',set(value){if(state.mode!=='teacher')state.mode=value?'free':'student';},enumerable:true,configurable:true});},
  questMode(free){QUEST.mode(free);},
  selectQuest(i){QUEST.go(i);S.ab=null;GRAMMAR.unpin();Q.free=true;Q.phase='act';DIRECTOR.clear();
    this.layersForQuest(i);shot(S.vertical?0:1,S.vertical);questUI();},
  layersForQuest(i){TEACHER.layers(['hero','console','globe','pin','body','speed','sun',...QUESTS[i].layers]);},
  cardBusy:()=>!Q.free&&['intro','predict','observe','confirm','card'].includes(Q.phase),
  reset(){
    if(S.drag)endDrag({pointerId:S.drag.id});S.fly=null;controls.enabled=true;
    preset(0);S.playing.value=S.playing.target=0;S.sound.value=S.sound.target=0;
    S.run=null;S.runId=0;GRAMMAR.clear();Q.records={};Q.completed.clear();Q.stars.fill(0);Q.pick=null;
    DIRECTOR.clear();QUEST.go(0);Q.free=true;Q.phase='act';
    updateHero();GRAMMAR.update(10);shot(S.vertical?0:1,S.vertical);syncUI();
  },
  startStudent(){for(const n of ['hero','console','globe','pin','body','speed','sun'])layer(n,true);QUEST.go(0);},
  refresh(){if(this.layerOrder.every(n=>!this.layerOn(n)))for(const n of ['hero','console','globe','pin','body','speed','sun'])layer(n,true);questUI();},
  visibilityReset(){S.lastTime=0;},
  frameViewport(){
    const r=teacherStrip.getBoundingClientRect(),top=document.getElementById('quests').getBoundingClientRect().bottom+12;
    const w=Math.max(100,r.left-24),h=Math.max(100,innerHeight-top-12);
    camera.setViewOffset(w,h,-12,-top,innerWidth,innerHeight);
  },
  scale(value){
    S.lineScale=value;
    if(value===1){camera.clearViewOffset();camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
    for(const grip of [SLIDER.handle,DIAL.knob,PLAY_BUTTON,PIN_HIT])grip.scale.setScalar(value);
    scene.traverse(o=>{if(o.isLine)o.material.linewidth=value;});
    SPEED_SHAFT.scale.y=value;SPEED_TIP.scale.y=value;
  },
  ghost(snapshot){if(snapshot)GRAMMAR.pin();else GRAMMAR.unpin();},
  predict(open=false,choice=null,dt=0){
    const d=QUESTS[Q.i];
    if(open){Q.phase='predict';Q.pick=null;Q.flags.classElapsed=0;this.layersForQuest(Q.i);}
    if(choice!==null){
      Q.pick=d.candidates[choice].key;Q.phase='observe';Q.flags.classElapsed=0;
      // Actual conditions follow the question, independently of the selected answer.
      if(Q.i===1)set('phi',PHYS.C.highLatitude);
      if(Q.i===2)executeStop();
      if(Q.i===3){set('mode','gradual');set('P',PHYS.C.questPeriod);this.play(true);}
      if(Q.i===4){set('mode','gradual');set('P',PHYS.C.P_stop);this.play(true);}
      if(Q.i===5)set('phi',PHYS.phiSafe(PHYS.C.designSpeed));
      for(const n of ['phi','period','mode'])S[n].value=S[n].target;
    }
    if(Q.phase==='observe'){Q.flags.classElapsed+=dt;if(Q.flags.classElapsed>=2.5)Q.phase='confirm';}
    return {phase:Q.phase,candidates:d.candidates,picture:c=>CARDS.picture(d.id,c,DIRECTOR.clock),compare:()=>{
      const chosen=d.candidates.find(c=>c.key===Q.pick)||d.candidates[0];
      return `<div class="q-compare">${CARDS.picture(d.id,chosen)}${CARDS.actual(d.id,QUEST.sample())}</div>`;
    }};
  }
};

const T = { mode: 'student', slow: false, spotlight: false, laser: false, numbers: false, ab: null, layerStep: 0 };
TEACHER_CFG.bindMode(T);
// Compatibility view, never a second stored snapshot.
Object.defineProperty(S, 'ab', { get: () => T.ab, set: value => { T.ab = value; } });
const TEACHER_LABELS = {
  teacher: { ko: '교사 시연', en: 'Teacher demonstration' },
  ui: { ko: '화면 조작 숨기기 또는 보이기', en: 'Hide or show controls' },
  frame: { ko: '한 프레임', en: 'One frame' }, slow: { ko: '사분의 일 속도', en: 'Quarter speed' },
  stack: { ko: '다음 표현 층', en: 'Stack next layer' }, ab: { ko: '비교 고정', en: 'Pin comparison' },
  clear: { ko: '비교 해제', en: 'Clear comparison' }, spotlight: { ko: '스포트라이트', en: 'Spotlight' },
  laser: { ko: '레이저 포인터', en: 'Laser pointer' }, numbers: { ko: '수치 층', en: 'Numeric layer' },
  predict: { ko: '학급 예상', en: 'Class prediction' }, close: { ko: '예상 닫기', en: 'Close prediction' },
  play: { ko: '정지 또는 재생', en: 'Pause or play' }, reset: { ko: '처음 상태', en: 'Reset' },
  choice: { ko: '예상 후보', en: 'Prediction candidate' }, quest: { ko: '퀘스트 바로가기', en: 'Quest shortcut' }
};
Object.assign(LABELS, TEACHER_LABELS);
Object.assign(ICONS, {
  teacher: 'M6 3h12v18H6zM9 6h6M9 10h6M9 15h1m4 0h1M9 18h6',
  frame: 'M4 5v14l8-7zM14 5l8 7-8 7z', slow: 'M3 14h18M6 14V9h12v5M8 9V6m8 3V6M7 18h1m8 0h1',
  ab: 'M3 5h7v14H3zM14 5h7v14h-7zM10 12h4', clear: 'M5 5l14 14M19 5L5 19',
  spotlight: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v10M7 12h10',
  laser: 'M3 21l9-9m-2-2 4 4M16 2v4m2 2h4M18 6l3-3',
  numbers: 'M7 3L5 21M16 3l-2 18M2 9h19M1 15h19', predict: 'M3 4h18v13H3zM8 21l4-4 4 4M7 8h3m4 0h3M7 12h10', close: 'M5 5l14 14M19 5L5 19'
});
const TEACHER_KEYS = { Space: 'play', '.': 'frame', '/': 'ui', Escape: 'reset' };
const teacherStrip = document.createElement('aside'); teacherStrip.id = 'teacher-strip'; document.body.append(teacherStrip);
const numericLayer = document.createElement('div'); numericLayer.id = 'teacher-numbers'; document.body.append(numericLayer);
const classPanel = document.createElement('div'); classPanel.id = 'teacher-class'; classPanel.hidden = true; document.body.append(classPanel);
const spotMask = document.createElement('div'); spotMask.id = 'teacher-spot'; document.body.append(spotMask);
const laserCanvas = document.createElement('canvas'); laserCanvas.id = 'teacher-laser'; document.body.append(laserCanvas);
const laserTrail = [];
function teacherButton(label, symbol, fn, parent, dictionary = TEACHER_LABELS) {
  const b = document.createElement('button'); b.setAttribute('aria-label', dictionary[label][TEACHER_CFG.language]);
  b.innerHTML = TEACHER_CFG.icon(symbol); b.onclick = fn; parent.append(b); return b;
}
const TEACHER = {
  state: T, config: TEACHER_CFG,
  mode(mode) {
    if (!['student', 'free', 'teacher'].includes(mode)) throw new RangeError('mode');
    if (T.mode === 'teacher' && mode !== 'teacher') this.reset();
    T.mode = mode; document.body.dataset.mode = mode;
    document.documentElement.style.setProperty('--ui-scale', mode === 'teacher' ? '1.4' : '1');
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
    else if (name === 'play') TEACHER_CFG.play(!TEACHER_CFG.getPlaying());
    else if (name === 'frame') TEACHER_CFG.oneFrame();
    else if (name === 'stack') this.stack();
    else if (name === 'ab') { T.ab = { closer: TEACHER_CFG.getCloser() }; TEACHER_CFG.ghost(T.ab); }
    else if (name === 'clear') { T.ab = null; TEACHER_CFG.ghost(null); }
    else if (name === 'predict') { TEACHER_CFG.predict(true); classPanel.hidden = false; this.prediction(); }
    else if (['slow', 'spotlight', 'laser', 'numbers'].includes(name)) T[name] = !T[name];
    this.render();
  },
  render() {
    const focusLabel = document.activeElement?.closest('#teacher-strip') ? document.activeElement.getAttribute('aria-label') : null;
    teacherStrip.hidden = T.mode !== 'teacher'; teacherStrip.replaceChildren();
    const section = () => { const g = document.createElement('div'); g.className = 'teacher-grid'; teacherStrip.append(g); return g; };
    let group = section();
    for (const name of ['play', 'frame', 'slow']) {
      const b = teacherButton(name, name === 'play' ? TEACHER_CFG.getPlaying() ? 'pause' : 'play' : name, () => this.command(name), group);
      b.setAttribute('aria-pressed', String(name === 'play' ? TEACHER_CFG.getPlaying() : !!T[name]));
    }
    group = section();
    for (const name of TEACHER_CFG.layerOrder) teacherButton(name, TEACHER_CFG.layerIcons[name], () => {
      TEACHER_CFG.setLayer(name, !TEACHER_CFG.layerOn(name)); this.render();
    }, group, TEACHER_CFG.layerLabels).setAttribute('aria-pressed', String(TEACHER_CFG.layerOn(name)));
    teacherButton('stack', 'next', () => this.stack(), group);
    group = section();
    for (const name of ['ab', 'clear', 'spotlight', 'laser', 'numbers']) teacherButton(name, name, () => this.command(name), group).setAttribute('aria-pressed', String(name === 'ab' ? !!T.ab : !!T[name]));
    group = section();
    TEACHER_CFG.quests.forEach((d, i) => { const b = teacherButton('quest', d.icon, () => this.select(i), group); b.setAttribute('aria-label', `${TEACHER_LABELS.quest[TEACHER_CFG.language]} ${i + 1}`); });
    group = section();
    for (const name of ['predict', 'reset']) teacherButton(name, name, () => this.command(name), group);
    if (focusLabel) [...teacherStrip.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === focusLabel)?.focus({ preventScroll: true });
    this.update(0);
  },
  prediction() {
    const data = TEACHER_CFG.predict(); classPanel.replaceChildren();
    teacherButton('close', 'close', () => { classPanel.hidden = true; }, classPanel);
    if (data.phase === 'predict') data.candidates.forEach((c, i) => {
      const b = teacherButton('choice', 'predict', () => { TEACHER_CFG.predict(false, i); this.prediction(); }, classPanel);
      b.dataset.choice = i; b.setAttribute('aria-label', `${TEACHER_LABELS.choice[TEACHER_CFG.language]} ${i + 1}`); b.innerHTML = data.picture(c);
    });
    else { const compare = document.createElement('div'); compare.className = 'class-result'; compare.innerHTML = data.compare(); classPanel.append(compare); }
    classPanel.querySelector('button')?.focus({ preventScroll: true });
  },
  update(dt) {
    spotMask.hidden = T.mode !== 'teacher' || !T.spotlight;
    laserCanvas.hidden = T.mode !== 'teacher' || !T.laser;
    numericLayer.hidden = T.mode !== 'teacher' || !T.numbers;
    if (!numericLayer.hidden) numericLayer.innerHTML = TEACHER_CFG.numbers.map(row => `<div>${TEACHER_CFG.icon(row.label)}<span data-numeric>${row.fn().toFixed(2)} ${row.unit}</span></div>`).join('');
    if (!classPanel.hidden) {
      const data = TEACHER_CFG.predict(false, null, dt);
      if (data.phase === 'predict') classPanel.querySelectorAll('[data-choice]').forEach(b => { b.innerHTML = data.picture(data.candidates[+b.dataset.choice]); });
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
