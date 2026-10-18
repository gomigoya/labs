import assert from 'node:assert/strict';
import {fresh as freshState,COURSES,solve,record,validate,defaults,copy} from '../dist/labs/force-equilibrium/curriculum-model.js';
import {LESSONS,learningStatus} from '../dist/labs/force-equilibrium/lesson-content.js';
import {COVERAGE} from '../dist/labs/force-equilibrium/teacher-coverage.js';
const fresh=()=>{const s=freshState();s.courses.middle.activity='parallel';s.courses.elementary.activity='push';return s;};
const tests=[];
const check=(name,fn)=>{fn();tests.push({name,pass:true})};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8, a+' != '+b);
const value=(r,key)=>r.metrics.find(m=>m.key===key).value;
check('37 activities map to 10 L01 standards, with high-school subjects separated',()=>{assert.equal(Object.values(COURSES).flatMap(c=>c.activities).length,37);assert.equal(new Set(Object.values(COURSES).flatMap(c=>c.activities.flatMap(a=>a.codes))).size,10);assert.equal(COURSES.physics.band,'high');assert.equal(COURSES.mechanics.band,'high')});
check('Elementary controls exclude vectors, angles and torque',()=>{for(const a of COURSES.elementary.activities)assert.ok(!a.controls.some(c=>['angle','f1','f2','torque'].includes(c.key)));assert.deepEqual(COURSES.middle.activities.find(a=>a.id==='parallel').controls.slice(0,3).map(c=>c.key),['left','right','initial'])});
check('Same brief push, heavier cart stops sooner with surface friction',()=>{near(value(solve('push',{mass:1,force:2,direction:1}),'displacement'),2.301020408163265);near(value(solve('push',{mass:2,force:2,direction:1}),'displacement'),0.5127551020408164)});
check('Balance and scale have separate measurement procedures',()=>{assert.equal(solve('balance',{left:300,right:500}).outcome,'rightHeavy');assert.equal(solve('scale',{grams:500},{zeroed:false,placed:true}).metrics[0].value,null);assert.equal(solve('scale',{grams:1000},{zeroed:true,placed:true}).metrics[1].value,1)});
check('Tools trade force for distance at the same 0.5 m lift',()=>{const a=solve('tools',{mass:1,tool:'ramp',length:1}),b=solve('tools',{mass:1,tool:'ramp',length:2});near(value(a,'withTool')*.98*10*value(a,'distance'),4.9);near(value(b,'withTool'),.25);near(value(b,'distance'),2)});
check('Zero net force preserves prior velocity',()=>{const r=solve('parallel',{left:2,right:2,initial:1});assert.equal(r.outcome,'constant');near(value(r,'speed'),1)});
check('Earth and Moon change weight, not mass',()=>{const a=solve('gravity',{mass:2,planet:'earth'}),b=solve('gravity',{mass:2,planet:'moon'});near(value(a,'massScience'),value(b,'massScience'));near(value(a,'weight'),19.6);near(value(b,'weight'),3.24)});
check('Same suspended load: stiffness changes extension, not force',()=>{const a=solve('elastic',{mass:1,k:50}),b=solve('elastic',{mass:1,k:100});near(value(a,'weight'),value(b,'weight'));near(value(a,'extension'),2*value(b,'extension'))});
check('Friction onset is a controlled static measurement',()=>{const r=solve('friction',{mass:1,surface:.2});near(value(r,'startForce'),1.96);assert.equal(r.dynamic,false);assert.equal(solve('design',{surface:.2}).metrics.find(m=>m.key==='displacement').value<1,true)});
check('Buoyancy and apparent weight sum to true weight',()=>{const r=solve('buoyancy',{density:1000,volume:200});near(value(r,'buoyancy'),1.96);near(value(r,'scale'),7.84)});
check('Net force zero is insufficient when net torque is nonzero',()=>{const r=solve('torque',{effort:10,arm:2,loadArm:1});near(value(r,'net'),0);near(value(r,'torque'),10);near(value(r,'reaction'),20);assert.equal(r.outcome,'counter')});
check('Support distinguishes inside, edge and outside',()=>{for(const [offset,outcome]of [[0,'stable'],[.5,'edge'],[.75,'tips']])assert.equal(solve('stability',{width:1,offset}).outcome,outcome)});
check('3-4-5 vector composition',()=>{const r=solve('vectors',{f1:3,f2:4,angle:90});near(value(r,'net'),5);near(value(r,'rx'),3);near(value(r,'ry'),4)});
check('Incline limiting friction, normal force and tension balance',()=>{const r=solve('incline',{angle:30,mu:.1});near(value(r,'normal'),9.8*Math.cos(Math.PI/6));near(value(r,'tension')+value(r,'friction'),4.9);near(value(r,'net'),0)});
check('School and activity records do not alias',()=>{const s=fresh();record(s);s.course='elementary';record(s);assert.equal(s.courses.middle.experiments.parallel.trials.length,1);assert.equal(s.courses.elementary.experiments.push.trials.length,1);assert.equal(s.courses.elementary.experiments.balance.trials.length,0);assert.equal(s.courses.elementary.experiments.push.trials[0].schoolBand,'elementary')});
check('Reload preserves conditions, notes and all course records',()=>{const s=fresh();s.courses.middle.experiments.parallel.note='same speed';record(s);assert.deepEqual(validate(JSON.parse(JSON.stringify(s))),s)});
check('Import recomputes measurements and rejects cross-course or invalid inputs',()=>{const s=fresh();record(s);const fake=copy(s);fake.courses.middle.experiments.parallel.trials[0].result.metrics[0].value=900;near(validate(fake).courses.middle.experiments.parallel.trials[0].result.metrics[0].value,-1);for(const mutate of [x=>x.courses.middle.experiments.parallel.inputs.right=99,x=>x.courses.middle.experiments.parallel.trials[0].courseId='physics',x=>x.courses.middle.experiments.parallel.trials[0].schoolBand='elementary',x=>x.courses.middle.experiments.parallel.trials[0].at='invalid']){const bad=copy(s);mutate(bad);assert.throws(()=>validate(bad))}});
check('Every activity default and boundary produces finite numeric measurements',()=>{for(const c of Object.values(COURSES))for(const a of c.activities){const p=defaults(a);for(const control of a.controls){for(const v of control.options?control.options.map(o=>o[0]):[control.min,control.max]){const r=solve(a.id,{...p,[control.key]:v},{zeroed:true,placed:true});assert.ok(r.metrics.length>0);assert.ok(r.metrics.every(m=>Number.isFinite(m.value)))}}}});

