import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
let checks=0;const check=(ok,label)=>{assert(ok,label);checks++;};
class Node {
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attributes={};this.style={setProperty(){}};this.classList={add:()=>{}};this.hidden=false;this.className='';}
 append(...ns){for(const n of ns){if(n.parentElement)n.parentElement.children=n.parentElement.children.filter(x=>x!==n);n.parentElement=this;this.children.push(n);}}
 replaceChildren(...ns){this.words='';this.children=[];this.append(...ns);}
 setAttribute(k,v){this.attributes[k]=String(v);} getAttribute(k){return this.attributes[k];}
 set textContent(v){this.children=[];this.words=String(v);}get textContent(){return (this.words||'')+this.children.map(c=>c.textContent).join('');}
 set innerHTML(v){this.children=[];this.words=v.replace(/<[^>]*>/g,'');this.markup=v;}get innerHTML(){return this.markup||'';}
 matches(s){return s[0]==='#'?this.id===s.slice(1):s[0]==='.'?this.className.split(' ').includes(s.slice(1)):s[0]==='['?s.slice(1,-1) in this.attributes:this.tagName===s.toUpperCase();}
 querySelectorAll(s){return this.children.flatMap(c=>[...(s.split(',').some(t=>c.matches?.(t))?[c]:[]),...(c.querySelectorAll?.(s)||[])]);}
 querySelector(s){return this.querySelectorAll(s)[0];} contains(n){return n===this||this.children.some(c=>c.contains?.(n));}
 focus(){document.activeElement=this;}animate(){}getAnimations(){return [];}getClientRects(){return [this.getBoundingClientRect()];}getBoundingClientRect(){return {left:10,right:110,top:10,bottom:60,width:100,height:50};}
}
const document={body:new Node('body'),createElement:t=>new Node(t),createTextNode:t=>({textContent:t}),getElementById(id){return this.body.querySelector('#'+id);},querySelectorAll(s){return this.body.querySelectorAll(s);}};
const mission=new Node('p');mission.id='mission';document.body.append(mission);
const context=vm.createContext({console,document,structuredClone,clearTimeout(){},setTimeout(){return 1;},innerWidth:1440,innerHeight:900,window:{},canvas:new Node('canvas')});
const hud=read('src/60-interaction-hud.js');
vm.runInContext(read('src/15-physics.js')+`
let LANG='ko';const SPECIES_KEYS=Object.keys(PHYS.SPECIES),GROUND_VALUES=Object.values(PHYS.GROUNDS),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));const pair=v=>({value:v,target:v});
const S={u:pair(PHYS.railX(1)),species:pair(0),ground:pair(2),t:pair(0),playing:pair(0),sound:pair(0),cassette:pair(0),vertical:false,rivalN:0,pullP:0};const controls={enabled:true},T={mode:'student'};
const GRAMMAR={LAYERS:['marks','steps','limits','overlay','micro','traces','ratio','records','장력계','렌즈','서서히 당기기'],defaults:{},enabled:{},set(v){Object.assign(this.enabled,v)},unpin(){},clearRecords(){},record(){},pin(){}};
const DIRECTOR={clear(){},intro(){},event(){},time:dt=>dt,chord(){},push(){}};function shot(){}function tick(){}function layer(){};
function step(n=1,dt=1/30){for(let i=0;i<n;i++){S.u.value=S.u.target;QUEST.update(dt);}}
const TEACHER={mode(mode){T.mode=mode;QUEST.mode(mode==='free');}};
`+read('src/62-curriculum.js')+read('src/63-explain.js')+read('src/64-ui-text.js')+read('src/65-quests.js')+read('src/66-cards.js')+read('src/67-mission.js')+
hud.slice(hud.indexOf('function set(name,v){'),hud.indexOf('const hudRoot='))+hud.slice(hud.indexOf('const hudRoot=')),context);
const run=s=>vm.runInContext(s,context),node=s=>run(s),buttons=n=>n.querySelectorAll('button');
const expectedControls=[['pull'],['kids','pull'],['kids','pull'],['ground','pull'],['kids','pull'],['species','compare'],['species','pull'],['pull'],['kids','rival','pull'],['kids','rival','pull'],['pull','lens'],['pullSlider']];
for(let i=0;i<12;i++){
 run(`QUEST.go(${i});QUEST.phase('predict')`);
 check(node('header').textContent.includes(run(`text(QUESTS[${i}].title)`)),'quest title '+i);
 check(node('header').textContent.includes(run('experimentPosition()')),'position '+i);
 const picks=buttons(node('qPictures'));check(picks.length===3,'three choices '+i);
 picks.forEach((b,k)=>check(b.textContent.startsWith(run(`text(QUESTS[${i}].candidates[${k}].label)`)),'choice label '+i+'/'+k));
 check(node('controlPanel').querySelectorAll('fieldset').every(n=>n.disabled),'predict controls disabled '+i);
 picks[1].onclick();check(run("Q.phase==='act'&&Q.pick==='B'"),'prediction click '+i);
 check(JSON.stringify(node('controlPanel').querySelectorAll('fieldset').map(n=>n.dataset.control))===JSON.stringify(expectedControls[i]),'only required controls '+i);
 for(const phase of run('PHASES')){run(`QUEST.phase('${phase}')`);check(node('mission').textContent.trim()&&!/삼각형|손잡이를 오른쪽|그림 중 하나/.test(node('mission').textContent),'persistent mission '+i+'/'+phase);const current=node('progress').children.findIndex(n=>n.attributes['aria-current']==='step');check(current==={intro:0,predict:0,act:1,observe:2,confirm:2,explain:3,card:4}[phase],'phase mapping '+phase);}
 run(`QUEST.phase('explain')`);check(!node('qPictures').textContent.includes(run(`text(CONCEPTS.find(c=>c.id===CONCEPTS_OF[${i+1}][0]))`)),'no concept above reason '+i);
 run(`QUEST.phase('card')`);check(node('qPictures').textContent.includes(run(`text(CONCEPTS.find(c=>c.id===CONCEPTS_OF[${i+1}][0]))`)),'concept on card '+i);
}
run('Q.completed.clear();QUEST.go(7);renderQuestList()');check(buttons(node('questList')).length===12,'12 experiment rows');check(node('questList').querySelectorAll('h2').length===3,'three level headings');
for(const b of buttons(node('questList')))check(b.attributes['aria-disabled']===String(!run(`QUEST.unlocked(${b.dataset.quest})`)),'lock state');
const locked=buttons(node('questList')).find(b=>b.attributes['aria-disabled']==='true');locked.onclick();check(run('Q.i')===7&&node('mission').textContent===run("ui('locked')"),'locked click explains');
run('Q.completed.add(7);Q.stars[7]=3;renderQuestList()');check(buttons(node('questList'))[0].textContent.includes('★★★'),'completed stars');
run("QUEST.go(8);QUEST.phase('act')");
let group=name=>node('controlPanel').querySelectorAll('fieldset').find(n=>n.dataset.control===name);
buttons(group('kids')).find(b=>b.textContent==='+').onclick();check(run('PHYS.kidsFromRailX(S.u.target)')===6,'kids plus');
buttons(group('rival')).find(b=>b.textContent==='+').onclick();check(run('S.rivalN')===6,'rival plus');
run("set('kids',100);syncUI()");buttons(group('kids')).find(b=>b.textContent==='+').onclick();check(run('PHYS.kidsFromRailX(S.u.target)')===100,'kids cap');
run("set('rival',20)");buttons(group('rival')).find(b=>b.textContent==='+').onclick();check(run('S.rivalN')===20,'rival cap');
for(const [i,name,index,expr]of [[3,'ground',0,'S.ground.target===0'],[6,'species',1,'S.species.target===1'],[10,'lens',3,"S.lens==='B'"]]){run(`QUEST.go(${i});QUEST.phase('act')`);buttons(group(name))[index].onclick();check(run(expr),'chip '+name);}
run("QUEST.go(11);QUEST.phase('act')");let input=group('pullSlider').querySelector('input');input.value='40';input.oninput();check(run('S.pullP')===.4,'pull range');
run("QUEST.go(7);QUEST.phase('act')");buttons(group('pull'))[0].onclick();check(run('!!Q.flags.pending'),'pull invokes engine');
for(const [i,names]of [[0,['kidForce','dinoForce']],[7,['leftForce','rightForce']],[9,['leftForce','rightForce','tension']],[10,['ropeForce','friction']],[11,['pullSlider','friction','limit']]]){
 run(`QUEST.go(${i});QUEST.phase('act');`+(i===10?"set('lens','B');":''));const rows=run('forceRows(QUESTS[Q.i],QUEST.sample()).rows');check(JSON.stringify(rows.map(r=>r.label))===JSON.stringify(names.map(k=>run(`ui('${k}')`))),'force rows '+i);check(node('forceCard').textContent.includes(' N')===(run('levelOf(Q.i)')>=2),'numeric level '+i);
}
run("QUEST.go(7);QUEST.phase('act')");check(node('forceCard').textContent.includes(run("ui('equal')")),'equal forces text');
for(const [n,rival,si,key]of [[1,0,0,'winKids'],[1,0,4,'winDino'],[5,5,0,'tieTeams'],[6,5,0,'winLeft'],[5,6,0,'winRight'],[1,0,0,'slipped']]){run(`announceResult({n:${n},rivalN:${rival},species:SPECIES_KEYS[${si}],mu:.55},${key==='slipped'})`);check(node('resultNotice').textContent===run(`ui('${key}')`),'result '+key);}
run("QUEST.go(1);QUEST.phase('act');QUEST.pull();step(35)");check(!node('resultNotice').hidden&&run("Q.phase==='act'"),'unsuccessful pull still announces');
run("QUEST.mode(true)");check(node('controlPanel').querySelectorAll('input').filter(n=>n.type==='checkbox').length===11,'free layer checkboxes');
const bilingual=x=>{if(!x||typeof x!=='object')return;if('ko'in x)check(typeof x.en==='string'&&x.en.trim()&&!/[가-힣]/.test(x.en),'English dictionary leaf');for(const v of Object.values(x))bilingual(v);};bilingual(run('UI_TEXT'));bilingual(run('QUEST_UI'));bilingual(run('MISSION'));
const visibleText=n=>n.hidden?'':(n.words||'')+(n.children||[]).map(visibleText).join('');
for(let i=0;i<12;i++)for(const phase of run('PHASES')){run(`LANG='en';QUEST.go(${i});QUEST.phase('${phase}')`);check(!/[가-힣]/.test(visibleText(node('hudRoot'))),'English rendered '+i+'/'+phase);}
// Independent Korean fixtures from the R1 acceptance table.
const titles='작은 공룡과 아이 한 명, 누가 이길까?|트리케라톱스를 이기려면 몇 명?|티라노를 이기려면 몇 명?|바닥을 유리로 바꾸면?|유리 위에서 인원을 늘리면?|큰 공룡은 몸무게에 비해 힘이 셀까?|아이 30명이 이길 수 있는 가장 무거운 공룡은?|맞잡기: 두 팀이 똑같이 당기면?|한 명 더: 한 팀에 한 명만 더 오면?|줄 가운데 저울은 얼마를 가리킬까?|팀을 따로 보기: 힘의 합이 0이 아닌 것은?|서서히 당기기: 마찰은 언제부터 버틸까?'.split('|');
const labels=['공룡이 이긴다|비긴다|아이가 이긴다','5명|20명|50명','100명이어도 진다|60명이면 이긴다|10명이면 이긴다','아이 팀이 이긴다|결과가 똑같다|공룡이 이긴다','마찰 한계는 그대로다|인원이 늘면 한계도 커진다|인원이 늘면 한계가 작아진다','큰 공룡이 몸무게에 비해 더 세다|똑같다|큰 공룡이 몸무게에 비해 더 약하다','벨로키랍토르까지|딜로포사우루스까지|스테고사우루스까지','왼쪽 팀이 이긴다|비긴다(깃발이 멈춘다)|오른쪽 팀이 이긴다','아무 변화 없다|많은 팀 쪽으로 움직인다|적은 팀 쪽으로 움직인다','한 팀이 당기는 힘만큼|두 팀 힘을 더한 만큼|0','줄|이기는 팀|지는 팀','처음부터 최대로 버틴다|당기는 만큼 커지다가 한계에서 미끄러진다|움직일 때만 생긴다'];
for(let i=0;i<12;i++){check(run(`QUESTS[${i}].title.ko`)===titles[i],'exact title '+i);check(run(`QUESTS[${i}].candidates.map(c=>c.label.ko).join('|')`)===labels[i],'exact answer labels '+i);}
// Actual audit at viewport boundaries, including a scrolled child and a canvas word.
const auditContext=vm.createContext({innerWidth:1440,innerHeight:900,getComputedStyle:()=>({overflowY:'visible',visibility:'visible',display:'block'}),document:{querySelectorAll(){return [];}}});
vm.runInContext(hud.slice(hud.indexOf('function textAudit()')),auditContext);
for(const [w,h]of [[1440,900],[1280,720],[375,812]]){
 auditContext.innerWidth=w;auditContext.innerHeight=h;
 const el=new Node('p');el.textContent='HUD';auditContext.document.querySelectorAll=selector=>selector.startsWith('#gl')?[]:[el];
 for(const [rect,ok]of [[{left:0,right:w,top:0,bottom:h},true],[{left:-2,right:100,top:0,bottom:50},false],[{left:0,right:w+2,top:0,bottom:50},false],[{left:0,right:100,top:0,bottom:h+2},false]]){el.getBoundingClientRect=()=>rect;check(vm.runInContext('textAudit().length===0',auditContext)===ok,'audit bounds '+w);}
}
auditContext.document.querySelectorAll=selector=>selector.startsWith('#gl')?[{textContent:'canvas word'}]:[];
check(vm.runInContext("textAudit()[0].kind==='canvas-text'",auditContext),'canvas word rejected');
run("LANG='ko';QUEST.go(7);QUEST.phase('act');QUEST.pull();step(35);QUEST.phase('confirm')");
check(node('qPictures').textContent.includes('내 예상:')&&node('qPictures').textContent.includes('실제 결과:'),'confirmation text comparison');
run("QUEST.go(11);QUEST.phase('act');set('pull',.9);step(1)");check(node('resultNotice').textContent==='미끄러졌어요!','engine slip moment announces');
run("QUEST.mode(true);set('rival',0)");check(group('species')!==undefined,'free dinosaur chips');
const opponent=node('controlPanel').children[0];buttons(opponent)[1].onclick();check(run('S.rivalN')===5&&!group('species'),'free opponent switch');
console.log(`R1 HUD: passed ${checks}, failed 0 (real handlers, simulated DOM; browser layout delegated to Claude)`);
