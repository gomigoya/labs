// node tools/hand-check.mjs
import fs from 'node:fs';
const src = fs.readFileSync(process.argv[2] || 'src/15-physics.js', 'utf8');
const PHYS = new Function(src.match(/\/\/ ==== 1 PHYSICS ====([\s\S]*?)\/\/ ==== END PHYSICS ====/)[1] + '\nreturn PHYS;')();

// 손계산 상수는 모듈에서 가져오지 않는다.
const G = 6.67430e-11, moonMass = 7.342e22, earthMass = 5.972e24;
const R = 6.371e6, d0 = 3.844e8, moonRadius = 1.737e6;
const day = 86400, sidereal = 86164.1, T0 = 27.3217 * day;
const end = d0 - 8e6, twentieth = d0 * (1 - 1 / 20);
const H0 = moonMass / earthMass * R ** 4 / d0 ** 3;
const handRatio = c => (d0 / (d0 - c)) ** 3;
const handAccel = c => 2 * G * moonMass * R / (d0 - c) ** 3;
const handPeriod = c => T0 * ((d0 - c) / d0) ** 1.5;
const handSize = c => 2 * moonRadius / (d0 - c) * 180 / Math.PI;
const fluid = 2.456 * R * Math.cbrt(5514 / 3344);
const rigid = 1.26 * R * Math.cbrt(5514 / 3344);
const atFrac = f => d0 * (1 - f);
const atRatio = r => d0 * (1 - r ** (-1 / 3));
// 요구사항의 두 구간 공식을 PHYS와 독립적으로 계산한다.
const railSplit = 0.5, railBoundary = 1e8, railMin = 0.1;
const railDB = d0 - railBoundary, railDMin = d0 - end;
const handRailX = c => c <= railMin ? 0 : c >= end ? 1
  : c <= railBoundary ? railSplit * Math.log10(c / railMin) / Math.log10(railBoundary / railMin)
    : railSplit + (1 - railSplit) * Math.log(railDB / (d0 - c)) / Math.log(railDB / railDMin);
const handCloserFromRailX = x => x <= railSplit
  ? railMin * (railBoundary / railMin) ** (x / railSplit)
  : d0 - railDB * (railDMin / railDB) ** ((x - railSplit) / (1 - railSplit));
const railNear = (actual, expected) => Number.isFinite(actual)
  && Math.abs(actual - expected) <= 1e-9 * Math.abs(expected);
let failures = 0, count = 0;
const fmt = v => typeof v === 'number' ? Number(v.toPrecision(10)).toString() : JSON.stringify(v);
console.log('| 항목 | 기대 | 실제 | 판정 |\n|---|---|---|---|');
function row(name, expected, actual, ok) {
  count++;
  if (!ok) failures++;
  console.log(`| ${name} | ${expected} | ${actual} | ${ok ? '통과' : '실패'} |`);
}
function numeric(name, actual, fixed, hand, tolerance = 0.005) {
  const near = e => Number.isFinite(actual) && Math.abs(actual - e) <= tolerance * Math.abs(e);
  row(name, `${fmt(fixed)} / 손 ${fmt(hand)}`, fmt(actual), near(fixed) && near(hand));
}
function exact(name, actual, expected) {
  row(name, fmt(expected), fmt(actual), JSON.stringify(actual) === JSON.stringify(expected));
}

