// ==== 14 STATE / LOOP ====
const S = {
  g: { cur: 9.8, tgt: 9.8 }, n: { cur: 3, tgt: 3 }, jack: { cur: 0.03, tgt: 0.03 },
  F1: { cur: 0, tgt: 0 }, F2: { cur: 0, tgt: 0 }, load: { cur: 0, tgt: 0 },
  obj: 'weights', fluid: 'water', surface: 'glass', same: false,
  balance: { left: PHYS.balanceSide(), right: PHYS.balanceSide() }, beam: { theta: 0, omega: 0 },
  station: 'hang', preset: -1, playing: true, speed: 1,
  overlays: { F: true, L: true, K: false }, graph: 'hooke', view: 'lab', sound: false,
  trk: { x: PC.track.x0, v: 0 }, dist: 0, tTrk: 0, vtAcc: 0, hv: { x: 0, v: 0 }, settle: 0,
  hang: null, F: null, Tlive: 0, lastSign: 0,
  rec: { hooke: [], buoy: [], fric: [], vt: [] }, newRec: null,
  seen: { acc: false, dec: false, rev: false }, mode: 'kid',
};
const PRESETS = [
  { station: 'track', F1: 2, F2: 2, same: false, surface: 'glass', load: 0, g: 9.8 },
  { station: 'track', F1: 0, F2: 3, same: false, surface: 'sand', load: 2, g: 9.8 },
  { station: 'hang', obj: 'weights', n: 3, g: 1.6, jack: 0.03 },
  { station: 'hang', obj: 'al', fluid: 'water', g: 9.8, jack: 'full' },
];
const hangParams = (jack = S.jack.cur) => ({ obj: S.obj, n: S.n.tgt, fluid: S.fluid, jack, g: S.g.tgt });
const trackParams = () => ({ F1: S.F1.tgt, F2: S.F2.tgt, same: S.same, surface: S.surface, load: S.load.tgt, g: S.g.tgt });
const DEC = { g: 1, n: 0, jack: 3, F1: 2, F2: 2, load: 0 };

function setParam(name, v, fromPreset = false) {
  let [lo, hi] = PHYS.RANGE[name];
  if (name === 'jack') hi = PHYS.jackMax(hangParams(S.jack.tgt));
  let nv = clamp(v, lo, hi);
  nv = DEC[name] === 0 ? Math.round(nv) : +nv.toFixed(DEC[name] + (name === 'F1' || name === 'F2' ? 0 : 0));
  if (name === 'F1' || name === 'F2') nv = Math.round(nv * 20) / 20;
  if (nv === S[name].tgt) return;
  S[name].tgt = nv;
  if (name === 'g' || name === 'n' || name === 'jack') S.settle = 0;
  if (!fromPreset) S.preset = -1;
  if (name === 'n' || name === 'g') clampJack();
  UI.$ && UI.syncControls();
  if (!fromPreset) { S._tick = (S._tick || 0) + 1; if (S._tick % 3 === 0) sfx('tick'); }
}
function clampJack() { const jm = PHYS.jackMax(hangParams(S.jack.tgt)); if (S.jack.tgt > jm) S.jack.tgt = jm; }
function setObj(o) { if (S.obj === o) return; S.obj = o; S.settle = 0; S.preset = -1; S.jack.tgt = PC.jack.min; S.hv.v += 0.02; UI.syncControls();  }
function setFluid(f) { S.fluid = f; S.preset = -1; setFluidLook(f); clampJack(); UI.syncControls(); }
function setSurface(s) { S.surface = s; S.preset = -1; setSurfaceLook(s); UI.syncControls();  }
function setSame(b) { S.same = b; S.preset = -1; UI.syncControls(); }
function setStation(st, fly = true) {
  if (!['hang', 'track', 'balance'].includes(st)) return;
  const previousStation = S.station;
  if (BAL.drag) { balanceUp({}, true); DRAG.kind = null; controls.enabled = true; }
  S.station = st;
  if (BAL.root) { BAL.root.visible = st === 'balance'; HERO.hang.visible = HERO.track.visible = st !== 'balance'; }
  document.body.classList.toggle('balance-station', st === 'balance');
  if (st === 'balance') {
    dirTeleReset(); DIR.slow = null; DIR.ts = 1;
    if (S.mode === 'kid' && (KID.free || KID.missions[KID.i]?.shot !== 'balance')) { KID.free = true; KID.passed = false; KID.showWin = false; KID.fx.later.length = 0; S.pin = false; }
  }
  if (S.mode === 'kid' && KID.free && (st === 'balance' || previousStation === 'balance')) KID.renderFree();
  UI.syncControls();
  if (fly) { CAM.cine = false; flyTo(stationShot(st), 1.8); }
  if (st === 'track' && S.graph !== 'vt') S.graph = 'vt';
  if (st === 'hang' && S.graph === 'vt') S.graph = S.obj === 'weights' ? 'hooke' : 'buoy';
  UI.syncButtons();
}
function resetTrack(x = PC.track.x0) { S.trk.x = x; S.trk.v = 0; S.dist = 0; S.rec.vt.length = 0; S.tTrk = 0; S.lastSign = 0; }
function applyPreset(i) {
  const p = PRESETS[i];
  cueReset();
  if (p.station === 'track') {
    setSame(p.same); setSurface(p.surface);
    for (const k of ['F1', 'F2', 'load', 'g']) setParam(k, p[k], true);
    resetTrack();
  } else {
    S.obj = p.obj; if (p.fluid) setFluid(p.fluid);
    setParam('g', p.g, true); if (p.n != null) setParam('n', p.n, true);
    const j = p.jack === 'full' ? Math.min(PHYS.jackForFull(hangParams(0.03)) + 0.012, PHYS.jackMax(hangParams(0.03))) : p.jack;
    S.jack.tgt = j;
    S.hv.v += 0.03;
  }
  S.preset = i;
  setStation(p.station);
  UI.syncControls(); 
  sfx('click');
}
function setOverlay(k, on) { S.overlays[k] = on; UI.syncButtons(); }
function setGraph(m) { S.graph = m; UI.syncButtons(); }
function setView(m) {
  S.view = m;
  const studio = m === 'studio';
  ROOM.visible = !studio; LIGHTS.room.forEach((l) => (l.visible = !studio)); LIGHTS.studio.visible = studio; STUDIO.visible = studio;
  scene.background = new THREE.Color(studio ? 0x0b0a09 : 0x221b16); scene.fog = studio ? null : new THREE.Fog(0x2a221c, 11, 26);
  scene.environmentIntensity = studio ? 0.22 : 0.36;
  UI.syncButtons();
}
function togglePlay() { S.playing = !S.playing; UI.syncButtons(); }

