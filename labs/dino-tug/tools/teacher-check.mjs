// No browser: verify real configuration/model data and run portable controllers with DOM boundaries stubbed.
process.env.TEMP = process.env.TMP = 'D:/CodexWork/Temp';
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const read = name => fs.readFileSync(new URL(name, root), 'utf8');
const teacher = read('src/80-teacher.js'), attract = read('src/85-attract.js');
for (const name of fs.readdirSync(new URL('src/', root)).filter(n => n.endsWith('.js'))) {
  execFileSync(process.execPath, ['--check', fileURLToPath(new URL(`src/${name}`, root))]);
  const source = read(`src/${name}`);
  if(name!=='65-quests.js')assert(!/Math\.random/.test(source), `${name}: random outside explanation shuffle`);
  assert(!/<text\b|fillText\s*\(|<img\b/u.test(source), `${name}: prohibited visual API`);
}
for (const source of [teacher, attract]) {
  assert(!/\.textContent\s*=\s*['"][^'"]*[\p{L}]/u.test(source), 'literal visible words');
  for (const m of source.matchAll(/>([^<>]+)</g)) if (!m[1].includes('${') && !/[;{}]/.test(m[1])) assert(!/[\p{L}]/u.test(m[1]), `visible literal: ${m[1]}`);
}
const body = teacher.slice(teacher.indexOf('const T ='));
assert(!/\b(?:PHYS|GRAMMAR|QUESTS|QUEST|CARDS|SHOTS|MOON|OCEAN|RV|Q)\b/.test(body + attract), 'lab binding escaped TEACHER_CFG');
assert.equal((read('src/68-director.js').match(/T\.slow\s*\?\s*0\.25/g) || []).length, 1);
console.log('PASS: all source syntax; random limited to explanation engine; no canvas raster/text API; teacher words remain in dictionaries; generic boundary; one slow multiplier');

const definitions=vm.createContext({console,structuredClone});
const hudSource=read('src/60-interaction-hud.js'),hudPart=(from,to)=>hudSource.slice(hudSource.indexOf(from),hudSource.indexOf(to));
vm.runInContext(read('src/15-physics.js')+`
const SPECIES_KEYS=Object.keys(PHYS.SPECIES),GROUND_VALUES=Object.values(PHYS.GROUNDS);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));const pair=v=>({value:v,target:v});const S={u:pair(PHYS.railX(1)),species:pair(0),ground:pair(2),t:pair(0),playing:pair(0),cassette:pair(0),drag:null,vertical:false};
const controls={enabled:true};
const GRAMMAR={LAYERS:['marks','steps','limits','overlay','micro','traces','ratio','records'],enabled:{},set(v){Object.assign(this.enabled,v)},unpin(){},clearRecords(){},pin(){},record(){}};
const DIRECTOR={eventLeft:0,clear(){this.eventLeft=0},intro(){},push(){},event(){this.eventLeft=1.4},chord(){},time(dt){return dt*(this.eventLeft>0?.18:1)}};
const document={getElementById(){return {animate(){}}},createElement:t=>hostCreate(t),createTextNode:t=>({textContent:t})};
function questUI(){} function syncUI(){} function shot(){} function announceResult(){}

function step(n=1,dt=1/60){if(n>120)throw Error('batch');for(let i=0;i<n;i++){S.u.value+=(S.u.target-S.u.value)*(1-Math.exp(-18*dt));if(Math.abs(S.u.value-S.u.target)<1e-8)S.u.value=S.u.target;QUEST.update(dt);DIRECTOR.eventLeft=Math.max(0,DIRECTOR.eventLeft-dt);}}
`+read('src/62-curriculum.js')+read('src/63-explain.js')+read('src/64-ui-text.js')+read('src/65-quests.js')+read('src/66-cards.js')+read('src/67-mission.js')+read('src/60-interaction-hud.js').slice(read('src/60-interaction-hud.js').indexOf('function set(name,v){'),read('src/60-interaction-hud.js').indexOf('const PRESETS'))+hudPart('function ui(key)','function renderHeader')+hudPart('const lensValues','function renderControls')+read('src/60-interaction-hud.js').slice(read('src/60-interaction-hud.js').indexOf('function resultSentence('),read('src/60-interaction-hud.js').indexOf('function renderForces')),definitions);

const grammarSource=read('src/45-grammar.js');
const defaultSource=grammarSource.slice(grammarSource.indexOf('const defaults ='),grammarSource.indexOf('  const LAYERS='));
vm.runInContext(defaultSource+`
GRAMMAR.LAYERS=Object.keys(defaults);GRAMMAR.defaults=defaults;
S.sound={value:0,target:0};S.ui={value:1,target:1};S.layers={};
const SHOTS=Array.from({length:6},(_,i)=>({name:String(i)})),SHOTS_VERTICAL=SHOTS.slice(0,3);
var LANG='ko';const icon=()=>'',layer=(n,on)=>{S.layers[n]=on},updateHero=()=>{},endDrag=()=>{},flyTo=()=>{},scene={traverse(){}},camera={clearViewOffset(){},updateProjectionMatrix(){}};
`+teacher.slice(0,teacher.indexOf('const T =')),definitions);
const config=vm.runInContext('TEACHER_CFG',definitions);
const real=code=>vm.runInContext(code,definitions);
real(`const bridge={mode:'student'};TEACHER_CFG.bindMode(bridge);Q.free=true;`);
assert.equal(real('bridge.mode'),'free');real(`bridge.mode='teacher';Q.free=false;`);assert(real('Q.free'));
const actual=new Set(['hero','console','track','capacities',...real('GRAMMAR.LAYERS')]);
assert.deepEqual([...config.layerOrder].sort(),[...actual].sort());
for(const name of config.layerOrder)assert(config.layerLabels[name].ko&&config.layerLabels[name].en);
assert.equal(config.quests.length,12);assert.equal(config.verticalShots.length,3);
assert.deepEqual([...config.questOrder],[7,8,0,1,3,9,10,11,4,2,5,6]);
for(const row of config.attract){assert(Number.isFinite(row.closer)&&row.seconds>0&&config.shots[row.shot]);for(const n of row.layers)assert(actual.has(n));}
for(const row of config.numbers){assert(Number.isFinite(row.fn())&&Number.isInteger(row.digits));assert(config.words[row.label]&&config.words[row.unit]);}
real(`const TEACHER={layers(names){for(const name of TEACHER_CFG.layerOrder)TEACHER_CFG.setLayer(name,names.includes(name));}};`);
for(let i=0;i<12;i++){
 real(`TEACHER_CFG.selectQuest(${i});TEACHER_CFG.predict(true);TEACHER_CFG.predict(false,0);TEACHER_CFG.predict(false,null,3);`);
 assert.equal(real('Q.phase'),'confirm');assert.equal(real('Q.run'),0);assert.equal(real('Q.completed.size'),0);
 assert(real(`!/<text|NaN|Infinity|undefined/.test(TEACHER_CFG.predict().compare())`));
 if(i===3)assert.equal(real('Q.flags.classSample.observations.length'),2);
 if(i===4)assert.equal(real('Q.flags.classSample.after.n-Q.flags.classSample.before.n'),10);
}
console.log(`PASS: TEACHER_CFG ${config.layerOrder.length} actual layers, 12 quests, 3 vertical shots, ${config.attract.length} stages, ${config.numbers.length} PHYS numeric rows; twelve real prediction adapters without awarding progress`);

let now = 0, closer = 0, playing = false, ui = true, resets = 0, starts = 0, busy = false, selectedQuest = 0;
const enabled = new Set();
class Element {
  constructor() { this.hidden = false; this.children = []; this.dataset = {}; this.attributes = {}; this.className = ''; this.textContent = ''; this.innerHTML = '';
    this.style = { setProperty: (k, v) => { this.style[k] = v; } }; }
  append(...children) { for(const child of children){child.parentElement=this;this.children.push(child);} }
  replaceChildren() { this.children = []; }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k]; }
  all() { return this.children.flatMap(child => [child, ...child.all()]); }
  querySelectorAll(selector) {
    const test = { button: e => e.tagName==='BUTTON', h2: e => e.tagName==='H2', '.class-result': e => e.className==='class-result',
      '[data-choice] .pic': e => e.className==='pic' && e.parentElement.dataset.choice !== undefined }[selector];
    return this.all().filter(test);
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0]; }
  closest(selector) { return selector==='#teacher-strip'&&this.id==='teacher-strip'?this:this.parentElement?.closest(selector); }
  focus() { document.activeElement=this; }
  getContext() { return { clearRect() {} }; }
  getBoundingClientRect() { return this.rect || { left: 0, top: 0, right: 100, bottom: 60, width: 100, height: 60 }; }
}
const listeners = {}, nodes = [];
const document = { body: new Element(), documentElement: new Element(),
  createElement(tag) { const n = new Element(); n.tagName=tag.toUpperCase();nodes.push(n); return n; }, addEventListener() {} };
