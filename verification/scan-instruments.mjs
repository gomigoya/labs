import assert from 'node:assert/strict';
import {createInstrumentPhysics,instrumentKind} from '../dist/labs/force-equilibrium/instrument-physics.js';
import {COURSES,defaults,solve} from '../dist/labs/force-equilibrium/curriculum-model.js';
import {lessonFor} from '../dist/labs/force-equilibrium/lesson-content.js';
const s=await createInstrumentPhysics(),rows=[];
for(const [cid,c]of Object.entries(COURSES))for(const a of c.activities)for(const f of lessonFor(cid,a.id).frames){const p={...defaults(a),...f.inputs},r=solve(a.id,p,{zeroed:true,placed:!f.empty});if(!instrumentKind(a.id,p,r))continue;s.prepare(a.id,p,r,{zeroed:true,placed:!f.empty});s.start();for(let i=0;i<720&&!s.done;i++)s.advance(1/120);const o=s.observation();rows.push({cid,id:a.id,frame:f.id,time:o.final.time,settled:o.settled,kind:o.kind,angle:o.final.angle,finite:Object.values(o.final).every(Number.isFinite)});}
s.dispose();const failed=rows.filter(r=>!r.finite||(r.kind!=='cart'&&!r.settled));console.log(JSON.stringify({count:rows.length,failed,rows},null,2));assert.equal(failed.length,0,'Every guided static pilot must settle before recording');