numeric('H0 (m)', PHYS.tideH0(), 0.3566, H0);
// 이항급수로 작은 변화량을 독립 대조한다.
const u = 0.1 / d0, excess = 3 * u + 6 * u ** 2 + 10 * u ** 3;
numeric('10cm tideExcess', PHYS.tideExcess(0.1), 7.804e-10, excess, 0.001);
numeric('10cm ΔH (m)', PHYS.tideH0() * PHYS.tideExcess(0.1), 2.783e-10, H0 * excess);
for (const [c, expected] of [[1e6, 1.007845], [1e7, 1.082287], [1e8, 2.469229]]) {
  numeric(`ratio(${c})`, PHYS.ratio(c), expected, handRatio(c));
}
for (const [name, c, r, h, period, unit, size] of [
  ['현재', 0, 1, 0.3566, 27.3217, day, 0.5178],
  ['1/2', d0 / 2, 8, 2.853, 9.659, day, 1.0356],
  ['1/20', twentieth, 8000, 2853, 7.331, 3600, 10.356],
]) {
  numeric(`${name} ratio`, PHYS.ratio(c), r, handRatio(c));
  numeric(`${name} H (m)`, PHYS.tideHeight(c), h, H0 * handRatio(c));
  numeric(`${name} T (${unit === day ? '일' : '시간'})`, PHYS.orbitPeriod(c) / unit, period, handPeriod(c) / unit);
  numeric(`${name} 달 크기 (deg)`, PHYS.angularSizeDeg(c), size, handSize(c));
}
numeric('현재 조석가속도 (m/s²)', PHYS.tidalAccel(0), 1.0992e-6, handAccel(0));
numeric('1/20 조석가속도 (m/s²)', PHYS.tidalAccel(twentieth), 8.794e-3, handAccel(twentieth));
numeric('40kg 조석력 (N)', PHYS.personTidalForce(40, 0), 4.397e-5, 40 * handAccel(0));
numeric('로슈 액체 (km, 추정)', PHYS.roche().fluid / 1000, 18486, fluid / 1000);
numeric('로슈 강체 (km, 추정)', PHYS.roche().rigid / 1000, 9484, rigid / 1000);
numeric('현재 지름 마디', PHYS.beads(0), 30.17, d0 / (2 * R));
numeric('1/20 지름 마디', PHYS.beads(twentieth), 1.508, d0 / 20 / (2 * R));
for (const [theta, factor] of [[0, 1], [Math.PI / 2, -0.5], [Math.PI, 1]]) {
  numeric(`tideLevel(${fmt(theta)}) (m)`, PHYS.tideLevel(theta, 0), 0.3566 * factor, H0 * factor, 0.001);
}
let weighted = 0, weight = 0;
for (let i = 0; i < 10000; i++) {
  const theta = (i + 0.5) * Math.PI / 10000, w = Math.sin(theta);
  weighted += PHYS.tideLevel(theta, 0) * w;
  weight += w;
}
row('구 평균 (m)', `0, 절댓값 < ${fmt(1e-3 * H0)}`, fmt(weighted / weight), Math.abs(weighted / weight) < 1e-3 * H0);
const railEnds = [PHYS.railX(railMin), PHYS.railX(end), PHYS.closerFromRailX(0), PHYS.closerFromRailX(1)];
const handRailEnds = [handRailX(railMin), handRailX(end), handCloserFromRailX(0), handCloserFromRailX(1)];
row('레일 양 끝', `${fmt(handRailEnds)}, 상대 1e-9`, fmt(railEnds), railEnds.every((v, i) => railNear(v, handRailEnds[i])));
for (const c of [1e3, 1e6, 2e8]) {
  const x = PHYS.railX(c), back = PHYS.closerFromRailX(x);
  row(`레일 왕복 ${c} (m)`, `독립 두 구간식·왕복, 상대 1e-9`, fmt([x, back]),
    railNear(x, handRailX(c)) && railNear(PHYS.closerFromRailX(handRailX(c)), handCloserFromRailX(handRailX(c))) && railNear(back, c));
}
numeric('현재 조석주기 (시간)', PHYS.tidePeriod(0) / 3600, 12.42, Math.PI / Math.abs(2 * Math.PI / sidereal - 2 * Math.PI / T0) / 3600);
exact('봉우리 통과', PHYS.peaksCrossed(0, 2 * Math.PI), 2);
exact('균열 상태 19220/15000/9000km', [19220e3, 15000e3, 9000e3].map(d => PHYS.fractureState(d0 - d).state), ['whole', 'cracking', 'ring']);
numeric('균열 진행 15000km', PHYS.fractureState(d0 - 15000e3).progress, (fluid - 15000e3) / (fluid - rigid), (fluid - 15000e3) / (fluid - rigid));
const all = [0, 1, 2, 3, 4, 5, 6];
exact('Q2 전체/5칸/배율 부족', [PHYS.judgeQ2({ visited: new Set(all), closer: 1e8 }), PHYS.judgeQ2({ visited: all.slice(0, 5), closer: 1e8 }), PHYS.judgeQ2({ visited: all, closer: 1e4 })], [true, false, false]);
exact('Q2 중복/잘못된 인덱스/6칸', [[0, 0, 1, 2, 3, 4], [0, 1, 2, 3, 4, 99], all.slice(0, 6)].map(visited => PHYS.judgeQ2({ visited, closer: 1e8 })), [false, false, true]);
exact('Q3 frac 0.5/0.52/0.53', [0.5, 0.52, 0.53].map(f => PHYS.judgeQ3({ closer: atFrac(f) })), [true, true, false]);
exact('Q8 wall8 ratio 8/7.6/7.4/8.1', [8, 7.6, 7.4, 8.1].map(r => PHYS.judgeQ8({ wall: 8, closer: atRatio(r) })), [true, true, false, false]);
exact('Q1 돋보기 true/false/거리 부족', [PHYS.judgeQ1({ closer: 0.1, lensOpen: true }), PHYS.judgeQ1({ closer: 0.1, lensOpen: false }), PHYS.judgeQ1({ closer: 0, lensOpen: true })], [true, false, false]);
exact('Q7 9000/12000km', [9000e3, 12000e3].map(d => PHYS.judgeQ7({ closer: d0 - d })), [true, false]);
exact('closerMax 균열 상태·거리 (km, 추정)', [PHYS.fractureState(PHYS.C.closerMax).state, PHYS.dist(PHYS.C.closerMax) / 1000], ['ring', 8000]);
exact('Q7 closerMax', PHYS.judgeQ7({ closer: PHYS.C.closerMax }), true);
exact('Q4 봉우리 1/2', [1, 2].map(peaks => PHYS.judgeQ4({ peaks })), [false, true]);
exact('Q5 거리/열람 조건', [[0.1, true, true], [0.11, true, true], [0.1, false, true], [0.1, true, false]].map(([f, personSeen, oceanSeen]) => PHYS.judgeQ5({ closer: atFrac(f), personSeen, oceanSeen })), [true, false, false, false]);
exact('Q6 거리/하늘 조건', [[0.1, true], [0.11, true], [0.1, false]].map(([f, skyOpen]) => PHYS.judgeQ6({ closer: atFrac(f), skyOpen })), [true, false, false]);
exact('Q8 허용 방파제/경계', [2, 8, 27, 3].map(wall => PHYS.judgeQ8({ wall, closer: atRatio(wall) })), [true, true, true, false]);
exact('RANGE', PHYS.RANGE, { closer: [0.1, 3.764e8] });
exact('레일 칸 거리', PHYS.RAIL_NOTCHES.map(n => n.closer), [0.1, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8]);
row('레일 칸 x', '독립 두 구간식, 상대 1e-9', fmt(PHYS.RAIL_NOTCHES.map(n => n.x)), PHYS.RAIL_NOTCHES.every(n => railNear(n.x, handRailX(n.closer))));
exact('DETENTS frac', PHYS.DETENTS.map(n => n.frac), [1 / 2, 1 / 3, 1 / 10, 1 / 20]);
row('DETENTS 거리·x', '독립 거리·두 구간식, 상대 1e-9', fmt(PHYS.DETENTS.map(n => [n.closer, n.x])), PHYS.DETENTS.every(n => railNear(n.closer, atFrac(n.frac)) && railNear(n.x, handRailX(atFrac(n.frac)))));
numeric('dist/frac 1/2', PHYS.dist(d0 / 2) / d0, 0.5, 0.5, 1e-12);
numeric('relRate 현재 (rad/s)', PHYS.relRate(0), 2 * Math.PI / sidereal - 2 * Math.PI / T0, 2 * Math.PI / sidereal - 2 * Math.PI / T0, 1e-12);
numeric('항구 수위 t=3600 (m)', PHYS.harborLevel(3600, 0.3, 0), H0 * (3 * Math.cos(0.3 + (2 * Math.PI / sidereal - 2 * Math.PI / T0) * 3600) ** 2 - 1) / 2, H0 * (3 * Math.cos(0.3 + (2 * Math.PI / sidereal - 2 * Math.PI / T0) * 3600) ** 2 - 1) / 2);
const epsilon = 1;
const seam = [PHYS.railX(railBoundary - epsilon), PHYS.railX(railBoundary), PHYS.railX(railBoundary + epsilon)];
row('레일 연속 (ε=1m)', '양쪽 차 < 1e-6, 경계 x=0.5 (1e-12)', fmt(seam),
  Math.abs(seam[2] - seam[0]) < 1e-6 && Math.abs(seam[1] - railSplit) <= 1e-12);
