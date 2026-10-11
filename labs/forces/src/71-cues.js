// ==== 14 말 없는 장면 문법 (쉬운 모드·자세히 모드 공통) ====
// 글을 읽지 못해도 기구를 만지고 장면만 보면 원리가 읽히도록 장면 속에 그리는 표현들.
// 원칙과 근거: docs/experiment-depiction.md 5장.
//  ① 힘 마디: 힘 화살표에 0.5 N마다 눈금 (40-hero.js 셰이더) → 마디 수 = 힘의 크기, 추 1개 ≈ 1마디
//  ② 한계 윤곽: 바닥이 붙잡을 수 있는 최대 힘을 점선 화살표로. 붙잡는 힘(실선)이 차오르다 넘치면 미끄러진다
//  ③ 직전 값 윤곽: 조건을 바꾸면 바꾸기 전 힘이 점선으로 남아 커졌는지 작아졌는지 겹쳐 비교
//  ④ 상쇄 표시: 힘이 걸려 있는데 도막이 그대로면 →← (서로 지웠다)
//  ⑤ 시간 기록 점: 같은 시간 간격(0.1 s)마다 도막 앞 모서리 아래에 점을 찍는다 (시간기록계 종이테이프)
//     오른쪽으로 갈 때는 앞줄, 왼쪽으로 갈 때는 뒷줄에 찍어 오간 기록이 섞이지 않는다
//     → 점 사이가 넓어지면 빨라짐, 좁아지면 느려짐, 같으면 일정한 빠르기
//  ⑦ 부력 채움: 물속에서는 용수철 힘(초록) 끝에 부력(파랑)을 이어 붙인다 → 둘을 합친 길이 = 물 밖에서의 길이(점선)
//  ⑥ 늘어남 계단: 추 개수마다 용수철 끝 위치를 눈금 + 추 점으로 남긴다 → 간격이 같으면 비례
const CUE = { h: { cur: null, prev: null }, t: { cur: null, prev: null }, cap: 0, flash: 0, ghosts: [], gT: 0, lastX: null, stairs: [], mode: '' };
const CUE_EPS = 0.04;   // 이보다 작은 차이는 같은 힘으로 본다 (N)
const CUE_GAP = 0.1;    // 점 간격 (물리 시간 s)
const CUE_LIFE = 6;     // 점 수명 (s)

function buildCues() {
  const A = (k, st) => makeArrow(FCOL[k], st);
  OVL.cue = { hW: A('W', 1), hT: A('T', 1), tW: A('W', 1), tN: A('N', 1), cap: A('f', 1), c1: A('net', 0), c2: A('net', 0), hB: A('B', 0) };
  OVL.cue.hB.mat.uniforms.uGain.value = 1.2;
  for (const k of ['c1', 'c2', 'hB']) OVL.cue[k].mat.uniforms.uUnit.value = 0;
  // ⑤ 시간 기록 점
  const dg = new THREE.CircleGeometry(0.007, 16).rotateX(-Math.PI / 2);
  for (let i = 0; i < 70; i++) {
    const m = new THREE.Mesh(dg, new THREE.MeshBasicMaterial({ color: new THREE.Color(FCOL.net).multiplyScalar(1.5), transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
    m.visible = false; m.renderOrder = 2; scene.add(m); CUE.ghosts.push({ m, age: 99 });
  }
  // ⑥ 계단: n = 0..nMax 눈금 막대 + 추 점 n개
  const col = new THREE.Color(FCOL.T).multiplyScalar(1.6);
  const barM = new THREE.MeshBasicMaterial({ color: col, toneMapped: false }), dotM = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd7a8).multiplyScalar(1.3), toneMapped: false });
  const barG = new THREE.BoxGeometry(0.046, 0.003, 0.002), dotG = new THREE.SphereGeometry(0.0052, 12, 8);
  for (let n = 0; n <= PC.nMax; n++) {
    const g = new THREE.Group(); g.visible = false;
    const bar = new THREE.Mesh(barG, n ? barM : new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); bar.position.x = -0.08; g.add(bar);
    for (let i = 0; i < n; i++) { const p = new THREE.Mesh(dotG, dotM); p.position.set(-0.112 - i * 0.0128, 0, 0); g.add(p); }
    g.position.set(HS.x, 0, HS.z); scene.add(g); CUE.stairs.push(g);
  }
}
// 퀘스트·단계·기구를 바꿀 때: 이전 실험의 직전 값·잔상을 지운다
function cueReset() {
  CUE.h.cur = CUE.h.prev = CUE.t.cur = CUE.t.prev = null; CUE.lastX = null;
  for (const q of CUE.ghosts) { q.age = 99; q.m.visible = false; }
}
// 직전 값: 안정된 상태를 기억해 두고, 지금 값이 달라지면 '바꾸기 전' 값을 돌려준다
function cueTrackState(slot, snap, stable) {
  const c = CUE[slot], diff = (a, b) => Object.keys(a).some((k) => Math.abs(a[k] - b[k]) > CUE_EPS);
  if (stable) { if (!c.cur) c.cur = snap; else if (diff(snap, c.cur)) { c.prev = c.cur; c.cur = snap; } }
  return (k, live) => {
    const base = c.cur && Math.abs(live - c.cur[k]) > CUE_EPS ? c.cur : c.prev;   // 바뀌는 중이면 마지막 안정값, 바뀐 뒤면 그 전 값
    return base && Math.abs(live - base[k]) > CUE_EPS ? base[k] : 0;
  };
}

