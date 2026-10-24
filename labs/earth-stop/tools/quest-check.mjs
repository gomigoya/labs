process.env.TEMP=process.env.TMP='D:/CodexWork/Temp';
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const root=new URL('../',import.meta.url), read=p=>fs.readFileSync(new URL(p,root),'utf8');
const context=vm.createContext({console});
const hud=read('src/60-interaction-hud.js'), loop=read('src/70-loop.js');
const section=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
vm.runInContext(read('src/15-physics.js')+`
const pair=value=>({value,target:value}),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const S={phi:pair(.5),period:pair(0),mode:pair(0),playing:pair(0),sound:pair(0),ui:pair(1),t:pair(0),spin:pair(0),sun:pair(0),runId:0,run:null,drag:null,layers:{},frames:0};
const MODEL=PHYS.SCENE,currentPhi=()=>PHYS.phiFromRailX(S.phi.value),currentPeriod=()=>PHYS.periodFromRailX(S.period.value);
const GRAMMAR={LAYERS:['접선 속도의 크기','벤치마크 비교','위도에 따른 감소','관성','낮밤 경계','상대 각속도','설계 속도 한계','반복 관측'],enabled:{},set(v){Object.assign(this.enabled,v)},pin(){},unpin(){},update(){}};
const DIRECTOR={clear(){},intro(){},push(){},event(){},chord(){},time:dt=>dt,update(){}};
const document={body:{classList:{remove(){},toggle(){}}},getElementById(){return {animate(){}}}};
function questUI(){} function syncUI(){} function syncMission(){} function tick(){} function shot(){} function updateHero(){} function drawGraphs(){}
const controls={update(){},target:{}},camera={position:{distanceTo(){return 1}}},bokehPass={uniforms:{focus:{value:0}}},composer={render(){}},LAYERS={};
`+section(hud,'function executeStop()','function action(')+section(hud,'function set(name,','const PRESETS=')+read('src/66-cards.js')+read('src/65-quests.js')+section(loop,'function update(dt)','const LAYERS='),context);
const run=s=>vm.runInContext(s,context);
for(let i=0;i<6;i++){
 const row=run(`QUESTS[${i}]`);assert(row.candidates.length>=2&&row.candidates.length<=3);assert(row.candidates.some(c=>c.key===row.answerKey));
 const result=run(`QUEST.auto(${i})`);assert(result.passed&&result.judge&&result.phase==='card',JSON.stringify({result,sample:run("QUEST.sample()"),flags:run("Q.flags")}));console.log(`auto(${i}): ${JSON.stringify(result)}`);
 for(const t of [0,.25,1.2,2.5]){
  const output=run(`QUESTS[${i}].candidates.map(c=>CARDS.picture(${i+1},c,${t})).join('')+CARDS.actual(${i+1},Q.flags.success)+QUESTS[${i}].card(Q.flags.success)+CARDS.micro(${i+1},QUEST.sample())`);
  assert(!/NaN|Infinity|undefined|<text\b|<img\b/.test(output));assert(!/>[^<]*[\p{L}\p{N}][^<]*</u.test(output));
 }
}
// Intercept prediction choice only; replay the same real operations for all wrong paths.
run(`const originalPick=QUEST.pick;QUEST.pick=function(k){return originalPick.call(this,(k+1)%3)};`);
for(let i=0;i<6;i++){const result=run(`QUEST.auto(${i})`);assert(result.passed&&result.judge&&result.stars===2,JSON.stringify(result));}
run(`QUEST.pick=originalPick;`);
assert.equal(run(`CARDS.actual(3,{phi:0,P:PHYS.C.T0,measurement:null})===CARDS.principle(3,{phi:0,P:PHYS.C.T0,measurement:null})`),true);
for(const p of ['PHYS.C.Y','0','Infinity'])assert(!/NaN|Infinity|undefined/.test(run(`CARDS.micro(4,{P:${p}})`)));
run(`QUEST.go(0);step(90,1/30);`);assert.equal(run(`QUEST.allows('speed')`),false);
run(`QUEST.pick(2);step(120,1/30);step(120,1/30);`);assert(run('Q.flags.demos>=2'));
run(`QUEST.auto(1);`);const savedPhi=run('currentPhi()');run('step(120,1/30)');assert.equal(run('currentPhi()'),savedPhi);
run(`step(120,1/30);`);assert.equal(run('Q.i'),2);assert.equal(run('currentPhi()'),0);
run(`QUEST.go(2);step(90,1/30);QUEST.pick(0);executeStop();QUEST.open('relative');step(120,1/30);`);
assert.equal(run('Q.stars[2]'),2);assert.equal(run('Q.phase'),'card');
run(`QUEST.go(0);step(90,1/30);QUEST.pick(2);QUEST.open('speed');QUEST.open('bench');set('phi',30);step(120,1/30);set('phi',0);step(120,1/30);`);
assert.equal(run('Q.phase'),'act');assert.equal(run('Q.flags.hold'),0);
run(`QUEST.go(2);step(90,1/30);QUEST.pick(1);executeStop();QUEST.open('relative');set('phi',30);step(120,1/30);`);
assert.equal(run('QUESTS[2].judge(QUEST.sample())'),false);
run(`QUEST.go(2);step(90,1/30);QUEST.pick(1);executeStop();QUEST.open('relative');const oldId=S.runId;executeStop();QUEST.update(0);`);
assert.equal(run('Q.flags.relativeSeen'),false);assert(run('!!Q.records[oldId]'));
run(`QUEST.go(1);step(90,1/30);QUEST.pick(1);set('phi',60);step(120,1/30);`);assert.equal(run('Q.phase'),'act');
run(`QUEST.open('decrease');S.drag={};step(120,1/30);`);assert.equal(run('Q.flags.hold'),0);assert.equal(run('Q.phase'),'act');
run(`S.drag=null;step(120,1/30);`);assert(run('QUEST.passed'));
run(`QUEST.mode(true);`);assert(run(`QUEST.allows('P')`));run(`QUEST.mode(false)`);assert.equal(run(`QUEST.allows('P')`),false);
for(const file of fs.readdirSync(new URL('src/',root)).filter(f=>f.endsWith('.js'))){
 const source=read('src/'+file);assert(!/Math\.random\s*\(|<text\b|fillText\s*\(|<(?:img|image)\b|<title\b|title\s*=/.test(source),file);
 execFileSync(process.execPath,['--input-type=module','--check'],{input:source});
}
const assembled=read('index.html').match(/<script type="module">([\s\S]*?)<\/script>/)[1];execFileSync(process.execPath,['--input-type=module','--check'],{input:assembled});
console.log('PASS: six real-PHYS auto runs, six wrong predictions, phase timing, interrupted hold, stale lens/run evidence, free-mode lock');
console.log('PASS: candidate/principle/micro SVG finite, no visible text/raster/random APIs, module syntax');
console.log('Browser input, layout, textAudit and screenshots require tools/capture.mjs; not run here.');