numeric('레일 역함수 분할점 (m)', PHYS.closerFromRailX(railSplit), railBoundary, handCloserFromRailX(railSplit), 1e-9);
exact('레일 범위 밖 클램프', [PHYS.railX(-1), PHYS.railX(0), PHYS.railX(end + 1)], [0, 0, 1]);
const railSamples = Array.from({ length: 2000 }, (_, i) => PHYS.railX(railMin * (end / railMin) ** (i / 1999)));
const minStep = Math.min(...railSamples.slice(1).map((x, i) => x - railSamples[i]));
row('레일 단조 2000점', '로그 간격, 모든 Δx > 0', `최소 Δx=${fmt(minStep)}`,
  railSamples.every(Number.isFinite) && minStep > 0);
for (const c of [railMin, 1e3, railBoundary, 1.5e8, 1.922e8, 3.0e8, 3.65e8, end]) {
  numeric(`새 레일 왕복 ${c} (m)`, PHYS.closerFromRailX(PHYS.railX(c)), c, handCloserFromRailX(handRailX(c)), 1e-9);
}
const q3Width = PHYS.railX(atFrac(0.48)) - PHYS.railX(atFrac(0.52));
row('사용성 Q3 허용 폭', 'Δx ≥ 0.009', fmt(q3Width), q3Width >= 0.009);
const detentGaps = PHYS.DETENTS.slice(1).map((n, i) => n.x - PHYS.DETENTS[i].x);
row('사용성 DETENTS 이웃 간격', '각 Δx ≥ 0.05', fmt(detentGaps), detentGaps.every(gap => gap >= 0.05));
const endGap = 1 - PHYS.DETENTS.at(-1).x;
row('사용성 마지막 DETENT~끝', 'Δx ≥ 0.05', fmt(endGap), endGap >= 0.05);
const rocheRail = PHYS.rocheX?.() ?? { fluid: NaN, rigid: NaN };
row('rocheX 순서·범위 (추정)', '0.5 < fluid < rigid < 1', fmt(rocheRail),
  railSplit < rocheRail.fluid && rocheRail.fluid < rocheRail.rigid && rocheRail.rigid < 1);
