// node tools/hand-check.mjs
import fs from 'node:fs';

let count = 0, failures = 0;
const fmt = v => typeof v === 'number' ? Number(v.toPrecision(10)).toString()
  : Array.isArray(v) ? `[${v.map(fmt).join(', ')}]` : JSON.stringify(v);
console.log('| 항목 | 기대 | 실제 | 판정 |\n|---|---|---|---|');
function row(name, expected, actual, ok) {
  count++;
  if (!ok) failures++;
  console.log(`| ${name} | ${expected} | ${actual} | ${ok ? '통과' : '실패'} |`);
}
function exact(name, actual, expected) {
  row(name, fmt(expected), fmt(actual), JSON.stringify(actual) === JSON.stringify(expected));
}
function numeric(name, actual, fixed, hand, tolerance = 0.005) {
  const values = Array.isArray(actual) ? actual : [actual];
  const references = [fixed, hand].map(v => Array.isArray(v) ? v : [v]);
  const ok = references.every(ref => ref.length === values.length && ref.every((e, j) =>
    Number.isFinite(values[j]) && Math.abs(values[j] - e) <= tolerance * Math.abs(e)));
  row(name, `${fmt(fixed)} / 손 ${fmt(hand)}`, fmt(actual), ok);
}

let P;
try {
  const src = fs.readFileSync(process.argv[2] || 'src/15-physics.js', 'utf8');
  const match = src.match(/\/\/ ==== 1 PHYSICS ====([\s\S]*?)\/\/ ==== END PHYSICS ====/);
  if (!match) throw new Error('물리 마커 없음');
  P = new Function(`${match[1]}\nreturn PHYS;`)();
  exact('마커 new Function 로드', typeof P.g, 'function');
} catch (error) {
  row('마커 new Function 로드', 'PHYS 로드 성공', error.message, false);
  // R4 selected sphere and section share one display-only mapping.
exact('R4 specimen display API',typeof P.specimenVisual,'function');
if(P.specimenVisual){
 const d=P.specimenVisual();
 numeric('R4 specimen display radius',d.radius,0.37125,0.275*1.35,1e-12);
 exact('R4 specimen shared center',d.center,[0,1.30,0.08]);
 exact('R4 specimen section in front',d.front>d.center[2]+d.radius,true);
 const before=P.g(1);d.center[1]=-999;
 exact('R4 pure specimen fresh output',[P.specimenVisual().center[1],P.g(1)],[1.30,before]);
}
console.log(`총 ${count}개: 통과 ${count - failures}, 실패 ${failures}`);
  process.exit(1);
}

// 요구사항의 상수와 기대값을 PHYS에서 읽지 않고 독립적으로 적는다.
const G = 6.674e-11, v = 2.8, massPerWeight = 8;
const table = [
  ['지구', 5.972e24, 6.371e6, 9.8195, 1],
  ['달', 7.342e22, 1.737e6, 1.624, 0.1654],
  ['명왕성', 1.303e22, 1.1883e6, 0.6159, 0.06272],
  ['화성', 6.417e23, 3.3895e6, 3.728, 0.3797],
  ['금성', 4.867e24, 6.0518e6, 8.869, 0.9032],
  ['토성', 5.683e26, 5.8232e7, 11.19, 1.139],
  ['목성', 1.898e27, 6.9911e7, 25.92, 2.640],
  ['태양', 1.989e30, 6.957e8, 274.3, 27.93],
  ['중성자별', 2.7846e30, 1.2e4, 1.2906e12, 1.314e11],
];
const gravity = table.map(([, m, r]) => G * m / (r * r));
table.forEach(([name, , , expectedG, expectedR], i) => {
  numeric(`${name} g·지구비`, [P.g(i), P.gRatio(i)], [expectedG, expectedR], [gravity[i], gravity[i] / gravity[0]]);
});
numeric('달 40kg 무게 N', P.weight(1, 5), 64.96, 5 * massPerWeight * gravity[1]);
for (const [i, expected] of [[0, 0.40], [1, 2.42], [6, 0.151], [7, 0.0143]]) {
  numeric(`${table[i][0]} 점프 m`, P.jumpHeight(i), expected, v * v / (2 * gravity[i]));
}
numeric('태양 kg 상당값', P.weight(7, 5) / 9.81, 1117, 40 * gravity[7] / 9.81);
numeric('중성자별 점프 m', P.jumpHeight(8), 3.037382861e-12, v * v / (2 * gravity[8]));
numeric('마디 단위 N', P.weight(0, 1), 78.55625626, massPerWeight * gravity[0]);
exact('질량 양끝·빈 입력', [1, 5, 0, 6, 1.5, null].map(P.mass), [8, 40, null, null, null, null]);
numeric('추 1~5 무게 비례', [1, 2, 3, 4, 5].map(n => P.weight(1, n)),
  [12.99244636, 25.98489273, 38.97733909, 51.96978545, 64.96223181],
  [1, 2, 3, 4, 5].map(n => n * 8 * gravity[1]));
