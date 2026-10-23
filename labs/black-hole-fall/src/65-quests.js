// One flow state; six rows from docs/quest-map.md. Physics alone judges evidence.
const Q={i:0,phase:'intro',pick:null,stars:Array(6).fill(0),completed:new Set(),free:false,runId:0,flags:{}};
const PHASES=['intro','predict','act','observe','confirm','card'];
const QUESTS=[
 {id:1,icon:'ends',startState:{massIndex:0,r:1000},candidates:['vanish','little','large'].map(key=>({key})),answerKey:'large',layers:[0,1],goalMarks:[20],handles:['rail','play'],judge:s=>PHYS.judgeQ1(s),events:s=>PHYS.judgeQ1(s),solution:[{r:20}]},
 {id:2,icon:'rail',startState:{massIndex:0,r:40},candidates:[2,4,8].map(ratio=>({key:String(ratio),ratio})),answerKey:'8',layers:[1],goalMarks:[40,20],handles:['rail','play','compare'],judge:s=>PHYS.judgeQ2(s),events:s=>PHYS.judgeQ2(s),solution:[{r:20},{open:'compare'}]},
 {id:3,icon:'broken',startState:{massIndex:0,r:200},candidates:['inside','on','outside'].map(key=>({key})),answerKey:'outside',layers:[2,3],goalMarks:[PHYS.spaghettiR(0)],handles:['rail','play'],judge:s=>PHYS.judgeQ3(s),events:s=>PHYS.eventsBetween(s.previous,s.current).includes('disruption'),solution:[{r:20}]},
 {id:4,icon:'mass1',startState:{massIndex:0,r:1},candidates:['larger','same','smaller'].map(key=>({key})),answerKey:'smaller',layers:[0,3,4],goalMarks:[1],handles:['mass','compare'],judge:s=>PHYS.judgeQ4(s),events:s=>PHYS.judgeQ4(s),solution:[{massIndex:1},{open:'compare'}]},
 {id:5,icon:'ring',startState:{massIndex:1,r:1},candidates:['horizon','threshold','never'].map(key=>({key})),answerKey:'threshold',layers:[2,3],goalMarks:[0.5],handles:['rail','play'],judge:s=>PHYS.judgeQ5(s),events:s=>PHYS.judgeQ5(s),solution:[{r:0.5}]},
 {id:6,icon:'mass2',startState:{massIndex:0,r:1},candidates:[0,1,2].map(i=>({key:String(i),i})),answerKey:'1',answerKeys:['1','2'],layers:[2,3,4],goalMarks:[0.5],handles:['mass','rail','play'],judge:s=>PHYS.judgeQ6(s),events:s=>PHYS.judgeQ6(s),solution:[{massIndex:1},{r:0.5}]}
].map(d=>({...d,answerKeys:d.answerKeys||[d.answerKey],card:s=>CARDS.principle(d.id,s)}));
const QUEST={
 get i(){return Q.i;},get passed(){return Q.completed.has(Q.i);},
 state(){return structuredClone({...Q,completed:[...Q.completed]});},
 sample(){const f=Q.flags;return {i:massIndex(),r:currentR(),orientation:orientation(),stopped:!S.drag&&!S.playing.target&&S.u.value===S.u.target,samples:f.samples,runId:Q.runId,previous:f.previous,current:f.current,ratioSeen:!!f.ratioSeen,comparisonOpen:!!f.comparisonOpen};},
 phase(phase){if(!PHASES.includes(phase))throw new RangeError('phase');Q.phase=phase;Q.flags.elapsed=0;questUI();},
 go(i){
  if(!Number.isInteger(i)||!QUESTS[i])throw new RangeError('quest');
  Q.i=i;Q.free=false;Q.pick=null;Q.runId++;
  Q.flags={elapsed:0,idle:0,demoLeft:0,samples:[],events:[],previous:null,current:null,ratioSeen:false,comparisonOpen:false};
  S.drag=null;controls.enabled=true;S.playing.value=S.playing.target=0;
  S.records=[];S.graphKeys=[];set('orientation','radial');
  for(const [n,v]of Object.entries(QUESTS[i].startState))set(n,v);
  for(const n of ['u','massIndex','orientation'])S[n].value=S[n].target;
  GRAMMAR.unpin();GRAMMAR.set(Object.fromEntries(GRAMMAR.LAYERS.map((n,j)=>[n,QUESTS[i].layers.includes(j)])));
  this.record();if(i===1||i===3)GRAMMAR.pin();
  DIRECTOR.clear();this.phase('intro');DIRECTOR.intro();syncUI();
 },
 record(){
  const f=Q.flags,m=PHYS.measure(massIndex(),currentR(),Q.runId,orientation()),p=f.current;
  if(!m||p&&p.i===m.i&&p.r===m.r&&p.orientation===m.orientation)return;
  f.previous=p;f.current=m;f.samples.push(m);
  // Record every crossing before presentation cooldowns. Never infer a crossing on mass changes.
  for(const event of PHYS.eventsBetween(p,m))f.events.push({event,previous:p,current:m});
 },
 pick(k){if(Q.free||Q.phase!=='predict')return;const c=QUESTS[Q.i].candidates[k];if(!c)throw new RangeError('pick');Q.pick=c.key;this.touch();Q.flags.demoLeft=2.2;this.phase('act');},
 correct(){return Q.pick===null||QUESTS[Q.i].answerKeys.includes(Q.pick);},
 mode(free){Q.free=!!free;DIRECTOR.clear();S.playing.target=0;Q.flags.idle=0;if(free)GRAMMAR.set(Object.fromEntries(GRAMMAR.LAYERS.map(n=>[n,true])));else{GRAMMAR.set(Object.fromEntries(GRAMMAR.LAYERS.map((n,j)=>[n,QUESTS[Q.i].layers.includes(j)])));if(Q.flags.pushed)DIRECTOR.push();}questUI();},
 touch(){Q.flags.idle=0;Q.flags.demoLeft=0;},
 allows(){
  if(Q.free)return true;
  const allowed=Q.phase==='act';
  if(!allowed)qPictures.animate([{transform:'translateX(calc(-50% - 5px))'},{transform:'translateX(calc(-50% + 5px))'},{transform:'translateX(-50%)'}],{duration:220});
  return allowed;
 },
 open(name){
  if(name!=='compare'||!this.allows())return;this.touch();
  if(Q.free||![1,3].includes(Q.i)){if(GRAMMAR.baseline)GRAMMAR.unpin();else GRAMMAR.pin();return;}
  this.record();
  const s=this.sample(),ready=Q.i===1?PHYS.judgeQ2({...s,ratioSeen:true}):Q.i===3?PHYS.judgeQ4({...s,comparisonOpen:true}):false;
  // This is a real comparison view, populated only from this run's measurements.
  Q.flags.comparing=true;questUI();
  if(ready){if(Q.i===1)Q.flags.ratioSeen=true;if(Q.i===3)Q.flags.comparisonOpen=true;}
 },
 restore(){
  if(!Q.free&&!this.allows())return;
  Q.runId++;Object.assign(Q.flags,{samples:[],events:[],previous:null,current:null,success:null,ratioSeen:false,comparisonOpen:false,comparing:false});
  S.records=[];S.graphKeys=[];S.playing.target=0;GRAMMAR.unpin();this.record();questUI();
 },
 skip(phase){this.phase(phase==='event'?'observe':phase);if(Q.phase==='observe')DIRECTOR.event(Q.flags.success||this.sample());},
 update(dt){
  const f=Q.flags;if(Q.free)return;f.elapsed+=dt;f.idle+=dt;
  if(Q.phase==='intro'){if(f.elapsed>=0.9&&!f.pushed){f.pushed=true;DIRECTOR.push();}if(f.elapsed>=2.7)this.phase('predict');return;}
  if(Q.phase==='act'){
   f.demoLeft=Math.max(0,f.demoLeft-dt);if(S.drag)this.touch();
   if(f.idle>=7){f.idle=0;f.demoLeft=2.2;}
   const count=f.events.length;this.record();const s=this.sample();
   if(f.events.length>count&&DIRECTOR.eventLeft<=0)DIRECTOR.event(s);
   if(QUESTS[Q.i].judge(s)){
    f.success=structuredClone(s);S.playing.target=0;
    if(QUESTS[Q.i].events(s)&&DIRECTOR.eventLeft<=0)DIRECTOR.event(f.success);
    this.phase('observe');
   }
  }else if(Q.phase==='observe'&&f.elapsed>=0.8){
   // Debug phase navigation cannot manufacture completion.
   if(f.success&&QUESTS[Q.i].judge(f.success)){Q.completed.add(Q.i);Q.stars[Q.i]=this.correct()?3:2;if(this.correct())DIRECTOR.chord();}
   this.phase('confirm');
  }else if(Q.phase==='confirm'&&f.elapsed>=0.6)this.phase('card');
  else if(Q.phase==='card'&&f.success&&f.elapsed>=6.1&&Q.i<QUESTS.length-1)this.go(Q.i+1);
 },
 auto(i){
  this.go(i);step(90,1/30);this.pick(QUESTS[i].candidates.findIndex(c=>c.key===QUESTS[i].answerKey));
  for(const operation of QUESTS[i].solution){for(const [n,v]of Object.entries(operation)){if(n==='open')this.open(v);else set(n,v);}step(100,1/30);}
  for(let n=0;n<3&&Q.phase!=='card';n++)step(100,1/30);
  return {i,passed:this.passed,phase:Q.phase,judge:QUESTS[i].judge(Q.flags.success||this.sample()),stars:Q.stars[i]};
 }
};
