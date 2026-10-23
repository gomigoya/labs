// node tools/hand-check.mjs
import fs from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
const src = fs.readFileSync('src/15-physics.js', 'utf8');
const block = src.match(/\/\/ ==== 1 PHYSICS ====([\s\S]*?)\/\/ ==== END PHYSICS ====/);
if (!block) throw new Error('PHYSICS 마커 없음');
const P = new Function(block[1] + '\nreturn PHYS;')();

// 모듈의 상수를 가져오지 않는 독립 손계산이다.
const g = 9.81, k = 0.5 * 70 * g / 70 ** (2 / 3), kidMuscle = 0.4 * 35 * g;
const masses = [15, 400, 3000, 6000, 8000, 70000];
const species = ['벨로키랍토르', '딜로포사우루스', '스테고사우루스', '트리케라톱스', '티라노사우루스', '아르젠티노사우루스'];
const fm = m => k * m ** (2 / 3), ff = (m, mu) => mu * m * g;
const kids = (n, mu) => n * Math.min(kidMuscle, ff(35, mu));
const dino = (m, mu) => Math.min(fm(m), ff(m, mu));
let count = 0, failures = 0;
const fmt = v => v === Infinity ? 'Infinity' : typeof v === 'number' ? Number(v.toPrecision(10)).toString() : JSON.stringify(v);
console.log('| 항목 | 기대 | 실제 | 판정 |\n|---|---|---|---|');
function row(name, expected, actual, ok) {
  count++;
  if (!ok) failures++;
  console.log(`| ${name} | ${expected} | ${actual} | ${ok ? '통과' : '실패'} |`);
}
function numeric(name, actual, required, hand, tolerance = 0.005) {
  const near = expected => Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance * Math.abs(expected);
  row(name, `${fmt(required)} / 손 ${fmt(hand)}`, fmt(actual), near(required) && near(hand));
}
function exact(name, actual, expected) {
  row(name, fmt(expected), fmt(actual), isDeepStrictEqual(actual, expected));
}
numeric('k (추정)', P.C.k, 20.2149, k);
numeric('아이 근육 N (추정)', P.C.kidMuscle, 137.34, kidMuscle);
exact('종·질량 kg', P.SPECIES, Object.fromEntries(species.map((s, i) => [s, masses[i]])));
exact('바닥 μ', P.GROUNDS, { 유리: 0.05, 모래: 0.35, 자갈: 0.55, 아스팔트: 0.8 });
for (const [i, required] of [122.95, 1097.6, 4205, 6675, 8086, 34335].entries()) {
  numeric(`Fm(${masses[i]}) N`, P.muscle(masses[i]), required, fm(masses[i]));
}
for (const [i, required] of [[0, 0.836], [4, 0.103], [5, 0.05]]) {
  numeric(`체중 대비 ${masses[i]}`, P.weightRatio(species[i]), required, fm(masses[i]) / (masses[i] * g));
}
for (const [mu, required] of [[0.05, 17.1675], [0.35, 120.1725], [0.55, 137.34], [0.8, 137.34]]) {
  numeric(`아이 1명 μ=${mu} N`, P.kidCap(1, mu), required, kids(1, mu));
}
numeric('티라노 유리 N', P.dinoCap(species[4], 0.05), 3924, dino(8000, 0.05));
numeric('벨로키랍토르 자갈 실제 한계 N (명세 보정)', P.dinoCap(species[0], 0.55), 80.9325, dino(15, 0.55));
numeric('30명 자갈 N', P.kidCap(30, 0.55), 4120.2, kids(30, 0.55));
numeric('48명 자갈 N', P.kidCap(48, 0.55), 6592, kids(48, 0.55));
numeric('49명 자갈 N', P.kidCap(49, 0.55), 6729, kids(49, 0.55));
numeric('58명 자갈 N', P.kidCap(58, 0.55), 7966, kids(58, 0.55));
numeric('59명 자갈 N', P.kidCap(59, 0.55), 8103, kids(59, 0.55));
for (const [i, mu, required] of [[3, 0.55, 49], [4, 0.55, 59], [4, 0.35, 68], [4, 0.05, Infinity]]) {
  const hand = Math.floor(dino(masses[i], mu) / kids(1, mu)) + 1;
  exact(`최소 인원 ${species[i]} μ=${mu}`, P.minKidsToWin(species[i], mu), required);
  exact(`최소 인원 독립 계산 ${i}/${mu}`, P.minKidsToWin(species[i], mu), hand > 100 ? Infinity : hand);
}
for (const [n, i, mu, winner, limiter] of [
  [1, 0, 0.55, 'kids', 'friction'], [30, 1, 0.55, 'kids', 'muscle'],
  [30, 2, 0.55, 'dino', 'muscle'], [48, 3, 0.55, 'dino', 'muscle'],
  [49, 3, 0.55, 'kids', 'muscle'], [58, 4, 0.55, 'dino', 'muscle'],
  [59, 4, 0.55, 'kids', 'muscle'], [59, 4, 0.05, 'dino', 'friction'],
  [68, 4, 0.35, 'kids', 'muscle'],
]) {
  const r = P.outcome(n, species[i], mu), net = kids(n, mu) - dino(masses[i], mu);
  numeric(`한계 차 ${n}/${i}/${mu} N`, r.net, net, net);
  exact(`승부·패자 한계 ${n}/${i}/${mu}`, [r.winner, r.limiter], [winner, limiter]);
}
// 연속 μ를 이용해 ±1 N 경계와 엄격한 최소 인원 정의를 분리한다.
for (const [net, winner] of [[-1.00001, 'dino'], [-1, 'tie'], [0, 'tie'], [1, 'tie'], [1.00001, 'kids']]) {
  const mu = (fm(400) + net) / (10 * 35 * g);
  exact(`비김 경계 net=${net}`, P.outcome(10, species[1], mu).winner, winner);
}
const almostWinMu = (fm(400) + 0.5) / (10 * 35 * g);
exact('엄격한 최소 인원·비김 띠', [P.minKidsToWin(species[1], almostWinMu), P.outcome(10, species[1], almostWinMu).winner], [10, 'tie']);
const setup = (n, i = 4, mu = 0.55) => ({ n, species: species[i], mu });
const obs = (run, n, i = 4, mu = 0.55) => ({ run, ...setup(n, i, mu) });
exact('Q1 통과/실패/인원 경계', [P.judgeQ1(setup(1, 0)), P.judgeQ1(setup(1, 1)), P.judgeQ1(setup(2, 0))], [true, false, false]);
exact('Q2 49/48/100/101', [49, 48, 100, 101].map(n => P.judgeQ2(setup(n, 3))), [true, false, true, false]);
exact('Q3 59/58/100/소수', [59, 58, 100, 59.5].map(n => P.judgeQ3(setup(n))), [true, false, true, false]);
exact('Q2·Q3 다른 바닥', [P.judgeQ2(setup(49, 3, 0.05)), P.judgeQ3(setup(59, 4, 0.05))], [false, false]);
const q4 = observations => P.judgeQ4({ observations });
exact('Q4 통과', q4([obs(1, 59), obs(2, 59, 4, 0.05)]), true);
exact('Q4 빈 상태/한쪽만', [P.judgeQ4({}), q4([obs(1, 59)])], [false, false]);
exact('Q4 인원·종·실행 불일치', [
  q4([obs(1, 59), obs(2, 60, 4, 0.05)]), q4([obs(1, 59), obs(2, 59, 3, 0.05)]),
  q4([obs(1, 59), obs(1, 59, 4, 0.05)]), q4([obs(0, 59), obs(2, 59, 4, 0.05)]),
], [false, false, false, false]);
exact('Q4 승리 인원 경계 58/59', [58, 59].map(n => q4([obs(1, n), obs(2, n, 4, 0.05)])), [false, true]);
const q5 = (before, after) => P.judgeQ5({ before, after });
exact('Q5 증가 9/10/11', [9, 10, 11].map(delta => q5(obs(1, 59, 4, 0.05), obs(2, 59 + delta, 4, 0.05))), [false, true, true]);
exact('Q5 빈 상태/중복 실행/다른 바닥', [P.judgeQ5({}), q5(obs(1, 59, 4, 0.05), obs(1, 69, 4, 0.05)), q5(obs(1, 59), obs(2, 69))], [false, false, false]);
exact('Q5 역순 실행/다른 종', [q5(obs(2, 59, 4, 0.05), obs(1, 69, 4, 0.05)), q5(obs(1, 59, 4, 0.05), obs(2, 69, 3, 0.05))], [false, false]);
exact('Q5 100/101 인원 경계', [100, 101].map(n => q5(obs(1, 90, 4, 0.05), obs(2, n, 4, 0.05))), [true, false]);
exact('Q6 통과/렌즈 닫힘/중복/빈 상태', [
  P.judgeQ6({ visited: [species[0], species[5]], compareOpen: true }),
  P.judgeQ6({ visited: [species[0], species[5]], compareOpen: false }),
  P.judgeQ6({ visited: [species[0], species[0]], compareOpen: true }), P.judgeQ6({}),
], [true, false, false, false]);
exact('Q7 정답/더 작음/더 큼/29/31', [P.judgeQ7(setup(30, 1)), P.judgeQ7(setup(30, 0)), P.judgeQ7(setup(30, 2)), P.judgeQ7(setup(29, 1)), P.judgeQ7(setup(31, 1))], [true, false, false, false, false]);
exact('Q7 다른 바닥', P.judgeQ7(setup(30, 1, 0.35)), false);
exact('RANGE', P.RANGE, { kids: [1, 100] });
exact('DETENTS 값', P.DETENTS.map(d => d.n), [1, 10, 20, 30, 49, 59, 68, 100]);
exact('레일 100칸 중심·왕복', Array.from({ length: 100 }, (_, i) => i + 1).every(n => Math.abs(P.railX(n) - (n - 0.5) / 100) < 1e-12 && P.kidsFromRailX(P.railX(n)) === n), true);
exact('레일 양끝·밖 클램프', [-1, 0, 1, 2].map(P.kidsFromRailX), [1, 1, 100, 100]);
exact('레일 정확한 내부 경계 99개', Array.from({ length: 99 }, (_, i) => i + 1).every(i => P.kidsFromRailX(i / 100) === i + 1), true);
row('모든 정수 판정 칸 폭', '0.01 ≥ 0.009', '0.01', Array.from({ length: 100 }, (_, i) => [i / 100 + 1e-10, (i + 1) / 100 - 1e-10].every(x => P.kidsFromRailX(x) === i + 1)).every(Boolean));
const gaps = P.DETENTS.slice(1).map((d, i) => d.x - P.DETENTS[i].x);
row('걸림 칸 최소 간격', '≥ 0.05', fmt(Math.min(...gaps)), gaps.every(x => x >= 0.05));
exact('힘 표시 0/10마디·압축', [P.forceVisual(0), P.forceVisual(10 * kidMuscle)].map(v => [v.beads, v.length, v.compressed]), [[0, 0, false], [10, 10, false]]);
numeric('힘 표시 20마디 길이 (추정)', P.forceVisual(20 * kidMuscle).length, 15.4930614433, 10 + 5 * Math.log(3));
exact('힘 표시 압축 연속·단조', P.forceVisual(10 * kidMuscle + 1e-7).compressed && Math.abs(P.forceVisual(10 * kidMuscle + 1e-7).length - 10) < 1e-8 && [20, 100, 250].every(b => P.forceVisual(b * kidMuscle).length > P.forceVisual((b - 1) * kidMuscle).length), true);
const threshold = 0.05 * 35 * g;
exact('미끄러짐 빈 상태/도달/넘음/계속/복귀', [P.slipOnset(null, 20, 35, 0.05), P.slipOnset(0, threshold, 35, 0.05), P.slipOnset(threshold, threshold + 0.01, 35, 0.05), P.slipOnset(20, 21, 35, 0.05), P.slipOnset(20, 0, 35, 0.05)], [null, false, true, false, false]);
// 모든 종·바닥·정수 인원의 반환값을 독립식과 대조한다.
exact('전 상태 2400개 독립 계산', species.every((s, i) => [0.05, 0.35, 0.55, 0.8].every(mu => Array.from({ length: 100 }, (_, j) => j + 1).every(n => {
  const actual = P.outcome(n, s, mu), a = kids(n, mu), b = dino(masses[i], mu), net = a - b;
  const loserKid = a <= b, muscle = loserKid ? kidMuscle : fm(masses[i]);
  const friction = ff(loserKid ? 35 : masses[i], mu);
  return Math.abs(actual.kids - a) < 1e-8 && Math.abs(actual.dino - b) < 1e-8
    && Math.abs(actual.net - net) < 1e-8 && actual.winner === (Math.abs(net) <= 1 ? 'tie' : net > 0 ? 'kids' : 'dino')
    && actual.limiter === (friction <= muscle ? 'friction' : 'muscle');
}))), true);
console.log(`\n총 ${count}개: 통과 ${count - failures}, 실패 ${failures}`);
process.exitCode = failures ? 1 : 0;