exact('무효 천체 경계', [-1, 10, 0.5, null, undefined, NaN, Infinity, '1'].map(i => P.g(i)), Array(8).fill(null));
exact('무효 무게·점프 입력', [P.weight(1, 0), P.weight(10, 5), P.jumpHeight(null)], [null, null, null]);
exact('공간 g·비·무게·정점', [P.g(9), P.gRatio(9), P.weight(9, 5), P.jumpHeight(9)], [0, 0, 0, null]);
exact('양팔 지구·달·불균형·공간·빈값', [P.balanceState(0, 5, 5), P.balanceState(1, 5, 5),
  P.balanceState(1, 5, 4), P.balanceState(9, 5, 5), P.balanceState(null, 5, 5)],
['balanced', 'balanced', 'tilted', 'unloaded', null]);
numeric('지구·달 실제 마디', [P.springState(0, 5).marks, P.springState(1, 5).marks],
  [5, 0.8269517274], [5, 5 * gravity[1] / gravity[0]]);
exact('상한 양옆 태양 추1·2·5', [1, 2, 5].map(n => P.springState(7, n).broken), [false, true, true]);
exact('끊김 표시 상한', [P.springState(7, 5).shownMarks, P.springState(8, 1).shownMarks], [30, 30]);
exact('확대 표식 지구·태양·중성자별', [0, 7, 8].map(i => P.springState(i, 1).exaggerated), [false, true, true]);
exact('빈 스프링', P.springState(null, 5), null);
exact('점프 표시 하한·상한', [P.jumpVisual(7).shownHeight, P.jumpVisual(8).shownHeight, P.jumpVisual(2).shownHeight], [0.02, 0.02, 3]);
numeric('달 표시 원값 보존', P.jumpVisual(1).shownHeight, 2.42, v * v / (2 * gravity[1]));
exact('점프 확대 지구·달·명왕성·태양', [0, 1, 2, 7].map(i => P.jumpVisual(i).exaggerated), [false, false, true, true]);
exact('공간 표시 사건', P.jumpVisual(9), { height: null, shownHeight: null, event: 'no-apex', exaggerated: false });
exact('빈 점프 표시', P.jumpVisual(null), null);

exact('RANGE', P.RANGE, { body: [0, 9], nWeights: [1, 5] });
exact('걸림 개수·값', [P.DETENTS.body.map(d => d.i), P.DETENTS.nWeights.map(d => d.nWeights)],
  [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 5]]);
numeric('추 레일 전 칸', P.DETENTS.nWeights.map(d => d.x), [0, 0.25, 0.5, 0.75, 1], [1, 2, 3, 4, 5].map(n => (n - 1) / 4));
numeric('천체 레일 전 칸', P.DETENTS.body.map(d => d.x), Array.from({ length: 10 }, (_, i) => i / 9), Array.from({ length: 10 }, (_, i) => i / 9));
exact('레일 왕복 모든 걸림', [P.DETENTS.body.every(d => P.bodyFromRailX(d.x) === d.i),
  P.DETENTS.nWeights.every(d => P.weightsFromRailX(d.x) === d.nWeights)], [true, true]);
exact('이웃 간격·선택 폭', [P.DETENTS.body.slice(1).every((d, i) => d.x - P.DETENTS.body[i].x >= 0.05),
  P.DETENTS.nWeights.slice(1).every((d, i) => d.x - P.DETENTS.nWeights[i].x >= 0.05),
  P.bodyRailX(1) / 2 >= 0.009, P.railX(2) / 2 >= 0.009], [true, true, true, true]);
exact('추 선택 반칸 경계', [0.125 - 1e-8, 0.125, 0.125 + 1e-8].map(P.weightsFromRailX), [1, 2, 2]);
exact('천체 선택 반칸 경계', [1 / 18 - 1e-8, 1 / 18, 1 / 18 + 1e-8].map(P.bodyFromRailX), [0, 1, 1]);
exact('레일 양끝 외부 제한', [-1, 2].flatMap(x => [P.weightsFromRailX(x), P.bodyFromRailX(x)]), [1, 0, 5, 9]);
exact('빈 레일·무효 물리 좌표', [P.railX(null), P.bodyRailX(-1), P.weightsFromRailX(NaN), P.bodyFromRailX(null)], [null, null, null, null]);

