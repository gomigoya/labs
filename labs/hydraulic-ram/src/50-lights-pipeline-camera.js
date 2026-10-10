// ==== 9 LIGHTS ====
const LIGHTS = {};
function buildLights() {
  const low = QUALITY.level === 'low';
  LIGHTS.hemi = new THREE.HemisphereLight(0xffe2c4, 0x2a1d14, 0.42); scene.add(LIGHTS.hemi);
  // 따뜻한 키 (그림자 1)
  const key = new THREE.DirectionalLight(0xffc690, 2.2);
  key.position.set(-2.4, 4.8, 3.4); key.target.position.set(0, 1.0, -0.3);
  key.castShadow = true; key.shadow.mapSize.set(low ? 1024 : 2048, low ? 1024 : 2048);
  Object.assign(key.shadow.camera, { left: -3.4, right: 3.4, top: 3.4, bottom: -1.4, near: 0.5, far: 14 });
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.025; key.shadow.radius = 4;
  scene.add(key, key.target); LIGHTS.key = key;
  // 창문: 차가운 낮빛
  const win = new THREE.RectAreaLight(0xcfe6ff, 6, 1.5, 1.25);
  win.position.set(2.25, 1.9, WALL_Z + 0.06); win.lookAt(1.6, 1.5, 2.5); scene.add(win); LIGHTS.win = win;
  // 펜던트: 아래로 비추는 스포트(그림자 2) + 전구 주변 빛
  const pend = new THREE.SpotLight(0xffb36b, 16, 5, 0.8, 0.55, 2);
  pend.position.set(-0.95, 2.6, -0.05); pend.target.position.set(-0.7, TOP, -0.15);
  if (!low) { pend.castShadow = true; pend.shadow.mapSize.set(1024, 1024); pend.shadow.bias = -0.0006; pend.shadow.radius = 5; }
  scene.add(pend, pend.target); LIGHTS.pend = pend;
  const pendGlow = new THREE.PointLight(0xffb36b, 1.6, 2.6, 2); pendGlow.position.set(-0.95, 2.72, -0.05); scene.add(pendGlow);
  // 스탠드 램프
  const fl = new THREE.PointLight(0xffb070, 7, 6, 2); fl.position.set(-2.75, 1.55, -1.9); scene.add(fl); LIGHTS.floor = fl;
  // 선반 LED 띠
  const led = new THREE.PointLight(0xffb36b, 1.8, 1.8, 2); led.position.set(WALL_X + 0.35, 1.86, -1.25); scene.add(led);
  // 콘솔 화면 빛
  const scr = new THREE.PointLight(0x7dd3fc, 0.5, 1.3, 2); scr.position.set(1.0, 0.86, 0.95); scene.add(scr); LIGHTS.screen = scr;
  // 현상 빛: 수격 순간 구동관 끝에서 약하게 번쩍 (강하면 크롬에 하얀 띠)
  const phen = new THREE.PointLight(0x7dd3fc, 0, 1.1, 2); phen.position.set(0.22, 1.16, 0.24); scene.add(phen); LIGHTS.phen = phen;
  // 스튜디오 3점 조명 (기본 꺼짐)
  LIGHTS.studio = new THREE.Group();
  const sk = new THREE.SpotLight(0xfff1e0, 40, 9, 0.5, 0.6, 2); sk.position.set(2.4, 3.6, 3.2); sk.target.position.set(-0.2, 1.2, -0.2); sk.castShadow = !low; sk.shadow.mapSize.set(1024, 1024);
  const sf = new THREE.PointLight(0x9fd4ff, 6, 8, 2); sf.position.set(-3, 1.8, 2.6);
  const sr = new THREE.SpotLight(0xffb36b, 30, 8, 0.6, 0.5, 2); sr.position.set(-1.2, 3.0, -2.2); sr.target.position.set(0, 1.2, 0);
  LIGHTS.studio.add(sk, sk.target, sf, sr, sr.target); LIGHTS.studio.visible = false; scene.add(LIGHTS.studio);
  LIGHTS.room = [LIGHTS.hemi, key, win, pend, pendGlow, fl, led];
}

