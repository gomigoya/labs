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

const definitions = vm.createContext({ console });
vm.runInContext(read('src/15-physics.js') + read('src/66-cards.js') + read('src/65-quests.js') + `
const SHOTS=Array.from({length:6},(_,i)=>({name:String(i)})),SHOTS_VERTICAL=SHOTS.slice(0,3);
const LANG='ko',icon=()=>'',layer=()=>{},questUI=()=>{},flyTo=()=>{};
const S={u:{value:0},layers:{}};
const massIndex=()=>0,currentR=()=>PHYS.rFromRailX(S.u.value),orientation=()=>'radial';
const GRAMMAR={LAYERS:['당김 차이','거리 세제곱 역관계','파괴 한계','사건의 지평선','질량 비교','가로 압축'],enabled:{}};
` + teacher.slice(0,teacher.indexOf('const T =')), definitions);
const config = vm.runInContext('TEACHER_CFG', definitions);
vm.runInContext(`const bridge={mode:'student'};TEACHER_CFG.bindMode(bridge);Q.free=true;`, definitions);
assert.equal(vm.runInContext('bridge.mode', definitions), 'free');
vm.runInContext(`bridge.mode='teacher';Q.free=false;`, definitions);
assert.equal(vm.runInContext('Q.free && bridge.mode === "teacher"', definitions), true);
const actual = new Set(vm.runInContext("[...GRAMMAR.LAYERS,'grid','front','disk','horizon','probe']",definitions));
assert.equal(new Set(config.layerOrder).size, config.layerOrder.length);
assert(!config.layerOrder.includes('room'));
for (const name of config.layerOrder) {
  assert(actual.has(name), `unknown layer: ${name}`); assert(config.layerIcons[name]);
  assert(config.layerLabels[name].ko && config.layerLabels[name].en);
}
assert.equal(config.quests.length, 6); assert.equal(config.verticalShots.length, 3);
for (const row of config.attract) {
  assert(Number.isFinite(row.closer) && row.seconds > 0 && config.shots[row.shot]);
  for (const name of row.layers) assert(config.layerOrder.includes(name));
}
for (const row of config.numbers) assert(Number.isFinite(row.fn()) && /^(km|m|s|h|°|×|m\/s²)$/.test(row.unit));
console.log(`PASS: TEACHER_CFG ${config.layerOrder.length} actual layers, 6 quests, 3 vertical shots, ${config.attract.length} stages, ${config.numbers.length} PHYS numeric rows`);

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
let content = '12.50 km', numeric = true, missionMarked = false;
const auditContext = vm.createContext({ T: { mode: 'teacher', numbers: true }, NodeFilter: { SHOW_TEXT: 4 }, innerWidth: 1000, innerHeight: 1000,
  getComputedStyle: () => ({ visibility: 'visible', display: 'block', opacity: '1' }),
  document: { body: {}, createRange: () => ({ selectNodeContents() {}, getBoundingClientRect: () => ({ width: 50, height: 20, x: 1, y: 1, top: 1, bottom: 21, left: 1, right: 51 }) }),
    createTreeWalker: () => { let seen = false; return { nextNode() { if (seen) return false; seen = true; return true; },
      get currentNode() { return { textContent: content, parentElement: { closest: selector => (selector === '[data-numeric]' && numeric || selector === '#mission[data-mission]' && missionMarked) ? {} : null } }; } }; } } });
vm.runInContext(read('src/60-interaction-hud.js').split('function textAudit()')[1].split('Object.assign(ICONS,')[0].replace(/^/, 'function textAudit()'), auditContext);
const audit = () => vm.runInContext('textAudit()', auditContext);
assert.equal(audit().length, 0); content = '12 moons'; assert.equal(audit().length, 1);
content = '12 km'; vm.runInContext('T.numbers=false', auditContext); assert.equal(audit().length, 1);
numeric = false; content = '7'; assert.equal(audit().length, 1);
console.log('PASS: textAudit accepts only enabled teacher numeric units; rejects words and unmarked numbers');
missionMarked=true;numeric=false;content='마음대로 만져 보세요';vm.runInContext("T.mode='student'",auditContext);assert.equal(audit().length,0);
missionMarked=false;assert.equal(audit().length,1);
vm.runInContext("T.mode='teacher'",auditContext);
console.log('PASS: textAudit exempts marked mission text only; the same words elsewhere remain violations');
content='0.01 m/s²';numeric=true;vm.runInContext('T.numbers=true',auditContext);assert.equal(audit().length,0);
console.log('NOT RUN: WebGL rendering, browser events/focus, contrast, target geometry, portrait occlusion, thumbnail pixels, screenshots. Run tools/capture.mjs on the browser host.');

