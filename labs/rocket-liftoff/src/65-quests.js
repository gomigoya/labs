// One state machine, six authoritative model judges; no rendered text.
const Q = { i:0, phase:'intro', pick:null, stars:Array(6).fill(0), completed:new Set(), free:false, serial:0, flags:{} };
const QUESTS = [
 {id:1,icon:'fuel',startState:{n:1,load:0,g:9.81},candidates:[{key:'fast',n:1,trace:'fast'},{key:'slow',n:1,trace:'slow'},{key:'pad',n:1}],answerKey:'pad',layers:[0,1,5],goalMarks:[{control:'play'}],controls:['play','skip'],judge:s=>PHYS.judgeQ1(s),events:s=>PHYS.judgeQ1(s)},
 {id:2,icon:'engines',startState:{n:1,load:0,g:9.81},candidates:[3,4,5].map(n=>({key:String(n),n,trace:n<5?'instant':undefined})),answerKey:'5',layers:[0,2,3],goalMarks:[{control:'engines',value:5}],controls:['play','skip','engines'],judge:s=>PHYS.judgeQ2(s),events:s=>PHYS.judgeQ2(s)},
 {id:3,icon:'height',startState:{n:5,load:0,g:9.81},candidates:['equal','growing','shrinking'].map(trace=>({key:trace,n:5,trace})),answerKey:'growing',layers:[0,4,5,7],goalMarks:[{control:'play'},{control:'inspect'}],controls:['play','skip','inspect','graph'],judge:s=>PHYS.judgeQ3(s),events:s=>PHYS.judgeQ3(s)},
 {id:4,icon:'load2',startState:{n:5,load:200000,g:9.81},candidates:[{key:'extra',n:5,load:500000,extra:true},{key:'margin',n:5,load:500000},{key:'pad',n:5,load:500000,trace:'pad'}],answerKey:'margin',layers:[0,1,4,6],goalMarks:[{control:'pin'},{control:'load',value:500000},{control:'inspect'}],controls:['play','skip','pin','load','inspect'],judge:s=>PHYS.judgeQ4(s),events:s=>PHYS.judgeQ4(s)},
 {id:5,icon:'moon',startState:{n:1,load:0,g:1.62},candidates:[{key:'five',n:5,g:1.62},{key:'one',n:1,g:1.62},{key:'pad',n:1,g:1.62,trace:'pad'}],answerKey:'one',layers:[0,1,4],goalMarks:[{control:'play'}],controls:['play','skip'],judge:s=>PHYS.judgeQ5(s),events:s=>PHYS.judgeQ5(s)},
 {id:6,icon:'rocket',startState:{n:1,load:500000,g:9.81},candidates:[3,4,5].map(n=>({key:String(n),n,load:500000,trace:n<5?'instant':undefined})),answerKey:'5',layers:[0,1,2,3],goalMarks:[{control:'engines',value:5}],controls:['engines','play','skip'],judge:s=>PHYS.judgeQ6(s),events:s=>PHYS.judgeQ6(s)}
].map(d=>({...d,layers:d.layers.map(i=>GRAMMAR.LAYERS[i]),card:s=>CARDS.principle(d.id,s)}));
const QUEST = {
 get i(){return Q.i;},get passed(){return Q.completed.has(Q.i);},
 state(){return {...Q,stars:[...Q.stars],completed:[...Q.completed],flags:structuredClone(Q.flags)};},
 sample(){const f=Q.flags,r={...selection(),runId:f.runId||0,t:S.t.value,ignited:!!S.ignited.target,accelerationSeen:!!f.accelerationSeen};return Q.i===3?{before:f.before,after:r,comparisonSeen:!!f.comparisonSeen}:r;},
 phase(phase){if(!['intro','predict','act','observe','confirm','card'].includes(phase))throw new RangeError('phase');Q.phase=phase;Q.flags.elapsed=0;questUI();},
 invalidate(){Q.flags.runId=0;Q.flags.accelerationSeen=false;Q.flags.comparisonSeen=false;Q.flags.hold=0;if(Q.i===2)GRAMMAR.unpin();},
 ignite(){if(!Q.flags.runId){Q.flags.runId=++Q.serial;if(Q.i===2)GRAMMAR.pin();}},
 go(i){
  if(!Number.isInteger(i)||i<0||i>=QUESTS.length)throw new RangeError('quest');
  S.drag=null;controls.enabled=true;Q.i=i;Q.free=false;Q.pick=null;Q.flags={elapsed:0,idle:0,demoLeft:0,hold:0,runId:0};
  const d=QUESTS[i];set('engines',d.startState.n);set('load',d.startState.load);set('g',d.startState.g);
  for(const key of ['engines','load','g'])S[key].value=S[key].target;
  GRAMMAR.unpin();GRAMMAR.set(Object.fromEntries(GRAMMAR.LAYERS.map(n=>[n,d.layers.includes(n)])));
  DIRECTOR.clear();this.phase('intro');DIRECTOR.intro();syncUI();
 },
 pick(k){if(Q.free||Q.phase!=='predict')return;const c=QUESTS[Q.i].candidates[k];if(!c)throw new RangeError('pick');Q.pick=c.key;Q.flags.demoLeft=2.2;this.phase('act');},
 mode(free){if(!free){this.go(Q.i);return;}Q.free=true;DIRECTOR.clear();GRAMMAR.set(GRAMMAR.defaults);questUI();shot(S.vertical?0:1,S.vertical);},
 touch(){Q.flags.idle=0;Q.flags.demoLeft=0;},
 allows(control){
  if(Q.free)return true;
  const name=({plus:'engines',minus:'engines',slider:'engines',dial:'engines',gravity:'g',globe:'g',earth:'g',moon:'g',load0:'load',load1:'load',load2:'load'})[control]||control;
  const ok=Q.phase==='act'&&(control==='reset'||QUESTS[Q.i].controls.includes(name));
  if(!ok&&Q.phase==='predict')document.getElementById('q-pictures').animate([{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'translateX(0)'}],{duration:220});
  return ok;
 },
 open(name){
  if(!this.allows(name))return;this.touch();const f=Q.flags;
  if(name==='pin'&&Q.i===3){const r={...selection(),t:S.t.value,ignited:!!S.ignited.target};if(!f.runId)f.runId=++Q.serial;f.before=Object.freeze({...r,runId:f.runId});GRAMMAR.pin({...r,t:0,ignited:true});f.comparisonSeen=false;}
  if(name==='inspect'){
   if(Q.i===2&&f.runId&&S.ignited.target&&S.t.value>0&&GRAMMAR.baseline&&GRAMMAR.enabled[GRAMMAR.LAYERS[7]])f.accelerationSeen=true;
   if(Q.i===3&&f.before&&f.runId>f.before.runId&&GRAMMAR.baseline&&GRAMMAR.enabled[GRAMMAR.LAYERS[6]])f.comparisonSeen=true;
  }
  questUI();
 },
 skip(phase){this.phase(phase==='event'?'observe':phase);if(phase==='event')DIRECTOR.event(Q.flags.success||this.sample());},
 update(dt){
  const f=Q.flags;f.elapsed+=dt;f.idle+=dt;if(Q.free)return;
  if(Q.phase==='intro'){if(f.elapsed>=.9&&!f.pushed){f.pushed=true;DIRECTOR.push();}if(f.elapsed>=2.7)this.phase('predict');return;}
  if(Q.phase==='act'){
   f.demoLeft=Math.max(0,f.demoLeft-dt);if(S.drag)this.touch();if(f.idle>=7){f.idle=0;f.demoLeft=2.2;}
   if(!S.ignited.target){f.hold=0;return;}
   this.ignite();const s=this.sample(),valid=QUESTS[Q.i].judge(s);
   // A pending observation is cancelled by scrubbing backwards or manipulation.
   const t=S.t.value,forward=f.lastT===undefined||t>=f.lastT;f.lastT=t;
   f.hold=valid&&!S.drag&&forward?f.hold+dt:0;
   if(valid&&f.hold>=.25){f.success=Object.freeze(structuredClone(s));this.phase('observe');if(QUESTS[Q.i].events(s))DIRECTOR.event(s);}
  }else if(Q.phase==='observe'&&f.elapsed>=1.4){S.playing.value=S.playing.target=0;Q.completed.add(Q.i);Q.stars[Q.i]=Q.pick===null||Q.pick===QUESTS[Q.i].answerKey?3:2;this.phase('confirm');if(Q.stars[Q.i]===3)DIRECTOR.chord();}
  else if(Q.phase==='confirm'&&f.elapsed>=1.4)this.phase('card');
  else if(Q.phase==='card'&&f.elapsed>=7.5){if(Q.i<QUESTS.length-1)this.go(Q.i+1);else this.mode(true);}
 },
 auto(i){
  this.go(i);step(90,1/30);this.pick(QUESTS[i].candidates.findIndex(c=>c.key===QUESTS[i].answerKey));
  const settle=()=>step(30,1/30);
  if(i===1||i===5){set('engines',PHYS.enginesNeeded(QUESTS[i].startState.load,QUESTS[i].startState.g));settle();}
  if(i===3){this.open('pin');set('load',PHYS.C.loads[2]);settle();}
  action('play');settle();
  if(i===0){set('t',PHYS.burnTime(1));for(let n=0;n<4&&Q.phase==='act';n++)step(120,1/30);}
  if(i===2){set('t',PHYS.DISPLAY.dotDt*4);step(60,1/30);this.open('inspect');}
  if(i===3)this.open('inspect');
  for(let n=0;n<4&&Q.phase!=='card';n++)step(90,1/30);
  return {i,passed:this.passed,phase:Q.phase,judge:QUESTS[i].judge(this.sample()),stars:Q.stars[i]};
 }
};