// ==== 10 PIPELINE ====
const PIPE = {};
const FinishShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uVig: { value: 0.5 }, uGrain: { value: 0.022 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime, uVig, uGrain; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + uTime*0.0) * 43758.5453); }
    void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 d = vUv - 0.5; float r = length(d*vec2(1.15,1.0));
      c.rgb *= mix(1.0, smoothstep(0.86, 0.28, r), uVig);
      c.rgb += (hash(vUv*vec2(1733.0,977.0) + fract(uTime)) - 0.5) * uGrain;
      gl_FragColor = c; }`,
};
function buildPipeline() {
  const w = innerWidth, h = innerHeight;
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h);
  PIPE.render = new RenderPass(scene, camera); composer.addPass(PIPE.render);
  PIPE.gtao = new GTAOPass(scene, camera, w, h);
  PIPE.gtao.output = GTAOPass.OUTPUT.Default; PIPE.gtao.blendIntensity = 0.9;
  PIPE.gtao.updateGtaoMaterial({ radius: 0.28, distanceExponent: 1.4, thickness: 1.2, scale: 1.0, samples: 8, distanceFallOff: 1, screenSpaceRadius: false });
  PIPE.gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
  PIPE.gtao.enabled = QUALITY.ao; composer.addPass(PIPE.gtao);
  PIPE.bokeh = new BokehPass(scene, camera, { focus: 5.4, aperture: 0.0016, maxblur: 0.0065 });
  PIPE.bokeh.enabled = QUALITY.level !== 'low'; composer.addPass(PIPE.bokeh);
  PIPE.bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.6, 0.5, 0.9);
  if (QUALITY.level === 'low') PIPE.bloom.resolution.set(w / 2, h / 2);
  composer.addPass(PIPE.bloom);
  composer.addPass(new OutputPass());
  PIPE.finish = new ShaderPass(FinishShader); composer.addPass(PIPE.finish);
  PIPE.composer = composer;
  PIPE.depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false });
}
// 설명 오버레이 합성: 화면 효과(DoF·블룸) 뒤에 불투명 장치의 깊이만 다시 그리고, 그 깊이로 오버레이를 판정한다
function renderOverlays() {
  renderer.autoClear = false;
  renderer.clearDepth();
  const bg = scene.background, fog = scene.fog;
  scene.background = null; scene.fog = null; scene.overrideMaterial = PIPE.depthOnly;
  camera.layers.set(LAYER_OCC);
  renderer.render(scene, camera);
  camera.layers.set(0);
  scene.overrideMaterial = null; scene.background = bg; scene.fog = fog;
  renderer.render(overlayScene, camera);
  renderer.autoClear = true;
}
function setQuality(level) {
  QUALITY.level = level;
  const low = level === 'low';
  QUALITY.ao = !low; PIPE.gtao.enabled = !low;
  PIPE.bokeh.enabled = !low;
  QUALITY.pr = low ? 1 : 1.6;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, QUALITY.pr));
  onResize();
}

// ==== 11 CAMERA / SHOTS / TOUR ====
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
// 히어로 샷은 투영 탐색(__lab.searchHero)으로 고른 값. 나머지는 장면을 보며 정한 값.
const SHOTS = [
  { name: 'hero', pos: V3(-0.064, 3.344, 3.966), tgt: V3(-0.5, 1.4, -0.18), fov: 34 },
  { name: 'valve', pos: V3(1.2, 1.5, 1.05), tgt: V3(0.42, 1.12, 0.03), fov: 34 },
  { name: 'pipe', pos: V3(-0.35, 1.42, 1.45), tgt: V3(-0.42, 1.14, -0.08), fov: 34 },
  { name: 'top', pos: V3(0.6, 3.35, 1.55), tgt: V3(-0.3, 1.45, -0.25), fov: 36 },
  { name: 'tank', pos: V3(1.25, 2.55, 1.05), tgt: V3(0.05, 2.1, -0.45), fov: 34 },
  { name: 'console', pos: V3(1.25, 1.3, 1.85), tgt: V3(0.62, 0.74, 0.5), fov: 34 },
];
const SHOTS_VERTICAL = [
  { name: 'hero-v', pos: V3(0.9, 3.1, 6.6), tgt: V3(-0.45, 1.55, -0.2), fov: 38 },
  { name: 'valve-v', pos: V3(1.0, 1.75, 1.6), tgt: V3(0.38, 1.25, 0.0), fov: 38 },
  { name: 'tank-v', pos: V3(1.3, 2.2, 2.3), tgt: V3(-0.1, 1.9, -0.4), fov: 38 },
  // 세로 투어: 하단 카드가 화면 아래 절반을 덮으므로 장치를 위쪽 띠(헤더 아래)에 둔다
  { name: 'tour-v', pos: V3(0.9, 2.3, 6.6), tgt: V3(-0.45, 0.72, -0.2), fov: 38 },
];
const isPortrait = () => innerWidth / innerHeight < 0.9;
const heroShot = () => (isPortrait() ? SHOTS_VERTICAL[0] : SHOTS[0]);

let controls;
const CAM = { fly: null, cine: false, cineIdx: 0, cineT: 0 };
function buildCamera() {
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.minDistance = 0.9; controls.maxDistance = 9.5;
  controls.maxPolarAngle = Math.PI * 0.49; controls.screenSpacePanning = true;
  controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
  shot(heroShot());
}
function shot(s) {
  const S = typeof s === 'number' ? SHOTS[s] : s;
  CAM.fly = null;
  camera.position.copy(S.pos); camera.fov = S.fov || 34; camera.updateProjectionMatrix();
  controls.target.copy(S.tgt); camera.lookAt(S.tgt); controls.update();
}
function flyTo(s, dur = 3) {
  const S = typeof s === 'number' ? SHOTS[s] : s;
  CAM.fly = { p0: camera.position.clone(), t0: controls.target.clone(), f0: camera.fov, p1: S.pos.clone(), t1: S.tgt.clone(), f1: S.fov || 34, t: 0, dur };
}
function updateCamera(dt) {
  if (CAM.fly) {
    const F = CAM.fly; F.t += dt; const k = smooth(clamp(F.t / F.dur, 0, 1));
    camera.position.lerpVectors(F.p0, F.p1, k);
    // 곡선 비행: 중간에 살짝 들어 올림
    camera.position.y += Math.sin(k * Math.PI) * 0.18;
    controls.target.lerpVectors(F.t0, F.t1, k);
    camera.fov = lerp(F.f0, F.f1, k); camera.updateProjectionMatrix();
    if (F.t >= F.dur) CAM.fly = null;
  }
  if (CAM.cine) {
    CAM.cineT += dt;
    if (CAM.cineT >= 7.5) { CAM.cineT = 0; CAM.cineIdx = (CAM.cineIdx + 1) % SHOTS.length; flyTo(CAM.cineIdx, 3); }
    if (!CAM.fly) {   // 느린 공전
      const off = camera.position.clone().sub(controls.target);
      off.applyAxisAngle(V3(0, 1, 0), dt * 0.035);
      camera.position.copy(controls.target).add(off);
    }
  }
  // 방 밖으로 나가지 않게
  camera.position.x = Math.max(camera.position.x, WALL_X + 0.35);
  camera.position.z = Math.max(camera.position.z, WALL_Z + 0.35);
  camera.position.y = clamp(camera.position.y, 0.35, CEIL - 0.25);
  controls.update();
}
function setCinematic(on) {
  CAM.cine = on; CAM.cineT = 0;
  if (on) { CAM.cineIdx = 0; flyTo(heroShot(), 2.5); }
  UI && UI.syncButtons && UI.syncButtons();
}

// 히어로 구도 투영 탐색: 렌더링 없이 카메라 복제본으로 투영만 계산
function heroTargets() {
  const yn = nozzleY(S.h.tgt), ys = supplySurfaceY(S.H.tgt);
  return {
    compare: [
      V3(TANK.x, ys - 0.1, TANK.z), V3(TANK.x - TANK.w / 2, ys + 0.12, TANK.z), V3(TANK.x + TANK.w / 2, ys - 0.25, TANK.z),   // 공급 탱크
      V3(VALVE.x, DATUM + 0.2, RAM.z), V3(CHAMBER.x, DATUM + 0.45, CHAMBER.z), V3(RAM.x, DATUM - 0.07, RAM.z + 0.08),         // 펌프
      V3(DTANK.x, nozzleY(40) + 0.12, DTANK.z), V3(DTANK.x - DTANK.w / 2, yn - 0.25, DTANK.z), V3(DTANK.x + DTANK.w / 2, yn, DTANK.z), // 송출 탱크 (최대 높이까지)
    ],
    // 영웅 장치(공급 탱크·구동관·펌프·눈금 기둥·송출 탱크)의 바깥 점. 콘솔은 무대라서 넣지 않는다.
    extent: [V3(TANK.x - 0.25, TOP, TANK.z + 0.22), V3(TANK.x - 0.25, TOP, TANK.z - 0.22), V3(TANK.x - 0.05, 2.06, -0.7), V3(0.8, TOP, 0.25), V3(0.8, TOP, -0.1),
      V3(TOWER.x, 2.6, TOWER.z), V3(0.27, 2.46, DTANK.z), V3(1.52, 0.6, 0.64), V3(-0.3, 0.6, 0.64), V3(VALVE.x, DATUM + 0.35, RAM.z)],
    screens: [V3(0.5, 0.66, 0.62), V3(1.52, 0.66, 0.62), V3(1.0, 0.62, 0.66)],
  };
}
function hudRects(W, H) {
  const r = [];
  const L = document.getElementById('left').getBoundingClientRect();
  const P = document.getElementById('panel').getBoundingClientRect();
  const sx = W / innerWidth, sy = H / innerHeight;
  if (L.width) r.push({ x0: L.left * sx - 8, y0: 0, x1: L.right * sx + 8, y1: L.bottom * sy + 8 });
  if (P.width) r.push({ x0: P.left * sx - 8, y0: P.top * sy - 8, x1: W, y1: P.bottom * sy + 8 });
  return r;
}
function evalShot(cam, W, H, rects) {
  const T = heroTargets();
  const proj = (p) => { const v = p.clone().project(cam); return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, z: v.z }; };
  const inRect = (q) => rects.some((r) => q.x > r.x0 && q.x < r.x1 && q.y > r.y0 && q.y < r.y1);
  let ok = true, bad = 0;
  for (const p of T.compare) { const q = proj(p); if (q.x < 6 || q.x > W - 6 || q.y < 6 || q.y > H - 6 || q.z > 1 || inRect(q)) { ok = false; bad++; } }
  // 장치 면적: 바깥 점들의 화면 경계 상자 (화면으로 자름)
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of [...T.extent, ...T.compare]) { const q = proj(p); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); }
  if (x0 < 0 || y0 < 0 || x1 > W || y1 > H) ok = false;          // 영웅 장치는 잘리지 않게
  // 프레임에서 잘리는 물체: 콘솔 양 끝·앞모서리
  const cut = [V3(-1.78, 0.3, 0.5), V3(1.78, 0.3, 0.5), V3(-1.7, 0.5, 0.64), V3(1.7, 0.5, 0.64)].map(proj).filter((q) => q.x < 0 || q.x > W || q.y > H).length;
  const area = (Math.min(x1, W) - Math.max(x0, 0)) * (Math.min(y1, H) - Math.max(y0, 0)) / (W * H);
  const scr = T.screens.map(proj); const scrRight = scr.every((q) => q.x > W * 0.4 && q.x < W - 10 && q.y < H - 30 && q.y > 0);
  return { ok, bad, area, cut, scrRight };
}
function searchHero(W = innerWidth, H = innerHeight, portrait = isPortrait()) {
  const rects = hudRects(W, H);
  const cam = new THREE.PerspectiveCamera(34, W / H, 0.05, 60);
  let best = null;
  const fovs = portrait ? [36, 38] : [32, 34, 36, 38];
  for (const fov of fovs) for (let az = 6; az <= 58; az += 4) for (let el = 10; el <= 25; el += 2.5) for (const dist of portrait ? [5.0, 5.6, 6.2, 6.8, 7.4, 8.0] : [3.0, 3.3, 3.6, 3.9, 4.2, 4.6, 5.0]) for (const tx of [-0.5, -0.3, -0.1, 0.1]) for (const ty of [1.4, 1.55, 1.7, 1.85]) {
    const tgt = V3(tx, ty, -0.18);
    const a = az * Math.PI / 180, e = el * Math.PI / 180;
    cam.fov = fov; cam.aspect = W / H;
    cam.position.set(tgt.x + Math.sin(a) * Math.cos(e) * dist, tgt.y + Math.sin(e) * dist, tgt.z + Math.cos(a) * Math.cos(e) * dist);
    cam.lookAt(tgt); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    const r = evalShot(cam, W, H, rects);
    if (!r.ok || r.cut < 1 || !r.scrRight) continue;
    const score = -Math.abs(r.area - 0.7) + (r.area >= 0.6 && r.area <= 0.75 ? 1 : 0);
    if (!best || score > best.score) best = { score, fov, az, el, dist, tgt: tgt.toArray(), pos: cam.position.toArray().map((v) => +v.toFixed(3)), ...r };
  }
  return best;
}

// 가이드 투어 (퀘스트 지도의 6단계). 문장은 HUD 사전에서, 완료 판정은 물리 결과에서.
const TOUR = {
  i: -1, done: [], ctx: {},
  steps: [
    { id: 'start', shot: 1,
      enter() { restart(true); },
      check() { return SIM && SIM.cycles.length >= 1 && S.tSim > SIM.cycles[0].tEnd - 1e-6 && S.started; } },
    { id: 'pressure', shot: 2,
      enter() { setOverlay('P', true); S.slowmo = true; TOUR.ctx.seen = false; },
      check() { if (S.overlays.P && S.slowmo && S.sample && S.sample.phase === 'hammer') TOUR.ctx.seen = true; return TOUR.ctx.seen && S.sample.phase !== 'hammer'; } },
    { id: 'height', shot: 0,
      enter() { TOUR.ctx.h0 = S.h.tgt; TOUR.ctx.q0 = SIM.limit.q; TOUR.ctx.v0 = SIM.limit.VdBeat; TOUR.ctx.beats = 0; },
      check() { return Math.abs(S.h.tgt - TOUR.ctx.h0) >= 10 && S.beatsSinceSwap >= 2 && SIM.par.h === S.h.tgt; } },
    { id: 'valve', shot: 1,
      enter() { TOUR.ctx.q0 = SIM.limit.q; TOUR.ctx.qBest = bestFlowForWeight(S.H.tgt, S.h.tgt); },
      check() { return !SIM.limit.stalled && SIM.par.m === S.m.tgt && SIM.limit.q >= 0.9 * TOUR.ctx.qBest.q && S.beatsSinceSwap >= 1; } },
    { id: 'energy', shot: 0,
      enter() { TOUR.ctx.H0 = S.H.tgt; },
      check() { return Math.abs(S.H.tgt - TOUR.ctx.H0) >= 0.5 && SIM.par.H === S.H.tgt && S.beatsSinceSwap >= 1; } },
    { id: 'final', shot: 0,
      enter() { setCinematic(true); },
      check() { return true; } },
  ],
};
function bestFlowForWeight(H, h) {
  let best = { m: 0.4, q: 0 };
  for (let m = 0.1; m <= 0.9001; m += 0.05) { const s = PHYS.simulate({ H, h, m }, { record: false, maxCycles: 8, tMax: 20 }); if (s.limit.q > best.q) best = { m, q: s.limit.q }; }
  return best;
}
function tourGo(i) {
  if (i < 0 || i >= TOUR.steps.length) { tourEnd(); return; }
  TOUR.i = i; TOUR.ctx = {}; TOUR.passed = false;
  const st = TOUR.steps[i];
  if (st.shot != null && i < TOUR.steps.length - 1) { CAM.cine = false; flyTo(isPortrait() ? SHOTS_VERTICAL[3] : st.shot, 2.6); }
  st.enter && st.enter();
  UI.renderTour();
}
function tourEnd() { TOUR.i = -1; UI.renderTour(); }
function tourUpdate() {
  if (TOUR.i < 0 || TOUR.passed) return;
  const st = TOUR.steps[TOUR.i];
  if (st.check()) { TOUR.passed = true; TOUR.done[TOUR.i] = true; sfx('ding'); UI.renderTour(); }
}
