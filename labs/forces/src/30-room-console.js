// ==== 4 ROOM ====
const TOP = 0.94;            // 콘솔 상판 높이
const WALL_Z = -2.4, WALL_X = -3.3, CEIL = 3.6;

function floorTexture() {
  return canvasTex(1024, 1024, (c, W, H) => {
    const rows = 8;
    for (let r = 0; r < rows; r++) {
      let x = -rand() * 300;
      while (x < W) {
        const len = 260 + rand() * 340;
        const t = 0.82 + rand() * 0.25;
        c.fillStyle = `rgb(${Math.round(118 * t)},${Math.round(84 * t)},${Math.round(58 * t)})`;
        c.fillRect(x, r * H / rows, len, H / rows);
        for (let k = 0; k < 14; k++) { c.fillStyle = `rgba(40,24,12,${0.04 + rand() * 0.06})`; c.fillRect(x, r * H / rows + rand() * H / rows, len, 1 + rand() * 2); }
        c.fillStyle = 'rgba(20,12,6,0.55)'; c.fillRect(x, r * H / rows, 2, H / rows);
        x += len;
      }
      c.fillStyle = 'rgba(20,12,6,0.6)'; c.fillRect(0, r * H / rows, W, 2);
    }
  }, { repeat: [3, 3] });
}
function plasterTexture(base) {
  return canvasTex(512, 512, (c, W, H) => {
    c.fillStyle = base; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 2600; i++) { const a = rand() * 0.05; c.fillStyle = rand() > 0.5 ? `rgba(255,240,220,${a})` : `rgba(30,20,10,${a})`; const s = 2 + rand() * 9; c.fillRect(rand() * W, rand() * H, s, s); }
  }, { repeat: [4, 2] });
}
function buildRoom() {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.MeshStandardMaterial({ map: floorTexture(), roughness: 0.72, metalness: 0 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(1, 0, 3); floor.receiveShadow = true; ROOM.add(floor);
  const rug = roundedPanel(4.4, 0.012, 2.6, 0.006, new THREE.MeshStandardMaterial({ color: 0x3e3430, roughness: 0.95 }), 2);
  rug.position.set(0.1, 0.006, 0.3); ROOM.add(rug);
  const rugBorder = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.4).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x6b4a36, roughness: 0.95, transparent: true, opacity: 0.0 }));
  rugBorder.position.set(0.1, 0.013, 0.3); ROOM.add(rugBorder);

  const wallMat = new THREE.MeshStandardMaterial({ map: plasterTexture('#7f6f61'), roughness: 0.92, metalness: 0 });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(10, CEIL), wallMat); back.position.set(1.7, CEIL / 2, WALL_Z); back.receiveShadow = true; ROOM.add(back);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(10, CEIL), wallMat); left.rotation.y = Math.PI / 2; left.position.set(WALL_X, CEIL / 2, 2.6); left.receiveShadow = true; ROOM.add(left);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshStandardMaterial({ color: 0x5a4f46, roughness: 1 })); ceil.rotation.x = Math.PI / 2; ceil.position.set(1.7, CEIL, 2.6); ROOM.add(ceil);

  // 징두리 판벽 + 몰딩 (큰 벽면을 비우지 않는다)
  const wain = new THREE.MeshStandardMaterial({ color: 0x4a3a2e, roughness: 0.7 });
  const wainL = new THREE.MeshStandardMaterial({ color: 0x55443a, roughness: 0.68 });
  const addWainscot = (len, place) => {
    const g = new THREE.Group();
    const board = roundedPanel(len, 0.95, 0.03, 0.006, wain, 2); board.position.y = 0.475; g.add(board);
    const n = Math.floor(len / 0.62);
    for (let i = 0; i < n; i++) { const p = roundedPanel(len / n - 0.12, 0.6, 0.02, 0.01, wainL, 3); p.position.set(-len / 2 + (i + 0.5) * len / n, 0.5, 0.018); g.add(p); }
    const rail = roundedPanel(len, 0.05, 0.05, 0.012, MAT.woodD, 3); rail.position.set(0, 0.97, 0.01); g.add(rail);
    const skirt = roundedPanel(len, 0.12, 0.045, 0.01, MAT.woodD, 3); skirt.position.set(0, 0.06, 0.012); g.add(skirt);
    place(g); ROOM.add(shadowify(g, false, true));
  };
  addWainscot(9.8, (g) => g.position.set(1.7, 0, WALL_Z + 0.016));
  addWainscot(9.8, (g) => { g.rotation.y = Math.PI / 2; g.position.set(WALL_X + 0.016, 0, 2.6); });
  const corner = roundedPanel(0.06, CEIL, 0.06, 0.02, MAT.woodD, 2); corner.position.set(WALL_X + 0.03, CEIL / 2, WALL_Z + 0.03); ROOM.add(corner);
  const crownB = roundedPanel(9.8, 0.09, 0.07, 0.02, MAT.white, 2); crownB.position.set(1.7, CEIL - 0.045, WALL_Z + 0.035); ROOM.add(crownB);
  const crownL = crownB.clone(); crownL.rotation.y = Math.PI / 2; crownL.position.set(WALL_X + 0.035, CEIL - 0.045, 2.6); ROOM.add(crownL);

  // 창문
  const win = windowWithSky(1.5, 1.25); win.position.set(2.25, 1.9, WALL_Z + 0.02); ROOM.add(win);
  ROOM.userData.window = win;
  // 창 아래 라디에이터 (세로 핀)
  const rad = new THREE.Group();
  for (let i = 0; i < 14; i++) { const fin = roundedPanel(0.05, 0.5, 0.1, 0.02, MAT.white, 3); fin.position.x = (i - 6.5) * 0.075; rad.add(fin); }
  const rpipe = brassTrim(1.15, 0.012, MAT.chrome); rpipe.position.set(0, -0.2, 0.04); rad.add(rpipe);
  rad.position.set(2.25, 0.5, WALL_Z + 0.09); ROOM.add(shadowify(rad));

  // 벽 도식 패널 3개
  const pA = wallDiagramPanel(0.95, 0.6, drawDiagramFBD); pA.position.set(-1.55, 2.12, WALL_Z + 0.02); ROOM.add(pA);
  const pB = wallDiagramPanel(0.7, 0.44, drawDiagramHooke); pB.position.set(-0.3, 2.42, WALL_Z + 0.02); ROOM.add(pB);
  const pC = wallDiagramPanel(0.86, 0.56, drawDiagramBuoy); pC.rotation.y = Math.PI / 2; pC.position.set(WALL_X + 0.02, 1.95, 0.35); ROOM.add(pC);
  ROOM.userData.panels = [pA, pB, pC];

  // 선반 2개 (왼쪽 벽) + 소품
  const shelves = new THREE.Group(); shelves.rotation.y = Math.PI / 2; shelves.position.set(WALL_X + 0.15, 0, -1.25); ROOM.add(shelves);
  const s1 = shelf(1.3, 0.26); s1.position.set(0, 1.42, 0); shelves.add(s1);
  const s2 = shelf(1.3, 0.26); s2.position.set(0, 1.95, 0); shelves.add(s2);
  const tints = [0x6cb6c9, 0xd9a35a, 0x9ac27a, 0xc77d6a];
  for (let i = 0; i < 4; i++) { const j = glassJar(0.045 + (i % 2) * 0.012, 0.13 + (i % 3) * 0.03, tints[i], i + 2); j.position.set(-0.5 + i * 0.13, 1.44, 0.02 - (i % 2) * 0.04); shelves.add(j); }
  const ico = new THREE.Mesh(new THREE.IcosahedronGeometry(0.065, 0), MAT.brass); ico.position.set(0.12, 1.505, 0.0); ico.castShadow = true; shelves.add(ico);
  const cube = roundedPanel(0.1, 0.1, 0.1, 0.02, new THREE.MeshStandardMaterial({ color: 0x3f6f7e, roughness: 0.4, metalness: 0.2 })); cube.position.set(0.3, 1.49, 0.02); cube.rotation.y = 0.4; shelves.add(cube);
  const books = [0x7a3b2e, 0x2f4a5a, 0x9a7a3a, 0x3e5a3a, 0x5a3a5a];
  books.forEach((col, i) => { const b = roundedPanel(0.035, 0.2 + (i % 3) * 0.025, 0.16, 0.004, new THREE.MeshStandardMaterial({ color: col, roughness: 0.8 }), 2); b.position.set(-0.52 + i * 0.04, 1.97 + (0.1 + (i % 3) * 0.0125), 0); b.rotation.z = i === 4 ? -0.18 : 0; shelves.add(b); });
  // 선반 위 추 더미와 작은 용수철 (탄성력 탐구 재료)
  for (let k = 0; k < 5; k++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.012, 24), k % 2 ? MAT.brassD : MAT.brass); d.position.set(0.0, 1.98 + k * 0.013, 0.0); d.castShadow = true; shelves.add(d); }
  for (let k = 0; k < 3; k++) { const pts = []; for (let i = 0; i <= 80; i++) { const t = i / 80; pts.push(V3(Math.cos(t * Math.PI * 2 * 7) * 0.016, t * 0.09, Math.sin(t * Math.PI * 2 * 7) * 0.016)); } const sp = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.0018, 5), MAT.chrome); sp.position.set(0.12 + k * 0.05, 1.975, 0.02); shelves.add(sp); }
  const sp = plant(5, 0.55); sp.position.set(0.42, 1.97, 0.01); shelves.add(sp);
  const strip = ledStrip(1.2, 0xffb36b, 2.2); strip.position.set(0, 1.925, 0.08); shelves.add(strip);
  ROOM.userData.strip = strip; ROOM.userData.shelves = shelves;

  // 조명 기구
  const pendant = lampWithBulb('pendant'); pendant.position.set(-0.95, 2.62, -0.05); ROOM.add(pendant);
  const pcord = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, CEIL - 3.2, 6), MAT.rubber); pcord.position.set(-0.95, (CEIL + 3.2) / 2, -0.05); ROOM.add(pcord);
  const rose = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.03, 24), MAT.brass); rose.position.set(-0.95, CEIL - 0.015, -0.05); ROOM.add(rose);
  const floorLamp = lampWithBulb('floor'); floorLamp.position.set(-2.75, 0, -1.9); ROOM.add(floorLamp);
  ROOM.userData.pendant = pendant; ROOM.userData.floorLamp = floorLamp;

  // 바닥 소품: 화분, 물 양동이(부력), 축구공(힘과 운동), 추 상자, 의자, 큰 용수철
  const fp = plant(9, 1.45); fp.position.set(3.25, 0, -1.85); ROOM.add(fp);
  const fp2 = plant(21, 1.1); fp2.position.set(-2.85, 0, 0.7); ROOM.add(fp2);
  const bucketProf = [[0, 0], [0.13, 0], [0.135, 0.01], [0.16, 0.26], [0.172, 0.27], [0.165, 0.275], [0.15, 0.265], [0.125, 0.012]].map(([x, y]) => new THREE.Vector2(x, y));
  const bucket = new THREE.Mesh(new THREE.LatheGeometry(bucketProf, 32), new THREE.MeshStandardMaterial({ color: 0x9aa3a6, roughness: 0.35, metalness: 0.85, side: THREE.DoubleSide }));
  const bw = new THREE.Mesh(new THREE.CircleGeometry(0.15, 24).rotateX(-Math.PI / 2), MAT.water); bw.position.y = 0.2; bucket.add(bw);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.004, 6, 24, Math.PI), MAT.chrome); handle.position.y = 0.27; handle.rotation.y = 0.5; bucket.add(handle);
  bucket.position.set(-1.95, 0, 1.55); ROOM.add(shadowify(bucket));
  const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 1), new THREE.MeshStandardMaterial({ color: 0xe9e2d6, roughness: 0.55, flatShading: true }));
  const patches = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1105, 0), new THREE.MeshStandardMaterial({ color: 0x2a2523, roughness: 0.6, flatShading: true, transparent: true, opacity: 0.85 }));
  ball.add(patches); ball.position.set(-1.45, 0.11, 1.75); ROOM.add(shadowify(ball));
  // 추 상자 (황동 추가 꽂힌 나무 상자)
  const box = new THREE.Group();
  const bx = roundedPanel(0.34, 0.06, 0.2, 0.01, MAT.woodL, 3); bx.position.y = 0.03; box.add(bx);
  [0.05, 0.05, 0.1, 0.1, 0.2, 0.5].forEach((m, i) => { const r = 0.012 + m * 0.03, h = 0.02 + m * 0.09; const w = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20), i % 2 ? MAT.brassD : MAT.brass); w.position.set(-0.13 + i * 0.052, 0.06 + h / 2, 0); const knob = new THREE.Mesh(new THREE.SphereGeometry(r * 0.45, 12, 8), MAT.brass); knob.position.y = h / 2 + r * 0.3; w.add(knob); box.add(w); });
  box.position.set(-1.05, 0, 1.95); box.rotation.y = 0.35; ROOM.add(shadowify(box));
  const chair = new THREE.Group();
  const seat = roundedPanel(0.46, 0.05, 0.44, 0.03, MAT.woodL, 3); seat.position.y = 0.47; chair.add(seat);
  const backR = roundedPanel(0.46, 0.38, 0.04, 0.03, MAT.woodL, 3); backR.position.set(0, 0.78, -0.2); backR.rotation.x = -0.12; chair.add(backR);
  for (const [x, z] of [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]]) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.015, 0.46, 10), MAT.woodD); lg.position.set(x, 0.23, z); chair.add(lg); }
  chair.position.set(2.75, 0, 1.05); chair.rotation.y = -0.9; ROOM.add(shadowify(chair));
  // 큰 전시용 용수철 (탄성력)
  const coilPts = []; for (let i = 0; i <= 260; i++) { const t = i / 260; coilPts.push(V3(Math.cos(t * Math.PI * 2 * 9) * 0.12, 0.03 + t * 0.62, Math.sin(t * Math.PI * 2 * 9) * 0.12)); }
  const coil = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coilPts), 600, 0.012, 8), MAT.chrome);
  const cbase = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.03, 32), MAT.graphite); cbase.position.y = 0.015;
  const ccap = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.025, 32), MAT.brass); ccap.position.y = 0.665;
  const cg = new THREE.Group(); cg.add(coil, cbase, ccap); cg.position.set(2.15, 0, -1.3); ROOM.add(shadowify(cg));
  // 벽걸이 큰 힘 측정기 눈금판
  const clock = new THREE.Group();
  const cr = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.05, 48).rotateX(Math.PI / 2), MAT.brass); clock.add(cr);
  const cf = new THREE.Mesh(new THREE.CircleGeometry(0.15, 48), new THREE.MeshStandardMaterial({ map: gaugeFaceTexture('N', 0, 10, 5), roughness: 0.5 })); cf.position.z = 0.026; clock.add(cf);
  const cn = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.12, 0.004), new THREE.MeshStandardMaterial({ color: 0xb02a1a })); cn.position.set(0.02, 0.04, 0.03); cn.rotation.z = -0.5; clock.add(cn);
  clock.position.set(-2.35, 2.55, WALL_Z + 0.03); ROOM.add(shadowify(clock));
  // 천장 조명 레일
  const crail = roundedPanel(5.2, 0.04, 0.06, 0.015, MAT.graphite, 2); crail.position.set(0.6, CEIL - 0.06, 0.4); ROOM.add(crail);
}
function gaugeFaceTexture(unit, vmin, vmax, nMajor, sub = 5) {
  return canvasTex(512, 512, (c, W) => {
    const g = c.createRadialGradient(W / 2, W / 2, 10, W / 2, W / 2, W / 2);
    g.addColorStop(0, '#f4ecdf'); g.addColorStop(1, '#d9ccb8');
    c.fillStyle = g; c.beginPath(); c.arc(W / 2, W / 2, W / 2, 0, Math.PI * 2); c.fill();
    const a0 = Math.PI * 1.25, sw = Math.PI * 1.5;
    c.strokeStyle = '#2a2420'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#2a2420';
    for (let i = 0; i <= nMajor * sub; i++) {
      const f = i / (nMajor * sub), a = a0 - f * sw, major = i % sub === 0;
      const r0 = W * (major ? 0.36 : 0.4), r1 = W * 0.44;
      c.lineWidth = major ? 5 : 2; c.beginPath(); c.moveTo(W / 2 + Math.cos(a) * r0, W / 2 - Math.sin(a) * r0); c.lineTo(W / 2 + Math.cos(a) * r1, W / 2 - Math.sin(a) * r1); c.stroke();
      if (major) { c.font = font('mono', 36); c.fillText(String(Math.round(vmin + f * (vmax - vmin))), W / 2 + Math.cos(a) * W * 0.28, W / 2 - Math.sin(a) * W * 0.28); }
    }
    c.strokeStyle = '#b4281a'; c.lineWidth = 8; c.beginPath(); c.arc(W / 2, W / 2, W * 0.44, a0 - sw, a0 - sw * 0.82); c.stroke();
    c.font = font('mono', 30); c.fillStyle = '#5a5048'; c.fillText(unit, W / 2, W * 0.72);
  });
}

