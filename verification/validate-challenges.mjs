import assert from 'node:assert/strict';
import {COURSES,defaults,fresh,solve,record,validate,copy} from '../dist/labs/force-equilibrium/curriculum-model.js';
import {GOALS,goalFor,achieved,previousGhosts,CURLING_HOUSE_RADIUS} from '../dist/labs/force-equilibrium/challenge-goals.js';
import {curlingTarget,createFluidMotion,stepFluidMotion} from '../dist/labs/force-equilibrium/teaching-geometry.js';
import {lessonFor} from '../dist/labs/force-equilibrium/lesson-content.js';
import {createInstrumentPhysics} from '../dist/labs/force-equilibrium/instrument-physics.js';

const examples={
 curling:{force:2},push:{direction:-1},balance:{left:600,right:300,leftPos:2,rightPos:4},scale:{object:'d'},'spring-scale':{object:'milk',eye:1},
 tools:{tool:'lever'},'ramp-tools':{tool:'ramp'},'daily-tools':{example:'stairs'},mobile:{right:200},wearable:{method:'robot'},review:{example:'forklift'},
 'diver-intro':{volume:100},represent:{magnitude:3,direction:-1},parallel:{right:2},'gravity-direction':{position:0},gravity:{planet:'moon'},
 'elastic-shape':{body:'spring',shape:'release'},elastic:{extension:25},friction:{surface:.2},buoyancy:{volume:400},overflow:{volume:400},
 motion:{mode:'stop'},'motion-classify':{mode:'circle'},contact:{contact:'floor'},applications:{example:'balloon'},design:{surface:.2},
 floating:{case:'balloon',clips:4},'review-middle':{case:'submarine',fill:3},turning:{mode:'wrench',reach:1.5},
 'lever-counts':{leftCount:2,rightCount:1,leftPos:1,rightPos:2},torque:{effort:20,arm:.5,loadArm:1},couple:{line:'separated'},
 stability:{tilt:10},shelf:{position:1.5},'review-high':{leftCount:4,rightCount:2,leftPos:1,rightPos:2},vectors:{f1:0,f2:4,angle:90},incline:{mu:.2},
};
const tests=[],check=(name,fn)=>{fn();tests.push({name,pass:true});};
const flags={zeroed:true,placed:true};
const trial=(id,inputs)=>({inputs,result:solve(id,inputs,flags)});
check('All 37 activities have one bilingual goal, reachable on allowed controls and unmet at default conditions',()=>{
 const activities=Object.entries(COURSES).flatMap(([course,c])=>c.activities.map(a=>({course,a})));
 assert.equal(activities.length,37);assert.equal(GOALS.length,activities.length);assert.equal(new Set(GOALS.map(g=>g.id)).size,activities.length);
 for(const {course,a}of activities){
  const goal=goalFor(a.id);assert.ok(goal?.ko&&goal?.en,a.id);const p={...defaults(a),...examples[a.id]};
  for(const c of a.controls)assert.ok(c.options?c.options.some(([v])=>v===p[c.key]):p[c.key]>=c.min&&p[c.key]<=c.max&&Math.abs((p[c.key]-c.min)/c.step-Math.round((p[c.key]-c.min)/c.step))<1e-8,`${a.id}/${c.key}`);
  const s=fresh();s.course=course;s.courses[course].activity=a.id;const e=s.courses[course].experiments[a.id];Object.assign(e,{inputs:p,...flags});
  const t=record(s);assert.equal(goal.met(t),true,`${a.id} reachable`);t.goalMet=goal.met(t);assert.equal(achieved(e.trials),true);assert.deepEqual(validate(s),s,`${a.id} recorded round trip`);
  assert.equal(goal.met(trial(a.id,defaults(a))),false,`${a.id} default should need a change`);
 }
});
check('Curling awards the house band from curlingTarget, requires the target direction and a stop',()=>{
 const goal=goalFor('curling'),met=(distance,direction=1,stopped=true)=>goal.met({inputs:{direction},result:{stopped,metrics:[{key:'displacement',value:distance}]}}),target=curlingTarget()/.35,radius=CURLING_HOUSE_RADIUS/.35;
 assert.ok(met(target));assert.ok(met(target-radius+1e-5));assert.ok(met(target+radius-1e-5));assert.equal(met(target+radius+1e-5),false);assert.equal(met(target-radius-1e-5),false);assert.equal(met(target,-1),false);assert.equal(met(target,1,false),false);
 assert.ok(Math.abs(solve('curling',{force:2,direction:1}).metrics[0].value-target)<1e-8);
 for(const force of [1,3])assert.equal(goal.met(trial('curling',{force,direction:1})),false);
});
check('Floating challenge values are neutral/minimal in solve and differ from guided trials',()=>{
 const base={case:'diver',volume:0,clips:0,fill:0};
 for(const [id,p,key,n]of [['diver-intro',{...base,volume:100},'volume',100],['floating',{...base,case:'balloon',clips:4},'clips',4],['review-middle',{...base,case:'submarine',fill:3},'fill',3]]){
  assert.equal(goalFor(id).met(trial(id,p)),true,id);
  assert.ok(!lessonFor('middle',id).frames.some(f=>goalFor(id).met(trial(id,{...base,...f.inputs}))),`${id}: goal must not repeat a guided trial`);
  if(key!=='volume')for(let i=0;i<n;i++)assert.notEqual(solve(id,{...p,[key]:i}).outcome,'down',`${id} minimum ${i}`);
 }
 const s=createFluidMotion({...base,volume:100});for(let i=0;i<120;i++)stepFluidMotion(s,1/60);assert.equal(s.y,s.start);assert.equal(s.velocity,0);
});
check('Schema version 2 without engagement fields loads with unmet stars and no invented ghosts',()=>{
 const s=fresh();record(s);const loaded=validate(JSON.parse(JSON.stringify(s))),t=loaded.courses.middle.experiments['diver-intro'].trials[0];
 assert.deepEqual(loaded,s);assert.equal(Object.hasOwn(t,'goalMet'),false);assert.equal(Object.hasOwn(t,'ghost'),false);assert.equal(achieved([t]),false);assert.deepEqual(previousGhosts([t]),[]);
});
check('Added goal/ghost fields survive JSON, validation, new records and repeated load',()=>{
 const s=fresh();s.course='elementary';s.courses.elementary.activity='curling';const e=s.courses.elementary.experiments.curling;e.inputs.force=2;
 const ghost={rig:'cart',x:curlingTarget(),y:0,z:0,angle:0,sx:1,sy:1,sz:1},t=record(s,{goalMet:true,ghost});
 assert.deepEqual(t.ghost,ghost);const loaded=validate(JSON.parse(JSON.stringify(s)));assert.deepEqual(loaded,s);assert.deepEqual(validate(loaded),s);assert.ok(achieved(loaded.courses.elementary.experiments.curling.trials));
 for(const change of [t=>t.goalMet='yes',t=>t.ghost.x=Infinity,t=>t.ghost.sx=0,t=>t.ghost.rig='unknown',t=>t.ghost.extra=1]){const bad=copy(s);change(bad.courses.elementary.experiments.curling.trials[0]);assert.throws(()=>validate(bad));}
});
check('Only the last three previous recorded poses appear; the current result is excluded',()=>{
 const trials=Array.from({length:5},(_,i)=>({id:i+1,inputs:{force:i},ghost:{rig:'cart',x:i}}));
 assert.deepEqual(previousGhosts(trials,true).map(g=>g.x),[1,2,3]);assert.deepEqual(previousGhosts(trials).map(g=>g.x),[2,3,4]);
 assert.deepEqual(previousGhosts([{inputs:{}},trials[0]],true),[]);assert.deepEqual(previousGhosts([]),[]);assert.equal(achieved([{goalMet:false},{}]),false);
});
const sim=await createInstrumentPhysics();let measuredGoals=0;
for(const [course,c]of Object.entries(COURSES))for(const a of c.activities){
 const inputs={...defaults(a),...examples[a.id]},r=solve(a.id,inputs,flags);if(!sim.prepare(a.id,inputs,r,flags))continue;
 sim.start();for(let i=0;i<1200&&!sim.done;i++)sim.advance(1/120);assert.equal(sim.done,true,`${a.id} measured completion`);
 const s=fresh();s.course=course;s.courses[course].activity=a.id;Object.assign(s.courses[course].experiments[a.id],{inputs,...flags});
 const t=record(s,{simulation:sim.observation()});t.goalMet=goalFor(a.id).met(t);assert.equal(t.goalMet,true,`${a.id} reachable in real Rapier measurement`);assert.deepEqual(validate(s),s);measuredGoals++;
}
sim.dispose();assert.equal(measuredGoals,10);tests.push({name:'All ten Rapier goal examples succeed using measured records and survive validation',pass:true});
console.log(JSON.stringify({pass:true,activities:GOALS.length,tests},null,2));
