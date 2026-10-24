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

// Mission reservation: conservative CSS assumptions, not measured browser geometry.
// 78px quest bottom + 8px gap + 38px desktop / 60px mobile pill + 12px scene gap.
for(const [w,h,top,bottom]of [[1440,900,136,630],[375,812,158,550],[1440,900,242,888],[375,812,236,800]]){
 for(const sp of species){
  const region={left:12,right:w-12,top,bottom},frame=P.dramaFrame(w,h,sp,region),view=frame&&projectDrama(P.dramaBounds(sp),frame,w,h),b=view?.bounds;
  exact('mission reserved safe projection '+w+'/'+top+'/'+species.indexOf(sp),!!frame&&!view.clipped&&b[1]>=top-1e-6&&b[3]<=bottom+1e-6,true);
 }
}
console.log('Mission-inclusive total '+count+': passed '+(count-failures)+', failed '+failures);
process.exitCode=failures?1:0;

// U1: 아이 팀끼리의 결과와 장력을 독립 손계산으로 대조한다.
for (const [nA, nB, mu, winner, limiter] of [
  [5, 5, .55, 'tie', 'muscle'], [6, 5, .55, 'a', 'muscle'], [5, 6, .55, 'b', 'muscle'],
  [5, 5, .05, 'tie', 'friction'], [6, 5, .05, 'a', 'friction'],
]) {
  const r = P.kidsMatch?.(nA, nB, mu) ?? {}, a = kids(nA, mu), b = kids(nB, mu);
  const label = `U1 ${nA} 대 ${nB} μ=${mu}`;
  numeric(label + ' A팀 N', r.a, a, a, 1e-12);
  numeric(label + ' B팀 N', r.b, b, b, 1e-12);
  if (nA === nB) exact(label + ' 차 N', r.net, 0);
  else numeric(label + ' 차 N', r.net, (nA - nB) * kids(1, mu), a - b, 1e-12);
  exact(label + ' 승자', r.winner, winner);
  exact(label + ' 한계', r.limiter, limiter);
  numeric(label + ' 장력 N', r.tension, kids(Math.min(nA, nB), mu), Math.min(a, b), 1e-12);
}
const matchCounts = Array.from({ length: 100 }, (_, i) => i + 1);
for (const mu of [.05, .35, .55, .8]) {
  exact(`U1 같은 인원 100종 정확한 비김 μ=${mu}`, matchCounts.every(n => {
    const r = P.kidsMatch?.(n, n, mu);
    return r?.winner === 'tie' && r.net === 0;
  }), true);
  exact(`U1 모든 인원 조합 대칭 μ=${mu}`, matchCounts.every(nA => matchCounts.every(nB => {
    const a = P.kidsMatch?.(nA, nB, mu), b = P.kidsMatch?.(nB, nA, mu);
    return !!a && !!b && a.net === -b.net && b.winner === ({ a: 'b', b: 'a', tie: 'tie' })[a.winner];
  })), true);
  exact(`U1 모든 인원 조합 장력 μ=${mu}`, matchCounts.every(nA => matchCounts.every(nB => {
    const r = P.kidsMatch?.(nA, nB, mu);
    return !!r && r.tension === Math.min(r.a, r.b) && r.tension > 0
      && r.tension <= r.a && r.tension <= r.b;
  })), true);
}
for (const [a, b] of [[686.7, 686.7], [824.04, 686.7], [686.7, 824.04]]) {
  numeric(`U1 줄 장력 ${a}/${b}`, P.ropeTension?.(a, b), Math.min(a, b), Math.min(a, b), 1e-12);
}
for (const nA of [1, 100]) for (const nB of [1, 100]) {
  exact(`U1 유효 인원 경계 ${nA}/${nB}`, [.05, .35, .55, .8].every(mu => P.validMatch?.({ nA, nB, mu }) === true), true);
}
for (const n of [0, 101, 1.5, NaN, '5']) {
  exact(`U1 잘못된 A 인원 ${String(n)}`, P.validMatch?.({ nA: n, nB: 5, mu: .55 }), false);
  exact(`U1 잘못된 B 인원 ${String(n)}`, P.validMatch?.({ nA: 5, nB: n, mu: .55 }), false);
}
exact('U1 잘못된 바닥 μ', P.validMatch?.({ nA: 5, nB: 5, mu: .5 }), false);
// 핵심 계산은 연속 μ도 믿고 계산한다. 1 N 비김 띠의 양 끝을 검사한다.
for (const [net, winner] of [[-1.00001, 'b'], [-1, 'tie'], [0, 'tie'], [1, 'tie'], [1.00001, 'a']]) {
  exact(`U1 비김 경계 net=${net}`, P.kidsMatch?.(net < 0 ? 1 : 2, net < 0 ? 2 : 1, Math.abs(net) / (35 * g))?.winner, winner);
}
exact('U1 마찰과 근육이 같으면 마찰 한계', P.kidsMatch?.(5, 5, kidMuscle / (35 * g))?.limiter, 'friction');
// U4a: exhaustively preserve every dinosaur outcome field.
for (const n of [1,5,49,100]) for (const species of Object.keys(P.SPECIES)) for (const mu of Object.values(P.GROUNDS)) {
  exact(`U4a legacy outcome ${n}/${species}/${mu}`, P.matchOutcome?.(n,species,0,mu), P.outcome(n,species,mu));
  for (const fn of ['displayState','dramaState','grammarState'])
    exact(`U4a default ${fn} ${n}/${species}/${mu}`, P[fn](n,species,mu,Math.PI), P[fn](n,species,mu,Math.PI,0));
}
for (const [a,b,mu,winner] of [[5,5,.55,'tie'],[6,5,.55,'kids'],[5,6,.55,'dino'],[5,5,.05,'tie']]) {
  const d=P.matchOutcome?.(a,species[5],b,mu);
  exact(`U4a winner ${a}/${b}/${mu}`, d?.winner, winner);
  exact(`U4a capacities ${a}/${b}/${mu}`, d&&[d.kids,d.dino], [kids(a,mu),kids(b,mu)]);
}
for (const mu of Object.values(P.GROUNDS)) for (const fn of ['displayState','dramaState','grammarState']) {
  const d=P[fn](5,species[5],mu,Math.PI,5);
  exact(`U4a tie flag ${fn}/${mu}`, d.flagX, 0);
  exact(`U4a equal lengths ${fn}/${mu}`, d.kidsLength,d.dinoLength);
  exact(`U4a species irrelevant ${fn}/${mu}`, d,P[fn](5,species[0],mu,Math.PI,5));
}
for (const mu of Object.values(P.GROUNDS)) {
  const d=P.grammarState(6,species[5],mu,Math.PI,5);
  exact(`U4a right limits ${mu}`, d.forces.slice(4),[P.forceGlyph(5*kidMuscle),P.forceGlyph(ff(5*35,mu))]);
}
// U4b: requirements define the expected truth values independently of the judges.
const observed=(n,rivalN,run=1)=>({run,n,rivalN,species:species[0],mu:.55});
for(const [n,rivalN,want] of [[5,5,true],[1,1,true],[30,30,true],[5,6,false],[5,0,false]])
 exact(`U4b Q8 ${n}/${rivalN}`,P.judgeQ8({observations:[observed(n,rivalN)]}),want);
