// ==== 2 SCENE / RENDERER ====
const QS = new URLSearchParams(location.search);
const LANG = QS.get('lang') === 'en' ? 'en' : 'ko';
document.documentElement.lang = LANG;
const SITE = window.__SITE__ || {};
const QUALITY = { level: (QS.get('lite') === '1' || SITE.quality === 'low') ? 'low' : 'high', ao: true, pr: 1.6 };
if (QUALITY.level === 'low') { QUALITY.ao = false; QUALITY.pr = 1; }

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261011);
const rr = (a, b) => a + (b - a) * rand();
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);

const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, QUALITY.pr));
renderer.setSize(innerWidth, innerHeight, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.86;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.autoUpdate = false; // 그림자는 정적에 가깝다: update()에서 3프레임마다, 움직일 때는 매 프레임 갱신
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x221b16);
scene.fog = new THREE.Fog(0x2a221c, 11, 26);           // 시작 거리 > 카메라~뒷벽 거리
const overlayScene = new THREE.Scene();                  // 설명 오버레이: DoF 뒤에 깊이 테스트로 합성
const camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, 0.05, 60);
camera.position.set(3.2, 2.1, 5.0);
RectAreaLightUniformsLib.init();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.36;
const LAYER_OCC = 1;                                      // 오버레이 깊이 판정용 가림 물체
const MAX_ANISO = renderer.capabilities.getMaxAnisotropy();

const ROOT = new THREE.Group(); scene.add(ROOT);
const ROOM = new THREE.Group(); ROOT.add(ROOM);
const RIG = new THREE.Group(); ROOT.add(RIG);             // 콘솔 + 장치

// ==== 3 KIT (절차적 부품 함수) ====
const MAT = {
  graphite: new THREE.MeshStandardMaterial({ color: 0x2c2a28, roughness: 0.62, metalness: 0.55 }),
  graphiteL: new THREE.MeshStandardMaterial({ color: 0x3d3a37, roughness: 0.58, metalness: 0.5 }),
  graphiteD: new THREE.MeshStandardMaterial({ color: 0x1d1c1b, roughness: 0.7, metalness: 0.45 }),
  paint: new THREE.MeshStandardMaterial({ color: 0x45413c, roughness: 0.72, metalness: 0.25 }),
  brass: new THREE.MeshStandardMaterial({ color: 0xc9a15b, roughness: 0.3, metalness: 1 }),
  brassD: new THREE.MeshStandardMaterial({ color: 0x9c7a3e, roughness: 0.38, metalness: 1 }),
  copper: new THREE.MeshStandardMaterial({ color: 0xc27a4e, roughness: 0.34, metalness: 1 }),
  chrome: new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.14, metalness: 1 }),
  iron: new THREE.MeshStandardMaterial({ color: 0x3a3532, roughness: 0.55, metalness: 0.6 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x1a1918, roughness: 0.92, metalness: 0 }),
  slot: new THREE.MeshStandardMaterial({ color: 0x0c0b0a, roughness: 0.9, metalness: 0.2 }),
  woodD: new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.66, metalness: 0 }),
  woodL: new THREE.MeshStandardMaterial({ color: 0x8a6444, roughness: 0.62, metalness: 0 }),
  white: new THREE.MeshStandardMaterial({ color: 0xd8d0c4, roughness: 0.6, metalness: 0 }),
  terracotta: new THREE.MeshStandardMaterial({ color: 0xa65a3a, roughness: 0.85, metalness: 0, flatShading: true }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x4f7a43, roughness: 0.8, metalness: 0, flatShading: true }),
  leaf2: new THREE.MeshStandardMaterial({ color: 0x6d9a52, roughness: 0.8, metalness: 0, flatShading: true }),
  glass: QUALITY.level === 'low'
    ? new THREE.MeshStandardMaterial({ color: 0xcfe6ef, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.18, depthWrite: false })
    : // 투과(transmission)는 장면을 한 번 더 그려서 프레임당 약 5 ms가 든다. 반사·클리어코트로 유리감을 낸다.
      new THREE.MeshPhysicalMaterial({ color: 0xdcecf2, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.16, clearcoat: 1, clearcoatRoughness: 0.04, depthWrite: false, envMapIntensity: 1.5 }),
  glassThin: new THREE.MeshStandardMaterial({ color: 0xcfe6ef, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.12, depthWrite: false }),
  water: new THREE.MeshStandardMaterial({ color: 0x2f8fb4, roughness: 0.12, metalness: 0, transparent: true, opacity: 0.62, emissive: 0x0b3a4a, emissiveIntensity: 0.6, depthWrite: false }),
};