// R1: pure display mapping checks, including all species/ground/count extremes.
exact('R1 rail world endpoints', [P.railWorldX(0),P.railWorldX(1)].map(v=>Number(v.toFixed(8))), [-2.7,-0.5]);
exact('R1 graph log endpoints', [P.massGraphX(species[0]),P.massGraphX(species[5])], [0,1]);
exact('R1 peg count and footprint', Array.from({length:100},(_,i)=>P.pegPosition(i)).every(p=>p.x>=-2.68&&p.x<=-.8&&p.z>=-.43&&p.z<=.336),true);
exact('R1 capacity maximum', Math.abs(P.forceSceneLength(P.muscle(70000))-P.SCENE.barWidth)<1e-12,true);
exact('R1 capacity monotonic', Array.from({length:100},(_,i)=>i+1).every(n=>P.forceSceneLength(P.kidCap(n,.55))>P.forceSceneLength(P.kidCap(n-1,.55))),true);
exact('R1 schematic models inside maximum box',species.every((s,i)=>{
 const d=P.displayState(1,s,.55),[length,height,leg,neck,head,tail]=d.form;
 const top=P.SCENE.top+.135+d.scale*(leg+height/2+neck+.20);
 const right=1.36+d.scale*(length*.45+tail+.10);
 return top<=P.SCENE.max[1]&&right<=P.SCENE.max[0];
}),true);
exact('R1 every boundary display finite and bounded',species.every(s=>[.05,.35,.55,.8].every(mu=>[1,100].every(n=>[0,Math.PI,2*Math.PI].every(t=>{
 const d=P.displayState(n,s,mu,t);return Number.isFinite(d.kidsLength)&&Number.isFinite(d.dinoLength)&&d.kidsLength>=0&&d.dinoLength<=P.SCENE.barWidth&&Math.abs(d.flagX)<=P.SCENE.flagTravel&&d.winner===P.outcome(n,s,mu).winner;
})))),true);
console.log('R1-inclusive total '+count+': passed '+(count-failures)+', failed '+failures);
process.exitCode=failures?1:0;

