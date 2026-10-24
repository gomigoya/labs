// Browser-free checks of displayed text; actual layout is checked by capture.mjs.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const node={hidden:false,textContent:'',style:{},getAnimations:()=>[],animate(){this.fades=(this.fades||0)+1;}};
const context=vm.createContext({document:{getElementById:id=>id==='mission'?node:{getBoundingClientRect:()=>({bottom:100})}},
 matchMedia:()=>({matches:false}),Q:{i:0,phase:'intro',free:false},T:{mode:'student'},
 QUEST:{correct:()=>true,sample:()=>({})},PHYS:{judgeQ2:()=>false,judgeQ4:()=>false}});
assert(fs.existsSync(new URL('../src/67-mission.js',import.meta.url)),'mission banner implementation is required');
vm.runInContext(read('src/67-mission.js'),context);
const run=code=>vm.runInContext(code,context);
let checks=0;
for(let i=0;i<6;i++)for(const phase of ['intro','predict','act','observe','confirm','card','free']){
 for(const correct of [true,false])for(const compareReady of [true,false]){
  const text=run(`missionText(${i},'${phase}',{correct:${correct},compareReady:${compareReady}})`);
  assert.equal(typeof text,'string');assert(text.trim());assert([...text].length<=32,text);
  assert(!/[\p{Extended_Pictographic}\r\n]/u.test(text),text);checks++;
 }
}
run('syncMission()');assert(node.textContent.includes('늘어'));assert.equal(node.hidden,false);
const ask=node.textContent;run("Q.phase='predict';syncMission()");assert.notEqual(node.textContent,ask);
assert.equal(node.textContent,'그림 중 하나를 눌러 예상해 보세요');
run("Q.phase='act';syncMission()");assert(node.textContent.includes('끌어'));
const act=node.textContent;run("Q.phase='observe';syncMission()");assert.notEqual(node.textContent,act);
run("Q.free=true;syncMission()");assert.equal(node.textContent,'마음대로 만져 보세요');
run("T.mode='teacher';syncMission()");assert.equal(node.hidden,true);
run("T.mode='free';syncMission()");assert.equal(node.hidden,false);
context.matchMedia=()=>({matches:true});const fades=node.fades;
run("T.mode='student';Q.free=false;Q.phase='card';syncMission()");assert.equal(node.fades,fades);
assert.notEqual(run("missionText(1,'act',{compareReady:false})"),run("missionText(1,'act',{compareReady:true})"));
assert.notEqual(run("missionText(3,'act',{compareReady:false})"),run("missionText(3,'act',{compareReady:true})"));
console.log(`PASS: mission ${checks} quest/phase/outcome contexts; displayed phase/free text, teacher hiding, immediate updates, reduced motion, comparison guidance (DOM boundaries stubbed)`);