function shadowify(o, cast = true, recv = true) {
  o.traverse((m) => { if (m.isMesh) { m.castShadow = cast; m.receiveShadow = recv; } });
  return o;
}
// 오버레이 깊이 판정에 쓰는 불투명 물체 표시 (유리·물 같은 투명 재질은 제외: 그 안의 입자가 보여야 한다)
function occluder(o) { o.traverse((m) => { if (m.isMesh && !m.material.transparent && !m.isInstancedMesh) m.layers.enable(LAYER_OCC); }); return o; }

function canvasTex(w, h, draw, opts = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = opts.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.anisotropy = MAX_ANISO;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(opts.repeat[0], opts.repeat[1]); }
  t.userData.canvas = c; t.userData.ctx = ctx;
  return t;
}
const FONT = { head: '800 {s}px Outfit, "Noto Sans KR", sans-serif', mono: '500 {s}px "DM Mono", monospace', sans: '500 {s}px "Noto Sans KR", sans-serif' };
const font = (k, s) => FONT[k].replace('{s}', s);

function roundedPanel(w, h, d, r, mat, seg = 4) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4)), mat);
  m.castShadow = m.receiveShadow = true;
  return m;
}
function roundedRectShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
// 베벨 테두리 (가운데가 빈 액자형)
function bevelFrame(w, h, t, depth, mat, r = 0.01) {
  const outer = roundedRectShape(w, h, r + t * 0.5);
  const hole = roundedRectShape(w - 2 * t, h - 2 * t, r);
  outer.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(outer, { depth, bevelEnabled: true, bevelThickness: Math.min(0.004, depth * 0.4), bevelSize: Math.min(0.004, t * 0.3), bevelSegments: 3, curveSegments: 8 });
  g.translate(0, 0, -depth / 2);
  const m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true;
  return m;
}
const _screwHead = new THREE.LatheGeometry([new THREE.Vector2(0, 0.0032), new THREE.Vector2(0.55, 0.003), new THREE.Vector2(0.85, 0.002), new THREE.Vector2(1, 0)].map((p) => new THREE.Vector2(p.x * 0.007, p.y)), 16);
_screwHead.rotateX(Math.PI / 2);
const _screwSlot = new THREE.BoxGeometry(0.0105, 0.0016, 0.0016);
function screw(mat = MAT.chrome, scale = 1, rot = 0) {
  const g = new THREE.Group();
  const head = new THREE.Mesh(_screwHead, mat); g.add(head);
  const slot = new THREE.Mesh(_screwSlot, MAT.slot); slot.position.z = 0.0028; slot.rotation.z = rot; g.add(slot);
  g.scale.setScalar(scale);
  return g;
}
function ventSlits(w, h, n, mat = MAT.slot) {
  const g = new THREE.Group();
  const sh = h / (n * 1.8);
  for (let i = 0; i < n; i++) {
    const s = roundedPanel(w, sh, 0.004, sh * 0.49, mat, 2);
    s.position.y = (i - (n - 1) / 2) * (h / n);
    s.castShadow = false;
    g.add(s);
  }
  return g;
}
// 각인 명판: 황동 판 + 오목하게 새긴 글자 텍스처
function engravedPlate(text, w, h, opts = {}) {
  const g = new THREE.Group();
  const plate = roundedPanel(w, h, opts.depth || 0.006, Math.min(h * 0.3, 0.01), opts.mat || MAT.brass, 3);
  g.add(plate);
  const px = 2048, py = Math.round(px * h / w);
  const tex = canvasTex(px, py, (c, W, H) => {
    c.clearRect(0, 0, W, H);
    const size = Math.round(H * (opts.size || 0.42));
    c.font = font(opts.font || 'mono', size);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    if (opts.letter) c.letterSpacing = `${size * opts.letter}px`;
    const lines = Array.isArray(text) ? text : [text];
    lines.forEach((ln, i) => {
      const y = H / 2 + (i - (lines.length - 1) / 2) * size * 1.25;
      c.fillStyle = 'rgba(255,240,210,0.55)'; c.fillText(ln, W / 2 + 2, y + 2);
      c.fillStyle = 'rgba(40,24,8,0.92)'; c.fillText(ln, W / 2, y);
    });
    if (opts.rule) { c.fillStyle = 'rgba(40,24,8,0.6)'; c.fillRect(W * 0.03, H * 0.12, W * 0.94, 2); c.fillRect(W * 0.03, H * 0.88, W * 0.94, 2); }
  });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.98, h * 0.94), new THREE.MeshStandardMaterial({ map: tex, transparent: true, metalness: 0.7, roughness: 0.45, depthWrite: false }));
  face.position.z = (opts.depth || 0.006) / 2 + 0.0004;
  g.add(face);
  if (opts.screws !== false) {
    for (const sx of [-1, 1]) { const s = screw(MAT.brassD, 0.9); s.position.set(sx * (w / 2 - h * 0.32), 0, (opts.depth || 0.006) / 2); g.add(s); }
  }
  return g;
}

