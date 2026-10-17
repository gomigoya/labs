import fs from 'node:fs';
import {COURSES,defaults,solve} from '../dist/labs/force-equilibrium/curriculum-model.js';
import {LESSONS,lessonFor} from '../dist/labs/force-equilibrium/lesson-content.js';
const data=Object.entries(COURSES).flatMap(([course,c])=>c.activities.map(a=>{const l=lessonFor(course,a.id);return {course,band:c.band,id:a.id,title:a.title[0],controls:a.controls,defaultInputs:defaults(a),lesson:l,readings:l.frames.map(f=>solve(a.id,{...defaults(a),...f.inputs},{zeroed:true,placed:!f.empty}).metrics.find(m=>m.key==='reading')?.value)};}));
fs.writeFileSync('verification/student-journey-manifest.json',JSON.stringify(data,null,2)+'\n');
console.log(JSON.stringify({activities:data.length,conditions:Object.values(LESSONS).reduce((n,l)=>n+l.frames.length,0)}));
