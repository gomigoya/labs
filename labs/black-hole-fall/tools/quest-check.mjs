// Browser-free verification: real PHYS, cards and shared QUEST, rendering boundaries stubbed.
process.env.TEMP=process.env.TMP='D:/CodexWork/Temp';
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8');
for(const file of fs.readdirSync(new URL('src/',root)).filter(n=>n.endsWith('.js')))execFileSync(process.execPath,['--check',fileURLToPath(new URL(`src/${file}`,root))]);
const assembled=read('index.html').match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];assert(assembled);
execFileSync(process.execPath,['--input-type=module','--check'],{input:assembled});
const missionNode={textContent:'',hidden:false,style:{},getAnimations:()=>[],animate(){}};
const context=vm.createContext({console,structuredClone,matchMedia:()=>({matches:true}),document:{getElementById:id=>id==='mission'?missionNode:{getBoundingClientRect:()=>({bottom:100})}}});
vm.runInContext(read('src/15-physics.js')+`
const pair=v=>({value:v,target:v});
const S={u:pair(0),massIndex:pair(0),orientation:pair(0),playing:pair(0),records:[],graphKeys:[],drag:null};
const massIndex=()=>Math.round(S.massIndex.value),orientation=()=>S.orientation.value<.5?'radial':'transverse',currentR=()=>PHYS.rFromRailX(S.u.value);
const controls={enabled:true},GRAMMAR={LAYERS:['a','b','c','d','e','f'],enabled:{},set(v){Object.assign(this.enabled,v)},pin(){},unpin(){}};
const DIRECTOR={eventLeft:0,clear(){this.eventLeft=0},intro(){},push(){},event(){this.eventLeft=.8},chord(){}};
const T={mode:'student'};
const qPictures={animate(){}};function questUI(){syncMission()}function syncUI(){syncMission()}
function set(n,v){if(n==='r')S.u.target=PHYS.railX(v);else if(n==='orientation')S.orientation.target=v==='transverse'?1:0;else S[n].target=v;}
function step(n,dt){if(n>120)throw Error('step limit');for(let j=0;j<n;j++){
 const k=1-Math.exp(-18*dt*(DIRECTOR.eventLeft>0?.18:1));
 for(const n of ['u','massIndex','orientation']){S[n].value+=(S[n].target-S[n].value)*k;if(Math.abs(S[n].value-S[n].target)<1e-9)S[n].value=S[n].target;}
 QUEST.update(dt);syncMission();DIRECTOR.eventLeft=Math.max(0,DIRECTOR.eventLeft-dt);
}}
`+read('src/65-quests.js')+read('src/66-cards.js')+read('src/67-mission.js'),context);
const run=code=>vm.runInContext(code,context);
const rows=run('QUESTS.map(d=>({id:d.id,keys:d.candidates.map(c=>c.key),answers:d.answerKeys,answerKey:d.answerKey}))');
for(const [i,row]of rows.entries()){
 assert(row.keys.length>=2&&row.keys.length<=3);assert(row.keys.includes(row.answerKey));for(const k of row.answers)assert(row.keys.includes(k));
 assert(read('src/65-quests.js').includes(`PHYS.judgeQ${i+1}(s)`));
 run(`QUEST.go(${i})`);const intro=missionNode.textContent;
 run('step(90,1/30)');assert.notEqual(missionNode.textContent,intro,'intro to prediction must update displayed mission');
 run('QUEST.pick(0)');assert.notEqual(missionNode.textContent,intro);assert.equal(missionNode.textContent,run('missionText(Q.i,Q.phase,{correct:QUEST.correct()})'));
 const result=run(`QUEST.auto(${i})`);assert(result.passed&&result.judge&&result.phase==='card'&&result.stars===3,JSON.stringify(result));
 assert(missionNode.textContent.startsWith('맞아요'), 'correct prediction must show the right result');
 console.log(`auto(${i}): ${JSON.stringify(result)}`);
 // Replay the same real manipulations with a misconception selected.
 run(`QUEST.go(${i});step(90,1/30);QUEST.pick(QUESTS[${i}].candidates.findIndex(c=>!QUESTS[${i}].answerKeys.includes(c.key)));
 for(const op of QUESTS[${i}].solution){for(const [n,v]of Object.entries(op)){if(n==='open')QUEST.open(v);else set(n,v);}step(100,1/30);}step(100,1/30);`);
 assert.equal(run(`Q.stars[${i}]`),2);assert(run(`QUESTS[${i}].judge(Q.flags.success)`));
 assert(!missionNode.textContent.startsWith('맞아요'), 'wrong prediction must show its own result');
}
run(`QUEST.go(0);step(90,1/30);QUEST.pick(2);`);assert.equal(run('Q.flags.demoLeft'),2.2);
run(`step(120,1/30);step(92,1/30);`);assert(run('Q.flags.demoLeft>0'));
console.log('PASS: real quest transitions update mission text across 6 quests');
for(const i of [1,3]){
 run(`QUEST.go(${i});step(90,1/30);QUEST.pick(0);`);
 const before=missionNode.textContent;
 run(i===1?"set('r',20);step(100,1/30)":"set('massIndex',1);step(100,1/30)");
 assert.equal(run('Q.phase'),'act');assert.notEqual(missionNode.textContent,before);
 assert(missionNode.textContent.includes('두 칸 버튼'),'ready measurements must prompt comparison');
}
console.log('PASS: real measurements immediately prompt comparison in quests 2 and 4');
console.log('PASS: 6 definitions, candidate keys, 6 wrong-prediction paths, initial/idle ghost hand');
run(`QUEST.go(4);step(90,1/30);QUEST.pick(1);S.drag={type:'rail'};set('r',.5);step(120,1/30);`);
assert.equal(run('Q.phase'),'act');assert.equal(run('QUEST.sample().stopped'),false);
run(`S.drag=null;step(1,1/30);`);assert.equal(run('Q.phase'),'observe');
// Free exploration suspends quest timers/evidence and preserves the user's controls on return.
run(`QUEST.go(0);step(90,1/30);const pausedAt=Q.flags.elapsed;QUEST.mode(true);set('r',20);step(120,1/30);QUEST.mode(false);`);
assert.equal(run('Q.phase'),'predict');assert.equal(run('Q.flags.elapsed'),run('pausedAt'));assert.equal(run('currentR()'),20);
assert.equal(run('Q.flags.samples.length'),1);
// Entering a new quest drops stale samples, crossings and comparison flags.
run(`QUEST.auto(1);const oldRun=Q.runId;QUEST.go(1);`);
assert(run('Q.runId>oldRun&&Q.flags.samples.length===1&&!Q.flags.ratioSeen&&!QUESTS[1].judge(QUEST.sample())'));
run(`step(90,1/30);QUEST.pick(2);QUEST.open('compare');step(1,1/30);`);
assert.equal(run('Q.flags.ratioSeen'),false);assert.equal(run('Q.phase'),'act');
run(`QUEST.go(3);step(90,1/30);QUEST.pick(2);QUEST.open('compare');step(1,1/30);`);
assert.equal(run('Q.flags.comparisonOpen'),false);
run(`QUEST.go(5);Q.completed.delete(5);QUEST.skip('observe');step(30,1/30);`);assert.equal(run('QUEST.passed'),false);
// Both medium and large mass choices must work; direction and horizon equality do not.
run(`QUEST.go(5);step(90,1/30);QUEST.pick(2);set('massIndex',2);step(100,1/30);set('r',.5);step(100,1/30);`);
assert.equal(run('Q.stars[5]'),3);
run(`QUEST.go(4);step(90,1/30);QUEST.pick(1);set('orientation','transverse');set('r',.5);step(120,1/30);`);assert.equal(run('Q.phase'),'act');
console.log('PASS: interrupted stop, suspended free mode, fresh run, unopened comparisons, debug skip, alternate mass, radial-only evidence');
for(let i=0;i<6;i++){
 run(`QUEST.auto(${i})`);
 for(const t of [0,.25,1.2,2.5,3]){
  const output=run(`QUESTS[${i}].candidates.map(c=>CARDS.picture(${i+1},c,${t})).join('')+CARDS.actual(${i+1},Q.flags.success)+QUESTS[${i}].card(Q.flags.success)+CARDS.actual(${i+1},Q.flags.success)`);
  assert(!/NaN|Infinity|undefined|<text\b|<image\b|<img\b/.test(output),`Q${i+1} SVG`);
  assert(!/>[^<\s]+</.test(output),'visible SVG text');
  for(const token of output.match(/[-+]?(?:\d*\.\d+|\d+)(?:e[-+]?\d+)?/gi)||[])assert(Number.isFinite(Number(token)));
 }
}
for(const file of fs.readdirSync(new URL('src/',root)).filter(n=>/\.(js|html)$/.test(n))){
 const source=read(`src/${file}`);assert(!/Math\.random|<text\b|fillText\s*\(|strokeText\s*\(|<img\b|<image\b|\p{Extended_Pictographic}/u.test(source),file);
}
console.log('PASS: finite candidate/card/lens SVG at 5 loop times; no text, raster, emoji or Math.random; module syntax');
console.log('Browser layout, pointer events, sound and textAudit: NOT RUN; use tools/capture.mjs.');
