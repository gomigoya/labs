// Run real HUD rendering with only the browser/3D boundary replaced.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
assert(fs.existsSync(new URL('../src/67-mission.js',import.meta.url)), 'student mission banner is missing');
const elements=new Map();
function element(){const props={};return {textContent:'',hidden:false,style:{setProperty(k,v){props[k]=v},getPropertyValue(k){return props[k]||''}},dataset:{},children:[],
 classList:{toggle(){}},setAttribute(k,v){this[k]=v},removeAttribute(){},replaceChildren(){this.children=[]},append(el){this.children.push(el);if(el.id)elements.set(el.id,el)},
 getBoundingClientRect(){return {bottom:194,height:42}},getAnimations(){return []},animate(){},querySelector(){return null}};}
const document={body:element(),documentElement:element(),createElement:element,getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id)}};
const context=vm.createContext({document,console,matchMedia:()=>({matches:true}),getComputedStyle:()=>({display:'block'}),innerWidth:375});
const hud=read('src/60-interaction-hud.js');
const section=(start,end)=>hud.slice(hud.indexOf(start),hud.indexOf(end,hud.indexOf(start)));
vm.runInContext(read('src/15-physics.js')+`
const GRAMMAR={LAYERS:[]},T={mode:'student'},DIRECTOR={};
const S={playing:{target:0},sound:{target:0},mode:{target:0}};
const icon=()=>'',qButton=(a,b,c,parent)=>{const el=document.createElement('button');parent.append(el);return el};
const qPictures=document.getElementById('q-pictures'),qViews=document.getElementById('q-views'),qLayers=document.getElementById('q-layers');
let samplePhi=0,sampleP=86164.1;
const currentPhi=()=>samplePhi,currentPeriod=()=>sampleP;
`+read('src/66-cards.js')+read('src/65-quests.js')+read('src/67-mission.js')+
section('function syncUI(){','const raycaster=')+section('function questUI(){','Object.assign(ICONS,{'),context);
const run=s=>vm.runInContext(s,context);
const banner=()=>document.getElementById('mission');
let checks=0;
function copy(){const text=banner().textContent;assert(text.trim());assert([...text].length<=32,text);checks++;return text;}
// Missing phase copy, overlong copy or a broken HUD refresh must fail here.
for(let i=0;i<6;i++){
 run(`Q.i=${i};Q.free=false;Q.flags={};Q.pick=QUESTS[Q.i].answerKey;`);
 const seen=[];
 for(const phase of ['intro','predict','act','observe','confirm','card']){
  run(`QUEST.phase('${phase}')`);seen.push(copy());assert.equal(banner().hidden,false);
 }
 assert.notEqual(seen[0],seen[1],'question must change to prediction instruction');
 assert.notEqual(seen[1],seen[2],'prediction must change to manipulation instruction');
 assert.notEqual(seen[2],seen[3],'achieved goal must change to observation instruction immediately');
 for(const phase of ['confirm','card']){run(`Q.pick='wrong';QUEST.phase('${phase}')`);assert.notEqual(copy(),seen[4]);}
 run('Q.free=true;questUI()');assert.equal(copy(),'마음대로 만져 보세요');
 run(`T.mode='teacher';questUI()`);assert.equal(banner().hidden,true);
 run(`T.mode='free';syncUI()`);assert.equal(banner().hidden,false);copy();
 run(`T.mode='student';Q.free=false`);
}
// Instructions must advance when the relevant real sample/evidence changes.
for(const [i,change] of [[0,'Q.flags.speedSeen=true'],[1,'samplePhi=60'],[2,'S.run={measurement:{runId:1}}'],[3,"S.mode.target=1"],[3,'sampleP=30*86400']]){
 run(`Q.i=${i};Q.free=false;Q.flags={};QUEST.phase('act')`);const before=copy();
 run(change+';syncUI()');assert.notEqual(copy(),before,'next available action must replace the previous instruction');
}
assert.equal(banner().role,'status');assert.equal(banner()['aria-live'],'polite');
console.log(`PASS: mission ${checks} copy/length checks; 6 quest phase transitions, teacher hiding and free mode (DOM boundary stubbed)`);