// R2 independent schematic formulas, relative tolerance 1e-6.
for(const [i,s]of species.entries()){
 const expected=.38+.64*Math.cbrt(masses[i]/70000);
 numeric('R2 mass cube-root scale '+i,P.modelScale(s),expected,expected,1e-6);
}
for(const n of [1,30,31,66,67,100]){
 const rows=n<=30?1:n<=66?2:3,cols=Math.ceil(n/rows);
 exact('R2 team rows/columns '+n,[P.teamLayout(n,n-1).rows,P.teamLayout(n,n-1).columns],[rows,cols]);
 exact('R2 unique visible children '+n,new Set(Array.from({length:n},(_,i)=>{const p=P.teamLayout(n,i);return p.x+':'+p.z;})).size,n);
 for(const i of [0,n-1]){
  const actual=P.teamLayout(n,i),x=-2.7+(i%cols)*2.25/Math.max(1,cols-1),z=-.48+Math.floor(i/cols)*.24;
  numeric('R2 team x '+n+'/'+i,actual.x,x,x,1e-6);
  row('R2 team z '+n+'/'+i,fmt(z),fmt(actual.z),Math.abs(actual.z-z)<=1e-6*Math.max(1,Math.abs(z)));
 }
}
for(const f of [0,kidMuscle,20*kidMuscle,100*kidMuscle,70000*.8*9.81]){
 const b=f/kidMuscle,v=b<=10?b:10+5*Math.log1p((b-10)/5),maximum=10+5*Math.log1p((fm(70000)/kidMuscle-10)/5);
 const expected=2.35*Math.min(v,maximum)/maximum,a=P.forceGlyph(f);
 row('R2 glyph length '+f,fmt(expected),fmt(a.length),Math.abs(a.length-expected)<=1e-6*Math.max(1,Math.abs(expected)));
 exact('R2 glyph count '+f,a.count,Math.min(30,Math.floor(b)));
 exact('R2 glyph cut '+f,a.compressed,b>10||b>30);
}
exact('R2 all 2400 glyphs bounded',species.every(s=>[.05,.35,.55,.8].every(mu=>Array.from({length:100},(_,i)=>P.grammarState(i+1,s,mu)).every(d=>d.forces.every(f=>f.length>=0&&f.length<=2.35&&f.count<=30)&&d.ratioLength>=0&&d.ratioLength<=.58))),true);
exact('R2 equal-time flag samples',P.grammarState(59,species[4],.55,1).traces.every((x,i)=>Math.abs(x-(-.4*(.5-.5*Math.cos(1-i*.16))))<1e-12),true);
console.log('R2-inclusive total '+count+': passed '+(count-failures)+', failed '+failures);
process.exitCode=failures?1:0;