exact('Q1 통과·다른 천체·추 양끝·범위밖', [[1, 5], [0, 5], [1, 1], [1, 0], [1, 6]].map(([i, nWeights]) => P.judgeQ1({ i, nWeights })), [true, false, true, false, false]);
exact('Q2 통과·미완료·빈 기록·중복·추 경계', [
  P.judgeQ2({ visited: [0, 1], nWeights: 5 }), P.judgeQ2({ visited: [1], nWeights: 5 }),
  P.judgeQ2({}), P.judgeQ2({ visited: [0, 0], nWeights: 5 }),
  P.judgeQ2({ visited: [0, 1], nWeights: 1 }), P.judgeQ2({ visited: [0, 1], nWeights: 0 }),
], [true, false, false, false, true, false]);
exact('Q3 목성·토성·태양·인덱스 경계', [6, 5, 7, -1, 9, 10].map(i => P.judgeQ3({ i })), [true, false, false, false, false, false]);
exact('Q4 통과·상한 아래·플래그·다른 천체', [[7, 5, true], [7, 1, true], [7, 2, true], [7, 5, false], [8, 5, true]]
  .map(([i, nWeights, breakSeen]) => P.judgeQ4({ i, nWeights, breakSeen })), [true, false, true, false, false]);
const earth = P.jumpTrial(0, 5, 1), moon = P.jumpTrial(1, 5, 2);
exact('시험 실행 번호·정상 사건', [earth.runId, moon.runId, earth.event, moon.event], [1, 2, 'apex', 'apex']);
numeric('시험 정점 재계산', [earth.height, moon.height], [0.40, 2.42], [v * v / (2 * gravity[0]), v * v / (2 * gravity[1])]);
exact('시험 번호 양끝·무효 입력', [P.jumpTrial(0, 5, 0), P.jumpTrial(0, 5, -1), P.jumpTrial(0, 5, 1.5),
  P.jumpTrial(0, 5, Infinity), P.jumpTrial(null, 5, 1), P.jumpTrial(0, 0, 1)], Array(6).fill(null));
exact('공간 시험 사건', P.jumpTrial(9, 5, 3), { runId: 3, i: 9, nWeights: 5, height: null, event: 'no-apex' });
exact('Q5 통과·하나·빈 상태·같은 번호 충돌', [P.judgeQ5({ runs: [earth, moon] }), P.judgeQ5({ runs: [earth] }),
  P.judgeQ5({}), P.judgeQ5({ runs: [earth, { ...moon, runId: 1 }] })], [true, false, false, false]);
exact('Q5 중복 재생·공간·무효 번호·높이 위조', [P.judgeQ5({ runs: [earth, earth] }),
  P.judgeQ5({ runs: [earth, P.jumpTrial(9, 5, 3)] }),
  P.judgeQ5({ runs: [earth, { ...moon, runId: 0 }] }),
  P.judgeQ5({ runs: [{ ...earth, height: 999 }, { ...moon, height: -999 }] })], [false, false, false, true]);
exact('Q5 충돌 번호 제거·독립 정상 기록', P.judgeQ5({ runs: [earth, { ...moon, runId: 1 }, moon, P.jumpTrial(0, 1, 4)] }), true);
exact('Q6 통과·태양·공간·경계', [8, 7, 9, -1, 10].map(i => P.judgeQ6({ i })), [true, false, false, false, false]);
exact('Q7 모든 천체 허용구간·지구 제외', Array.from({ length: 10 }, (_, i) => P.judgeQ7({ i })), [false, false, false, false, true, true, false, false, false, false]);
exact('Q7 금성·토성 양옆 레일 구간', [3.5 / 9 + 1e-8, 4.5 / 9 - 1e-8, 4.5 / 9 + 1e-8, 5.5 / 9 - 1e-8, 5.5 / 9 + 1e-8]
  .map(x => P.judgeQ7({ i: P.bodyFromRailX(x) })), [true, true, true, true, false]);
exact('모든 판정 빈 입력', [1, 2, 3, 4, 5, 6, 7].map(q => P[`judgeQ${q}`]()), Array(7).fill(false));
exact('순수 호출 반복', [P.weight(1, 5) === P.weight(1, 5), JSON.stringify(P.jumpTrial(1, 5, 2)) === JSON.stringify(moon)], [true, true]);

