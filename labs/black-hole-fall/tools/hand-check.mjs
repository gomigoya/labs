// node tools/hand-check.mjs
import fs from 'node:fs';
const source = fs.readFileSync('src/15-physics.js', 'utf8');
const block = source.match(/\/\/ ==== 1 PHYSICS ====([\s\S]*?)\/\/ ==== END PHYSICS ====/);
if (!block) throw new Error('PHYSICS 마커 없음');
const P = new Function(`${block[1]}\nreturn PHYS;`)();

// 요구사항의 상수를 독립적으로 적는다. 기대값에 PHYS 상수를 쓰지 않는다.
const G = 6.674e-11, c = 2.998e8, solar = 1.989e30, L = 1.7, limit = 100;
const masses = [10, 4e6, 1e9];
const handRs = i => 2 * G * masses[i] * solar / c ** 2;
const handDA = (i, r, transverse = false) => (transverse ? 1 : 2) * G * masses[i] * solar * L / (r * handRs(i)) ** 3;
const handSp = i => Math.cbrt(2 * G * masses[i] * solar * L / limit) / handRs(i);
const handStretch = a => 1 + 3 * Math.tanh(Math.atanh(0.7 / 3) * a / 100);
let count = 0, failures = 0;
const fmt = value => typeof value === 'number' ? Number(value.toPrecision(10)).toString() : JSON.stringify(value);
const near = (a, b, tol = 0.005) => Number.isFinite(a) && Math.abs(a - b) <= tol * Math.abs(b);
console.log('| 항목 | 기대 | 실제 | 판정 |\n|---|---|---|---|');
function row(name, expected, actual, ok) {
  count++;
  if (!ok) failures++;
  console.log(`| ${name} | ${expected} | ${fmt(actual)} | ${ok ? '통과' : '실패'} |`);
}
function numeric(name, actual, requirement, hand, tol = 0.005) {
  row(name, `${fmt(requirement)} / 손 ${fmt(hand)}`, actual, near(actual, requirement, tol) && near(actual, hand, tol));
}
function exact(name, actual, expected) {
  row(name, fmt(expected), actual, JSON.stringify(actual) === JSON.stringify(expected));
}
const expectedRs = [29538, 1.1815e10, 2.9538e12];
const expectedDA = [1.7512e8, 1.0945e-3, 1.7512e-8];
const expectedSp = [120.5, 0.0222, 5.59e-4];
for (let i = 0; i < 3; i++) {
  numeric(`질량칸${i} rs (m)`, P.rs(i), expectedRs[i], handRs(i));
  numeric(`질량칸${i} 지평선 Δa (m/s²)`, P.dA(i, 1), expectedDA[i], handDA(i, 1), 0.01);
  numeric(`질량칸${i} r_sp/r_s`, P.spaghettiR(i), expectedSp[i], handSp(i));
}
numeric('작은 블랙홀 지평선 Δa/g', P.dA(0, 1) / P.C.g, 1.79e7, handDA(0, 1) / 9.81);
numeric('40→20 거리 반, 차이 8배', P.dA(0, 20) / P.dA(0, 40), 8, handDA(0, 20) / handDA(0, 40), 1e-12);
row('배수·m 입력 일치 (모든 질량)', '손계산 상대오차 ≤ 1e-12', [0, 1, 2].map(i => P.dAMeters(i, 20 * handRs(i))),
  [0, 1, 2].every(i => near(P.dA(i, 20), P.dAMeters(i, 20 * handRs(i)), 1e-12) && near(P.dAMeters(i, 20 * handRs(i)), handDA(i, 20), 1e-12)));
const tenMass = 100 * solar, tenRs = 2 * G * tenMass / c ** 2;
numeric('질량 10배, 같은 r/r_s → 1/100', P.tidalAtMass(tenMass, tenRs) / P.dA(0, 1), 0.01,
  (2 * G * tenMass * L / tenRs ** 3) / handDA(0, 1), 1e-12);