// ---- 기록 (자동 측정) ----
function recordHang(r) {
  if (S.settle < 0.4) return;
  if (r.obj === 'weights' && !r.empty && !r.inFluid) {
    const n = Math.round(r.m / PC.weightMass), key = `${n}|${r.g.toFixed(1)}`;
    if (!S.rec.hooke.some((q) => q.key === key)) {
      S.rec.hooke.push({ key, n, m: r.m, g: r.g, F: r.T, x: r.x }); if (S.rec.hooke.length > 14) S.rec.hooke.shift();
      S.newRec = key; sfx('tick');
    }
  }
  if (r.obj !== 'weights') {
    const key = `${r.obj}|${r.fluid}|${r.g.toFixed(1)}|${Math.round(r.s / 0.004)}`;
    if (!S.rec.buoy.some((q) => q.key === key)) {
      S.rec.buoy.push({ key, obj: r.obj, fluid: r.fluid, g: r.g, s: r.s, frac: r.frac, T: r.T, B: r.B, W: r.W, floating: r.floating });
      if (S.rec.buoy.length > 40) S.rec.buoy.shift();
      S.newRec = key;
    }
  }
}
function recordFriction(e) {
  S.rec.fric.push({ key: `${e.surface}|${e.load}|${e.g.toFixed(1)}`, surface: e.surface, load: e.load, g: e.g, N: e.N, F: e.Fa, fsMax: e.fsMax, same: e.same });
  if (S.rec.fric.length > 10) S.rec.fric.shift();
  S.newRec = 'f' + S.rec.fric.length;
}