// Scene mappings keep the SI model intact and contain every extreme.
exact('scene mapping API', typeof P.sceneState, 'function');
if (P.sceneState) {
  numeric('scene spring Earth/Moon', [P.sceneState(0, 5).springLength, P.sceneState(1, 5).springLength],
    [0.31, 0.1848085518], [0.16 + 5 * 0.03, 0.16 + 5 * gravity[1] / gravity[0] * 0.03]);
  numeric('scene spring saturation', [P.sceneState(7, 5).springLength, P.sceneState(8, 1).springLength], [1.06, 1.06], [1.06, 1.06], 1e-12);
  exact('scene no apex', P.sceneState(9, 5).jumpApex, null);
  exact('scene bounded all inputs', Array.from({ length: 10 }, (_, i) => [1, 5].every(n => {
    const d = P.sceneState(i, n);
    return d.springEnd >= 1.65 && d.springEnd <= 2.73 && d.forceLevel >= 0 && d.forceLevel <= 1
      && (d.jumpApex === null || (d.jumpApex >= 1.08 && d.jumpApex <= 2.74));
  })), Array(10).fill(true));
  numeric('scene Moon apex', P.sceneState(1, 5).jumpApex, 2.407540597, 1.08 + 0.55 * v * v / (2 * gravity[1]));
  numeric('scene flight endpoints', [P.jumpSceneY(0, 0), P.jumpSceneY(0, 1), P.jumpSceneY(9, 0), P.jumpSceneY(9, 100)], [1.08, 1.08, 1.08, 2.73], [1.08, 1.08, 1.08, 2.73], 1e-12);
  numeric('scene flight apex', [P.jumpSceneY(0, v / gravity[0]), P.jumpSceneY(1, v / gravity[1])],
    [1.299562398, 2.407540597], [1.08 + 0.55 * v * v / (2 * gravity[0]), 1.08 + 0.55 * v * v / (2 * gravity[1])]);
  exact('scene layout bounds', [P.VIEW.bounds.min, P.VIEW.bounds.max], [[-1.68, 0.84, -0.62], [1.62, 2.96, 0.59]]);
}
// R2: independent display equations, strict relative tolerance 1e-6.
for(let i=0;i<10;i++)for(const n of [1,5]){
  const gravityHere=i===9?0:gravity[i],ratio=gravityHere/gravity[0],marks=Math.min(30,n*ratio);
  const d=P.grammarState(i,n),height=i===9?null:Math.max(0.02,Math.min(3,2.8**2/(2*gravityHere)));
  numeric(`R2 arrow/cells ${i}/${n}`,[d.arrowLength,d.cells.reduce((a,b)=>a+b,0),d.weight],
    [marks*0.03,marks,n*8*gravityHere],[marks*0.03,marks,n*8*gravityHere],1e-6);
  numeric(`R2 proportional steps ${i}/${n}`,d.steps,
    [1,2,3,4,5].map(k=>Math.min(30,k*ratio)*0.03),[1,2,3,4,5].map(k=>Math.min(30,k*ratio)*0.03),1e-6);
  exact(`R2 dots ${i}/${n}`,d.dots,Array.from({length:n},(_,k)=>(k-(n-1)/2)*0.075));
  const points=P.timeDots(i),duration=i===9?3/2.8:2*2.8/gravityHere;
  numeric(`R2 equal time ${i}/${n}`,points.map(p=>p.time),
    Array.from({length:17},(_,k)=>duration*k/16),Array.from({length:17},(_,k)=>duration*k/16),1e-6);
  numeric(`R2 trajectory ${i}/${n}`,points.map(p=>p.y),
    Array.from({length:17},(_,k)=>1.08+0.55*(i===9?3*k/16:height*4*(k/16)*(1-k/16))),
    Array.from({length:17},(_,k)=>1.08+0.55*(i===9?3*k/16:height*4*(k/16)*(1-k/16))),1e-6);
  for(const lite of [false,true]){
    const f=P.fieldVisual(i,n,lite);
    exact(`R2 particle cap ${i}/${n}/${lite}`,f.count,i===9?0:lite?48:96);
    numeric(`R2 brightness ${i}/${n}/${lite}`,f.brightness,0.12+0.28*marks/30,0.12+0.28*marks/30,1e-6);
  }
}
for(let i=0;i<9;i++){
  const ratio=table[i][2]/6.371e6,raw=0.075*Math.sqrt(ratio),r=Math.max(0.045,Math.min(0.24,raw));
  numeric(`R2 radius ratio ${i}`,[P.radiusVisual(i).ratio,P.radiusVisual(i).radius],[ratio,r],[ratio,r],1e-6);
  exact(`R2 radius clipping ${i}`,P.radiusVisual(i).clipped,raw!==r);
}
exact('R2 empty display input',[P.grammarState(-1,5),P.grammarState(0,0),P.radiusVisual(null),P.timeDots(10),P.fieldVisual(0,0)],Array(5).fill(null));
exact('R2 space radius',P.radiusVisual(9),{ratio:null,radius:0,clipped:false,exaggerated:true});
exact('R2 snapshot isolation',(()=>{const a=P.grammarState(0,5);a.spring.shownMarks=999;return P.grammarState(0,5).spring.shownMarks;})(),5);
// Independent pinhole projection: dot products, not THREE.Vector3.project.
function handProject(min,max,w,h,azDeg,elDeg,d,fov,top,bottom){
  const az=azDeg*Math.PI/180,el=elDeg*Math.PI/180,tan=Math.tan(fov*Math.PI/360);
  const right=[Math.cos(az),0,-Math.sin(az)],up=[-Math.sin(az)*Math.sin(el),Math.cos(el),-Math.cos(az)*Math.sin(el)];
  const back=[Math.sin(az)*Math.cos(el),Math.sin(el),Math.cos(az)*Math.cos(el)],dot=(a,b)=>a.reduce((v,x,k)=>v+x*b[k],0);
  const center=min.map((x,k)=>(x+max[k])/2),points=[];
  for(const x of [min[0],max[0]])for(const y of [min[1],max[1]])for(const z of [min[2],max[2]]){
    const q=[x,y,z].map((v,k)=>v-center[k]),depth=d-dot(q,back);
    points.push([w/2+dot(q,right)/depth/tan*h/2,h/2-dot(q,up)/depth/tan*h/2]);
  }
  const left=Math.min(...points.map(p=>p[0])),rightX=Math.max(...points.map(p=>p[0]));
  let y0=Math.min(...points.map(p=>p[1])),y1=Math.max(...points.map(p=>p[1]));
  const shift=(top+bottom-y0-y1)/2;y0+=shift;y1+=shift;
  return [left,rightX,y0,y1,(rightX-left)/w,(y1-y0)/h,shift];
}
const mobileProjection=handProject([-.88,.84,-.62],[1,3.81,.61],375,812,25,20,9.96,38,222,650);
numeric('R2 mobile pinhole projection',mobileProjection,[46.55916051,324.02405671,231.83613429,640.16386571,.7399063898,.5028666643,22.02267251],
  [46.55916051,324.02405671,231.83613429,640.16386571,.7399063898,.5028666643,22.02267251],1e-6);
