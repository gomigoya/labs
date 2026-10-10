// 물리 모듈 단독 검증: index.html(또는 physics.part.js)에서 PHYSICS 구간을 잘라 실행한다.
import fs from 'node:fs';
const src = fs.readFileSync(process.argv[2], 'utf8');
const m = src.match(/\/\/ ==== 1 PHYSICS ====([\s\S]*?)\/\/ ==== END PHYSICS ====/);
const PHYS = new Function(m[1] + '\nreturn PHYS;')();
const fmt = (x, d = 2) => Number.isFinite(x) ? x.toFixed(d) : String(x);
const cases = [
  ['기본', { H: 2, h: 15, m: 0.4 }],
  ['낮게 많이', { H: 2, h: 6, m: 0.4 }],
  ['높게 조금', { H: 2, h: 30, m: 0.4 }],
  ['가벼운 밸브', { H: 2, h: 15, m: 0.12 }],
  ['무거운 밸브', { H: 2, h: 15, m: 0.9 }],
  ['H=1', { H: 1, h: 15, m: 0.4 }],
  ['H=4,h=5', { H: 4, h: 5, m: 0.4 }],
  ['H=4,h=40', { H: 4, h: 40, m: 0.9 }],
];
for (const [name, p] of cases) {
  const t0 = performance.now();
  const s = PHYS.simulate(p);
  const ms = performance.now() - t0;
  const L = s.limit;
  const rigid = PHYS.rigidDelivery(s.vc, p.H, p.h) * 1000;
  const acc = PHYS.rigidAccel(p.H, s.vc);
  console.log(`${name.padEnd(8)} vc=${fmt(s.vc)} vInf=${fmt(PHYS.vInf(p.H))} cycles=${s.cycles.length} conv=${s.converged}/p${L.period} stalled=${L.stalled}${L.reason ? '(' + L.reason + ')' : ''} T=${fmt(L.T, 3)}s bpm=${fmt(L.bpm, 0)} Vd=${fmt(L.VdBeat * 1000, 3)}L (rigid ${fmt(rigid, 3)}) Vw=${fmt(L.VwBeat * 1000, 2)}L (rigid ${fmt(acc.V * 1000, 2)}) q=${fmt(L.q)} Q=${fmt(L.Q)} L/min eta=${fmt(L.eta * 100, 1)}% peak=${fmt(L.peakH, 1)}m min=${fmt(L.minH, 1)}m  ${ms.toFixed(0)}ms recN=${s.rec.n}`);
}
const t0 = performance.now(); const sw = PHYS.sweepPoint(2, 20, 0.4); console.log('sweep point', sw, (performance.now() - t0).toFixed(0) + 'ms');
