// ==== 14 LOOP ====
// 상태: 변수마다 현재/목표값 쌍, 매 프레임 지수 감쇠
const S = {
  H: { cur: 2, tgt: 2 }, h: { cur: 15, tgt: 15 }, m: { cur: 0.4, tgt: 0.4 },
  preset: -1, playing: true, speed: 1, slowmo: true, rate: 1,
  overlays: { P: true, F: true, G: true }, ovlP: 1,
  view: 'lab', explode: { cur: 0, tgt: 0 },
  sound: false, started: false, needsRestart: false,
  tSim: 0, sample: null, beatsSinceSwap: 0, dirty: false, lastCompute: 0, pending: null,
  sweep: { key: '', hs: [], pts: [], i: 0 },
};
const PRESETS = [
  { H: 2, h: 6, m: 0.4 }, { H: 2, h: 30, m: 0.4 }, { H: 2, h: 15, m: 0.12 }, { H: 2, h: 15, m: 0.9 },
];
let SIM = PHYS.simulate({ H: 2, h: 15, m: 0.4 });
const params = () => ({ H: S.H.tgt, h: S.h.tgt, m: S.m.tgt });

function setParam(name, v, fromPreset = false) {
  const [lo, hi] = PHYS.RANGE[name];
  const nv = +clamp(v, lo, hi).toFixed(name === 'm' ? 3 : 2);
  if (nv === S[name].tgt) return;
  S[name].tgt = nv;
  if (!fromPreset) S.preset = -1;
  S.dirty = true;
  if (name === 'm') buildWeights(nv);
  UI.syncControls && UI.$ && UI.syncControls();
  if (!fromPreset) { S._tick = (S._tick || 0) + 1; if (S._tick % 3 === 0) sfx('tick'); }
}
function applyPreset(i) {
  const p = PRESETS[i]; S.preset = i;
  setParam('H', p.H, true); setParam('h', p.h, true); setParam('m', p.m, true);
  S.preset = i;
  restart(false);
  UI.syncControls(); UI.event(T('presets')[i]);
  sfx('click');
}
function restart(idle) {
  SIM = PHYS.simulate(params());
  S.pending = null; S.dirty = false;
  S.tSim = 0; S.started = !idle; S.needsRestart = false; S.beatsSinceSwap = 0;
  S.lastWaste = idle ? 0 : 1;
  UI._chipKey = null;
}
function setOverlay(k, on) { S.overlays[k] = on; UI.syncButtons(); }
function setView(m) {
  S.view = m; S.explode.tgt = m === 'explode' ? 1 : 0;
  const studio = m === 'studio';
  ROOM.visible = !studio; LIGHTS.room.forEach((l) => (l.visible = !studio)); LIGHTS.studio.visible = studio; STUDIO.visible = studio;
  scene.background = new THREE.Color(studio ? 0x0b0a09 : 0x221b16); scene.fog = studio ? null : new THREE.Fog(0x2a221c, 11, 26);
  scene.environmentIntensity = studio ? 0.22 : 0.36;
  if (m === 'explode') flyTo(1, 2.2);
  UI.syncButtons();
}
function togglePlay() { S.playing = !S.playing; if (S.playing && !S.started) restart(false); UI.syncButtons(); }

// 폐수 밸브 추: 100 g 원판을 무게만큼 쌓는다
function buildWeights(m) {
  const g = HERO.weights; if (!g) return;
  const n = clamp(Math.round(m / 0.1), 1, 9);
  if (g.userData.n === n) return; g.userData.n = n;
  g.clear();
  for (let k = 0; k < n; k++) {
    const d = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.0075, 28), k % 2 ? MAT.brassD : MAT.brass);
    d.position.y = k * 0.0082; d.castShadow = true; g.add(d);
  }
  const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.008, 6), MAT.chrome); nut.position.y = n * 0.0082; g.add(nut);
}