numeric('가로 압축/세로 늘어남', P.dA(0, 20, 'transverse') / P.dA(0, 20), 0.5, handDA(0, 20, true) / handDA(0, 20), 1e-12);
exact('경계 intact, 지평선 위는 미통과', [0, 1, 2].map(i => [P.state(i, P.spaghettiR(i)).intact, P.state(i, 1).crossedHorizon]), [[true, false], [true, false], [true, false]]);
exact('한계 전/후 intact', [1.000001, 0.999999].map(k => P.state(0, handSp(0) * k).intact), [true, false]);
numeric('과장 Δa=100 → 1.7', P.stretchFromDA(100), 1.7, handStretch(100), 1e-12);
exact('과장 0/극단 → 1/4', [P.stretchFromDA(0), P.stretchFromDA(1e100)], [1, 4]);
const stretchSamples = [0, 1, 10, 100, 1000].map(a => P.stretchFromDA(a));
row('과장 단조·독립식', '단조 증가, 손계산 일치', stretchSamples, stretchSamples.every((s, j) => near(s, handStretch([0, 1, 10, 100, 1000][j]), 1e-12) && (j === 0 || s > stretchSamples[j - 1])));
numeric('막대 세로 부피비', P.visualShape(0, 200).along * P.visualShape(0, 200).across ** 2, 1, 1, 1e-12);
numeric('막대 가로 부피비', P.visualShape(0, 200, 'transverse').along * P.visualShape(0, 200, 'transverse').across ** 2, 1, 1, 1e-12);
exact('가로는 압축', P.visualShape(0, 200, 'transverse').along < 1, true);
numeric('격자·원반 과장 세기', P.visualField(0, 200), (handStretch(handDA(0, 200)) - 1) / 3, (handStretch(handDA(0, 200)) - 1) / 3, 1e-12);
const arrows = P.tidalArrows(0, 200), sideways = P.tidalArrows(0, 200, 'transverse');
numeric('당김 화살표 중심 (m/s²)', arrows.center, G * masses[0] * solar / (200 * handRs(0)) ** 2, G * masses[0] * solar / (200 * handRs(0)) ** 2, 1e-12);
row('차이 화살표 크기·방향', '세로 ±Δa/2, 가로 ∓Δa/4', [arrows.diffNear, arrows.diffFar, sideways.diffNear, sideways.diffFar],
  near(arrows.near - arrows.far, handDA(0, 200), 1e-9) && near(arrows.diffNear, handDA(0, 200) / 2, 1e-12)
  && arrows.diffFar === -arrows.diffNear && near(sideways.diffNear, -handDA(0, 200) / 4, 1e-12)
  && sideways.diffFar === -sideways.diffNear && sideways.near === sideways.far);
exact('그래프 로그 범위·중점·클램프', [P.graphY(1e-12), P.graphY(1e4), P.graphY(1e20), P.graphY(1e-20), P.graphY(1e30)], [0, 0.5, 1, 0, 1]);
exact('RANGE·MASSES', [P.RANGE.r, P.MASSES], [[0.0005, 1000], [10, 4e6, 1e9]]);
exact('레일 양끝·클램프', [P.railX(1000), P.railX(0.0005), P.rFromRailX(-1), P.rFromRailX(2)], [0, 1, 1000, 0.0005]);
const knotR = [1000, 200, 40.8, 40, 39.2, 20.4, 20, 19.6, 1.02, 1, 0.98, 0.0005];
const knotX = [0, 0.1, 0.18, 0.2, 0.22, 0.28, 0.3, 0.32, 0.48, 0.5, 0.52, 1];
row('레일 구간 경계', fmt(knotX), knotR.map(P.railX), knotR.every((r, j) => Math.abs(P.railX(r) - knotX[j]) < 1e-12));
numeric('로그 구간 중점', P.railX(Math.sqrt(1000 * 200)), 0.05, 0.1 * Math.log(Math.sqrt(5)) / Math.log(5), 1e-12);
numeric('선형 구간 중점', P.railX(40.4), 0.19, 0.18 + 0.02 * (40.8 - 40.4) / 0.8, 1e-12);
const xs = Array.from({ length: 1001 }, (_, j) => j / 1000);
row('레일 왕복·연속·단조 1001점', '왕복 오차 < 1e-12, 거리 감소', true,
  xs.every((x, j) => Math.abs(P.railX(P.rFromRailX(x)) - x) < 1e-12 && (j === 0 || P.rFromRailX(x) < P.rFromRailX(xs[j - 1])))
  && knotR.slice(1, -1).every(r => Math.abs(P.railX(r * (1 + 1e-9)) - P.railX(r * (1 - 1e-9))) < 1e-7));
exact('DETENTS 거리', P.DETENTS.map(d => d.r), [1000, 200, 40, 20, 1, 0.01, 0.0005]);
const gaps = P.DETENTS.slice(1).map((d, j) => d.x - P.DETENTS[j].x);
row('걸림 칸 이웃 간격', '모두 ≥ 0.05', gaps, gaps.every(g => g >= 0.05));
const widths = [40, 20, 1].map(r => P.railX(r * 0.98) - P.railX(r * 1.02));
row('Q2·Q4 포착 구간 폭', '각 0.04 ≥ 0.009', widths, widths.every(w => Math.abs(w - 0.04) < 1e-12));
exact('스냅 경계/바깥', [P.snapR(40.8), P.snapR(39.2), P.snapR(40.80001), P.snapR(1.02)], [40, 40, 40.80001, 1]);
row('장면 거리 과장 양끝', '[4.5,0.6], 상대 1e-12', [P.visualRadius(1000), P.visualRadius(0.0005)],
  near(P.visualRadius(1000), 4.5, 1e-12) && near(P.visualRadius(0.0005), 0.6, 1e-12));
