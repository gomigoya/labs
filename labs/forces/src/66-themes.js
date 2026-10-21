// ==== 13c 쉬운 모드 배경: 퀘스트 주제에 맞춘 무대 배경 (방 대신 둥근 배경막) ====
// 운동장(당기기·줄다리기·힘 합체) → 우주(달나라, 중력에 따라 섞임) → 장난감 공방(용수철) → 얼음·숲·사막(바닥 재질)
// Background themes follow the experiments; the removed quiz has no theme.
const THEME = { cache: {}, a: 'field', b: 'field', m: 1, on: false, mesh: null };
const TW = 2048, TH = 768;
function themeCanvas(key) {
  if (THEME.cache[key]) return THEME.cache[key];
  const c = document.createElement('canvas'); c.width = TW; c.height = TH;
  const x = c.getContext('2d'), R = mulberry32(key.length * 97 + key.charCodeAt(0));
  const grad = (stops, y0 = 0, y1 = TH) => { const g = x.createLinearGradient(0, y0, 0, y1); stops.forEach(([o, col]) => g.addColorStop(o, col)); x.fillStyle = g; x.fillRect(0, y0, TW, y1 - y0); };
  const circle = (cx, cy, r, col) => { x.fillStyle = col; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); };
  const hills = (y, amp, col, seed) => { x.fillStyle = col; x.beginPath(); x.moveTo(0, TH); for (let i = 0; i <= 64; i++) { const u = i / 64; x.lineTo(u * TW, y - amp * (0.5 + 0.5 * Math.sin(u * Math.PI * 2 * 3 + seed) * Math.sin(u * Math.PI * 2 * 1.3 + seed * 2))); } x.lineTo(TW, TH); x.fill(); };
  const cloud = (cx, cy, s) => { x.fillStyle = 'rgba(255,255,255,.85)'; [[0, 0, 1], [-0.9, 0.25, 0.7], [0.9, 0.25, 0.75], [0.35, -0.35, 0.8]].forEach(([dx, dy, r]) => { x.beginPath(); x.arc(cx + dx * s, cy + dy * s, r * s, 0, 7); x.fill(); }); };
  // 장면 중심은 u = 0.5 (배경막 뒤쪽)
  if (key === 'field') {
    grad([[0, '#6fb8ec'], [0.6, '#cdeaff'], [1, '#e9f6ff']]);
    circle(TW * 0.62, 150, 70, '#fff3b0'); circle(TW * 0.62, 150, 110, 'rgba(255,243,176,.25)');
    for (let i = 0; i < 9; i++) cloud(R() * TW, 90 + R() * 160, 40 + R() * 30);
    hills(470, 90, '#8fcf7a', 1); hills(520, 60, '#6fbb5e', 4);
    grad([[0, '#5aa84d'], [1, '#3f8a3a']], 520, TH);
    x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = 6; x.beginPath(); x.moveTo(0, 600); x.lineTo(TW, 600); x.stroke();
    x.beginPath(); x.moveTo(TW / 2, 520); x.lineTo(TW / 2, TH); x.stroke();
    // 깃발 줄
    for (let k = 0; k < 2; k++) { const y0 = 250 + k * 40; x.strokeStyle = 'rgba(60,60,60,.5)'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, y0); x.quadraticCurveTo(TW / 2, y0 + 80, TW, y0); x.stroke();
      const cols = ['#f87171', '#fbbf24', '#60a5fa', '#a78bfa', '#34d399']; for (let i = 0; i < 40; i++) { const u = i / 40, yy = y0 + 80 * 4 * u * (1 - u) * 0.5 * 2 * 0.5 * 2; x.fillStyle = cols[i % 5]; x.beginPath(); x.moveTo(u * TW, yy); x.lineTo(u * TW + 30, yy); x.lineTo(u * TW + 15, yy + 36); x.fill(); } }
  } else if (key === 'space') {
    grad([[0, '#05071a'], [0.7, '#141b3d'], [1, '#232845']]);
    for (let i = 0; i < 700; i++) { const s = R() * 2.2; x.fillStyle = `rgba(255,255,255,${0.3 + R() * 0.7})`; x.fillRect(R() * TW, R() * TH * 0.75, s, s); }
    // 지구
    const ex = TW * 0.36, ey = 210; circle(ex, ey, 120, 'rgba(96,165,250,.18)'); circle(ex, ey, 95, '#2f6fd1');
    x.fillStyle = '#48a35a'; [[-30, -20, 38], [25, 30, 30], [40, -40, 22], [-45, 40, 18]].forEach(([dx, dy, r]) => { x.beginPath(); x.ellipse(ex + dx, ey + dy, r, r * 0.7, 0.4, 0, 7); x.fill(); });
    x.fillStyle = 'rgba(0,0,10,.45)'; x.beginPath(); x.arc(ex + 40, ey + 20, 100, 0, 7); x.fill();
    // 달 표면
    hills(590, 40, '#8c8f99', 2); grad([[0, '#9a9da6'], [1, '#6f727c']], 600, TH);
    for (let i = 0; i < 26; i++) { const cx = R() * TW, cy = 610 + R() * 140, r = 10 + R() * 34; x.fillStyle = 'rgba(60,62,70,.35)'; x.beginPath(); x.ellipse(cx, cy, r, r * 0.35, 0, 0, 7); x.fill(); }
  } else if (key === 'spring') {
    grad([[0, '#fde9b6'], [1, '#f7d58c']]);
    x.fillStyle = 'rgba(150,100,40,.18)'; for (let yy = 40; yy < 560; yy += 34) for (let xx = 20; xx < TW; xx += 34) { x.beginPath(); x.arc(xx, yy, 4, 0, 7); x.fill(); }
    // 큰 자와 용수철 그림
    for (let i = 0; i < 7; i++) { const cx = 180 + i * 290, top = 90 + (i % 2) * 30; x.strokeStyle = ['#ef4444', '#3b82f6', '#22c55e', '#a855f7'][i % 4]; x.lineWidth = 7; x.beginPath(); x.moveTo(cx, top); for (let j = 0; j <= 14; j++) x.lineTo(cx + (j % 2 ? 26 : -26), top + 20 + j * (14 + i * 2)); x.stroke(); x.fillStyle = '#6b7280'; x.fillRect(cx - 22, top + 40 + 14 * (14 + i * 2), 44, 40); }
    grad([[0, '#c98b4f'], [1, '#9c6634']], 580, TH);
  } else if (key === 'ice') {
    grad([[0, '#a9d8f5'], [0.6, '#e6f6ff'], [1, '#f4fbff']]);
    x.fillStyle = '#d7ecf8'; x.beginPath(); x.moveTo(0, 470); for (let i = 0; i <= 12; i++) x.lineTo(i * TW / 12, i % 2 ? 230 + R() * 60 : 430); x.lineTo(TW, 470); x.lineTo(TW, TH); x.lineTo(0, TH); x.fill();
    x.fillStyle = '#ffffff'; for (let i = 1; i < 12; i += 2) { const px = i * TW / 12; x.beginPath(); x.moveTo(px - 50, 330); x.lineTo(px, 250); x.lineTo(px + 50, 330); x.fill(); }
    grad([[0, '#cfefff'], [1, '#9fd6f2']], 520, TH);
    x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 3; for (let i = 0; i < 30; i++) { const y0 = 540 + R() * 220, x0 = R() * TW; x.beginPath(); x.moveTo(x0, y0); x.quadraticCurveTo(x0 + 120, y0 - 20, x0 + 260, y0 + 8); x.stroke(); }
    x.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 90; i++) circle(R() * TW, R() * 500, 2 + R() * 3, 'rgba(255,255,255,.85)');
  } else if (key === 'forest') {
    grad([[0, '#bfe3c0'], [1, '#e8f5df']]);
    for (let layer = 0; layer < 3; layer++) { const col = ['#7fb77e', '#4f8f52', '#2f6a37'][layer]; for (let i = 0; i < 26; i++) { const px = R() * TW, h = 160 + layer * 70 + R() * 80, base = 520 + layer * 20; x.fillStyle = col; x.beginPath(); x.moveTo(px - 60, base); x.lineTo(px, base - h); x.lineTo(px + 60, base); x.fill(); } }
    grad([[0, '#a77b4f'], [1, '#7a5532']], 540, TH);
    x.strokeStyle = 'rgba(70,45,25,.35)'; x.lineWidth = 4; for (let y0 = 560; y0 < TH; y0 += 28) { x.beginPath(); x.moveTo(0, y0); x.lineTo(TW, y0 + 6); x.stroke(); }
  } else if (key === 'desert') {
    grad([[0, '#f8c27a'], [0.6, '#ffe2b0'], [1, '#fff0d6']]);
    circle(TW * 0.4, 170, 80, '#fff2c4'); circle(TW * 0.4, 170, 130, 'rgba(255,242,196,.3)');
    hills(470, 110, '#e7b06a', 3); hills(540, 70, '#d99a52', 6);
    grad([[0, '#d9a25d'], [1, '#b97f3e']], 560, TH);
    x.fillStyle = 'rgba(120,80,30,.25)'; for (let i = 0; i < 400; i++) x.fillRect(R() * TW, 560 + R() * 200, 3, 3);
    for (const px of [TW * 0.18, TW * 0.78]) { x.fillStyle = '#4c8b4f'; x.fillRect(px - 16, 330, 32, 200); x.fillRect(px - 60, 400, 26, 70); x.fillRect(px - 60, 400, 50, 22); x.fillRect(px + 34, 370, 26, 70); x.fillRect(px + 10, 420, 50, 22); }
  } else if (key === 'water') {
    grad([[0, '#7cc8ef'], [0.12, '#3c9fd6'], [0.6, '#1d6aa6'], [1, '#0f3f6e']]);
    x.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < TW; i += 60) { x.beginPath(); x.arc(i + 30, 92, 34, Math.PI, 0); x.fill(); }
    for (let i = 0; i < 9; i++) { const px = R() * TW; const g = x.createLinearGradient(px, 90, px + 140, TH); g.addColorStop(0, 'rgba(255,255,255,.18)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.moveTo(px, 90); x.lineTo(px + 60, 90); x.lineTo(px + 260, TH); x.lineTo(px + 120, TH); x.fill(); }
    for (let i = 0; i < 70; i++) { const r = 4 + R() * 10; x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 2; x.beginPath(); x.arc(R() * TW, 140 + R() * 520, r, 0, 7); x.stroke(); }
    for (let i = 0; i < 14; i++) { const px = R() * TW; x.strokeStyle = ['rgba(47,158,107,.7)', 'rgba(63,178,122,.7)'][i % 2]; x.lineWidth = 6; x.beginPath(); x.moveTo(px, TH); for (let j = 1; j < 5; j++) x.lineTo(px + Math.sin(j * 1.3 + i) * 14, TH - j * (22 + R() * 12)); x.stroke(); }
    for (let i = 0; i < 6; i++) { const fxp = R() * TW, fy = 260 + R() * 300, col = ['#fbbf24', '#f97316', '#f472b6'][i % 3]; x.fillStyle = col; x.beginPath(); x.ellipse(fxp, fy, 36, 18, 0, 0, 7); x.fill(); x.beginPath(); x.moveTo(fxp + 30, fy); x.lineTo(fxp + 58, fy - 16); x.lineTo(fxp + 58, fy + 16); x.fill(); }
  } else if (key === 'race') {
    grad([[0, '#8fc7f0'], [1, '#dff0fb']]);
    x.fillStyle = '#56607a'; x.fillRect(0, 260, TW, 230);
    const cols = ['#f87171', '#fbbf24', '#60a5fa', '#34d399', '#f472b6', '#ffffff'];
    for (let i = 0; i < 900; i++) circle(R() * TW, 275 + R() * 200, 6, cols[i % cols.length]);
    x.fillStyle = '#e5e7eb'; x.fillRect(0, 490, TW, 20);
    grad([[0, '#4b5563'], [1, '#374151']], 510, TH);
    x.fillStyle = '#ffffff'; for (let i = 0; i < TW; i += 120) x.fillRect(i, 630, 70, 10);
    for (let r = 0; r < 2; r++) for (let i = 0; i < TW / 30; i++) { x.fillStyle = (i + r) % 2 ? '#111' : '#fff'; x.fillRect(i * 30, 510 + r * 30, 30, 30); }
  } else if (key === 'arena') {
    grad([[0, '#2a1650'], [0.6, '#5b2a7a'], [1, '#8a4a7a']]);
    for (let i = 0; i < 5; i++) { const px = TW * (0.15 + i * 0.175); const g = x.createLinearGradient(px, 0, px, 600); g.addColorStop(0, 'rgba(253,230,138,.35)'); g.addColorStop(1, 'rgba(253,230,138,0)'); x.fillStyle = g; x.beginPath(); x.moveTo(px - 20, 0); x.lineTo(px + 20, 0); x.lineTo(px + 160, 600); x.lineTo(px - 160, 600); x.fill(); }
    x.fillStyle = '#1b0f33'; x.fillRect(TW * 0.3, 260, TW * 0.4, 300); for (let i = 0; i < 12; i++) x.fillRect(TW * 0.3 + i * TW * 0.4 / 12, 230, TW * 0.4 / 24, 30);
    for (const px of [TW * 0.27, TW * 0.73]) { x.fillRect(px - 60, 180, 120, 380); for (let i = 0; i < 4; i++) x.fillRect(px - 60 + i * 34, 150, 18, 30); }
    for (let i = 0; i < 8; i++) { const px = TW * (0.08 + i * 0.12); x.fillStyle = i % 2 ? '#fbbf24' : '#ef4444'; x.beginPath(); x.moveTo(px, 60); x.lineTo(px + 50, 60); x.lineTo(px + 50, 200); x.lineTo(px + 25, 175); x.lineTo(px, 200); x.fill(); }
    x.save(); x.translate(TW / 2, 160); x.strokeStyle = '#fde68a'; x.lineWidth = 6; x.lineJoin = 'round';
    x.stroke(new Path2D('M-54 40-66-35-30-8 0-52 30-8 66-35 54 40ZM-54 24H54')); x.restore();
    grad([[0, '#3b2257'], [1, '#22123a']], 560, TH);

  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.repeat.x = -1; t.anisotropy = 4;
  return (THEME.cache[key] = t);
}
// 바닥 무늬(배경막 아래 원판): 위에서 내려다보는 장면에서도 주제가 보이게
const FLOOR_CACHE = {};
function floorTex(key) {
  if (FLOOR_CACHE[key]) return FLOOR_CACHE[key];
  const N = 512, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), R = mulberry32(key.length * 31 + 7);
  const fill = (col) => { x.fillStyle = col; x.fillRect(0, 0, N, N); };
  const speck = (n, cols, s0, s1) => { for (let i = 0; i < n; i++) { x.fillStyle = cols[i % cols.length]; const s = s0 + R() * (s1 - s0); x.fillRect(R() * N, R() * N, s, s); } };
  if (key === 'field') { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#4f9a45' : '#5aa84f'; x.fillRect(0, i * N / 8, N, N / 8); } speck(900, ['#3f8a3a', '#6fbb5e'], 2, 4); x.fillStyle = 'rgba(255,255,255,.85)'; x.fillRect(0, N / 2 - 4, N, 8); }
  else if (key === 'space') { fill('#8d9099'); speck(1600, ['#7b7e88', '#a3a6af', '#6c6f78'], 2, 5); for (let i = 0; i < 9; i++) { x.strokeStyle = 'rgba(60,62,70,.5)'; x.lineWidth = 3; x.beginPath(); x.arc(R() * N, R() * N, 12 + R() * 40, 0, 7); x.stroke(); } }
  else if (key === 'spring') { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#b77b45' : '#c88a50'; x.fillRect(0, i * N / 8, N, N / 8 - 3); } speck(300, ['rgba(90,55,25,.3)'], 2, 6); }
  else if (key === 'ice') { fill('#bfe6f7'); x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = 2; for (let i = 0; i < 40; i++) { const x0 = R() * N, y0 = R() * N; x.beginPath(); x.moveTo(x0, y0); x.quadraticCurveTo(x0 + 60, y0 - 20, x0 + 140, y0 + 10); x.stroke(); } }
  else if (key === 'forest') { fill('#5d8c3e'); speck(1400, ['#4c7a33', '#7aa64c', '#a3743e', '#c58a3c'], 3, 7); }
  else if (key === 'desert') { fill('#d7a35f'); x.strokeStyle = 'rgba(170,110,50,.35)'; x.lineWidth = 4; for (let y = 0; y < N; y += 26) { x.beginPath(); for (let i = 0; i <= 16; i++) x.lineTo(i * N / 16, y + Math.sin(i * 0.9 + y) * 6); x.stroke(); } speck(800, ['#e2b779', '#c08843'], 1, 3); }
  else if (key === 'water') { fill('#2b8cc4'); x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 3; for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(i * N / 8, 0); x.lineTo(i * N / 8, N); x.stroke(); x.beginPath(); x.moveTo(0, i * N / 8); x.lineTo(N, i * N / 8); x.stroke(); } x.strokeStyle = 'rgba(255,255,255,.25)'; for (let i = 0; i < 18; i++) { const x0 = R() * N, y0 = R() * N; x.beginPath(); x.arc(x0, y0, 20 + R() * 30, 0.3, 2.6); x.stroke(); } }
  else if (key === 'race') { fill('#3d434f'); speck(1500, ['#4b5260', '#333843'], 2, 4); x.fillStyle = '#f5f5f5'; for (let i = 0; i < 4; i++) x.fillRect(i * N / 4 + 20, N / 2 - 5, N / 8, 10); x.fillStyle = '#fbbf24'; x.fillRect(0, 30, N, 8); x.fillRect(0, N - 38, N, 8); }
  else if (key === 'arena') { for (let r = 0; r < 8; r++) for (let q = 0; q < 8; q++) { x.fillStyle = (r + q) % 2 ? '#3a2161' : '#4a2a78'; x.fillRect(q * N / 8, r * N / 8, N / 8 - 2, N / 8 - 2); } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(9, 9); t.anisotropy = 8;
  return (FLOOR_CACHE[key] = t);
}
// 바닥 색(배경막 아래 원판)
const THEME_FLOOR = { field: 0x3f7d36, space: 0x6c6f78, spring: 0x8a5a2e, ice: 0xa9d6ee, forest: 0x6e4c2c, desert: 0xc08843, water: 0x0f3f6e, race: 0x3a414d, arena: 0x2a1745 };
function buildThemes() {
  const geo = new THREE.CylinderGeometry(5.2, 5.2, 7, 96, 1, true);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { tA: { value: themeCanvas('field') }, tB: { value: themeCanvas('field') }, uMix: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D tA, tB; uniform float uMix; varying vec2 vUv;
      void main(){ vec2 uv = vec2(-vUv.x, clamp((vUv.y - 0.26) / 0.62, 0.0, 1.0)); 
        vec4 a = texture2D(tA, uv), b = texture2D(tB, uv); vec3 c = mix(a.rgb, b.rgb, uMix);
        gl_FragColor = vec4(c * 0.92, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  THEME.mesh = new THREE.Mesh(geo, mat); THEME.mesh.position.set(0.2, 2.6, 0.9); THEME.mesh.renderOrder = -10; THEME.mesh.visible = false;
  scene.add(THEME.mesh);
}
// 쉬운 모드 켜고 끄기: 방을 숨기고 스튜디오 조명 + 주제 배경
function themeMode(on) {
  THEME.on = on;
  if (on) {
    ROOM.visible = false; LIGHTS.room.forEach((l) => (l.visible = false)); LIGHTS.studio.visible = true; LIGHTS.studio.children[0].intensity = 22; LIGHTS.studio.children[3].intensity = 3;   /* 뒤 조명이 반들한 실험대에 비쳐 생기는 흰 얼룩을 줄인다 */ STUDIO.visible = true; STUDIO.children[0].visible = false;
    scene.background = new THREE.Color(0x111111); scene.fog = null; scene.environmentIntensity = 0.3; THEME.mesh.visible = true;
  } else { THEME.mesh.visible = false; LIGHTS.studio.children[0].intensity = 40; LIGHTS.studio.children[3].intensity = 30; STUDIO.children[0].visible = true; const fm = STUDIO.children[1].material; fm.map = null; fm.color.setHex(0x141210); fm.needsUpdate = true; setView(S.view); }
  // 쉬운 모드에서는 콘솔 앞면 계기(다이얼·화면·슬라이더·램프)를 숨긴다: 아이는 실험 기구를 직접 만진다
  const C = CONSOLE; [C.dialG, C.dialJ, C.sF1, C.sF2, C.button, C.screenA, C.screenB].forEach((q) => q && q.group && (q.group.visible = !on));
  Object.values(C.lamps || {}).forEach((l) => l && l.mesh && (l.mesh.visible = !on));
}
function themeTarget() {
  const m = KID.missions[KID.i];
  if (S.station === 'balance') return 'spring';
  if (KID.free) return S.station === 'track' ? { glass: 'ice', wood: 'forest', sand: 'desert' }[S.surface] : 'water';
  if (!m) return 'field';
  if (m.theme === 'surface') return { glass: 'ice', wood: 'forest', sand: 'desert' }[S.surface];
  return m.theme || 'field';
}
function updateTheme(dt) {
  if (!THEME.on) return;
  const u = THEME.mesh.material.uniforms, m = KID.missions[KID.i];
  if ((m && m.theme === 'moon' && !KID.free) || (KID.free && S.station === 'hang' && S.g.cur < 9.6)) {   // 중력에 따라 운동장 → 우주
    u.tA.value = themeCanvas('field'); u.tB.value = themeCanvas('space');
    u.uMix.value = clamp((9.8 - S.g.cur) / (9.8 - 1.6), 0, 1); THEME.a = THEME.b = S.g.cur < 5.7 ? 'space' : 'field'; THEME.m = 1;
  } else {
    const t = themeTarget();
    if (t !== THEME.b) { THEME.a = THEME.m < 0.5 ? THEME.a : THEME.b; THEME.b = t; THEME.m = 0; }
    THEME.m = Math.min(1, THEME.m + dt / 0.8);
    u.tA.value = themeCanvas(THEME.a); u.tB.value = themeCanvas(THEME.b); u.uMix.value = smooth(THEME.m);
  }
  const fk = THEME.m < 0.5 && !(m && m.theme === 'moon' && !KID.free) ? THEME.a : THEME.b;
  const fm = STUDIO.children[1].material; if (fm.map !== floorTex(fk)) { fm.map = floorTex(fk); fm.color.setHex(0xffffff); fm.needsUpdate = true; }
}
