// Node-only verification: actual PHYS, CARDS and QUEST, rendering boundaries stubbed.
process.env.TEMP=process.env.TMP='D:/CodexWork/Temp';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8').replace(/^\uFEFF/,'');
for(const file of fs.readdirSync(new URL('src/',root)).filter(f=>f.endsWith('.js')))execFileSync(process.execPath,['--check',fileURLToPath(new URL('src/'+file,root))]);
const module=read('index.html').match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];assert(module);execFileSync(process.execPath,['--input-type=module','--check'],{input:module});
const context=vm.createContext({console,structuredClone});
const questSource=read('src/15-physics.js')+`
const SPECIES_KEYS=Object.keys(PHYS.SPECIES),GROUND_VALUES=Object.values(PHYS.GROUNDS);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));const pair=v=>({value:v,target:v});const S={u:pair(PHYS.railX(1)),species:pair(0),ground:pair(2),t:pair(0),playing:pair(0),cassette:pair(0),drag:null,vertical:false};
const controls={enabled:true};
const GRAMMAR={LAYERS:['marks','steps','limits','overlay','micro','traces','ratio','records','장력계','렌즈','서서히 당기기'],enabled:{},set(v){Object.assign(this.enabled,v)},unpin(){},clearRecords(){},pin(){},record(){}};
const DIRECTOR={eventLeft:0,clear(){this.eventLeft=0},intro(){},push(){},event(){this.eventLeft=1.4},chord(){},time(dt){return dt*(this.eventLeft>0?.18:1)}};
const document={getElementById(){return {animate(){}}}};
function questUI(){} function syncUI(){} function shot(){} function announceResult(){}

function step(n=1,dt=1/60){if(n>120)throw Error('batch');for(let i=0;i<n;i++){S.u.value+=(S.u.target-S.u.value)*(1-Math.exp(-18*dt));if(Math.abs(S.u.value-S.u.target)<1e-8)S.u.value=S.u.target;QUEST.update(dt);DIRECTOR.eventLeft=Math.max(0,DIRECTOR.eventLeft-dt);}}
`+read('src/62-curriculum.js')+read('src/63-explain.js')+read('src/65-quests.js')+read('src/66-cards.js')+read('src/60-interaction-hud.js').slice(read('src/60-interaction-hud.js').indexOf('function set(name,v){'),read('src/60-interaction-hud.js').indexOf('const PRESETS'));
vm.runInContext(questSource,context);
const run=s=>vm.runInContext(s,context);
let u8Checks=0;
const u8=(actual,expected,label)=>{assert.deepEqual(JSON.parse(JSON.stringify(actual)),expected,label);u8Checks++;};
u8(run('QUEST.log()'),[],'fresh log');
const complete8=(pick)=>run(`QUEST.go(7);step(90,1/30);${pick===null?"QUEST.phase('act')":`QUEST.pick(${pick==='B'?1:0})`};QUEST.pull();step(40,1/30);step(60,1/30)`);
complete8('B');
const wrong8=run('EXPLAIN[8].options.filter(o=>!o.correct).map(o=>o.key)');
run(`QUEST.answer('${wrong8[0]}')`);
const entry8={id:8,pick:'B',predictRight:true,answerKey:'B',explainTries:[wrong8[0]],explainRight:false,stars:3};
u8(run('QUEST.log()'),[entry8],'wrong-only explanation is retained');
run('QUEST.go(8)');u8(run('QUEST.log()'),[entry8],'navigation preserves prediction and wrong tries');
complete8('B');run(`QUEST.answer('${wrong8[1]}');QUEST.answer('${wrong8[0]}');QUEST.answer(QUEST.correctKey())`);
u8(run('QUEST.log()'),[{...entry8,explainTries:[wrong8[1],wrong8[0]],explainRight:true}],'ordered wrong tries then correct');
complete8('B');run(`QUEST.answer('${wrong8[0]}');QUEST.answer(QUEST.correctKey())`);
u8(run('QUEST.log()'),[{...entry8,explainRight:true}],'requested one-wrong then correct result');
complete8('A');
u8(run('QUEST.log()'),[{...entry8,pick:'A',predictRight:false,explainTries:[],stars:2}],'repeat overwrites at observation completion');
run('QUEST.answer(QUEST.correctKey())');
u8(run('QUEST.log()'),[{...entry8,pick:'A',predictRight:false,explainTries:[],explainRight:true,stars:2}],'wrong prediction and correct-only explanation');
complete8(null);run('QUEST.answer(QUEST.correctKey())');
u8(run('QUEST.log()[0].predictRight'),true,'null prediction follows existing star rule');
run("const copied=QUEST.state();copied.predict[7].pick='X';const copiedLog=QUEST.log();copiedLog[0].explainTries.push('X')");
u8(run('Q.predict[7].pick'),null,'state prediction is a copy');u8(run('QUEST.log()[0].explainTries'),[],'log tries are a copy');
for(let i=11;i>=0;i--)run(`QUEST.auto(${i})`);
const allLog=JSON.parse(run('JSON.stringify(QUEST.log())'));
u8(allLog.map(e=>e.id),Array.from({length:12},(_,i)=>i+1),'12 entries sorted by id');
u8(run('QUEST.log()'),allLog,'JSON round trip');
u8(Object.keys(allLog[0]),['id','pick','predictRight','answerKey','explainTries','explainRight','stars'],'exact entry fields');
// Keep legacy cases independent of these completed observations.
run('Q.completed.clear();Q.stars.fill(0);Q.results=[];Q.predict=[];Q.explain=[];Q.run=0;QUEST.go(0)');
const diagnostic=read('docs/diagnostic-items.md');
u8(diagnostic.startsWith('**초안 — 현장 교사 또는 연구자의 검수가 필요합니다. 검증된 문항이 아닙니다.**'),true,'draft warning first');
for(let id=1;id<=6;id++)for(const [heading,answer1,answer2] of [[`### 문항 ${id} — 개념 ${id}`,'1단 정답:','2단 정답:'],[`### Item ${id} — Concept ${id}`,'Tier 1 answer:','Tier 2 answer:']]){
 const item=diagnostic.split(heading)[1]?.split(/\n##/)[0];u8(!!item&&item.includes(answer1)&&item.includes(answer2),true,heading+' answers');
}
u8(read('guide.html').includes('diagnostic-items'),true,'guide diagnostic link');
console.log(`U8 log/document: passed ${u8Checks}, failed 0`);
let rivalChecks=0;
const rivalCheck=(value,label)=>{assert(value,label);rivalChecks++;};
run("set('rival',5)");rivalCheck(run('QUEST.sample().rivalN')===5,'rival sample 5');
run("set('rival',0)");rivalCheck(run('QUEST.sample().rivalN')===0,'rival sample 0');
for(const n of [1,100]){run(`set('rival',${n})`);rivalCheck(run('S.rivalN')===n,`rival boundary ${n}`);}
for(const v of ['-1','101','1.5',"'x'"]){assert.throws(()=>run(`set('rival',${v})`),e=>['RangeError','TypeError'].includes(e.name));rivalChecks++;}
for(let i=0;i<7;i++){run(`set('rival',5);QUEST.go(${i})`);rivalCheck(run('QUEST.sample().rivalN')===0,`go resets rival ${i}`);}
run("const originalStart=QUESTS[0].startState;QUESTS[0].startState=()=>({...originalStart(),rival:6});QUEST.go(0)");
rivalCheck(run('QUEST.sample().rivalN')===6,'optional start rival');
run('QUESTS[0].startState=originalStart;QUEST.go(0)');
console.log(`Rival: passed ${rivalChecks}, failed 0`);
// Explain: 시간만으로 설명 선택을 건너뛸 수 없다.
run("QUEST.go(0);step(90,1/30);QUEST.pick(2);QUEST.pull();step(40,1/30);step(60,1/30)");
assert.equal(run('Q.phase'),'explain','confirm leads to explain');
run('step(30,1)');assert.equal(run('Q.phase'),'explain','waits for a choice for 30 seconds');
// U2: 요구한 표시 순서, 단계, 해금과 시작 조건을 실제 흐름으로 확인한다.
let curriculumChecks=0;
const curriculumCheck=(value,label)=>{assert(value,label);curriculumChecks++;};
const order=[7,8,0,1,3,9,10,11,4,2,5,6];
curriculumCheck(run('JSON.stringify(SEQUENCE)')===JSON.stringify(order),'display order without missing or duplicate quests');
for(const [i,level] of [[7,1],[8,1],[0,1],[1,1],[3,1],[9,2],[10,2],[11,2],[4,2],[2,2],[5,3],[6,3]])curriculumCheck(run(`levelOf(${i})`)===level,`level for index ${i}`);
for(const quests of ['[8, 9, 1, 2, 13]','[8, 9, 1, 2, 2]','[8, 9, 1, 2]']){
 assert.throws(()=>vm.runInNewContext(questSource.replace('[8, 9, 1, 2, 4]',quests),{console,structuredClone}),/curriculum/);
 curriculumChecks++;
}
run('Q.completed.clear()');
curriculumCheck(run('JSON.stringify(SEQUENCE.filter(i=>QUEST.unlocked(i)))')==='[7]','only first quest unlocked');
curriculumCheck(run('QUEST.first()')===7,'first quest');
for(const [pos,i] of order.entries()){
 const next=order[pos+1]??null;
 curriculumCheck(run(`QUEST.next(${i})`)===next,`next for index ${i}`);
 run(`QUEST.go(${i})`);
 curriculumCheck(run('QUEST.next()')===next,`default next for index ${i}`);
 run(`Q.completed.add(${i})`);
 curriculumCheck(run('JSON.stringify(SEQUENCE.filter(i=>QUEST.unlocked(i)))')===JSON.stringify(order.slice(0,pos+2)),`unlocked after index ${i}`);
}
run('Q.completed.clear();Q.completed.add(2)');
curriculumCheck(run('QUEST.unlocked(2)'),'completed quest stays unlocked without predecessor');
run('Q.results=[];Q.completed.clear();QUEST.go(3)');
curriculumCheck(run('QUEST.sample().n')===49,'Q4 default count');
curriculumCheck(run('QUEST.sample().species')==='트리케라톱스','Q4 default species');
curriculumCheck(run("QUEST.sample().mu===PHYS.GROUNDS['자갈']"),'Q4 default gravel');
curriculumCheck(run("PHYS.minKidsToWin('트리케라톱스',PHYS.GROUNDS['자갈'])")===49,'Q4 default equals minimum winning count');
const q4=run('QUEST.auto(3)');
curriculumCheck(q4.passed&&q4.judge&&q4.phase==='card'&&q4.stars===3,'Q4 default auto completes with three stars');
for(const n of [49,60,80]){
 run(`QUEST.go(1);step(90,1/30);QUEST.pick(2);set('n',${n});step(30,1/30);QUEST.pull();step(40,1/30);step(60,1/30)`);
 curriculumCheck(run('Q.completed.has(1)&&Q.results[1].n')===n,`Q2 completed at ${n}`);
 run('QUEST.go(3)');
 curriculumCheck(run('QUEST.sample().n')===n&&run('QUEST.sample().species')==='트리케라톱스'&&run("QUEST.sample().mu===PHYS.GROUNDS['자갈']"),`Q4 inherits Q2 team at ${n}`);
}
for(const [i,next] of [[7,8],[8,0],[1,3],[3,9],[9,10],[10,11],[11,4],[4,2],[2,5],[6,6]]){
 run(`QUEST.go(${i});QUEST.phase('card');QUEST.update(6.2)`);
 curriculumCheck(run('Q.i')===next,`card advance at index ${i}`);
}
run('Q.results=[];Q.completed.clear();Q.stars.fill(0)');
for(const i of order){const result=run(`QUEST.auto(${i})`);curriculumCheck(result.passed&&result.judge&&result.phase==='card'&&result.stars===3,`curriculum auto index ${i}`);}
curriculumCheck(run('Q.stars.length===QUESTS.length'),'one star slot per quest');
run('Q.results=[];Q.completed.clear();Q.stars.fill(0)');
console.log(`Curriculum: passed ${curriculumChecks}, failed 0`);
for(let i=0;i<12;i++){
 const row=run(`({c:QUESTS[${i}].candidates.map(c=>c.key),a:QUESTS[${i}].answerKey})`);assert(row.c.length>=2&&row.c.length<=3);assert(row.c.includes(row.a));
 const result=run(`QUEST.auto(${i})`);assert(result.passed&&result.judge&&result.phase==='card'&&result.stars===3,JSON.stringify(result));console.log(`auto(${i}): ${JSON.stringify(result)}`);
 for(const time of [0,.25,1.2,2.5]){
  const output=run(`QUESTS[${i}].candidates.map(c=>CARDS.picture(${i+1},c,${time},Q.flags.success)).join('')+CARDS.actual(${i+1},Q.flags.success)+CARDS.principle(${i+1},Q.flags.success)+CARDS.micro(Q.flags.success)`);
  assert(!/NaN|Infinity|undefined|<text\b|<img\b/.test(output),`Q${i+1} SVG`);
  for(const tag of output.matchAll(/<[^>]+>/g))for(const attribute of tag[0].matchAll(/\b(?:x|y|width|height|cx|cy|r)="([^"]+)"/g))assert(Number.isFinite(Number(attribute[1])),attribute[0]);
 }
}
for(let i=11;i>=0;i--){run('Q.results=[];Q.completed.clear();');const result=run(`QUEST.auto(${i})`);assert(result.passed&&result.judge&&result.phase==='card',`independent Q${i+1}`);}
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
assert.equal(run('Q.phase'),'explain');run('QUEST.answer(QUEST.correctKey())');assert.equal(run('Q.phase'),'card');assert.equal(run('Q.flags.before.n'),59);assert.equal(run('Q.flags.after.n'),69);
console.log('PASS: Q5 can recover from an unsuitable first run');
run(`QUEST.auto(3);QUEST.go(4)`);assert.equal(run('Q.flags.observations.length'),0);assert.equal(run('Q.flags.before'),null);assert.equal(run('Q.flags.after'),null);
// SVG는 글자·래스터 없이 유지하고 무작위 API는 설명 보기 섞기에만 허용한다.
for(const file of fs.readdirSync(new URL('src/',root)).filter(n=>/\.(js|html)$/.test(n))){const src=read('src/'+file);if(file!=='65-quests.js')assert(!/Math\.random\s*\(/.test(src),file);assert(!/<text\b|fillText\s*\(|<img\b/u.test(src),file);}
for(const f of ['src/65-quests.js','src/66-cards.js','src/68-director.js'])assert(!/moon|closer|roche|ocean|tide/i.test(read(f)),f);
for(const file of ['src/68-director.js'])for(const match of read(file).matchAll(/<\/\w+>([^<>\n]+)<[a-z]/g))assert(!/[\p{L}]/u.test(match[1].replace(/\$\{[^}]*\}/g,'')),`${file}: literal text ${match[1]}`);
console.log('PASS: syntax, 12 real-PHYS auto runs, 3 candidates each, finite SVG at four loop times, empty evidence, no SVG words/raster; random limited to explanation engine');
// Existing independent pinhole math; panel dimensions here are CSS assumptions, not browser measurements.
const hand=read('tools/hand-check.mjs');
const projectBox=vm.runInNewContext('('+hand.slice(hand.indexOf('function projectBox'),hand.indexOf('for(const args of')).trim()+')');
for(const [w,h,top,bottom]of [[1440,900,94,660],[375,812,156,502]]){
 let fit=false;
 for(const az of w===375?[65,70,75]:[18,24,30])for(const el of [10,15,20,25])for(let distance=5;distance<=36;distance+=.08){const r=projectBox(w,h,az,el,distance,w===375?38:34,top,bottom);if(r.fits&&r.coverage>=.6&&r.coverage<=.75)fit=true;}
 assert(fit,`${w} CSS reserved-panel projection`);console.log(`PASS: analytic reserved-panel fit ${w}x${h} (CSS assumptions)`);
}
console.log('Browser rendering, events, layout, audio and textAudit require tools/capture.mjs; not run here.');

const hud=read('src/60-interaction-hud.js');
run("let LANG='ko';"+read('src/64-ui-text.js')+read('src/67-mission.js'));
run(hud.slice(hud.indexOf('function conceptHTML('),hud.indexOf('function questUI(')));
run("function ui(key){return text(UI_TEXT[key])}");
// Explain: 명세의 문구와 관찰 가능한 결과를 검사한다. 보기 순서는 가정하지 않는다.
let explainChecks=2;
const explainCheck=(ok,label)=>{assert(ok,'Explain: '+label);explainChecks++;};
const expectedRecaps=[
 '가벼운 공룡은 땅을 붙잡는 힘이 작아서 아이 한 명에게도 질 수 있어요.',
 '힘은 더해져요. 합이 상대보다 크면 그쪽으로 움직여요.',
 '힘의 합을 비교하면 이길 수 있는 사람 수를 알 수 있어요.',
 '마찰은 땅이 발을 붙잡는 힘이에요. 바닥이 미끄러우면 마찰이 줄어요.',
 '마찰의 한계는 발이 땅을 누르는 힘에 따라 커져요.',
 '큰 동물일수록 몸무게에 비해 근육 힘은 작아요. (이 실험의 값은 추정이에요.)',
 '이기는 쪽은 한계의 합이 큰 쪽이에요.',
 '크기가 같고 방향이 반대인 두 힘은 평형을 이뤄서 물체가 움직이지 않아요.',
 '힘이 같지 않으면(불균형) 더 큰 쪽으로 움직임이 바뀌어요.',
 '팽팽한 줄의 장력은 어디서나 같아요. 이기는 쪽과 지는 쪽의 줄 힘도 같아요.',
 '한 물체의 힘의 합이 0이면 평형이에요. 무엇을 보느냐에 따라 힘의 합이 달라져요.',
 '마찰은 필요한 만큼만 생겨요. 한계를 넘으면 미끄러져요.'
];
const expectedCorrect=[
 '작은 공룡은 가벼워서 땅을 붙잡는 힘(마찰)이 작아요',
 '아이들 힘을 모은 합이 공룡의 힘을 넘을 때 이겨요',
 '아이들 힘의 합이 티라노의 한계를 넘는 인원(약 59명)이 필요해요',
 '바닥이 미끄러우면 발이 땅을 붙잡는 힘(마찰)이 줄어서, 가벼운 쪽이 먼저 미끄러져요',
 '인원이 늘면 마찰의 한계도 같이 커져요',
 '몸이 클수록 몸무게에 비해 근육 힘은 작아져요',
 '30명의 힘의 합 안에 드는 종까지만 이길 수 있어요',
 '두 힘이 같고 방향이 반대라서 서로 상쇄돼요',
 '힘이 한쪽만 더 커져서 평형이 깨져요',
 '줄은 하나라서 양쪽 끝에 걸리는 힘(장력)이 같아요',
 '끌려가는 팀은 줄이 당기는 힘이 땅이 붙잡는 힘(마찰)보다 커서 힘의 합이 0이 아니에요',
 '마찰은 당기는 힘에 맞춰 커지다가 한계에서 미끄러져요'
];
for(let id=1;id<=12;id++){
 const d=JSON.parse(run(`JSON.stringify(EXPLAIN[${id}])`));
 explainCheck(d.options.length===3&&d.options.map(o=>o.key).join('')==='abc',`Q${id} three stable keys`);
 explainCheck(d.options.filter(o=>o.correct).length===1&&d.options.filter(o=>!o.correct).every(o=>o.hint.ko.trim()),`Q${id} answer and hints`);
 explainCheck(d.recap.ko===expectedRecaps[id-1],`Q${id} exact recap`);
 explainCheck(d.options.find(o=>o.correct).ko===expectedCorrect[id-1],`Q${id} exact correct option`);
 explainCheck(run(`QUEST.correctKey(${id})`)===d.options.find(o=>o.correct).key,`Q${id} public correct key`);
}
for(const mutation of ["delete EXPLAIN[1]","EXPLAIN[1].options.pop()","EXPLAIN[1].options[0].correct=true","delete EXPLAIN[1].options[0].hint","EXPLAIN[1].recap.ko='' "]){
 assert.throws(()=>vm.runInNewContext(questSource.replace('validateExplain(QUESTS);',mutation+';validateExplain(QUESTS);'),{console,structuredClone}),/explain:/);
 explainChecks++;
}
run("Q.free=false");
for(const [pick,stars] of [[2,3],[0,2]]){
 run(`QUEST.go(0);step(90,1/30);QUEST.pick(${pick});QUEST.pull();step(40,1/30);step(60,1/30)`);
 explainCheck(run("Q.phase==='explain'"),'natural explain entry');
 const wrong=run('EXPLAIN[1].options.find(o=>!o.correct).key');
 run(`QUEST.answer('${wrong}')`);
 explainCheck(run(`Q.phase==='explain'&&Q.flags.explain.tries.join('')==='${wrong}'&&DIRECTOR.eventLeft>0`),'wrong answer records and replays');
 run(`QUEST.answer('${wrong}')`);
 explainCheck(run('Q.flags.explain.tries.length===1'),'duplicate wrong ignored');
 run('step(30,1)');explainCheck(run("Q.phase==='explain'&&DIRECTOR.eventLeft===0"),'wait survives replay and 30 seconds');
 run('QUEST.answer(QUEST.correctKey())');
 explainCheck(run(`Q.phase==='card'&&Q.stars[0]===${stars}&&Q.flags.explain.right`),'prediction alone sets stars');
 explainCheck(run(`JSON.stringify(QUEST.state().explain[0])`)===JSON.stringify({tries:[wrong],right:true}),'copied result log');
 run("constCopy=QUEST.state();constCopy.explain[0].tries.push('x')");
 explainCheck(run('Q.explain[0].tries.length===1'),'state copy is independent');
 const before=run('JSON.stringify(QUEST.state())');run(`QUEST.answer('${wrong}')`);
 explainCheck(run('JSON.stringify(QUEST.state())')===before,'answer outside explain is inert');
}
for(const phase of ['intro','predict','act','observe','confirm']){
 run(`QUEST.go(0);QUEST.skip('${phase}')`);const before=run('JSON.stringify(QUEST.state())');run("QUEST.answer('b')");
 explainCheck(run('JSON.stringify(QUEST.state())')===before,`${phase} ignores answer`);
}
run("QUEST.skip('explain')");
explainCheck(run("Q.flags.explain.order.slice().sort().join('')==='abc'&&Q.flags.explain.tries.length===0&&!Q.flags.explain.right"),'skip initializes explanation');
for(let i=0;i<12;i++){
 const r=run(`QUEST.auto(${i})`);
 explainCheck(r.passed&&r.phase==='card'&&r.stars===3,`Q${i+1} auto still finishes`);
}

// U4b: completed pulls, explanation choices, stars, cards and stationary force state.
let newChecks=0;
const newCheck=(ok,label)=>{assert(ok,'U4b: '+label);newChecks++;};
for(const i of [7,8]){
 for(const [pick,stars] of [[1,3],[0,2]]){
  run(`QUEST.go(${i});step(90,1/30);QUEST.pick(${pick});`);
  newCheck(run('QUEST.sample().n===5&&QUEST.sample().rivalN===5'),'starts at five versus five');
  if(i===8)run("set('n',6);step(30,1/30)");
  run('QUEST.pull();step(40,1/30)');
  newCheck(run("Q.phase==='observe'&&Q.flags.observations.at(-1).rivalN===5"),'completed rival observation');
  newCheck(run("Q.flags.events.at(-1).winner") === (i===7?'tie':'kids'),'recorded match outcome');
  run('step(60,1/30)');newCheck(run("Q.phase==='explain'"),'natural explanation entry');
  for(const wrong of run(`EXPLAIN[${i+1}].options.filter(o=>!o.correct).map(o=>o.key)`)){
   run(`QUEST.answer('${wrong}')`);
  }
  run('QUEST.answer(QUEST.correctKey())');
  newCheck(run(`Q.phase==='card'&&Q.stars[${i}]===${stars}&&Q.completed.has(${i})`),'correct reason reaches card; prediction sets stars');
 }
 run(`QUEST.auto(${i})`);
 for(const phase of ['act','observe','confirm','explain','card']){
  run(`QUEST.phase('${phase}')`);
  newCheck(run('QUESTS[Q.i].layers.includes(GRAMMAR.LAYERS[0])&&QUESTS[Q.i].layers.includes(GRAMMAR.LAYERS[2])'),'both force and limit layers requested');
  newCheck(run('GRAMMAR.enabled[GRAMMAR.LAYERS[0]]&&GRAMMAR.enabled[GRAMMAR.LAYERS[2]]'),'force layers stay enabled '+phase);
  newCheck(run('PHYS.grammarState(QUEST.sample().n,QUEST.sample().species,QUEST.sample().mu,Math.PI,QUEST.sample().rivalN).forces.slice(0,2).every(f=>f.length>0)'),'stationary arrows retain nonzero length');
 }
 for(const candidate of run(`QUESTS[${i}].candidates`))for(const time of [0,.25,1.2,2.5]){
  const s={n:5,rivalN:6,species:run('SPECIES_KEYS[0]'),mu:.55};
  for(const call of [`CARDS.picture(${i+1},${JSON.stringify(candidate)},${time},${JSON.stringify(s)})`,`CARDS.actual(${i+1},${JSON.stringify(s)})`,`CARDS.principle(${i+1},${JSON.stringify(s)})`]){
   const svg=run(call);newCheck(svg.startsWith('<svg')&&!/NaN|undefined/.test(svg),'valid SVG');
  }
 }
}
run("QUEST.go(8);QUEST.phase('act');set('n',6);step(60,1/30)");
newCheck(run("Q.phase==='act'&&!QUESTS[8].judge(QUEST.sample())&&Q.flags.observations.length===0"),'one extra child without a pull never succeeds');
newCheck(run("QUEST.focus()==='play'"),'one child difference focuses play');
run("QUEST.pull();step(8,1/30);set('rival',6);step(40,1/30)");
newCheck(run("Q.flags.pending===null&&Q.flags.observations.length===0&&Q.phase==='act'"),'rival edit cancels pending pull');
newCheck(run("QUEST.focus()==='rail'"),'equal counts focus rail');
// Also exercise the snapshot comparison when state changes without the UI edit callback.
run("QUEST.go(8);QUEST.phase('act');set('n',6);step(30,1/30);QUEST.pull();step(8,1/30);S.rivalN=6;step(40,1/30)");
newCheck(run('Q.flags.pending===null&&Q.flags.observations.length===0'),'pending rival snapshot mismatch cancels');
for(const [n,rival] of [[6,5],[5,6]]){
 run(`QUEST.go(8);QUEST.phase('act');set('n',${n});set('rival',${rival});step(30,1/30);QUEST.pull();step(40,1/30)`);
 newCheck(run("Q.phase==='observe'"),'either team can gain one child');
}
// A failed completed pull must not become successful merely by editing current rivals.
run("QUEST.go(8);QUEST.phase('act');QUEST.pull();step(40,1/30);set('rival',6);step(60,1/30)");
newCheck(run("Q.phase==='act'&&Q.flags.observations.length===1"),'editing after tie is not a new observation');
// Block finalization once to inspect the last completed snapshot/current-state rule directly.
run("QUEST.go(8);QUEST.phase('act');set('n',6);step(30,1/30);const originalJudge9=QUESTS[8].judge;QUESTS[8].judge=()=>false;QUEST.pull();step(40,1/30);QUESTS[8].judge=originalJudge9;set('rival',7);step(60,1/30)");
newCheck(run("Q.phase==='act'&&QUESTS[8].judge(QUEST.sample())"),'last successful pull must match current rival too');
run("set('rival',5);step(1,1/30)");newCheck(run("Q.phase==='observe'"),'restoring completed setup permits finalization');

// Execute actual GRAMMAR visibility/opacity transitions with only scene nodes stubbed.
const grammar=read('src/45-grammar.js');
const layerView=vm.createContext({});
// Same actual visibility loop, using the force groups' material state as the observable output.
vm.runInContext(`const S={layers:{}},DIRECTOR={eventLeft:0};
${grammar.slice(grammar.indexOf('const defaults ='),grammar.indexOf('  const LAYERS='))}
const LAYERS=Object.keys(defaults),transitions=Object.fromEntries(LAYERS.map(n=>[n,{value:0,from:0,target:0,elapsed:.3}]));
const groups=Object.fromEntries(LAYERS.map(n=>[n,{children:[{material:{opacity:1,userData:{alpha:1}}}],position:{},traverse(fn){this.children.forEach(fn)}}]));
${grammar.slice(grammar.indexOf('  function set(values)'),grammar.indexOf('  function clear(group)'))}
function updateVisibility(dt){const lensActive=S.rivalN>0&&S.lens&&transitions["렌즈"].target>0;${grammar.slice(grammar.indexOf('    for(const [name,t]of Object.entries(transitions))'),grammar.indexOf('    groups[LAYERS[5]].children.forEach'))}}
set(Object.fromEntries(LAYERS.map((n,i)=>[n,[0,2].includes(i)])));`,layerView);
for(const eventLeft of [0,1.4,0]){
 vm.runInContext(`DIRECTOR.eventLeft=${eventLeft};updateVisibility(.3)`,layerView);
 newCheck(vm.runInContext('[0,2].every(i=>groups[LAYERS[i]].visible&&groups[LAYERS[i]].children[0].material.opacity>0)',layerView),'actual force layer visibility survives stationary scene and replay');
}
newCheck(run('CONCEPTS_OF[8][0]===2')&&run('conceptHTML(8)').includes(run('CONCEPTS[1].ko')),'N1 chip starts with equilibrium');
// Read the visible flag position for both choices and both possible larger teams.
const flagX=svg=>Number([...svg.matchAll(/d="M([\d.]+) 135v-42/g)][0]?.[1]);
for(const [n,rivalN] of [[6,5],[5,6]]){
 const s=JSON.stringify({n,rivalN,species:run('SPECIES_KEYS[0]'),mu:.55});
 const more=flagX(run(`CARDS.picture(9,{flag:'more'},0,${s})`));
 const less=flagX(run(`CARDS.picture(9,{flag:'less'},0,${s})`));
 newCheck(n>rivalN?more<150&&less>150:more>150&&less<150,'more and less follow team sizes');
 newCheck(flagX(run(`CARDS.actual(9,${s})`))===more,'actual flag follows winning team');
}
console.log(`U4b: passed ${newChecks}, failed 0 (scene/DOM boundaries stubbed; browser visuals unverified)`);

// U5a: observe a tie first, then a one-child difference; never finish on an edit.
let tensionChecks=0;
const tensionCheck=(ok,label)=>{assert(ok,'U5a: '+label);tensionChecks++;};
for(const [pick,stars] of [[0,3],[1,2]]){
 run(`QUEST.go(9);step(90,1/30);QUEST.pick(${pick})`);
 tensionCheck(run("QUEST.focus()==='play'&&QUEST.sample().n===5&&QUEST.sample().rivalN===5"),'initial setup and focus');
 run('QUEST.pull();step(40,1/30)');
 tensionCheck(run("Q.phase==='act'&&Q.flags.observations.length===1&&QUEST.focus()==='rail'"),'tie alone stays in act');
 run("set('n',6);step(30,1/30)");
 tensionCheck(run("Q.phase==='act'&&QUEST.focus()==='play'"),'edit focuses play without completing');
 run('QUEST.pull();step(40,1/30)');
 tensionCheck(run("Q.phase==='observe'&&Q.flags.observations.length===2&&S.t.value===Math.PI"),'second completed pull succeeds and stops');
 run('step(60,1/30)');
 tensionCheck(run("Q.phase==='explain'"),'explanation entry');
 for(const wrong of ['a','c']){
  run(`QUEST.answer('${wrong}')`);
 }
 run('QUEST.answer(QUEST.correctKey())');
 tensionCheck(run(`Q.phase==='card'&&Q.stars[9]===${stars}`),'prediction alone controls stars');
}
run('QUEST.auto(0)');
for(const mutation of ["EXPLAIN[10].bridge={ko:''}","EXPLAIN[10].bridge={ko:42}","EXPLAIN[10].bridge=null"]){
 assert.throws(()=>vm.runInNewContext(questSource.replace('validateExplain(QUESTS);',mutation+';validateExplain(QUESTS);'),{console,structuredClone}),/explain:/);tensionChecks++;
}
run("QUEST.go(9);QUEST.phase('act');set('n',6);step(30,1/30);QUEST.pull();step(40,1/30);set('n',5);step(30,1/30);QUEST.pull();step(40,1/30)");
tensionCheck(run("Q.phase==='act'&&Q.flags.observations.length===2"),'reversed observation order cannot finish');
run("QUEST.go(9);QUEST.phase('act');QUEST.pull();step(40,1/30);set('n',6);step(30,1/30);const judge10=QUESTS[9].judge;QUESTS[9].judge=()=>false;QUEST.pull();step(40,1/30);QUESTS[9].judge=judge10;set('rival',7);step(30,1/30)");
tensionCheck(run("Q.phase==='act'&&QUESTS[9].judge(QUEST.sample())"),'current state must match final completed observation');
run("set('rival',5);step(1,1/30)");tensionCheck(run("Q.phase==='observe'"),'matching completed setup permits success');
// Execute the real drawing function; capture mesh/rod commands at the GPU boundary.
class MeterGroup{constructor(){this.children=[];this.position={set(){}};}add(child){this.children.push(child);}}
const meterContext=vm.createContext({THREE:{Group:MeterGroup,MeshBasicMaterial:class{},CircleGeometry:class{},TorusGeometry:class{},DoubleSide:2},
 KIT:{rod:(a,b,r,material,group)=>group.add({a,b,r}),mesh(){},ball(){}},V3:(x,y,z)=>({x,y,z})});
const hero=read('src/40-hero.js');
vm.runInContext(read('src/15-physics.js')+`const S={rivalN:5,t:0},INK_CFG={diagram:{ink:0,screen:0xffffff}};`+hero.slice(hero.indexOf('function drawTensionMeters('),hero.indexOf('const SPECIES_KEYS=')),meterContext);
for(const [n,rivalN,si]of [[5,5,0],[6,5,0],[5,6,0],[5,0,0],[5,0,4]]){
 const readings=[];
 for(const phase of [0,Math.PI]){
  readings.push(vm.runInContext(`S.rivalN=${rivalN};S.t=${phase};(()=>{const group=new THREE.Group();drawTensionMeters(group,PHYS.tensionOf(${n},Object.keys(PHYS.SPECIES)[${si}],S.rivalN,.55));return group.children.map(d=>d.children.find(o=>o.r===.017).b);})()`,meterContext));
 }
 tensionCheck(readings.every(tips=>tips.length===3&&tips.every(tip=>Math.hypot(tip.x,tip.y)>0&&tip.x===tips[0].x&&tip.y===tips[0].y)),'three equal nonzero needles in rival and dinosaur modes');
 tensionCheck(JSON.stringify(readings[0])===JSON.stringify(readings[1]),'stopped scene retains all needle readings');
}
tensionCheck(run("EXPLAIN[10].q.ko")==='줄 가운데 저울은 왜 그 값을 가리켰을까요?','exact explanation question');
tensionCheck(run("EXPLAIN[10].options[0].ko")==='저울은 양쪽 힘을 더해서 보여 줘요'&&run("EXPLAIN[10].options[0].hint.ko")==='저울 눈금은 한 팀의 화살표와 같았어요. 두 팀 힘의 합이 아니에요.','exact sum misconception and hint');
tensionCheck(run("EXPLAIN[10].options[2].ko")==='이기는 팀 쪽 줄이 더 팽팽해요'&&run("EXPLAIN[10].options[2].hint.ko")==='6 대 5에서도 양쪽 끝 저울이 같은 값을 가리켰어요.','exact winning-side misconception and hint');
console.log(`U5a: passed ${tensionChecks}, failed 0 (DOM boundary stubbed; GPU visuals are estimates)`);

let lensChecks=0;
const lensCheck=(ok,label)=>{assert(ok,'U5b: '+label);lensChecks++;};
run("QUEST.go(10);QUEST.phase('act')");
lensCheck(run("QUEST.sample().lens===null&&QUEST.sample().lensVisited.length===0&&QUEST.focus()==='play'"),'initial lens and focus');
for(const value of ['rope','A','B']){
 run(`set('lens','${value}')`);
 lensCheck(run(`QUEST.sample().lens==='${value}'&&QUEST.sample().lensVisited.includes('${value}')`),'selected object sampled '+value);
}
run("QUEST.go(10);QUEST.phase('act');QUEST.pull();step(8,1/30);set('lens','rope')");
lensCheck(run('Q.flags.pending!==null&&S.playing.target===1'),'lens selection preserves in-progress pull');
run("QUEST.go(10);QUEST.phase('act')");

run("set('lens','rope');set('lens','A');set('lens','B');set('lens','rope');step(40,1/30)");
lensCheck(run("Q.phase==='act'&&Q.flags.observations.length===0&&QUEST.sample().lensVisited.length===3"),'all lenses without a pull cannot finish; visits unique');
for(const v of ["null","0","''","'none'"]){
 run(`set('lens','rope');set('lens',${v})`);
 lensCheck(run('QUEST.sample().lens===null'),'clear lens '+v);
}
for(const v of ["'bad'","1","undefined","{}"]){
 assert.throws(()=>run(`set('lens',${v})`),e=>e.name==='RangeError');lensChecks++;
}
run("set('rival',0);set('lens','rope')");
lensCheck(run('QUEST.sample().lens===null'),'dinosaur ignores lens');
run("set('rival',5);set('lens','A');QUEST.go(10)");
lensCheck(run('QUEST.sample().lens===null&&QUEST.sample().lensVisited.length===0'),'go resets lens and visits');
for(const [pick,stars]of [[2,3],[0,2]]){
 run(`Q.completed.delete(10);QUEST.go(10);step(90,1/30);QUEST.pick(${pick});QUEST.pull();step(40,1/30)`);
 lensCheck(run("Q.phase==='act'&&QUEST.focus()==='lens'&&S.t.value===Math.PI"),'completed pull waits for lens');
 run("set('lens','rope');step(1,1/30);set('lens','A');step(1,1/30)");
 lensCheck(run("Q.phase==='act'&&QUEST.sample().lens==='A'"),'two lens selections insufficient and sampled');
 run("set('lens','B');step(60,1/30)");
 lensCheck(run("Q.phase==='explain'"),'three lens selections lead to explanation');
 for(const wrong of ['a','c']){
  run(`QUEST.answer('${wrong}')`);
 }
 run("QUEST.answer('b')");
 lensCheck(run(`Q.phase==='card'&&Q.stars[10]===${stars}`),'card and expected stars');
}
lensCheck(run("missionText(10,'intro')")==='힘의 합이 0이 아닌 물체는 무엇일까요?','exact mission question');
lensCheck(run("missionText(10,'act',{focus:'lens'})")==='줄, 왼쪽 팀, 오른쪽 팀을 차례로 눌러 보세요','exact lens action');
lensCheck(run("EXPLAIN[11].q.ko")==='줄의 힘은 같은데 왜 한 팀만 끌려갈까요?','exact explanation question');
lensCheck(run("EXPLAIN[11].options[0].ko")==='줄의 힘이 한쪽이 더 커서요'&&run("EXPLAIN[11].options[0].hint.ko")==='줄을 골라 봐요. 줄 양 끝의 힘은 같았어요.','exact first misconception');
lensCheck(run("EXPLAIN[11].options[2].ko")==='이기는 쪽 줄이 더 힘을 줘요'&&run("EXPLAIN[11].options[2].hint.ko")==='이기는 쪽과 지는 쪽 줄이 당기는 힘은 같았어요.','exact second misconception');
lensCheck(run("QUESTS.slice(0,10).every(q=>!q.lens)&&QUESTS[10].lens"),'only N4 enables student lens tool');
lensCheck(vm.runInContext("LAYERS[9]==='렌즈'&&defaults['렌즈']===false",layerView),'appended off lens layer');
vm.runInContext("S.rivalN=5;S.lens='B';set({'렌즈':true});updateVisibility(.3)",layerView);
lensCheck(vm.runInContext("groups['렌즈'].visible&&![0,2].some(i=>groups[LAYERS[i]].visible)&&[0,2].every(i=>transitions[LAYERS[i]].target===1)",layerView),'lens hides previous arrows without changing selected layers');
vm.runInContext("S.lens=null;updateVisibility(.3)",layerView);
lensCheck(vm.runInContext("[0,2].every(i=>groups[LAYERS[i]].visible)",layerView),'clearing lens restores arrows');
const lensCandidates=run('QUESTS[10].candidates.map(c=>CARDS.picture(11,c))');
lensCheck(new Set(lensCandidates).size===3&&lensCandidates.every(s=>s.includes('stroke-dasharray="4 4"')),'three distinct highlighted objects');
const principle11=run('CARDS.principle(11,QUEST.sample())');
lensCheck((principle11.match(/r="5" fill="none"/g)||[]).length===2&&principle11.includes('stroke-dasharray="4 4"'),'principle shows two equilibrium circles and net arrow');

// Run the actual lens drawing function; observe positions, lengths and styles at the GPU boundary.
class LensGroup{
 constructor(){this.children=[];this.position={set:(x,y,z)=>{this.xyz=[x,y,z];}};this.scale={x:1,set(x,y,z){Object.assign(this,{x,y,z});}};}
 add(child){this.children.push(child);}
}
const drawContext=vm.createContext({THREE:{Group:LensGroup,TorusGeometry:class{}},
 KIT:{mesh:(geometry,material,group,x,y,z)=>group.add({circle:[x,y,z]}),line(points,color,group,dashed){group.lines??=[];group.lines.push({points,color,dashed});}},
 V3:(x,y,z)=>({x,y,z})});
vm.runInContext(read('src/15-physics.js')+`
 const S={rivalN:5,lens:'rope',t:{value:0}},INK_CFG={diagram:{pull:1,friction:2,ink:3}};
 const groups={'렌즈':new THREE.Group()},ink=x=>x;
 function arrow(group,glyph,x,y,color,dashed){group.glyph=glyph;group.color=color;group.dashed=dashed;}
 `+grammar.slice(grammar.indexOf('  function drawLens(d)'),grammar.indexOf('  // Seeded, additive')),drawContext);
const drawRun=s=>vm.runInContext(s,drawContext);
for(const [n,r]of [[6,5],[5,6],[5,5]])for(const object of ['rope','A','B']){
 const snapshots=[];
 for(const phase of [0,Math.PI]){
  drawRun(`S.rivalN=${r};S.lens='${object}';S.t.value=${phase};groups['렌즈'].children=[];drawLens({n:${n},species:Object.keys(PHYS.SPECIES)[0],mu:.55})`);
  const commands=drawRun("groups['렌즈'].children");
  const loser=object==='A'?n<r:object==='B'?r<n:false;
  lensCheck(commands.length===3,'two forces and one balance/net mark');
  lensCheck(Math.sign(commands[0].scale.x)===(object==='A'?1:-1)&&commands[1].scale.x===-commands[0].scale.x,'screen directions for '+object);
  lensCheck(commands[0].color===1&&commands[1].color===(object==='rope'?1:2),'neutral pull and friction colors');
  lensCheck(loser?commands[1].glyph.length<commands[0].glyph.length:commands[1].glyph.length===commands[0].glyph.length,'correct relative lengths');
  lensCheck(loser?commands[2].dashed&&Math.sign(commands[2].scale.x)===(object==='A'?1:-1):!!commands[2].circle,'net direction or equilibrium circle');
  if(object!=='rope')lensCheck(Math.abs(commands[0].xyz[0]-(object==='A'?-2.39:2.39))<1e-10,'arrows centered above selected team');
  snapshots.push(JSON.stringify(commands));
 }
 lensCheck(snapshots[0]===snapshots[1],'stopped scene retains lens geometry');
}
console.log(`U5b: passed ${lensChecks}, failed 0 (DOM/scene boundaries stubbed; GPU visuals are estimates)`);

// U6: observable control, observation-duration and learning flow requirements.
let pullChecks=0;
const pullCheck=(v,label)=>{assert(v,label);pullChecks++;};
run(hud.slice(hud.indexOf('function controlValue('),hud.indexOf('const raycaster=')));
run('function tick(){}');
run('QUEST.go(11)');
pullCheck(run('S.pullMode&&S.pullP===0&&!Q.flags.sawStatic&&!Q.flags.sawSlip'),'initial pull state');
pullCheck(run("JSON.stringify(QUESTS[11].layers)")===JSON.stringify(['서서히 당기기']),'only static pull layer');
for(const p of [0,.123456,.5,1]){
 run(`set('pull',${p})`);pullCheck(run('QUEST.sample().pullP')===p,'pull sample '+p);
}
for(const [v,type]of [["'0.5'",'TypeError'],['NaN','TypeError'],['Infinity','TypeError'],['null','TypeError'],['-.1','RangeError'],['1.1','RangeError']]){
 assert.throws(()=>run(`set('pull',${v})`),e=>e.name===type);pullChecks++;
}
run("setRailFromPointer(.432123);set('kids',50);set('n',20);set('u',1);step(30,1/30)");
pullCheck(run('S.pullP===.432123&&QUEST.sample().n===5&&controlValue()===.432123'),'continuous pointer fixes population');
for(let i=0;i<11;i++){
 run(`QUEST.go(${i});set('pull',.5)`);
 pullCheck(run('!S.pullMode&&S.pullP===0&&!Q.flags.sawStatic&&!Q.flags.sawSlip'),'reset legacy '+i);
}
run('QUEST.go(0);setRailFromPointer(PHYS.railX(20));step(30,1/30)');
pullCheck(run('QUEST.sample().n===20'),'legacy rail still changes population');
run('QUEST.go(11);QUEST.phase("act");set("pull",.4);step(17,1/30)');
pullCheck(run('!Q.flags.sawStatic&&!Q.flags.sawSlip&&Q.phase==="act"'),'under .6 seconds no observation');
run('step(15,1/30)');
pullCheck(run('Q.flags.sawStatic&&!Q.flags.sawSlip&&Q.phase==="act"&&QUEST.focus()==="slip"'),'static alone insufficient');
run('QUEST.go(11);QUEST.phase("act");set("pull",1);step(90,1/30)');
pullCheck(run('!Q.flags.sawStatic&&Q.flags.sawSlip&&Q.phase==="act"&&QUEST.focus()==="pull"'),'jump skips static evidence');
run('QUEST.go(11);QUEST.phase("act");set("pull",.4);step(10,1/30);set("pull",0);step(1,1/30);set("pull",.4);step(10,1/30)');
pullCheck(run('!Q.flags.sawStatic'),'observation must be continuous');
run('QUEST.go(11);QUEST.phase("predict");set("pull",.4);step(60,1/30)');
pullCheck(run('!Q.flags.sawStatic'),'prediction cannot collect evidence');
run('QUEST.go(11);step(90,1/30);QUEST.pick(0);set("pull",.4);step(25,1/30);set("pull",.9);step(25,1/30);step(60,1/30)');
pullCheck(run('Q.phase==="explain"&&Q.stars[11]===2&&Q.flags.sawStatic&&Q.flags.sawSlip'),'wrong A awards two stars');
run('QUEST.answer("a")');pullCheck(run('Q.phase==="explain"&&!Q.flags.explain.right'),'wrong explanation waits');
run('QUEST.answer("b")');pullCheck(run('Q.phase==="card"&&Q.explain[11].right'),'correct explanation opens card');
pullCheck(run('conceptHTML(12)').includes(run('CONCEPTS[4].ko'))&&run('Q.completed.has(11)'),'concept five completed');
const a12=run('QUEST.auto(11)');pullCheck(a12.passed&&a12.stars===3&&a12.phase==='card','auto 11');
pullCheck(vm.runInContext("LAYERS.at(-1)==='서서히 당기기'&&defaults['서서히 당기기']===false",layerView),'appended disabled layer');
const graphs=run('QUESTS[11].candidates.map(c=>CARDS.picture(12,c))');
pullCheck(new Set(graphs).size===3&&graphs.every(s=>!/<text|NaN|undefined/.test(s)),'three distinct wordless graphs');
// Execute the actual drawing routine using the existing GPU-boundary recorder.
drawRun("const staticGroup=new THREE.Group();groups['서서히 당기기']=staticGroup;INK_CFG.diagram.dino=4;");
drawRun(grammar.slice(grammar.indexOf('  function drawStaticPull(d)'),grammar.indexOf('  // Seeded, additive')));
for(const p of [0,.4,1]){
 drawRun(`S.pullP=${p};staticGroup.children=[];staticGroup.lines=[];drawStaticPull({n:5,mu:.05})`);
 const children=drawRun('staticGroup.children');
 pullCheck(children.length===2,'two directed forces '+p);
 const tick=drawRun('staticGroup.lines[0]');
 pullCheck(tick.dashed&&tick.points.length===2&&tick.points[0].x===tick.points[1].x&&tick.points[0].y<tick.points[1].y,'one vertical dashed limit tick '+p);
 if(p===1)pullCheck(Math.abs(tick.points[0].x+1.8)>children[1].glyph.length*Math.abs(children[1].scale.x),'kinetic arrow shorter than limit tick');
 if(p>0){
  const left=children[1],right=children[0];
  pullCheck(left.scale.x<0&&right.scale.x>0&&left.color===2&&right.color===4,'force directions/colors '+p);
  pullCheck(p===.4?left.glyph.length===right.glyph.length:left.glyph.length<right.glyph.length,'static equality / kinetic reduction '+p);
 }
}
// Actual hero input, displacement, handle positions and onset state at the scene boundary.
const heroSource=read('src/40-hero.js');
const heroView=vm.createContext({});
vm.runInContext(read('src/15-physics.js')+`
 const SPECIES_KEYS=Object.keys(PHYS.SPECIES),GROUND_VALUES=Object.values(PHYS.GROUNDS);
 const S={pullMode:true,pullP:0,u:{value:PHYS.railX(5)},species:{value:3},ground:{value:0},t:{value:0},rivalN:0};
 const Q={flags:{}},DIRECTOR={clock:0,eventLeft:0};
 const RAIL_HANDLE={position:{}},SLIDER={x:0,width:2,handle:{position:{}}},DIAL={knob:{rotation:{}}},FLAG={position:{}};
 ${hud.slice(hud.indexOf('function controlValue('),hud.indexOf('function setRailFromPointer'))}
 ${heroSource.slice(heroSource.indexOf('let previousPullForce='),heroSource.indexOf('function updateHero(){'))}
 function probeHero(){
 ${heroSource.slice(heroSource.indexOf(' const n=PHYS.kidsFromRailX(S.u.value)',heroSource.indexOf('function updateHero(){')),heroSource.indexOf(' const low=S.quality',heroSource.indexOf('function updateHero(){')))}
 ${heroSource.slice(heroSource.indexOf(' const u=controlValue(n)'),heroSource.indexOf(' FLAG_PANEL.material.color'))}
 ${heroSource.slice(heroSource.indexOf(' const age=S.pullMode?'),heroSource.indexOf(' SLIP_DUST.visible='))}
 return {d,age,burst,rail:RAIL_HANDLE.position.x,slider:SLIDER.handle.position.x,dial:DIAL.knob.rotation.z};
 }
`,heroView);
const heroRun=code=>vm.runInContext(code,heroView);
for(const p of [0,.4,1/1.5,1]){
 heroRun(`S.pullP=${p};DIRECTOR.clock+=.1`);const v=heroRun('probeHero()');
 const travel=p>1/1.5?.56*(p-1/1.5)/(1-1/1.5):0;
 pullCheck(Math.abs(v.d.flagX-travel)<1e-12&&v.d.kidSkid===v.d.flagX&&v.d.dinoSkid===0,'team and flag displacement '+p);
 pullCheck(v.rail===run(`PHYS.railWorldX(${p})`)&&v.slider===(p-.5)*2&&v.dial===-p*Math.PI*1.7,'all three handles use continuous value '+p);
 pullCheck(v.d.slip===(p>1/1.5),'hero slip uses physics '+p);
}
pullCheck(heroRun('probeHero().burst'),'first threshold crossing emits dust');
heroRun('DIRECTOR.clock+=2');pullCheck(!heroRun('probeHero().burst'),'holding slip does not repeat dust');
heroRun('Q.flags={};S.pullP=0;probeHero();S.pullP=.9');pullCheck(heroRun('probeHero().burst'),'new quest resets onset');
heroRun('S.pullMode=false;S.u.value=PHYS.railX(20)');const legacy=heroRun('probeHero()');
pullCheck(legacy.rail===run('PHYS.railWorldX(PHYS.railX(20))'),'legacy handles retain count position');
run('QUEST.go(11);QUEST.mode(true);set("pull",.8)');pullCheck(run('!S.pullMode&&S.pullP===0'),'free mode disables pull');
pullCheck(run("EXPLAIN[12].q.ko")==='마찰 화살표는 왜 처음엔 짧다가 길어졌을까요?'&&run("EXPLAIN[12].recap.ko")==='마찰은 필요한 만큼만 생겨요. 한계를 넘으면 미끄러져요.','exact explanation and recap');
pullCheck(run("MISSION[11].ask.ko")==='마찰은 처음부터 가장 크게 버틸까요?'&&run("MISSION[11].right.ko===MISSION[11].wrong.ko"),'exact mission and neutral result');
console.log(`U6: passed ${pullChecks}, failed 0 (DOM/GPU boundaries stubbed; browser visuals are estimates)`);

await import('./hud-check.mjs');