for(const [n,rivalN,want] of [[6,5,true],[5,6,true],[5,5,false],[7,5,false],[6,0,false]])
 exact(`U4b Q9 ${n}/${rivalN}`,P.judgeQ9({observations:[observed(n,rivalN)]}),want);
for(const id of [8,9]){
 exact(`U4b Q${id} empty`,P[`judgeQ${id}`]({}),false);
 const good=observed(id===8?5:6,5),bad=observed(7,5,2);
 exact(`U4b Q${id} last completed wins`,P[`judgeQ${id}`]({observations:[good,bad]}),false);
 exact(`U4b Q${id} invalid trailing record ignored`,P[`judgeQ${id}`]({observations:[good,{...bad,rivalN:101}]}),true);
 exact(`U4b Q${id} legacy dinosaur record`,P[`judgeQ${id}`]({observations:[{run:1,n:5,species:species[0],mu:.55}]}),false);
}
for(const rivalN of [0,100,-1,101,1.5,null,undefined])
 exact(`U4b observation rival ${rivalN}`,P.validObservation(observed(5,rivalN)),rivalN===0||rivalN===100);
exact('U4b legacy observation accepted',P.validObservation({run:1,n:5,species:species[0],mu:.55}),true);
// U5a: tension is one team's limit, never the sum; both rival directions agree.
for(const [n,rivalN] of [[5,5],[6,5],[5,6]]){
 const result=P.matchOutcome(n,species[0],rivalN,.55),value=P.tensionOf(n,species[0],rivalN,.55);
 exact(`U5a tension ${n}/${rivalN} one team`,value,kids(5,.55));
 exact(`U5a tension ${n}/${rivalN} match limit`,value,n===rivalN?result.kids:Math.min(result.kids,result.dino));
 exact(`U5a tension ${n}/${rivalN} not sum`,value<result.kids+result.dino,true);
}
for(const name of [species[0],species[4]]){
 const result=P.matchOutcome(5,name,0,.55);
 exact(`U5a dinosaur tension ${name}`,P.tensionOf(5,name,0,.55),Math.min(result.kids,result.dino));
}
const q10Cases=[
 ['ordered',[observed(5,5),observed(6,5,2)],true],
 ['other team',[observed(5,5),observed(5,6,2)],true],
 ['reversed',[observed(6,5),observed(5,5,2)],false],
 ['tie only',[observed(5,5)],false],
 ['difference only',[observed(6,5)],false],
 ['dinosaurs',[observed(5,0),observed(6,0,2)],false],
 ['last not one apart',[observed(5,5),observed(6,5,2),observed(7,5,3)],false],
 ['invalid tie',[{...observed(5,5),mu:.5},observed(6,5,2)],false],
 ['invalid tail',[observed(5,5),observed(6,5,2),observed(7,101,3)],true],
 ['empty',[],false]
];
for(const [name,observations,want] of q10Cases)exact(`U5a Q10 ${name}`,P.judgeQ10({observations}),want);
exact('U5a Q10 missing observations',P.judgeQ10({}),false);
console.log('U5a-inclusive total '+count+': passed '+(count-failures)+', failed '+failures);
process.exitCode=failures?1:0;

