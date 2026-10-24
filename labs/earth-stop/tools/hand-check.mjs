// node tools/hand-check.mjs
import './mission-check.mjs';
import fs from 'node:fs';
const source = fs.readFileSync('src/15-physics.js', 'utf8');
const block = source.match(/\/\/ ==== 1 PHYSICS ====([\s\S]*?)\/\/ ==== END PHYSICS ====/);
if (!block) throw new Error('물리 마커 없음');
const PHYS = new Function(block[1] + '\nreturn PHYS;')();

// 손계산은 PHYS 상수를 참조하지 않는다. 수치·단위 오류를 잡는다.
const R = 6371000, T0 = 86164.1, day = 86400, year = 365.25 * day;
const eq = 2 * Math.PI * R / T0;
const speed = phi => eq * Math.cos(phi * Math.PI / 180);
const solar = p => 1 / Math.abs(1 / p - 1 / year) / day;
const safe = limit => Math.acos(limit / eq) * 180 / Math.PI;
let count = 0, failed = 0;
const fmt = value => typeof value === 'number' ? String(Number(value.toPrecision(11))) : JSON.stringify(value);
console.log('| 항목 | 기대 | 실제 | 판정 |\n|---|---|---|---|');
function row(name, expected, actual, ok) {
  count++;
  if (!ok) failed++;
  console.log(`| ${name} | ${expected} | ${fmt(actual)} | ${ok ? '통과' : '실패'} |`);
}
function exact(name, expected, actual) {
  row(name, fmt(expected), actual, JSON.stringify(expected) === JSON.stringify(actual));
}
function numeric(name, fixed, hand, actual, tolerance = 0.005) {
  const near = n => Number.isFinite(actual) && Math.abs(actual - n) <= Math.abs(n) * tolerance;
  row(name, `${fmt(fixed)} / 손 ${fmt(hand)}`, actual, near(fixed) && near(hand));
}
numeric('적도 속도 m/s', 464.58, eq, PHYS.v(0, T0), 0.002);
numeric('위도 60° m/s', 232.29, speed(60), PHYS.v(60, T0));
exact('양극 속도 m/s', [0, 0], [-90, 90].map(p => PHYS.v(p, T0)));
numeric('적도 시속 km/h', 1672.5, eq * 3.6, PHYS.v(0, T0) * 3.6);
numeric('마하', 1.354, eq / 343, PHYS.mach(PHYS.v(0, T0)));
numeric('안전 위도 30m/s °', 86.30, safe(30), PHYS.phiSafe(30), 0.05 / 86.30);
numeric('안전 위도 5m/s °', 89.38, safe(5), PHYS.phiSafe(5));
numeric('Q6 한계 위도 °', 86.57, safe(27.78), PHYS.phiSafe(27.78));
exact('안전 위도 양 끝', [90, 0, 0], [0, eq, eq + 1].map(PHYS.phiSafe));
numeric('P 두 배 속도 m/s', 232.29, eq / 2, PHYS.v(0, T0 * 2));
exact('정지 속도', 0, PHYS.v(0, Infinity));
for (const [name, p, expected] of [['현재', T0, 1], ['2일 정정', 2 * day, 2.01101169993],
  ['10일 정정', 10 * day, 10.2814919071], ['30일', 30 * day, 32.68], ['365일', 365 * day, 533265]]) {
  numeric(`태양일 ${name} (일)`, expected, solar(p), PHYS.solarDay(p) / day, 0.001);
}
numeric('완전 정지 태양일 (일)', 365.25, year / day, PHYS.solarDay(Infinity) / day, 0.001);
exact('동주기 특이점: 값 없음·사건', [null, 'synchronous'], [PHYS.solarDay(year), PHYS.solarState(year)]);
numeric('동주기 뒤 주기 (일)', 730.5, solar(2 * year), PHYS.solarDay(2 * year) / day);
exact('태양일 상태', ['cycling', 'stopped', 'empty', 'empty'],
  [T0, Infinity, 0, NaN].map(PHYS.solarState));
