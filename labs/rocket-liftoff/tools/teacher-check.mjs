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
  assert(!/Math\.random|<text\b|fillText\s*\(|<img\b/.test(source), `${name}: prohibited visual API`);
  // The requested plain play glyph is a Unicode pictograph too; it is not an emoji asset.
  assert(!/\p{Extended_Pictographic}/u.test(source.replace(/▶/g,'')), `${name}: emoji`);
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
const cfg=teacher.slice(0,teacher.indexOf('const T ='));
vm.runInContext(read('src/15-physics.js')+`
const S={engines:{value:0,target:0},load:{value:0,target:0},g:{value:0,target:0},t:{value:0,target:0},ignited:{value:0,target:0},layers:{}};
const GRAMMAR={${read('src/45-grammar.js').match(/const LAYERS=[^;]+;/)[0].replace('const LAYERS=','LAYERS:').replace(/;$/,',')}enabled:{}};
const Q={free:false};
const QUESTS=Array.from({length:6},(_,i)=>({icon:['fuel','engines','height','load2','moon','rocket'][i]}));
const SHOTS=Array.from({length:6},(_,i)=>({name:String(i)})),SHOTS_VERTICAL=SHOTS.slice(0,3);
const LANG='ko',icon=()=>'',layer=()=>{},questUI=()=>{};
const layerLabels=Array.from({length:8},()=>({ko:'표현',en:'Layer'}));
function selection(){return PHYS.sceneSelection(S.engines.value,S.load.value,S.g.value);}
`+cfg,definitions);
const config=vm.runInContext('TEACHER_CFG',definitions);
vm.runInContext(`const bridge={mode:'student'};TEACHER_CFG.bindMode(bridge);Q.free=true;`,definitions);
assert.equal(vm.runInContext('bridge.mode',definitions),'free');
vm.runInContext(`bridge.mode='teacher';Q.free=false;`,definitions);
assert.equal(vm.runInContext('Q.free && bridge.mode === "teacher"',definitions),true);
const actual=vm.runInContext(`new Set([...GRAMMAR.LAYERS,'console','hero','rocket','fuel'])`,definitions);
assert.equal(new Set(config.layerOrder).size,actual.size);
for(const name of config.layerOrder){assert(actual.has(name),name);assert(config.layerIcons[name]);assert(config.layerLabels[name].ko&&config.layerLabels[name].en);}
assert.equal(config.quests.length,6);assert.equal(config.verticalShots.length,3);
for(const row of config.attract){assert(Number.isFinite(row.closer)&&row.seconds>0&&config.shots[row.shot]);for(const name of row.layers)assert(actual.has(name));}
for(const row of config.numbers)assert(Number.isFinite(row.fn())&&/^(kg|N|m\/s²|km|m|s|h|°|×)$/.test(row.unit));
const original=fs.readFileSync(new URL('../../moon-closer/src/80-teacher.js',import.meta.url),'utf8');
assert.equal(body.replace(/\r\n/g,'\n'),original.slice(original.indexOf('const T =')).replace(/\r\n/g,'\n'),'portable teacher source changed');
assert.equal(attract.replace(/\r\n/g,'\n'),fs.readFileSync(new URL('../../moon-closer/src/85-attract.js',import.meta.url),'utf8').replace(/\r\n/g,'\n'),'portable attract source changed');
const buttonCount=3+config.layerOrder.length+1+5+6+2,rows=Math.ceil(buttonCount/4),stripHeight=rows*72+(rows-1)*4+16;
for(const [w,h]of [[1440,900],[1920,1080],[1280,720]])assert(stripHeight<=h-24,`${w}x${h} strip`);
const css=read('src/00-head.html');assert(css.includes('grid-template-columns:repeat(4,72px)'));
console.log(`PASS: exact portable copies; ${config.layerOrder.length} layers, 6 quests, 3 stages, 6 numeric rows; ${buttonCount} targets / ${rows} rows / ${stripHeight}px fit all three desktop sizes (CSS model, not browser)`);

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
let content = '12.50 km', numeric = true, mission = false;
const auditContext = vm.createContext({ T: { mode: 'teacher', numbers: true }, NodeFilter: { SHOW_TEXT: 4 }, innerWidth: 1000, innerHeight: 1000,
  getComputedStyle: () => ({ visibility: 'visible', display: 'block', opacity: '1' }),
  document: { body: {}, createRange: () => ({ selectNodeContents() {}, getBoundingClientRect: () => ({ width: 50, height: 20, x: 1, y: 1, top: 1, bottom: 21, left: 1, right: 51 }) }),
    createTreeWalker: () => { let seen = false; return { nextNode() { if (seen) return false; seen = true; return true; },
      get currentNode() { return { textContent: content, parentElement: { closest: selector => (selector === '[data-numeric]' && numeric)||(selector === '#mission[data-mission]' && mission) ? {} : null } }; } }; } } });
vm.runInContext(read('src/60-interaction-hud.js').slice(read('src/60-interaction-hud.js').indexOf('function textAudit()'),read('src/60-interaction-hud.js').indexOf('Object.assign(LABELS,')), auditContext);
const audit = () => vm.runInContext('textAudit()', auditContext);
assert.equal(audit().length, 0); content='12 kg';assert.equal(audit().length,0);content='12 N';assert.equal(audit().length,0);content='12 m/s²';assert.equal(audit().length,0);content = '12 moons'; assert.equal(audit().length, 1);
content = '12 km'; vm.runInContext('T.numbers=false', auditContext); assert.equal(audit().length, 1);
numeric = false; content = '7'; assert.equal(audit().length, 1);
console.log('PASS: textAudit accepts only enabled teacher numeric units; rejects words and unmarked numbers');
mission=true;content='마음대로 만져 보세요';assert.equal(audit().length,0);
mission=false;assert.equal(audit().length,1,'same Korean words outside the mission must remain violations');
console.log('PASS: textAudit exempts mission words only; identical unmarked words remain violations');
console.log('NOT RUN: WebGL rendering, browser events/focus, contrast, target geometry, portrait occlusion, thumbnail pixels, screenshots. Run tools/capture.mjs on the browser host.');