const lensStart=count;
exact('U5b kinetic ratio',P.C.kineticRatio,.8);
for(const mu of [.55,.05])for(const [n,r]of [[6,5],[5,5],[5,6]]){
 const T=Math.min(kids(n,mu),kids(r,mu));
 for(const object of ['rope','A','B']){
  const f=P.lensForces(n,species[0],r,mu,object),tag=`U5b ${n}/${r} μ=${mu} ${object}`;
  const loser=object==='A'?n<r:object==='B'?r<n:false;
  exact(tag+' balanced',f.balanced,!loser);
  exact(tag+' directions',f.arrows.map(a=>a.dir),object==='A'?[1,-1]:[-1,1]);
  exact(tag+' kinds',f.arrows.map(a=>a.kind),object==='rope'?['pull','pull']:['pull','friction']);
  numeric(tag+' pull',f.arrows[0].value,T,T);
  numeric(tag+' opposite',f.arrows[1].value,loser?.8*T:T,loser?.8*T:T);
  row(tag+' signed sum',loser?(object==='A'?'.2T':'-.2T'):'0',fmt(f.sum),
   Math.abs(f.sum-(loser?(object==='A'?1:-1)*.2*T:0))<1e-10);
 }
}
const visits=['rope','A','B'];
for(const [name,observations,lensVisited,want]of [
 ['complete',[observed(6,5)],visits,true],
 ['reversed',[observed(5,6)],visits,true],
 ['missing rope',[observed(6,5)],['A','B'],false],
 ['missing A',[observed(6,5)],['rope','B'],false],
 ['missing B',[observed(6,5)],['rope','A'],false],
 ['empty',[],visits,false],
 ['tie',[observed(5,5)],visits,false],
 ['dinosaur',[observed(6,0)],visits,false],
 ['last tie',[observed(6,5),observed(5,5,2)],visits,false],
 ['invalid tail',[observed(6,5),{...observed(5,5,2),mu:.9}],visits,true]
])exact('U5b judge '+name,P.judgeQ11({observations,lensVisited}),want);
exact('U5b judge default',P.judgeQ11({}),false);
console.log('U5b new rows '+(count-lensStart)+'; total '+count+': passed '+(count-failures)+', failed '+failures);
process.exitCode=failures?1:0;

