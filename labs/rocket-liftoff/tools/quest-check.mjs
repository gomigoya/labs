// Browser-free checks: real PHYS, input actions, quest engine and physical loop; render seams only are stubbed.
process.env.TEMP=process.env.TMP='D:/CodexWork/Temp';
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8');
for(const file of fs.readdirSync(new URL('src/',root)).filter(n=>n.endsWith('.js')))execFileSync(process.execPath,['--input-type=module','--check'],{input:read(`src/${file}`)});
for(const file of ['tools/capture.mjs','tools/quest-check.mjs'])execFileSync(process.execPath,['--check',fileURLToPath(new URL(file,root))]);
const assembled=read('index.html').match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];assert(assembled);execFileSync(process.execPath,['--input-type=module','--check'],{input:assembled});
const context=vm.createContext({console,structuredClone});
const grammar=read('src/45-grammar.js'),hud=read('src/60-interaction-hud.js'),loop=read('src/70-loop.js');
const setup=`
const elements=new Map();
class Element{constructor(){this.children=[];this.style={};this.dataset={};this.classList={add(){},remove(){},toggle(){}};}append(...c){this.children.push(...c);}insertBefore(c){this.append(c);}setAttribute(){}removeAttribute(){}addEventListener(){}replaceChildren(){this.children=[];}querySelectorAll(){return [];}animate(){}getBoundingClientRect(){return{top:0,bottom:0};}}
const document={body:new Element(),createElement:()=>new Element(),getElementById(id){if(!elements.has(id))elements.set(id,new Element());return elements.get(id);}};
const canvas=new Element(),LANG='en',innerWidth=1440,innerHeight=900;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),pair=value=>({value,target:value});
const S={engines:pair(0),load:pair(0),g:pair(0),t:pair(0),playing:pair(0),ignited:pair(0),sound:pair(0),ui:pair(1),layers:{},drag:null,fly:null,vertical:false,frames:0};
function selection(){return PHYS.sceneSelection(S.engines.value,S.load.value,S.g.value);}
const controls={enabled:true,update(){}},bokehPass={uniforms:{focus:{}}},camera={position:{distanceTo(){return 1;}}},composer={render(){}};
function shot(){}function updateHero(){}function drawGraphs(){}
const DIRECTOR={eventLeft:0,clear(){this.eventLeft=0;},intro(){},push(){},event(){this.eventLeft=1.4;},chord(){},time(dt){return dt*(this.eventLeft>0?.18:1);},update(dt){this.eventLeft=Math.max(0,this.eventLeft-dt);}};
const GRAMMAR=(()=>{${grammar.match(/const LAYERS=[^;]+;/)[0]}let baseline=null;const enabled={};return{LAYERS,defaults:{},enabled,set(v){Object.assign(enabled,v);},unpin(){baseline=null;},${grammar.match(/function pin\(record\)\{[^\n]+/)[0].replace('function pin(record)','pin(record)').replace("curveKey='';",'')},get baseline(){return baseline;},update(){}};})();
`;
vm.runInContext(read('src/15-physics.js')+setup+hud.slice(0,hud.indexOf('// Enlarged geometric hit regions'))+read('src/66-cards.js')+read('src/65-quests.js')+hud.slice(hud.indexOf('Object.assign(LABELS,'))+loop.slice(0,loop.indexOf('function layer(')),context);
const run=code=>vm.runInContext(code,context);
const rows=run('QUESTS.map(d=>({id:d.id,candidates:d.candidates.map(c=>c.key),answerKey:d.answerKey}))');
assert.equal(rows.length,6);
for(const [i,row]of rows.entries()){
 assert(row.candidates.length>=2&&row.candidates.length<=3);assert(row.candidates.includes(row.answerKey));assert(read('src/65-quests.js').includes(`PHYS.judgeQ${i+1}(s)`));
 console.log(`Q${i+1}: candidates=${row.candidates.length}, answer=${row.answerKey}, judge=PHYS`);
}
for(let i=0;i<6;i++){
 const result=run(`QUEST.auto(${i})`);assert(result.passed&&result.judge&&result.phase==='card',JSON.stringify(result));
 console.log(`auto(${i}): ${JSON.stringify(result)}`);
 for(const t of [0,.25,1.2,2.5]){
  const output=run(`QUESTS[${i}].candidates.map(c=>CARDS.picture(${i+1},c,${t})).join('')+CARDS.actual(${i+1},Q.flags.success)+QUESTS[${i}].card(Q.flags.success)`);
  assert(!/NaN|Infinity|undefined|<text\b|<img\b/.test(output),`Q${i+1} invalid SVG`);
  assert(!/>[^<]*[\p{L}\p{N}][^<]*</u.test(output),`Q${i+1} visible text`);
 }
}
run(`QUEST.go(1);step(90,1/30);QUEST.pick(0);set('engines',5);step(30,1/30);action('play');step(120,1/30);`);
assert.equal(run('Q.stars[1]'),2);assert(run('QUEST.passed'));
console.log('PASS: wrong prediction completes with two stars');
run(`QUEST.go(0);step(90,1/30);QUEST.pick(2);action('play');step(60,1/30);S.playing.value=S.playing.target=0;step(120,1/30);`);
assert.equal(run('Q.phase'),'act');assert.equal(run('Q.flags.hold'),0);assert.equal(run('QUESTS[0].judge(QUEST.sample())'),false);
run(`QUEST.go(2);step(90,1/30);QUEST.pick(1);action('play');step(60,1/30);QUEST.open('inspect');step(3,1/30);S.drag={kind:'graph'};step(20,1/30);`);
assert.equal(run('Q.flags.hold'),0);assert.equal(run('Q.phase'),'act');
run(`S.drag=null;set('engines',5);step(120,1/30);`);assert.equal(run('Q.phase'),'act');assert.equal(run('Q.flags.accelerationSeen'),false);
console.log('PASS: paused pre-burnout and interrupted pending observation never complete; new condition clears evidence');
run(`QUEST.go(3);step(90,1/30);QUEST.pick(1);QUEST.open('pin');const first=Q.flags.before.runId;QUEST.open('inspect');`);
assert.equal(run('QUESTS[3].judge(QUEST.sample())'),false);
run(`set('load',500000);step(30,1/30);action('play');step(30,1/30);`);
assert.equal(run('QUESTS[3].judge(QUEST.sample())'),false);
run(`QUEST.open('inspect');step(120,1/30);`);assert(run('QUESTS[3].judge(QUEST.sample())'));assert(run('Q.flags.before.runId===first'));
console.log('PASS: comparison needs a newer run and explicit observation; pinned record is immutable');
run(`QUEST.go(1);step(90,1/30);const old=S.engines.target;action('plus');`);assert(run('S.engines.target===old'));assert.equal(run('Q.phase'),'predict');
run(`QUEST.pick(2);set('engines',5);step(30,1/30);action('play');step(120,1/30);`);assert.equal(run('selection().n'),5);
run(`QUEST.mode(true);action('minus');step(30,1/30);`);assert.equal(run('selection().n'),4);
console.log('PASS: prediction input lock, success state preservation and free controls');
for(let i=0;i<6;i++)for(const phase of ['intro','predict','act','event','confirm','card']){
 const output=run(`QUEST.go(${i});QUEST.skip('${phase}');qPictures.innerHTML||''`);assert(!/NaN|Infinity|undefined|<text\b/.test(output));
}
console.log('PASS: every quest and debug phase builds without missing-record values');
for(const file of fs.readdirSync(new URL('src/',root)).filter(n=>n.endsWith('.js'))){assert(!/Math\.random|<text\b|fillText\s*\(|strokeText\s*\(|<img\b|title=/.test(read(`src/${file}`)),file);}
console.log('PASS: module syntax, assembled module, six real-PHYS auto paths, finite SVGs and static no-text/raster/random checks');
console.log('NOT RUN: browser textAudit, rendering, input events, sound and mobile layout; use tools/capture.mjs.');