// Screen A: force bars and numeric readings.
function screenFrame(c, W, H) {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#08141b'); g.addColorStop(1, '#050b0f');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}
const hex = (n) => '#' + n.toString(16).padStart(6, '0');
function drawScreenA(c, W, H) {
  screenFrame(c, W, H);
  if (S.station === 'balance' || !S.hang || !S.F) return;
  const hang = S.station === 'hang', r = S.hang, F = S.F, P = trackParams();
  const rows = hang
    ? [[-r.W, FCOL.W], [S.Tlive, FCOL.T], [r.B, FCOL.B]]
    : [[P.same ? P.F1 : -P.F1, FCOL.F], [P.F2, FCOL.F], [F.f, FCOL.f]]
      .concat(Math.abs(F.bump) > 1e-3 ? [[F.bump, FCOL.bump]] : []);
  const net = hang ? S.Tlive + r.B - r.W : F.net;
  const maxF = Math.max(3, Math.abs(net), ...rows.map(([v]) => Math.abs(v))) * 1.08;
  // Fixed number column keeps peak-force readings inside the display.
  const xm = W * 0.48, half = W * 0.30, rowH = Math.min(30, (H - 92) / (rows.length + 1));
  c.textBaseline = 'middle'; c.textAlign = 'left';
  c.font = font('mono', 17); c.fillStyle = '#bae6fd';
  c.fillText(hang ? '\u2191 +' : '\u2192 +', 14, 16);
  c.strokeStyle = 'rgba(186,230,253,0.25)'; c.beginPath(); c.moveTo(xm, 32); c.lineTo(xm, H - 34); c.stroke();
  const bar = (y, v, col, bold = false) => {
    const w = v / maxF * half;
    dot(c, 20, y, hex(col), bold ? 6 : 5);
    c.fillStyle = hex(col); c.globalAlpha = bold ? 1 : 0.85;
    c.fillRect(Math.min(xm, xm + w), y - rowH * 0.3, Math.abs(w), rowH * 0.6); c.globalAlpha = 1;
    c.font = font('mono', 16); c.textAlign = 'right'; c.fillStyle = '#e6f7ff';
    c.fillText(`${v >= 0 ? '+' : '\u2212'}${fx(Math.abs(v), 2)} N`, W - 12, y);
  };
  rows.forEach(([v, col], i) => bar(42 + i * rowH, v, col));
  const yn = 48 + rows.length * rowH;
  c.strokeStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.moveTo(14, yn - rowH * 0.5); c.lineTo(W - 14, yn - rowH * 0.5); c.stroke();
  bar(yn, Math.abs(net) < 0.005 ? 0 : net, FCOL.net, true);
  if (!hang) {
    c.font = font('mono', 15); c.textAlign = 'left';
    dot(c, 20, H - 16, hex(FCOL.W), 4); c.fillStyle = '#e6f7ff'; c.fillText(`\u2212${fx(F.W, 2)} N \u2193`, 32, H - 16);
    dot(c, W / 2 + 6, H - 16, '#ffffff', 4); c.fillText(`+${fx(F.N, 2)} N \u2191`, W / 2 + 18, H - 16);
  }
}
function axes(c, x0, y0, x1, y1, nx, ny) {
  c.strokeStyle = 'rgba(125,211,252,0.09)'; c.lineWidth = 1;
  for (let i = 0; i <= nx; i++) { const x = x0 + (x1 - x0) * i / nx; c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke(); }
  for (let i = 0; i <= ny; i++) { const y = y0 + (y1 - y0) * i / ny; c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke(); }
}
function dot(c, x, y, col, r = 5) { c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 8; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.shadowBlur = 0; }
function drawScreenB(c, W, H) {
  if (S.station === 'balance') { screenFrame(c,W,H); return; }
  screenFrame(c, W, H);
  const x0 = 58, x1 = W - 20, y0 = 34, y1 = H - 40;
  c.font = font('mono', 16); c.textBaseline = 'middle';
  axes(c, x0, y0, x1, y1, 5, 5);
  const reading = (t, x, y, al = 'left', col = 'rgba(186,230,253,0.75)') => { c.textAlign = al; c.fillStyle = col; c.fillText(t, x, y); };
  if (S.graph === 'hooke') {
    dot(c, 20, 14, hex(FCOL.T));
    const pts = S.rec.hooke.filter((q) => Math.abs(q.g - S.g.tgt) < 0.05);
    const X = (x) => x0 + x / 0.25 * (x1 - x0), Y = (F) => y1 - F / 5 * (y1 - y0);
    for (let i = 0; i <= 5; i++) { reading(String(i), x0 - 8, Y(i), 'right', 'rgba(186,230,253,0.55)'); reading(String(i * 5), X(i * 0.05), H - 22, 'center', 'rgba(186,230,253,0.55)'); }
    if (pts.length >= 2) { const k = PHYS.fitK(pts); glowStroke(c, 'rgba(134,239,172,0.7)', 2, 8, (c) => { c.moveTo(X(0), Y(0)); c.lineTo(X(Math.min(0.25, 5 / k)), Y(Math.min(5, 0.25 * k))); }); reading(`${fx(k, 1)}`, x0 + 12, y0 + 12, 'left', '#d9f99d'); }
    pts.forEach((q) => dot(c, X(q.x), Y(q.F), q.key === S.newRec ? '#ffffff' : '#a7f3d0'));
    const r = S.hang;
    if (r && r.obj === 'weights' && !r.empty && !r.inFluid) { c.strokeStyle = 'rgba(255,255,255,0.4)'; c.setLineDash([4, 4]); c.beginPath(); c.arc(X(S.hv.x), Y(S.Tlive), 9, 0, Math.PI * 2); c.stroke(); c.setLineDash([]); }
  } else if (S.graph === 'buoy') {
    dot(c, 20, 14, hex(FCOL.B));
    const r = S.hang, obj = r && r.obj !== 'weights' ? r.obj : 'al';
    const pts = S.rec.buoy.filter((q) => q.obj === obj && q.fluid === S.fluid && Math.abs(q.g - S.g.tgt) < 0.05);
    const W0 = (PHYS.OBJECTS[obj].mass) * S.g.tgt, hcm = PC.objV / (Math.PI * PC.objR ** 2) * 100;
    const ymax = Math.max(3, W0 * 1.15), X = (s) => x0 + s / (hcm / 100) * (x1 - x0), Y = (F) => y1 - F / ymax * (y1 - y0);
    for (let i = 0; i <= 5; i++) { reading(fx(ymax * i / 5, 1), x0 - 8, Y(ymax * i / 5), 'right', 'rgba(186,230,253,0.55)'); reading(fx(hcm * i / 5, 1), X(hcm / 100 * i / 5), H - 22, 'center', 'rgba(186,230,253,0.55)'); }
    c.setLineDash([8, 6]); c.strokeStyle = 'rgba(255,179,107,0.8)'; c.beginPath(); c.moveTo(x0, Y(W0)); c.lineTo(x1, Y(W0)); c.stroke(); c.setLineDash([]);
    reading(`${fx(W0, 2)} N`, x1 - 4, Y(W0) - 12, 'right', 'rgba(255,207,154,0.95)');
    pts.sort((a, b) => a.s - b.s);
    if (pts.length > 1) glowStroke(c, 'rgba(125,211,252,0.7)', 2, 8, (c) => pts.forEach((q, i) => (i ? c.lineTo(X(q.s), Y(q.T)) : c.moveTo(X(q.s), Y(q.T)))));
    pts.forEach((q) => dot(c, X(q.s), Y(q.T), q.key === S.newRec ? '#ffffff' : '#bae6fd', 4));
    if (r && r.obj === obj) { const q = { s: r.s, T: S.Tlive }; c.strokeStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.arc(X(q.s), Y(q.T), 8, 0, Math.PI * 2); c.stroke(); if (r.B > 0.01) reading(`+${fx(r.B, 2)} N`, x1 - 4, y1 - 14, 'right', '#bae6fd'); }
  } else {
    dot(c, 20, 14, hex(FCOL.net));
    const pts = S.rec.vt, tN = S.tTrk, span = 10;
    const vmax = Math.max(0.4, ...pts.map((p) => Math.abs(p.v))) * 1.15;
    const X = (t) => x1 - (tN - t) / span * (x1 - x0), Y = (v) => (y0 + y1) / 2 - v / vmax * (y1 - y0) / 2;
    c.strokeStyle = 'rgba(186,230,253,0.35)'; c.beginPath(); c.moveTo(x0, Y(0)); c.lineTo(x1, Y(0)); c.stroke();
    for (const v of [-vmax, 0, vmax]) reading(fx(v / 1.15, 2), x0 - 8, Y(v / 1.15), 'right', 'rgba(186,230,253,0.55)');
    glowStroke(c, 'rgba(253,230,138,0.95)', 3, 10, (c) => { let pen = false; for (const p of pts) { if (tN - p.t > span) continue; const x = X(p.t), y = Y(p.v); if (!pen) { c.moveTo(x, y); pen = true; } else c.lineTo(x, y); } });
    dot(c, x1, Y(S.trk.v), '#fff7d6', 4.5);
    reading(`${S.trk.v >= 0 ? '+' : '\u2212'}${fx(Math.abs(S.trk.v), 2)}`, x1 - 10, Y(S.trk.v) - 14, 'right', '#fff7d6');
  }
}

// 스튜디오 배경
const STUDIO = new THREE.Group();
function buildStudio() {
  const bg = new THREE.Mesh(new THREE.SphereGeometry(18, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'varying vec3 vP; void main(){ float y = normalize(vP).y; vec3 c = mix(vec3(0.05,0.045,0.04), vec3(0.16,0.13,0.11), smoothstep(-0.2, 0.5, y)); gl_FragColor = vec4(c, 1.0); }',
  }));
  STUDIO.add(bg);
  const fl = new THREE.Mesh(new THREE.CircleGeometry(9, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x141210, roughness: 0.85 }));
  fl.receiveShadow = true; fl.position.y = 0.001; STUDIO.add(fl);
  STUDIO.visible = false; scene.add(STUDIO);
}

