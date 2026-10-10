// 손계산 대조: 물리 모듈을 쓰지 않고 강체 기둥 근사로 다시 계산해 화면 표시값과 비교한다.
// node tools/hand-check.mjs src/15-physics.js
import fs from 'node:fs';
const src = fs.readFileSync(process.argv[2] || 'src/15-physics.js', 'utf8');
const PHYS = new Function(src.match(/\/\/ ==== 1 PHYSICS ====([\s\S]*?)\/\/ ==== END PHYSICS ====/)[1] + '\nreturn PHYS;')();

// 손계산용 상수(물리 모듈과 독립적으로 다시 적는다)
const g = 9.81, rho = 1000, L = 12, D = 0.05, f = 0.02, Kin = 0.5, Kw = 2.0, a = 1200, CdAv = 0.003066, Aseat = 0.002;
const A = Math.PI * D * D / 4;
const hand = ({ H, h, m }) => {
  const vInf = Math.sqrt(2 * g * H / (1 + Kin + f * L / D + Kw));
  const vc = Math.sqrt(2 * m * g / (rho * CdAv));
  const reopen = m / (rho * Aseat);
  if (vc >= vInf) return { stall: 'noclose', vInf, vc, reopen };
  const tau = L * vInf / (g * H), x = Math.atanh(vc / vInf);
  const tAcc = tau * x, Vw = A * vInf * tau * Math.log(Math.cosh(x));
  const tDec = L * vc / (g * (h - H));          // 송출 중 감속 시간
  const Vd = A * vc * vc * L / (2 * g * (h - H)); // 송출 부피
  const T = tAcc + tDec + 2 * L / a;             // 한 박자(반동 왕복 포함, 대략)
  const q = Vd / T * 60000, Q = Vw / T * 60000;
  return { vInf, vc, reopen, tAcc, Vw, Vd, T, q, Q, eta: q * h / ((Q + q) * H), joukowsky: a * vc / g };
};

const rows = [
  ['낮게 많이', { H: 2, h: 6, m: 0.4 }],
  ['기본', { H: 2, h: 15, m: 0.4 }],
  ['가벼운 밸브', { H: 2, h: 15, m: 0.12 }],
  ['극단: 무거운 밸브', { H: 2, h: 15, m: 0.9 }],
  ['극단: H4 h40 m0.9', { H: 4, h: 40, m: 0.9 }],
];
const f2 = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : '—');
const pct = (s, r) => (Number.isFinite(s) && Number.isFinite(r) && r ? `${((s / r - 1) * 100).toFixed(0)}%` : '—');
console.log('| 상태 | 양 | 손계산 | 시뮬 표시 | 차이 |\n|---|---|---|---|---|');
for (const [name, p] of rows) {
  const r = hand(p), s = PHYS.simulate(p), Lm = s.limit;
  if (r.stall) { console.log(`| ${name} | 상태 | 멈춤(v_c ${f2(r.vc)} ≥ v∞ ${f2(r.vInf)}) | ${Lm.stalled ? '멈춤(' + Lm.reason + ')' : '작동'} | ${Lm.stalled ? '일치' : '불일치'} |`); continue; }
  const pairs = [
    ['v_c (m/s)', r.vc, s.vc], ['박자 T (s)', r.T, Lm.T], ['송출/박자 (L)', r.Vd * 1000, Lm.VdBeat * 1000],
    ['버림/박자 (L)', r.Vw * 1000, Lm.VwBeat * 1000], ['양수량 q (L/분)', r.q, Lm.q], ['효율 η (%)', r.eta * 100, Lm.eta * 100], ['최고 수두 (m)', p.h, Lm.peakH],
  ];
  for (const [k, hv, sv] of pairs) console.log(`| ${name} | ${k} | ${f2(hv)} | ${f2(sv)} | ${pct(sv, hv)} |`);
}
