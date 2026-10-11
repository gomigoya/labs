// ==== 9 LIGHTS ====
const LIGHTS = {};
function buildLights() {
  const low = QUALITY.level === 'low';
  LIGHTS.hemi = new THREE.HemisphereLight(0xffe2c4, 0x2a1d14, 0.45); scene.add(LIGHTS.hemi);
  const key = new THREE.DirectionalLight(0xffc690, 2.2);
  key.position.set(-2.0, 4.8, 3.6); key.target.position.set(0, 1.0, -0.2);
  key.castShadow = true; key.shadow.mapSize.set(low ? 1024 : 2048, low ? 1024 : 2048);
  Object.assign(key.shadow.camera, { left: -3.4, right: 3.4, top: 3.4, bottom: -1.4, near: 0.5, far: 14 });
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 4;
  scene.add(key, key.target); LIGHTS.key = key;
  const win = new THREE.RectAreaLight(0xcfe6ff, 6, 1.5, 1.25);
  win.position.set(2.25, 1.9, WALL_Z + 0.06); win.lookAt(1.2, 1.3, 2.5); scene.add(win); LIGHTS.win = win;
  const pend = new THREE.SpotLight(0xffb36b, 14, 5, 0.85, 0.55, 2);
  pend.position.set(-0.95, 2.6, -0.05); pend.target.position.set(-0.6, TOP, -0.05);
  if (!low) { pend.castShadow = true; pend.shadow.mapSize.set(1024, 1024); pend.shadow.bias = -0.0006; pend.shadow.radius = 5; }
  scene.add(pend, pend.target); LIGHTS.pend = pend;
  const pendGlow = new THREE.PointLight(0xffb36b, 1.6, 2.6, 2); pendGlow.position.set(-0.95, 2.72, -0.05); scene.add(pendGlow);
  const fl = new THREE.PointLight(0xffb070, 7, 6, 2); fl.position.set(-2.75, 1.55, -1.9); scene.add(fl); LIGHTS.floor = fl;
  const led = new THREE.PointLight(0xffb36b, 1.8, 1.8, 2); led.position.set(WALL_X + 0.35, 1.86, -1.25); scene.add(led);
  const scr = new THREE.PointLight(0x7dd3fc, 0.5, 1.3, 2); scr.position.set(1.0, 0.86, 0.95); scene.add(scr);
  // 작업대 앞 보조광: 트랙과 수조를 밝힌다
  LIGHTS.studio = new THREE.Group();
  const sk = new THREE.SpotLight(0xfff1e0, 40, 9, 0.5, 0.6, 2); sk.position.set(2.4, 3.6, 3.2); sk.target.position.set(-0.2, 1.2, -0.2); sk.castShadow = !low; sk.shadow.mapSize.set(1024, 1024);
  const sf = new THREE.PointLight(0x9fd4ff, 6, 8, 2); sf.position.set(-3, 1.8, 2.6);
  const sr = new THREE.SpotLight(0xffb36b, 30, 8, 0.6, 0.5, 2); sr.position.set(-1.2, 3.0, -2.2); sr.target.position.set(0, 1.2, 0);
  LIGHTS.studio.add(sk, sk.target, sf, sr, sr.target); LIGHTS.studio.visible = false; scene.add(LIGHTS.studio);
  LIGHTS.room = [LIGHTS.hemi, key, win, pend, pendGlow, fl, led];
}