document.body.classList = { add() {}, remove() {}, toggle() {} };
definitions.hostCreate = tag => document.createElement(tag);
const portable = { ...config, icon: () => '', language: 'ko',
  setLayer: (name, on) => on ? enabled.add(name) : enabled.delete(name), layerOn: name => enabled.has(name),
  getCloser: () => closer, setCloser: v => { closer = v; }, getPlaying: () => playing, play: on => { playing = on; },
  oneFrame() {}, ui: on => { ui = on; }, getUI: () => ui, fly() {}, selectShot() {}, shotForStage: row => row.shot,
  getQuest: () => selectedQuest, bindMode() {}, questMode() {}, selectQuest(i) {selectedQuest=i;}, cardBusy: () => busy, refresh() {}, scale() {}, ghost() {},
  reset() { closer = 0; resets++; }, startStudent() { starts++; }, visibilityReset() {}, predict: () => ({ phase: 'act' }) };
const context = vm.createContext({ TEACHER_CFG: portable, S: {}, LABELS: {}, ICONS: {}, document,
  innerWidth: 1200, innerHeight: 750, performance: { now: () => now }, URLSearchParams, location: { search: '?idle=2' },
  window: { __lab: {}, addEventListener(name, fn) { (listeners[name] ||= []).push(fn); } }, boot() {} });