// Permanent answer slots from the pre-content-revision schema. Labels may improve;
// stored indices, question ids and the correct slot must not move.
const savedAnswerSlots=`elementary/curling:push-distance=0/2,target=0/2
elementary/push:load-effort=1/3,size=1/2
elementary/balance:equal-distance=0/3,different-distance=0/3
elementary/scale:rank=3/4,difference=1/3,need-scale=1/2
elementary/spring-scale:division=0/3,bag-zero=0/2,spring-weight-difference=0/2,pointer-up=0/2,range=1/2
elementary/tools:lever-effort=0/2,weight=1/2
elementary/ramp-tools:ramp-effort=0/2,loading=1/2
elementary/daily-tools:classify=1/2,source=0/2
elementary/mobile:fix=0/2,introduce=0/2
elementary/wearable:assist=0/2,use=0/2
elementary/review:review-load=0/2,review-level=1/2,review-infer=0/3,review-zero=0/2,review-units=0/2,review-tool=1/2,review-transfer=0/2
middle/diver-intro:diver-force=0/2,diver-question=0/2
middle/represent:origin=0/2,science-force=0/2,length=0/3
middle/parallel:net=0/3,zero-motion=0/2
middle/gravity-direction:centre=0/2,up-ball=0/2
middle/gravity:mass=0/2,weight-unit=0/2
middle/elastic-shape:restore=0/2,elastic-use=0/2
middle/elastic:extension=0/2,spring-predict=0/3
middle/friction:fair=0/2,opposes=0/2,friction-use=0/2
middle/buoyancy:difference=0/3,sink-buoyancy=0/2
middle/overflow:displaced=0/2,gas=0/2
middle/motion:force-motion=0/2,sideways=0/2
middle/motion-classify:circle=0/3,fall-class=0/3,projectile=0/2
middle/contact:floor-force=0/2,one-body=0/2
middle/applications:toy=0/2,accessible=0/2
middle/design:test-purpose=0/2,improve=0/2
middle/floating:different-controls=0/2,submarine=0/2
middle/review-middle:review-zero=1/2,review-spring=0/2,review-friction=1/2,review-water=1/2,review-moon=0/2
physics/turning:resultant-review=0/2,turning-distance=0/2,perpendicular=0/2
physics/lever-counts:count-product=0/2,new-count=0/3
physics/torque:two-conditions=0/2,reaction=0/2
physics/couple:zero-rotate=0/2,phone=0/2
physics/stability:projection=0/2,stability-improve=0/2
physics/shelf:rope=0/3,wall=0/2
physics/review-high:crane=0/2,review-stable=0/2,two-forces=1/2
mechanics/vectors:three-four=0/2,vector-zero=0/2
mechanics/incline:normal=0/2,static=1/2`;
check('Every question has at least three distinct choices and points to the student record',()=>{let count=0;for(const l of Object.values(LESSONS))for(const q of [...l.questions,l.transfer]){count++;assert.ok(q.options.length>=3,q.id);for(const language of [0,1])assert.equal(new Set(q.options.map(p=>p[language])).size,q.options.length,q.id);assert.match(q.feedback[0],/기록/,q.id);assert.match(q.feedback[1],/your recorded/,q.id);}assert.equal(count,91)});
check('All old question ids and saved answer indices still load with the same correctness',()=>{const s=fresh();for(const line of savedAnswerSlots.split('\n')){const [key,items]=line.split(':');const [cid,aid]=key.split('/'),l=LESSONS[key],e=s.courses[cid].experiments[aid],qs=[...l.questions,l.transfer];assert.equal(qs.length,items.split(',').length);for(const item of items.split(',')){const [id,slots]=item.split('='),[correct,oldLength]=slots.split('/').map(Number),q=qs.find(q=>q.id===id);assert.ok(q,id);assert.equal(q.correct,correct,key+'/'+id);assert.ok(q.options.length>=oldLength);for(let answer=0;answer<oldLength;answer++){e.learning.answers={[id]:answer};const restored=validate(JSON.parse(JSON.stringify(s))).courses[cid].experiments[aid];assert.equal(restored.learning.answers[id],answer);assert.equal(learningStatus(l,restored).checked,answer===correct?1:0);}}}});
check('37 activities, 117 guided conditions and 45 teacher objectives remain mapped',()=>{assert.equal(Object.keys(LESSONS).length,37);assert.equal(Object.values(LESSONS).reduce((n,l)=>n+l.frames.length,0),117);assert.equal(Object.values(COVERAGE).flat().length,45);for(const [cid,goals]of Object.entries(COVERAGE))for(const goal of goals)for(const id of goal.activities)assert.ok(COURSES[cid].activities.some(a=>a.id===id))});
check('Elementary instructions and question explanations use short everyday sentences',()=>{for(const a of COURSES.elementary.activities){const l=LESSONS['elementary/'+a.id],pairs=[a.instruction,a.prompt,l.kit,l.safety,l.prediction,l.planPrompt,...l.frames.map(f=>f.title),...[...l.questions,l.transfer].flatMap(q=>[q.title,q.feedback])].filter(Boolean);for(const pair of pairs){assert.doesNotMatch(pair[0],/작용선|알짜힘|반력/,a.id);for(const sentence of pair[0].split(/[.!?。]/))assert.ok(sentence.trim().length<=25,a.id+': '+sentence)}}});
check('Labels describe actual airflow, bumper stiffness and observed devices',()=>{const a=id=>COURSES.middle.activities.find(a=>a.id===id);assert.equal(a('motion').controls.find(c=>c.key==='mode').label,'windMode');assert.deepEqual(a('motion').controls.find(c=>c.key==='mode').options.map(o=>o[0]),['speedup','slowdown','turn','stop']);assert.deepEqual(a('design').controls.find(c=>c.key==='k').options,[[20,'bumperSoft'],[80,'bumperStiff']]);assert.equal(a('motion-classify').controls[0].label,'motionType')});
check('Whole-unit review changes only supported ballast inputs and refers back to force and friction records',()=>{const a=COURSES.middle.activities.find(a=>a.id==='review-middle'),l=LESSONS['middle/review-middle'];assert.equal(l.frames.length,2);assert.equal(a.rig,'floating');assert.deepEqual(a.controls.map(c=>c.key),['case','volume','clips','fill']);for(const frame of l.frames){assert.equal(frame.inputs.case,'submarine');for(const [key,v]of Object.entries(frame.inputs)){const c=a.controls.find(c=>c.key===key);assert.ok(c);assert.ok(c.options?c.options.some(o=>o[0]===v):v>=c.min&&v<=c.max)}}const results=l.frames.map(f=>solve(a.id,{...defaults(a),...f.inputs}));near(value(results[0],'buoyancy'),value(results[1],'buoyancy'));assert.ok(value(results[0],'net')>0&&value(results[1],'net')<0);assert.match(l.questions.find(q=>q.id==='review-zero').feedback[0],/알짜힘.*속도/);assert.match(l.questions.find(q=>q.id==='review-friction').feedback[0],/마찰.*기록.*움직이기 시작한 힘/)});
console.log(JSON.stringify(tests,null,2));