// 다이얼: 둥근 노브 + 값만큼 채워지는 발광 원호. 270° 범위, 왼쪽 아래(최소) → 오른쪽 아래(최대)
const ARC_START = Math.PI * 1.25, ARC_SWEEP = Math.PI * 1.5;
function knobWithArc(opts) {
  const R = opts.radius || 0.07;
  const g = new THREE.Group();
  // 바닥 판 (눈금·숫자 인쇄)
  const face = canvasTex(512, 512, (c, W) => {
    c.fillStyle = '#1b1a19'; c.beginPath(); c.arc(W / 2, W / 2, W / 2, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.06)'; c.lineWidth = 3; c.beginPath(); c.arc(W / 2, W / 2, W * 0.47, 0, Math.PI * 2); c.stroke();
    const ticks = opts.ticks || [];
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let i = 0; i <= 40; i++) {
      const f = i / 40, a = ARC_START - f * ARC_SWEEP;
      const major = i % 10 === 0;
      const r0 = W * (major ? 0.33 : 0.355), r1 = W * 0.385;
      c.strokeStyle = major ? 'rgba(240,232,220,0.85)' : 'rgba(240,232,220,0.35)'; c.lineWidth = major ? 4 : 2;
      c.beginPath(); c.moveTo(W / 2 + Math.cos(a) * r0, W / 2 - Math.sin(a) * r0); c.lineTo(W / 2 + Math.cos(a) * r1, W / 2 - Math.sin(a) * r1); c.stroke();
    }
    c.font = font('mono', 30); c.fillStyle = 'rgba(240,232,220,0.8)';
    for (const [f, txt] of ticks) { const a = ARC_START - f * ARC_SWEEP; c.fillText(txt, W / 2 + Math.cos(a) * W * 0.28, W / 2 - Math.sin(a) * W * 0.28); }
    c.font = font('mono', 26); c.fillStyle = 'rgba(255,179,107,0.9)'; c.fillText(opts.label || '', W / 2, W * 0.86);
  });
  const base = new THREE.Mesh(new THREE.CircleGeometry(R * 2.05, 64), new THREE.MeshStandardMaterial({ map: face, roughness: 0.6, metalness: 0.2 }));
  base.position.z = 0.001; g.add(base);
  // 발광 원호
  const arcMat = new THREE.ShaderMaterial({
    uniforms: { uFill: { value: 0.5 }, uColor: { value: new THREE.Color(opts.color || 0x7dd3fc) }, uGain: { value: 3.0 } },
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform float uFill; uniform vec3 uColor; uniform float uGain; varying vec2 vP;
      void main(){ float a = atan(vP.y, vP.x); float s = ${ARC_START.toFixed(6)};
        float d = s - a; if (d < 0.0) d += 6.2831853; float f = d / ${ARC_SWEEP.toFixed(6)};
        if (f > 1.0) discard;
        float on = step(f, uFill);
        vec3 c = mix(vec3(0.06,0.07,0.08), uColor * uGain, on);
        float edge = smoothstep(0.0, 0.012, abs(f - uFill)); c += uColor * (1.0 - edge) * on * 1.5;
        gl_FragColor = vec4(c, 1.0); }`,
    toneMapped: false,
  });
  const arc = new THREE.Mesh(new THREE.RingGeometry(R * 1.62, R * 1.82, 128, 1, ARC_START - ARC_SWEEP, ARC_SWEEP), arcMat);
  arc.position.z = 0.002; g.add(arc);
  // 노브 본체 (선반 단면 → 회전체)
  const prof = [[0, 0], [R * 0.98, 0], [R, R * 0.06], [R, R * 0.62], [R * 0.96, R * 0.7], [R * 0.82, R * 0.74], [R * 0.78, R * 0.8], [0, R * 0.82]].map(([x, y]) => new THREE.Vector2(x, y));
  const kg = new THREE.LatheGeometry(prof, 48); kg.rotateX(Math.PI / 2);
  const knob = new THREE.Group();
  const body = new THREE.Mesh(kg, opts.knobMat || MAT.graphiteL); body.castShadow = true; knob.add(body);
  // 손잡이 홈(널링)
  const ridge = new THREE.BoxGeometry(R * 0.06, R * 0.06, R * 0.5);
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const m = new THREE.Mesh(ridge, MAT.graphiteD);
    m.position.set(Math.cos(a) * R * 0.99, Math.sin(a) * R * 0.99, R * 0.33); m.rotation.z = a; knob.add(m);
  }
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.76, R * 0.76, 0.003, 48).rotateX(Math.PI / 2), MAT.chrome);
  cap.position.z = R * 0.82; knob.add(cap);
  const ind = new THREE.Mesh(new THREE.BoxGeometry(R * 0.08, R * 0.5, 0.004), new THREE.MeshBasicMaterial({ color: new THREE.Color(opts.color || 0x7dd3fc).multiplyScalar(3), toneMapped: false }));
  ind.position.set(0, R * 0.4, R * 0.83); knob.add(ind);
  g.add(knob);
  g.userData = { knob, arcMat, R };
  const set = (f) => { arcMat.uniforms.uFill.value = f; knob.rotation.z = ARC_START - f * ARC_SWEEP - Math.PI / 2; };
  return { group: g, knob, set, arcMat };
}

// LED 트랙 물리 슬라이더
function ledSlider(opts) {
  const len = opts.length || 0.5, n = opts.n || 24;
  const g = new THREE.Group();
  const track = roundedPanel(len + 0.05, 0.05, 0.012, 0.006, MAT.graphiteD, 3); g.add(track);
  const groove = roundedPanel(len, 0.008, 0.004, 0.0039, MAT.slot, 2); groove.position.set(0, 0.008, 0.006); g.add(groove);
  const ledGeo = new THREE.BoxGeometry(len / n * 0.62, 0.008, 0.004);
  const ledMat = new THREE.MeshBasicMaterial({ toneMapped: false });
  const leds = new THREE.InstancedMesh(ledGeo, ledMat, n);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < n; i++) { dummy.position.set(-len / 2 + (i + 0.5) * len / n, -0.012, 0.0065); dummy.updateMatrix(); leds.setMatrixAt(i, dummy.matrix); leds.setColorAt(i, new THREE.Color(0x111111)); }
  g.add(leds);
  const handle = new THREE.Group();
  const hb = roundedPanel(0.03, 0.05, 0.03, 0.008, MAT.chrome, 4); hb.position.z = 0.02; handle.add(hb);
  for (let i = -2; i <= 2; i++) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.002, 0.002), MAT.graphiteD); r.position.set(0, i * 0.007, 0.0355); handle.add(r); }
  const tri = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.012, 3), MAT.brass); tri.rotation.z = 0; tri.position.set(0, -0.038, 0.008); handle.add(tri);
  g.add(handle);
  const colOn = new THREE.Color(opts.color || 0xffb36b).multiplyScalar(2.6), colOff = new THREE.Color(0x15130f);
  const set = (f) => {
    handle.position.x = -len / 2 + f * len;
    for (let i = 0; i < n; i++) leds.setColorAt(i, (i + 0.5) / n <= f ? colOn : colOff);
    leds.instanceColor.needsUpdate = true;
  };
  return { group: g, handle: hb, set, len };
}

// 그래프 화면: 어두운 화면 + 격자 + 발광 곡선 (drawFn이 매번 다시 그림)
function graphScreen(w, h, drawFn, pxW = 768) {
  const g = new THREE.Group();
  const bez = roundedPanel(w + 0.04, h + 0.04, 0.02, 0.012, MAT.graphiteD, 3); bez.position.z = -0.006; g.add(bez);
  const frame = bevelFrame(w + 0.03, h + 0.03, 0.012, 0.008, MAT.graphiteL, 0.008); frame.position.z = 0.006; g.add(frame);
  const pxH = Math.round(pxW * h / w);
  const tex = canvasTex(pxW, pxH, () => {});
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  scr.position.z = 0.005; g.add(scr);
  const cover = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.06, roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.22, depthWrite: false }));
  cover.position.z = 0.0075; g.add(cover);
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const s = screw(MAT.chrome, 0.75, sx * sy * 0.6); s.position.set(sx * (w / 2 + 0.012), sy * (h / 2 + 0.012), 0.012); g.add(s); }
  const ctx = tex.userData.ctx;
  const redraw = (...args) => { drawFn(ctx, pxW, pxH, ...args); tex.needsUpdate = true; };
  return { group: g, ctx, tex, redraw, screen: scr };
}

// 황동 테두리 큰 버튼 (재생/일시정지)
function bigButton(r = 0.05) {
  const g = new THREE.Group();
  const ringProf = [[r * 0.98, 0], [r * 1.3, 0], [r * 1.34, r * 0.12], [r * 1.28, r * 0.22], [r * 1.02, r * 0.22], [r * 0.98, r * 0.1]].map(([x, y]) => new THREE.Vector2(x, y));
  const ring = new THREE.Mesh(new THREE.LatheGeometry(ringProf, 64).rotateX(Math.PI / 2), MAT.brass); ring.castShadow = true; g.add(ring);
  const icon = canvasTex(256, 256, () => {});
  const capProf = [[0, r * 0.42], [r * 0.6, r * 0.4], [r * 0.88, r * 0.33], [r * 0.96, r * 0.2], [r * 0.96, 0]].map(([x, y]) => new THREE.Vector2(x, y));
  const capGeo = new THREE.LatheGeometry(capProf.reverse(), 48).rotateX(Math.PI / 2);
  const cap = new THREE.Mesh(capGeo, new THREE.MeshStandardMaterial({ color: 0x2a2523, roughness: 0.85 })); cap.castShadow = true; g.add(cap);
  const top = new THREE.Mesh(new THREE.CircleGeometry(r * 0.62, 48), new THREE.MeshBasicMaterial({ map: icon, transparent: true, toneMapped: false }));
  top.position.z = r * 0.425; cap.add(top);
  const setIcon = (playing, pressed = 0) => {
    const c = icon.userData.ctx; c.clearRect(0, 0, 256, 256);
    c.fillStyle = playing ? 'rgba(255,190,120,1)' : 'rgba(140,220,255,1)';
    c.shadowColor = c.fillStyle; c.shadowBlur = 18;
    if (playing) { c.fillRect(78, 64, 34, 128); c.fillRect(144, 64, 34, 128); }
    else { c.beginPath(); c.moveTo(90, 60); c.lineTo(196, 128); c.lineTo(90, 196); c.closePath(); c.fill(); }
    icon.needsUpdate = true;
    cap.position.z = -pressed * r * 0.12;
  };
  setIcon(true);
  return { group: g, cap, setIcon };
}
function brassTrim(w, r = 0.006, mat = MAT.brass) {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, w, 4, 12).rotateZ(Math.PI / 2), mat); m.castShadow = true; return m;
}
function rubberFoot(r = 0.03) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.1, r * 0.7, 20), MAT.rubber); m.castShadow = m.receiveShadow = true; return m;
}
// 램프와 전구 (전구는 발광 재질, 빛은 호출한 쪽에서 PointLight를 붙인다)
function lampWithBulb(kind) {
  const g = new THREE.Group();
  const bulbMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffc58a).multiplyScalar(4.2), toneMapped: false });
  if (kind === 'pendant') {
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.9, 6), MAT.rubber); cord.position.y = 0.45 + 0.12; g.add(cord);
    const shadeProf = [[0.03, 0.14], [0.05, 0.12], [0.12, 0.04], [0.2, 0], [0.198, -0.006], [0.115, 0.032], [0.045, 0.11], [0.025, 0.13]].map(([x, y]) => new THREE.Vector2(x, y));
    const shade = new THREE.Mesh(new THREE.LatheGeometry(shadeProf, 48), new THREE.MeshStandardMaterial({ color: 0x2f3b36, roughness: 0.5, metalness: 0.6, side: THREE.DoubleSide })); g.add(shade);
    const inner = new THREE.Mesh(new THREE.LatheGeometry(shadeProf.map((p) => new THREE.Vector2(p.x * 0.985, p.y - 0.002)), 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd7a8).multiplyScalar(1.3), side: THREE.BackSide, toneMapped: false })); g.add(inner);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 24, 16), bulbMat); bulb.position.y = 0.02; g.add(bulb);
    const trim = new THREE.Mesh(new THREE.TorusGeometry(0.199, 0.004, 8, 64).rotateX(Math.PI / 2), MAT.brass); g.add(trim);
    g.userData.bulb = bulb;
  } else {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.03, 32), MAT.graphite); base.position.y = 0.015; g.add(base);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.45, 12), MAT.brass); pole.position.y = 0.75; g.add(pole);
    const shadeProf = [[0.07, 0], [0.2, 0.26], [0.205, 0.27], [0.075, 0.01]].map(([x, y]) => new THREE.Vector2(x, y));
    const shade = new THREE.Mesh(new THREE.LatheGeometry(shadeProf, 40), new THREE.MeshStandardMaterial({ color: 0xe9d7bd, roughness: 0.9, side: THREE.DoubleSide, emissive: 0xffb36b, emissiveIntensity: 0.35 }));
    shade.position.y = 1.42; g.add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 20, 14), bulbMat); bulb.position.y = 1.5; g.add(bulb);
    g.userData.bulb = bulb;
  }
  return shadowify(g, true, false);
}
function ledStrip(len, color = 0xffb36b, gain = 2.4) {
  return new THREE.Mesh(new THREE.BoxGeometry(len, 0.008, 0.012), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(gain), toneMapped: false }));
}
function glassJar(r, h, tint, seed = 1) {
  const g = new THREE.Group();
  const prof = [[0, 0], [r * 0.92, 0], [r, r * 0.12], [r, h * 0.82], [r * 0.7, h * 0.92], [r * 0.62, h]].map(([x, y]) => new THREE.Vector2(x, y));
  const jar = new THREE.Mesh(new THREE.LatheGeometry(prof, 28), MAT.glassThin); g.add(jar);
  const fill = 0.35 + (seed % 5) * 0.1;
  const liq = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.9, h * fill * 0.8, 20), new THREE.MeshStandardMaterial({ color: tint, roughness: 0.25, transparent: true, opacity: 0.7, flatShading: true }));
  liq.position.y = h * fill * 0.4 + 0.004; g.add(liq);
  const cork = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.6, r * 0.55, h * 0.12, 14), new THREE.MeshStandardMaterial({ color: 0x9c7650, roughness: 0.95, flatShading: true }));
  cork.position.y = h + h * 0.04; g.add(cork);
  return shadowify(g, true, true);
}
function plant(seed, scale = 1) {
  const R = mulberry32(seed);
  const g = new THREE.Group();
  const potProf = [[0, 0], [0.09, 0], [0.11, 0.02], [0.125, 0.16], [0.135, 0.17], [0.135, 0.19], [0.12, 0.19], [0.11, 0.18]].map(([x, y]) => new THREE.Vector2(x, y));
  const pot = new THREE.Mesh(new THREE.LatheGeometry(potProf, 9), MAT.terracotta); g.add(pot);
  const soil = new THREE.Mesh(new THREE.CircleGeometry(0.115, 9).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x3a2a1e, roughness: 1, flatShading: true })); soil.position.y = 0.175; g.add(soil);
  const nLeaves = 9 + Math.floor(R() * 6);
  for (let i = 0; i < nLeaves; i++) {
    const len = 0.22 + R() * 0.28;
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.035 + R() * 0.02, len, 4, 1), R() > 0.5 ? MAT.leaf : MAT.leaf2);
    const a = R() * Math.PI * 2, tilt = 0.25 + R() * 0.75;
    leaf.position.set(Math.cos(a) * 0.03, 0.18 + len * 0.45 * Math.cos(tilt), Math.sin(a) * 0.03);
    leaf.rotation.set(Math.sin(a) * tilt, R() * 3, -Math.cos(a) * tilt);
    leaf.scale.z = 0.35;
    g.add(leaf);
  }
  g.scale.setScalar(scale);
  return shadowify(g, true, true);
}
function shelf(w, d) {
  const g = new THREE.Group();
  const plank = roundedPanel(w, 0.035, d, 0.008, MAT.woodD, 3); g.add(plank);
  for (const sx of [-1, 1]) {
    const br = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.02), MAT.brassD);
    br.position.set(sx * w * 0.38, -0.07, -d / 2 + 0.012); g.add(br);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.012, d * 0.8), MAT.brassD);
    arm.position.set(sx * w * 0.38, -0.022, -d * 0.08); g.add(arm);
  }
  return shadowify(g, true, true);
}
function skyTexture() {
  return canvasTex(1024, 768, (c, W, H) => {
    const sky = c.createLinearGradient(0, 0, 0, H * 0.62);
    sky.addColorStop(0, '#7fb6e6'); sky.addColorStop(0.55, '#bcd9ee'); sky.addColorStop(1, '#f3d9b5');
    c.fillStyle = sky; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 6; i++) { const x = rand() * W, y = rand() * H * 0.3 + 30; c.beginPath(); c.ellipse(x, y, 60 + rand() * 90, 10 + rand() * 12, 0, 0, Math.PI * 2); c.fill(); }
    const hill = (y0, amp, col, seed) => {
      const R = mulberry32(seed); c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
      for (let x = 0; x <= W; x += 32) c.lineTo(x, y0 - amp * (0.5 + 0.5 * Math.sin(x * 0.006 + seed)) - R() * amp * 0.25);
      c.lineTo(W, H); c.closePath(); c.fill();
    };
    hill(H * 0.62, 80, '#8fae8a', 3); hill(H * 0.72, 60, '#6f9467', 7); hill(H * 0.84, 40, '#577a4f', 11);
    // 개울
    c.strokeStyle = 'rgba(200,232,250,0.85)'; c.lineWidth = 10; c.beginPath(); c.moveTo(W * 0.15, H); c.bezierCurveTo(W * 0.35, H * 0.82, W * 0.55, H * 0.9, W * 0.7, H * 0.76); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 2; c.stroke();
  });
}
function windowWithSky(w, h) {
  const g = new THREE.Group();
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: skyTexture(), color: new THREE.Color(1.25, 1.22, 1.18), toneMapped: true }));
  sky.position.z = -0.06; g.add(sky);
  const frame = bevelFrame(w + 0.12, h + 0.12, 0.07, 0.09, MAT.white, 0.01); g.add(frame);
  const mull = roundedPanel(0.035, h, 0.05, 0.008, MAT.white, 2); mull.position.z = -0.01; g.add(mull);
  const tr = roundedPanel(w, 0.035, 0.05, 0.008, MAT.white, 2); tr.position.set(0, h * 0.18, -0.01); g.add(tr);
  const sill = roundedPanel(w + 0.24, 0.04, 0.2, 0.01, MAT.white, 3); sill.position.set(0, -h / 2 - 0.07, 0.06); g.add(sill);
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, roughness: 0.02, clearcoat: 1, depthWrite: false }));
  pane.position.z = -0.03; g.add(pane);
  return shadowify(g, true, true);
}
function wallDiagramPanel(w, h, drawFn) {
  const g = new THREE.Group();
  const back = roundedPanel(w + 0.05, h + 0.05, 0.03, 0.012, MAT.graphiteD, 3); g.add(back);
  const tex = canvasTex(1024, Math.round(1024 * h / w), (c, W, H) => { c.fillStyle = '#0d1418'; c.fillRect(0, 0, W, H); drawFn(c, W, H); });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1.15, 1.15, 1.15), toneMapped: false }));
  scr.position.z = 0.016; g.add(scr);
  const frame = bevelFrame(w + 0.03, h + 0.03, 0.014, 0.01, MAT.brassD, 0.008); frame.position.z = 0.02; g.add(frame);
  return g;
}
// 은은한 도식 그리기 도우미 (벽 패널·화면 공용)
function glowStroke(c, color, width, blur, path) {
  c.save(); c.strokeStyle = color; c.lineWidth = width; c.shadowColor = color; c.shadowBlur = blur; c.lineJoin = 'round'; c.lineCap = 'round';
  c.beginPath(); path(c); c.stroke(); c.restore();
}
function gridLines(c, W, H, nx, ny, col = 'rgba(125,211,252,0.09)') {
  c.strokeStyle = col; c.lineWidth = 1;
  for (let i = 1; i < nx; i++) { const x = (i / nx) * W; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
  for (let i = 1; i < ny; i++) { const y = (i / ny) * H; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
}
