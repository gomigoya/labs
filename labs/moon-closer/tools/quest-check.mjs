// Real physics and the shared quest engine, with browser/rendering boundaries stubbed.
process.env.TEMP = process.env.TMP = 'D:/CodexWork/Temp';
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const root = new URL('../', import.meta.url);
const read = p => fs.readFileSync(new URL(p, root), 'utf8');
for (const file of fs.readdirSync(new URL('src/', root)).filter(n => n.endsWith('.js'))) execFileSync(process.execPath, ['--check', new URL(`src/${file}`, root).pathname.replace(/^\/(\w:)/, '$1')]);
const assembled = read('index.html').match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
assert(assembled, 'assembled module missing');
execFileSync(process.execPath, ['--input-type=module', '--check'], { input: assembled });
const context = vm.createContext({ console });
vm.runInContext(read('src/15-physics.js') + `
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const closerAt=u=>u<0?0:PHYS.closerFromRailX(u);
const S={u:{value:-.05,target:-.05},t:{value:0,target:0},playing:{value:0,target:0},lon0:{value:.45},vertical:false};
const GRAMMAR={enabled:{marks:true,field:true,lens:false,person:false,sky:false,limit:true},set(v){Object.assign(this.enabled,v)}};
const DIRECTOR={clear(){},intro(){},push(){},event(){},chord(){}};
const CARDS={principle(){return ''}};
const document={body:{classList:{remove(){}}},getElementById(){return {animate(){}}}};
const SHOTS=[],SHOTS_VERTICAL=[];
function flyTo(){} function questUI(){} function syncUI(){}
function set(name,v){if(name==='closer') S.u.target=v<.1?-.05:PHYS.railX(v);if(name==='t')S.t.target=((v%86400)+86400)%86400;}
function step(n,dt){for(let i=0;i<n;i++){const k=1-Math.exp(-18*dt);S.u.value+=(S.u.target-S.u.value)*k;if(Math.abs(S.u.value-S.u.target)<1e-8)S.u.value=S.u.target;const delta=((S.t.target-S.t.value+129600)%86400)-43200;S.t.value=((S.t.value+delta*k)%86400+86400)%86400;QUEST.update(dt);}}
` + read('src/65-quests.js'), context);
const rows = vm.runInContext('QUESTS.map(d=>({id:d.id,candidates:d.candidates.map(c=>c.key),answerKey:d.answerKey,fields:d.fields}))', context);
const required = [['closer','lensOpen'],['visited','closer'],['closer'],['peaks'],['closer','personSeen','oceanSeen'],['closer','skyOpen'],['closer'],['wall','closer']];
for (const [i, row] of rows.entries()) {
  assert(row.candidates.length >= 2 && row.candidates.length <= 3); assert(row.candidates.includes(row.answerKey));
  for (const field of required[i]) assert(row.fields.includes(field), `Q${i+1} missing ${field}`);
  assert(read('src/65-quests.js').includes(`PHYS.judgeQ${i+1}(s)`));
  console.log(`Q${i+1}: candidates=${row.candidates.length}, answer=${row.answerKey}, fields=OK`);
}
for (let i=0;i<8;i++) { const result=vm.runInContext(`QUEST.auto(${i})`,context); assert(result.passed && result.judge && result.phase==='card',JSON.stringify(result)); console.log(`auto(${i}): ${JSON.stringify(result)}`); }
// A wrong prediction costs one star, never blocks the scientific result.
vm.runInContext(`QUEST.go(2);step(90,1/30);QUEST.pick(0);set('closer',PHYS.DETENTS[0].closer);step(120,1/30);step(100,1/30);`,context);
assert.equal(vm.runInContext('Q.stars[2]',context),2);
vm.runInContext(`QUEST.go(7);step(90,1/30);QUEST.pick(0);set('closer',PHYS.DETENTS[0].closer);step(60,1/30);S.drag={type:'moon'};step(60,1/30);`,context);
assert.equal(vm.runInContext('Q.flags.hold',context),0);
assert.equal(vm.runInContext('Q.phase',context),'act');
for (const file of ['src/65-quests.js','src/66-cards.js','src/68-director.js']) assert(!/Math\.random|<text\b|fillText\s*\(|<img\b/.test(read(file)),file);
const pictures = vm.createContext({});
vm.runInContext(read('src/15-physics.js') + read('src/66-cards.js') + read('src/65-quests.js'), pictures);
for (let i=0;i<8;i++) for (const time of [0,.25,1.2,2.5]) {
  const output = vm.runInContext(`QUESTS[${i}].candidates.map(c=>CARDS.picture(${i+1},c,${time})).join('')+CARDS.principle(${i+1},{closer:QUESTS[${i}].candidates[2].closer,wall:8,lon0:.45,t:0})+CARDS.micro()`,pictures);
  assert(!/NaN|Infinity|undefined|<text\b/.test(output),`Q${i+1} invalid SVG`);
}
console.log('PASS: candidate loops and principle/micro SVG finite at four loop times');
console.log('PASS: syntax, definitions, 8 real-PHYS auto runs, wrong prediction, interrupted hold, no text/raster/random APIs');
console.log('Rendering, browser events, layout and textAudit require tools/capture.mjs.');