// U6: independent static friction expectations, including the strict threshold.
const pullStart=count;
exact('U6 staticPull API',typeof P.staticPull,'function');
if(P.staticPull){
 const limit=5*35*9.81*.05;
 for(const p of [0,.3,.6,1/1.5,.7,1]){
  const f=P.staticPull(5,.05,p),slipped=p>1/1.5;
  exact('U6 slip '+p,f.slipped,slipped);
  exact('U6 applied '+p,f.applied,p*1.5*limit);
  exact('U6 friction '+p,f.friction,slipped?.8*limit:f.applied);
  exact('U6 net '+p,f.net,f.applied-f.friction);
  exact('U6 threshold '+p,f.pSlip,1/1.5);
 }
 exact('U6 count scaling',P.staticPull(10,.05,.3).limit,2*limit);
 numeric('U6 ground scaling',P.staticPull(5,.55,.3).limit/limit,.55/.05,.55/.05,1e-12);
 let previous=0;
 for(let i=0;i<=100;i++){
  const f=P.staticPull(5,.05,i/100);
  exact('U6 monotonic/kinetic '+i,i/100<=1/1.5?f.friction>=previous:f.friction===.8*limit&&f.friction<limit,true);
  previous=f.friction;
 }
 for(const sawStatic of [false,true])for(const sawSlip of [false,true])exact('U6 judge '+sawStatic+'/'+sawSlip,P.judgeQ12({sawStatic,sawSlip}),sawStatic&&sawSlip);
}
console.log('U6 new rows '+(count-pullStart)+'; total '+count+': passed '+(count-failures)+', failed '+failures);
process.exitCode=failures?1:0;

