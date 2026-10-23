// Browser-free contract checks: real PHYS, real QUEST and CARDS; rendering is stubbed.
process.env.TEMP = process.env.TMP = 'D:/CodexWork/Temp';
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const root = new URL('../', import.meta.url);
const read = p => fs.readFileSync(new URL(p, root), 'utf8');
const context = vm.createContext({ console });
vm.runInContext(read('src/15-physics.js') + `
const S={body:{value:0,target:0},nWeights:{value:5,target:5},t:{value:0,target:0},playing:{value:0,target:0},sound:{target:0},runId:0,trial:null,drag:null,vertical:false};
const GRAMMAR={LAYERS:['무게 크기','천체 변경','질량 불변','계측 한계','점프 비교','중력 방향','시험 기록','양의 관계'],set(){},unpin(){},resetRecords(){}};
const DIRECTOR={clear(){},intro(){},push(){},event(){},chord(){},time(dt){return dt;}};
const document={body:{classList:{remove(){}}},getElementById(){return {animate(){}}}};
function questUI(){} function syncUI(){}
function set(name,v){S[name].target=v;if(name==='body'||name==='nWeights'){S.trial=null;S.t.value=S.t.target=0;S.playing.value=S.playing.target=0;}}
function runTrial(){S.body.value=S.body.target;S.nWeights.value=S.nWeights.target;S.trial=PHYS.jumpTrial(S.body.target,S.nWeights.target,++S.runId);S.t.value=S.t.target=0;S.playing.value=S.playing.target=1;QUEST.trial(S.trial);}
function step(n,dt){for(let k=0;k<n;k++){for(const name of ['body','nWeights']){const p=S[name];p.value+=(p.target-p.value)*(1-Math.exp(-18*dt));if(Math.abs(p.target-p.value)<1e-8)p.value=p.target;}if(S.trial)S.t.value=S.t.target+=dt*S.playing.target;QUEST.update(dt);}}
` + read('src/66-cards.js') + read('src/65-quests.js'), context);
const run = s => vm.runInContext(s, context);
assert.equal(run('QUESTS.length'), 7);
for (let i=0;i<7;i++) {
  const d=run(`QUESTS[${i}]`);
  assert(d.candidates.length>=2&&d.candidates.length<=3);
  assert(d.candidates.some(c=>c.key===d.answerKey));
  const r=run(`QUEST.auto(${i})`);
  assert(r.passed&&r.judge&&r.phase==='card'&&r.stars===3,JSON.stringify(r));
  console.log(`auto(${i}): ${JSON.stringify(r)}`);
  run(`QUEST.go(${i});step(90,1/30);QUEST.pick(QUESTS[${i}].candidates.findIndex(c=>c.key!==QUESTS[${i}].answerKey));QUEST.solve();`);
  assert.equal(run(`Q.stars[${i}]`),2);
  assert(run('QUEST.passed'));
  for(const time of [0,.25,1.2,2.5]) {
    const output=run(`QUESTS[${i}].candidates.map(c=>CARDS.picture(${i+1},c,${time})).join('')+QUESTS[${i}].card(Q.flags.success)+CARDS.actual(${i+1},Q.flags.success)+CARDS.micro(Q.flags.success)`);
    assert(!/NaN|Infinity|undefined|<text\b|<img\b/.test(output));
    assert(!/>[^<]*[\p{L}\p{N}][^<]*</u.test(output));
    for(const match of output.matchAll(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi))assert(Number.isFinite(Number(match[0])));
  }
}
// Prediction lock and suspend/resume preserve a pending operation and its clocks.
run('QUEST.go(1);step(90,1/30)');assert.equal(run("QUEST.allows('body')"),false);
run("QUEST.pick(1);QUEST.inspect();set('body',1);step(30,1/30);QUEST.mode(true)");
const pending=run('JSON.stringify(QUEST.state())');run('step(120,1/30)');
assert.equal(run('JSON.stringify(QUEST.state())'),pending);
run("QUEST.mode(false);QUEST.inspect();step(90,1/30)");assert.equal(run('Q.phase'),'card');
// Interrupted balance observation must not be fabricated by visiting the shelf.
run("QUEST.go(1);step(90,1/30);QUEST.pick(1);set('body',1);step(90,1/30)");
assert.equal(run('Q.phase'),'act');assert.equal(run('Q.flags.visited.length'),0);
run("QUEST.go(4);step(90,1/30);QUEST.pick(1);runTrial();S.playing.target=0;step(120,1/30)");
assert.equal(run('Q.flags.runs.length'),0);assert.equal(run('Q.phase'),'act');
run('QUEST.go(3);step(90,1/30);QUEST.pick(1);set("nWeights",1);set("body",7);step(90,1/30);QUEST.inspect();step(30,1/30)');
assert.equal(run('Q.phase'),'act');
// No-prediction path and the second allowed design choice.
run('QUEST.go(6);QUEST.skip("act");set("body",5);step(100,1/30)');
assert.equal(run('Q.stars[6]'),3);assert(run('QUEST.passed'));
// A carousel animation must not turn its intervening specimens into selected worlds.
run('QUEST.go(0);step(90,1/30);QUEST.pick(1);set("body",6);step(60,1/30)');
assert.equal(run('Q.phase'),'act');assert.equal(run('Q.flags.success'),null);
// Earth evidence at one weight count cannot be reused for a different count.
run('QUEST.go(1);step(90,1/30);QUEST.pick(1);QUEST.inspect();set("nWeights",3);step(30,1/30);set("body",1);QUEST.inspect();step(60,1/30)');
assert.equal(run('Q.phase'),'act');assert.equal(run('Q.flags.visited.join(",")'),'1');
// No-apex is a recorded event, never a fabricated zero-height apex.
run('QUEST.go(4);step(90,1/30);QUEST.pick(1);set("body",9);runTrial();step(60,1/30)');
assert.equal(run('Q.flags.runs[0].height'),null);assert.equal(run('Q.flags.runs[0].event'),'no-apex');assert.equal(run('Q.phase'),'act');
run('QUEST.auto(4)');assert.equal(run('Q.flags.runs.length'),2);assert.equal(run('new Set(Q.flags.runs.map(r=>r.runId)).size'),2);
// Success preserves the scene and a frozen scientific snapshot until a boundary.
run('QUEST.auto(0)');const success=run('JSON.stringify(Q.flags.success)');
assert.equal(run('S.body.target'),1);run('set("body",3);step(1,1/30)');assert.equal(run('JSON.stringify(Q.flags.success)'),success);
for(const file of fs.readdirSync(new URL('src/',root)).filter(n=>n.endsWith('.js'))) {
  const code=read(`src/${file}`);
  assert(!/Math\.random|<text\b|fillText\s*\(|<img\b/.test(code),file);
  execFileSync(process.execPath,['--input-type=module','--check'],{input:code});
}
const assembled=read('index.html').match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
assert(assembled);execFileSync(process.execPath,['--input-type=module','--check'],{input:assembled});
for(const f of ['65-quests.js','66-cards.js','68-director.js'])assert(assembled.includes(read(`src/${f}`).trim()),`assemble ${f}`);
console.log('PASS: 7 real-PHYS auto runs, 7 wrong predictions, candidate keys/counts, finite wordless SVG loops');
console.log('PASS: prediction lock, suspended pending state, interrupted trial, explicit balance/break evidence, Saturn, no prediction');
console.log('PASS: no transit-world completion, same-count balance evidence, no-apex, unique runs, preserved success snapshot');
console.log('PASS: all module/assembled syntax and no text/raster/Math.random APIs');
console.log('Browser layout, events, sound and textAudit: NOT RUN; use tools/capture.mjs.');
