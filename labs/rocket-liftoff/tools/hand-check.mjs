// node tools/hand-check.mjs
process.env.TEMP=process.env.TMP='D:/CodexWork/Temp';
import fs from 'node:fs';

let total = 0, failed = 0;
const fmt = v => typeof v === 'number' ? String(Number(v.toPrecision(10)))
  : JSON.stringify(v, (_, x) => typeof x === 'number' && !Number.isFinite(x) ? String(x) : x);
console.log('| 항목 | 기대 | 실제 | 판정 |\n|---|---|---|---|');
function row(name, expected, actual, ok) {
  total++; if (!ok) failed++;
  console.log(`| ${name} | ${expected} | ${fmt(actual)} | ${ok ? '통과' : '실패'} |`);
}
const exact = (name, actual, expected) => row(name, fmt(expected), actual, fmt(actual) === fmt(expected));
const near = (a, b, tol = 0.005) => Number.isFinite(a) && Math.abs(a - b) <= tol * Math.abs(b);
function numeric(name, actual, spec, hand, tol = 0.005) {
  row(name, `${fmt(spec)} / 손 ${fmt(hand)}`, actual, near(actual, spec, tol) && near(actual, hand, tol));
}
function finish() {
  console.log(`총 ${total}개: 통과 ${total - failed}, 실패 ${failed}`);
  process.exitCode = failed ? 1 : 0;
}
let P;
try {
  const source = fs.readFileSync('src/15-physics.js', 'utf8');
  const body = source.match(/\/\/ ==== 1 PHYSICS ====([\s\S]*?)\/\/ ==== END PHYSICS ====/);
  if (!body) throw new Error('PHYS 마커 없음');
  P = new Function(body[1] + '\nreturn PHYS;')();
} catch (e) {
  row('마커 로드', 'PHYS', e.message, false); finish();
}
if (P) {
  // 독립 손계산: PHYS.C 및 PHYS 함수로 기대값을 만들지 않는다.
  const dry = 970000, fuel = 2000000, engine = 6900000, ve = 2580, g = 9.81;
  const mass = dry + fuel, flow = n => n * engine / ve;
  const burn = n => fuel / flow(n);
  const lift = n => n * engine <= dry * g ? Infinity : Math.max(0, (mass - n * engine / g) / flow(n));
  const handFlight = (n, t) => {
    const L = lift(n), u = Math.max(0, Math.min(t, burn(n)) - L);
    if (!Number.isFinite(L) || t <= L) return { h: 0, v: 0 };
    const ml = mass - flow(n) * L, m = ml - flow(n) * u;
    const log = Math.log(ml / m), v = ve * log - g * u;
    const h = ve * (u - m / flow(n) * log) - g * u * u / 2;
    const coast = Math.max(0, t - burn(n));
    return { h: h + v * coast - g * coast ** 2 / 2, v: v - g * coast };
  };
  numeric('기본 m0 kg', P.m0(0), 2970000, mass);
  const ratios = [0.2368, 0.4736, 0.7105, 0.9473, 1.1841];
  for (let n = 1; n <= 5; n++) numeric(`지구 T0W n=${n}`, P.T0W(n, 0, g), ratios[n - 1], n * engine / (mass * g), 0.001);
  for (const [n, value] of [[2, 292.3], [3, 107.2], [4, 14.63]]) numeric(`이륙 n=${n} s`, P.liftoffTime(n, 0, g), value, lift(n));
  exact('이륙 n=1/5', [P.liftoffTime(1, 0, g), P.liftoffTime(5, 0, g)], [Infinity, 0]);
  exact('최소 엔진 지구/달/두 짐', [P.enginesNeeded(0, g), P.enginesNeeded(0, 1.62), P.enginesNeeded(200000, g), P.enginesNeeded(500000, g)], [5, 1, 5, 5]);
  numeric('달 T0W n=1', P.T0W(1, 0, 1.62), 1.434, engine / (mass * 1.62));
  for (const [load, r] of [[200000, 1.1094], [500000, 1.0134]]) numeric(`짐 ${load} T0W`, P.T0W(5, load, g), r, 5 * engine / ((mass + load) * g), 0.001);
  numeric('추력 n=5 N', P.thrust(5), 34500000, 5 * engine);
  for (const [n, t] of [[1, 747.8], [2, 373.9], [5, 149.6]]) numeric(`소진 n=${n} s`, P.burnTime(n), t, burn(n));
  const dv = ve * Math.log(mass / dry), end = P.simulate(5, 0, g, burn(5));
  const last = end.v.length - 1;
  numeric('소진 이상 Δv m/s', end.v[last] + g * burn(5), 2890, dv);
  numeric('소진 순속도 m/s', end.v[last], 1423, dv - g * burn(5), 0.01);
  for (const [n, t] of [[5, 10], [4, 30], [3, 150], [2, 350], [5, 200]]) {
    const s = P.simulate(n, 0, g, t), h = handFlight(n, t), i = s.t.length - 1;
    numeric(`적분 n=${n} t=${t} h m`, s.h[i], h.h, h.h);
    numeric(`적분 n=${n} t=${t} v m/s`, s.v[i], h.v, h.v);
  }
  const no = P.simulate(1, 0, g, 800);
  exact('못 뜸 전 구간 정지·사건', [no.h.every(h => h === 0), no.v.every(v => v === 0), no.events.map(e => e.type)], [true, true, ['burnout']]);
  const delayed = P.simulate(4, 0, g, 30);
  numeric('격자 밖 이륙 사건 s', delayed.events.find(e => e.type === 'liftoff').t, 14.63, lift(4));
  exact('이륙 전 지지·상쇄', [P.stateAt(4, 0, g, 0).a, P.stateAt(4, 0, g, 0).normal], [0, mass * g - 4 * engine]);
  const eqG = engine / mass;
  exact('T=W 초기/직후', [P.stateAt(1, 0, eqG, 0).onPad, P.stateAt(1, 0, eqG, 0.01).onPad, P.stateAt(1, 0, eqG, 0).a], [true, false, 0]);
  exact('소진=문턱이면 못 뜸', P.liftoffTime(1, 0, engine / dry), Infinity);
  exact('소진 경계 추력·가속도·질량', [P.stateAt(5, 0, g, burn(5)).T, P.stateAt(5, 0, g, burn(5)).a, end.m[last]], [0, -g, dry]);
  const landed = P.simulate(5, 0, g, 1000, 1);
  exact('착지 사건·관통 방지', [landed.events.map(e => e.type), landed.h.at(-1), landed.v.at(-1), landed.a.at(-1)], [['liftoff', 'burnout', 'landing'], 0, 0, 0]);
  exact('빈 데이터', [P.simulate(5, 0, g, null).t, P.simulate(5, 0, g, NaN).events], [[], []]);
  exact('t=0 초기 표본', P.simulate(5, 0, g, 0).t, [0]);
  exact('고정 격자·끝점', P.simulate(5, 0, g, 0.025).t, [0, 0.01, 0.02, 0.025]);
  const again = P.simulate(5, 0, g, 0.025);
  row('반복 실행 독립', '같은 입력의 모든 반환값 일치', '반환값 전체 비교', fmt(again) === fmt(P.simulate(5, 0, g, 0.025)));
  const record = (n, load, gravity, t, runId = 1) => ({ n, load, g: gravity, t, runId });
  const q1 = { ...record(1, 0, g, burn(1)), ignited: true };
  exact('Q1 통과/실패/끝 직전', [P.judgeQ1(q1), P.judgeQ1({ ...q1, n: 2 }), P.judgeQ1({ ...q1, t: burn(1) - 0.01 })], [true, false, false]);
  const q2 = { ...record(5, 0, g, 0), ignited: true };
  exact('Q2 통과/4개/천체범위밖', [P.judgeQ2(q2), P.judgeQ2({ ...q2, n: 4 }), P.judgeQ2({ ...q2, n: 1, g: eqG })], [true, false, false]);
  const q3 = { ...record(5, 0, g, 10), ignited: true, accelerationSeen: true };
  exact('Q3 통과/미열람/t=0/소진', [P.judgeQ3(q3), P.judgeQ3({ ...q3, accelerationSeen: false }), P.judgeQ3({ ...q3, t: 0 }), P.judgeQ3({ ...q3, t: burn(5) })], [true, false, false, false]);
  const q4 = { before: record(5, 200000, g, 0), after: record(5, 500000, g, 0, 2), comparisonSeen: true };
  exact('Q4 통과/같은 짐/같은 실행/역순/미열람', [P.judgeQ4(q4), P.judgeQ4({ ...q4, after: record(5, 200000, g, 0, 2) }), P.judgeQ4({ ...q4, after: record(5, 500000, g, 0) }), P.judgeQ4({ ...q4, before: { ...q4.before, runId: 3 } }), P.judgeQ4({ ...q4, comparisonSeen: false })], [true, false, false, false, false]);
  const q5 = { ...record(1, 0, 1.62, 0), ignited: true };
  exact('Q5 통과/지구/미점화', [P.judgeQ5(q5), P.judgeQ5({ ...q5, g }), P.judgeQ5({ ...q5, ignited: false })], [true, false, false]);
  const q6 = { ...record(5, 500000, g, 0), ignited: true };
  exact('Q6 통과/4개/6개/달', [P.judgeQ6(q6), P.judgeQ6({ ...q6, n: 4 }), P.judgeQ6({ ...q6, n: 6 }), P.judgeQ6({ ...q6, g: 1.62 })], [true, false, false, false]);
  exact('판정 빈값·실행번호 경계', [P.judgeQ1({}), P.judgeQ2({ ...q2, runId: 0 }), P.judgeQ3({ ...q3, t: NaN }), P.judgeQ4({}), P.judgeQ5({ ...q5, runId: 1.5 }), P.judgeQ6({ ...q6, load: 0 })], [false, false, false, false, false, false]);
  let nullJudges;
  try { nullJudges = [1, 2, 3, 4, 5, 6].map(n => P[`judgeQ${n}`](null)); }
  catch (e) { nullJudges = e.name; }
  exact('모든 판정 null 기록', nullJudges, [false, false, false, false, false, false]);
  exact('힘 같은 초기 최소 엔진', P.enginesNeeded(0, eqG), 2);
  exact('레일 왕복·걸림', [1, 2, 3, 4, 5].map(n => P.enginesFromRailX(P.engineRailX(n))), [1, 2, 3, 4, 5]);
  const dx = Math.min(...P.DETENTS.engines.slice(1).map((d, i) => d.x - P.DETENTS.engines[i].x));
  numeric('엔진 최소 걸림 간격', dx, 0.25, 1 / 4);
  const widths = P.DETENTS.engines.map(d => P.engineRailX(Math.min(5, d.value + 0.5)) - P.engineRailX(Math.max(1, d.value - 0.5)));
  row('판정 칸 폭·걸림 간격', '폭 ≥0.009, 간격 ≥0.05', [Math.min(...widths), dx], Math.min(...widths) >= 0.009 && dx >= 0.05);
  exact('짐·천체 칸', [P.DETENTS.load.map(d => d.value), P.DETENTS.g.map(d => d.value)], [[0, 200000, 500000], [9.81, 1.62]]);
  exact('압축 높이 0/1000/음수', [0, 1000, -10].map(P.heightVis), [0, 1, 0]);
  numeric('불꽃 총합 추력 비례', P.flameVis(P.thrust(5)), 5, 5 * engine / engine);
  exact('자료 없는 실행/잘못된 dt', [P.simulate(6, 0, g, 1).t, P.simulate(5, 0, g, 1, 0).t], [[], []]);
  // R1 display mappings: physical flight must remain unchanged and bounded on the model.
  exact('R1 mapping API', ['sceneLift','sceneValues','sceneSelection','SCENE'].every(k => k in P), true);
  if (P.sceneLift) {
    exact('R1 altitude origin', P.sceneLift(0), 0);
    row('R1 bounded monotone altitude', '0 < low < high < 0.9', [P.sceneLift(1000), P.sceneLift(1e12)],
      P.sceneLift(1000) > 0 && P.sceneLift(1000) < P.sceneLift(1e12) && P.sceneLift(1e12) < 0.9);
    exact('R1 unlit thrust fuel support', (() => { const s = P.sceneValues(1,0,9.81,0,false); return [s.T,s.fuel,s.lift,s.normal]; })(), [0,1,0,29135700]);
    exact('R1 burnout flame fuel lift', (() => { const s = P.sceneValues(1,0,9.81,P.burnTime(1),true); return [s.flame,s.fuel,s.lift]; })(), [0,0,0]);
    exact('R1 unlit five engines stay supported', (()=>{const v=P.sceneValues(5,0,9.81,0,false);return [v.a,v.onPad,v.T];})(), [0,true,0]);
    exact('R1 selection detents', [P.sceneSelection(0,0,0),P.sceneSelection(1,1,1)], [{n:1,load:0,g:9.81},{n:5,load:500000,g:1.62}]);
    let bounded = true;
    for (const n of [1,2,3,4,5]) for (const load of [0,200000,500000]) for (const gravity of [9.81,1.62]) {
      const landing = P.stateAt(n,load,gravity,0).landingT;
      const burnout=P.stateAt(n,load,gravity,P.burnTime(n));
      const apex=P.burnTime(n)+burnout.v/gravity;
      for (const t of [0,P.burnTime(n),...(Number.isFinite(landing) ? [apex,landing] : [])]) {
        const v=P.sceneValues(n,load,gravity,t,true);
        bounded &&= v.lift >= 0 && v.lift < .9 && v.fuel >= 0 && v.fuel <= 1 && v.flame <= 1;
      }
    }
    exact('R1 all combinations and event boundaries', bounded, true);
  }
  exact('R1 graph and dial mappings API', ['graphTimeRailX','graphFaceX','dialRailAfterTurn'].every(k=>k in P), true);
  if(P.graphTimeRailX){
    exact('R1 plotted zero and end align with scrub', [P.graphTimeRailX(50/768),P.graphTimeRailX(718/768)], [0,1]);
    exact('R1 plot rail roundtrip', [0,.25,.5,.75,1].map(x=>P.graphTimeRailX(P.graphFaceX(x))), [0,.25,.5,.75,1]);
    let turn=0;for(let i=0;i<9;i++)turn=P.dialRailAfterTurn(turn,Math.PI/6);
    row('R1 full 270 degree drag reaches max', '1 within 1e-12', turn, Math.abs(turn-1)<1e-12);
  }
  // R2 independent formulas: explicit display estimates, relative tolerance 1e-6.
  const strict=(name,actual,expected)=>numeric(name,actual,expected,expected,1e-6);
  strict('R2 force one cell',P.forceGlyph(6900000).length,.16);
  strict('R2 force fractional cells',P.forceGlyph(29135700).shown,29135700/6900000);
  exact('R2 force ceiling and break',[P.forceGlyph(1e12).cells,P.forceGlyph(1e12).overflow],[6,true]);
  exact('R2 force zero',[P.forceGlyph(-1).length,P.forceGlyph(0).cells],[0,0]);
  for(const n of [1,4,5])for(const load of [0,500000])for(const gravity of [9.81,1.62]){
    const t=10,mm=970000+2000000+load-n*6900000/2580*t,ww=mm*gravity,tt=n*6900000;
    const r=P.grammarValues(n,load,gravity,t,true),label=`R2 ${n}/${load}/${gravity}`;
    strict(label+' weight',r.weightGlyph.length,Math.min(6,ww/6900000)*.16);
    strict(label+' thrust',r.thrustGlyph.length,n*.16);
    strict(label+' fuel',r.fuel,(mm-970000-load)/2000000);
    strict(label+' plume',r.plumeLength,.30);
    strict(label+' brightness',r.brightness,n/5);
    strict(label+' Earth/Moon',r.earthWeight.units/r.moonWeight.units,9.81/1.62);
  }
  const dots=P.motionDots(5,0,9.81,40,true),origin=handFlight(5,0).h;
  exact('R2 dots fixed seconds',dots.map(d=>d.t),[0,5,10,15,20,25,30,35,40]);
  dots.slice(1).forEach(d=>{
    const h=handFlight(5,d.t).h;
    strict('R2 linear dot '+d.t,d.linear,Math.min(.76,(h-origin)*.00012));
    const z=Math.log(1+h/1000)/Math.log(2);
    strict('R2 altitude dot '+d.t,d.altitude,.5*z/(1+z));
  });
  exact('R2 unobserved points',[P.motionDots(5,0,9.81,50,false),P.grammarCurve(5,0,9.81,50,false)],[[],[]]);
  exact('R2 supported dots coincide',P.motionDots(1,0,9.81,40,true).every(d=>d.h===0&&d.linear===0),true);
  exact('R2 bounded window',P.motionDots(1,0,1.62,740,true).length,9);
  exact('R2 overflow honest',P.motionDots(1,0,1.62,740,true).some(d=>d.overflow),true);
  const refHorizon=1000,curve=P.grammarCurve(5,0,9.81,10,true,refHorizon);
  strict('R2 common time coordinate',curve.at(-1).x,10/1000*.76);
  strict('R2 curve velocity',curve.at(-1).v,handFlight(5,10).v*.00012);
  exact('R2 discontinuity marker',P.grammarCurve(5,0,9.81,150,true).filter(p=>p.break).length,1);
  let safe=true;
  for(const n of [1,5])for(const load of [0,500000])for(const gravity of [1.62,9.81]){
    const tb=2000000*2580/(n*6900000),b=P.stateAt(n,load,gravity,tb);
    for(const time of [0,10,tb,tb+b.v/gravity,Number.isFinite(b.landingT)?b.landingT:tb]){
      const r=P.grammarValues(n,load,gravity,time,true);
      safe &&= r.displayLift>=0&&r.displayLift<.5&&1.18+r.displayLift+(.62+.26+.055)*1.45<3.12;
      for(const f of ['thrustGlyph','weightGlyph','supportGlyph','surplus'])safe&&=r[f].length<=.96;
      safe&&=P.motionDots(n,load,gravity,time,true).every(d=>Math.abs(d.linear)<=.76);
    }
  }
  exact('R2 extreme geometry enclosure',safe,true);
  strict('R2 flame nozzle sum',P.grammarValues(5,0,9.81,0,true).plumeLength*5,.30*5);
  exact('R2 burnout display',(()=>{const r=P.grammarValues(5,0,9.81,2000000*2580/(5*6900000),true);return [r.fuel,r.brightness,r.plumeLength];})(),[0,0,0]);
  strict('R2 pure tangent slope',(()=>{const p={x:.4,v:.05,a:.2},[a,b]=P.grammarTangent(p);return (b[1]-a[1])/(b[0]-a[0]);})(),.2);
  strict('R2 tangent cap',(()=>{const [a,b]=P.grammarTangent({x:.4,v:0,a:100});return (b[1]-a[1])/(b[0]-a[0]);})(),1.8);
  strict('R2 support independent',P.grammarValues(1,0,9.81,10,true).supportGlyph.length,
    ((2970000-6900000/2580*10)*9.81-6900000)/6900000*.16);
  strict('R2 residual independent',P.grammarValues(5,0,9.81,10,true).surplus.length,
    (34500000-(2970000-34500000/2580*10)*9.81)/6900000*.16);
  // R5 presentation-only checks: no model/judge expectations above are changed.
  {
  exact('R5 compression zero', [P.cardLift(0),P.cardMargin(0)], [0,0]);
  exact('R5 compression monotone bounded', [0,1,10,100,1e6].every((h,i,a)=>
    P.cardLift(h)<86&&P.cardMargin(h)<42&&(!i||P.cardLift(h)>P.cardLift(a[i-1]))),true);
  const q1=[{key:'fast',n:1,trace:'fast'},{key:'slow',n:1,trace:'slow'},{key:'pad',n:1}];
  exact('R5 Q1 all phases distinct heights',Array.from({length:37},(_,i)=>.75+i/144).every(p=>{
    const [a,b,c]=q1.map(c=>P.cardPrediction(1,c,p));
    return a.lift-b.lift>25&&b.lift-c.lift>40&&c.fuel===0&&c.T===0;
  }),true);
  for(const id of [2,6]){
    const values=[3,4,5].map(n=>P.cardPrediction(id,{n,load:id===6?500000:0,trace:n<5?'instant':undefined}));
    exact(`R5 Q${id} countable force units`,values.map(v=>P.forceGlyph(v.T).shown),[3,4,5]);
    exact(`R5 Q${id} common weight`,values.every(v=>v.W===(2970000+(id===6?500000:0))*9.81),true);
    exact(`R5 Q${id} only fifth surplus`,values.map(v=>v.margin>0),[false,false,true]);
  }
  const q4=[{n:5,load:500000,extra:true},{n:5,load:500000},{n:5,load:500000,trace:'pad'}].map(c=>P.cardPrediction(4,c));
  exact('R5 Q4 added nozzle / same / pad',q4.map(v=>v.nozzles),[6,5,5]);
  exact('R5 Q4 residual vs baseline visible',q4[0].margin-q4[1].margin>15&&q4[1].baselineMargin-q4[1].margin>8&&q4[2].lift===0,true);
  exact('R5 Q5 five / one / pad',[
    P.cardPrediction(5,{n:5,g:1.62}).nozzles,P.cardPrediction(5,{n:1,g:1.62}).nozzles,
    P.cardPrediction(5,{n:1,g:1.62,trace:'pad'}).lift],[5,1,0]);
  for(const trace of ['equal','growing','shrinking']){
    const positions=P.cardMotion(trace),gaps=positions.slice(1).map((v,i)=>v-positions[i]);
    exact(`R5 Q3 ${trace} interval pattern`,gaps.every((v,i)=>!i||(trace==='equal'?Math.abs(v-gaps[i-1])<1e-12:trace==='growing'?v>gaps[i-1]:v<gaps[i-1])),true);
  }
  const cards=new Function('PHYS',fs.readFileSync('src/66-cards.js','utf8')+';return CARDS;')(P);
  const candidates=[q1,[3,4,5].map(n=>({n,trace:n<5?'instant':undefined})),
    ['equal','growing','shrinking'].map(trace=>({n:5,trace})),
    [{n:5,load:500000,extra:true},{n:5,load:500000},{n:5,load:500000,trace:'pad'}],
    [{n:5,g:1.62},{n:1,g:1.62},{n:1,g:1.62,trace:'pad'}],
    [3,4,5].map(n=>({n,load:500000,trace:n<5?'instant':undefined}))];
  exact('R5 SVG unique safe every animation phase',candidates.every((cs,i)=>Array.from({length:37},(_,j)=>j/12).every(t=>{
    const pictures=cs.map(c=>cards.picture(i+1,c,t));
    return new Set(pictures).size===3&&pictures.every(s=>!/(NaN|Infinity|undefined|<text\b|<img\b)/.test(s)&&s.includes('preserveAspectRatio="none"'));
  })),true);
  // Exercise the final renderer, which overrides the earlier room renderer.
  const hero=fs.readFileSync('src/40-hero.js','utf8'),render=hero.slice(hero.indexOf('drawGraphs=function'));
  const makeContext=()=>({strokes:[],arcs:[],dash:[],beginPath(){this.points=[];},
    moveTo(x,y){this.points.push([x,y]);},lineTo(x,y){this.points.push([x,y]);},
    setLineDash(v){this.dash=v;},stroke(){this.strokes.push({points:[...this.points],dash:this.dash,alpha:this.globalAlpha});},
    arc(x,y,r){this.arcs.push([x,y,r]);},fill(){},fillRect(){}});
  let graphsOK=true;
  for(const cs of candidates)for(const c of cs){
    const n=c.n??1,load=c.load??0,g=c.g??9.81;
    for(const ignited of [false,true])for(const t of [0,12,P.burnTime(n),P.grammarHorizon(n,load,g)]){
      const S={t:{value:t},ignited:{target:+ignited},graphKeys:[]},screens=[0,1].map(()=>({ctx:makeContext(),tex:{}}));
      const draw=new Function('PHYS','S','selection','GRAPHS','THEME','css',
        'let drawGraphs;'+render+';return drawGraphs;')(P,S,()=>({n,load,g}),screens,{ceramic:1},x=>String(x));
      draw();
      const {left:L,right:R,top:U,bottom:B}=P.SCENE.graph,x=L+(ignited?t/P.grammarHorizon(n,load,g):0)*(R-L);
      graphsOK&&=screens.every(({ctx,tex},i)=>tex.needsUpdate&&ctx.arcs.filter(a=>a[2]===6).length===(i?1:3)
        &&ctx.strokes.some(s=>s.dash.length===2&&s.points.length>100)
        &&ctx.strokes.some(s=>s.dash.length===0&&s.points.length===2&&Math.abs(s.points[0][0]-x)<1e-8&&s.points[0][1]===U&&s.points[1][1]===B)
        &&ctx.arcs.every(a=>a.every(Number.isFinite)));
    }
  }
  exact('R5 both console curves + current dots + cursor without quest layer',graphsOK,true);
  }
  const missionSource=fs.readFileSync('src/67-mission.js','utf8');
  const mission=new Function(missionSource+';return missionText;')();
  const phases=['intro','predict','act','observe','confirm','card','free'];
  for(let i=0;i<6;i++){
    const texts=[];
    for(const phase of phases)for(const correct of [true,false])for(const n of [1,5])for(const load of [200000,500000])for(const before of [null,{}])for(const ignited of [false,true]){
      texts.push(mission(i,phase,{correct,n,load,before,ignited}));
    }
    row(`미션 Q${i+1} 모든 단계·조작·예상 결과`,'빈 문구 0, 최대 32자',
      {empty:texts.filter(t=>!t?.trim()).length,max:Math.max(...texts.map(t=>[...t].length))},
      texts.every(t=>t.trim()&&[...t].length<=32));
  }
  exact('미션 엔진 목표 달성 후 다음 행동',mission(1,'act',{n:5,ignited:false}),'▶를 눌러 바로 뜨는지 살펴보세요');
  exact('미션 짐 기록 후 다음 행동',mission(3,'act',{before:{},load:200000}),'아래 큰 상자 버튼을 눌러 짐을 늘려요');
  exact('미션 짐 증가 후 다음 행동',mission(3,'act',{before:{},load:500000}),'▶를 눌러 큰 짐을 싣고 날려 보세요');
  finish();
}