// ---- 수업 단계 (docs/quest-map.md). 안내는 guide.html, 완료 판정은 물리 결과 (마지막은 도달 완료) ----
const LESSON = {
  i: -1, done: [], ctx: {}, passed: false,
  steps: [
    { id: 'intro', st: 'track', enter() { setSame(false); setSurface('glass'); setParam('load', 0, true); setParam('F1', 0, true); setParam('F2', 0, true); setParam('g', 9.8, true); resetTrack(); S.playing = true; },
      check: () => S.dist >= 0.05 },
    { id: 'balance', st: 'track', enter() { setSame(false); setSurface('glass'); setParam('F1', 0, true); setParam('F2', 0, true); setParam('load', 0, true); resetTrack(); },
      check: () => !S.same && S.surface === 'glass' && S.F1.tgt >= 1 && S.F2.tgt >= 1 && Math.abs(S.F1.tgt - S.F2.tgt) <= 0.051 && S.trk.v === 0 },
    { id: 'same', st: 'track', enter() { resetTrack(); },
      check: () => S.same && S.F1.tgt >= 0.5 && S.F2.tgt >= 0.5 },
    { id: 'weight', st: 'hang', enter() { S.obj = 'weights'; setParam('n', 3, true); setParam('g', 9.8, true); S.jack.tgt = PC.jack.min; },
      check: () => S.obj === 'weights' && S.n.tgt >= 1 && S.g.tgt <= 4 && S.settle > 0.3 },
    { id: 'hooke', st: 'hang', graph: 'hooke', enter() { S.obj = 'weights'; setParam('g', 9.8, true); setParam('n', 1, true); S.jack.tgt = PC.jack.min; },
      check: () => new Set(S.rec.hooke.filter((q) => Math.abs(q.g - S.g.tgt) < 0.05).map((q) => q.n)).size >= 4 },
    { id: 'friction', st: 'track', enter() { setSame(false); setParam('F1', 0, true); setParam('F2', 0, true); resetTrack(); LESSON.ctx.n0 = S.rec.fric.length; },
      check: () => new Set(S.rec.fric.slice(LESSON.ctx.n0 || 0).map((q) => `${q.surface}|${q.load}`)).size >= 2 },
    { id: 'buoy', st: 'beaker', graph: 'buoy', enter() { S.obj = 'al'; setFluid('water'); setParam('g', 9.8, true); S.jack.tgt = PC.jack.min; },
      check: () => S.obj === 'al' && S.hang && S.hang.frac >= 0.999 && S.settle > 0.3 },
    { id: 'motion', st: 'track', graph: 'vt', enter() { setSame(false); setSurface('glass'); setParam('load', 0, true); setParam('F1', 0, true); setParam('F2', 0, true); resetTrack(PC.track.xmin + 0.02); S.seen = { acc: false, dec: false, rev: false }; S.playing = true; S.speed = 0.5; UI.syncButtons(); },
      check: () => S.seen.acc && S.seen.dec },
    { id: 'design', st: 'track', enter() { setSame(false); setSurface('glass'); setParam('load', 0, true); setParam('F1', 0, true); setParam('F2', 0, true); resetTrack(); },
      check: () => S.F1.tgt === 0 && S.F2.tgt >= 4 && S.trk.v === 0 && S.F && S.F.mode === 'held' },
    { id: 'wrap', st: 'hero', check: () => true },
  ],
};
function lessonGo(i) {
  if (i < 0 || i >= LESSON.steps.length) { lessonEnd(); return; }
  LESSON.i = i; LESSON.ctx = {}; LESSON.passed = false;
  cueReset();
  const st = LESSON.steps[i];
  st.enter && st.enter();
  setStation(st.st === 'beaker' || st.st === 'hang' ? 'hang' : st.st === 'track' ? 'track' : S.station, false);
  if (st.graph) S.graph = st.graph; else if (S.station === 'track') S.graph = 'vt';
  CAM.cine = false; flyTo(stationShot(st.st), 2.2);
  UI.syncControls(); UI.syncButtons(); UI.renderLesson();
}
function lessonEnd() { LESSON.i = -1; UI.renderLesson(); UI.syncButtons(); }
function lessonUpdate() {
  if (LESSON.i < 0) return;
  if (!LESSON.passed && LESSON.steps[LESSON.i].check()) { LESSON.passed = true; LESSON.done[LESSON.i] = true; sfx('ding'); }
  UI.renderLesson();
}