// ==== 10 PIPELINE ====
const PIPE = {};
// 마무리: 비네트 + 필름 입자 + 실험대 집중(실험 장치 바깥은 어둡고 흐리게: 화면 상자 + 깊이)
const FinishShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uVig: { value: 0.5 }, uGrain: { value: 0.022 },
    tDepth: { value: null }, uNear: { value: 0.05 }, uFar: { value: 60 }, uUseDepth: { value: 0 }, uFS: { value: 0 },
    uBox: { value: new THREE.Vector4(0.5, 0.5, 0.3, 0.3) }, uRange: { value: new THREE.Vector2(0, 100) }, uAsp: { value: 1.6 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `#include <packing>
    uniform sampler2D tDiffuse, tDepth; uniform float uTime, uVig, uGrain, uNear, uFar, uUseDepth, uFS, uAsp; uniform vec4 uBox; uniform vec2 uRange; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    float vz(vec2 p){ return -perspectiveDepthToViewZ(unpackRGBAToDepth(texture2D(tDepth, p)), uNear, uFar); }
    void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 d = vUv - 0.5; float r = length(d*vec2(1.15,1.0));
      if (uFS > 0.001) {
        vec2 q = max(abs(vUv - uBox.xy) - uBox.zw, 0.0); q.x *= uAsp;
        float k = smoothstep(0.015, 0.2, length(q));
        if (uUseDepth > 0.5) { float z = vz(vUv);
          k = max(k, max(smoothstep(uRange.y + 0.1, uRange.y + 0.85, z), smoothstep(uRange.x - 0.3, uRange.x - 1.0, z))); }
        k *= uFS; float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
        c.rgb = mix(c.rgb, mix(c.rgb, vec3(l), 0.75) * 0.26, k);
      }
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
  PIPE.gtao.output = GTAOPass.OUTPUT.Default; PIPE.gtao.blendIntensity = 0.85;
  PIPE.gtao.updateGtaoMaterial({ radius: 0.22, distanceExponent: 1.4, thickness: 1.0, scale: 1.0, samples: 8, distanceFallOff: 1, screenSpaceRadius: false });
  PIPE.gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
  PIPE.gtao.enabled = QUALITY.ao; composer.addPass(PIPE.gtao);
  PIPE.bokeh = new BokehPass(scene, camera, { focus: 4.0, aperture: 0.0012, maxblur: 0.005 });
  PIPE.bokeh.enabled = QUALITY.level !== 'low'; composer.addPass(PIPE.bokeh);
  PIPE.bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.5, 0.5, 0.9);
  if (QUALITY.level === 'low') PIPE.bloom.resolution.set(w / 2, h / 2);
  composer.addPass(PIPE.bloom);
  composer.addPass(new OutputPass());
  PIPE.finish = new ShaderPass(FinishShader); composer.addPass(PIPE.finish);
  // 집중 효과용 깊이: 흐림(bokeh)이 꺼져 있으면 따로 그린다
  PIPE.depthRT = new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, type: THREE.HalfFloatType });
  PIPE.depthMat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, blending: THREE.NoBlending });
  PIPE.composer = composer;
}
// 힘 화살표는 화면 효과 뒤에 그린다(깊이 무시: 자유 물체 도형처럼 늘 보이게)
function renderOverlays() {
  renderer.autoClear = false;
  renderer.clearDepth();
  renderer.render(overlayScene, camera);
  renderer.autoClear = true;
}
function setQuality(level) {
  QUALITY.level = level;
  const low = level === 'low';
  QUALITY.ao = !low; PIPE.gtao.enabled = !low; PIPE.bokeh.enabled = !low;
  QUALITY.pr = low ? 1 : 1.6;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, QUALITY.pr));
  onResize();
}

// ==== 11 CAMERA / SHOTS ====
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const SHOTS = [
  { name: 'hero', pos: V3(2.3, 1.85, 1.45), tgt: V3(-0.3, 1.1, -0.1), fov: 32 },
  { name: 'hang', pos: V3(-0.55, 1.62, 0.75), tgt: V3(-1.0, 1.35, -0.2), fov: 36 },
  { name: 'beaker', pos: V3(-0.72, 1.3, 0.42), tgt: V3(-1.0, 1.22, -0.2), fov: 34 },
  { name: 'track', pos: V3(0.75, 1.55, 1.45), tgt: V3(0.48, 1.0, 0.1), fov: 36 },
  { name: 'top', pos: V3(0.2, 3.1, 1.25), tgt: V3(0.1, 1.0, -0.05), fov: 38 },
  { name: 'console', pos: V3(0.75, 1.3, 1.85), tgt: V3(0.4, 0.74, 0.5), fov: 34 },
];
const SHOTS_VERTICAL = [
  { name: 'hero-v', pos: V3(0.6, 2.4, 3.9), tgt: V3(0.0, 1.05, -0.05), fov: 42 },
  { name: 'hang-v', pos: V3(-0.6, 1.7, 1.0), tgt: V3(-1.0, 1.3, -0.2), fov: 42 },
  { name: 'track-v', pos: V3(0.5, 1.75, 1.75), tgt: V3(0.45, 1.0, 0.1), fov: 42 },
];
const SHOT_IDX = { hero: 0, hang: 1, beaker: 2, track: 3, top: 4, console: 5 };
const isPortrait = () => innerWidth / innerHeight < 0.9;
const heroShot = () => (isPortrait() ? SHOTS_VERTICAL[0] : SHOTS[0]);
const KID_SHOTS = { track: { pos: V3(0.45, 2.55, 1.3), tgt: V3(0.45, 0.99, 0.08), fov: 40 }, hang: { pos: V3(-0.64, 1.68, 1.66), tgt: V3(-1.1, 1.34, -0.2), fov: 38 }, hero: { pos: V3(0.3, 2.6, 3.3), tgt: V3(0.1, 1.05, -0.1), fov: 42 } };
// 쉬운 모드: 퀘스트 카드가 화면 일부를 덮으므로 화면 중심을 카드 바깥 빈 곳으로 옮긴다
// (넓은 화면은 카드 오른쪽, 좁은 화면은 위쪽 진행 지도와 아래 카드 사이)
function applyViewOffset() {
  const W = innerWidth, H = innerHeight, L = document.getElementById('left'), kid = S.mode === 'kid';
  const dx = kid && W > 980 && L ? Math.max(0, L.getBoundingClientRect().right * 0.5 - 10) : 0;
  const dy = kid && W <= 980 ? Math.max(0, H / 2 - (96 + H * 0.42) / 2) : 0;
  if (dx > 0) { camera.aspect = (W + 2 * dx) / H; camera.setViewOffset(W + 2 * dx, H, 0, 0, W, H); }
  else if (dy > 0) { camera.aspect = W / (H + 2 * dy); camera.setViewOffset(W, H + 2 * dy, 0, 2 * dy, W, H); }
  else { camera.aspect = W / H; camera.clearViewOffset(); }
  camera.updateProjectionMatrix();
}
const KID_SHOTS_V = { track: { pos: V3(0.45, 3.3, 3.0), tgt: V3(0.45, 0.99, 0.08), fov: 62 }, hang: { pos: V3(-0.9, 1.56, 3.0), tgt: V3(-1.08, 1.42, -0.2), fov: 52 }, hero: { pos: V3(0.6, 3.0, 4.6), tgt: V3(0.0, 1.05, -0.1), fov: 62 } };
const stationShot = (name) => (S.mode === 'kid' && KID_SHOTS[name]) ? (isPortrait() ? KID_SHOTS_V : KID_SHOTS)[name] : name === 'hero' ? heroShot() : (isPortrait() ? SHOTS_VERTICAL[name === 'track' ? 2 : name === 'hero' ? 0 : 1] : SHOTS[SHOT_IDX[name]]);

let controls;
const CAM = { fly: null, cine: false, cineIdx: 0, cineT: 0 };
function buildCamera() {
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.minDistance = 0.35; controls.maxDistance = 8;
  controls.maxPolarAngle = Math.PI * 0.49; controls.screenSpacePanning = true;
  controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
  shot(heroShot());
}
function shot(s) {
  const Sh = typeof s === 'number' ? SHOTS[s] : s;
  CAM.fly = null;
  camera.position.copy(Sh.pos); camera.fov = Sh.fov || 34; camera.updateProjectionMatrix();
  controls.target.copy(Sh.tgt); camera.lookAt(Sh.tgt); controls.update();
}
function flyTo(s, dur = 2.4) {
  const Sh = typeof s === 'number' ? SHOTS[s] : s;
  CAM.fly = { p0: camera.position.clone(), t0: controls.target.clone(), f0: camera.fov, p1: Sh.pos.clone(), t1: Sh.tgt.clone(), f1: Sh.fov || 34, t: 0, dur };
}
function updateCamera(dt) {
  if (CAM.fly) {
    const F = CAM.fly; F.t += dt; const k = smooth(clamp(F.t / F.dur, 0, 1));
    camera.position.lerpVectors(F.p0, F.p1, k);
    camera.position.y += Math.sin(k * Math.PI) * 0.12;
    controls.target.lerpVectors(F.t0, F.t1, k);
    camera.fov = lerp(F.f0, F.f1, k); camera.updateProjectionMatrix();
    if (F.t >= F.dur) CAM.fly = null;
  }
  if (CAM.cine) {
    CAM.cineT += dt;
    if (CAM.cineT >= 7.5) { CAM.cineT = 0; CAM.cineIdx = (CAM.cineIdx + 1) % SHOTS.length; flyTo(CAM.cineIdx, 3); }
    if (!CAM.fly) { const off = camera.position.clone().sub(controls.target); off.applyAxisAngle(V3(0, 1, 0), dt * 0.035); camera.position.copy(controls.target).add(off); }
  }
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
function hudRects(W, H) {
  const r = [];
  const L = document.getElementById('left').getBoundingClientRect();
  const P = document.getElementById('panel').getBoundingClientRect();
  const sx = W / innerWidth, sy = H / innerHeight;
  if (L.width) r.push({ x0: L.left * sx - 8, y0: 0, x1: L.right * sx + 8, y1: L.bottom * sy + 8 });
  if (P.width) r.push({ x0: P.left * sx - 8, y0: P.top * sy - 8, x1: W, y1: P.bottom * sy + 8 });
  return r;
}

// 실험대 집중: 지금 실험하는 장치(쉬운 모드) 또는 작업대 전체(자세히 모드)만 밝게 남긴다
const FBOX = {
  track: [V3(TRK.x0 - 0.05, TRK_Y - 0.03, TRK.z - 0.14), V3(TRK.x1 + 0.05, TRK_Y + 0.26, TRK.z + 0.14)],
  hang: [V3(HS.rodX - 0.07, TOP - 0.01, HS.z - 0.17), V3(HS.x + 0.2, TOP + HS.armY + 0.07, HS.z + 0.17)],
};
const FOC = { s: 0, p: new THREE.Vector3(), f: new THREE.Vector3(), w: new THREE.Vector3(), cc: new THREE.Color() };
function updateFocus(dt) {
  const u = PIPE.finish.uniforms, kid = S.mode === 'kid', F = FOC;
  const bx = kid && KID.missions[KID.i]?.shot !== 'hero' && KID.i < KID.missions.length ? [FBOX[S.station]] : [FBOX.track, FBOX.hang];
  camera.getWorldDirection(F.f);
  let x0 = 9, y0 = 9, x1 = -9, y1 = -9, n = 1e9, f = 0, ok = 0;
  for (const [a, b] of bx) for (let i = 0; i < 8; i++) {
    F.p.set(i & 1 ? b.x : a.x, i & 2 ? b.y : a.y, i & 4 ? b.z : a.z);
    const dz = F.w.copy(F.p).sub(camera.position).dot(F.f); if (dz < camera.near) continue;
    n = Math.min(n, dz); f = Math.max(f, dz); F.p.project(camera); ok++;
    const sx = F.p.x * 0.5 + 0.5, sy = F.p.y * 0.5 + 0.5;
    x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
  }
  const want = ok < 4 || S.view === 'studio' || document.body.classList.contains('hide-ui') && !kid ? 0 : kid ? 0.88 : 0.65;
  const k = 1 - Math.exp(-dt * 5);
  F.s += (want - F.s) * k; u.uFS.value = F.s;
  if (ok >= 4) {
    const B = u.uBox.value, pad = 0.015;
    B.x += ((x0 + x1) / 2 - B.x) * k; B.y += ((y0 + y1) / 2 - B.y) * k;
    B.z += (Math.max(0.04, (x1 - x0) / 2 + pad) - B.z) * k; B.w += (Math.max(0.04, (y1 - y0) / 2 + pad) - B.w) * k;
    u.uRange.value.set(n, f);
  }
  u.uAsp.value = innerWidth / innerHeight; u.uNear.value = camera.near; u.uFar.value = camera.far;
  u.uUseDepth.value = F.s > 0.01 ? 1 : 0;
  if (!F.s) return;
  if (PIPE.bokeh.enabled) { u.tDepth.value = PIPE.bokeh.uniforms.tDepth.value; return; }
  const ov = scene.overrideMaterial, bg = scene.background;
  scene.overrideMaterial = PIPE.depthMat; scene.background = null;
  renderer.getClearColor(FOC.cc); const ca = renderer.getClearAlpha();
  renderer.setRenderTarget(PIPE.depthRT); renderer.setClearColor(0xffffff, 1); renderer.clear(); renderer.render(scene, camera);
  renderer.setRenderTarget(null); renderer.setClearColor(FOC.cc, ca);
  scene.overrideMaterial = ov; scene.background = bg;
  u.tDepth.value = PIPE.depthRT.texture;
}
