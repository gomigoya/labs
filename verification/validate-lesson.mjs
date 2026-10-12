import assert from 'node:assert/strict';
import {newLesson,representationResult,trialCoverage,addTrial,explanationResult,transferResult,assessment,report,validateReport} from '../dist/labs/force-equilibrium/lesson-model.js';
const rows=[];function check(name,fn){fn();rows.push({name,pass:true})}
const s=newLesson('synthetic-test');
check('Unsubmitted work is not assessed',()=>assert.deepEqual(assessment(s),{body:0,representation:0,investigation:0,explanation:0,transfer:0}));
check('All three arrow properties matter',()=>{assert.deepEqual(representationResult([{onBody:false,direction:1,magnitude:1},{onBody:true,direction:-1,magnitude:1}]),[false,false]);s.representations=[{onBody:true,direction:1,magnitude:1},{onBody:true,direction:-1,magnitude:2}];assert.deepEqual(representationResult(s.representations),[true,true])});
s.targetAttempts=['arrow','cart'];s.representationAttempts.push({representations:structuredClone(s.representations)});
check('Wrong target can be revised',()=>assert.equal(assessment(s).body,1));
check('Three trial classes, same mass and initial rest',()=>{for(const magnitude of [1,2,4]){s.magnitude=magnitude;s.prediction=1;const acceleration=magnitude-2,time=1.2;addTrial(s,{x:.5*acceleration*time*time,vx:acceleration*time,time})}assert.deepEqual(trialCoverage(s.trials),[true,true,true]);assert.deepEqual(s.trials.map(t=>t.resultant),[-1,0,2]);assert.deepEqual(s.trials.map(t=>t.observedDirection),[-1,0,1]);assert(s.trials.every(t=>t.mass===1&&t.initialVelocity===0&&t.fixedMagnitude===2))});
check('Wrong predictions are retained without penalty',()=>{assert(s.trials.every(t=>t.prediction===1));assert.equal(assessment(s).investigation,2)});
check('Evidence requires an actual balanced trial',()=>{s.evidenceId=1;s.reason='equal-opposite';assert.deepEqual(explanationResult(s),{evidence:false,reason:true});s.evidenceId=2;assert.deepEqual(explanationResult(s),{evidence:true,reason:true})});
s.explanationAttempts.push({evidenceId:2,reason:'equal-opposite'});
check('Transfer cannot reuse the two-newton answer',()=>{assert.equal(transferResult({magnitude:2,direction:-1,prediction:0}).balanced,false);assert.equal(transferResult({magnitude:3,direction:1,prediction:0}).balanced,false);assert.deepEqual(transferResult({magnitude:3,direction:-1,prediction:0}),{resultant:0,balanced:true,predictionCorrect:true,goalUnderstood:true})});
s.transfer={magnitude:3,direction:-1,prediction:0};s.transferAttempts.push({...s.transfer});
check('Rubric uses submitted evidence, not unsubmitted edits',()=>{s.transfer={magnitude:1,direction:1,prediction:1};assert.equal(assessment(s).transfer,2)});
check('JSON round trip recomputes imported scores',()=>{const r=report(s);r.assessment.scores.transfer=99;assert.equal(validateReport(JSON.parse(JSON.stringify(r))).assessment.scores.transfer,2)});
check('Malformed imports rejected',()=>{const r=report(s);r.session.trials[0].mass=5;assert.throws(()=>validateReport(r));const r2=report(s);r2.session.unlockedStage=9;assert.throws(()=>validateReport(r2))});
console.log(JSON.stringify(rows,null,2));