exact('R2 tick positions independent compression', [1,20,100].every(b=>P.forceGlyph(b*kidMuscle).ticks.every((x,i)=>{
 const v=i+1<=10?i+1:10+5*Math.log1p((i+1-10)/5),maximum=10+5*Math.log1p((fm(70000)/kidMuscle-10)/5);
 return Math.abs(x-2.35*v/maximum)<=1e-6*Math.max(1,Math.abs(x));
})),true);
exact('R2 model silhouettes bounded',species.every((s,i)=>{
 const scale=.38+.64*Math.cbrt(masses[i]/70000),[length,height,leg,neck,head,tail]=P.SCENE.forms[i];
 return 1.36+scale*(length*.45+tail+.14)<=3.25&&1.235+scale*(leg+height/2+neck+.32)<=3.65;
}),true);
// Independent pinhole projection, no browser/THREE import or fake DOM dimensions.
function projectBox(width,height,azDeg,elDeg,distance,fov,top,bottom){
 const az=azDeg*Math.PI/180,el=elDeg*Math.PI/180,tan=Math.tan(fov*Math.PI/360),center=[0,1.8425,.25];
 const direction=[Math.sin(az)*Math.cos(el),Math.sin(el),Math.cos(az)*Math.cos(el)];
 const right=[Math.cos(az),0,-Math.sin(az)],up=[-Math.sin(az)*Math.sin(el),Math.cos(el),-Math.cos(az)*Math.sin(el)];
 const dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0),points=[];
 for(const x of [-3.25,3.25])for(const y of [.035,3.65])for(const z of [-.8,1.3]){
  const q=[x,y,z].map((v,i)=>v-center[i]),depth=distance-dot(q,direction);
  points.push([(1+dot(q,right)/depth/tan/(width/height))*width/2,(1-dot(q,up)/depth/tan)*height/2]);
 }
 const l=Math.min(...points.map(p=>p[0])),r=Math.max(...points.map(p=>p[0])),t=Math.min(...points.map(p=>p[1])),b=Math.max(...points.map(p=>p[1]));
 const shift=(top+bottom-t-b)/2;
 return {coverage:(r-l)/width,bounds:[l,t+shift,r,b+shift],fits:l>=0&&r<=width&&t+shift>=top&&b+shift<=bottom};
}
for(const args of [[1440,900,18,15,10.6,34,85,736],[375,812,65,25,22.2,38,139,656]]){
 const result=projectBox(...args);
 exact('R2 pinhole fit '+args[0],result.fits&&result.coverage>=.6,true);
 console.log('Pinhole '+args[0]+'x'+args[1]+': '+JSON.stringify(result));
}
console.log('Final total '+count+': passed '+(count-failures)+', failed '+failures);
process.exitCode=failures?1:0;

