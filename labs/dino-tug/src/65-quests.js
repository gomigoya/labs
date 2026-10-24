// One flow state; only completed pulls are scientific observations.
const Q = { i:0, phase:'intro', pick:null, stars:[], completed:new Set(), free:false, flags:{}, run:0, results:[], predict:[], explain:[] };
const PHASES = ['intro','predict','act','observe','confirm','explain','card'];
const QUEST_UI = {"1": {"title": {"ko": "작은 공룡과 아이 한 명, 누가 이길까?", "en": "A small dinosaur and one child: who wins?"}, "labels": [{"ko": "공룡이 이긴다", "en": "The dinosaur wins"}, {"ko": "비긴다", "en": "A tie"}, {"ko": "아이가 이긴다", "en": "The child wins"}], "controls": ["pull"]}, "2": {"title": {"ko": "트리케라톱스를 이기려면 몇 명?", "en": "How many children can beat Triceratops?"}, "labels": [{"ko": "5명", "en": "5 children"}, {"ko": "20명", "en": "20 children"}, {"ko": "50명", "en": "50 children"}], "controls": ["kids", "pull"]}, "3": {"title": {"ko": "티라노를 이기려면 몇 명?", "en": "How many children can beat T. rex?"}, "labels": [{"ko": "100명이어도 진다", "en": "Even 100 lose"}, {"ko": "60명이면 이긴다", "en": "60 can win"}, {"ko": "10명이면 이긴다", "en": "10 can win"}], "controls": ["kids", "pull"]}, "4": {"title": {"ko": "바닥을 유리로 바꾸면?", "en": "What if the ground becomes glass?"}, "labels": [{"ko": "아이 팀이 이긴다", "en": "The children win"}, {"ko": "결과가 똑같다", "en": "The result stays the same"}, {"ko": "공룡이 이긴다", "en": "The dinosaur wins"}], "controls": ["ground", "pull"]}, "5": {"title": {"ko": "유리 위에서 인원을 늘리면?", "en": "What if more children join on glass?"}, "labels": [{"ko": "마찰 한계는 그대로다", "en": "The friction limit stays the same"}, {"ko": "인원이 늘면 한계도 커진다", "en": "More children raise the limit"}, {"ko": "인원이 늘면 한계가 작아진다", "en": "More children lower the limit"}], "controls": ["kids", "pull"]}, "6": {"title": {"ko": "큰 공룡은 몸무게에 비해 힘이 셀까?", "en": "Are big dinosaurs stronger for their weight?"}, "labels": [{"ko": "큰 공룡이 몸무게에 비해 더 세다", "en": "Big dinosaurs are stronger for their weight"}, {"ko": "똑같다", "en": "The same"}, {"ko": "큰 공룡이 몸무게에 비해 더 약하다", "en": "Big dinosaurs are weaker for their weight"}], "controls": ["species", "compare"]}, "7": {"title": {"ko": "아이 30명이 이길 수 있는 가장 무거운 공룡은?", "en": "What is the heaviest dinosaur 30 children can beat?"}, "labels": [{"ko": "벨로키랍토르까지", "en": "Up to Velociraptor"}, {"ko": "딜로포사우루스까지", "en": "Up to Dilophosaurus"}, {"ko": "스테고사우루스까지", "en": "Up to Stegosaurus"}], "controls": ["species", "pull"]}, "8": {"title": {"ko": "맞잡기: 두 팀이 똑같이 당기면?", "en": "Equal pull: what if both teams pull equally?"}, "labels": [{"ko": "왼쪽 팀이 이긴다", "en": "The left team wins"}, {"ko": "비긴다(깃발이 멈춘다)", "en": "A tie (the flag stops)"}, {"ko": "오른쪽 팀이 이긴다", "en": "The right team wins"}], "controls": ["pull"]}, "9": {"title": {"ko": "한 명 더: 한 팀에 한 명만 더 오면?", "en": "One more: what if a child joins one team?"}, "labels": [{"ko": "아무 변화 없다", "en": "Nothing changes"}, {"ko": "많은 팀 쪽으로 움직인다", "en": "Moves toward the larger team"}, {"ko": "적은 팀 쪽으로 움직인다", "en": "Moves toward the smaller team"}], "controls": ["kids", "rival", "pull"]}, "10": {"title": {"ko": "줄 가운데 저울은 얼마를 가리킬까?", "en": "What does the gauge in the middle read?"}, "labels": [{"ko": "한 팀이 당기는 힘만큼", "en": "One team?s pulling force"}, {"ko": "두 팀 힘을 더한 만큼", "en": "The sum of both forces"}, {"ko": "0", "en": "0"}], "controls": ["kids", "rival", "pull"]}, "11": {"title": {"ko": "팀을 따로 보기: 힘의 합이 0이 아닌 것은?", "en": "View teams separately: which has a nonzero net force?"}, "labels": [{"ko": "줄", "en": "Rope"}, {"ko": "이기는 팀", "en": "Winning team"}, {"ko": "지는 팀", "en": "Losing team"}], "controls": ["pull", "lens"]}, "12": {"title": {"ko": "서서히 당기기: 마찰은 언제부터 버틸까?", "en": "Pull slowly: when does friction resist?"}, "labels": [{"ko": "처음부터 최대로 버틴다", "en": "Maximum resistance from the start"}, {"ko": "당기는 만큼 커지다가 한계에서 미끄러진다", "en": "Grows with the pull, then slips at the limit"}, {"ko": "움직일 때만 생긴다", "en": "Only acts while moving"}], "controls": ["pullSlider"]}};
const QUESTS = [
 {id:1,icon:'q1',startState:()=>({n:1,species:SPECIES_KEYS[0],mu:PHYS.GROUNDS['자갈']}),candidates:[{key:'A',flag:'dino'},{key:'B',flag:'tie'},{key:'C',flag:'kids'}],answerKey:'C',layers:[0,2,4],goalMarks:[],focus:'play',judge:s=>PHYS.judgeQ1(s),solve:()=>[{pull:true}]},
 {id:2,icon:'q2',startState:()=>({n:1,species:SPECIES_KEYS[3],mu:PHYS.GROUNDS['자갈']}),candidates:[5,20,50].map((n,i)=>({key:'ABC'[i],n})),answerKey:'C',layers:[0,1,2],goalMarks:[PHYS.minKidsToWin(SPECIES_KEYS[3],GROUND_VALUES[2])],focus:'rail',judge:s=>PHYS.judgeQ2(s),solve:s=>[{n:PHYS.minKidsToWin(s.species,s.mu),pull:true}]},
 {id:3,icon:'q3',startState:()=>({n:1,species:SPECIES_KEYS[4],mu:PHYS.GROUNDS['자갈']}),candidates:[{key:'A',n:100,flag:'dino'},{key:'B',n:60,flag:'kids'},{key:'C',n:10,flag:'kids'}],answerKey:'B',layers:[0,1,2,3],goalMarks:[PHYS.minKidsToWin(SPECIES_KEYS[4],GROUND_VALUES[2])],focus:'rail',judge:s=>PHYS.judgeQ3(s),solve:s=>[{n:PHYS.minKidsToWin(s.species,s.mu),pull:true}]},
 {id:4,icon:'q4',startState:()=>({...Q.results[1]||{n:49,species:SPECIES_KEYS[3]},mu:PHYS.GROUNDS['자갈']}),candidates:[{key:'A',flag:'kids'},{key:'B',flag:'same'},{key:'C',flag:'dino'}],answerKey:'C',layers:[0,2,3,7],goalMarks:[],focus:s=>s.observations.length?'ground':'play',judge:s=>PHYS.judgeQ4(s),solve:()=>[{pull:true},{mu:PHYS.GROUNDS['유리'],pull:true}]},
 {id:5,icon:'q5',startState:()=>({...Q.results[3]||{n:59,species:SPECIES_KEYS[4]},mu:PHYS.GROUNDS['유리']}),candidates:['fixed','grow','shrink'].map((limit,i)=>({key:'ABC'[i],limit})),answerKey:'B',layers:[0,1,2,4,7],goalMarks:[],focus:s=>!s.before||s.n-s.before.n>=PHYS.C.increaseQ5?'play':'rail',judge:s=>PHYS.judgeQ5(s),solve:s=>[{pull:true},{n:Math.min(100,s.n+PHYS.C.increaseQ5),pull:true}]},
 {id:6,icon:'q6',startState:()=>({n:1,species:SPECIES_KEYS[0],mu:PHYS.GROUNDS['자갈']}),candidates:['long','equal','short'].map((ratio,i)=>({key:'ABC'[i],ratio})),answerKey:'C',layers:[6],goalMarks:[],focus:s=>[SPECIES_KEYS[0],SPECIES_KEYS[5]].every(t=>s.visited.includes(t))&&!s.compareOpen?'compare':'species',judge:s=>PHYS.judgeQ6(s),solve:()=>[{species:SPECIES_KEYS[0]},{species:SPECIES_KEYS[5]},{compare:true}]},
 {id:7,icon:'q7',startState:()=>({n:30,species:SPECIES_KEYS[0],mu:PHYS.GROUNDS['자갈']}),candidates:[0,1,2].map((si,i)=>({key:'ABC'[i],species:SPECIES_KEYS[si]})),answerKey:'B',layers:[0,2,3],goalMarks:[30],focus:'species',judge:s=>PHYS.judgeQ7(s),solve:s=>[{species:SPECIES_KEYS.filter(t=>PHYS.outcome(s.n,t,s.mu).winner==='kids').sort((a,b)=>PHYS.SPECIES[b]-PHYS.SPECIES[a])[0],pull:true}]},
 {id:8,icon:'q8',startState:()=>({n:5,rival:5,species:SPECIES_KEYS[0],mu:PHYS.GROUNDS['자갈']}),candidates:['left','tie','right'].map((flag,i)=>({key:'ABC'[i],flag})),answerKey:'B',layers:[0,2],goalMarks:[],focus:'play',judge:s=>PHYS.judgeQ8(s),solve:()=>[{pull:true}]},
 {id:9,icon:'q9',startState:()=>({n:5,rival:5,species:SPECIES_KEYS[0],mu:PHYS.GROUNDS['자갈']}),candidates:['tie','more','less'].map((flag,i)=>({key:'ABC'[i],flag})),answerKey:'B',layers:[0,2],goalMarks:[],focus:s=>Math.abs(s.n-s.rivalN)===1?'play':'rail',judge:s=>PHYS.judgeQ9(s),solve:()=>[{n:6,pull:true}]},
 {id:10,icon:'q10',startState:()=>({n:5,rival:5,species:SPECIES_KEYS[0],mu:PHYS.GROUNDS['자갈']}),candidates:['one','sum','zero'].map((flag,i)=>({key:'ABC'[i],flag})),answerKey:'A',layers:[0,2,'장력계'],goalMarks:[],focus:s=>!s.observations.some(o=>PHYS.validObservation(o)&&o.rivalN>0&&o.n===o.rivalN)||Math.abs(s.n-s.rivalN)===1?'play':'rail',judge:s=>PHYS.judgeQ10(s),solve:()=>[{pull:true},{n:6,pull:true}]}
,
 {id:11,icon:'q11',lens:true,startState:()=>({n:6,rival:5,species:SPECIES_KEYS[0],mu:PHYS.GROUNDS['자갈']}),candidates:['rope','winner','loser'].map((flag,i)=>({key:'ABC'[i],flag})),answerKey:'C',layers:[0,2,'렌즈'],goalMarks:[],focus:s=>!s.observations.some(PHYS.validObservation)?'play':['rope','A','B'].every(x=>s.lensVisited.includes(x))?'play':'lens',judge:s=>PHYS.judgeQ11(s),solve:()=>[{pull:true},{lens:'rope'},{lens:'A'},{lens:'B'}]}
,
 {id:12,icon:'q12',pullMode:true,startState:()=>({n:5,species:SPECIES_KEYS[3],mu:PHYS.GROUNDS['유리'],rival:0}),candidates:['max','grow','late'].map((flag,i)=>({key:'ABC'[i],flag})),answerKey:'B',layers:['서서히 당기기'],goalMarks:[],focus:s=>!s.sawStatic?'pull':!s.sawSlip?'slip':'pull',judge:s=>PHYS.judgeQ12(s),solve:()=>[{pull:0.4},{hold:0.8},{pull:0.9},{hold:0.8}]}
].map(d=>({...d,title:QUEST_UI[d.id].title,controls:QUEST_UI[d.id].controls,candidates:d.candidates.map((c,k)=>({...c,label:QUEST_UI[d.id].labels[k]})),layers:d.layers.map(i=>typeof i==='string'?i:GRAMMAR.LAYERS[i]),events:s=>d.judge(s),card:s=>CARDS.principle(d.id,s)}));
validateCurriculum(QUESTS);
validateExplain(QUESTS);
Q.stars = Array(QUESTS.length).fill(0);
const QUEST = {
 first(){return SEQUENCE[0];},
 next(i=Q.i){return SEQUENCE[SEQUENCE.indexOf(i)+1]??null;},
 unlocked(i){return i===SEQUENCE[0]||Q.completed.has(SEQUENCE[SEQUENCE.indexOf(i)-1])||Q.completed.has(i);},
 get i(){return Q.i;},get passed(){return Q.completed.has(Q.i);},
 focus(){const d=QUESTS[Q.i],s=this.sample(),focus=typeof d.focus==='function'?d.focus(s):d.focus;return focus==='rail'&&d.goalMarks.length&&s.n>=d.goalMarks[0]||Q.i===6&&d.judge(s)?'play':focus;},
 state(){return structuredClone({...Q,completed:[...Q.completed]});},
 log(){return [...Q.completed].map(i=>({id:QUESTS[i].id,pick:Q.predict[i]?.pick??null,predictRight:Q.predict[i]?.right??false,answerKey:QUESTS[i].answerKey,explainTries:[...(Q.explain[i]?.tries||[])],explainRight:Q.explain[i]?.right??false,stars:Q.stars[i]})).sort((a,b)=>a.id-b.id);},
 sample(){const f=Q.flags;return {pullP:S.pullP,pullMode:S.pullMode,sawStatic:!!f.sawStatic,sawSlip:!!f.sawSlip,lens:S.lens,lensVisited:f.lensVisited||[],rivalN:S.rivalN,n:PHYS.kidsFromRailX(S.u.value),species:SPECIES_KEYS[Math.round(S.species.value)],mu:GROUND_VALUES[Math.round(S.ground.value)],observations:f.observations||[],before:f.before||null,after:f.after||null,visited:f.visited||[],compareOpen:!!f.compareOpen};},
 phase(p){if(!PHASES.includes(p))throw new RangeError('phase');Q.phase=p;Q.flags.elapsed=0;
  if(p==='explain'){
   const order=EXPLAIN[QUESTS[Q.i].id].options.map(o=>o.key);
   for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
   Q.flags.explain={order,tries:[],right:false};
  }
  questUI();},
 go(i){
  if(!Number.isInteger(i)||!QUESTS[i])throw new RangeError('quest');
  Q.i=i;Q.free=false;Q.pick=null;Q.phase='intro';Q.flags={sawStatic:false,sawSlip:false,staticTime:0,slipTime:0,elapsed:0,idle:0,demoLeft:0,observations:[],visited:[],lensVisited:[],before:null,after:null,pending:null,events:[],compareOpen:false};
  S.pullMode=false;S.pullP=0;S.lens=null;S.drag=null;controls.enabled=true;
  const start=QUESTS[i].startState();set('rival',start.rival??0);for(const k of ['n','species','mu'])set(k,start[k]);S.u.value=S.u.target;S.pullMode=QUESTS[i].pullMode===true;
  S.t.value=S.t.target=0;S.playing.value=S.playing.target=0;
  GRAMMAR.unpin();GRAMMAR.clearRecords();this.layers();DIRECTOR.clear();this.phase('intro');DIRECTOR.intro();syncUI();
 },
 layers(){GRAMMAR.set(Object.fromEntries(GRAMMAR.LAYERS.map(n=>[n,QUESTS[Q.i].layers.includes(n)])));},
 mode(free){S.pullMode=!free&&QUESTS[Q.i].pullMode===true;S.pullP=0;Q.free=!!free;Q.flags.pending=null;S.playing.value=S.playing.target=0;DIRECTOR.clear();if(free)GRAMMAR.set({...GRAMMAR.defaults});else this.layers();questUI();shot(S.vertical?0:1,S.vertical);},
 pick(k){if(Q.free||Q.phase!=='predict')return;const c=QUESTS[Q.i].candidates[k];if(!c)throw new RangeError('pick');Q.pick=c.key;this.phase('act');Q.flags.demoLeft=2.2;this.touch();},
 touch(){Q.flags.idle=0;},
 allows(){if(Q.free||['act','card','confirm'].includes(Q.phase))return true;document.getElementById('q-pictures').animate([{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'translateX(0)'}],{duration:220});return false;},
 changed(name){
  const f=Q.flags;f.pending=null;S.playing.target=0;
  if(name==='species'&&!Q.free&&Q.phase==='act'){const species=SPECIES_KEYS[S.species.target];if(!f.visited.includes(species))f.visited.push(species);}
 },
 compare(){if(!this.allows())return;this.touch();Q.flags.compareOpen=!Q.flags.compareOpen;GRAMMAR.set({[GRAMMAR.LAYERS[4]]:false,[GRAMMAR.LAYERS[6]]:Q.flags.compareOpen});questUI();},
 pull(){
  if(S.pullMode)return;
  if(!this.allows())return;this.touch();
  if(Q.flags.pending){Q.flags.pending=null;S.playing.target=0;return;}
  if(S.drag||Math.abs(S.u.target-S.u.value)>1e-7)return;
  const s=this.sample();Q.flags.pending={run:++Q.run,n:s.n,species:s.species,mu:s.mu,rivalN:s.rivalN,elapsed:0};S.t.value=S.t.target=0;S.playing.target=1;
 },
 skip(p){this.phase(p==='event'?'observe':p);if(p==='event')DIRECTOR.event(Q.flags.success||this.sample());},
 update(dt){
  if(Q.free)return;const f=Q.flags;f.elapsed+=dt;f.idle+=dt;
  if(Q.phase==='intro'){if(f.elapsed>=.9&&!f.pushed){f.pushed=true;DIRECTOR.push();}if(f.elapsed>=2.7)this.phase('predict');return;}
  if(Q.phase==='act'){
   f.demoLeft=Math.max(0,f.demoLeft-dt);if(S.drag){this.touch();f.demoLeft=0;}
   if(f.idle>=7){f.idle=0;f.demoLeft=2.2;}
   const s=this.sample(),p=f.pending;
   if(S.pullMode){
    const pull=PHYS.staticPull(s.n,s.mu,s.pullP);
    f.staticTime=s.pullP>0&&s.pullP<pull.pSlip&&pull.friction===pull.applied?f.staticTime+dt:0;
    f.slipTime=pull.slipped?f.slipTime+dt:0;
    if(pull.slipped&&!f.slipNotified){f.slipNotified=true;announceResult(s,true);} f.sawStatic ||= f.staticTime>=.6;f.sawSlip ||= f.slipTime>=.6;
   }
   if(p){
    if(S.drag||s.n!==p.n||s.species!==p.species||s.mu!==p.mu||s.rivalN!==p.rivalN||!S.playing.target){f.pending=null;}
    else{
     p.elapsed+=DIRECTOR.time(dt);
     if(p.elapsed>=.9){
      const record={run:p.run,n:p.n,species:p.species,mu:p.mu,rivalN:p.rivalN};f.observations.push(record);f.pending=null;S.playing.value=S.playing.target=0;S.t.value=S.t.target=Math.PI;
      if(!f.before)f.before=record;else{f.after=record;f.before=f.observations.slice(0,-1).find(before=>PHYS.judgeQ5({before,after:record}))||f.observations.at(-2);}
      // Record the event before any presentation cooldown. No invented acceleration.
      const result=PHYS.matchOutcome(p.n,p.species,p.rivalN,p.mu);f.events.push({...record,...result});announceResult(record);GRAMMAR.record();
      if(f.observations.length===1&&Q.i===3)GRAMMAR.pin();questUI();
     }
    }
   }
   const actual=this.sample();
   if(!S.drag&&(S.pullMode||Q.i===5||f.observations.length>0)&&QUESTS[Q.i].judge(actual)){
    // Single-state quests must match the last completed pull, not an unexecuted edit.
    const last=f.observations.at(-1);
    if(!S.pullMode&&Q.i!==5&&![3,4].includes(Q.i)&&(!last||last.n!==actual.n||last.species!==actual.species||last.mu!==actual.mu||last.rivalN!==actual.rivalN))return;
    f.success=structuredClone(actual);Q.results[Q.i]={n:actual.n,species:actual.species,mu:actual.mu,rivalN:actual.rivalN,success:structuredClone(actual)};
    if(QUESTS[Q.i].events(actual))DIRECTOR.event(actual);this.phase('observe');
   }
  }else if(Q.phase==='observe'&&f.elapsed>=.8){Q.completed.add(Q.i);Q.stars[Q.i]=Q.pick===null||Q.pick===QUESTS[Q.i].answerKey?3:2;Q.predict[Q.i]={pick:Q.pick,right:Q.stars[Q.i]===3};Q.explain[Q.i]={tries:[],right:false};this.phase('confirm');if(Q.stars[Q.i]===3)DIRECTOR.chord();}
  else if(Q.phase==='confirm'&&f.elapsed>=.6)this.phase('explain');
  else if(Q.phase==='card'&&f.elapsed>=6.1&&this.next()!==null)this.go(this.next());
 },
 correctKey(id=QUESTS[Q.i].id){return EXPLAIN[id].options.find(o=>o.correct).key;},
 answer(key){
  if(Q.free||Q.phase!=='explain')return;
  const f=Q.flags,e=f.explain,option=EXPLAIN[QUESTS[Q.i].id].options.find(o=>o.key===key);
  if(!option||e.tries.includes(key))return;
  if(option.correct){e.right=true;Q.explain[Q.i]={tries:[...e.tries],right:true};this.phase('card');}
  else{e.tries.push(key);Q.explain[Q.i]={tries:[...e.tries],right:false};DIRECTOR.event(f.success||this.sample());questUI();}
 },
 auto(i){
  this.go(i);step(90,1/30);this.pick(QUESTS[i].candidates.findIndex(c=>c.key===QUESTS[i].answerKey));
  for(const command of QUESTS[i].solve(this.sample())){
   for(const k of ['n','species','mu','lens'])if(command[k]!==undefined)set(k,command[k]);
   if(typeof command.pull==='number')set('pull',command.pull);
   if(command.hold!==undefined){for(let t=0;t<Math.ceil(command.hold*30);t++)step(1,1/30);}
   else if(typeof command.pull!=='number')step(30,1/30);
   if(command.compare)this.compare();if(command.pull===true){this.pull();step(40,1/30);}
  }
  for(let n=0;n<12&&!['explain','card'].includes(Q.phase);n++)step(30,1/30);
  if(Q.phase==='explain')this.answer(this.correctKey());
  return {i,passed:this.passed,phase:Q.phase,judge:QUESTS[i].judge(Q.flags.success||this.sample()),stars:Q.stars[i]};
 }
};
