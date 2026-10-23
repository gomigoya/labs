// Node-only verification: actual PHYS, CARDS and QUEST, rendering boundaries stubbed.
process.env.TEMP=process.env.TMP='D:/CodexWork/Temp';
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8').replace(/^\uFEFF/,'');
for(const file of fs.readdirSync(new URL('src/',root)).filter(f=>f.endsWith('.js')))execFileSync(process.execPath,['--check',fileURLToPath(new URL('src/'+file,root))]);
const module=read('index.html').match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];assert(module);execFileSync(process.execPath,['--input-type=module','--check'],{input:module});
const context=vm.createContext({console,structuredClone});
vm.runInContext(read('src/15-physics.js')+`
const SPECIES_KEYS=Object.keys(PHYS.SPECIES),GROUND_VALUES=Object.values(PHYS.GROUNDS);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));const pair=v=>({value:v,target:v});const S={u:pair(PHYS.railX(1)),species:pair(0),ground:pair(2),t:pair(0),playing:pair(0),cassette:pair(0),drag:null,vertical:false};
const controls={enabled:true};
const GRAMMAR={LAYERS:['marks','steps','limits','overlay','micro','traces','ratio','records'],enabled:{},set(v){Object.assign(this.enabled,v)},unpin(){},clearRecords(){},pin(){},record(){}};
const DIRECTOR={eventLeft:0,clear(){this.eventLeft=0},intro(){},push(){},event(){this.eventLeft=1.4},chord(){},time(dt){return dt*(this.eventLeft>0?.18:1)}};
const document={getElementById(){return {animate(){}}}};
function questUI(){} function syncUI(){} function shot(){}

function step(n=1,dt=1/60){if(n>120)throw Error('batch');for(let i=0;i<n;i++){S.u.value+=(S.u.target-S.u.value)*(1-Math.exp(-18*dt));if(Math.abs(S.u.value-S.u.target)<1e-8)S.u.value=S.u.target;QUEST.update(dt);DIRECTOR.eventLeft=Math.max(0,DIRECTOR.eventLeft-dt);}}
`+read('src/65-quests.js')+read('src/66-cards.js')+read('src/60-interaction-hud.js').slice(read('src/60-interaction-hud.js').indexOf('function set(name,v){'),read('src/60-interaction-hud.js').indexOf('const PRESETS')),context);
const run=s=>vm.runInContext(s,context);
for(let i=0;i<7;i++){
 const row=run(`({c:QUESTS[${i}].candidates.map(c=>c.key),a:QUESTS[${i}].answerKey})`);assert(row.c.length>=2&&row.c.length<=3);assert(row.c.includes(row.a));
 const result=run(`QUEST.auto(${i})`);assert(result.passed&&result.judge&&result.phase==='card'&&result.stars===3,JSON.stringify(result));console.log(`auto(${i}): ${JSON.stringify(result)}`);
 for(const time of [0,.25,1.2,2.5]){
  const output=run(`QUESTS[${i}].candidates.map(c=>CARDS.picture(${i+1},c,${time},Q.flags.success)).join('')+CARDS.actual(${i+1},Q.flags.success)+CARDS.principle(${i+1},Q.flags.success)+CARDS.micro(Q.flags.success)`);
  assert(!/NaN|Infinity|undefined|<text\b|<img\b/.test(output),`Q${i+1} SVG`);
  for(const tag of output.matchAll(/<[^>]+>/g))for(const attribute of tag[0].matchAll(/\b(?:x|y|width|height|cx|cy|r)="([^"]+)"/g))assert(Number.isFinite(Number(attribute[1])),attribute[0]);
 }
}
for(let i=6;i>=0;i--){run('Q.results=[];Q.completed.clear();');const result=run(`QUEST.auto(${i})`);assert(result.passed&&result.judge&&result.phase==='card',`independent Q${i+1}`);}
console.log('PASS: every auto also works without earlier quest results');
// Wrong prediction does not block a completed run.
run(`QUEST.go(0);step(90,1/30);QUEST.pick(0);QUEST.pull();step(40,1/30);step(60,1/30)`);assert.equal(run('Q.stars[0]'),2);
console.log('PASS: wrong prediction awards two stars and completes');
// A pending run has no evidence; interruption clears it. No static hold requirement is invented.
run(`QUEST.go(3);step(90,1/30);QUEST.pick(2);QUEST.pull();step(8,1/30);QUEST.pull();step(40,1/30)`);
assert.equal(run('Q.flags.pending'),null);assert.equal(run('Q.flags.observations.length'),0);assert.equal(run('Q.phase'),'act');
run(`QUEST.pull();step(8,1/30);set('mu',PHYS.GROUNDS['유리']);step(40,1/30)`);assert.equal(run('Q.flags.observations.length'),0);
console.log('PASS: interrupted or edited pending pulls never become observations');
run(`QUEST.go(5);step(90,1/30);QUEST.pick(2);QUEST.compare();step(30,1/30)`);assert.equal(run('Q.phase'),'act');assert.equal(run('Q.flags.visited.length'),0);
run(`set('species',SPECIES_KEYS[5]);step(30,1/30)`);assert.equal(run('Q.phase'),'act');assert.equal(run('Q.flags.visited.length'),1);
run(`QUEST.go(5);step(90,1/30);QUEST.pick(2);`);
run(`set('species',SPECIES_KEYS[0]);set('species',SPECIES_KEYS[0]);`);assert.equal(run('Q.flags.visited.length'),1);
console.log('PASS: comparison needs both actual species selections');
// Retry with an initially unsuitable team, then two useful completed runs.
run(`QUEST.go(4);step(90,1/30);QUEST.pick(1);set('n',100);step(30,1/30);QUEST.pull();step(40,1/30);set('n',59);step(30,1/30);QUEST.pull();step(40,1/30);set('n',69);step(30,1/30);QUEST.pull();step(40,1/30);step(60,1/30)`);
assert.equal(run('Q.phase'),'card');assert.equal(run('Q.flags.before.n'),59);assert.equal(run('Q.flags.after.n'),69);
console.log('PASS: Q5 can recover from an unsuitable first run');
run(`QUEST.auto(3);QUEST.go(4)`);assert.equal(run('Q.flags.observations.length'),0);assert.equal(run('Q.flags.before'),null);assert.equal(run('Q.flags.after'),null);
// Data tables and DOM builders must not emit visible words or external raster assets.
for(const file of fs.readdirSync(new URL('src/',root)).filter(n=>/\.(js|html)$/.test(n))){const src=read('src/'+file);assert(!/Math\.random\s*\(/.test(src),file);assert(!/<text\b|fillText\s*\(|<img\b|\p{Extended_Pictographic}/u.test(src),file);}
for(const f of ['src/65-quests.js','src/66-cards.js','src/68-director.js'])assert(!/moon|closer|roche|ocean|tide/i.test(read(f)),f);
for(const file of ['src/60-interaction-hud.js','src/68-director.js'])for(const match of read(file).matchAll(/<\/\w+>([^<>\n]+)<[a-z]/g))assert(!/[\p{L}]/u.test(match[1].replace(/\$\{[^}]*\}/g,'')),`${file}: literal text ${match[1]}`);
console.log('PASS: syntax, 7 real-PHYS auto runs, 3 candidates each, finite SVG at four loop times, empty evidence, no words/raster/random APIs');
// Existing independent pinhole math; panel dimensions here are CSS assumptions, not browser measurements.
const hand=read('tools/hand-check.mjs');
const projectBox=vm.runInNewContext('('+hand.slice(hand.indexOf('function projectBox'),hand.indexOf('for(const args of')).trim()+')');
for(const [w,h,top,bottom]of [[1440,900,94,660],[375,812,156,502]]){
 let fit=false;
 for(const az of w===375?[65,70,75]:[18,24,30])for(const el of [10,15,20,25])for(let distance=5;distance<=36;distance+=.08){const r=projectBox(w,h,az,el,distance,w===375?38:34,top,bottom);if(r.fits&&r.coverage>=.6&&r.coverage<=.75)fit=true;}
 assert(fit,`${w} CSS reserved-panel projection`);console.log(`PASS: analytic reserved-panel fit ${w}x${h} (CSS assumptions)`);
}
console.log('Browser rendering, events, layout, audio and textAudit require tools/capture.mjs; not run here.');
