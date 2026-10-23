// One flow state; all science decisions are delegated to PHYS.
const Q = { i:0, phase:'intro', pick:null, stars:Array(7).fill(0), completed:new Set(), free:false, flags:{} };
const QUESTS = [
  {id:1,icon:'moon',startState:{body:0,nWeights:5},candidates:[0,1,6].map((body,k)=>({key:['A','B','C'][k],body})),answerKey:'B',layers:['무게 크기','천체 변경'],goalMarks:[1],controls:['body'],judge:s=>PHYS.judgeQ1(s),events:s=>PHYS.judgeQ1(s),solution:[['body',1]]},
  {id:2,icon:'balance',startState:{body:0,nWeights:5},candidates:[1,3,5].map((n,k)=>({key:['A','B','C'][k],body:1,n,reference:3})),answerKey:'B',layers:['무게 크기','천체 변경','질량 불변'],goalMarks:[0,1],controls:['body','mass','inspect'],judge:s=>PHYS.judgeQ2(s),events:s=>PHYS.judgeQ2(s),solution:[['inspect'],['body',1],['inspect']]},
  {id:3,icon:'band',startState:{body:0,nWeights:5},candidates:[5,6,4].map((body,k)=>({key:['A','B','C'][k],body})),answerKey:'B',layers:['무게 크기','천체 변경'],goalMarks:[5,6,4],controls:['body'],judge:s=>PHYS.judgeQ3(s),events:s=>PHYS.judgeQ3(s),solution:[['body',6]]},
  {id:4,icon:'star',startState:{body:0,nWeights:5},candidates:[{key:'A',body:5},{key:'B',body:7},{key:'C',body:7,detached:true}],answerKey:'B',layers:['무게 크기','천체 변경','계측 한계'],goalMarks:[7],controls:['body','mass','inspect'],judge:s=>PHYS.judgeQ4(s),events:s=>PHYS.springState(s.i,s.nWeights).broken,solution:[['body',7],['inspect']]},
  {id:5,icon:'jump',startState:{body:0,nWeights:5},candidates:[0,1,6].map((body,k)=>({key:['A','B','C'][k],body})),answerKey:'B',layers:['점프 비교','시험 기록'],goalMarks:[0,1],controls:['body','run','pause'],judge:s=>PHYS.judgeQ5(s),events:s=>PHYS.judgeQ5(s),solution:[['run'],['body',1],['run']]},
  {id:6,icon:'compact',startState:{body:0,nWeights:5},candidates:[0,1,8].map((body,k)=>({key:['A','B','C'][k],body})),answerKey:'C',layers:['무게 크기','천체 변경','계측 한계','중력 방향'],goalMarks:[8],controls:['body'],judge:s=>PHYS.judgeQ6(s),events:s=>PHYS.judgeQ6(s),solution:[['body',8]]},
  {id:7,icon:'target',startState:{body:0,nWeights:5},candidates:[1,4,6].map((body,k)=>({key:['A','B','C'][k],body})),answerKey:'B',layers:['무게 크기','천체 변경','추 개수와 무게 비례'],goalMarks:[4,5],controls:['body','mass'],judge:s=>PHYS.judgeQ7(s),events:s=>PHYS.judgeQ7(s),solution:[['body',4]]}
].map(d=>({...d,card:s=>CARDS.principle(d.id,s)}));
const QUEST = {
  get i(){return Q.i;},get passed(){return Q.completed.has(Q.i);},
  state(){return {...Q,stars:[...Q.stars],completed:[...Q.completed],flags:JSON.parse(JSON.stringify(Q.flags))};},
  // A detent is a discrete scientific selection; render interpolation is not a visit.
  sample(){return {i:S.body.target,nWeights:S.nWeights.target,visited:[...Q.flags.visited],runs:Q.flags.runs.map(r=>({...r})),breakSeen:Q.flags.breakSeen};},
  phase(phase){if(!['intro','predict','act','observe','confirm','card'].includes(phase))throw new RangeError('phase');Q.phase=phase;Q.flags.elapsed=0;questUI();},
  go(i){
    if(!Number.isInteger(i)||i<0||i>=QUESTS.length)throw new RangeError('quest');
    Q.i=i;Q.free=false;Q.pick=null;
    Q.flags={elapsed:0,idle:0,demos:0,demoLeft:0,visited:[],balanceWeights:5,runs:[],pending:null,breakSeen:false,broken:false,events:[],success:null};
    S.drag=null;for(const [name,value]of Object.entries(QUESTS[i].startState)){set(name,value);S[name].value=S[name].target;}
    S.trial=null;S.t.value=S.t.target=0;S.playing.value=S.playing.target=0;
    GRAMMAR.unpin();GRAMMAR.resetRecords();this.layers();DIRECTOR.clear();this.phase('intro');DIRECTOR.intro();syncUI();
  },
  layers(){GRAMMAR.set(Object.fromEntries(GRAMMAR.LAYERS.map(n=>[n,QUESTS[Q.i].layers.includes(n)])));},
  pick(k){if(Q.free||Q.phase!=='predict')return;const c=QUESTS[Q.i].candidates[k];if(!c)throw new RangeError('pick');Q.pick=c.key;Q.flags.idle=0;Q.flags.demos++;Q.flags.demoLeft=2.2;this.phase('act');},
  mode(free){Q.free=!!free;DIRECTOR.clear();if(!free)this.layers();questUI();},
  touch(){Q.flags.idle=0;Q.flags.demoLeft=0;},
  allows(name){
    if(Q.free)return true;
    const allowed=['sound','camera'].includes(name)||(['act','confirm','card'].includes(Q.phase)&&QUESTS[Q.i].controls.includes(name));
    if(!allowed)document.getElementById('q-pictures').animate([{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'translateX(0)'}],{duration:220});
    return allowed;
  },
  inspect(){
    if(!this.allows('inspect')||Q.phase!=='act')return;
    const s=this.sample();
    if(Q.i===1&&PHYS.balanceState(s.i,s.nWeights,s.nWeights)==='balanced'&&[0,1].includes(s.i)){
      if(Q.flags.balanceWeights!==s.nWeights)Q.flags.visited=[];Q.flags.balanceWeights=s.nWeights;
      if(!Q.flags.visited.includes(s.i))Q.flags.visited.push(s.i);
    }
    if(Q.i===3&&PHYS.springState(s.i,s.nWeights).broken)Q.flags.breakSeen=true;
    this.touch();questUI();
  },
  trial(trial){if(!Q.free&&Q.phase==='act'&&trial)Q.flags.pending={...trial};},
  skip(phase){this.phase(phase==='event'?'observe':phase);if(phase==='event')DIRECTOR.event(Q.flags.success||this.sample());},
  update(dt){
    if(Q.free)return;
    const f=Q.flags;f.elapsed+=dt;f.idle+=dt;
    if(Q.phase==='intro'){if(f.elapsed>=.9&&!f.pushed){f.pushed=true;DIRECTOR.push();}if(f.elapsed>=2.7)this.phase('predict');return;}
    if(Q.phase==='act'){
      f.demoLeft=Math.max(0,f.demoLeft-dt);if(S.drag)this.touch();
      if(f.idle>=7){f.idle=0;f.demos++;f.demoLeft=2.2;}
      const s=this.sample(),spring=PHYS.springState(s.i,s.nWeights);
      if(Q.i===1&&f.balanceWeights!==s.nWeights){f.visited=[];f.balanceWeights=s.nWeights;}
      // Capture physical transitions before any presentation delay.
      if(spring.broken&&!f.broken)f.events.push({type:'broken',i:s.i,nWeights:s.nWeights,marks:spring.marks});
      f.broken=spring.broken;
      const p=f.pending;
      if(p){
        if(!S.trial||p.runId!==S.trial.runId||p.i!==s.i||p.nWeights!==s.nWeights)f.pending=null;
        else if(p.event==='no-apex'||S.t.value>=PHYS.timeDots(p.i)[PHYS.GRAMMAR_VIEW.trailIntervals/2].time){
          f.runs.push({...p});f.events.push({...p,type:p.event});f.pending=null;
        }
      }
      const actual=this.sample();
      if(QUESTS[Q.i].judge(actual)){
        f.success=JSON.parse(JSON.stringify(actual));
        if(QUESTS[Q.i].events(actual))DIRECTOR.event(f.success);
        this.phase('observe');
      }
    }else if(Q.phase==='observe'&&f.elapsed>=.8){
      // Debug skip cannot manufacture a completion.
      if(!f.success||!QUESTS[Q.i].judge(f.success))return;
      Q.completed.add(Q.i);Q.stars[Q.i]=Q.pick===null||Q.pick===QUESTS[Q.i].answerKey?3:2;
      this.phase('confirm');if(Q.stars[Q.i]===3)DIRECTOR.chord();
    }else if(Q.phase==='confirm'&&f.elapsed>=.6)this.phase('card');
    else if(Q.phase==='card'&&f.elapsed>=6.1&&Q.i<QUESTS.length-1)this.go(Q.i+1);
  },
  solve(){
    for(const [op,value]of QUESTS[Q.i].solution){
      if(op==='inspect')this.inspect();else if(op==='run')runTrial();else set(op,value);
      step(op==='run'?110:40,1/30);
    }
    for(let k=0;k<4&&Q.phase!=='card';k++)step(30,1/30);
    return {i:Q.i,passed:this.passed,phase:Q.phase,judge:QUESTS[Q.i].judge(this.sample()),stars:Q.stars[Q.i]};
  },
  auto(i){this.go(i);step(90,1/30);this.pick(QUESTS[i].candidates.findIndex(c=>c.key===QUESTS[i].answerKey));return this.solve();}
};
