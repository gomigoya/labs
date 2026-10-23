// One flow state; only completed pulls are scientific observations.
const Q = { i:0, phase:'intro', pick:null, stars:Array(7).fill(0), completed:new Set(), free:false, flags:{}, run:0, results:[] };
const PHASES = ['intro','predict','act','observe','confirm','card'];
const QUESTS = [
 {id:1,icon:'q1',startState:()=>({n:1,species:SPECIES_KEYS[0],mu:PHYS.GROUNDS['자갈']}),candidates:[{key:'A',flag:'dino'},{key:'B',flag:'tie'},{key:'C',flag:'kids'}],answerKey:'C',layers:[0,2,4],goalMarks:[],focus:'play',judge:s=>PHYS.judgeQ1(s),solve:()=>[{pull:true}]},
 {id:2,icon:'q2',startState:()=>({n:1,species:SPECIES_KEYS[3],mu:PHYS.GROUNDS['자갈']}),candidates:[5,20,50].map((n,i)=>({key:'ABC'[i],n})),answerKey:'C',layers:[0,1,2],goalMarks:[PHYS.minKidsToWin(SPECIES_KEYS[3],GROUND_VALUES[2])],focus:'rail',judge:s=>PHYS.judgeQ2(s),solve:s=>[{n:PHYS.minKidsToWin(s.species,s.mu),pull:true}]},
 {id:3,icon:'q3',startState:()=>({n:1,species:SPECIES_KEYS[4],mu:PHYS.GROUNDS['자갈']}),candidates:[{key:'A',n:100,flag:'dino'},{key:'B',n:60,flag:'kids'},{key:'C',n:10,flag:'kids'}],answerKey:'B',layers:[0,1,2,3],goalMarks:[PHYS.minKidsToWin(SPECIES_KEYS[4],GROUND_VALUES[2])],focus:'rail',judge:s=>PHYS.judgeQ3(s),solve:s=>[{n:PHYS.minKidsToWin(s.species,s.mu),pull:true}]},
 {id:4,icon:'q4',startState:()=>({...Q.results[2]||{n:59,species:SPECIES_KEYS[4]},mu:PHYS.GROUNDS['자갈']}),candidates:[{key:'A',flag:'kids'},{key:'B',flag:'same'},{key:'C',flag:'dino'}],answerKey:'C',layers:[0,2,3,7],goalMarks:[],focus:s=>s.observations.length?'ground':'play',judge:s=>PHYS.judgeQ4(s),solve:()=>[{pull:true},{mu:PHYS.GROUNDS['유리'],pull:true}]},
 {id:5,icon:'q5',startState:()=>({...Q.results[3]||{n:59,species:SPECIES_KEYS[4]},mu:PHYS.GROUNDS['유리']}),candidates:['fixed','grow','shrink'].map((limit,i)=>({key:'ABC'[i],limit})),answerKey:'B',layers:[0,1,2,4,7],goalMarks:[],focus:s=>!s.before||s.n-s.before.n>=PHYS.C.increaseQ5?'play':'rail',judge:s=>PHYS.judgeQ5(s),solve:s=>[{pull:true},{n:Math.min(100,s.n+PHYS.C.increaseQ5),pull:true}]},
 {id:6,icon:'q6',startState:()=>({n:1,species:SPECIES_KEYS[0],mu:PHYS.GROUNDS['자갈']}),candidates:['long','equal','short'].map((ratio,i)=>({key:'ABC'[i],ratio})),answerKey:'C',layers:[6],goalMarks:[],focus:s=>[SPECIES_KEYS[0],SPECIES_KEYS[5]].every(t=>s.visited.includes(t))&&!s.compareOpen?'compare':'species',judge:s=>PHYS.judgeQ6(s),solve:()=>[{species:SPECIES_KEYS[0]},{species:SPECIES_KEYS[5]},{compare:true}]},
 {id:7,icon:'q7',startState:()=>({n:30,species:SPECIES_KEYS[0],mu:PHYS.GROUNDS['자갈']}),candidates:[0,1,2].map((si,i)=>({key:'ABC'[i],species:SPECIES_KEYS[si]})),answerKey:'B',layers:[0,2,3],goalMarks:[30],focus:'species',judge:s=>PHYS.judgeQ7(s),solve:s=>[{species:SPECIES_KEYS.filter(t=>PHYS.outcome(s.n,t,s.mu).winner==='kids').sort((a,b)=>PHYS.SPECIES[b]-PHYS.SPECIES[a])[0],pull:true}]}
].map(d=>({...d,layers:d.layers.map(i=>GRAMMAR.LAYERS[i]),events:s=>d.judge(s),card:s=>CARDS.principle(d.id,s)}));
const QUEST = {
 get i(){return Q.i;},get passed(){return Q.completed.has(Q.i);},
 focus(){const d=QUESTS[Q.i],s=this.sample(),focus=typeof d.focus==='function'?d.focus(s):d.focus;return focus==='rail'&&d.goalMarks.length&&s.n>=d.goalMarks[0]||Q.i===6&&d.judge(s)?'play':focus;},
 state(){return structuredClone({...Q,completed:[...Q.completed]});},
 sample(){const f=Q.flags;return {n:PHYS.kidsFromRailX(S.u.value),species:SPECIES_KEYS[Math.round(S.species.value)],mu:GROUND_VALUES[Math.round(S.ground.value)],observations:f.observations||[],before:f.before||null,after:f.after||null,visited:f.visited||[],compareOpen:!!f.compareOpen};},
 phase(p){if(!PHASES.includes(p))throw new RangeError('phase');Q.phase=p;Q.flags.elapsed=0;questUI();},
 go(i){
  if(!Number.isInteger(i)||!QUESTS[i])throw new RangeError('quest');
  Q.i=i;Q.free=false;Q.pick=null;Q.phase='intro';Q.flags={elapsed:0,idle:0,demoLeft:0,observations:[],visited:[],before:null,after:null,pending:null,events:[],compareOpen:false};
  S.drag=null;controls.enabled=true;
  const start=QUESTS[i].startState();for(const k of ['n','species','mu'])set(k,start[k]);S.u.value=S.u.target;
  S.t.value=S.t.target=0;S.playing.value=S.playing.target=0;
  GRAMMAR.unpin();GRAMMAR.clearRecords();this.layers();DIRECTOR.clear();this.phase('intro');DIRECTOR.intro();syncUI();
 },
 layers(){GRAMMAR.set(Object.fromEntries(GRAMMAR.LAYERS.map(n=>[n,QUESTS[Q.i].layers.includes(n)])));},
 mode(free){Q.free=!!free;Q.flags.pending=null;S.playing.value=S.playing.target=0;DIRECTOR.clear();if(free)GRAMMAR.set({...GRAMMAR.defaults});else this.layers();questUI();shot(S.vertical?0:1,S.vertical);},
 pick(k){if(Q.free||Q.phase!=='predict')return;const c=QUESTS[Q.i].candidates[k];if(!c)throw new RangeError('pick');Q.pick=c.key;this.phase('act');Q.flags.demoLeft=2.2;this.touch();},
 touch(){Q.flags.idle=0;},
 allows(){if(Q.free||['act','card','confirm'].includes(Q.phase))return true;document.getElementById('q-pictures').animate([{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'translateX(0)'}],{duration:220});return false;},
 changed(name){
  const f=Q.flags;f.pending=null;S.playing.target=0;
  if(name==='species'&&!Q.free&&Q.phase==='act'){const species=SPECIES_KEYS[S.species.target];if(!f.visited.includes(species))f.visited.push(species);}
 },
 compare(){if(!this.allows())return;this.touch();Q.flags.compareOpen=!Q.flags.compareOpen;GRAMMAR.set({[GRAMMAR.LAYERS[4]]:false,[GRAMMAR.LAYERS[6]]:Q.flags.compareOpen});questUI();},
 pull(){
  if(!this.allows())return;this.touch();
  if(Q.flags.pending){Q.flags.pending=null;S.playing.target=0;return;}
  if(S.drag||Math.abs(S.u.target-S.u.value)>1e-7)return;
  const s=this.sample();Q.flags.pending={run:++Q.run,n:s.n,species:s.species,mu:s.mu,elapsed:0};S.t.value=S.t.target=0;S.playing.target=1;
 },
 skip(p){this.phase(p==='event'?'observe':p);if(p==='event')DIRECTOR.event(Q.flags.success||this.sample());},
 update(dt){
  if(Q.free)return;const f=Q.flags;f.elapsed+=dt;f.idle+=dt;
  if(Q.phase==='intro'){if(f.elapsed>=.9&&!f.pushed){f.pushed=true;DIRECTOR.push();}if(f.elapsed>=2.7)this.phase('predict');return;}
  if(Q.phase==='act'){
   f.demoLeft=Math.max(0,f.demoLeft-dt);if(S.drag){this.touch();f.demoLeft=0;}
   if(f.idle>=7){f.idle=0;f.demoLeft=2.2;}
   const s=this.sample(),p=f.pending;
   if(p){
    if(S.drag||s.n!==p.n||s.species!==p.species||s.mu!==p.mu||!S.playing.target){f.pending=null;}
    else{
     p.elapsed+=DIRECTOR.time(dt);
     if(p.elapsed>=.9){
      const record={run:p.run,n:p.n,species:p.species,mu:p.mu};f.observations.push(record);f.pending=null;S.playing.value=S.playing.target=0;S.t.value=S.t.target=Math.PI;
      if(!f.before)f.before=record;else{f.after=record;f.before=f.observations.slice(0,-1).find(before=>PHYS.judgeQ5({before,after:record}))||f.observations.at(-2);}
      // Record the event before any presentation cooldown. No invented acceleration.
      const result=PHYS.outcome(p.n,p.species,p.mu);f.events.push({...record,...result});GRAMMAR.record();
      if(f.observations.length===1&&Q.i===3)GRAMMAR.pin();questUI();
     }
    }
   }
   const actual=this.sample();
   if(!S.drag&&(Q.i===5||f.observations.length>0)&&QUESTS[Q.i].judge(actual)){
    // Single-state quests must match the last completed pull, not an unexecuted edit.
    const last=f.observations.at(-1);
    if(Q.i!==5&&![3,4].includes(Q.i)&&(!last||last.n!==actual.n||last.species!==actual.species||last.mu!==actual.mu))return;
    f.success=structuredClone(actual);Q.results[Q.i]={n:actual.n,species:actual.species,mu:actual.mu,success:structuredClone(actual)};
    if(QUESTS[Q.i].events(actual))DIRECTOR.event(actual);this.phase('observe');
   }
  }else if(Q.phase==='observe'&&f.elapsed>=.8){Q.completed.add(Q.i);Q.stars[Q.i]=Q.pick===null||Q.pick===QUESTS[Q.i].answerKey?3:2;this.phase('confirm');if(Q.stars[Q.i]===3)DIRECTOR.chord();}
  else if(Q.phase==='confirm'&&f.elapsed>=.6)this.phase('card');
  else if(Q.phase==='card'&&f.elapsed>=6.1&&Q.i<QUESTS.length-1)this.go(Q.i+1);
 },
 auto(i){
  this.go(i);step(90,1/30);this.pick(QUESTS[i].candidates.findIndex(c=>c.key===QUESTS[i].answerKey));
  for(const command of QUESTS[i].solve(this.sample())){
   for(const k of ['n','species','mu'])if(command[k]!==undefined)set(k,command[k]);
   step(30,1/30);if(command.compare)this.compare();if(command.pull){this.pull();step(40,1/30);}
  }
  for(let n=0;n<3&&Q.phase!=='card';n++)step(30,1/30);
  return {i,passed:this.passed,phase:Q.phase,judge:QUESTS[i].judge(Q.flags.success||this.sample()),stars:Q.stars[i]};
 }
};
