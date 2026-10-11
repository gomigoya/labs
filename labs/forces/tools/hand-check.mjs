// 손계산 대조: 물리 모듈과 독립적으로 상수를 다시 적고 교과서 식으로 계산해 화면 표시값과 비교한다.
// node tools/hand-check.mjs
import fs from 'node:fs';
const src = fs.readFileSync(new URL('../src/15-physics.js', import.meta.url), 'utf8');
const PHYS = new Function(src.match(/\/\/ ==== 1 PHYSICS ====([\s\S]*?)\/\/ ==== END PHYSICS ====/)[1] + '\nreturn PHYS;')();

const rows = [];
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const check = (name, model, hand, tol, unit) => rows.push({ name, model: +model.toFixed(4), hand: +hand.toFixed(4), unit, ok: near(model, hand, tol) });

// 1) 무게: 추 3개(150 g), 지구 9.8 / 달 1.6
for (const g of [9.8, 1.6]) {
  const r = PHYS.hang({ obj: 'weights', n: 3, fluid: 'water', jack: 0.03, g });
  check(`추 3개 무게 g=${g}`, r.T, 0.15 * g, 1e-9, 'N');
  check(`추 3개 늘어남 g=${g}`, r.x * 100, 0.15 * g / 20 * 100, 1e-9, 'cm');
}
// 2) 탄성력: 추 1~5개 → F = kx, k = 20 N/m
const pts = [1, 2, 3, 4, 5].map((n) => { const r = PHYS.hang({ obj: 'weights', n, fluid: 'water', jack: 0.03, g: 9.8 }); return { F: r.T, x: r.x }; });
check('훅 법칙 직선 기울기 k', PHYS.fitK(pts), 20, 1e-9, 'N/m');
// 3) 부력: 알루미늄 100 cm³ 완전 잠김, 물 / 소금물
for (const [fluid, rho] of [['water', 1000], ['brine', 1200], ['oil', 920]]) {
  const p = { obj: 'al', n: 0, fluid, jack: 0.03, g: 9.8 };
  const j = PHYS.jackForFull(p);
  const r = PHYS.hang({ ...p, jack: j + 0.01 });
  const B = rho * 9.8 * 100e-6, W = 0.27 * 9.8;
  check(`알루미늄 부력 (${fluid})`, r.B, B, 1e-6, 'N');
  check(`알루미늄 저울 눈금 (${fluid})`, r.T, W - B, 1e-6, 'N');
}
// 4) 나무: 뜬다 → 눈금 0, 부력 = 무게, 잠긴 비율 = 600/1000
{
  const p = { obj: 'wood', n: 0, fluid: 'water', jack: 0.03, g: 9.8 };
  const r = PHYS.hang({ ...p, jack: PHYS.jackMax(p) });
  check('나무 뜸: 저울 눈금', r.T, 0, 1e-9, 'N');
  check('나무 뜸: 부력 = 무게', r.B, 0.06 * 9.8, 1e-9, 'N');
  check('나무 뜸: 잠긴 비율', r.frac, 0.6, 1e-6, '');
}
// 5) 마찰력: 최대 정지 마찰력 = μs·M·g
for (const [surface, mus, load] of [['glass', 0.25, 0], ['wood', 0.45, 1], ['sand', 0.8, 2]]) {
  const M = 0.3 + load * 0.2, N = M * 9.8;
  const F = PHYS.trackForces({ x: 0.45, v: 0 }, { F1: 0, F2: 0.01, same: false, surface, load, g: 9.8 });
  check(`최대 정지 마찰 ${surface} 짐${load}`, F.fsMax, mus * N, 1e-9, 'N');
}
// 6) 평형과 운동: 유리, F1 = F2 = 2 → 알짜힘 0. F2 = 3, F1 = 0, 유리 → a = (3 − 0.18·0.3·9.8)/0.3
{
  const F = PHYS.trackForces({ x: 0.45, v: 0 }, { F1: 2, F2: 2, same: false, surface: 'glass', load: 0, g: 9.8 });
  check('반대 방향 2 N·2 N 알짜힘', F.net, 0, 1e-12, 'N');
  const S = PHYS.trackForces({ x: 0.45, v: 0 }, { F1: 1.5, F2: 1.0, same: true, surface: 'glass', load: 0, g: 9.8 });
  check('같은 방향 1.5 N + 1.0 N 당긴 힘', S.Fa, 2.5, 1e-12, 'N');
  const st = { x: 0.45, v: 0 }, p = { F1: 0, F2: 3, same: false, surface: 'glass', load: 0, g: 9.8 };
  PHYS.trackStep(st, p, 0.002);
  const a = (3 - 0.18 * 0.3 * 9.8) / 0.3;
  for (let i = 0; i < 99; i++) PHYS.trackStep(st, p, 0.002);   // 총 0.2 s (범퍼 전)
  check('유리 3 N 0.2초 뒤 속력', st.v, a * 0.2, 0.01, 'm/s');
}
// 7) 설계: 사포 + 짐 2개 → 4 N에도 정지 (μs·N = 0.8·0.7·9.8 = 5.49 N)
{
  const F = PHYS.trackForces({ x: 0.45, v: 0 }, { F1: 0, F2: 4, same: false, surface: 'sand', load: 2, g: 9.8 });
  check('설계: 사포·짐2 4 N 알짜힘', F.net, 0, 1e-12, 'N');
}

const w = Math.max(...rows.map((r) => r.name.length));
for (const r of rows) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.name.padEnd(w)}  모델 ${String(r.model).padStart(9)}  손계산 ${String(r.hand).padStart(9)} ${r.unit}`);
const bad = rows.filter((r) => !r.ok).length;
console.log(bad ? `\n${bad}개 불일치` : `\n${rows.length}개 모두 일치`);
process.exit(bad ? 1 : 0);