// 벽 도식: 자유 물체 도형 (도막이 받는 힘)
function drawDiagramFBD(c, W, H) {
  gridLines(c, W, H, 12, 8);
  c.font = font('mono', 30); c.fillStyle = 'rgba(186,230,253,0.85)'; c.fillText('FREE-BODY DIAGRAM · ΣF = 0', 36, 56);
  const cx = W * 0.46, cy = H * 0.56;
  c.strokeStyle = 'rgba(255,207,154,0.85)'; c.lineWidth = 4; c.strokeRect(cx - 90, cy - 55, 180, 110);
  c.fillStyle = 'rgba(255,207,154,0.08)'; c.fillRect(cx - 90, cy - 55, 180, 110);
  c.strokeStyle = 'rgba(186,230,253,0.4)'; c.beginPath(); c.moveTo(60, cy + 57); c.lineTo(W - 60, cy + 57); c.stroke();
  const arrow = (x0, y0, x1, y1, col, lbl) => {
    glowStroke(c, col, 6, 14, (c) => { c.moveTo(x0, y0); c.lineTo(x1, y1); });
    const a = Math.atan2(y1 - y0, x1 - x0); c.fillStyle = col; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - 22 * Math.cos(a - 0.4), y1 - 22 * Math.sin(a - 0.4)); c.lineTo(x1 - 22 * Math.cos(a + 0.4), y1 - 22 * Math.sin(a + 0.4)); c.closePath(); c.fill();
    c.font = font('mono', 26); c.fillText(lbl, x1 + (x1 > x0 ? 12 : x1 < x0 ? -40 : 14), y1 + (y1 > y0 ? 4 : y1 < y0 ? 20 : -12));
  };
  arrow(cx - 10, cy, cx - 10, cy + 150, 'rgba(255,179,107,0.95)', 'W');
  arrow(cx + 10, cy, cx + 10, cy - 150, 'rgba(240,240,240,0.9)', 'N');
  arrow(cx + 90, cy, cx + 240, cy, 'rgba(196,181,253,0.95)', 'F');
  arrow(cx - 30, cy + 50, cx - 180, cy + 50, 'rgba(252,165,165,0.95)', 'f');
}
// 벽 도식: 훅 법칙
function drawDiagramHooke(c, W, H) {
  gridLines(c, W, H, 8, 5, 'rgba(255,179,107,0.07)');
  c.font = font('head', 64); c.fillStyle = 'rgba(255,207,154,0.95)'; c.shadowColor = 'rgba(255,179,107,0.8)'; c.shadowBlur = 16;
  c.fillText('F = k·x', 60, H * 0.34); c.shadowBlur = 0;
  const x0 = 80, y0 = H - 50, x1 = W - 70, y1 = H * 0.46;
  c.strokeStyle = 'rgba(186,230,253,0.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, y1 - 10); c.lineTo(x0, y0); c.lineTo(x1 + 20, y0); c.stroke();
  glowStroke(c, 'rgba(160,230,255,0.95)', 4, 12, (c) => { c.moveTo(x0, y0); c.lineTo(x1, y1); });
  c.fillStyle = 'rgba(230,246,255,0.95)'; for (let i = 1; i <= 5; i++) { const t = i / 5; c.beginPath(); c.arc(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 7, 0, Math.PI * 2); c.fill(); }
  c.font = font('mono', 22); c.fillStyle = 'rgba(186,230,253,0.7)'; c.fillText('x →', x1 - 20, y0 - 12); c.fillText('F', x0 + 12, y1);
}
// 벽 도식: 부력
function drawDiagramBuoy(c, W, H) {
  gridLines(c, W, H, 10, 7);
  c.font = font('mono', 26); c.fillStyle = 'rgba(186,230,253,0.85)'; c.fillText('BUOYANCY · B = ρ·g·V', 36, 52);
  const bx = W * 0.5, by = H * 0.9, bw = 300, bh = 330;
  c.fillStyle = 'rgba(125,211,252,0.16)'; c.fillRect(bx - bw / 2, by - bh * 0.72, bw, bh * 0.72);
  glowStroke(c, 'rgba(125,211,252,0.85)', 4, 10, (c) => { c.moveTo(bx - bw / 2, by - bh); c.lineTo(bx - bw / 2, by); c.lineTo(bx + bw / 2, by); c.lineTo(bx + bw / 2, by - bh); });
  c.strokeStyle = 'rgba(255,207,154,0.9)'; c.lineWidth = 4; c.strokeRect(bx - 50, by - bh * 0.56, 100, 110);
  c.strokeStyle = 'rgba(240,232,220,0.6)'; c.beginPath(); c.moveTo(bx, by - bh * 0.56); c.lineTo(bx, 80); c.stroke();
  const up = (x, y0, y1, col) => { glowStroke(c, col, 6, 14, (c) => { c.moveTo(x, y0); c.lineTo(x, y1); }); c.fillStyle = col; c.beginPath(); c.moveTo(x, y1); c.lineTo(x - 12, y1 + (y1 < y0 ? 22 : -22)); c.lineTo(x + 12, y1 + (y1 < y0 ? 22 : -22)); c.fill(); };
  up(bx + 26, by - bh * 0.4, by - bh * 0.8, 'rgba(125,211,252,0.95)');
  up(bx - 26, by - bh * 0.4, by - bh * 0.04, 'rgba(255,179,107,0.95)');
  c.font = font('mono', 24); c.fillStyle = 'rgba(125,211,252,0.95)'; c.fillText('B', bx + 42, by - bh * 0.76); c.fillStyle = 'rgba(255,179,107,0.95)'; c.fillText('W', bx - 70, by - bh * 0.1);
}