exact('데이터 없음', [null, null, null], [PHYS.solarDay(0), PHYS.solarDay(NaN), PHYS.stopMeasurement({ runId: 1, phi: 0, mode: 'sudden', executed: false })]);
exact('벤치마크 m/s', [1.4, 5, 30, 85, 250, 343], PHYS.BENCH.map(b => b.speed));
exact('범위 (초·도)', [[-90, 90], [T0, 365 * day]], [PHYS.RANGE.phi, PHYS.RANGE.P]);
exact('위도 걸림 °', [-90, -60, -30, 0, 30, 60, 90], PHYS.DETENTS.phi.map(d => d.phi));
exact('주기 걸림 (현재·끝·정지)', [T0, 365 * day, 'stop'], PHYS.DETENTS.P.map(d => d.P === Infinity ? 'stop' : d.P));
let phiError = 0, pError = 0, monotonic = true, prevPhi = -Infinity, prevP = -Infinity;
for (let i = 0; i <= 1000; i++) {
  const phi = -90 + 180 * i / 1000, p = T0 * (365 * day / T0) ** (i / 1000);
  const xPhi = PHYS.phiRailX(phi), xP = PHYS.periodRailX(p);
  monotonic &&= xPhi > prevPhi && xP > prevP;
  prevPhi = xPhi; prevP = xP;
  phiError = Math.max(phiError, Math.abs(PHYS.phiFromRailX(xPhi) - phi));
  pError = Math.max(pError, Math.abs(PHYS.periodFromRailX(xP) / p - 1));
}
row('레일 왕복·단조 1001점', '도 오차<1e-10, 상대<1e-12, 단조', [phiError, pError, monotonic], phiError < 1e-10 && pError < 1e-12 && monotonic);
const railFixed = [0, 0.1, 0.2, 0.5, 0.8, 0.9, 1];
const railActual = [-90, -85, -60, 0, 60, 85, 90].map(PHYS.phiRailX);
row('레일 독립 기준점', `${fmt(railFixed)}, 절대 1e-12`, railActual, railActual.every((x, i) => Math.abs(x - railFixed[i]) < 1e-12));
numeric('주기 로그 중점 x', 0.45, 0.9 * Math.log(Math.sqrt(T0 * 365 * day) / T0) / Math.log(365 * day / T0), PHYS.periodRailX(Math.sqrt(T0 * 365 * day)), 1e-12);
exact('주기 끝·정지·흡착 경계', [0.9, 1, 365 * day, 'stop'],
  [PHYS.periodRailX(365 * day), PHYS.periodRailX(Infinity), PHYS.periodFromRailX(0.949999), PHYS.periodFromRailX(0.95) === Infinity ? 'stop' : 'wrong']);
exact('레일 범위 밖', [0, 1, -90, 90, T0, 'stop'], [PHYS.phiRailX(-100), PHYS.phiRailX(100), PHYS.phiFromRailX(-1), PHYS.phiFromRailX(2), PHYS.periodFromRailX(-1), PHYS.periodFromRailX(2) === Infinity ? 'stop' : 'wrong']);
const gaps = [...PHYS.DETENTS.phi.slice(1).map((d, i) => d.x - PHYS.DETENTS.phi[i].x), ...PHYS.DETENTS.P.slice(1).map((d, i) => d.x - PHYS.DETENTS.P[i].x)];
row('이웃 걸림 최소 간격', '≥0.05', Math.min(...gaps), gaps.every(g => g >= 0.05));
const widths = [PHYS.phiRailX(1) - PHYS.phiRailX(-1), 1 - PHYS.phiRailX(60),
  0.9 - PHYS.periodRailX(30 * day), 1 - 0.95, 1 - PHYS.phiRailX(safe(27.78))];
row('Q1·2·4·5·6 허용 레일 폭', '각 ≥0.009', widths, widths.every(w => w >= 0.009));
exact('Q1 통과·열람 실패·경계·밖', [true, false, true, false], [
  PHYS.judgeQ1({ phi: 0, speedSeen: true, benchSeen: true }), PHYS.judgeQ1({ phi: 0, speedSeen: true, benchSeen: false }),
  PHYS.judgeQ1({ phi: 1, speedSeen: true, benchSeen: true }), PHYS.judgeQ1({ phi: 1.001, speedSeen: true, benchSeen: true })]);