vm.runInContext(body + attract, context);
const run = code => vm.runInContext(code, context);
const labels = run('ATTRACT_LABELS');
for (const [key, value] of Object.entries(labels)) assert(value.ko && value.en, key);
run(`TEACHER.mode('teacher'); TEACHER.stack(); TEACHER.stack(); TEACHER.stack();`);
assert.equal(enabled.size, 3);
run(`TEACHER.command('ab')`); closer = 123;
assert.equal(run('T.ab.closer'), 0); assert.equal(run('S.ab === T.ab'), true);
run(`TEACHER.command('slow'); TEACHER.command('spotlight'); TEACHER.command('numbers'); TEACHER.reset();`);
assert.equal(run('T.slow || T.spotlight || T.laser || T.numbers || T.ab !== null'), false);
assert.equal(enabled.size, 0);
now = 3000; run('ATTRACT.update(0)'); assert.equal(run('A.active'), false, 'teacher must not idle');
run(`TEACHER.mode('free')`); busy = true; run('ATTRACT.update(0)'); assert.equal(run('A.active'), false, 'cards must block idle');
busy = false; run('ATTRACT.update(0)'); assert.equal(run('A.active'), true, 'idle override must start');
for (let i = 0; i < 60; i++) run('ATTRACT.update(1)');
assert(Number.isFinite(closer));
const beforeWake = resets; run('ATTRACT.wake()'); assert(resets > beforeWake && starts > 0);
assert.equal(run('A.active'), false); assert.equal(closer, 0);
run('for(let i=0;i<4;i++) ATTRACT.health(1001)'); assert.equal(run('recovery.hidden'), true);
run('ATTRACT.health(1001)'); assert.equal(run('recovery.hidden'), false);
run('ATTRACT.wake(false); window.onerror()'); assert.equal(run('recovery.hidden'), false);
assert.deepEqual(Object.keys(run('T')).sort(), ['ab','laser','layerStep','mode','numbers','slow','spotlight'].sort());
assert.deepEqual(Object.keys(run('A')).sort(), ['active','stage','t']);
assert(nodes.filter(n => n.attributes['aria-label']).every(n => !!n.attributes['aria-label']));
console.log(`PASS: ${Object.keys(labels).length} bilingual attract labels; stacking, A/B alias, reset, idle exclusions/override, loop, wake, five-frame stall, onerror, exact T/A schemas`);