const rocheDistances = PHYS.roche();
row('rocheX 거리 대응 (추정)', 'roche 거리→closer→x 및 독립식, 상대 1e-9', fmt(rocheRail),
  ['fluid', 'rigid'].every(kind => railNear(rocheRail[kind], PHYS.railX(d0 - rocheDistances[kind]))
    && railNear(rocheRail[kind], handRailX(d0 - ({ fluid, rigid })[kind]))));
exact('rocheX 바깥/사이/안쪽 상태 (추정)',
  [(railSplit + rocheRail.fluid) / 2, (rocheRail.fluid + rocheRail.rigid) / 2, (rocheRail.rigid + 1) / 2]
    .map(x => PHYS.fractureState(PHYS.closerFromRailX(x)).state), ['whole', 'cracking', 'ring']);
exact('moonVisDist current / 10cm', [PHYS.moonVisDist(0), PHYS.moonVisDist(0.1)], [4.5, 4.5]);
numeric('moonVisDist end', PHYS.moonVisDist(end), 1.3, 1.3, 1e-12);
const visualDistances = Array.from({ length: 2000 }, (_, i) => PHYS.moonVisDist(railMin * (end / railMin) ** (i / 1999)));
row('moonVisDist monotonic', 'all steps < 0', fmt(Math.max(...visualDistances.slice(1).map((v, i) => v - visualDistances[i]))),
  visualDistances.slice(1).every((v, i) => v < visualDistances[i]));
