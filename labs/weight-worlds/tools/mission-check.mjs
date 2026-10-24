// Browser-free checks of displayed mission text; layout still needs browser QA.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read = name => fs.readFileSync(new URL(`../src/${name}`, import.meta.url), 'utf8');
assert(fs.existsSync(new URL('../src/67-mission.js', import.meta.url)), 'student mission feature exists');
const banner = {hidden:false,textContent:'',style:{},getAnimations:()=>[],animate(){}};
const ctx = vm.createContext({
  document:{getElementById: id => id==='mission'?banner:{getBoundingClientRect:()=>({bottom:90})}},
  matchMedia:()=>({matches:true})
});
vm.runInContext(read('67-mission.js')+`
const Q={i:0,phase:'intro',free:false,pick:'B',stars:[3],flags:{visited:[],runs:[]}};
const T={mode:'student'};
const S={body:{value:0,target:0},nWeights:{value:5},playing:{target:0},sound:{target:0}};
const toolbar={dataset:{key:'0:5:0:0'}};
`+read('60-interaction-hud.js').split('const raycaster=')[0].slice(read('60-interaction-hud.js').indexOf('function syncUI()')),ctx);
const run = code => vm.runInContext(code,ctx);
let count=0;
for(let i=0;i<7;i++)for(const phase of ['intro','predict','act','observe','confirm','card'])for(const stars of [2,3]){
  run(`Q.i=${i};Q.phase='${phase}';Q.stars[${i}]=${stars};syncUI()`);
  assert(banner.textContent.trim(),`quest ${i+1}/${phase} is nonempty`);
  assert([...banner.textContent].length<=32,`quest ${i+1}/${phase} <=32 characters`);
  assert.equal(banner.hidden,false);count++;
}
run("Q.i=0;Q.phase='intro';syncUI()");const intro=banner.textContent;
run("Q.phase='predict';syncUI()");assert.notEqual(banner.textContent,intro);
run("Q.phase='act';syncUI()");const act=banner.textContent;
run("Q.phase='observe';syncUI()");assert.notEqual(banner.textContent,act);
run("Q.free=true;syncUI()");assert.equal(banner.textContent,'마음대로 만져 보세요');
run("T.mode='teacher';syncUI()");assert.equal(banner.hidden,true);
run("T.mode='student';Q.free=false;syncUI()");assert.equal(banner.hidden,false);
for(const text of run('MISSION.flatMap(row=>Object.values(row).flatMap(v=>typeof v===\'string\'?[v]:Object.values(v)))')){
  assert(text.trim()&&[...text].length<=32);assert(!/\p{Extended_Pictographic}/u.test(text));
}
for(const [i,body,nWeights,flags] of [
  [1,0,5,{visited:[0],runs:[]}],[1,1,5,{visited:[1],runs:[]}],
  [3,7,1,{visited:[],runs:[]}],
  [4,0,5,{visited:[],runs:[{i:0}]}],[4,1,5,{visited:[],runs:[{i:1}]}]
]){
  run(`Q.i=${i};Q.phase='act';Q.flags=${JSON.stringify(flags)};S.body.target=${body};S.nWeights.target=${nWeights};syncUI()`);
  assert(banner.textContent.trim()&&[...banner.textContent].length<=32);
}
console.log(`미션: ${count}개 단계·결과 조합 및 전환·모드·추가 안내 통과, 실패 0 (DOM 경계 대역; 실제 배치 미검증)`);