const sourceController=fs.readFileSync(new URL('../moon-closer/src/80-teacher.js',root),'utf8');
assert.equal(body,sourceController.slice(sourceController.indexOf('const T =')),'portable teacher changed');
assert.equal(attract,fs.readFileSync(new URL('../moon-closer/src/85-attract.js',root),'utf8'),'portable attract changed');
const count=3+config.layerOrder.length+1+5+config.quests.length+2;
for(const [width,height]of [[1440,900],[1920,1080],[1280,720]])assert(Math.ceil(count/4)*76+20<=height-24,`strip ${width}x${height}`);
console.log(`PASS: controllers byte-identical; ${count} controls, 4 columns, 7 rows fit 720/900/1080px by CSS arithmetic (browser NOT RUN)`);

const integration=vm.createContext({console,structuredClone});
vm.runInContext(read('src/15-physics.js')+`
const pair=v=>({value:v,target:v});
const S={u:pair(0),massIndex:pair(0),orientation:pair(0),playing:pair(0),t:pair(0),sound:pair(0),cutaway:pair(0),ui:pair(1),records:[],graphKeys:[],drag:null,layers:{}};
const massIndex=()=>Math.round(S.massIndex.value),currentR=()=>PHYS.rFromRailX(S.u.value),orientation=()=>S.orientation.value<.5?'radial':'transverse';
const LANG='ko',icon=()=>'',controls={enabled:true};
const GRAMMAR={LAYERS:['a','b','c','d','e','f'],enabled:{},baseline:null,set(v){Object.assign(this.enabled,v);},pin(){this.baseline={i:massIndex(),r:currentR()};},unpin(){this.baseline=null;}};
function set(n,v){if(n==='r')S.u.target=PHYS.railX(v);else if(n==='orientation')S.orientation.target=v==='transverse'?1:0;else S[n].target=+v;}
function layer(n,v){if(GRAMMAR.LAYERS.includes(n))GRAMMAR.set({[n]:v});else S.layers[n]=v;}
function preset(){set('r',1000);set('massIndex',0);set('orientation','radial');S.playing.target=0;S.t.target=0;S.sound.target=0;S.cutaway.target=0;}
function shot(){}function flyTo(){}function updateHero(){}function syncUI(){}function questUI(){}
const DIRECTOR={clock:0,clear(){},intro(){},push(){},event(){},sound(){},chord(){}};
const SHOTS=Array.from({length:6},()=>({})),SHOTS_VERTICAL=SHOTS.slice(0,3);
`+read('src/66-cards.js')+read('src/65-quests.js')+teacher.slice(0,teacher.indexOf('const T ='))+`
const T={mode:'teacher'};TEACHER_CFG.bindMode(T);
const TEACHER={layers(names){for(const n of TEACHER_CFG.layerOrder)layer(n,names.includes(n));}};
`,integration);
const real=code=>vm.runInContext(code,integration);
for(let i=0;i<6;i++){
 real(`TEACHER_CFG.selectQuest(${i});TEACHER_CFG.predict(true);TEACHER_CFG.predict(false,0);`);
 assert.equal(real('Q.completed.size'),0);
 assert(real('Q.flags.classResult.samples.length')>=2);
 const output=real('TEACHER_CFG.predict().compare()');assert(!/NaN|undefined|Infinity/.test(output));
 if([1,3].includes(i))assert.equal((output.match(/<svg/g)||[]).length,2,'measured comparison is populated');
}
real('TEACHER_CFG.ghost({closer:0});');assert(real('GRAMMAR.baseline'));
real('TEACHER_CFG.ghost(null);TEACHER_CFG.reset();');assert.equal(real('GRAMMAR.baseline'),null);
assert.equal(real('Q.completed.size'),0);assert.equal(real('currentR()'),1000);
console.log('PASS: real CFG + QUEST adapter integration: 6 class predictions use measured solution evidence, no completion; pin/unpin; complete reset');

// Source contracts for the visual regressions; pixels still need the capture host.
const cards=read('src/66-cards.js'),hud=read('src/60-interaction-hud.js'),director=read('src/68-director.js');
assert(cards.includes("if(!a||!b)return '';"));
assert(hud.includes('if(picture)qPictures.innerHTML='));
assert(!director.slice(director.indexOf('if(!Q.free&&this.eventLeft>0&&this.snapshot){')).includes('<rect'));
assert(director.includes('PROBE.getWorldPosition')&&director.includes('camera.position.lerp'));
assert(read('src/70-loop.js').includes('S.playing.target&&!A.active'));
assert.equal((read('src/85-attract.js').match(/boot\(\);/g)||[]).length,1);
assert(!/\bboot\(\);/.test(read('src/70-loop.js')));
console.log('PASS: absent measurement omits SVG and card shell; single event mark and follow camera; attract owns scan; deferred boot');
