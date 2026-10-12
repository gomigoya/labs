import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync('dist/labs/force-equilibrium/index.html','utf8');
const source=html.slice(html.indexOf('const PHYSICS='),html.indexOf('const $=id=>'));
const P=new Function(source+';return PHYSICS')();
const force=(mag,angle,attach=0)=>({mag,angle,attach});
const cases=[
 {name:'collinear balance',forces:[force(4,0),force(4,180),force(0,0)],expectedR:0,expectedTorque:0},
 {name:'couple',forces:[force(4,0,.65),force(4,180,-.65),force(0,0)],expectedR:0,expectedTorque:-5.2},
 {name:'3-4-5 triangle',forces:[force(4,0),force(3,90),force(5,180+Math.atan2(3,4)*180/Math.PI)],expectedR:0,expectedTorque:0}
];
const results=cases.map(c=>{const p=P.solve({forces:c.forces,mass:2});assert.ok(Math.abs(p.resultant-c.expectedR)<1e-10);assert.ok(Math.abs(p.torque-c.expectedTorque)<1e-10);return{name:c.name,R:p.resultant,torque:p.torque,pass:true}});
// An independently chosen moving equilibrium must preserve its existing velocity.
let d={x:0,y:0,vx:1,vy:0,rotation:0,omega:0};
const balanced={forces:cases[0].forces,mass:2,pinned:false};
for(let i=0;i<120;i++)d=P.advance(balanced,d,1/120);
assert.ok(Math.abs(d.x-1)<1e-12);assert.ok(Math.abs(d.vx-1)<1e-12);
results.push({name:'moving equilibrium',x:d.x,vx:d.vx,pass:true});
const push={forces:[force(4,0),force(0,0),force(0,0)],mass:2};
const heavy={...push,mass:4};assert.equal(P.solve(push).a.x,2);assert.equal(P.solve(heavy).a.x,1);
results.push({name:'mass inverse acceleration',a2kg:2,a4kg:1,pass:true});
const rot=P.solve({forces:cases[1].forces,mass:2},Math.PI/2);assert.ok(Math.abs(rot.torque)<1e-10);
results.push({name:'rotated application points',torque:rot.torque,pass:true});
assert.equal((html.match(/Math\.random\s*\(/g)||[]).length,0);
fs.mkdirSync('work',{recursive:true});
fs.writeFileSync('work/independent-physics.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