// 화면 A: 밸브 쪽 압력 수두의 시간 기록
function valveSeries(sim, tNow, span, n, out) {
  const rec = sim.rec, n1 = rec.nodes, N = n1 - 1;
  for (let k = 0; k < n; k++) {
    const t = tNow - span + (k / (n - 1)) * span;
    if (t < 0) { out[k] = NaN; continue; }
    const tt = PHYS.loopTime(sim, t), f = tt / rec.dt, i = Math.min(Math.floor(f), rec.n - 2), w = clamp(f - i, 0, 1);
    out[k] = rec.H[i * n1 + N] * (1 - w) + rec.H[(i + 1) * n1 + N] * w;
  }
  return out;
}
const SERIES = new Float32Array(260);
function screenFrame(c, W, H) {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#08141b'); g.addColorStop(1, '#050b0f');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}
function drawScreenA(c, W, H) {
  screenFrame(c, W, H);
  const P = SIM.par, L = SIM.limit, en = LANG === 'en';
  const x0 = 64, x1 = W - 18, y0 = 30, y1 = H - 40;
  const ymax = Math.max(P.h * 1.18, 8), ymin = -10;
  const Y = (v) => y1 - (v - ymin) / (ymax - ymin) * (y1 - y0);
  c.strokeStyle = 'rgba(125,211,252,0.09)'; c.lineWidth = 1;
  for (let i = 0; i <= 10; i++) { const x = x0 + (x1 - x0) * i / 10; c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke(); }
  c.font = font('mono', 17); c.fillStyle = 'rgba(186,230,253,0.65)'; c.textAlign = 'right'; c.textBaseline = 'middle';
  const step = ymax > 30 ? 10 : 5;
  for (let v = Math.ceil(ymin / step) * step; v <= ymax; v += step) { c.strokeStyle = v === 0 ? 'rgba(186,230,253,0.3)' : 'rgba(125,211,252,0.09)'; c.beginPath(); c.moveTo(x0, Y(v)); c.lineTo(x1, Y(v)); c.stroke(); c.fillText(`${v}`, x0 - 8, Y(v)); }
  c.save(); c.translate(18, (y0 + y1) / 2); c.rotate(-Math.PI / 2); c.textAlign = 'center'; c.fillText(en ? 'HEAD m' : '수두 m', 0, 0); c.restore();
  c.textAlign = 'left'; c.fillStyle = 'rgba(186,230,253,0.75)'; c.fillText(en ? 'VALVE-SIDE PRESSURE' : '밸브 쪽 압력', x0, 14);
  // 기준선 H, h
  c.setLineDash([8, 6]); c.lineWidth = 2;
  c.strokeStyle = 'rgba(255,179,107,0.8)'; c.beginPath(); c.moveTo(x0, Y(P.H)); c.lineTo(x1, Y(P.H)); c.stroke();
  c.strokeStyle = 'rgba(125,211,252,0.8)'; c.beginPath(); c.moveTo(x0, Y(P.h)); c.lineTo(x1, Y(P.h)); c.stroke(); c.setLineDash([]);
  c.font = font('mono', 16); c.fillStyle = 'rgba(255,179,107,0.95)'; c.fillText(`H ${fx(P.H, 1)}`, x0 + 6, Y(P.H) - 10);
  c.fillStyle = 'rgba(125,211,252,0.95)'; c.fillText(`h ${fx(P.h, 0)}`, x0 + 6, Y(P.h) - 10);
  const span = S.started && !L.stalled ? 2.2 * L.beatT : 3;
  c.textAlign = 'right'; c.fillStyle = 'rgba(186,230,253,0.55)'; c.fillText(en ? `last ${fx(span, 1)} s → now` : `최근 ${fx(span, 1)}초 → 지금`, x1, H - 14);
  if (!S.started) { c.textAlign = 'center'; c.fillStyle = 'rgba(186,230,253,0.6)'; c.font = font('mono', 20); c.fillText(en ? '— no data —' : '— 측정 전 —', (x0 + x1) / 2, (y0 + y1) / 2); return; }
  const n = 240; valveSeries(SIM, S.tSim, span, n, SERIES);
  const X = (k) => x0 + (x1 - x0) * k / (n - 1);
  glowStroke(c, 'rgba(160,230,255,0.95)', 3, 12, (c) => { let pen = false; for (let k = 0; k < n; k++) { const v = SERIES[k]; if (!Number.isFinite(v)) { pen = false; continue; } const y = Y(clamp(v, ymin, ymax)); if (!pen) { c.moveTo(X(k), y); pen = true; } else c.lineTo(X(k), y); } });
  const cur = SERIES[n - 1];
  if (Number.isFinite(cur)) {
    c.fillStyle = '#e6f6ff'; c.shadowColor = '#7dd3fc'; c.shadowBlur = 8; c.beginPath(); c.arc(x1, Y(clamp(cur, ymin, ymax)), 4.5, 0, Math.PI * 2); c.fill(); c.shadowBlur = 0;
    c.font = font('mono', 18); c.textAlign = 'right'; c.fillStyle = '#e6f7ff'; c.fillText(`${fx(cur, 1)} m`, x1 - 12, Y(clamp(cur, ymin, ymax)) - 14);
  }
}
function drawScreenB(c, W, H) {
  screenFrame(c, W, H);
  const P = SIM.par, L = SIM.limit, en = LANG === 'en', sw = S.sweep;
  const x0 = 60, x1 = W - 56, y0 = 30, y1 = H - 40;
  const qmax = Math.max(10, ...sw.pts.filter(Boolean).map((p) => p.q), L.stalled ? 0 : L.q) * 1.15;
  const X = (h) => x0 + (h - 5) / 35 * (x1 - x0), Yq = (q) => y1 - q / qmax * (y1 - y0), Ye = (e) => y1 - e * (y1 - y0);
  c.strokeStyle = 'rgba(125,211,252,0.09)'; c.lineWidth = 1;
  for (let h = 5; h <= 40; h += 5) { c.beginPath(); c.moveTo(X(h), y0); c.lineTo(X(h), y1); c.stroke(); }
  for (let i = 0; i <= 4; i++) { const y = y0 + (y1 - y0) * i / 4; c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke(); }
  c.font = font('mono', 16); c.textBaseline = 'middle';
  c.fillStyle = 'rgba(186,230,253,0.65)'; c.textAlign = 'center';
  for (let h = 5; h <= 40; h += 5) c.fillText(`${h}`, X(h), H - 22);
  c.textAlign = 'right'; for (let i = 0; i <= 4; i++) c.fillText(fx(qmax * i / 4, 0), x0 - 8, Yq(qmax * i / 4));
  c.textAlign = 'left'; c.fillStyle = 'rgba(255,207,154,0.7)'; for (let i = 0; i <= 4; i += 2) c.fillText(`${i * 25}%`, x1 + 8, Ye(i / 4));
  c.fillStyle = 'rgba(186,230,253,0.8)'; c.fillText(en ? 'FLOW q L/min' : '양수량 q L/분', x0, 14);
  c.textAlign = 'right'; c.fillStyle = 'rgba(255,207,154,0.85)'; c.fillText(en ? 'η %' : '효율 η %', x1 + 50, 14);
  c.fillStyle = 'rgba(186,230,253,0.55)'; c.fillText(en ? 'lift h (m) →' : '양수 높이 h (m) →', x1, H - 6);
  const pts = sw.hs.map((h, i) => sw.pts[i]);
  const curve = (key, Yf, color, width) => glowStroke(c, color, width, 10, (c) => { let pen = false; pts.forEach((p, i) => { if (!p || p.stalled) { pen = false; return; } const x = X(sw.hs[i]), y = Yf(key === 'q' ? p.q : p.eta); if (!pen) { c.moveTo(x, y); pen = true; } else c.lineTo(x, y); }); });
  curve('eta', Ye, 'rgba(255,190,130,0.85)', 2);
  curve('q', Yq, 'rgba(160,230,255,0.95)', 3);
  if (sw.pts.filter(Boolean).length < sw.hs.length) { c.textAlign = 'center'; c.fillStyle = 'rgba(186,230,253,0.55)'; c.fillText(en ? 'computing…' : '계산 중…', (x0 + x1) / 2, y0 + 16); }
  // 현재 상태 커서
  const xc = X(P.h);
  c.strokeStyle = 'rgba(255,255,255,0.35)'; c.setLineDash([5, 5]); c.beginPath(); c.moveTo(xc, y0); c.lineTo(xc, y1); c.stroke(); c.setLineDash([]);
  if (S.started || true) {
    const q = L.stalled ? 0 : L.q;
    c.fillStyle = '#e6f6ff'; c.shadowColor = '#7dd3fc'; c.shadowBlur = 8; c.beginPath(); c.arc(xc, Yq(q), 5, 0, Math.PI * 2); c.fill(); c.shadowBlur = 0;
    c.font = font('mono', 18); c.textAlign = xc > (x0 + x1) / 2 ? 'right' : 'left'; c.fillStyle = '#e6f7ff';
    c.fillText(L.stalled ? (en ? 'stopped' : '정지') : `${fx(q, 1)} · ${fx(L.eta * 100, 0)}%`, xc + (xc > (x0 + x1) / 2 ? -12 : 12), Yq(q) - 16);
  }
}
function sweepUpdate() {
  const sw = S.sweep, key = `${S.H.tgt}|${S.m.tgt}`;
  if (sw.key !== key) { sw.key = key; sw.hs = []; for (let h = 5; h <= 40.001; h += 2.5) sw.hs.push(h); sw.pts = new Array(sw.hs.length); sw.i = 0; }
  if (sw.i >= sw.hs.length) return;
  sw.pts[sw.i] = PHYS.sweepPoint(S.H.tgt, sw.hs[sw.i], S.m.tgt); sw.i++;
}

// 스튜디오 배경: 어두운 무한 배경 + 그림자 받는 바닥
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

const IDLE = { H: new Float32Array(PHYS.C.N + 1), V: new Float32Array(PHYS.C.N + 1), waste: 0, deliv: 0, volD: 0, volW: 0, tSim: 0, phase: 'idle' };
const SAMPLE = {};
const PERF = { acc: 0, n: 0, t: 0 };
let lastT = performance.now(), frameNo = 0, uiT = 0;
const _wp = new THREE.Vector3();

function inHammerWindow(sim, t) {
  if (sim.limit.stalled && t > sim.tEnd) return false;
  const tt = PHYS.loopTime(sim, t), c = PHYS.cycleAt(sim, tt);
  if (!c || !Number.isFinite(c.tClose)) {
    // 다음 박자의 닫힘 직전도 포함
    return false;
  }
  const d = tt - c.tClose;
  return d > -0.004 && d < PHYS.C.tClosing + 0.045;
}

function update(dt) {
  prof('start');
  frameNo++;
  const k = 1 - Math.exp(-dt * 7);
  for (const n of ['H', 'h', 'm']) S[n].cur += (S[n].tgt - S[n].cur) * k;
  S.explode.cur += (S.explode.tgt - S.explode.cur) * (1 - Math.exp(-dt * 4));
  S.ovlP += ((S.overlays.P ? 1 : 0) - S.ovlP) * (1 - Math.exp(-dt * 6));

  // --- 물리: 새 조건은 박자 경계(폐수 밸브가 다시 열리는 순간)에서 적용 ---
  const now = performance.now() / 1000;
  if (S.dirty && now - S.lastCompute > 0.12) { S.pending = PHYS.simulate(params()); S.dirty = false; S.lastCompute = now; }
  if (S.pending) {
    if (!S.started) { SIM = S.pending; S.pending = null; S.tSim = 0; UI._chipKey = null; }
    else if (SIM.limit.stalled || S.needsRestart) {
      if (S.pending.limit.stalled && SIM.limit.reason === S.pending.limit.reason) { SIM = S.pending; S.tSim = SIM.tEnd; UI._chipKey = null; }
      else { S.needsRestart = true; UI.event(T('evNeedRestart'), 2400); UI._chipKey = null; }
      S.pending = null;
    }
  }
  let dtSim = 0;
  if (S.started && S.playing) {
    S.rate = S.slowmo && inHammerWindow(SIM, S.tSim) ? 1 / 25 : 1;
    dtSim = dt * S.speed * S.rate;
    S.tSim += dtSim;
  } else S.rate = 1;
  let s;
  if (S.started) s = PHYS.sampleAt(SIM, S.tSim, SAMPLE);
  else { IDLE.H.fill(S.H.tgt); IDLE.V.fill(0); s = IDLE; }
  S.sample = s;
  // 박자 경계 감지
  if (S.started) {
    if (S.lastWaste === 0 && s.waste === 1) {
      S.beatsSinceSwap++;
      if (S.pending && !S.needsRestart) {
        SIM = S.pending; S.pending = null; S.beatsSinceSwap = 0;
        S.tSim = SIM.limit.stalled ? 0 : SIM.limit.t0;
        s = PHYS.sampleAt(SIM, S.tSim, SAMPLE); S.sample = s; UI._chipKey = null;
      }
    }
    if (S.lastWaste === 1 && s.waste === 0) { sfx('clack'); LIGHTS.phenKick = 1; }
    if (s.phase === 'stall' && !S._stallShown) { S._stallShown = true; UI.event(SIM.limit.reason === 'noreopen' ? T('evStallRe') : T('evStallNo'), 2600); }
    if (s.phase !== 'stall') S._stallShown = false;
    S.lastWaste = s.waste;
  }

  prof('sim');
  // --- 장치 ---
  updateApparatusGeometry(S.H.cur, S.h.cur);
  prof('geom');
  const N1 = PHYS.C.N + 1, P = SIM.par;
  for (let j = 0; j < N1; j++) { PHEN.data[j * 4] = s.H[j]; PHEN.data[j * 4 + 1] = s.V[j]; }
  PHEN.tex.needsUpdate = true;
  const U = PHEN.coreMat.uniforms;
  U.uH.value = P.H; U.uh.value = P.h; U.uShowP.value = S.ovlP;
  let hi = 0; for (let j = 0; j < N1; j++) hi += Math.max(0, s.H[j] - P.H) / Math.max(P.h, 1); hi /= N1;
  U.uGain.value = 1 - 0.45 * clamp(hi, 0, 1);                      // 넓게 고압이면 이득을 낮춰 블룸 포화 방지
  U.uFlow.value += (s.V[10] || 0) * dtSim * 3.5;
  // 폐수 밸브 열림 정도
  let open = s.waste ? 1 : 0;
  if (S.started) { const c = PHYS.cycleAt(SIM, s.tSim); if (s.waste && c && Number.isFinite(c.tClose) && s.tSim >= c.tClose) open = clamp(1 - (s.tSim - c.tClose) / PHYS.C.tClosing, 0, 1); }
  HERO.valveMove.position.y = -0.014 * open;
  HERO.flapHinge.rotation.z += ((s.deliv ? 0.7 : 0) - HERO.flapHinge.rotation.z) * (1 - Math.exp(-dt * 30));
  // 압력계 (바늘 관성)
  const gF = clamp(s.H[N1 - 1] / 45, -0.02, 1.02);
  const gA = ARC_START - gF * ARC_SWEEP - Math.PI / 2;
  HERO.needle.rotation.z += (gA - HERO.needle.rotation.z) * (1 - Math.exp(-dt * (S.rate < 1 ? 60 : 22)));
  // 공기실·송출 탱크 수위 (박자마다 들어온 물 − 평균 유출)
  let dev = 0;
  if (S.started && !SIM.limit.stalled) { const qAvg = SIM.limit.Vd / SIM.limit.T; dev = (s.volD - qAvg * s.tSim - (SIM.cycles[0] ? 0 : 0)) / Math.max(SIM.limit.VdBeat, 1e-6); dev = dev - Math.round(dev); }
  const lvl = clamp(0.52 + dev * 0.22, 0.25, 0.8);
  HERO.chWater.scale.y = lvl * CHAMBER.h; HERO.chWater.position.y = 0.024 + lvl * CHAMBER.h / 2;
  HERO.air.scale.y = (1 - lvl) * CHAMBER.h; HERO.air.position.y = 0.024 + lvl * CHAMBER.h + (1 - lvl) * CHAMBER.h / 2;
  HERO.airMat.uniforms.uP.value = clamp(P.h / 40, 0, 1);
  const dl = clamp(0.5 + dev * 0.12, 0.3, 0.7);
  HERO.dWater.scale.y = dl * (DTANK.h - 0.03); HERO.dWater.position.y = -DTANK.h / 2 + 0.01 + dl * (DTANK.h - 0.03) / 2;
  // 분해 보기 (연출 오프셋은 전용 부모 그룹에만)
  const e = smooth(clamp(S.explode.cur, 0, 1));
  HERO.frontX.position.z = 0.24 * e; HERO.frontMat.opacity = 1 - 0.78 * e; HERO.frontMat.transparent = e > 0.01; HERO.frontMat.depthWrite = e < 0.5;
  HERO.valveX.position.y = 0.17 * e; HERO.checkX.position.z = CHAMBER.z - RAM.z + 0.13 * e; HERO.checkX.position.y = RAM.h / 2 - 0.01 + 0.04 * e;
  HERO.capX.position.y = 0.14 * e;
  // 분출 입자
  const vN = s.V[N1 - 1], dtVis = dt * S.speed * S.rate * (S.playing && S.started ? 1 : 0);
  HERO.disk.getWorldPosition(_wp);
  if (S.started && s.waste && vN > 0.05 && open > 0.05 && dtVis > 0) {
    const cnt = Math.min(40, Math.round(vN * open * 420 * dtVis + (rand() < (vN * open * 420 * dtVis) % 1 ? 1 : 0)));
    emitPoints(PHEN.spray, cnt, _wp, (R) => { const a = R() * Math.PI * 2, sp = 0.25 + R() * 0.35 * vN; return { ox: Math.cos(a) * 0.036, oy: 0.004, oz: Math.sin(a) * 0.036, x: Math.cos(a) * sp, y: 0.15 + R() * 0.25, z: Math.sin(a) * sp }; }, 1.1);
  }
  stepPoints(PHEN.spray, dtVis, TOP + 0.03);
  HERO.nozzle.getWorldPosition(_wp);
  if (S.started && s.deliv && vN > 0.02 && dtVis > 0) {
    emitPoints(PHEN.jet, Math.min(30, Math.round(vN * 300 * dtVis) + 1), _wp, (R) => ({ ox: (R() - 0.5) * 0.01, oy: -0.02, oz: (R() - 0.5) * 0.01, x: (R() - 0.5) * 0.08, y: -0.4 - R() * 0.3, z: (R() - 0.5) * 0.08 }), 0.6);
  }
  stepPoints(PHEN.jet, dtVis, HERO.dtank.position.y - DTANK.h / 2 + 0.01 + dl * (DTANK.h - 0.03));
  HERO.trayWater.material.emissiveIntensity = 0.6 + (s.waste ? clamp(vN, 0, 2) * 0.25 : 0);
  prof('apparatus');
  updateOverlays(s, { G: S.overlays.G, F: S.overlays.F }, dtSim, S.H.cur, S.h.cur);
  prof('overlays');
  // 현상 빛
  LIGHTS.phenKick = Math.max(0, (LIGHTS.phenKick || 0) - dt * (S.rate < 1 ? 0.6 : 3));
  LIGHTS.phen.intensity = 0.12 + 0.55 * LIGHTS.phenKick + (s.phase === 'deliver' ? 0.25 : 0);

  // --- 콘솔 ---
  CONSOLE.dialH.set((S.H.cur - 1) / 3); CONSOLE.dialh.set((S.h.cur - 5) / 35); CONSOLE.slider.set((S.m.cur - 0.1) / 0.8);
  CONSOLE.button.press = Math.max(0, (CONSOLE.button.press || 0) - dt * 6);
  CONSOLE.button.setIcon(S.playing, CONSOLE.button.press);
  const lp = CONSOLE.lamps;
  lp.waste.mesh.material.color.copy(S.started && s.waste ? lp.waste.on : lp.waste.off);
  lp.deliv.mesh.material.color.copy(S.started && s.deliv ? lp.deliv.on : lp.deliv.off);
  if (frameNo % 2 === 0) { CONSOLE.screenA.redraw(); }
  if (frameNo % 6 === 0) { sweepUpdate(); CONSOLE.screenB.redraw(); }

  prof('console');
  // --- HUD (초당 약 12회) ---
  uiT += dt;
  if (uiT > 0.08) { uiT = 0; document.getElementById('caption').innerHTML = captionFor(s); UI.updateChips(s); tourUpdate(); }
  prof('hud');
  UI.updateLabels(s);
  prof('labels');
  const sm = document.getElementById('slowmo'); const slowOn = S.rate < 1 && S.playing; if (sm._on !== slowOn) { sm._on = slowOn; sm.classList.toggle('on', slowOn); sm.textContent = T('slowTag'); }
  audioUpdate(s);

  // --- 카메라·렌더 ---
  keyMove(dt); hoverUpdate(dt);
  updateCamera(dt);
  const dist = camera.position.distanceTo(controls.target);
  PIPE.bokeh.uniforms.focus.value = dist;
  PIPE.finish.uniforms.uTime.value = now;
  prof('camera');
  const moving = ['H', 'h', 'm'].some((n) => Math.abs(S[n].cur - S[n].tgt) > 1e-3) || Math.abs(S.explode.cur - S.explode.tgt) > 1e-3;
  if (moving || frameNo % 3 === 0) renderer.shadowMap.needsUpdate = true;
  PIPE.composer.render(dt);
  renderOverlays();
  prof('render');
  // 성능: 2초 평균 프레임 > 25 ms(40 fps 미만) → AO 끄기 → 픽셀 비율 1 → 보케 끄기
  PERF.acc += dt; PERF.n++; PERF.t += dt;
  if (PERF.t > 2) {
    const avg = PERF.acc / PERF.n * 1000; PERF.acc = PERF.n = PERF.t = 0; PERF.last = avg;
    if (avg > 25 && !window.__labNoAuto) {
      if (PIPE.gtao.enabled) PIPE.gtao.enabled = false;
      else if (renderer.getPixelRatio() > 1) { renderer.setPixelRatio(1); onResize(); }
      else if (PIPE.bokeh.enabled) PIPE.bokeh.enabled = false;
    }
  }
}

// 구간별 CPU 시간 (window.__labProf = {} 로 켠다)
let _pt = 0;
function prof(k) { const P = window.__labProf; if (!P) return; const t = performance.now(); if (k !== 'start') P[k] = (P[k] || 0) + t - _pt; _pt = t; }
function frame() {
  requestAnimationFrame(frame);
  const t = performance.now();
  const dt = Math.min(0.05, (t - lastT) / 1000); lastT = t;
  if (window.__labManual) return;      // 검증 중에는 step()만으로 진행
  update(dt);
}

let lastPortrait = null;
function onResize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  if (PIPE.composer) { PIPE.composer.setPixelRatio(renderer.getPixelRatio()); PIPE.composer.setSize(w, h); }
  const res = new THREE.Vector2(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
  if (OVL.hglMat) { OVL.hglMat.resolution.copy(res); OVL.drops.forEach((d) => d.material.resolution.copy(res)); }
  const ps = renderer.getPixelRatio() * h / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
  PHEN.spray.pts.material.uniforms.uScale.value = ps; PHEN.jet.pts.material.uniforms.uScale.value = ps;
  const p = isPortrait();
  if (lastPortrait !== null && p !== lastPortrait && !CAM.fly) shot(heroShot());
  lastPortrait = p;
  UI.$ && UI.sheet();
}

// 검증·디버그 훅
window.__lab = {
  state: S, PHYS, SHOTS, SHOTS_VERTICAL,
  get sim() { return SIM; }, get pipe() { return PIPE; }, renderer, scene,
  set(name, v) { if (['H', 'h', 'm'].includes(name)) { setParam(name, v); S.pending = null; S.dirty = false; const keep = S.started; SIM = PHYS.simulate(params()); S.tSim = keep ? (SIM.limit.stalled ? SIM.tEnd : SIM.limit.t0) : 0; S[name].cur = S[name].tgt; UI._chipKey = null; } else if (name in S) S[name] = v; },
  preset(i) { applyPreset(i); ['H', 'h', 'm'].forEach((n) => (S[n].cur = S[n].tgt)); },
  view(m) { setView(m); S.explode.cur = S.explode.tgt; },
  overlay(k, on) { setOverlay(k, on); S.ovlP = S.overlays.P ? 1 : 0; },
  flyTo, shot(i, vertical = false) { shot(vertical ? SHOTS_VERTICAL[i] : SHOTS[i]); },
  tour: { go: tourGo, end: tourEnd, get i() { return TOUR.i; }, get passed() { return TOUR.passed; } },
  time(t) { S.tSim = t; },
  play(b) { S.playing = b; UI.syncButtons(); },
  start() { restart(false); },
  step(n = 1, dt = 1 / 60) { window.__labManual = true; for (let i = 0; i < Math.min(n, 120); i++) update(dt); return { t: S.tSim, phase: S.sample && S.sample.phase }; },
  resume() { window.__labManual = false; lastT = performance.now(); },
  async capture(name) {
    const w = innerWidth, h = innerHeight;
    if (!canvas.width || !canvas.height || Math.abs(canvas.clientWidth - w) > 1 || Math.abs(canvas.clientHeight - h) > 1) onResize();
    update(0);
    const url = canvas.toDataURL('image/jpeg', 0.9);
    const r = await fetch(`/__save/${name}.jpg`, { method: 'POST', body: url });
    return r.ok ? `${name}.jpg` : `fail ${r.status}`;
  },
  quality: setQuality,
  searchHero, evalHero() { camera.updateMatrixWorld(); return evalShot(camera, innerWidth, innerHeight, hudRects(innerWidth, innerHeight)); },
  perf() { return { avg: PERF.last, pr: renderer.getPixelRatio(), ao: PIPE.gtao.enabled, bokeh: PIPE.bokeh.enabled, calls: renderer.info.render.calls, tris: renderer.info.render.triangles }; },
};

async function init() {
  try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]); } catch {}
  buildRoom(); buildConsole(); buildHero(); buildWeights(S.m.tgt); buildOverlays(); buildLights(); buildStudio(); buildPipeline(); buildCamera();
  tagPickables();
  UI.init();
  addEventListener('resize', onResize);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  addEventListener('keydown', onKey); addEventListener('keyup', onKeyUp);
  restart(true);
  onResize();
  updateApparatusGeometry(S.H.cur, S.h.cur);
  frame();
  setTimeout(() => document.body.classList.remove('intro'), 300);
  // 첫 화면: 잠깐 정지 상태를 보여 준 뒤 스스로 시동 (투어 중이 아니면)
  setTimeout(() => { if (!S.started && TOUR.i < 0 && !window.__labManual && !QS.has('idle')) restart(false); }, 1800);
  if (QS.has('tour')) tourGo(0);
}
init().catch((e) => { console.error(e); const d = document.createElement("pre"); d.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:99;color:#fca5a5;background:#000a;padding:8px;font:12px monospace;white-space:pre-wrap;max-width:90vw"; d.textContent = String(e && e.stack || e); document.body.appendChild(d); });
