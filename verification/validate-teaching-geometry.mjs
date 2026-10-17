import assert from 'node:assert/strict';
import {COURSES,defaults,solve,fresh,record} from '../dist/labs/force-equilibrium/curriculum-model.js';
import {lessonFor,frameEvidence} from '../dist/labs/force-equilibrium/lesson-content.js';
import {guidedStart,observeHint,manipulationKeys} from '../dist/labs/force-equilibrium/lesson-guidance.js';
import {overflowPose,liftPose,floatingPose,wrenchPose,designPose,cartDisplayScale} from '../dist/labs/force-equilibrium/teaching-geometry.js';
const tests=[],check=(name,fn)=>{fn();tests.push({name,pass:true});},near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
check('Overflow immersion equals the displaced fraction at zero, half and full volume',()=>{
 for(const volume of [0,200,400]){const p=overflowPose(volume,1);near((p.surface-p.bottom)/p.bodyHeight,volume/400);near(p.cupHeight/.8,volume/400);}
});
check('Direct lifting, lever and ramp raise the same load by the same 0.5 m display height',()=>{
 for(const length of [1,2,3])for(const method of ['direct','lever','ramp']){const a=liftPose(method,length,0),b=liftPose(method,length,1);near((b.loadY??b.y)-(a.loadY??a.y),.45);}
});
check('Balanced floating objects cannot drift from floating point residue',()=>{
 for(const progress of [0,.25,.75,1])near(floatingPose('still',-6.9e-18,progress).y,1.5);
 assert.ok(floatingPose('up',1,1).y>1.5);assert.ok(floatingPose('down',-1,1).y<1.5);
});
check('Wrench force stays on its moving endpoint and scales linearly with force',()=>{
 for(const angle of [30,90])for(const reach of [.5,1]){const p=wrenchPose(reach,angle,12,1);near(Math.hypot(p.x,p.y-1.2),reach);near(Math.atan2(p.dy,p.dx),p.rotation-angle*Math.PI/180);near(p.length,1.2);}
 near(wrenchPose(1,90,6,1).length,wrenchPose(1,90,12,1).length/2);
});
check('One metre marker and bumper contact share the sled displacement scale',()=>{
 const origin=designPose(0,1),target=designPose(1,1);near(target.x,target.targetX);
 near(designPose(.3,1).x+.35,origin.contactX);
 const compression=Math.sqrt(1*1.5**2/20),end=designPose(.3+compression,1);near(end.x+.35-end.contactX,compression*1.9);
});
check('Largest permitted parallel force stays visible without altering physical travel',()=>{
 const a=COURSES.middle.activities.find(a=>a.id==='parallel'),p={...defaults(a),arrangement:'same',left:4,right:4,initial:1},r=solve(a.id,p);
 const displacement=r.initialVelocity*1.2+.5*8/r.mass*1.2**2;assert.ok(displacement>5);near(displacement*cartDisplayScale(r),1.45);
});
check('Guided tasks retain the previous adjustable condition so learners must solve it',()=>{
 for(const [cid,id,frame,key]of [['elementary','balance',3,'rightPos'],['physics','lever-counts',1,'rightCount'],['elementary','mobile',2,'leftPos']]){
 const a=COURSES[cid].activities.find(a=>a.id===id),l=lessonFor(cid,id),start=guidedStart(l,frame,defaults(a));assert.notEqual(start[key],l.frames[frame].inputs[key],`${id}/${key}`);
 }
 for(const [cid,c]of Object.entries(COURSES))for(const a of c.activities)for(const lang of ['ko','en'])assert.ok(observeHint(a.id,lang).length>10);
});
check('Same-load design revision and lower-centre comparison change one relevant condition',()=>{
 const frames=lessonFor('middle','design').frames;for(const k of ['mass','speed','k'])assert.equal(new Set(frames.map(f=>f.inputs[k])).size,1,k);
 const stable=lessonFor('physics','stability').frames;near(stable.at(-1).inputs.width,stable.at(-2).inputs.width);assert.deepEqual(stable.at(-1).variable,['height']);
});
check('Spring and lever evidence require predictions made before each recorded trial',()=>{
 for(const [cid,id]of [['middle','elastic'],['physics','lever-counts']]){const s=fresh();s.course=cid;s.courses[cid].activity=id;const e=s.courses[cid].experiments[id],l=lessonFor(cid,id),f=l.frames[0];Object.assign(e.inputs,f.inputs);e.zeroed=true;record(s,{frameId:f.id});assert.equal(frameEvidence(l,e)[0],false);record(s,{frameId:f.id,prediction:'Predicted before measurement'});assert.equal(frameEvidence(l,e)[0],true);}
});
check('Every activity starts with visible valid manipulation keys instead of hiding all controls',()=>{
 for(const [cid,c]of Object.entries(COURSES))for(const a of c.activities){const l=lessonFor(cid,a.id),keys=manipulationKeys(a.id,l.frames[0],defaults(a));assert.ok(keys.length,`${cid}/${a.id}`);for(const key of keys)assert.ok(a.controls.some(c=>c.key===key),`${a.id}/${key}`);}
});
check('High-school introduction reviews resultants before wrench and lever investigations',()=>{
 const first=COURSES.physics.activities[0],l=lessonFor('physics',first.id);assert.equal(first.id,'turning');assert.deepEqual(l.frames.slice(0,3).map(f=>f.inputs.mode),['same','opposite','wrench']);
 for(const [i,net]of [[0,4],[1,0]])near(solve(first.id,{...defaults(first),...l.frames[i].inputs}).metrics.find(m=>m.key==='net').value,net);
});
console.log(JSON.stringify({pass:true,tests},null,2));
