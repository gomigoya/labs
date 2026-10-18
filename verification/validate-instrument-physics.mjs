import assert from 'node:assert/strict';
import {createInstrumentPhysics,measuredResult,validateObservation} from '../dist/labs/force-equilibrium/instrument-physics.js';
import {solve,fresh,record,validate,defaults,COURSES} from '../dist/labs/force-equilibrium/curriculum-model.js';
import {curlingTarget} from '../dist/labs/force-equilibrium/teaching-geometry.js';
import {cartSettings,MAX_OBSERVATION} from '../dist/labs/force-equilibrium/instrument-measurements.js';
const checks=[];
const near=(a,b,t=.02)=>assert.ok(Math.abs(a-b)<=t,`${a} != ${b} ±${t}`);
const check=async(name,fn)=>{await fn();checks.push({name,pass:true});};
const sim=await createInstrumentPhysics();
const run=(id,p,flags={},seconds)=>{const theory=solve(id,p,flags);sim.prepare(id,p,theory,flags);sim.start();for(let i=0;i<Math.ceil((seconds??10)*120);i++)sim.advance(1/120);return {o:sim.observation(),r:theory};};
await check('Curling and push theory stopping distances agree with Rapier within 0.02 m',()=>{
 const cases=[...[1,2,3].map(force=>['curling',{force,mass:1}]),...[1,2,4].map(mass=>['push',{force:2,mass}])];
 for(const [id,p]of cases)for(const direction of [-1,1]){
  const {o,r}=run(id,{...p,direction}),distance=r.metrics.find(m=>m.key==='displacement').value;
  assert.equal(o.complete,true);assert.equal(o.settled,true);validateObservation(o);
  near(distance,Math.abs(o.final.x),.02);
  near(r.duration,Math.min(9,p.force/p.mass*.5/(.02*9.8)),1e-8);
  // Rapier observes a further 0.35 s of rest before marking the cart settled.
  assert.ok(o.final.time>=r.duration&&o.final.time-r.duration<.4);
  if(id==='curling'&&p.force===2){near(curlingTarget(r),distance*.35,1e-8);near(curlingTarget(r),Math.abs(o.final.x)*.35,.02*.35);}
 }
});
await check('Brief-push theory stays still below friction and caps observation time',()=>{
 for(const id of ['curling','push']){
  const limit=cartSettings(id).friction*9.8;for(const force of [0,limit/2,limit]){const r=solve(id,{mass:1,force,direction:1});assert.equal(r.metrics.find(m=>m.key==='displacement').value,0);assert.equal(r.duration,0);}
  assert.equal(solve(id,{mass:1,force:10,direction:1}).duration,MAX_OBSERVATION);
 }
});
await check('Curling gentle, medium and strong pushes stop at distinct distances',()=>{const distances=[1,2,3].map(force=>{const {o,r}=run('curling',{force,direction:1});assert.equal(o.complete,true);assert.equal(o.settled,true);near(Math.hypot(o.final.vx,o.final.vz),0,.001);assert.ok(o.final.time<9);const m=measuredResult(r,o);near(m.stoppingDistance,Math.abs(o.final.x),1e-8);return m.stoppingDistance;});assert.ok(distances[0]+.2<distances[1]&&distances[1]+.2<distances[2]);});
await check('Same brief push, heavier load stops sooner in both directions',()=>{for(const direction of [-1,1]){const distances=[1,2,4].map(mass=>{const {o}=run('push',{mass,force:2,direction});assert.equal(o.settled,true);near(o.final.vx,0,.001);return Math.abs(o.final.x);});assert.ok(distances[0]>distances[1]&&distances[1]>distances[2]);}});
await check('Planar Rapier resultant has measured 5 N and atan2(4,3) direction',()=>{const {o,r}=run('vectors',{f1:3,f2:4,angle:90});assert.equal(o.complete,true);near(Math.atan2(-o.final.z,o.final.x)*180/Math.PI,Math.atan2(4,3)*180/Math.PI,2);const m=measuredResult(r,o);near(m.resultantMagnitude,5,.01);near(m.resultantDirection,Math.atan2(4,3)*180/Math.PI,2);});
await check('Rapier cart: force, mass, inertia and exact sampling time',()=>{for(const mass of [1,2]){const {o}=run('vectors',{mass,f1:2,f2:0,angle:90}, {},1);near(o.final.x,1/mass,.015);near(o.final.vx,2/mass,.01);near(o.final.ax,2/mass,.01);near(o.final.time,1,1e-8);}});
await check('Zero net force does not stop an already moving cart',()=>{const {o}=run('parallel',{left:2,right:2,initial:1,arrangement:'opposite'}, {},1.2);near(o.final.vx,1,.001);near(o.final.x,1.2,.01);});
await check('Opposite and same-direction forces use the curriculum vectors',()=>{const p={left:2,right:2,initial:0,arrangement:'same'};const {o,r}=run('parallel',p);near(o.final.ax,r.metrics[0].value,.01);});
await check('Vector and leftward motion report speed magnitude consistently with the live readout',()=>{for(const [id,p]of [['vectors',{mass:1,f1:3,f2:4,angle:90}],['push',{mass:1,force:2,direction:-1}]]){const {o,r}=run(id,p);near(measuredResult(r,o).metrics.find(m=>m.key==='speed').value,Math.hypot(o.final.vx,o.final.vz),1e-8);}});
await check('Spring settles to mg/k; force and scale share actual extension',()=>{const {o,r}=run('elastic',{mass:.5,k:50,springMode:'hanging'});near(o.final.extension,.098,.001);near(o.final.force,4.9,.05);assert.equal(o.settled,true);near(measuredResult(r,o).metrics.find(m=>m.key==='extension').value,o.final.extension*100,1e-8);});
await check('Spring stretch has a transient and agrees with the final gauge',()=>{const {o}=run('elastic',{k:50,extension:20,springMode:'stretch'});near(o.final.extension,.2,.001);near(o.final.force,10,.05);assert.ok(o.samples.some(s=>Math.abs(s.extension-.2)>.05));});
await check('Elementary spring scale: no load, 50, 100 and 175 g',()=>{for(const [object,grams]of [['eraser',50],['apple',100],['milk',175]]){const {o,r}=run('spring-scale',{object,eye:1},{zeroed:true,placed:true});near(o.final.reading,grams,.2);near(measuredResult(r,o).metrics[0].value,grams,.01);}const {o}=run('spring-scale',{object:'apple',eye:1},{zeroed:true,placed:false});near(o.final.reading,0,.01);});
await check('Beam: equal moments stay level; imbalance changes dynamics, not a staged sign angle',()=>{const p={left:100,right:200,leftPos:2,rightPos:1};const {o}=run('balance',p);near(o.final.leftMoment,.196,.01);near(o.final.rightMoment,.196,.01);near(o.final.angle,0,.015);const a=run('balance',{...p,left:200}, {},.1).o;const b=run('balance',{...p,left:600}, {},.1).o;assert.ok(a.final.angle>0);assert.ok(b.final.angle>a.final.angle);});
await check('A block leaving the beam lands on the stage and is not counted as a supported moment',()=>{const {o,r}=run('balance',{left:0,right:300,leftPos:1,rightPos:5});assert.ok(o.final.fallen>0);assert.equal(measuredResult(r,o).outcome,'loadFell');near(o.final.rightMoment,0,.001);assert.ok(sim.snapshot().loads.every(l=>l.y>-.55));});
await check('Fixed-step results are independent of rendering frame rate',()=>{const p={mass:1,force:2,direction:1};const baseline=run('push',p).o;sim.prepare('push',p,solve('push',p));sim.start();for(let i=0;i<180;i++)sim.advance(1/30);near(sim.observation().final.x,baseline.final.x,1e-6);});
await check('Removing a load preserves the initial spring extension and recoils to zero',()=>{run('spring-scale',{object:'apple',eye:1},{zeroed:true,placed:true});const previous=sim.snapshot();sim.prepare('spring-scale',{object:'apple',eye:1},solve('spring-scale',{object:'apple',eye:1},{zeroed:true,placed:false}),{zeroed:true,placed:false},previous);near(sim.snapshot().reading,100,.2);sim.start();for(let i=0;i<720&&!sim.done;i++)sim.advance(1/120);near(sim.snapshot().reading,0,.2);});
await check('Cancelling a drag restores the actual world and observation, including the trace',()=>{run('balance',{left:300,right:600,leftPos:2,rightPos:2});const saved=sim.capture(),before=sim.observation();run('push',{mass:1,force:2,direction:1});sim.restore(saved);assert.deepEqual(sim.observation(),before);});
await check('Measurements survive validation and storage without accepting malformed traces',()=>{const p=defaults(COURSES.elementary.activities.find(a=>a.id==='push'));const {o}=run('push',p);const s=fresh();s.course='elementary';s.courses.elementary.activity='push';record(s,{simulation:o});const v=validate(JSON.parse(JSON.stringify(s))),trial=v.courses.elementary.experiments.push.trials[0];assert.deepEqual(trial.simulation,o);assert.equal(trial.result.source,'rapier');near(trial.result.stoppingDistance,Math.abs(o.final.x),1e-8);const mismatch=structuredClone(s);mismatch.courses.elementary.experiments.push.trials[0].simulation.kind='beam';assert.throws(()=>validate(mismatch));near(trial.result.metrics[0].value,Math.abs(o.final.x),1e-8);const bad=structuredClone(o);bad.final.x=NaN;assert.throws(()=>validateObservation(bad));});
await check('Irregular rendering steps always complete the timed vector observation',()=>{const p={f1:3,f2:4,angle:90};for(const dt of [1/60,.003,.041]){sim.prepare('vectors',p,solve('vectors',p));sim.start();for(let t=0;t<1.3;t+=dt)sim.advance(dt);assert.equal(sim.done,true);near(sim.observation().final.time,1.2,1e-8);validateObservation(sim.observation());}});
await check('Earlier frictionless push records still load without renaming stored fields',()=>{const p={mass:1,force:1,direction:1},s=fresh();s.course='elementary';s.courses.elementary.activity='push';Object.assign(s.courses.elementary.experiments.push.inputs,p);const {o}=run('parallel',{left:0,right:1,initial:0,arrangement:'same'});o.activity='push';record(s,{simulation:o});const restored=validate(JSON.parse(JSON.stringify(s))),trial=restored.courses.elementary.experiments.push.trials[0];near(trial.simulation.final.vx,1.2,.001);near(trial.result.metrics.find(m=>m.key==='displacement').value,o.final.x,1e-8);assert.equal(trial.result.source,'rapier');});
sim.dispose();console.log(JSON.stringify(checks,null,2));