const PERF = { acc: 0, n: 0, t: 0 };
let lastT = performance.now(), frameNo = 0, uiT = 0;

function update(rdt) {
  frameNo++; const dt = dirTime(rdt);   // dt: 물리(슬로 모션 반영) / rdt: 카메라·화면
  const k = 1 - Math.exp(-dt * 7);
  for (const n of ['g', 'jack', 'F1', 'F2']) S[n].cur += (S[n].tgt - S[n].cur) * (n === 'jack' ? 1 - Math.exp(-dt * 4) : k);
  // --- 매달기: 닫힌 해 + 화면용 감쇠 진동 (평형으로 수렴) ---
  const r = PHYS.hang(hangParams()); S.hang = r;
  const hv = S.hv, xe = r.empty ? 0 : r.x;
  if (r.empty || r.floating) { hv.x += (0 - hv.x) * (1 - Math.exp(-dt * 12)); hv.v = 0; }
  else {
    const w = Math.sqrt(PC.kHang / Math.max(r.m, 0.03)), z = r.inFluid ? 0.4 : 0.2, sub = 4, h = dt / sub;
    for (let i = 0; i < sub; i++) { hv.v += (-w * w * (hv.x - xe) - 2 * z * w * hv.v) * h; hv.x += hv.v * h; }
    hv.x = clamp(hv.x, 0, 0.26);
  }
  S.Tlive = r.empty || r.floating ? 0 : PC.kHang * hv.x;
  S.settle = Math.abs(hv.x - xe) < 8e-4 && Math.abs(hv.v) < 8e-3 ? S.settle + dt : 0;
  recordHang(r);
  updateHang(r, hv.x);
  // --- 끌기 ---
  const P = trackParams();
  if (S.playing && !S.pin) {
    const dts = dt * S.speed, x0 = S.trk.x;
    const ev = PHYS.trackStep(S.trk, P, dts);
    S.dist += Math.abs(S.trk.x - x0);
    for (const e of ev) {
      if (e.type === 'start' || e.type === 'bump') dirEvent(e.type === 'start' ? 'slip' : 'bump', e);
      if (e.type === 'start') { recordFriction(e); sfx('scrape'); }
      if (e.type === 'stop') sfx('tick');
      if (e.type === 'bump') { sfx('clack'); }
    }
    S.tTrk += dts; S.vtAcc += dts;
    if (S.vtAcc >= 0.04) { S.vtAcc = 0; S.rec.vt.push({ t: S.tTrk, v: S.trk.v }); while (S.rec.vt.length && S.tTrk - S.rec.vt[0].t > 12) S.rec.vt.shift(); }
  }
  const F = PHYS.trackForces(S.trk, P); S.F = F;
  if (Math.abs(S.trk.v) > 0.01) {
    const along = F.a * Math.sign(S.trk.v);
    if (along > 0.05) S.seen.acc = true;
    if (along < -0.05) S.seen.dec = true;
    const sg = Math.sign(S.trk.v); if (S.lastSign && sg !== S.lastSign) S.seen.rev = true; S.lastSign = sg;
  }
  updateBalance(S.playing ? dt * S.speed : 0);
  updateTrack(S.trk, { ...P, F1: S.F1.cur, F2: S.F2.cur });
  updateArrows(r, hv.x, S.Tlive, F, P, S.trk, S.overlays.F, dt);
  updateCues(r, hv.x, F, P, dt);
  if (S.station === 'balance') {
    for (const group of [OVL.h, OVL.t, OVL.cue]) for (const a of Object.values(group)) a.mesh.visible = false;
    OVL.ruler.visible = false;
  }
  // --- 콘솔 ---
  CONSOLE.dialG.set((S.g.cur - PC.gMin) / (PC.gMax - PC.gMin)); CONSOLE.dialJ.set((S.jack.cur - PC.jack.min) / (PC.jack.max - PC.jack.min));
  CONSOLE.sF1.set(S.F1.cur / PC.trackMax); CONSOLE.sF2.set(S.F2.cur / PC.trackMax);
  CONSOLE.button.press = Math.max(0, (CONSOLE.button.press || 0) - dt * 6);
  CONSOLE.button.setIcon(S.playing, CONSOLE.button.press);
  const lp = CONSOLE.lamps, bal = S.trk.v === 0 && Math.abs(F.net) < 1e-6 && (P.F1 > 0 || P.F2 > 0);
  lp.bal.mesh.material.color.copy(bal ? lp.bal.on : lp.bal.off);
  lp.move.mesh.material.color.copy(Math.abs(S.trk.v) > 1e-4 ? lp.move.on : lp.move.off);
  if (frameNo % 3 === 0) CONSOLE.screenA.redraw();
  if (frameNo % 3 === 1) CONSOLE.screenB.redraw();
  // --- HUD ---
  uiT += rdt;
  if (uiT > 0.08) { uiT = 0; UI.updateChips(); lessonUpdate(); KID.update(); }
  UI.updateLabels(); KID.frame(rdt); khFrame(); dirFrame(rdt); updateTheme(rdt);
  audioUpdate();
  // --- 카메라·렌더 ---
  keyMove(rdt); hoverUpdate(rdt);
  updateCamera(rdt);
  PIPE.bokeh.uniforms.focus.value = camera.position.distanceTo(controls.target);
  const now = performance.now() / 1000;
  PIPE.finish.uniforms.uTime.value = now;
  updateFocus(rdt);
  renderer.shadowMap.needsUpdate = true;
  PIPE.composer.render(rdt);
  renderOverlays();
  PERF.acc += rdt; PERF.n++; PERF.t += rdt;
  if (PERF.t > 2) {
    const avg = PERF.acc / PERF.n * 1000; PERF.acc = PERF.n = PERF.t = 0; PERF.last = avg;
    if (avg > 25 && !window.__labNoAuto) {
      if (PIPE.gtao.enabled) PIPE.gtao.enabled = false;
      else if (renderer.getPixelRatio() > 1) { renderer.setPixelRatio(1); onResize(); }
      else if (PIPE.bokeh.enabled) PIPE.bokeh.enabled = false;
    }
  }
}
function frame() {
  requestAnimationFrame(frame);
  const t = performance.now();
  const dt = Math.min(0.05, (t - lastT) / 1000); lastT = t;
  if (window.__labManual) return;
  update(dt);
}
let lastPortrait = null;
function onResize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  applyViewOffset();
  if (PIPE.composer) { PIPE.composer.setPixelRatio(renderer.getPixelRatio()); PIPE.composer.setSize(w, h); }
  if (PIPE.depthRT) PIPE.depthRT.setSize(Math.ceil(w * renderer.getPixelRatio()), Math.ceil(h * renderer.getPixelRatio()));
  const p = isPortrait();
  if (lastPortrait !== null && p !== lastPortrait && !CAM.fly) shot(S.station === 'balance' ? stationShot('balance') : heroShot());
  lastPortrait = p;
  UI.$ && UI.sheet();
}

