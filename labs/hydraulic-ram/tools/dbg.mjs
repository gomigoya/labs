import fs from 'node:fs';
const src = fs.readFileSync('src/15-physics.js', 'utf8');
const m = src.match(/\/\/ ==== 1 PHYSICS ====([\s\S]*?)\/\/ ==== END PHYSICS ====/);
const PHYS = new Function(m[1] + '\nreturn PHYS;')();
const p = JSON.parse(process.argv[2]);
const s = PHYS.simulate(p);
console.log(s.cycles.map(c => `T=${c.T.toFixed(4)} Vd=${(c.Vd*1000).toFixed(4)} tc-t0=${(c.tClose-c.t0).toFixed(4)} min=${c.minH.toFixed(2)}`).join('\n'));
const r = s.rec, n1 = r.nodes; const N = n1 - 1;
let start = null;
for (let i = 1; i < r.n; i++) if (r.waste[i-1] && !r.waste[i]) { start = i; break; }
if (start != null) { let line=[]; for (let i = start; i < Math.min(r.n, start + 400); i += 8) line.push(`${(i*r.dt).toFixed(3)}:${r.H[i*n1+N].toFixed(1)}${r.deliv[i]?'D':''}${r.waste[i]?'W':''}`); console.log(line.join(' ')); }
