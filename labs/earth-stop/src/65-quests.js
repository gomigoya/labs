// Six data rows; PHYS alone owns all scientific values and completion decisions.
const Q={i:0,phase:'intro',pick:null,stars:Array(6).fill(0),completed:new Set(),free:false,flags:{},records:{}};
const QUESTS=[
 {id:1,icon:'globe',startState:{phi:0,P:PHYS.C.T0,mode:'sudden'},candidates:[{key:'A',speed:PHYS.v(0,Infinity)},{key:'B',speed:PHYS.BENCH[1].speed},{key:'C',phi:0}],answerKey:'C',layers:[0,1],goalMarks:[0],handles:['speed','bench'],judge:s=>PHYS.judgeQ1(s),events:s=>PHYS.judgeQ1(s)},
 {id:2,icon:'pin',startState:{phi:0,P:PHYS.C.T0,mode:'sudden'},candidates:[{key:'A',phi:60,speed:PHYS.v(0,PHYS.C.T0)},{key:'B',phi:60},{key:'C',phi:60,speed:PHYS.v(0,PHYS.C.T0)+PHYS.v(60,PHYS.C.T0)}],answerKey:'B',layers:[0,2],goalMarks:[-60,60],handles:['phi','decrease'],judge:s=>PHYS.judgeQ2(s),events:s=>PHYS.judgeQ2(s)},
 {id:3,icon:'tangent',startState:{phi:0,P:PHYS.C.T0,mode:'sudden'},candidates:[{key:'A',direction:0},{key:'B',direction:1},{key:'C',direction:-1}],answerKey:'B',layers:[0,3],goalMarks:[],handles:['execute','relative'],judge:s=>PHYS.judgeQ3(s),events:s=>PHYS.judgeQ3(s)},
 {id:4,icon:'sun',startState:{phi:0,P:PHYS.C.T0,mode:'sudden'},candidates:[{key:'A',P:PHYS.C.T0},{key:'B',P:2*PHYS.C.day},{key:'C',P:PHYS.C.questPeriod}],answerKey:'C',layers:[5],goalMarks:[PHYS.C.questPeriod],handles:['gradual','P','day'],judge:s=>PHYS.judgeQ4(s),events:s=>PHYS.judgeQ4(s)},
 {id:5,icon:'ring',startState:{phi:0,P:PHYS.C.questPeriod,mode:'gradual'},candidates:[{key:'A',P:PHYS.C.T0},{key:'B',P:Infinity,half:true},{key:'C',P:Infinity}],answerKey:'C',layers:[5],goalMarks:[Infinity],handles:['gradual','P','play'],judge:s=>PHYS.judgeQ5(s),events:s=>PHYS.judgeQ5(s)},
 {id:6,icon:'limit',startState:{phi:0,P:PHYS.C.T0,mode:'sudden'},candidates:[{key:'A',phi:0},{key:'B',phi:60},{key:'C',phi:PHYS.phiSafe(PHYS.C.designSpeed)}],answerKey:'C',layers:[0,6],goalMarks:[-PHYS.phiSafe(PHYS.C.designSpeed),PHYS.phiSafe(PHYS.C.designSpeed)],handles:['phi'],judge:s=>PHYS.judgeQ6(s),events:s=>PHYS.judgeQ6(s)}
].map(d=>({...d,layers:d.layers.map(i=>GRAMMAR.LAYERS[i]),card:s=>CARDS.principle(d.id,s)}));
const QUEST={
 get i(){return Q.i;},get passed(){return Q.completed.has(Q.i);},
 state(){return JSON.parse(JSON.stringify({...Q,stars:[...Q.stars],completed:[...Q.completed]},(_key,value)=>value===Infinity?'stop':value));},
 sample(){return {phi:currentPhi(),P:currentPeriod(),mode:S.mode.target?'gradual':'sudden',runId:S.runId,measurement:S.run?.measurement||null,
  fromPhi:Q.flags.fromPhi,speedSeen:!!Q.flags.speedSeen,benchSeen:!!Q.flags.benchSeen,decreaseSeen:!!Q.flags.decreaseSeen,relativeSeen:!!Q.flags.relativeSeen,daySeen:!!Q.flags.daySeen};},
 phase(phase){if(!['intro','predict','act','observe','confirm','card'].includes(phase))throw new RangeError('phase');Q.phase=phase;Q.flags.elapsed=0;questUI();},
 invalidate(){for(const n of ['speedSeen','benchSeen','decreaseSeen','relativeSeen','daySeen'])Q.flags[n]=false;Q.flags.hold=0;Q.flags.lens=null;},
 evidence(){
  const f=Q.flags,s=this.sample(),key=[s.phi,s.P,s.mode,s.measurement?.runId||0].join(':');
  if(key!==f.condition){for(const n of ['speedSeen','benchSeen','decreaseSeen','relativeSeen','daySeen'])f[n]=false;f.condition=key;f.hold=0;f.lens=null;}
  if(s.measurement)Q.records[s.measurement.runId]=Object.freeze({...s.measurement});
 },
 go(i){
  if(!Number.isInteger(i)||i<0||i>=QUESTS.length)throw new RangeError('quest');
  Q.i=i;Q.free=false;Q.pick=null;
  Q.flags={elapsed:0,idle:0,demos:0,demoLeft:0,hold:0,fromPhi:null};
  S.run=null;S.drag=null;const d=QUESTS[i];for(const [n,v] of Object.entries(d.startState))set(n,v);
  for(const n of ['phi','period','mode'])S[n].value=S[n].target;
  for(const n of ['t','spin','sun'])S[n].value=S[n].target=0;
  S.playing.value=S.playing.target=0;
  if(i===1){Q.flags.fromPhi=currentPhi();GRAMMAR.pin();}else GRAMMAR.unpin();
  this.evidence();this.layers();DIRECTOR.clear();this.phase('intro');DIRECTOR.intro();syncUI();
 },
 layers(){GRAMMAR.set(Object.fromEntries(GRAMMAR.LAYERS.map(n=>[n,QUESTS[Q.i].layers.includes(n)])));},
 pick(k){if(Q.free||Q.phase!=='predict')return;const c=QUESTS[Q.i].candidates[k];if(!c)throw new RangeError('pick');Q.pick=c.key;this.phase('act');if(Q.i===3||Q.i===4)S.playing.value=S.playing.target=1;Q.flags.idle=0;Q.flags.demos++;Q.flags.demoLeft=2.2;},
 mode(free){Q.free=!!free;DIRECTOR.clear();this.invalidate();this.evidence();if(!Q.free)this.layers();questUI();shot(S.vertical?0:1,S.vertical);},
 touch(){Q.flags.idle=0;Q.flags.demoLeft=0;},
 allows(name){
  if(Q.free)return true;
  const allowed=Q.phase==='act'&&QUESTS[Q.i].handles.includes(name);
  if(!allowed&&Q.phase==='predict')document.getElementById('q-pictures').animate([{transform:'translateX(calc(-50% - 5px))'},{transform:'translateX(calc(-50% + 5px))'},{transform:'translateX(-50%)'}],{duration:220});
  return allowed;
 },
 open(name){
  if(!this.allows(name))return;this.evidence();const s=this.sample();
  if(Q.flags.lens===name){Q.flags.lens=null;this.touch();questUI();return;}
  // A view is evidence only after the apparatus reaches the displayed condition.
  if(S.drag||S.phi.value!==S.phi.target||S.period.value!==S.period.target)return;
  if(name==='relative'&&!s.measurement)return;
  if(name==='day'&&PHYS.solarDay(s.P)===null)return;
  const flag={speed:'speedSeen',bench:'benchSeen',decrease:'decreaseSeen',relative:'relativeSeen',day:'daySeen'}[name];
  if(flag)Q.flags[flag]=true;Q.flags.lens=name;this.touch();questUI();
 },
 skip(phase){this.phase(phase==='event'?'observe':phase);if(Q.phase==='observe')DIRECTOR.event(Q.flags.success||this.sample());},
 update(dt){
  const f=Q.flags;f.elapsed+=dt;if(Q.free)return;f.idle+=dt;this.evidence();
  if(Q.phase==='intro'){if(f.elapsed>=.9&&!f.pushed){f.pushed=true;DIRECTOR.push();}if(f.elapsed>=2.7)this.phase('predict');return;}
  if(Q.phase==='act'){
   f.demoLeft=Math.max(0,f.demoLeft-dt);if(S.drag)this.touch();
   if(f.idle>=7){f.idle=0;f.demos++;f.demoLeft=2.2;}
   const s=this.sample(),valid=QUESTS[Q.i].judge(s),still=!S.drag&&S.phi.value===S.phi.target&&S.period.value===S.period.target;
   f.hold=valid&&still?f.hold+dt:0;
   if(f.hold>=.3){f.success=Object.freeze({...s,measurement:s.measurement?Object.freeze({...s.measurement}):null});if(QUESTS[Q.i].events(s))DIRECTOR.event(f.success);this.phase('observe');}
  }else if(Q.phase==='observe'&&f.elapsed>=.8){
   // Debug phase navigation cannot award a result without a real captured judgment.
   if(!f.success||!QUESTS[Q.i].judge(f.success))return;
   Q.completed.add(Q.i);Q.stars[Q.i]=Q.pick===null||Q.pick===QUESTS[Q.i].answerKey?3:2;
   this.phase('confirm');if(Q.stars[Q.i]===3)DIRECTOR.chord();
  }else if(Q.phase==='confirm'&&f.elapsed>=.6)this.phase('card');
  else if(Q.phase==='card'&&f.elapsed>=6.1&&Q.i<QUESTS.length-1)this.go(Q.i+1);
 },
 auto(i){
  this.go(i);step(90,1/30);this.pick(QUESTS[i].candidates.findIndex(c=>c.key===QUESTS[i].answerKey));
  const settle=()=>step(100,1/30);
  if(i===0){this.open('speed');this.open('bench');}
  if(i===1){set('phi',60);settle();this.open('decrease');}
  if(i===2){set('execute',true);this.open('relative');}
  if(i===3){set('mode','gradual');set('P',2*PHYS.C.questPeriod);settle();this.open('day');}
  if(i===4){set('P',Infinity);settle();}
  if(i===5){set('phi',PHYS.phiSafe(PHYS.C.designSpeed));settle();}
  for(let n=0;n<3&&Q.phase!=='card';n++)step(100,1/30);
  return {i,passed:this.passed,phase:Q.phase,judge:QUESTS[i].judge(this.sample()),stars:Q.stars[i]};
 }
};
