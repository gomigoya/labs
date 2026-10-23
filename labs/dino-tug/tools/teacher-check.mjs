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
  assert(!/Math\.random|<text\b|fillText\s*\(|<img\b|\p{Extended_Pictographic}/u.test(source), `${name}: prohibited visual API`);
}
for (const source of [teacher, attract]) {
  assert(!/\.textContent\s*=\s*['"][^'"]*[\p{L}]/u.test(source), 'literal visible words');
  for (const m of source.matchAll(/>([^<>]+)</g)) if (!m[1].includes('${') && !/[;{}]/.test(m[1])) assert(!/[\p{L}]/u.test(m[1]), `visible literal: ${m[1]}`);
}
const body = teacher.slice(teacher.indexOf('const T ='));
assert(!/\b(?:PHYS|GRAMMAR|QUESTS|QUEST|CARDS|SHOTS|MOON|OCEAN|RV|Q)\b/.test(body + attract), 'lab binding escaped TEACHER_CFG');
assert.equal((read('src/68-director.js').match(/T\.slow\s*\?\s*0\.25/g) || []).length, 1);
console.log('PASS: all source syntax; no random, emoji, raster/text API or visible literal words; generic boundary; one slow multiplier');

const definitions=vm.createContext({console,structuredClone});
vm.runInContext(read('src/15-physics.js')+`
const SPECIES_KEYS=Object.keys(PHYS.SPECIES),GROUND_VALUES=Object.values(PHYS.GROUNDS);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));const pair=v=>({value:v,target:v});const S={u:pair(PHYS.railX(1)),species:pair(0),ground:pair(2),t:pair(0),playing:pair(0),cassette:pair(0),drag:null,vertical:false};
const controls={enabled:true};
const GRAMMAR={LAYERS:['marks','steps','limits','overlay','micro','traces','ratio','records'],enabled:{},set(v){Object.assign(this.enabled,v)},unpin(){},clearRecords(){},pin(){},record(){}};
const DIRECTOR={eventLeft:0,clear(){this.eventLeft=0},intro(){},push(){},event(){this.eventLeft=1.4},chord(){},time(dt){return dt*(this.eventLeft>0?.18:1)}};
const document={getElementById(){return {animate(){}}}};
function questUI(){} function syncUI(){} function shot(){}

function step(n=1,dt=1/60){if(n>120)throw Error('batch');for(let i=0;i<n;i++){S.u.value+=(S.u.target-S.u.value)*(1-Math.exp(-18*dt));if(Math.abs(S.u.value-S.u.target)<1e-8)S.u.value=S.u.target;QUEST.update(dt);DIRECTOR.eventLeft=Math.max(0,DIRECTOR.eventLeft-dt);}}
`+read('src/65-quests.js')+read('src/66-cards.js')+read('src/60-interaction-hud.js').slice(read('src/60-interaction-hud.js').indexOf('function set(name,v){'),read('src/60-interaction-hud.js').indexOf('const PRESETS')),definitions);

const grammarSource=read('src/45-grammar.js');
const defaultSource=grammarSource.slice(grammarSource.indexOf('const defaults ='),grammarSource.indexOf('  const LAYERS='));
vm.runInContext(defaultSource+`
GRAMMAR.LAYERS=Object.keys(defaults);GRAMMAR.defaults=defaults;
S.sound={value:0,target:0};S.ui={value:1,target:1};S.layers={};
const SHOTS=Array.from({length:6},(_,i)=>({name:String(i)})),SHOTS_VERTICAL=SHOTS.slice(0,3);
const LANG='ko',icon=()=>'',layer=(n,on)=>{S.layers[n]=on},updateHero=()=>{},endDrag=()=>{},flyTo=()=>{},scene={traverse(){}},camera={clearViewOffset(){},updateProjectionMatrix(){}};
`+teacher.slice(0,teacher.indexOf('const T =')),definitions);
const config=vm.runInContext('TEACHER_CFG',definitions);
const real=code=>vm.runInContext(code,definitions);
real(`const bridge={mode:'student'};TEACHER_CFG.bindMode(bridge);Q.free=true;`);
assert.equal(real('bridge.mode'),'free');real(`bridge.mode='teacher';Q.free=false;`);assert(real('Q.free'));
const actual=new Set(['hero','console','track','capacities',...real('GRAMMAR.LAYERS')]);
assert.deepEqual([...config.layerOrder].sort(),[...actual].sort());
for(const name of config.layerOrder){assert(config.layerIcons[name]);assert(config.layerLabels[name].ko&&config.layerLabels[name].en);assert(!config.quests.some(d=>d.icon===config.layerIcons[name]));}
assert.equal(config.quests.length,7);assert.equal(config.verticalShots.length,3);
for(const row of config.attract){assert(Number.isFinite(row.closer)&&row.seconds>0&&config.shots[row.shot]);for(const n of row.layers)assert(actual.has(n));}
for(const row of config.numbers)assert(Number.isFinite(row.fn())&&/^(km|kg|N|m|s|h|\u00b0|\u00d7)$/.test(row.unit));
real(`const TEACHER={layers(names){for(const name of TEACHER_CFG.layerOrder)TEACHER_CFG.setLayer(name,names.includes(name));}};`);
for(let i=0;i<7;i++){
 real(`TEACHER_CFG.selectQuest(${i});TEACHER_CFG.predict(true);TEACHER_CFG.predict(false,0);TEACHER_CFG.predict(false,null,3);`);
 assert.equal(real('Q.phase'),'confirm');assert.equal(real('Q.run'),0);assert.equal(real('Q.completed.size'),0);
 assert(real(`!/<text|NaN|Infinity|undefined/.test(TEACHER_CFG.predict().compare())`));
 if(i===3)assert.equal(real('Q.flags.classSample.observations.length'),2);
 if(i===4)assert.equal(real('Q.flags.classSample.after.n-Q.flags.classSample.before.n'),10);
}
console.log(`PASS: TEACHER_CFG ${config.layerOrder.length} actual layers, 7 quests, 3 vertical shots, ${config.attract.length} stages, ${config.numbers.length} PHYS numeric rows; seven real prediction adapters without awarding progress`);

let now = 0, closer = 0, playing = false, ui = true, resets = 0, starts = 0, busy = false;
const enabled = new Set();
class Element {
  constructor() { this.hidden = false; this.children = []; this.style = { setProperty() {} }; this.dataset = {}; this.attributes = {}; }
  append(...children) { this.children.push(...children); }
  replaceChildren() { this.children = []; }
  setAttribute(k, v) { this.attributes[k] = v; }
  querySelectorAll() { return []; }
  getContext() { return { clearRect() {} }; }
}
const listeners = {}, nodes = [];
const document = { body: new Element(), documentElement: new Element(),
  createElement() { const n = new Element(); nodes.push(n); return n; }, addEventListener() {} };
document.body.classList = { add() {}, remove() {}, toggle() {} };
const portable = { ...config, icon: () => '', language: 'ko',
  setLayer: (name, on) => on ? enabled.add(name) : enabled.delete(name), layerOn: name => enabled.has(name),
  getCloser: () => closer, setCloser: v => { closer = v; }, getPlaying: () => playing, play: on => { playing = on; },
  oneFrame() {}, ui: on => { ui = on; }, getUI: () => ui, fly() {}, selectShot() {}, shotForStage: row => row.shot,
  getQuest: () => 0, bindMode() {}, questMode() {}, selectQuest() {}, cardBusy: () => busy, refresh() {}, scale() {}, ghost() {},
  reset() { closer = 0; resets++; }, startStudent() { starts++; }, visibilityReset() {}, predict: () => ({ phase: 'act' }) };
const context = vm.createContext({ TEACHER_CFG: portable, S: {}, LABELS: {}, ICONS: {}, document,
  innerWidth: 1200, innerHeight: 750, performance: { now: () => now }, URLSearchParams, location: { search: '?idle=2' },
  window: { __lab: {}, addEventListener(name, fn) { (listeners[name] ||= []).push(fn); } }, boot() {} });
vm.runInContext(body + attract, context);
const run = code => vm.runInContext(code, context);
const labels = run('({...TEACHER_LABELS,...ATTRACT_LABELS})');
for (const [key, value] of Object.entries(labels)) assert(value.ko && value.en, key);
for (const command of Object.values(run('TEACHER_KEYS'))) assert(labels[command]?.ko && labels[command]?.en);
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
console.log(`PASS: ${Object.keys(labels).length} bilingual labels and all shortcuts; stacking, A/B alias, reset, idle exclusions/override, loop, wake, five-frame stall, onerror, exact T/A schemas`);

// Exercise the actual textAudit function with rendered-text boundaries stubbed.
let content = '12.50 km', numeric = true;
const auditContext = vm.createContext({ T: { mode: 'teacher', numbers: true }, NodeFilter: { SHOW_TEXT: 4 }, innerWidth: 1000, innerHeight: 1000,
  getComputedStyle: () => ({ visibility: 'visible', display: 'block', opacity: '1' }),
  document: { body: {}, createRange: () => ({ selectNodeContents() {}, getBoundingClientRect: () => ({ width: 50, height: 20, x: 1, y: 1, top: 1, bottom: 21, left: 1, right: 51 }) }),
    createTreeWalker: () => { let seen = false; return { nextNode() { if (seen) return false; seen = true; return true; },
      get currentNode() { return { textContent: content, parentElement: { closest: selector => selector === '[data-numeric]' && numeric ? {} : null } }; } }; } } });
vm.runInContext(read('src/60-interaction-hud.js').slice(read('src/60-interaction-hud.js').indexOf('function textAudit()'),read('src/60-interaction-hud.js').indexOf('// All quest UI')), auditContext);
const audit = () => vm.runInContext('textAudit()', auditContext);
assert.equal(audit().length, 0); content = '12 moons'; assert.equal(audit().length, 1);
content = '12 km'; vm.runInContext('T.numbers=false', auditContext); assert.equal(audit().length, 1);
numeric = false; content = '7'; assert.equal(audit().length, 1);
console.log('PASS: textAudit accepts only enabled teacher numeric units; rejects words and unmarked numbers');
console.log('NOT RUN: WebGL rendering, browser events/focus, contrast, target geometry, portrait occlusion, thumbnail pixels, screenshots. Run tools/capture.mjs on the browser host.');

assert.equal(body,fs.readFileSync(new URL('../moon-closer/src/80-teacher.js',root),'utf8').slice(fs.readFileSync(new URL('../moon-closer/src/80-teacher.js',root),'utf8').indexOf('const T =')));
assert.equal(attract,fs.readFileSync(new URL('../moon-closer/src/85-attract.js',root),'utf8'));
console.log('PASS: portable teacher controller and attract are byte-for-byte source copies');

// Run the real reset adapter with only rendering boundaries stubbed.
const hud=read('src/60-interaction-hud.js');
real(hud.slice(hud.indexOf('const PRESETS='),hud.indexOf('function textAudit()')));
real(`GRAMMAR.update=()=>{};Q.completed.add(3);Q.stars[3]=3;Q.run=9;Q.results=[{}];TEACHER_CFG.reset();`);
assert.equal(real('Q.completed.size'),0);assert.equal(real('Q.run'),0);
assert.equal(real('Q.results.length'),0);assert(real('Q.stars.every(n=>n===0)'));
assert.equal(real('PHYS.kidsFromRailX(S.u.value)'),1);
real('TEACHER_CFG.refresh()');assert(real('S.layers.hero&&S.layers.console&&S.layers.track'));
console.log('PASS: actual reset clears runs, stars, results and restores the starting team and base apparatus');

vm.runInContext('T.numbers=true',auditContext);numeric=true;
for(const value of ['70.00 kg','137.34 N','0.05 ×']){content=value;assert.equal(audit().length,0);}
content='12 Pa';assert.equal(audit().length,1);
console.log('PASS: numeric audit accepts kg, N and dimensionless ×; rejects unapproved units');

const css=read('src/00-head.html');
assert(css.includes('grid-template-columns:repeat(4,72px)')&&css.includes('.teacher-grid{display:contents}'));
const buttons=3+config.layerOrder.length+1+5+config.quests.length+2,rows=Math.ceil(buttons/4);
const assumedHeight=rows*72+(rows-1)*2+14+4;
for(const height of [720,900,1080])assert(assumedHeight<=height-24);
console.log(`PASS: analytic toolbar ${buttons} buttons / ${rows} rows / ${assumedHeight}px fits 720, 900, 1080 heights (CSS assumptions, not browser measurements)`);