// HUD audit now checks canvas text and HUD clipping in hud-check.mjs.
// Other labs can independently change their visuals (including the laser style).
// The local controller/attract behavior is exercised above; sibling file identity
// is not a requirement for this lab and must not gate its checks.

// Run the real reset adapter with only rendering boundaries stubbed.
const hud=read('src/60-interaction-hud.js');
real(hud.slice(hud.indexOf('const PRESETS='),hud.indexOf('const hudRoot=')));
real(`bridge.mode='student';QUEST.skip('explain');`);assert(real('TEACHER_CFG.cardBusy()'));
real(`GRAMMAR.update=()=>{};Q.completed.add(3);Q.stars[3]=3;Q.run=9;Q.results=[{}];Q.explain=[{tries:['a'],right:true}];TEACHER_CFG.reset();`);
assert.equal(real('Q.explain.length'),0);
console.log('Explain teacher: passed 2, failed 0 (explain blocks idle; reset clears explanation log)');
assert.equal(real('Q.completed.size'),0);assert.equal(real('Q.run'),0);
assert.equal(real('Q.results.length'),0);assert(real('Q.stars.every(n=>n===0)'));
assert.equal(real('PHYS.kidsFromRailX(S.u.value)'),1);
real('TEACHER_CFG.refresh()');assert(real('S.layers.hero&&S.layers.track&&!S.layers.console'));
console.log('PASS: actual reset clears runs, stars, results and restores the starting team and base apparatus');

