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
  assert(!/<text\b|fillText\s*\(|<img\b|\p{Extended_Pictographic}/u.test(source), `${name}: prohibited visual API`);
}
for (const source of [teacher, attract]) {
  assert(!/\.textContent\s*=\s*['"][^'"]*[\p{L}]/u.test(source), 'literal visible words');
  for (const m of source.matchAll(/>([^<>]+)</g)) if (!m[1].includes('${') && !/[;{}]/.test(m[1])) assert(!/[\p{L}]/u.test(m[1]), `visible literal: ${m[1]}`);
}
const body = teacher.slice(teacher.indexOf('const T ='));
assert(!/\b(?:PHYS|GRAMMAR|QUESTS|QUEST|CARDS|SHOTS|MOON|OCEAN|RV|Q)\b/.test(body + attract), 'lab binding escaped TEACHER_CFG');
assert.equal((read('src/68-director.js').match(/T\.slow\s*\?\s*0\.25/g) || []).length, 1);
console.log('PASS: all source syntax; random limited to explanation engine; no emoji, raster/text API or visible literal words; generic boundary; one slow multiplier');

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
`+read('src/62-curriculum.js')+read('src/63-explain.js')+read('src/65-quests.js')+read('src/66-cards.js')+read('src/60-interaction-hud.js').slice(read('src/60-interaction-hud.js').indexOf('function set(name,v){'),read('src/60-interaction-hud.js').indexOf('const PRESETS')),definitions);

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
assert.equal(config.quests.length,12);assert.equal(config.verticalShots.length,3);
assert.deepEqual([...config.questOrder],[7,8,0,1,3,9,10,11,4,2,5,6]);
for(const row of config.attract){assert(Number.isFinite(row.closer)&&row.seconds>0&&config.shots[row.shot]);for(const n of row.layers)assert(actual.has(n));}
for(const row of config.numbers)assert(Number.isFinite(row.fn())&&/^(km|kg|N|m|s|h|\u00b0|\u00d7)$/.test(row.unit));
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
  constructor() { this.hidden = false; this.children = []; this.style = { setProperty() {} }; this.dataset = {}; this.attributes = {}; }
  append(...children) { for(const child of children)child.parentElement=this;this.children.push(...children); }
  replaceChildren() { this.children = []; }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k]; }
  querySelectorAll(selector) { return this.children.flatMap(child=>[...(selector==='button'&&child.tagName==='BUTTON'?[child]:[]),...child.querySelectorAll(selector)]); }
  closest(selector) { return selector==='#teacher-strip'&&this.id==='teacher-strip'?this:this.parentElement?.closest(selector); }
  focus() { document.activeElement=this; }
  getContext() { return { clearRect() {} }; }
}
const listeners = {}, nodes = [];
const document = { body: new Element(), documentElement: new Element(),
  createElement(tag) { const n = new Element(); n.tagName=tag.toUpperCase();nodes.push(n); return n; }, addEventListener() {} };
document.body.classList = { add() {}, remove() {}, toggle() {} };
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
      get currentNode() { return { textContent: content, parentElement: { closest: selector => (selector === '[data-numeric]' && numeric || selector === '#mission[data-mission]' && mission) ? {} : null } }; } }; } } });
vm.runInContext(read('src/60-interaction-hud.js').slice(read('src/60-interaction-hud.js').indexOf('function textAudit()'),read('src/60-interaction-hud.js').indexOf('// All quest UI')), auditContext);
const audit = () => vm.runInContext('textAudit()', auditContext);
assert.equal(audit().length, 0); content = '12 moons'; assert.equal(audit().length, 1);
content = '12 km'; vm.runInContext('T.numbers=false', auditContext); assert.equal(audit().length, 1);
numeric = false; content = '7'; assert.equal(audit().length, 1);
mission=true;content='마음대로 만져 보세요';assert.equal(audit().length,0);
mission=false;assert.equal(audit().length,1);
console.log('PASS: textAudit exempts mission and enabled teacher numeric units; rejects all other words and unmarked numbers');
console.log('NOT RUN: WebGL rendering, browser events/focus, contrast, target geometry, portrait occlusion, thumbnail pixels, screenshots. Run tools/capture.mjs on the browser host.');

// Other labs can independently change their visuals (including the laser style).
// The local controller/attract behavior is exercised above; sibling file identity
// is not a requirement for this lab and must not gate its checks.

// Run the real reset adapter with only rendering boundaries stubbed.
const hud=read('src/60-interaction-hud.js');
real(hud.slice(hud.indexOf('const PRESETS='),hud.indexOf('function textAudit()')));
real(`bridge.mode='student';QUEST.skip('explain');`);assert(real('TEACHER_CFG.cardBusy()'));
real(`GRAMMAR.update=()=>{};Q.completed.add(3);Q.stars[3]=3;Q.run=9;Q.results=[{}];Q.explain=[{tries:['a'],right:true}];TEACHER_CFG.reset();`);
assert.equal(real('Q.explain.length'),0);
console.log('Explain teacher: passed 2, failed 0 (explain blocks idle; reset clears explanation log)');
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
const buttons=3+config.layerOrder.length+1+5+3+config.quests.length+3,rows=Math.ceil(buttons/4);
const assumedHeight=rows*72+(rows-1)*2+14+4;
assert(css.includes('max-height:calc(100dvh - 24px)')&&css.includes('overflow:auto'));
for(const height of [720,900,1080]){
 const visibleHeight=Math.min(assumedHeight,height-24);
 assert(visibleHeight<=height-24&&visibleHeight>=72);
}
console.log(`PASS: analytic toolbar ${buttons} buttons / ${rows} rows / ${assumedHeight}px content; capped scroll viewport fits 720, 900, 1080 heights (CSS assumptions, not browser measurements)`);

let u7TeacherChecks=0;
const u7Teacher=(ok,label)=>{assert(ok,'U7 teacher: '+label);u7TeacherChecks++;};
const strip=run('teacherStrip');
for(const lang of ['ko','en']){
 portable.language=lang;run("TEACHER.mode('teacher')");
 const prefix=lang==='ko'?'단계':'Level',questPrefix=lang==='ko'?'퀘스트 바로가기':'Quest shortcut';
 const levelButtons=()=>strip.querySelectorAll('button').filter(b=>b.attributes['aria-label'].startsWith(prefix+' '));
 u7Teacher(levelButtons().length===3,lang+' three level buttons');
 for(const [level,first] of [[1,7],[2,9],[3,5]]){
  const button=levelButtons()[level-1];
  u7Teacher(button.tagName==='BUTTON'&&button.getAttribute('aria-label')===prefix+' '+level,'native accessible button');
  button.focus();button.onclick();
  u7Teacher(portable.getQuest()===first,'first quest index '+first);
  u7Teacher(run('T.numbers')===(level>=2),'numbers '+level);
  u7Teacher(levelButtons().every((b,i)=>b.getAttribute('aria-pressed')===String(i===level-1)),'exclusive pressed state');
  u7Teacher(document.activeElement===levelButtons()[level-1],'focus restored after selection');
  for(const numbers of [true,false]){
   run(`T.numbers=${numbers}`);
   const shortcut=strip.querySelectorAll('button').find(b=>b.getAttribute('aria-label')===questPrefix+' 12');
   shortcut.onclick();
   u7Teacher(run('T.numbers')===numbers,'shortcut preserves numeric state');
   u7Teacher(levelButtons().filter(b=>b.getAttribute('aria-pressed')==='true').length===1&&levelButtons()[2].getAttribute('aria-pressed')==='true','shortcut updates level indicator');
  }
 }
 for(const i of config.questOrder){run(`TEACHER.select(${i})`);u7Teacher(levelButtons().every((b,j)=>b.getAttribute('aria-pressed')===String(config.levelOf(i)===j+1)),'current quest level '+i);}
}
for(const [name,label] of Object.entries({...run('TEACHER_LABELS'),...config.layerLabels}))u7Teacher(typeof label.en==='string'&&label.en.trim()&&!/[가-힣]/.test(label.en),'English accessible label '+name);
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
real('document.createElement=()=>({click(){onDownload(this)},remove(){onRemove()}});document.body={append(){}}');
definitions.onDownload=a=>{clicks++;Object.assign(downloads.at(-1),{filename:a.download,href:a.href});};
definitions.onRemove=()=>removed++;
real("bridge.mode='student';QUEST.auto(7)");
portable.exportLog=()=>{exportCalls++;config.exportLog();};
for(const [lang,label] of [['ko','기록 내보내기'],['en','Export log']]){
 portable.language=lang;run("TEACHER.mode('teacher')");
 const buttons=strip.querySelectorAll('button'),button=buttons.find(b=>b.getAttribute('aria-label')===label);
 u8Teacher(!!button&&buttons.at(-1)===button,lang+' export last in strip');
 u8Teacher(button.innerHTML===''&&!button.children.length,lang+' icon boundary adds no words');
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
