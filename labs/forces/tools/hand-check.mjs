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

// Independent hand values: g*0.001*0.06 = 0.000588 N m per g-tick.
for (const [name, left, right, ml, mr, angle, level, heavier] of [
  ['30@2 = 20@3', {obj:'c',pos:2}, {obj:'b',pos:3},60,60,0,true,null],
  ['50@1 = 10@5', {obj:'e',pos:1}, {obj:'a',pos:5},50,50,0,true,null],
  ['20@5 = 20@5', {obj:'b',pos:5}, {obj:'b',pos:5},100,100,0,true,null],
  ['right stop', {obj:'a',pos:5}, {obj:'e',pos:5},50,250,0.3490658503988659,false,'R'],
  ['30 vs 27 clips', {obj:'c',pos:5}, {clips:27,pos:5},150,135,-0.2559794726480946,false,'L'],
  ['30 vs 30 clips', {obj:'c',pos:5}, {clips:30,pos:5},150,150,0,true,null],
  ['clip cap', {}, {clips:99,pos:5},0,300,0.3490658503988659,false,'R'],
]) {
  const r = PHYS.balance({left,right,g:9.8});
  check('balance '+name+' L',r.momentL,ml,1e-12,'g-tick');
  check('balance '+name+' R',r.momentR,mr,1e-12,'g-tick');
  check('balance '+name+' tau',r.tau,(mr-ml)*0.000588,1e-12,'Nm');
  check('balance '+name+' angle',r.thetaTarget,angle,1e-12,'rad');
  check('balance '+name+' verdict',+(r.level===level && r.heavier===heavier),1,0,'');
}
{
  const initial={theta:0,omega:0}; let st=initial, peak=0;
  for(let i=0;i<600;i++){st=PHYS.beamStep(st,0.1,1/60);peak=Math.max(peak,st.theta);}
  check('beam settled angle',st.theta,0.1,0,'rad');
  check('beam settled omega',st.omega,0,0,'rad/s');
  // Analytic damped step overshoot exp(-pi*.35/sqrt(1-.35^2)) = 30.92%.
  check('beam overshoot',peak,0.130919,0.001,'rad');
  check('beam pure',+(initial.theta===0 && initial.omega===0),1,0,'');
  const large=PHYS.beamStep(initial,0.1,10);
  check('beam large dt',large.theta,0.1,0,'rad');
}
{
  const input={left:{obj:'a',clips:-9,pos:0},right:{clips:61,pos:9},g:9.8};
  const before=JSON.stringify(input), r=PHYS.balance(input);
  check('balance lower bounds',r.momentL,10,0,'g-tick');
  check('balance upper bounds',r.momentR,300,0,'g-tick');
  check('balance input pure',+(JSON.stringify(input)===before),1,0,'');
  const tolerance=PHYS.balance({left:{},right:{clips:1,pos:1},g:4.9});
  check('balance inclusive tolerance',+tolerance.level,1,0,'');
  check('balance zero gravity',+PHYS.balance({...input,g:0}).level,1,0,'');
  const stopped=PHYS.beamStep({theta:0,omega:0},0.3490658503988659,10);
  check('beam positive stop',stopped.theta,0.3490658503988659,0,'rad');
  const negative=PHYS.beamStep({theta:0,omega:0},-0.3490658503988659,10);
  check('beam negative stop',negative.theta,-0.3490658503988659,0,'rad');
}
// Quest boundaries use the actual shared predicate and actual mission data, without a browser.
{
  const kidSource=fs.readFileSync(new URL('../src/65-kid.js',import.meta.url),'utf8');
  const balanceSource=fs.readFileSync(new URL('../src/45-balance.js',import.meta.url),'utf8');
  const first=kidSource.lastIndexOf('    {',kidSource.indexOf("id: 'cmp'"));
  const last=kidSource.lastIndexOf('    {',kidSource.indexOf("id: 'weights'"));
  const data=kidSource.slice(first,last);
  const predicate=balanceSource.slice(balanceSource.indexOf('function kidBalanceCheck()'),balanceSource.indexOf('const balanceSVG'));
  const S={balance:{},beam:{}},DRAG={kind:null};
  const missions=new Function('PHYS','S','DRAG','balanceParams',`function kidBalanceEnter() {} ${predicate}; return [${data}];`)(PHYS,S,DRAG,()=>({...S.balance,g:9.8}));
  const pose=(left,right)=>{S.balance={left:PHYS.balanceSide(left),right:PHYS.balanceSide(right)};S.beam={theta:PHYS.balance({...S.balance}).thetaTarget,omega:0};};
  for(const m of missions){
    pose(m.setup.left,m.setup.right);check(m.id+' initial incomplete',+m.check(),0,0,'');
    const goals={cmp:[{obj:'a'},{obj:'e'}],clip:[{obj:'c'},{clips:30}],lever:[{obj:'b',pos:5},{obj:'e',pos:2}]};
    pose(...goals[m.id]);check(m.id+' goal complete',+m.check(),1,0,'');
    S.beam.omega=.01;check(m.id+' moving incomplete',+m.check(),0,0,'');
    pose(...goals[m.id]);DRAG.kind='balance';check(m.id+' dragging incomplete',+m.check(),0,0,'');DRAG.kind=null;
  }
  pose({obj:'b',pos:5},{obj:'e',pos:5});check('lever outer incomplete',+missions[2].check(),0,0,'');
  pose({obj:'c'},{clips:29});check('clip 29 incomplete',+missions[1].check(),0,0,'');
  pose({obj:'c'},{obj:'b',clips:10});check('clip object substitute incomplete',+missions[1].check(),0,0,'');
}
const w = Math.max(...rows.map((r) => r.name.length));
for (const r of rows) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.name.padEnd(w)}  모델 ${String(r.model).padStart(9)}  손계산 ${String(r.hand).padStart(9)} ${r.unit}`);
const bad = rows.filter((r) => !r.ok).length;
console.log(bad ? `\n${bad}개 불일치` : `\n${rows.length}개 모두 일치`);
process.exit(bad ? 1 : 0);