// R2 visibility: snapshots recorded before this task, with the legacy default API.
const r2LegacyFrames=[[[11.999999999999979,40,8],[12.699999999999976,26,8],[12.999999999999975,20,8],[12.799999999999976,26,10],[13.699999999999973,8,8],[15.199999999999967,8,10]],[[11.999999999999979,20,12],[12.199999999999978,14,10],[12.399999999999977,8,8],[12.699999999999976,8,8],[15.599999999999966,8,8],[17.399999999999984,8,8]],[[14.39999999999997,14,10],[14.899999999999968,8,8],[16.29999999999997,8,8],[16.699999999999974,8,8],[20.60000000000003,8,8],[22.900000000000063,8,8]],[[18.800000000000004,78,28],[18.900000000000006,78,28],[22.400000000000055,72,32],[22.500000000000057,72,36],[22.60000000000006,72,28],[22.60000000000006,72,24]]];
const r2LegacyBounds=[{"min":[-4.65,0.8600000000000001,-1.16],"max":[4.95,3.65,1.3]},{"min":[-4.65,0.8600000000000001,-1.16],"max":[4.95,4.106777549144235,1.3]},{"min":[-4.65,0.8600000000000001,-1.16],"max":[4.95,4.465844669687624,1.3]},{"min":[-4.65,0.8600000000000001,-1.16],"max":[4.95,4.575313059083818,1.3]},{"min":[-4.65,0.8600000000000001,-1.16],"max":[4.95,5.566734226030764,1.3]},{"min":[-4.65,0.8600000000000001,-1.16],"max":[4.95,6.185,1.3]}];
// R2 independent scene/DOM stubs execute the production construction and layer functions.
const r2Start=count,r2Views=[[1440,900],[1280,720],[800,548],[375,812]];
const cameraSource=fs.readFileSync('src/50-lights-pipeline-camera.js','utf8');
const rectCode=cameraSource.slice(cameraSource.indexOf('function stageRect('),cameraSource.indexOf('// Retained for teacher'));
function r2Rect(w,h,css={},mode='student'){
 return new Function('S','T','innerWidth','innerHeight','document','getComputedStyle',rectCode+';return stageRect();')(
  {vertical:w/h<.9},{mode},w,h,{documentElement:{}},()=>({getPropertyValue:name=>css[name]??''}));
}
exact('R2 default landscape HUD',r2Rect(800,548),{left:12,right:788,top:130,bottom:358,stageOnly:true});
exact('R2 default portrait HUD',r2Rect(375,812),{left:12,right:363,top:150,bottom:552,stageOnly:true});
exact('R2 CSS HUD insets',r2Rect(800,548,{'--hud-top':'90px','--hud-bottom':'120px','--hud-right':'140px'}),{left:12,right:648,top:90,bottom:428,stageOnly:true});
exact('R2 CSS zero inset',r2Rect(800,548,{'--hud-top':'0px','--hud-bottom':'0px'}).top,0);
exact('R2 teacher frames the stage only',r2Rect(800,548,{},'teacher').stageOnly,true);
// Teacher mode: the stage fits whole inside the lane left by the side panel (340px) or the portrait drawer (46dvh).
for(const [w,h] of [[1440,900],[1280,720],[1024,768],[800,600],[375,812]]){
 const drawer=w<=600||w/h<=.9,panelRight=drawer?0:340+24,panelBottom=drawer?Math.round(h*.46)+16:12;
 const lane=r2Rect(w,h,{'--hud-top':'12px','--hud-right':panelRight+'px','--hud-bottom':panelBottom+'px'},'teacher');
 for(const [quest,index] of [[1,0],[3,4],[4,3]]){
  const frame=P.dramaFrame(w,h,species[index],lane),box=projectDrama(frame.stageBounds,frame,w,h);
  exact('R6 teacher quest '+quest+' whole stage inside panel-free lane '+w+'x'+h,box.bounds[0]>=lane.left-1&&box.bounds[2]<=lane.right+1&&box.bounds[1]>=lane.top-1&&box.bounds[3]<=lane.bottom+1&&!box.clipped,true);
  exact('R6 teacher quest '+quest+' not tiny '+w+'x'+h,box.width>=.25||box.height>=.25,true);
 }
}
for(const [i,s]of species.entries()){
 exact('R2 default bounds regression '+i,P.dramaBounds(s),r2LegacyBounds[i]);
 exact('R2 child bounds ignore dinosaur '+i,P.dramaBounds(s,5),P.dramaBounds(species[0],5));
 exact('R2 child ceiling '+i,P.dramaBounds(s,5).max[1]<=P.DRAMA.ground+P.DRAMA.kidHeight+1,true);
}
const roomSource=fs.readFileSync('src/30-room-console.js','utf8');
class R2Geometry{
 constructor(radius=1){this.radius=radius;this.type='Geometry';}
 rotateX(){return this;}setAttribute(){return this;}setIndex(){return this;}computeVertexNormals(){}
 computeBoundingSphere(){this.boundingSphere={radius:this.radius,center:{length:()=>0}};}
}
// Circumscribed origin spheres bound these primitives independently of tessellation.
const r2Pose=()=>({set(){},setScalar(){}});
const r2Three={
 Object3D:class{constructor(){this.position=r2Pose();this.rotation=r2Pose();this.scale=r2Pose();}updateMatrix(){}},
 MeshStandardMaterial:class{constructor(options){Object.assign(this,options);}},
 MeshBasicMaterial:class{constructor(options){Object.assign(this,options);}},
 InstancedMesh:class{constructor(g,m,n){this.material=m;this.count=n;this.instanceMatrix={count:n};this.rotation={};}setMatrixAt(){}},
 Shape:class{constructor(){this.holes=[];}moveTo(){}lineTo(){}closePath(){}},
 Path:class{moveTo(){}lineTo(){}closePath(){}},
 PlaneGeometry:R2Geometry,ShapeGeometry:R2Geometry,BufferGeometry:R2Geometry,Float32BufferAttribute:class{},
 IcosahedronGeometry:R2Geometry,CircleGeometry:R2Geometry,
 CylinderGeometry:class extends R2Geometry{constructor(a,b,h){super(Math.hypot(Math.max(a,b),h/2));}},
 ConeGeometry:class extends R2Geometry{constructor(r,h){super(Math.hypot(r,h/2));}},
 CatmullRomCurve3:class{},TubeGeometry:class extends R2Geometry{constructor(){super(2.7);}},DoubleSide:2
};
const r2Room={position:{},add(){},traverse(){}},r2Mat={bark:{},stone:{}},r2Kit={
 canvasTex(){return {};},mesh(){return {rotation:{},position:{}};}
};
const envCode=roomSource.slice(0,roomSource.indexOf('const ENVIRONMENT=buildEnvironment();'));
const r2Env=new Function('PHYS','BIOME','THREE','ROOM','MAT','KIT','mulberry32','V3',envCode+
 ';buildEnvironment();return {props:ENVIRONMENT_PROPS,targets:STAGE_SIGHT_TARGETS,sightTargets:stageSightTargets,hits:environmentOcclusions,allowed:environmentPropAllowed};')(
 P,{trail:['a','b','c']},r2Three,r2Room,r2Mat,r2Kit,seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},(...p)=>p);