window.__lab = {
  // Read-only metadata for the text-audit runner; never advances a quest.
  get textAuditInfo() { return { phase: KID.phase(), missions: KID.missions.map((m) => ({ id: m.id, answer: m.pred?.ans ?? null })) }; },
  textAudit() {
    const words = [], tooltips = [], emoji = [];
    const where = (el) => el.id ? `#${CSS.escape(el.id)}` : `${el.localName}${Array.from(el.classList).slice(0, 2).map((c) => `.${CSS.escape(c)}`).join('')}`;
    const visible = (el, rects) => {
      for (let p = el; p; p = p.parentElement) {
        const s = getComputedStyle(p);
        if (s.display === 'none' || s.visibility === 'hidden' || s.visibility === 'collapse' || +s.opacity === 0 || p.hidden) return false;
        const b = p.getBoundingClientRect();
        if (p === el && s.display !== 'contents' && (!b.width || !b.height)) return false;
      }
      return Array.from(rects).some((r) => {
        let left = Math.max(0, r.left), top = Math.max(0, r.top), right = Math.min(innerWidth, r.right), bottom = Math.min(innerHeight, r.bottom);
        for (let p = el; p; p = p.parentElement) {
          const s = getComputedStyle(p), b = p.getBoundingClientRect();
          if (/(hidden|clip|scroll|auto)/.test(s.overflowX)) { left = Math.max(left, b.left); right = Math.min(right, b.right); }
          if (/(hidden|clip|scroll|auto)/.test(s.overflowY)) { top = Math.max(top, b.top); bottom = Math.min(bottom, b.bottom); }
        }
        return r.width > 0 && r.height > 0 && right > left && bottom > top;
      });
    };
    const collect = (text, el, rectsFor) => {
      for (const m of text.matchAll(/\S+/gu)) {
        if (/(?:[가-힣A-Za-z]{2,}|\bm\/s\b|\bN·g\b)/u.test(m[0]) && visible(el, rectsFor(m.index, m[0].length))) words.push({ text: m[0], where: where(el) });
      }
    };
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node; (node = walker.nextNode());) {
      const el = node.parentElement;
      if (el.closest('script,style,template,input,textarea,select')) continue;
      const rectsFor = (start, length) => { const r = document.createRange(); r.setStart(node, start); r.setEnd(node, start + length); return r.getClientRects(); };
      collect(node.data, el, rectsFor);
      for (const m of node.data.matchAll(/\p{Extended_Pictographic}/gu)) if (visible(el, rectsFor(m.index, m[0].length))) emoji.push({ text: m[0], where: where(el) });
    }
    for (const el of document.querySelectorAll('input,textarea,select')) {
      if (el instanceof HTMLInputElement && ['hidden', 'checkbox', 'radio', 'range', 'color', 'file', 'image'].includes(el.type)) continue;
      const text = el instanceof HTMLSelectElement ? Array.from(el.selectedOptions, (o) => o.text).join(' ') : el.value || el.placeholder || '';
      collect(text, el, () => el.getClientRects());
    }
    for (const el of document.querySelectorAll('[title]')) if (visible(el, el.getClientRects())) tooltips.push({ text: el.getAttribute('title'), where: where(el) });
    return { words, tooltips, emoji, count: words.length };
  },
  balance: {
    set: balanceSet,
    state() { return { ...structuredClone(S.balance), ...PHYS.balance(balanceParams()), ...S.beam }; },
    step(n = 1) { for (let i = 0; i < Math.min(36000, Math.max(0, n)); i++) updateBalance(1 / 60); return this.state(); },
    place: balancePlace, clips: balanceClips, pos: balancePos,
  },
  state: S, PHYS, SHOTS, SHOTS_VERTICAL, renderer, scene,
  get pipe() { return PIPE; },
  set(name, v) {
    if (name in DEC) { setParam(name, v); S[name].cur = S[name].tgt; }
    else if (name === 'obj') setObj(v); else if (name === 'fluid') setFluid(v); else if (name === 'surface') setSurface(v); else if (name === 'same') setSame(v); else if (name === 'station') { setStation(v, false); if (v === 'balance') shot(stationShot(v)); }
    else if (name in S) S[name] = v;
  },
  settle() { S.jack.cur = S.jack.tgt; const r = PHYS.hang(hangParams()); S.hv.x = r.floating || r.empty ? 0 : r.x; S.hv.v = 0; S.settle = 1; },
  preset(i) { applyPreset(i); for (const n of ['g', 'jack', 'F1', 'F2']) S[n].cur = S[n].tgt; this.settle(); },
  overlay: setOverlay, graph: setGraph, view: setView, resetTrack,
  flyTo, shot(i, vertical = false) { shot(vertical ? SHOTS_VERTICAL[i] : SHOTS[i]); },
  lesson: { go: lessonGo, end: lessonEnd, get i() { return LESSON.i; }, get passed() { return LESSON.passed; } },
  play(b) { S.playing = b; UI.syncButtons(); },
  step(n = 1, dt = 1 / 60) { window.__labManual = true; for (let i = 0; i < Math.min(n, 600); i++) update(dt); return { x: S.trk.x, v: S.trk.v, T: S.Tlive }; },
  resume() { window.__labManual = false; lastT = performance.now(); },
  async capture(name) {
    if (!canvas.width || Math.abs(canvas.clientWidth - innerWidth) > 1) onResize();
    update(0);
    const url = canvas.toDataURL('image/jpeg', 0.9);
    const r = await fetch(`/__save/${name}.jpg`, { method: 'POST', body: url });
    return r.ok ? `${name}.jpg` : `fail ${r.status}`;
  },
  quality: setQuality, mode: (m) => setMode(m), kid: { get count() { return KID.missions.length; }, go: (i) => KID.go(typeof i === 'string' ? KID.missions.findIndex(m => m.id === i) : i), predict: (k) => KID.predict(k), status() { const m=KID.missions[KID.i]; return { id:m?.id, phase:KID.phase(), passed:KID.passed, check:m ? m.check() : false }; }, get i() { return KID.i; }, get passed() { return KID.passed; }, at(k) { const v = KID_AT[k]().project(camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; } },
  perf() { return { avg: PERF.last, pr: renderer.getPixelRatio(), ao: PIPE.gtao.enabled, bokeh: PIPE.bokeh.enabled, calls: renderer.info.render.calls, tris: renderer.info.render.triangles }; },
};

async function init() {
  try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]); } catch {}
  buildRoom(); buildConsole(); buildHero(); buildBalance(); buildOverlays(); buildCues(); buildLights(); buildStudio(); buildThemes(); buildPipeline(); buildCamera();
  setFluidLook(S.fluid); setSurfaceLook(S.surface);
  tagPickables();
  UI.init();
  initKid();
  addEventListener('resize', onResize);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  addEventListener('keydown', onKey); addEventListener('keyup', onKeyUp);
  onResize();
  frame();
  setTimeout(() => document.body.classList.remove('intro'), 300);
  if (QS.has('lesson') && S.mode === 'full') lessonGo(Math.max(0, (+QS.get('lesson') || 1) - 1));
}
init().catch(e => console.error(e));
