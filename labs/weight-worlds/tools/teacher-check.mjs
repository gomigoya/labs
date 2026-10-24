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
  for (const m of source.matchAll(/<(?:div|span|button|p|h[1-6])\b[^>]*>([^<>]+)</g)) if (!m[1].includes('${') && !/[;{}]/.test(m[1])) assert(!/[\p{L}]/u.test(m[1]), `visible literal: ${m[1]}`);
}
const body = teacher.slice(teacher.indexOf('const T ='));
assert(!/\b(?:PHYS|GRAMMAR|QUESTS|QUEST|CARDS|SHOTS|MOON|OCEAN|RV|Q)\b/.test(body + attract), 'lab binding escaped TEACHER_CFG');
assert.equal((read('src/68-director.js').match(/T\.slow\s*\?\s*0\.25/g) || []).length, 1);
console.log('PASS: all source syntax; no random, emoji, raster/text API or visible literal words; generic boundary; one slow multiplier');

const definitions = vm.createContext({ console });
// Load the actual lab adapter with scene/DOM boundaries stubbed.
const cfg=teacher.slice(0,teacher.indexOf('const T ='));
vm.runInContext(read('src/15-physics.js')+read('src/66-cards.js')+read('src/65-quests.js')+`
const SHOTS=Array.from({length:6},(_,i)=>({name:String(i)})),SHOTS_VERTICAL=SHOTS.slice(0,3);
const LANG='ko',icon=()=>'',layer=()=>{},questUI=()=>{},flyTo=()=>{};
const S={body:{value:0,target:0},nWeights:{value:5,target:5},t:{value:0,target:0},playing:{value:0,target:0},sound:{value:0,target:0},layers:{},runId:0};
const GRAMMAR={LAYERS:['무게 크기','천체 변경','질량 불변','추 개수와 무게 비례','계측 한계','점프 비교','중력 방향','시험 기록','양의 관계'],enabled:{},set(v){Object.assign(this.enabled,v);},unpin(){this.baseline=null;},pin(){this.baseline=PHYS.grammarState(Math.round(S.body.value),Math.round(S.nWeights.value));},resetRecords(){},update(){}};
const DIRECTOR={clock:0,clear(){},intro(){}};
const controls={enabled:true};const A={active:false};const T={ab:null};
const TEACHER={layers(names){for(const n of TEACHER_CFG.layerOrder)layer(n,names.includes(n));}};
function set(name,value){const target=(name==='body'||name==='nWeights')?Math.round(value):value;if((name==='body'||name==='nWeights')&&S[name].target!==target){S.trial=null;S.playing.value=S.playing.target=0;S.t.value=S.t.target=0;}S[name].target=target;}
function shot(){} function syncUI(){} function updateHero(){}
function preset(){S.body.value=S.body.target=0;S.nWeights.value=S.nWeights.target=5;}
function runTrial(){S.trial=PHYS.jumpTrial(S.body.target,S.nWeights.target,++S.runId);S.t.value=S.t.target=0;S.playing.value=S.playing.target=1;QUEST.trial(S.trial);}

`+cfg,definitions);
const config = vm.runInContext('TEACHER_CFG', definitions);
vm.runInContext(`const bridge={mode:'student'};TEACHER_CFG.bindMode(bridge);Q.free=true;`, definitions);
assert.equal(vm.runInContext('bridge.mode', definitions), 'free');
vm.runInContext(`bridge.mode='teacher';Q.free=false;`, definitions);
assert.equal(vm.runInContext('Q.free && bridge.mode === "teacher"', definitions), true);
const actual = new Set([...read('src/45-grammar.js').match(/const defaults = Object.freeze\(\{([\s\S]*?)\}\)/)[1].matchAll(/'([^']+)':/g)].map(m=>m[1]));
for(const m of read('src/70-loop.js').match(/const layers=\{([^}]+)/)[1].matchAll(/(\w+):/g))actual.add(m[1]);
actual.delete('room');
assert.deepEqual([...actual].sort(),[...config.layerOrder].sort());
const original=fs.readFileSync(new URL('../../moon-closer/src/80-teacher.js',import.meta.url),'utf8');
assert.equal(body,original.slice(original.indexOf('const T =')),'portable teacher changed');
assert.equal(attract,fs.readFileSync(new URL('../../moon-closer/src/85-attract.js',import.meta.url),'utf8'),'portable attract changed');
assert(new Set(config.layerOrder.map(n=>config.layerIcons[n])).size===config.layerOrder.length);
assert.equal(new Set(config.layerOrder).size, config.layerOrder.length);
assert(!config.layerOrder.includes('room'));
for (const name of config.layerOrder) {
  assert(actual.has(name), `unknown layer: ${name}`); assert(config.layerIcons[name]);
  assert(config.layerLabels[name].ko && config.layerLabels[name].en);
}
assert.equal(config.quests.length, 7); assert.equal(config.verticalShots.length, 3);
for (const row of config.attract) {
  assert(Number.isFinite(row.closer) && row.seconds > 0 && config.shots[row.shot]);
  for (const name of row.layers) assert(config.layerOrder.includes(name));
}
for (const row of config.numbers) assert(Number.isFinite(row.fn()) && /^(km|m|s|h|°|×|kg|N|m\/s²)$/.test(row.unit));
console.log(`PASS: TEACHER_CFG ${config.layerOrder.length} actual layers, 7 quests, 3 vertical shots, ${config.attract.length} stages, ${config.numbers.length} PHYS numeric rows`);

for(let i=0;i<7;i++){
  vm.runInContext(`T.ab={closer:0};TEACHER_CFG.selectQuest(${i});TEACHER_CFG.predict(true);TEACHER_CFG.predict(false,0);TEACHER_CFG.predict(false,null,3);`,definitions);
  assert.equal(vm.runInContext('Q.phase',definitions),'confirm');
  assert.equal(vm.runInContext('T.ab',definitions),null,'quest shortcut clears pin marker');
  assert.equal(vm.runInContext('Q.completed.size',definitions),0,'teacher prediction must not award completion');
  const expected=[1,1,6,7,1,8,4][i];
  assert.equal(vm.runInContext('S.body.target',definitions),expected);
}
vm.runInContext('TEACHER_CFG.ghost({closer:4});',definitions);
assert.equal(vm.runInContext('GRAMMAR.baseline.i',definitions),4);
vm.runInContext("TEACHER_CFG.ghost(null);TEACHER_CFG.frameKey='stale';TEACHER_CFG.reset();",definitions);
assert.equal(vm.runInContext('GRAMMAR.baseline',definitions),null);
assert.equal(vm.runInContext('S.body.target',definitions),0);
assert.equal(vm.runInContext('TEACHER_CFG.frameKey',definitions),'','reset invalidates teacher framing');
for(let i=0;i<10;i++)for(let n=1;n<=5;n++){
 vm.runInContext(`S.body.value=${i};S.nWeights.value=${n}`,definitions);
 for(const row of config.numbers)assert(Number.isFinite(row.fn()));
}
vm.runInContext('A.active=true;TEACHER_CFG.play(true);TEACHER_CFG.setCloser(PHYS.C.ids.moon,true);',definitions);
assert.equal(vm.runInContext('S.playing.target',definitions),1,'attract world changes must preserve animation');
assert.equal(vm.runInContext('S.trial.i',definitions),1);
vm.runInContext('A.active=false',definitions);
console.log('PASS: real CFG seven prediction outcomes, no teacher awards, pin/unpin, reset and 50 numeric conditions');

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
let content = '12.50 N', numeric = true, mission = false;
const auditContext = vm.createContext({ T: { mode: 'teacher', numbers: true }, NodeFilter: { SHOW_TEXT: 4 }, innerWidth: 1000, innerHeight: 1000,
  getComputedStyle: () => ({ visibility: 'visible', display: 'block', opacity: '1' }),
  document: { body: {}, createRange: () => ({ selectNodeContents() {}, getBoundingClientRect: () => ({ width: 50, height: 20, x: 1, y: 1, top: 1, bottom: 21, left: 1, right: 51 }) }),
    createTreeWalker: () => { let seen = false; return { nextNode() { if (seen) return false; seen = true; return true; },
      get currentNode() { return { textContent: content, parentElement: { closest: selector => (selector === '[data-numeric]' && numeric) || (selector.includes('#mission[data-mission]') && mission) ? {} : null } }; } }; } } });
vm.runInContext(read('src/60-interaction-hud.js').split('const qPictures=')[0].slice(read('src/60-interaction-hud.js').indexOf('function textAudit()')), auditContext);
const audit = () => vm.runInContext('textAudit()', auditContext);
for(const unit of ['N','kg','m/s²','×']){content=`12.50 ${unit}`;assert.equal(audit().length,0);}
assert.equal(audit().length, 0); content = '12 moons'; assert.equal(audit().length, 1);
content = '12 km'; vm.runInContext('T.numbers=false', auditContext); assert.equal(audit().length, 1);
numeric = false; content = '7'; assert.equal(audit().length, 1);
mission = true; content = '마음대로 만져 보세요'; assert.equal(audit().length, 0);
mission = false; assert.equal(audit().length, 1);
console.log('PASS: textAudit accepts enabled teacher numeric units and the mission only; rejects other words and unmarked numbers');
console.log('NOT RUN: WebGL rendering, browser events/focus, contrast, target geometry, portrait occlusion, thumbnail pixels, screenshots. Run tools/capture.mjs on the browser host.');