exact('Q2 통과·시작 실패·경계·밖', [true, false, true, false], [[0, 70], [30, 70], [-1, -60], [0, 59.999]].map(([fromPhi, phi]) => PHYS.judgeQ2({ fromPhi, phi, decreaseSeen: true })));
exact('Q2 관찰 없음', false, PHYS.judgeQ2({ fromPhi: 0, phi: 60, decreaseSeen: false }));
const measure = (runId, phi = 0) => PHYS.stopMeasurement({ runId, phi, mode: 'sudden', executed: true });
const q3 = (runId, measurement, phi = 0, mode = 'sudden') => PHYS.judgeQ3({ runId, measurement, phi, mode, relativeSeen: true });
numeric('급정지 관측 속도 m/s', 464.58, eq, measure(1).relativeSpeed);
exact('Q3 통과·이전 실행·극 경계·빈 상태', [true, false, true, false], [q3(1, measure(1)), q3(2, measure(1)), q3(3, measure(3, 90), 90), q3(1, null)]);
exact('Q3 방식·위도·관찰 불일치', [false, false, false], [q3(1, measure(1), 0, 'gradual'), q3(1, measure(1), 60), PHYS.judgeQ3({ runId: 1, phi: 0, mode: 'sudden', measurement: measure(1), relativeSeen: false })]);
exact('관측 빈 상태·실행 번호 경계', [null, null, null], [PHYS.stopMeasurement({ runId: 0, phi: 0, mode: 'sudden', executed: true }), PHYS.stopMeasurement({ runId: 1, phi: 0, mode: 'gradual', executed: true }), PHYS.stopMeasurement({ runId: 1, phi: 91, mode: 'sudden', executed: true })]);
exact('Q4 통과·실패·경계·정지', [true, false, true, false], [31, 29.999, 30, Infinity].map(p => PHYS.judgeQ4({ P: p * day, mode: 'gradual', daySeen: true })));
exact('Q4 열람·방식 실패', [false, false], [PHYS.judgeQ4({ P: 30 * day, mode: 'gradual', daySeen: false }), PHYS.judgeQ4({ P: 30 * day, mode: 'sudden', daySeen: true })]);
exact('Q5 통과·유한 끝·방식 실패', [true, false, false], [PHYS.judgeQ5({ P: Infinity, mode: 'gradual' }), PHYS.judgeQ5({ P: 365 * day, mode: 'gradual' }), PHYS.judgeQ5({ P: Infinity, mode: 'sudden' })]);
exact('Q6 통과·실패·경계·남극', [true, false, true, true], [87, 86.5, safe(27.78), -90].map(phi => PHYS.judgeQ6({ phi })));
exact('Q6 경계 바로 안팎', [false, true], [-1e-7, 1e-7].map(d => PHYS.judgeQ6({ phi: safe(27.78) + d })));
exact('위도 오류 판정', [false, false], [PHYS.judgeQ6({ phi: 360 }), PHYS.judgeQ1({ phi: NaN, speedSeen: true, benchSeen: true })]);
// R1 presentation mappings: independent geometry/time expectations, no force model.
exact('R1 매핑 API', true, typeof PHYS.scenePoint === 'function');
if (typeof PHYS.scenePoint === 'function') {
  const point = PHYS.scenePoint(0, 0), pole = PHYS.scenePoint(90, 1);
  row('R1 구면 좌표', '[0,1.95,0.65], 극 y=2.6', [point, pole],
    Math.abs(point[0]) < 1e-12 && Math.abs(point[1] - 1.95) < 1e-12 && Math.abs(point[2] - 0.65) < 1e-12 && Math.abs(pole[1] - 2.6) < 1e-12);
  numeric('R1 현재 재생 12초 한 바퀴', 2 * Math.PI, 2 * Math.PI, PHYS.spinAngle(12, T0), 1e-12);
  exact('R1 정지 자전 영', 0, PHYS.spinAngle(12, Infinity));
  numeric('R1 정지 태양 방향 12초 한 바퀴', 2 * Math.PI, 2 * Math.PI, PHYS.sunAngle(12, Infinity), 1e-12);
  numeric('R1 속도 선형 축척', 0.8, 0.8, PHYS.speedLength(343), 1e-12);
  numeric('R1 태양일 그래프 유한 끝', 1, 1, PHYS.dayGraphY(365 * day), 1e-12);
  exact('R1 동주기 그래프 빈 값', null, PHYS.dayGraphY(year));
  const a = PHYS.tangentPoint(0, 0, eq, 1), b = PHYS.tangentPoint(60, 0, eq / 2, 1);
  numeric('R1 접선 이동 위도60 절반', 0.5, 0.5, b[0] / a[0], 1e-12);
  const extent = PHYS.SCENE.bounds;
  let contained = true;
  for (const phi of [-90,-60,0,60,90]) for (let i=0;i<=24;i++) {
    const q = PHYS.tangentPoint(phi, i/24*Math.PI*2, speed(phi), 1);
    contained &&= q.every((v,k)=>v>=extent[0][k] && v<=extent[1][k]);
  }
  exact('R1 극단 접선이 장치 경계 안', true, contained);
  exact('R1 매핑 상수 동결', true, Object.isFrozen(PHYS.SCENE) && Object.isFrozen(PHYS.SCENE.bounds[0]));
  numeric('R1 자전 각속도 주기 역비례', 0.5, 0.5, PHYS.spinAngle(3, 2*T0)/PHYS.spinAngle(3,T0), 1e-12);
  numeric('R1 자전-공전 상대각 태양일 일치', 2*Math.PI, 2*Math.PI,
    PHYS.spinAngle(PHYS.solarDay(T0)*12/T0,T0)-PHYS.sunAngle(PHYS.solarDay(T0)*12/T0,T0), 1e-12);
  exact('R1 유한 주기 공전 시간축 동일', PHYS.sunAngle(12,T0), PHYS.sunAngle(12,365*day));
  const envelope=PHYS.sceneEnvelope();
  exact('R1 카메라 외피 유한·고정 경계 안', true, envelope.every(q=>q.every((v,k)=>Number.isFinite(v)&&v>=extent[0][k]&&v<=extent[1][k])));
}
// R2 independent formula checks (relative tolerance 1e-6).
const strict=(name,expected,actual)=>numeric(name,expected,expected,actual,1e-6);
strict('R2 sound unit length',.8,PHYS.quantity(343).length);
strict('R2 equator arrow',eq/343*.8,PHYS.quantity(eq).length);
strict('R2 equator units',eq/343,PHYS.quantity(eq).units);
strict('R2 partial sound unit',eq/343-1,PHYS.quantity(eq).fraction);
exact('R2 quantity cap', [1,1.12,true], [PHYS.quantity(343*40).full,PHYS.quantity(343*40).length,PHYS.quantity(343*40).clipped]);
exact('R2 zero speed', [0,0,0,false], (()=>{const q=PHYS.quantity(0);return [q.length,q.full,q.fraction,q.clipped];})());
strict('R2 latitude radius 60',.65*Math.cos(Math.PI/3),PHYS.latitudeSection(60).radius);
strict('R2 latitude height 60',.65*Math.sin(Math.PI/3),PHYS.latitudeSection(60).height);
strict('R2 latitude speed 60',eq*Math.cos(Math.PI/3),PHYS.latitudeSection(60).speed);
for(const p of [T0,30*day,365*day,Infinity]){
 const period=p===Infinity?year:1/Math.abs(1/p-1/year),expected=Math.ceil(period/10800),samples=PHYS.daySamples(p);
 exact(`R2 day total ${p}`,expected,samples.total);
 exact(`R2 day cap ${p}`,Math.min(30,expected),samples.points.length);
 exact(`R2 day overflow ${p}`,expected>30,samples.clipped);
 samples.points.forEach((point,i)=>{
  if(i===1)strict(`R2 day fixed time ${p}`,10800,point.seconds);
  if(i===1)strict(`R2 day angle ${p}`,2*Math.PI*10800/period,point.angle);
 });
 exact(`R2 bright/hollow ${p}`,true,samples.points.every(p=>p.bright===(Math.cos(p.angle)>=0)));
}
exact('R2 synchronous empty',0,PHYS.daySamples(year).points.length);
strict('R2 spin arc',2*Math.PI*10800/T0,PHYS.relativeArcs(T0).spin);
strict('R2 orbit arc',2*Math.PI*10800/year,PHYS.relativeArcs(T0).orbit);
strict('R2 relative arc',2*Math.PI*10800*(1/T0-1/year),PHYS.relativeArcs(T0).relative);
exact('R2 stopped spin',0,PHYS.relativeArcs(Infinity).spin);
const trace=PHYS.traceSamples(0,0,eq,1),liteTrace=PHYS.traceSamples(0,0,eq,1,true);
exact('R2 trace counts', [21,11], [trace.length,liteTrace.length]);
strict('R2 trace equal spacing',.05*eq/343*.8,trace[1].point[0]-trace[0].point[0]);
strict('R2 lite physical spacing',.1*eq/343*.8,liteTrace[1].point[0]-liteTrace[0].point[0]);
exact('R2 lite same endpoint',trace.at(-1).point,liteTrace.at(-1).point);
exact('R2 no future trace',true,PHYS.traceSamples(0,0,eq,.15).filter(p=>p.visible).every(p=>p.seconds<=.15));
exact('R2 baseline source pure',true,Object.isFrozen(PHYS.GRAMMAR));
exact('R2 envelope finite',true,PHYS.presentationEnvelope().every(p=>p.every(Number.isFinite)));
// Scalar perspective projection, independent of Three.js and browser rendering.
// x_screen = (right dot (p-target)) / (distance - forward dot (p-target))
//            / tan(FOV/2) / aspect. y uses the orthogonal camera-up vector.
function projectEnvelope(width,height,portrait){
 const envelope=PHYS.presentationEnvelope(),target=[0,1.91,0],aspect=width/height;
 // CSS: mobile top strip 78+45 px; 8 controls in a 3-row toolbar (188px).
 const top=portrait?264:85,bottom=height-(portrait?220:106),fov=portrait?38:34;
 let best=null;
 for(const azimuth of portrait?[22,30,38]:[0,8,15,20])for(const elevation of (portrait?[15,20,25]:[10,15,20])){
  const a=azimuth*Math.PI/180,e=elevation*Math.PI/180;
  const forward=[Math.sin(a)*Math.cos(e),Math.sin(e),Math.cos(a)*Math.cos(e)];
  const right=[Math.cos(a),0,-Math.sin(a)],up=[-Math.sin(a)*Math.sin(e),Math.cos(e),-Math.cos(a)*Math.sin(e)];
  const dot=(a,b)=>a.reduce((sum,x,i)=>sum+x*b[i],0);
  for(let distance=2.8;distance<=24;distance+=.05){
   const xy=envelope.map(p=>{const q=p.map((v,i)=>v-target[i]),z=distance-dot(forward,q);
    return [width/2+dot(right,q)/z/Math.tan(fov*Math.PI/360)/aspect*width/2,
     height/2-dot(up,q)/z/Math.tan(fov*Math.PI/360)*height/2];});
   const left=Math.min(...xy.map(p=>p[0])),rightEdge=Math.max(...xy.map(p=>p[0]));
   const lo=Math.min(...xy.map(p=>p[1])),hi=Math.max(...xy.map(p=>p[1])),w=(rightEdge-left)/width;
   const offset=(top+bottom-lo-hi)/2,score=Math.abs(w-.69);
   if(w>.75||w<.6||hi-lo>bottom-top||left<8||rightEdge>width-8||lo+offset<top||hi+offset>bottom)continue;
   if(!best||score<best.score)best={score,distance,azimuth,elevation,fov,width:w,left,right:rightEdge,top:lo+offset,bottom:hi+offset,offset};
  }
 }
 return best;
}
for(const [w,h] of [[375,812],[1440,900],[1920,1080]]){
 const fit=projectEnvelope(w,h,w/h<.9);
 exact(`R2 projection ${w}x${h} exists`,true,fit!==null);
 if(fit){console.log(`PROJECTION ${w}x${h} ${JSON.stringify(fit)}`);
  exact(`R2 projection ${w}x${h} no clip`,true,fit.left>=0&&fit.right<=w&&fit.top>=0&&fit.bottom<=h&&fit.width<=.75);}
}
console.log(`\n총 ${count}개: 통과 ${count - failed}, 실패 ${failed}`);
process.exitCode = failed ? 1 : 0;