function updateCues(r, xv, F, P, dt) {
  const C = OVL.cue, show = S.overlays.F, tt = performance.now() / 1000;
  for (const k in C) C[k].mat.uniforms.uTime.value = tt;
  // ③ 매달기: 무게·용수철 힘의 직전 값
  const hb = cueTrackState('h', { W: r.W, T: S.Tlive }, S.settle > 0.5 && !r.empty);
  setArrow(C.hW, OVL.h.W.o, DOWN, hb('W', r.W), show && !r.empty);
  setArrow(C.hT, OVL.h.T.o, UP, hb('T', S.Tlive), show && !r.empty && !r.floating);
  // ⑦ 부력 채움
  setArrow(C.hB, OVL.h.T.on ? OVL.h.T.tip : OVL.h.T.o, UP, r.B, show && r.inFluid && !r.floating && r.B > 0.03);
  // ③ 끌기: 무게·받치는 힘의 직전 값 (짐·중력을 바꿀 때)
  const still = S.trk.v === 0;
  const tb = cueTrackState('t', { W: F.W, N: F.N }, still);
  setArrow(C.tW, OVL.t.W.o, DOWN, tb('W', F.W), show);
  setArrow(C.tN, OVL.t.N.o, UP, tb('N', F.N), show);
  // ② 한계 윤곽: 붙잡는 힘이 채울 수 있는 최대
  if (CUE.mode !== 'slide' && F.mode === 'slide') CUE.flash = 1;
  CUE.mode = F.mode; CUE.flash = Math.max(0, CUE.flash - dt * 1.6);
  CUE.cap += (F.fsMax - CUE.cap) * (1 - Math.exp(-dt * 6));
  const pulling = Math.abs(F.Fa) > 0.01 || S.trk.v !== 0, fd = F.f !== 0 ? Math.sign(F.f) : -Math.sign(F.Fa || 1);
  C.cap.mat.uniforms.uGain.value = 1.1 + CUE.flash * 2.4;
  setArrow(C.cap, OVL.t.f.o, fd > 0 ? RIGHT : LEFT, CUE.cap, show && pulling && F.mode !== 'bump');
  // ④ 상쇄: 힘이 걸려 있는데 알짜힘 0, 정지
  const cancel = show && still && Math.abs(F.net) < 1e-3 && F.mode !== 'bump' && (Math.abs(F.Fa) > 0.05 || (!P.same && P.F1 > 0.05 && P.F2 > 0.05));
  const bx = blockX(S.trk.x), cy = OVL.t.net.o.y, L = 0.028 / PC.arrow;
  setArrow(C.c1, _o.set(bx - 0.044, cy, TRK.z), RIGHT, L, cancel);
  setArrow(C.c2, _o.set(bx + 0.044, cy, TRK.z), LEFT, L, cancel);
  // ⑤ 시간 기록 점
  const x = S.trk.x;
  if (CUE.lastX != null && Math.abs(x - CUE.lastX) > 0.06) for (const q of CUE.ghosts) q.age = 99;   // 제자리로 돌아감
  CUE.lastX = x;
  if (Math.abs(S.trk.v) > 0.01) {
    CUE.gT += dt;
    if (CUE.gT >= CUE_GAP) {
      CUE.gT = 0;
      const q = CUE.ghosts.reduce((a, b) => (b.age > a.age ? b : a));
      q.age = 0; q.m.position.set(bx, TRK_Y + 0.0012, TRK.z + Math.sign(S.trk.v) * (PC.block.d / 2 + 0.014));   // 오른쪽으로 갈 때 앞줄, 왼쪽은 뒷줄
    }
  } else CUE.gT = CUE_GAP;   // 출발하는 순간 바로 한 장
  for (const q of CUE.ghosts) {
    q.age += dt; const a = q.age < CUE_LIFE ? 1 - q.age / CUE_LIFE : 0;
    q.m.visible = a > 0; q.m.material.opacity = Math.min(1, a * 1.6);
  }
  // ⑥ 늘어남 계단 (지금 중력에서 잰 추 개수만)
  const on = r.obj === 'weights' && !r.inFluid, got = new Set();
  if (on) for (const q of S.rec.hooke) if (Math.abs(q.g - S.g.cur) < 0.05) got.add(q.n);
  CUE.stairs.forEach((g, n) => {
    const q = S.rec.hooke.find((e) => e.n === n && Math.abs(e.g - S.g.cur) < 0.05);
    g.visible = on && got.size > 0 && (n === 0 || !!q);
    if (g.visible) g.position.y = TOP + PC.hang.hookY0 - (q ? q.x : 0);
  });
}