exact('R4 exhibition enlargement is presentation only',species.every(s=>P.exhibitionScale(s)>P.modelScale(s)),true);
exact('R4 current-species frame bounds finite',species.every(s=>{
 const b=P.exhibitionBounds(s);return b.min.every(Number.isFinite)&&b.max.every(Number.isFinite)&&b.max.every((v,i)=>v>b.min[i]);
}),true);
exact('R4 largest specimen gets taller frame than small specimen',P.exhibitionBounds(species.at(-1)).max[1]>P.exhibitionBounds(species[0]).max[1],true);
console.log('R4-inclusive total '+count+': passed '+(count-failures)+', failed '+failures);
process.exitCode=failures?1:0;

// R5: presentation contracts; the scientific mappings above remain unchanged.
exact('R5 presentation mapping available', typeof P.dramaState, 'function');
if (P.dramaState) {
 const d=P.dramaState(59,species[4],.55,Math.PI), max=P.dramaState(100,species[5],.8,Math.PI);
 exact('R5 representative result unchanged',d.winner,P.outcome(59,species[4],.55).winner);
 exact('R5 child height at least twice R2',P.DRAMA.kidHeight>=2*P.VIS.kidHeight,true);
 exact('R5 giant taller than stacked child rows',max.height>P.DRAMA.kidHeight*3,true);
 for(const n of [1,30,31,59,66,67,100]){
  const team=Array.from({length:n},(_,i)=>P.dramaChild(n,i));
  exact('R5 distinct non-overlapping children '+n,new Set(team.map(p=>p.x+':'+p.z)).size===n&&team.every(p=>p.rows<=3)&&team.every((p,i)=>team.every((q,j)=>i===j||Math.hypot(p.x-q.x,p.z-q.z)>=.105)),true);
 }
 exact('R5 finite continuously varying lean',Math.abs(P.dramaState(59,species[4],.55,0).lean-P.dramaState(60,species[4],.55,0).lean)<.01,true);
 exact('R5 friction event follows actual limiter',P.dramaState(59,species[4],.05,Math.PI).slip&&!d.slip,true);
 exact('R5 flag steps bounded',Array.from({length:101},(_,i)=>P.dramaState(59,species[4],.55,i*Math.PI/100).flagX).every(x=>Math.abs(x)<=P.DRAMA.flagTravel),true);
}
console.log('R5-inclusive total '+count+': passed '+(count-failures)+', failed '+failures);
process.exitCode=failures?1:0;