exact('R2 rear forest retained',r2Env.props.length>100,true);
exact('R2 generated prop spheres stay behind stage',r2Env.props.every(r2Env.allowed),true);
exact('R2 occlusion detects crossing sphere',r2Env.hits([0,0,10],[[0,0,0]],[{center:[0,0,5],radius:1}]).length,1);
exact('R2 occlusion rejects sphere beyond endpoint',r2Env.hits([0,0,10],[[0,0,0]],[{center:[0,0,-5],radius:1}]).length,0);
exact('R2 occlusion detects tangent',r2Env.hits([0,0,10],[[0,0,0]],[{center:[1,0,5],radius:1}]).length,1);
function r2KidRatio(frame,w,h,x){
 const p=[x,P.DRAMA.ground,-.78],q=[x,P.DRAMA.ground+P.DRAMA.kidHeight,-.78];
 const line=projectDrama({min:p,max:q},frame,w,h);return line.height;
}
for(const [vi,[w,h]]of r2Views.entries()){
 const rect=r2Rect(w,h);
 for(const [si,s]of species.entries()){
  const a=P.dramaFrame(w,h,s,{left:12,right:w-12,top:130,bottom:h-190});
  exact('R2 legacy frame '+w+'/'+si,[a.distance,a.azimuth,a.elevation],r2LegacyFrames[vi][si]);
 }
 for(const [si,s]of [...species,'children'].entries()){
  const n=s==='children'?5:0,sp=n?species[5]:s,frame=P.dramaFrame(w,h,sp,rect,null,n);
  const b=frame&&projectDrama(frame.stageBounds,frame,w,h).bounds;
  exact('R2 stage inside HUD lane '+w+'/'+si,!!b&&b[0]>=rect.left-1e-6&&b[1]>=rect.top-1e-6&&b[2]<=rect.right+1e-6&&b[3]<=rect.bottom+1e-6,true);
  const event=P.dramaFrame(w,h,sp,rect,-.56,n);
  exact('R2 four sight lines clear '+w+'/'+si,[frame,event].every((f,j)=>r2Env.hits(f.pos,r2Env.sightTargets(sp,n,j?-.56:0,n?5:59),r2Env.props).length===0),true);
 }
 const child=P.dramaFrame(w,h,species[5],rect,null,5),dino=P.dramaFrame(w,h,species[5],rect);
 // 두 팀이 좌우로 마주 보여야 한다: 가로 화면은 정면 ±20°, 세로 화면은 52° 이하, 가장 작은 아이도 2% 이상.
 exact('R2 children face-on azimuth '+w,child.azimuth<=(w/h<.9?52:20),true);
 const minKid=Math.min(...[-4.38,-.4,.4,4.38].map(x=>r2KidRatio(child,w,h,x)));
 exact('R2 smallest child >=2% '+w,minKid>=.02,true);
 const old=P.dramaFrame(w,h,species[4],{left:12,right:w-12,top:w/h<.9?158:136,bottom:h-(w/h<.9?262:270)});
 const after=P.dramaFrame(w,h,species[4],rect);
 const beforeRatio=r2KidRatio(old,w,h,-2.4),afterRatio=r2KidRatio(after,w,h,-2.4);
 exact('R2 dinosaur quest child enlarged '+w,afterRatio>beforeRatio,true);
 console.log('R2 kid height '+w+'x'+h+': '+JSON.stringify({dinosaurBefore:beforeRatio,dinosaurAfter:afterRatio,childrenBefore:Math.min(...[-4.38,-.4,.4,4.38].map(x=>r2KidRatio(old,w,h,x))),childrenMin:minKid,childrenCenter:r2KidRatio(child,w,h,0)}));
}
const loopSource=fs.readFileSync('src/70-loop.js','utf8');
const layerCode=loopSource.slice(loopSource.indexOf('function layer('),loopSource.indexOf('async function capture('));
// Execute with lexical scene globals as the browser does; no invisible physical target survives.
const result=new Function('PHYS',`
const S={layers:{},drag:null},T={mode:'student'},controls={enabled:false};
const ROOM={},CONSOLE={},CAPACITIES={},TRACK={},RAIL_HANDLE={visible:true};
const HERO={children:[...Array.from({length:2+PHYS.DETENTS.length},()=>({visible:true})),RAIL_HANDLE]};
const dragObjects=[RAIL_HANDLE,{},{},{},{},{},{}];
${layerCode}
const result=[];
for(const [k,mode] of ['student','free','teacher','teacher','student'].entries()){T.mode=mode;S.drag={};if(k===3)layer('console',true);syncConsoleLayer();result.push([CONSOLE.visible,CAPACITIES.visible,HERO.children.every(o=>o.visible),dragObjects.length,S.drag===null]);}
return result;`)(P);
for(const [i,mode]of ['student','free','teacher (console off by default)','teacher (console chip on)','student-again'].entries())exact('R2 console visibility/pick targets '+mode,result[i],i===3?[true,false,true,7,false]:[false,false,false,0,true]);
console.log('R2 visibility new rows '+(count-r2Start)+'; total '+count+': passed '+(count-failures)+', failed '+failures);
process.exitCode=failures?1:0;