// 실행 기록은 원시 조건에서 재계산한다. 기록된 value를 신뢰하지 않는다.
const m = (i, r, runId = 7, orientation = 'radial') => P.measure(i, r, runId, orientation);
exact('측정 독립식', near(m(1, 0.5).value, handDA(1, 0.5), 1e-12), true);
exact('빈 데이터', P.measurements(undefined, 7), []);
exact('잘못된 측정 경계', [m(-1, 1), m(0, -1), m(0, NaN), m(0, Infinity), m(0, 1, -1), m(0, 1, 7, 'bad')], [null, null, null, null, null, null]);
exact('특이점은 사건', m(0, 0), { i: 0, r: 0, runId: 7, orientation: 'radial', event: 'singularity', value: null });
exact('오버플로도 사건', m(0, 1e-200).event, 'singularity');
exact('반복 실행 분리', P.measurements([m(0, 20, 6), m(0, 40, 7)], 7).map(s => s.r), [40]);
numeric('위조 값 재계산', P.measurements([{ ...m(0, 40), value: 0 }], 7)[0].value, 2736.256185, handDA(0, 40));
exact('지평선·파괴·특이점 사건', [P.eventsBetween(m(1, 1), m(1, 0.5)), P.eventsBetween(m(0, 200), m(0, 20)), P.eventsBetween(m(0, 20), m(0, 0))], [['horizon'], ['disruption'], ['singularity']]);
exact('실행·질량·방향 변경은 사건 아님', [P.eventsBetween(m(0, 200, 6), m(0, 20)), P.eventsBetween(m(1, 200), m(0, 20)), P.eventsBetween(m(0, 200), m(0, 20, 7, 'transverse'))], [[], [], []]);
const q1 = samples => P.judgeQ1({ samples, runId: 7 });
exact('Q1 통과 (1000·200에서 접근)', [q1([m(0, 1000), m(0, 10)]), q1([m(0, 200), m(0, 20)])], [true, true]);
exact('Q1 실패 (역순·빈·다른 실행)', [q1([m(0, 20), m(0, 1000)]), q1([]), q1([m(0, 1000, 6), m(0, 20)])], [false, false, false]);
exact('Q1 경계 20/초과', [20, 20.000001].map(r => q1([m(0, 1000), m(0, r)])), [true, false]);
const q2 = (samples, ratioSeen = true) => P.judgeQ2({ samples, runId: 7, ratioSeen });
exact('Q2 통과', q2([m(0, 40), m(0, 20)]), true);
exact('Q2 실패 (비·열람·실행)', [q2([m(0, 40), m(0, 10)]), q2([m(0, 40), m(0, 20)], false), q2([m(0, 40, 6), m(0, 20)])], [false, false, false]);
exact('Q2 스냅 경계/바깥', [q2([m(0, P.snapR(40.8)), m(0, P.snapR(20.4))]), q2([m(0, 40.80001), m(0, 20.400005)])], [true, false]);
const sp = P.spaghettiR(0);
const q3 = current => P.judgeQ3({ previous: m(0, 200), current });
exact('Q3 통과', q3(m(0, 20)), true);
exact('Q3 실패 (전이 없음·다른 실행)', [P.judgeQ3({ previous: m(0, 20), current: m(0, 10) }), q3(m(0, 20, 8))], [false, false]);
exact('Q3 경계/직후', [q3(m(0, sp)), q3(m(0, sp * (1 - 1e-9)))], [false, true]);
const q4 = (samples, comparisonOpen = true) => P.judgeQ4({ samples, runId: 7, comparisonOpen });
exact('Q4 통과', q4([m(0, 1), m(1, 1)]), true);
exact('Q4 실패 (미열람·미측정·다른 실행)', [q4([m(0, 1), m(1, 1)], false), q4([]), q4([m(0, 1, 6), m(1, 1)])], [false, false, false]);
exact('Q4 스냅 경계/미스냅', [q4([m(0, P.snapR(1.02)), m(1, P.snapR(0.98))]), q4([m(0, 1.000001), m(1, 1)])], [true, false]);
const q5 = (r, stopped = true) => P.judgeQ5({ i: 1, r, stopped });
exact('Q5 통과', q5(0.5), true);
exact('Q5 실패 (움직임·파괴·빈 값)', [q5(0.5, false), q5(0.001), q5(undefined)], [false, false, false]);
exact('Q5 지평선/한계 경계', [q5(1), q5(1 - 1e-9), q5(P.spaghettiR(1)), q5(P.spaghettiR(1) * (1 - 1e-9))], [false, true, true, false]);
const q6 = (i, r) => P.judgeQ6({ i, r });
exact('Q6 통과 두 큰 질량', [q6(1, 0.5), q6(2, 0.5)], [true, true]);
exact('Q6 실패 (작은 질량·범위·빈)', [q6(0, 0.5), q6(3, 0.5), q6(2, 0), q6(1, undefined)], [false, false, false, false]);
exact('Q6 경계 (지평선·한계·레일 끝)', [q6(2, 1), q6(2, P.spaghettiR(2)), q6(2, P.spaghettiR(2) * (1 - 1e-9)), q6(2, 0.0005)], [false, true, false, false]);
exact('모든 퀘스트 가로 상태 거부', [
  P.judgeQ1({ samples: [m(0, 1000, 7, 'transverse'), m(0, 20, 7, 'transverse')], runId: 7 }),
  q2([m(0, 40, 7, 'transverse'), m(0, 20, 7, 'transverse')]),
  q3(m(0, 20, 7, 'transverse')),
  q4([m(0, 1, 7, 'transverse'), m(1, 1, 7, 'transverse')]),
  P.judgeQ5({ i: 1, r: 0.5, stopped: true, orientation: 'transverse' }),
  P.judgeQ6({ i: 1, r: 0.5, orientation: 'transverse' }),
], [false, false, false, false, false, false]);
// R1 scene-only mapping checks; preceding physics tests stay unchanged.
exact('R1 scene mapping API', typeof P.sceneState, 'function');
if (P.sceneState) {
  numeric('R1 far radius', P.sceneState(0,1000).radius, 1.26, 1.26, 1e-12);
  numeric('R1 near radius', P.sceneState(0,0.0005).radius, 0.168, 0.168, 1e-12);
  exact('R1 horizon', P.sceneState(1,1).radius, P.SCENE.horizon);
  const inside = [0,1,2].every(i => ['radial','transverse'].every(o =>
    Array.from({length:1001},(_,k)=>P.sceneState(i,P.rFromRailX(k/1000),o)).every(v =>
      v.radius+v.length/2+v.gap < P.SCENE.radiusMax && Number.isFinite(v.field))));
  exact('R1 all extents inside table', inside, true);
  exact('R1 intact inside large horizon', P.sceneState(1,0.5).intact, true);
  exact('R1 broken outside small horizon', P.sceneState(0,20).intact, false);
  exact('R1 field monotonic', P.sceneState(0,20).field >= P.sceneState(0,40).field, true);
}
// R2 independent SI display checks.
exact('R2 grammar API', typeof P.grammarState, 'function');
if(P.grammarState){
 for(const i of [0,1,2])for(const r of [1000,40,20,1,0.0005])for(const o of ['radial','transverse']){
  const v=P.grammarState(i,r,o), a=handDA(i,r,o==='transverse');
  numeric(`R2 cells ${i}/${r}/${o}`,v.marks,Math.min(30,a/handDA(0,40)),Math.min(30,a/handDA(0,40)),1e-6);
  const length=0.14*(o==='radial'?handStretch(a):1/handStretch(a))*1.45;
  numeric(`R2 body ${i}/${r}/${o}`,v.body.length,length,length,1e-6);
  exact(`R2 finite bounds ${i}/${r}/${o}`,v.pull.every(x=>x.length<=0.39)&&v.difference.every(x=>x.length<=0.39)&&v.trail.every(x=>x>=0.168-1e-12&&x<=1.26+1e-12),true);
 }
 exact('R2 half distance cells',[P.grammarState(0,40).marks,P.grammarState(0,20).marks],[1,8]);
 exact('R2 overflow',P.grammarState(0,0.0005).overflow,true);
 const threshold=(4.5-3.9*P.railX(handSp(0)*Math.cbrt(0.5)))*0.28;
 numeric('R2 transverse threshold',P.grammarState(0,1,'transverse').threshold,threshold,threshold,1e-6);
}
// Additional R2 arrow checks use direct independent SI acceleration.
if(P.grammarState){
 for(const i of [0,1,2])for(const r of [1000,200,40,20,1,0.0005]){
  const v=P.grammarState(i,r),unit=handDA(0,40),center=G*masses[i]*solar/(r*handRs(i))**2,a=handDA(i,r);
  [center-a/2,center+a/2].forEach((value,j)=>numeric(`R2 pull ${i}/${r}/${j}`,v.pull[j].length,Math.min(30,Math.abs(value)/unit)*0.013,Math.min(30,Math.abs(value)/unit)*0.013,1e-6));
  numeric(`R2 difference ${i}/${r}`,v.difference[0].length,Math.min(30,a/2/unit)*0.013,Math.min(30,a/2/unit)*0.013,1e-6);
 }
 const ref=P.grammarState(0,1),other=P.grammarState(1,1);
 numeric('R2 shared pin unit',other.marks,handDA(1,1)/handDA(0,40),handDA(1,1)/handDA(0,40),1e-6);
 exact('R2 enlarged body bound', [0,1,2].every(i=>['radial','transverse'].every(o=>Array.from({length:1001},(_,j)=>P.grammarState(i,P.rFromRailX(j/1000),o)).every(v=>-0.45-v.radius-v.body.length/2-v.gap/2-v.marker>=-2.12))),true);
}
// R4 pure display mapping preserves the physical state and enlarges only body geometry.
for(const i of [0,1,2])for(const r of [1000,40,20,1,.5,.0005]){
 const v=P.presentationState(i,r),b=P.grammarState(i,r);
 numeric(`R4 display body ${i}/${r}`,v.body.length,b.body.length*2.35/1.45,b.body.length*2.35/1.45,1e-12);
 exact(`R4 evidence unchanged ${i}/${r}`,[v.intact,v.crossedHorizon,v.marks],[b.intact,b.crossedHorizon,b.marks]);
}
// R5: independent model samples, readable ranges, and stable candidate silhouettes.
const predictions=(id,keys)=>keys.map(key=>P.cardPrediction(id,{key}));
const q1Display=predictions(1,['vanish','little','large']);
for(const [j,r]of [1000,40,20].entries())numeric(`R5 Q1 physical sample ${r}`,q1Display[j].value,handDA(0,r),handDA(0,r),1e-12);
exact('R5 Q1 arrow separation',q1Display[0].arrow<1&&q1Display[1].arrow>15&&q1Display[2].arrow-q1Display[1].arrow>35,true);
exact('R5 Q1 body separation',q1Display[2].length-q1Display[1].length>65,true);
for(const ratio of [2,4,8]){
 const v=P.cardPrediction(2,{ratio});
 numeric(`R5 Q2 independent ratio ${ratio}`,handDA(0,v.r)/handDA(0,40),ratio,ratio,1e-12);
}
const q3Display=predictions(3,['inside','on','outside']);
exact('R5 Q3 inside/on/outside',q3Display[0].radius<q3Display[0].horizon&&q3Display[1].radius===q3Display[1].horizon&&q3Display[2].radius>q3Display[2].horizon+20,true);
const q4Display=predictions(4,['larger','same','smaller']);
exact('R5 Q4 arrow separation',q4Display[0].arrow>95&&q4Display[1].arrow===52&&q4Display[2].arrow<.001,true);
exact('R5 Q4 SI ratios',Math.abs(q4Display[0].b/q4Display[0].a-400000)<1e-8&&Math.abs(q4Display[2].b/q4Display[2].a-1/400000**2)<1e-20,true);
exact('R5 Q5 failure sequences',predictions(5,['horizon','threshold','never']).map(v=>v.samples.map(s=>s.intact)),[[true,false,false],[true,true,false],[true,true,true]]);
const q6Display=[0,1,2].map(i=>P.cardPrediction(6,{i}));
exact('R5 Q6 specimen sizes',q6Display[0].size===16&&q6Display[1].size>45&&q6Display[2].size===62,true);
const cards=new Function('PHYS',fs.readFileSync('src/66-cards.js','utf8')+';return CARDS;')(P);
const choices=[['vanish','little','large'],['2','4','8'],['inside','on','outside'],['larger','same','smaller'],['horizon','threshold','never'],['0','1','2']];
for(const [j,keys]of choices.entries()){
 const render=(key,t)=>cards.picture(j+1,{key,ratio:Number(key),i:Number(key)},t);
 exact(`R5 Q${j+1} three distinct silhouettes`,new Set(keys.map(k=>render(k,0))).size,3);
 exact(`R5 Q${j+1} stable across loop reset`,keys.every(k=>[.25,1.2,2.5,3].every(t=>render(k,t)===render(k,0))),true);
}
console.log(`\n총 ${count}개: 통과 ${count - failures}, 실패 ${failures}`);
process.exitCode = failures ? 1 : 0;