// Independent pinhole calculation from returned camera vectors, without THREE or DOM.
function projectDrama(bounds,frame,width,height){
 const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0);
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const normal=a=>{const l=Math.hypot(...a);return a.map(v=>v/l);};
 const forward=normal(sub(frame.target,frame.pos)),right=normal(cross(forward,[0,1,0])),up=cross(right,forward),focal=height/2/Math.tan(frame.fov*Math.PI/360),points=[];
 for(const x of [bounds.min[0],bounds.max[0]])for(const y of [bounds.min[1],bounds.max[1]])for(const z of [bounds.min[2],bounds.max[2]]){
  const q=sub([x,y,z],frame.pos),depth=dot(q,forward);
  points.push([width/2+focal*dot(q,right)/depth+frame.offsetX,height/2-focal*dot(q,up)/depth+frame.offset,depth]);
 }
 const b=[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))];
 return {width:(b[2]-b[0])/width,height:(b[3]-b[1])/height,bounds:b,clipped:points.some(p=>p[2]<=0)||b[0]<0||b[1]<0||b[2]>width||b[3]>height};
}
const dramaViewports=[
 [1440,900,'hero',{left:12,right:1428,top:88,bottom:748}],
 [375,812,'hero',{left:12,right:363,top:88,bottom:660}],
 [1440,900,'predict',{left:12,right:1428,top:88,bottom:660}],
 [375,812,'predict',{left:12,right:363,top:88,bottom:580}],
 [1440,900,'card',{left:12,right:1428,top:88,bottom:630}],
 [375,812,'card',{left:12,right:363,top:88,bottom:550}],
 [1440,900,'teacher',{left:12,right:1100,top:108,bottom:888}],
 [375,812,'teacher',{left:12,right:363,top:108,bottom:704}],
 [375,812,'teacher-class',{left:12,right:363,top:108,bottom:596}],
 [375,812,'teacher-numbers',{left:12,right:363,top:170,bottom:704}],
 [375,812,'teacher-both',{left:12,right:363,top:170,bottom:596}],
 [1440,900,'event',{left:12,right:1428,top:122,bottom:888},-.4],
 [375,812,'event',{left:12,right:363,top:94,bottom:800},-.4],
 [1200,750,'thumb',{left:24,right:1176,top:45,bottom:705}]
];
for(const [w,h,label,region,eventX]of dramaViewports){
 for(const sp of species){
  const frame=P.dramaFrame(w,h,sp,region,eventX??null),projected=frame&&projectDrama(P.dramaBounds(sp),frame,w,h),b=projected?.bounds;
  exact('R5 independent safe projection '+w+'/'+label+'/'+species.indexOf(sp),!!frame&&!projected.clipped&&b[0]>=region.left-1e-6&&b[1]>=region.top-1e-6&&b[2]<=region.right+1e-6&&b[3]<=region.bottom+1e-6,true);
  if(sp===species[4]){
   console.log('R5 pinhole '+w+'x'+h+' '+label+': '+JSON.stringify({...projected,azimuth:frame.azimuth,elevation:frame.elevation,distance:frame.distance}));
   if(['hero','predict','card','teacher','teacher-class','teacher-numbers','thumb'].includes(label))exact('R5 representative coverage '+w+'/'+label,projected.width>=.70&&projected.height>=.55,true);
  }
 }
}
// A close shot really approaches the apparatus rather than only changing its HUD.
for(const [w,h,region]of [[1440,900,{left:12,right:1428,top:88,bottom:748}],[375,812,{left:12,right:363,top:88,bottom:660}]]){
 const normal=P.dramaFrame(w,h,species[4],region),event=P.dramaFrame(w,h,species[4],{left:12,right:w-12,top:w===375?94:122,bottom:h-12},-.4);
 exact('R5 event dolly approaches '+w,event.distance<normal.distance&&event.width>normal.width,true);
}
console.log('R5 projection-inclusive total '+count+': passed '+(count-failures)+', failed '+failures);
process.exitCode=failures?1:0;