exact('R2 mobile clipping/overlap', [mobileProjection[0]<0||mobileProjection[1]>375||mobileProjection[2]<0||mobileProjection[3]>812,
  mobileProjection[2]<208||mobileProjection[3]>664],[false,false]);
const desktopProjection=handProject([-1.70,.84,-.62],[1.62,2.96,.61],1440,900,18,15,5.72,34,104,794);
numeric('R2 desktop pinhole projection',desktopProjection,[235.73961444,1192.05880257,105.93489385,792.06510615,.6641105473,.7623669026,-48.14811146],
  [235.73961444,1192.05880257,105.93489385,792.06510615,.6641105473,.7623669026,-48.14811146],1e-6);
exact('R2 desktop clipping/overlap',[desktopProjection[0]<0||desktopProjection[1]>1440||desktopProjection[2]<0||desktopProjection[3]>900,
  desktopProjection[2]<90||desktopProjection[3]>808],[false,false]);
// R4 selected sphere and section share one display-only mapping.
exact('R4 specimen display API',typeof P.specimenVisual,'function');
if(P.specimenVisual){
 const d=P.specimenVisual();
 numeric('R4 specimen display radius',d.radius,0.37125,0.275*1.35,1e-12);
 exact('R4 specimen shared center',d.center,[0,1.30,0.08]);
 exact('R4 specimen section in front',d.front>d.center[2]+d.radius,true);
 const before=P.g(1);d.center[1]=-999;
 exact('R4 pure specimen fresh output',[P.specimenVisual().center[1],P.g(1)],[1.30,before]);
}
console.log(`총 ${count}개: 통과 ${count - failures}, 실패 ${failures}`);
process.exitCode = failures ? 1 : 0;
