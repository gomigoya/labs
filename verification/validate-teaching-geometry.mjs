import assert from 'node:assert/strict';
import {COURSES,defaults,solve,fresh,record} from '../dist/labs/force-equilibrium/curriculum-model.js';
import {lessonFor,frameEvidence} from '../dist/labs/force-equilibrium/lesson-content.js';
import {guidedStart,observeHint,manipulationKeys} from '../dist/labs/force-equilibrium/lesson-guidance.js';
import {overflowPose,liftPose,createFluidMotion,stepFluidMotion,wrenchPose,designPose,cartDisplayScale,frictionPose,liftingReading,shelfPose,curlingTarget} from '../dist/labs/force-equilibrium/teaching-geometry.js';
const tests=[],check=(name,fn)=>{fn();tests.push({name,pass:true});},near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
check('Overflow immersion equals the displaced fraction at zero, half and full volume',()=>{
 for(const volume of [0,200,400]){const p=overflowPose(volume,1);near((p.surface-p.bottom)/p.bodyHeight,volume/400);near(p.cupHeight/.8,volume/400);}
});
check('Direct lifting, lever and ramp raise the same load by the same 0.5 m display height',()=>{
 for(const length of [1,2,3])for(const method of ['direct','lever','ramp']){const a=liftPose(method,length,0),b=liftPose(method,length,1);near((b.loadY??b.y)-(a.loadY??a.y),.45);}
});
check('Balanced floating objects cannot drift from floating point residue',()=>{
 const neutral=createFluidMotion({case:'diver',volume:100});for(let i=0;i<120;i++){stepFluidMotion(neutral,1/60);near(neutral.y,neutral.start);}
 const up=createFluidMotion({case:'diver',volume:400}),down=createFluidMotion({case:'diver',volume:0});stepFluidMotion(up,1);stepFluidMotion(down,1);assert.ok(up.y>up.start);assert.ok(down.y<down.start);
});
check('Torsion wrench deflection is proportional to 2, 6 and 12 N·m without saturation',()=>{
 const poses=[[.5,90,4],[1.5,90,4],[1.5,90,8]].map(args=>wrenchPose(...args,1));
 near(poses[0].rotation,-Math.PI/18);near(poses[1].rotation,3*poses[0].rotation);near(poses[2].rotation,6*poses[0].rotation);near(poses[2].rotation,-Math.PI/3);
 near(wrenchPose(1.5,30,8,1).rotation,poses[1].rotation);near(wrenchPose(1.5,90,10,1).rotation,poses[2].rotation*10/8);
 for(const args of [[.5,90,4],[1.5,90,4],[1.5,90,8],[1.5,30,8]])near(wrenchPose(...args,.5).rotation,wrenchPose(...args,1).rotation/2);
});
check('Wrench force, line of action and perpendicular arm remain attached throughout rotation',()=>{
 near(wrenchPose(1.5,90,4,1).length*2,wrenchPose(1.5,90,8,1).length);
 near(wrenchPose(1.5,30,8,1).momentArm,.75);
 for(const angle of [30,60,90])for(const reach of [.5,1.5])for(const effort of [2,4,8,10])for(const progress of [0,.5,1]){
  const p=wrenchPose(reach,angle,effort,progress);near(Math.hypot(p.x,p.y),reach);near(p.x,reach*Math.cos(p.rotation));near(p.y,reach*Math.sin(p.rotation));near(p.dx,Math.cos(p.rotation-angle*Math.PI/180));near(p.dy,Math.sin(p.rotation-angle*Math.PI/180));near(p.length,effort*.1);near(Math.hypot(p.tipX-p.x,p.tipY-p.y),p.length);
  near(p.momentArm,reach*Math.sin(angle*Math.PI/180));near(Math.hypot(p.footX,p.footY),p.momentArm);near(p.footX*p.dx+p.footY*p.dy,0);near((p.x-p.footX)*p.dy-(p.y-p.footY)*p.dx,0);
 }
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
check('Pull rises against static friction before the block slips at the recorded force',()=>{
 const activity=COURSES.middle.activities.find(a=>a.id==='friction');
 for(const surface of [.05,.2])for(const mass of [.5,1,2,3]){const r=solve('friction',{...defaults(activity),mass,surface}),threshold=r.metrics.find(m=>m.key==='startForce').value,start=frictionPose(threshold,0),held=frictionPose(threshold,.4),onset=frictionPose(threshold,.65),slide=frictionPose(threshold,1);near(held.blockX,start.blockX);assert.ok(held.reading>0&&held.reading<threshold);near(onset.reading,threshold);near(onset.blockX,start.blockX);assert.ok(onset.slipping);assert.ok(slide.blockX>onset.blockX+.8);near(slide.reading,threshold);assert.ok(slide.scaleX>held.scaleX);}
});
check('Longer effort arms and ramps reduce the actual force while keeping the same lift height',()=>{
 for(const [id,tool]of [['tools','lever'],['ramp-tools','ramp']]){const a=COURSES.elementary.activities.find(a=>a.id===id),forces=[];for(const length of [1,2,3]){const r=solve(id,{...defaults(a),mass:1,tool,length}),reading=liftingReading(r,1);near(reading.force,reading.directForce*.5/length);near(reading.units,r.metrics.find(m=>m.key==='withTool').value*100);assert.ok(reading.force<reading.directForce);forces.push(reading.force);}assert.ok(forces[0]>forces[1]&&forces[1]>forces[2]);}
});
check('Shelf tie ends at its overhead wall bracket and support arrows equal the solved forces',()=>{
 const a=COURSES.physics.activities.find(a=>a.id==='shelf');for(const position of [.5,1.5,2.5])for(const load of [60,120,180]){const p={...defaults(a),position,load},r=solve('shelf',p),pose=shelfPose(p.length,position,load);near(pose.tie[0],pose.anchor[0]);assert.ok(pose.anchor[1]>pose.tie[1]);near(pose.reaction+pose.tension,load);near(pose.tension*p.length,load*position);near(pose.tension,r.metrics.find(m=>m.key==='ropeForce').value);near(pose.reaction,r.metrics.find(m=>m.key==='wallReaction').value);near(pose.loadX,-1.6+position/p.length*3.2);}
});
check('Curling medium push target uses its frictional stopping distance',()=>{
 const a=COURSES.elementary.activities.find(a=>a.id==='curling'),r=solve('curling',{...defaults(a),force:2});near(curlingTarget(r),2.301020408163265*.35);
});
console.log(JSON.stringify({pass:true,tests},null,2));