for (const [r, expected] of [[1, 0.04], [3, 0.12], [8, 0.1439867], [8000, 0.42]]) {
  const actual = PHYS.oceanBulge(atRatio(r)).bulge;
  row(`oceanBulge r=${r}`, fmt(expected), fmt(actual), Math.abs(actual - expected) <= 1e-6);
}
const bulgeSamples = Array.from({ length: 2000 }, (_, i) => PHYS.oceanBulge(atRatio(1e5 ** (i / 1999))).bulge);
exact('oceanBulge monotonic', bulgeSamples.slice(1).every((v, i) => v >= bulgeSamples[i]), true);
const boundaryC = atRatio(3);
numeric('oceanBulge r=8 specified formula', PHYS.oceanBulge(atRatio(8)).bulge,
  0.12 + 0.30 * (1 - Math.exp(-5 / 60)), 0.12 + 0.30 * (1 - Math.exp(-5 / 60)), 1e-12);
row('oceanBulge continuity', 'delta < 1e-8', fmt(PHYS.oceanBulge(boundaryC + 1).bulge - PHYS.oceanBulge(boundaryC - 1).bulge),
  Math.abs(PHYS.oceanBulge(boundaryC + 1).bulge - PHYS.oceanBulge(boundaryC - 1).bulge) < 1e-8);
exact('oceanBulge saturated boundary', [0, boundaryC - 1, boundaryC + 1, end].map(c => PHYS.oceanBulge(c).saturated), [false, false, true, true]);
row('oceanBulge exact boundary branch', 'saturated iff computed ratio > 3', fmt(PHYS.oceanBulge(boundaryC)),
  PHYS.oceanBulge(boundaryC).saturated === (PHYS.ratio(boundaryC) > 3));
// M3 expected values use independent constants and arithmetic.
const handArrows = c => {
  const d = d0 - c, unit = 4.9028e12 / d0 ** 2;
  const near = 6 * 4.9028e12 / (d - R) ** 2 / unit;
  const center = 6 * 4.9028e12 / d ** 2 / unit;
  const far = 6 * 4.9028e12 / (d + R) ** 2 / unit;
  return { near, center, far, diffNear: 5 * (near - center), diffFar: 5 * (center - far) };
};
for (const c of [0, d0 / 2, twentieth, end]) {
  for (const [key, expected] of Object.entries(handArrows(c)))
    numeric(`tidalArrows(${c}).${key}`, PHYS.tidalArrows(c)[key], expected, expected, 1e-6);
  const rate = Math.abs(2 * Math.PI / sidereal - 2 * Math.PI / handPeriod(c)) * 3600 * 180 / Math.PI;
  numeric(`apparentRate(${c})`, PHYS.apparentRateDegPerHour(c), rate, rate, 1e-6);
  const accel = x => 2 * 4.9028e12 * R / (d0 - x) ** 3;
  const weightRatio = (1 - accel(c) / 9.81) / (1 - accel(0) / 9.81);
  numeric(`personWeightRatio(${c})`, PHYS.personWeightRatio(c), weightRatio, weightRatio, 1e-6);
}
exact('tidalArrows center current', PHYS.tidalArrows(0).center, 6);
row('tidalArrows current difference', '1 +/- 0.05', fmt(PHYS.tidalArrows(0).diffNear), Math.abs(handArrows(0).diffNear - 1) < 0.05);
exact('tidalArrows force ordering', PHYS.tidalArrows(0).near > PHYS.tidalArrows(0).center && PHYS.tidalArrows(0).center > PHYS.tidalArrows(0).far, true);
row('tidalArrows half center', '24 +/- 1e-9', fmt(PHYS.tidalArrows(d0 / 2).center), Math.abs(PHYS.tidalArrows(d0 / 2).center - 24) < 1e-9);
row('apparentRate current', '14.5 +/- 0.05', fmt(PHYS.apparentRateDegPerHour(0)), Math.abs(PHYS.apparentRateDegPerHour(0) - 14.5) < 0.05);
row('apparentRate twentieth', '34 +/- 0.3', fmt(PHYS.apparentRateDegPerHour(twentieth)), Math.abs(PHYS.apparentRateDegPerHour(twentieth) - 34) < 0.3);
exact('personWeightRatio current', PHYS.personWeightRatio(0), 1);
const lightPerson = PHYS.personWeightRatio(twentieth);
row('personWeightRatio twentieth', '0 <= 1 - ratio < 1e-3', fmt(lightPerson), lightPerson <= 1 && 1 - lightPerson < 1e-3);
// Presentation contracts: independent expected landmarks and stable candidate distinctions.
for (const [fraction, height] of [[.5, 52], [1 / 3, 78], [.25, 104]])
  numeric(`card tide height ${fraction}`, PHYS.cardTideHeight(atFrac(fraction)), height, height, 1e-9);