// ==== 5 CONSOLE ====
const CONSOLE = {};
const PANEL_TILT = -0.45;
function buildConsole() {
  const desk = new THREE.Group(); RIG.add(desk);
  const body = roundedPanel(3.5, TOP - 0.1, 1.0, 0.03, MAT.paint, 4); body.position.set(0, (TOP - 0.1) / 2 + 0.06, -0.1); desk.add(body);
  const topSlab = roundedPanel(3.56, 0.04, 1.08, 0.015, MAT.graphite, 4); topSlab.position.set(0, TOP - 0.02, -0.08); desk.add(topSlab);
  const mat = roundedPanel(2.9, 0.006, 0.86, 0.004, new THREE.MeshStandardMaterial({ map: workMatTexture(), roughness: 0.88, metalness: 0 }), 2);
  mat.position.set(-0.15, TOP + 0.003, -0.12); desk.add(mat);
  const trimF = brassTrim(3.5, 0.007); trimF.position.set(0, TOP - 0.004, 0.455); desk.add(trimF);
  for (const sx of [-1, 1]) {
    const side = roundedPanel(0.02, TOP - 0.3, 0.8, 0.008, MAT.graphiteL, 2); side.position.set(sx * 1.752, (TOP - 0.3) / 2 + 0.12, -0.12); desk.add(side);
    const v = ventSlits(0.5, 0.18, 6); v.rotation.y = sx * Math.PI / 2; v.position.set(sx * 1.764, 0.36, -0.12); desk.add(v);
    for (const [y, z] of [[0.18, -0.48], [0.18, 0.24], [TOP - 0.22, -0.48], [TOP - 0.22, 0.24]]) { const s = screw(MAT.chrome, 0.9); s.rotation.y = sx * Math.PI / 2; s.position.set(sx * 1.764, y, z); desk.add(s); }
  }
  const kick = roundedPanel(3.3, 0.4, 0.02, 0.008, MAT.graphiteD, 2); kick.position.set(0, 0.28, 0.41); desk.add(kick);
  const kv = ventSlits(1.4, 0.16, 5); kv.position.set(-0.6, 0.28, 0.422); desk.add(kv);
  const kv2 = ventSlits(1.0, 0.16, 5); kv2.position.set(1.0, 0.28, 0.422); desk.add(kv2);
  for (const x of [-1.62, 1.62]) for (const z of [-0.52, 0.32]) { const f = rubberFoot(0.04); f.position.set(x, 0.03, z); desk.add(f); }

  // 경사 계기판
  const panel = new THREE.Group(); panel.position.set(0, 0.715, 0.545); panel.rotation.x = PANEL_TILT; desk.add(panel);
  CONSOLE.panel = panel;
  const pBase = roundedPanel(3.42, 0.47, 0.035, 0.014, MAT.graphite, 4); panel.add(pBase);
  const Z = 0.0185, en = LANG === 'en';
  for (const x of [-1.12, -0.48, 0.32, 1.47]) { const seam = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.43, 0.002), MAT.slot); seam.position.set(x, 0, Z); panel.add(seam); }
  for (const [x, y] of [[-1.68, -0.205], [-1.68, 0.205], [1.68, -0.205], [1.68, 0.205]]) { const s = screw(MAT.chrome, 1); s.position.set(x, y, Z); panel.add(s); }
  const pv = ventSlits(0.16, 0.3, 7); pv.position.set(-1.6, -0.02, Z); panel.add(pv);
  const plate = engravedPlate('LUMEBENCH  ·  힘 관측대  ·  FORCE OBSERVATORY', 2.2, 0.052, { size: 0.46, letter: 0.08, rule: true, mat: new THREE.MeshStandardMaterial({ color: 0x9c7a46, roughness: 0.62, metalness: 0.75 }) });
  plate.position.set(0.12, 0.19, Z + 0.003); panel.add(plate);
  // 재생 버튼
  const btn = bigButton(0.055); btn.group.position.set(-1.33, -0.03, Z); panel.add(btn.group);
  CONSOLE.button = btn;
  const bLab = engravedPlate(en ? 'RUN' : '재생', 0.11, 0.026, { size: 0.6, screws: false }); bLab.position.set(-1.33, -0.15, Z + 0.002); panel.add(bLab);
  // 상태 램프: 평형(알짜힘 0) / 움직임
  CONSOLE.lamps = {};
  [['bal', 0x86efac], ['move', 0xffb36b]].forEach(([k, col], i) => {
    const y = 0.07 - i * 0.07;
    const bez = new THREE.Mesh(new THREE.TorusGeometry(0.013, 0.004, 8, 20), MAT.chrome); bez.position.set(-1.18, y, Z + 0.003); panel.add(bez);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.011, 16, 10), new THREE.MeshBasicMaterial({ color: 0x111111, toneMapped: false })); lamp.position.set(-1.18, y, Z + 0.004); panel.add(lamp);
    CONSOLE.lamps[k] = { mesh: lamp, on: new THREE.Color(col).multiplyScalar(3), off: new THREE.Color(0x1a1a1a) };
  });
  // 당기는 힘 슬라이더 2개 (끌기대 왼쪽·오른쪽 저울)
  const mkSlider = (y, col, txt) => {
    const sl = ledSlider({ length: 0.5, n: 24, color: col }); sl.group.position.set(-0.8, y, Z + 0.004); panel.add(sl.group);
    const lab = engravedPlate(txt, 0.34, 0.024, { size: 0.55, screws: false }); lab.position.set(-0.8, y - 0.052, Z + 0.002); panel.add(lab);
    return sl;
  };
  CONSOLE.sF1 = mkSlider(0.085, 0xc4b5fd, en ? 'LEFT PULL  F1 · 0–6 N' : '왼쪽 당김  F1 · 0–6 N');
  CONSOLE.sF2 = mkSlider(-0.04, 0xc4b5fd, en ? 'RIGHT PULL  F2 · 0–6 N' : '오른쪽 당김  F2 · 0–6 N');
  // 다이얼 2개: 행성(중력 가속도), 수조 높이
  const P = PHYS.PLANETS, gf = (g) => (g - PHYS.C.gMin) / (PHYS.C.gMax - PHYS.C.gMin);
  const pn = en ? { moon: 'Moon', mars: 'Mars', earth: 'Earth' } : { moon: '달', mars: '화성', earth: '지구' };
  const dG = knobWithArc({ radius: 0.052, color: 0xffb36b, label: en ? 'GRAVITY g' : '중력 가속도 g', ticks: P.map((p) => [gf(p.g), pn[p.id]]) });
  dG.group.position.set(-0.17, -0.005, Z); panel.add(dG.group); CONSOLE.dialG = dG;
  const dJ = knobWithArc({ radius: 0.052, color: 0x7dd3fc, label: en ? 'TANK HEIGHT' : '수조 높이', ticks: [[0, '0'], [0.5, '14'], [1, '28 cm']] });
  dJ.group.position.set(0.11, -0.005, Z); panel.add(dJ.group); CONSOLE.dialJ = dJ;
  // 그래프 화면 2개
  const sA = graphScreen(0.5, 0.27, drawScreenA); sA.group.position.set(0.74, -0.02, Z + 0.006); panel.add(sA.group); CONSOLE.screenA = sA;
  const sB = graphScreen(0.5, 0.27, drawScreenB); sB.group.position.set(1.27, -0.02, Z + 0.006); panel.add(sB.group); CONSOLE.screenB = sB;
  const aLab = engravedPlate(en ? 'FORCE LEDGER' : '힘 장부 · 받는 힘', 0.3, 0.022, { size: 0.55, screws: false }); aLab.position.set(0.74, -0.185, Z + 0.002); panel.add(aLab);
  const bLab2 = engravedPlate(en ? 'RECORD GRAPH' : '기록 그래프', 0.3, 0.022, { size: 0.55, screws: false }); bLab2.position.set(1.27, -0.185, Z + 0.002); panel.add(bLab2);
  shadowify(desk, true, true);
  occluder(desk);
}
function workMatTexture() {
  return canvasTex(1024, 320, (c, W, H) => {
    c.fillStyle = '#2b3330'; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(180,210,200,0.10)'; c.lineWidth = 1;
    for (let x = 0; x < W; x += 16) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
    for (let y = 0; y < H; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    c.strokeStyle = 'rgba(180,210,200,0.22)';
    for (let x = 0; x < W; x += 80) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
    for (let y = 0; y < H; y += 80) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    c.font = font('mono', 14); c.fillStyle = 'rgba(200,230,220,0.35)';
    for (let x = 80; x < W; x += 160) c.fillText(`${x / 8}`, x + 3, 14);
  });
}