// CSS contract (strings only; the real layout is checked in the browser): text buttons, no square icon grid, side panel plus drawer.
const css=read('src/00-head.html');
assert(!css.includes('repeat(4,72px)')&&!css.includes('.teacher-grid')&&!css.includes('--ui-scale'));
assert(/#teacher-strip button,#teacher-class button\{[^}]*min-height:48px[^}]*font:600 16px/.test(css));
assert(/#teacher-strip\{[^}]*width:var\(--teacher-w\)[^}]*overflow:auto/.test(css)&&/--teacher-w:3[2-6]0px/.test(css));
assert(/@media\(max-width:600px\),\(max-aspect-ratio:9\/10\)\{[^}]*#teacher-strip\{[^}]*height:46dvh/.test(css));
console.log('PASS: teacher CSS is a text-button side panel with a portrait drawer');

let u7TeacherChecks=0;
const u7Teacher=(ok,label)=>{assert(ok,'U7 teacher: '+label);u7TeacherChecks++;};
const strip=run('teacherStrip'),panel=run('classPanel'),numbers=run('numericLayer'),rootStyle=document.documentElement.style;
const word=(lang,key)=>config.words[key][lang];
const textOf=lang=>[...strip.querySelectorAll('h2'),...strip.querySelectorAll('button')].map(e=>e.textContent);
const buttonByText=text=>strip.querySelectorAll('button').find(b=>b.textContent===text);
const click=(text,parentNode=strip)=>{const b=parentNode.querySelectorAll('button').find(b=>b.textContent===text);u7Teacher(!!b,'button "'+text+'"');b.onclick();return b;};
const hangul=/[가-힣]/;
const teacherControls=lang=>{
 const box=strip.all().find(e=>e.tagName==='SECTION'&&e.children[0]?.textContent===word(lang,'tcControls'));
 u7Teacher(!!box,lang+' control section title');
 const rowsOf=()=>box.all().filter(e=>e.tagName==='FIELDSET').map(e=>e.dataset.control);
 const fixtures=[[8,['kids','rival','pull'],{kids:'+',rival:'+'}],[10,['pull','lens'],{}],[11,['pullSlider'],{}],[5,['species','compare'],{}]];
 for(const [i,names,plus] of fixtures){
  real('QUEST.go('+i+')');real("Q.free=true;Q.phase='act'");selectedQuest=i;run('TEACHER.select('+i+')');
  const fresh=strip.all().find(e=>e.tagName==='SECTION'&&e.children[0]?.textContent===word(lang,'tcControls'));
  const rows=fresh.all().filter(e=>e.tagName==='FIELDSET').map(e=>e.dataset.control);
  u7Teacher(JSON.stringify(rows)===JSON.stringify(names),lang+' controls of quest '+(i+1)+': '+rows);
  u7Teacher(JSON.stringify(rows)===real('JSON.stringify(QUESTS['+i+'].controls)'),'same list as the quest');
  const legends=fresh.all().filter(e=>e.tagName==='LEGEND').map(e=>e.textContent);
  u7Teacher(legends.every((t,k)=>t===real("ui('"+names[k]+"')")),'student words in legends');
  if(names.includes('pull')){const pull=fresh.all().find(e=>e.tagName==='BUTTON'&&e.textContent===word(lang,'pull'));u7Teacher(!!pull,'pull button text');}
  for(const [name,sign] of Object.entries(plus)){
   const before=real('name==="kids"?PHYS.kidsFromRailX(S.u.target):S.rivalN'.replace('name==="kids"',name==='kids'?'true':'false'));
   const group=fresh.all().find(e=>e.tagName==='FIELDSET'&&e.dataset.control===name);
   group.all().find(e=>e.tagName==='BUTTON'&&e.textContent===sign).onclick();
   const after=real(name==='kids'?'PHYS.kidsFromRailX(S.u.target)':'S.rivalN');
   u7Teacher(after===before+1,'operating '+name+' changes the model');
   run('TEACHER.update(0)');
   const redrawn=strip.all().find(e=>e.tagName==='SECTION'&&e.children[0]?.textContent===word(lang,'tcControls'));
   u7Teacher(redrawn.all().some(e=>e.tagName==='OUTPUT'&&e.textContent.startsWith(String(after))),'readout follows '+name);
  }
 }
 selectedQuest=7;real('QUEST.go(7)');run('TEACHER.select(7)');
};
for(const lang of ['ko','en']){
 portable.language=definitions.LANG=lang;selectedQuest=7;run("TEACHER.mode('teacher')");
 const w=key=>word(lang,key);
 // Section titles and every button word required by the screen are present.
 const titles=strip.querySelectorAll('h2').map(e=>e.textContent);
 for(const key of ['tcNow','tcPick','tcPlayback','tcLayers','tcCompare','tcPresent','tcClass'])u7Teacher(titles.includes(w(key)),lang+' section '+key);
 for(const key of ['toStudent','tcPlay','tcFrame','tcSlow','tcStack','tcAllOff','tcPin','tcUnpin','tcSpot','tcLaser','tcNumbers','tcPredict','reset','tcExport'])u7Teacher(!!buttonByText(w(key)),lang+' button '+key);
 if(lang==='ko')for(const literal of ['학생 화면으로 돌아가기','지금 실험','실험 고르기','▶ 재생','한 프레임','느리게 (1/4)','보이는 층','다음 층 쌓기','모두 끄기','지금 상태 고정(비교)','고정 해제','스포트라이트','레이저 포인터','숫자 보이기','학급 예상 시작','처음 상태로','기록 저장(JSON)'])u7Teacher(textOf().includes(literal),'Korean text '+literal);
 if(lang==='en')u7Teacher(textOf().every(t=>!hangul.test(t)),'English panel has no Korean');
 // Current experiment: title and the concept sentence it shows.
 u7Teacher(strip.all().some(e=>e.tagName==='H3'&&e.textContent===config.quests[7].title[lang])&&strip.all().some(e=>e.tagName==='P'&&e.textContent===config.questNote(7)[lang]),lang+' current experiment title and note');
 // Level tabs: first experiment of the level, numbers on from level 2, exclusive pressed state, focus kept.
 const tab=n=>buttonByText(lang==='ko'?n+'단계':'Level '+n);
 for(const [level,first] of [[1,7],[2,9],[3,5]]){
  const button=tab(level);u7Teacher(!!button&&button.tagName==='BUTTON','tab '+level);
  button.focus();button.onclick();
  u7Teacher(portable.getQuest()===first,lang+' level '+level+' first quest');
  u7Teacher(run('T.numbers')===(level>=2),'numbers '+level);
  u7Teacher([1,2,3].every(n=>tab(n).getAttribute('aria-pressed')===String(n===level)),'exclusive pressed tab');
  u7Teacher(document.activeElement===tab(level),'focus restored after selection');
  // The list shows the numbered titles of this level in curriculum order, and the current one is pressed.
  const expected=config.questOrder.map((i,pos)=>[i,pos]).filter(([i])=>config.levelOf(i)===level);
  const rows=expected.map(([i,pos])=>buttonByText((pos+1)+'. '+config.quests[i].title[lang]));
  u7Teacher(rows.every(Boolean),lang+' quest rows level '+level);
  u7Teacher(rows.every((b,k)=>b.getAttribute('aria-pressed')===String(expected[k][0]===first)),'current quest highlighted');
  for(const [i,pos] of expected){buttonByText((pos+1)+'. '+config.quests[i].title[lang]).onclick();u7Teacher(portable.getQuest()===i,'quest list selects '+i);}
 }
 // Back to the student screen: same path as the teacher button in the student header.
 const resetsBefore=resets;click(w('toStudent'));
 u7Teacher(run('T.mode')==='student'&&resets===resetsBefore+1&&strip.hidden,lang+' back to student');
 run("TEACHER.mode('teacher')");
 // Playback: label and state follow the real play state; shortcuts are shown beside the buttons.
 playing=false;run('TEACHER.render()');
 u7Teacher(buttonByText(w('tcPlay')).getAttribute('aria-pressed')==='false'&&!buttonByText(w('tcPause')),'play label');
 click(w('tcPlay'));u7Teacher(playing===true&&!!buttonByText(w('tcPause'))&&!buttonByText(w('tcPlay')),'pause label after play');
 click(w('tcPause'));u7Teacher(playing===false,'pause again');
 u7Teacher(buttonByText(w('tcPlay')).dataset.key==='Space'&&buttonByText(w('tcFrame')).dataset.key==='.'&&buttonByText(w('reset')).dataset.key==='Esc','shortcut hints');
 click(w('tcSlow'));u7Teacher(run('T.slow')===true&&buttonByText(w('tcSlow')).getAttribute('aria-pressed')==='true','slow toggles');
 click(w('tcSlow'));
 // Layer chips: one per layer, shown by their words, pressed when on.
 run('TEACHER.layers([])');run('TEACHER.render()');
 const chips=config.layerOrder.map(name=>buttonByText(config.layerLabels[name][lang]));
 u7Teacher(chips.every(Boolean)&&new Set(chips).size===config.layerOrder.length,lang+' every layer has its own text chip');
 u7Teacher(chips.every(b=>b.getAttribute('aria-pressed')==='false'),'all layer chips off');
 chips[4].onclick();u7Teacher(enabled.has(config.layerOrder[4])&&buttonByText(config.layerLabels[config.layerOrder[4]][lang]).getAttribute('aria-pressed')==='true','chip turns layer on');
 click(w('tcStack'));u7Teacher(enabled.size===1&&enabled.has(config.layerOrder[0]),'stack starts from first layer');
 click(w('tcStack'));click(w('tcStack'));u7Teacher(enabled.size===3,'stack adds one layer per press');
 click(w('tcAllOff'));u7Teacher(enabled.size===0&&config.layerOrder.every(n=>buttonByText(config.layerLabels[n][lang]).getAttribute('aria-pressed')==='false'),'all off');
 // Compare, presenting tools, numbers.
 click(w('tcPin'));u7Teacher(run('T.ab')!==null&&buttonByText(w('tcPin')).getAttribute('aria-pressed')==='true','pin');
 click(w('tcUnpin'));u7Teacher(run('T.ab')===null&&buttonByText(w('tcPin')).getAttribute('aria-pressed')==='false','unpin');
 click(w('tcSpot'));click(w('tcLaser'));u7Teacher(run('T.spotlight&&T.laser')&&!run('spotMask.hidden')&&!run('laserCanvas.hidden'),'spotlight and laser on');
 click(w('tcSpot'));click(w('tcLaser'));
 run('T.numbers=false');click(w('tcNumbers'));
 u7Teacher(!numbers.hidden&&numbers.children.length===config.numbers.length,'numeric layer shown');
 const rows=numbers.children.map(row=>row.children.map(c=>c.textContent));
 u7Teacher(rows.every(([label,value],i)=>label===w(config.numbers[i].label)&&value===config.numbers[i].fn().toFixed(config.numbers[i].digits)+w(config.numbers[i].unit)),'numeric rows are label + value + unit');
 if(lang==='ko')u7Teacher(JSON.stringify(rows.map(r=>r[0]))===JSON.stringify(['아이 수','공룡 무게','아이 팀이 당기는 힘','공룡이 버티는 힘','체중 비'])&&rows[0][1]==='1명'&&rows[1][1].endsWith(' kg')&&rows[2][1].endsWith(' N')&&rows[4][1].endsWith('배'),'Korean numeric words and units');
 else u7Teacher(rows.every(r=>!hangul.test(r.join(' '))),'English numeric words');
 click(w('tcNumbers'));u7Teacher(numbers.hidden,'numeric layer hidden');
 // Experiment controls: the teacher panel draws the quest's own control rows with the student's words and handlers.
 teacherControls(lang);
 // Camera lane: the panel width becomes the right reserve, a drawer becomes the bottom reserve.
 strip.rect={left:860,top:12,right:1188,bottom:738,width:328,height:726};run('TEACHER.update(0)');
 u7Teacher(rootStyle['--hud-right']==='340px'&&rootStyle['--hud-bottom']==='12px'&&rootStyle['--hud-top']==='12px','side panel reserves right lane');
 strip.rect={left:8,top:450,right:1192,bottom:742,width:1184,height:292};run('TEACHER.update(0)');
 u7Teacher(rootStyle['--hud-right']==='0px'&&rootStyle['--hud-bottom']==='308px','drawer reserves bottom lane');
 strip.rect=undefined;
 // Class prediction: question, text answer cards, close button, and "예상 / 실제" result line.
 real('TEACHER_CFG.selectQuest(7)');portable.predict=config.predict.bind(config);
 click(w('tcPredict'));u7Teacher(!panel.hidden,'class panel opens');
 const ask=real('MISSION[7].ask')[lang];
 u7Teacher(panel.querySelectorAll('h2')[0].textContent===ask,lang+' class question');
 const cards=panel.querySelectorAll('button').filter(b=>b.dataset.choice!==undefined);
 const answers={ko:['왼쪽 팀이 이긴다','비긴다(깃발이 멈춘다)','오른쪽 팀이 이긴다'],en:real('QUESTS[7].candidates').map(c=>c.label.en)}[lang];
 u7Teacher(cards.length===3&&cards.every((b,i)=>b.textContent===answers[i]),lang+' class answer labels');
 u7Teacher(!!panel.querySelectorAll('button').find(b=>b.textContent===w('tcClose')),'close button text');
 cards[1].onclick();
 const summary=panel.all().find(e=>e.className==='class-summary');
 u7Teacher(summary.textContent.startsWith(w('tcPredicted')+': '+answers[1]+' / '+w('actual')+': '),lang+' prediction vs actual line');
 u7Teacher(panel.querySelector('.class-result')!==undefined,'result picture');
 click(w('tcClose'),panel);u7Teacher(panel.hidden,'close prediction');
}
for(const [name,label] of Object.entries(config.layerLabels))u7Teacher(typeof label.en==='string'&&label.en.trim()&&!/[가-힣]/.test(label.en),'English layer label '+name);
for(const [key,label] of Object.entries(config.words))if(label.en!==undefined)u7Teacher(typeof label.en==='string'&&label.en.trim()&&!/[가-힣]/.test(label.en),'English word '+key);
// Guide sections must be parallel, ordered, closed and share the actual concept sentences.
const guide=read('guide.html');
for(const lang of ['ko','en']){
 const section=guide.split(`<div class="lang-${lang}" lang="${lang}">`)[1]?.split('</div>')[0];
 u7Teacher(!!section,lang+' guide section');
 for(const token of ['N1','N2','N3','N4','N5','고시 원문 확인 필요','4과01-01','9과05-01','3-PS2-1','MS-PS2-2','MS-PS2-1','0.8','1.5','DeStefano'])u7Teacher(section.includes(token),lang+' guide '+token);
 const order=[...section.matchAll(/<article><h3>([NQ]\d)/g)].map(m=>m[1]);
 u7Teacher(JSON.stringify(order)===JSON.stringify(['N1','N2','Q1','Q2','Q4','N3','N4','N5','Q5','Q3','Q6','Q7']),lang+' teaching order');
 for(const concept of real('CONCEPTS'))u7Teacher(section.includes(concept[lang]),lang+' exact concept '+concept.id);
}
for(const tag of ['article','h1','h2','h3','dl','dt','dd','table','thead','tbody','tr','th','td','div','p','ul','ol','li','blockquote'])u7Teacher((guide.match(new RegExp('<'+tag+'(?:\\s[^>]*)?>','g'))||[]).length===(guide.match(new RegExp('</'+tag+'>','g'))||[]).length,'closed '+tag);
// Also validate nesting, rather than only matching tag totals.
const stack=[],voidTags=new Set(['meta','link','br','hr','img','input']);
for(const match of guide.replace(/<script>[\s\S]*?<\/script>|<style>[\s\S]*?<\/style>/g,'').matchAll(/<(\/?)([a-z][a-z0-9]*)\b[^>]*>/gi)){
 const [,close,tag]=match;
 if(voidTags.has(tag))continue;
 if(close)u7Teacher(stack.pop()===tag,'nested '+tag);else stack.push(tag);
}
u7Teacher(stack.length===0,'all tags closed');
console.log(`U7 teacher/guide: passed ${u7TeacherChecks}, failed 0 (native button/focus boundaries simulated)`);

// U8: click the rendered button, run the real download boundary, inspect the file.
let u8TeacherChecks=0,exportCalls=0,clicks=0,removed=0,revoked=0,externalCalls=0;
const u8Teacher=(ok,label)=>{assert(ok,'U8 teacher: '+label);u8TeacherChecks++;};
const downloads=[];
const forbidden=()=>{externalCalls++;throw Error('external persistence or network');};
definitions.Blob=class {constructor(parts,options){this.parts=parts;this.type=options.type;}};
definitions.URL={createObjectURL(blob){downloads.push({blob});return 'blob:test';},revokeObjectURL(url){assert.equal(url,'blob:test');revoked++;}};
definitions.setTimeout=fn=>fn();
definitions.fetch=forbidden;definitions.XMLHttpRequest=forbidden;definitions.navigator={sendBeacon:forbidden};
definitions.localStorage={setItem:forbidden,getItem:forbidden,removeItem:forbidden,clear:forbidden};
const makeElement=definitions.hostCreate;definitions.hostCreate=tag=>tag==='a'?{click(){definitions.onDownload(this);},remove(){definitions.onRemove();}}:makeElement(tag);real('document.body={append(){}}');
definitions.onDownload=a=>{clicks++;Object.assign(downloads.at(-1),{filename:a.download,href:a.href});};
definitions.onRemove=()=>removed++;
real("bridge.mode='student';QUEST.auto(7)");
portable.exportLog=()=>{exportCalls++;config.exportLog();};
for(const [lang,label] of [['ko','기록 저장(JSON)'],['en','Save log (JSON)']]){
 portable.language=lang;run("TEACHER.mode('teacher')");
 const buttons=strip.querySelectorAll('button'),button=buttons.find(b=>b.textContent===label);
 u8Teacher(!!button&&buttons.at(-1)===button,lang+' export last in strip');
 const before=exportCalls;button.onclick();
 u8Teacher(exportCalls===before+1&&clicks===exportCalls,'one download per click');
 const {blob,filename,href}=downloads.at(-1),payload=JSON.parse(blob.parts.join(''));
 u8Teacher(filename==='dino-tug-log.json'&&href==='blob:test'&&blob.type==='application/json','download name and MIME');
 u8Teacher(JSON.stringify(Object.keys(payload))===JSON.stringify(['app','version','exportedAt','entries'])&&payload.app==='dino-tug'&&payload.version===1,'envelope');
 u8Teacher(new Date(payload.exportedAt).toISOString()===payload.exportedAt,'ISO timestamp');
 u8Teacher(JSON.stringify(payload.entries)===real('JSON.stringify(QUEST.log())'),'actual log entries');
}
u8Teacher(externalCalls===0,'no storage or network calls');
u8Teacher(removed===2&&revoked===2,'anchors and object URLs released');
real('TEACHER_CFG.reset()');
u8Teacher(real('Q.predict.length===0&&Q.explain.length===0&&QUEST.log().length===0'),'actual reset clears both sources and log');
console.log(`U8 teacher export/reset: passed ${u8TeacherChecks}, failed 0`);