for (const [ratio, height] of [[1, 12], [2, 44], [8, 108]])
  numeric(`card excess height ${ratio}`, PHYS.cardExcessHeight(atRatio(ratio)), height, height, 1e-9);
for (const [weight, lift] of [[0, 90], [.5, 45], [1, 0]]) exact(`card weight lift ${weight}`, PHYS.cardWeightLift(weight), lift);
const cardsSource = fs.readFileSync('src/66-cards.js', 'utf8');
const questsSource = fs.readFileSync('src/65-quests.js', 'utf8');
const previews = new Function(src + cardsSource + questsSource + ';return {CARDS,QUESTS};')();
for (const d of previews.QUESTS) {
  const initial = d.candidates.map(c => previews.CARDS.picture(d.id, c, 0));
  exact(`Q${d.id} three distinct predictions`, new Set(initial).size, 3);
  exact(`Q${d.id} no animation collapse`, [0, .01, .25, 1.2, 2.5, 3, 6].every(t =>
    d.candidates.every((c, i) => previews.CARDS.picture(d.id, c, t) === initial[i])), true);
  exact(`Q${d.id} finite drawings`, initial.every(svg => !/NaN|Infinity|undefined/.test(svg)), true);
}
// Model values must also differ when the drawing is not a directional hypothesis.
for (const id of [1, 2, 3, 7, 8]) exact(`Q${id} distinct PHYS distances`, new Set(previews.QUESTS[id - 1].candidates.map(c => PHYS.dist(c.closer))).size, 3);
const css = fs.readFileSync('src/00-head.html', 'utf8');
exact('teacher four-column flat grid', /repeat\(4,var\(--teacher-cell\)\)/.test(css) && /#teacher-strip \.teacher-grid\{display:contents\}/.test(css), true);
const teacherSource = fs.readFileSync('src/80-teacher.js', 'utf8');
const layerCount = teacherSource.match(/layerOrder: \[([^\]]+)/)[1].split(',').length;
const controlCount = 3 + layerCount + 1 + 5 + previews.QUESTS.length + 2;
for (const height of [720, 900, 1080]) {
  const cell = Math.max(56, Math.min(72, (height - 72) / 8)), rows = Math.ceil(controlCount / 4);
  row(`teacher strip ${height}px`, 'all controls fit', `${controlCount} controls / ${rows} rows`, rows * cell + (rows - 1) * 4 + 20 <= height - 24);
}
// The editable director installs the sky configuration before the first frame.
const directorSource = fs.readFileSync('src/68-director.js', 'utf8');
const cfg = { attract: Array.from({ length: 5 }, () => ({})) };
new Function('TEACHER_CFG', directorSource.match(/  Object.assign\(TEACHER_CFG.attract\[1\][^\n]+\n  Object.assign\(TEACHER_CFG.attract\[2\][^\n]+/)[0])(cfg);
exact('both sky stages use sky layer and shot', [1, 2].every(i => cfg.attract[i].shot === 5 && cfg.attract[i].layers.includes('sky')), true);
console.log(`\n총 ${count}개: 통과 ${count - failures}, 실패 ${failures}`);
process.exitCode = failures ? 1 : 0;
